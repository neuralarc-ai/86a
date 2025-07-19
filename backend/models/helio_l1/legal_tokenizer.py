"""
Legal Tokenizer for Helio L1
Neural Arc Inc - neuralarc.ai

Specialized tokenizer for legal text processing with support for
legal citations, case names, and jurisdiction-specific terminology.
"""

import re
import json
import logging
from typing import Dict, List, Optional, Tuple, Any, Union
from transformers import LlamaTokenizer
import torch
from pathlib import Path

logger = logging.getLogger(__name__)

class LegalTokenizer:
    """
    Specialized tokenizer for legal text processing.
    
    Handles legal citations, case names, statutory references,
    and jurisdiction-specific legal terminology.
    """
    
    def __init__(self, base_tokenizer_path: str = "meta-llama/Llama-2-7b-hf"):
        """Initialize the legal tokenizer."""
        
        # Load base tokenizer
        self.base_tokenizer = LlamaTokenizer.from_pretrained(base_tokenizer_path)
        
        # Legal-specific patterns
        self.legal_patterns = self._init_legal_patterns()
        
        # Legal entity vocabulary
        self.legal_entities = self._init_legal_entities()
        
        # Citation patterns
        self.citation_patterns = self._init_citation_patterns()
        
        # Jurisdiction-specific terms
        self.jurisdiction_terms = self._init_jurisdiction_terms()
        
        # Special tokens for legal processing
        self.special_tokens = {
            "[CITATION]": 128001,
            "[CASE_NAME]": 128002,
            "[STATUTE]": 128003,
            "[REGULATION]": 128004,
            "[COURT]": 128005,
            "[JURISDICTION]": 128006,
            "[LEGAL_ENTITY]": 128007,
            "[PRECEDENT]": 128008,
            "[HOLDING]": 128009,
            "[DICTA]": 128010,
        }
        
        # Add special tokens to base tokenizer
        self.base_tokenizer.add_special_tokens({
            "additional_special_tokens": list(self.special_tokens.keys())
        })
    
    def _init_legal_patterns(self) -> Dict[str, re.Pattern]:
        """Initialize legal text patterns."""
        return {
            # US Citations
            "us_case": re.compile(r'\b\d+\s+[A-Z][a-z]*\.?\s*\d+d?\s*\d+\b'),
            "us_statute": re.compile(r'\b\d+\s+U\.S\.C\.?\s*§?\s*\d+\b'),
            "us_cfr": re.compile(r'\b\d+\s+C\.F\.R\.?\s*§?\s*\d+\b'),
            
            # UK Citations
            "uk_case": re.compile(r'\[\d{4}\]\s+[A-Z]+\s+\d+'),
            "uk_statute": re.compile(r'\b[A-Z][a-z\s]+Act\s+\d{4}\b'),
            
            # Indian Citations
            "indian_case": re.compile(r'\(\d{4}\)\s+\d+\s+[A-Z]+\s+\d+'),
            "indian_statute": re.compile(r'\b[A-Z][a-z\s]+Act,?\s+\d{4}\b'),
            
            # Australian Citations
            "aus_case": re.compile(r'\[\d{4}\]\s+[A-Z]+\s+\d+'),
            "aus_statute": re.compile(r'\b[A-Z][a-z\s]+Act\s+\d{4}\s+\([A-Z]+\)\b'),
            
            # UAE Citations (Arabic and English)
            "uae_law": re.compile(r'\bFederal Law No\.?\s*\d+\s*of\s*\d{4}\b'),
            
            # General patterns
            "court_name": re.compile(r'\b(?:Supreme|High|District|Circuit|Appeals?|Magistrates?)\s+Court\b'),
            "judge_name": re.compile(r'\bJustice\s+[A-Z][a-z]+\b|\bJ\.\s*[A-Z][a-z]+\b'),
            "legal_concept": re.compile(r'\b(?:due process|equal protection|reasonable doubt|burden of proof)\b'),
        }
    
    def _init_legal_entities(self) -> Dict[str, List[str]]:
        """Initialize legal entity vocabulary."""
        return {
            "courts": [
                "Supreme Court", "Court of Appeals", "District Court", "High Court",
                "Federal Court", "State Court", "Magistrates Court", "Crown Court",
                "Constitutional Court", "Administrative Court"
            ],
            "legal_concepts": [
                "due process", "equal protection", "reasonable doubt", "burden of proof",
                "mens rea", "actus reus", "res judicata", "stare decisis", "habeas corpus",
                "prima facie", "ultra vires", "bona fide", "in rem", "in personam"
            ],
            "document_types": [
                "complaint", "answer", "motion", "brief", "opinion", "order", "judgment",
                "contract", "agreement", "statute", "regulation", "constitution",
                "pleading", "discovery", "deposition", "affidavit", "subpoena"
            ],
            "legal_roles": [
                "plaintiff", "defendant", "appellant", "appellee", "petitioner",
                "respondent", "prosecutor", "attorney", "counsel", "judge", "justice",
                "magistrate", "clerk", "bailiff", "jury", "witness"
            ]
        }
    
    def _init_citation_patterns(self) -> Dict[str, Dict[str, re.Pattern]]:
        """Initialize citation patterns by jurisdiction."""
        return {
            "united_states": {
                "case": re.compile(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+v\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+(\d+)\s+([A-Z][a-z]*\.?)\s*(\d+d?)\s*(\d+)\s*\((\d{4})\)'),
                "statute": re.compile(r'\b(\d+)\s+U\.S\.C\.?\s*§?\s*(\d+(?:\([a-z]\))?)\b'),
                "regulation": re.compile(r'\b(\d+)\s+C\.F\.R\.?\s*§?\s*(\d+(?:\.\d+)*)\b'),
                "constitution": re.compile(r'\bU\.S\.?\s*Const\.?\s*(?:art\.?\s*([IVX]+))?(?:,?\s*§?\s*(\d+))?(?:,?\s*cl\.?\s*(\d+))?\b')
            },
            "united_kingdom": {
                "case": re.compile(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+v\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\[(\d{4})\]\s+([A-Z]+)\s+(\d+)'),
                "statute": re.compile(r'\b([A-Z][a-z\s]+Act)\s+(\d{4})\b'),
                "statutory_instrument": re.compile(r'\bS\.I\.?\s+(\d{4})/(\d+)\b')
            },
            "india": {
                "case": re.compile(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+v\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\((\d{4})\)\s+(\d+)\s+([A-Z]+)\s+(\d+)'),
                "statute": re.compile(r'\b([A-Z][a-z\s]+Act),?\s+(\d{4})\b'),
                "constitution": re.compile(r'\bArt\.?\s*(\d+(?:\([a-z]\))?)\s*(?:of\s+)?(?:the\s+)?Constitution\b')
            },
            "australia": {
                "case": re.compile(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+v\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\[(\d{4})\]\s+([A-Z]+)\s+(\d+)'),
                "statute": re.compile(r'\b([A-Z][a-z\s]+Act)\s+(\d{4})\s+\(([A-Z]+)\)\b'),
                "constitution": re.compile(r'\bCommonwealth\s+Constitution\s*(?:s\.?\s*(\d+))?\b')
            },
            "uae": {
                "federal_law": re.compile(r'\bFederal Law No\.?\s*(\d+)\s*of\s*(\d{4})\b'),
                "local_law": re.compile(r'\b([A-Z][a-z]+)\s+Law No\.?\s*(\d+)\s*of\s*(\d{4})\b'),
                "constitution": re.compile(r'\bConstitution\s*(?:Art\.?\s*(\d+))?\b')
            }
        }
    
    def _init_jurisdiction_terms(self) -> Dict[str, List[str]]:
        """Initialize jurisdiction-specific terminology."""
        return {
            "united_states": [
                "federal", "state", "circuit", "district", "supreme court",
                "court of appeals", "due process", "equal protection", "commerce clause"
            ],
            "united_kingdom": [
                "crown", "parliament", "house of lords", "house of commons",
                "privy council", "statutory instrument", "common law", "equity"
            ],
            "india": [
                "supreme court", "high court", "fundamental rights", "directive principles",
                "parliament", "lok sabha", "rajya sabha", "constitution bench"
            ],
            "australia": [
                "high court", "federal court", "commonwealth", "state", "territory",
                "constitution", "crown", "governor-general"
            ],
            "uae": [
                "federal", "emirate", "sharia", "civil law", "federal supreme court",
                "constitution", "federal national council", "islamic law"
            ]
        }
    
    def tokenize(
        self, 
        text: str, 
        add_special_tokens: bool = True,
        return_tensors: Optional[str] = None,
        max_length: Optional[int] = None,
        padding: bool = False,
        truncation: bool = False
    ) -> Dict[str, Any]:
        """
        Tokenize legal text with special handling for legal entities.
        
        Args:
            text: Input legal text
            add_special_tokens: Whether to add special tokens
            return_tensors: Format of returned tensors
            max_length: Maximum sequence length
            padding: Whether to pad sequences
            truncation: Whether to truncate sequences
            
        Returns:
            Dictionary containing tokenized inputs
        """
        
        # Preprocess text to identify legal entities
        processed_text, entity_info = self._preprocess_legal_text(text)
        
        # Tokenize with base tokenizer
        tokenized = self.base_tokenizer(
            processed_text,
            add_special_tokens=add_special_tokens,
            return_tensors=return_tensors,
            max_length=max_length,
            padding=padding,
            truncation=truncation,
            return_attention_mask=True,
            return_token_type_ids=False
        )
        
        # Add legal-specific information
        tokenized['legal_entity_ids'] = self._create_entity_ids(entity_info, len(tokenized['input_ids'][0]))
        tokenized['entity_types'] = self._create_entity_types(entity_info, len(tokenized['input_ids'][0]))
        tokenized['citation_mask'] = self._create_citation_mask(entity_info, len(tokenized['input_ids'][0]))
        tokenized['precedent_mask'] = self._create_precedent_mask(entity_info, len(tokenized['input_ids'][0]))
        
        return tokenized
    
    def _preprocess_legal_text(self, text: str) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Preprocess legal text to identify and mark legal entities.
        
        Args:
            text: Input legal text
            
        Returns:
            Tuple of (processed_text, entity_information)
        """
        
        entity_info = []
        processed_text = text
        
        # Find citations
        for jurisdiction, patterns in self.citation_patterns.items():
            for citation_type, pattern in patterns.items():
                for match in pattern.finditer(text):
                    entity_info.append({
                        'type': 'citation',
                        'subtype': citation_type,
                        'jurisdiction': jurisdiction,
                        'start': match.start(),
                        'end': match.end(),
                        'text': match.group(),
                        'groups': match.groups()
                    })
        
        # Find legal entities
        for entity_type, entities in self.legal_entities.items():
            for entity in entities:
                pattern = re.compile(r'\b' + re.escape(entity) + r'\b', re.IGNORECASE)
                for match in pattern.finditer(text):
                    entity_info.append({
                        'type': 'legal_entity',
                        'subtype': entity_type,
                        'start': match.start(),
                        'end': match.end(),
                        'text': match.group(),
                        'entity': entity
                    })
        
        # Sort entities by position
        entity_info.sort(key=lambda x: x['start'])
        
        # Mark entities in text with special tokens
        offset = 0
        for entity in entity_info:
            start = entity['start'] + offset
            end = entity['end'] + offset
            
            if entity['type'] == 'citation':
                marker = "[CITATION]"
            elif entity['type'] == 'legal_entity':
                marker = "[LEGAL_ENTITY]"
            else:
                marker = "[LEGAL_ENTITY]"
            
            # Insert marker before entity
            processed_text = processed_text[:start] + marker + " " + processed_text[start:]
            offset += len(marker) + 1
            
            # Update entity positions
            entity['marked_start'] = start
            entity['marked_end'] = end + len(marker) + 1
        
        return processed_text, entity_info
    
    def _create_entity_ids(self, entity_info: List[Dict[str, Any]], seq_length: int) -> torch.Tensor:
        """Create entity ID tensor for legal entity embeddings."""
        entity_ids = torch.zeros(seq_length, dtype=torch.long)
        
        # This would map entities to IDs in a real implementation
        # For now, use placeholder values
        for i, entity in enumerate(entity_info):
            if i < seq_length:
                entity_ids[i] = hash(entity.get('entity', entity.get('text', ''))) % 50000
        
        return entity_ids
    
    def _create_entity_types(self, entity_info: List[Dict[str, Any]], seq_length: int) -> torch.Tensor:
        """Create entity type tensor."""
        entity_types = torch.zeros(seq_length, dtype=torch.long)
        
        type_mapping = {
            'citation': 1, 'legal_entity': 2, 'court': 3, 'statute': 4,
            'regulation': 5, 'case': 6, 'concept': 7, 'role': 8, 'document': 9
        }
        
        for i, entity in enumerate(entity_info):
            if i < seq_length:
                entity_type = entity.get('subtype', entity.get('type', 'legal_entity'))
                entity_types[i] = type_mapping.get(entity_type, 2)
        
        return entity_types
    
    def _create_citation_mask(self, entity_info: List[Dict[str, Any]], seq_length: int) -> torch.Tensor:
        """Create mask for citation tokens."""
        citation_mask = torch.zeros(seq_length, dtype=torch.bool)
        
        for i, entity in enumerate(entity_info):
            if i < seq_length and entity['type'] == 'citation':
                citation_mask[i] = True
        
        return citation_mask
    
    def _create_precedent_mask(self, entity_info: List[Dict[str, Any]], seq_length: int) -> torch.Tensor:
        """Create mask for precedent tokens."""
        precedent_mask = torch.zeros(seq_length, dtype=torch.bool)
        
        for i, entity in enumerate(entity_info):
            if i < seq_length and entity.get('subtype') == 'case':
                precedent_mask[i] = True
        
        return precedent_mask
    
    def decode(self, token_ids: Union[List[int], torch.Tensor], skip_special_tokens: bool = True) -> str:
        """Decode token IDs back to text."""
        return self.base_tokenizer.decode(token_ids, skip_special_tokens=skip_special_tokens)
    
    def encode(self, text: str, add_special_tokens: bool = True) -> List[int]:
        """Encode text to token IDs."""
        return self.base_tokenizer.encode(text, add_special_tokens=add_special_tokens)
    
    def get_vocab_size(self) -> int:
        """Get vocabulary size."""
        return len(self.base_tokenizer)
    
    def save_pretrained(self, save_directory: str):
        """Save tokenizer to directory."""
        save_path = Path(save_directory)
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Save base tokenizer
        self.base_tokenizer.save_pretrained(save_directory)
        
        # Save legal-specific components
        legal_components = {
            'legal_patterns': {k: v.pattern for k, v in self.legal_patterns.items()},
            'legal_entities': self.legal_entities,
            'citation_patterns': {
                jurisdiction: {k: v.pattern for k, v in patterns.items()}
                for jurisdiction, patterns in self.citation_patterns.items()
            },
            'jurisdiction_terms': self.jurisdiction_terms,
            'special_tokens': self.special_tokens
        }
        
        with open(save_path / "legal_components.json", "w") as f:
            json.dump(legal_components, f, indent=2)
        
        logger.info(f"Legal tokenizer saved to {save_directory}")
    
    @classmethod
    def from_pretrained(cls, tokenizer_directory: str):
        """Load tokenizer from directory."""
        tokenizer = cls()
        
        # Load base tokenizer
        tokenizer.base_tokenizer = LlamaTokenizer.from_pretrained(tokenizer_directory)
        
        # Load legal components
        legal_components_path = Path(tokenizer_directory) / "legal_components.json"
        if legal_components_path.exists():
            with open(legal_components_path, "r") as f:
                legal_components = json.load(f)
            
            # Reconstruct regex patterns
            tokenizer.legal_patterns = {
                k: re.compile(v) for k, v in legal_components['legal_patterns'].items()
            }
            
            tokenizer.citation_patterns = {
                jurisdiction: {k: re.compile(v) for k, v in patterns.items()}
                for jurisdiction, patterns in legal_components['citation_patterns'].items()
            }
            
            tokenizer.legal_entities = legal_components['legal_entities']
            tokenizer.jurisdiction_terms = legal_components['jurisdiction_terms']
            tokenizer.special_tokens = legal_components['special_tokens']
        
        logger.info(f"Legal tokenizer loaded from {tokenizer_directory}")
        return tokenizer

# Utility functions
def create_legal_tokenizer(base_model: str = "meta-llama/Llama-2-7b-hf") -> LegalTokenizer:
    """Create a legal tokenizer with specified base model."""
    return LegalTokenizer(base_model)

def preprocess_legal_dataset(
    texts: List[str], 
    tokenizer: LegalTokenizer,
    max_length: int = 8192
) -> Dict[str, torch.Tensor]:
    """Preprocess a dataset of legal texts."""
    
    all_input_ids = []
    all_attention_masks = []
    all_entity_ids = []
    all_entity_types = []
    all_citation_masks = []
    all_precedent_masks = []
    
    for text in texts:
        tokenized = tokenizer.tokenize(
            text,
            max_length=max_length,
            padding=True,
            truncation=True,
            return_tensors="pt"
        )
        
        all_input_ids.append(tokenized['input_ids'])
        all_attention_masks.append(tokenized['attention_mask'])
        all_entity_ids.append(tokenized['legal_entity_ids'])
        all_entity_types.append(tokenized['entity_types'])
        all_citation_masks.append(tokenized['citation_mask'])
        all_precedent_masks.append(tokenized['precedent_mask'])
    
    return {
        'input_ids': torch.cat(all_input_ids, dim=0),
        'attention_mask': torch.cat(all_attention_masks, dim=0),
        'legal_entity_ids': torch.stack(all_entity_ids),
        'entity_types': torch.stack(all_entity_types),
        'citation_mask': torch.stack(all_citation_masks),
        'precedent_mask': torch.stack(all_precedent_masks)
    }

