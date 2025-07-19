"""
Helio L1 Legal Language Model Implementation
Neural Arc Inc - neuralarc.ai

A specialized legal language model with 70B parameters optimized for legal reasoning
across US, UK, India, UAE, and Australia jurisdictions.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import LlamaConfig, LlamaForCausalLM, LlamaTokenizer
from typing import Dict, List, Optional, Tuple, Any, Union
import json
import logging
from dataclasses import dataclass
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

@dataclass
class HelioL1Config:
    """Configuration for Helio L1 Legal Language Model."""
    
    # Base model configuration
    model_name: str = "helio-l1-70b"
    vocab_size: int = 128000
    hidden_size: int = 8192
    intermediate_size: int = 28672
    num_hidden_layers: int = 80
    num_attention_heads: int = 64
    num_key_value_heads: int = 8
    max_position_embeddings: int = 32768
    rope_theta: float = 500000.0
    
    # Legal-specific configuration
    legal_entity_vocab_size: int = 50000
    citation_embedding_dim: int = 512
    legal_reasoning_layers: int = 8
    precedent_attention_heads: int = 16
    
    # Supported jurisdictions
    jurisdictions: List[str] = None
    jurisdiction_weights: Dict[str, float] = None
    
    # Legal specialization areas
    legal_areas: List[str] = None
    
    def __post_init__(self):
        if self.jurisdictions is None:
            self.jurisdictions = ["united_states", "united_kingdom", "india", "uae", "australia"]
        
        if self.jurisdiction_weights is None:
            self.jurisdiction_weights = {
                "united_states": 0.3,
                "united_kingdom": 0.25,
                "india": 0.2,
                "uae": 0.1,
                "australia": 0.15
            }
        
        if self.legal_areas is None:
            self.legal_areas = [
                "constitutional_law", "contract_law", "criminal_law", 
                "civil_procedure", "corporate_law", "intellectual_property",
                "employment_law", "tax_law", "international_law"
            ]

class LegalEntityEmbedding(nn.Module):
    """Specialized embedding layer for legal entities and concepts."""
    
    def __init__(self, config: HelioL1Config):
        super().__init__()
        self.config = config
        self.entity_embeddings = nn.Embedding(
            config.legal_entity_vocab_size, 
            config.hidden_size
        )
        self.entity_type_embeddings = nn.Embedding(10, config.hidden_size)  # 10 entity types
        self.jurisdiction_embeddings = nn.Embedding(
            len(config.jurisdictions), 
            config.hidden_size
        )
        
    def forward(self, entity_ids, entity_types, jurisdictions):
        entity_emb = self.entity_embeddings(entity_ids)
        type_emb = self.entity_type_embeddings(entity_types)
        jurisdiction_emb = self.jurisdiction_embeddings(jurisdictions)
        
        return entity_emb + type_emb + jurisdiction_emb

class CitationAttention(nn.Module):
    """Specialized attention mechanism for legal citations and precedents."""
    
    def __init__(self, config: HelioL1Config):
        super().__init__()
        self.config = config
        self.num_heads = config.precedent_attention_heads
        self.head_dim = config.hidden_size // self.num_heads
        
        self.q_proj = nn.Linear(config.hidden_size, config.hidden_size)
        self.k_proj = nn.Linear(config.hidden_size, config.hidden_size)
        self.v_proj = nn.Linear(config.hidden_size, config.hidden_size)
        self.o_proj = nn.Linear(config.hidden_size, config.hidden_size)
        
        self.citation_weight = nn.Parameter(torch.ones(1))
        self.precedent_weight = nn.Parameter(torch.ones(1))
        
    def forward(self, hidden_states, citation_mask=None, precedent_mask=None):
        batch_size, seq_len, hidden_size = hidden_states.shape
        
        q = self.q_proj(hidden_states).view(batch_size, seq_len, self.num_heads, self.head_dim)
        k = self.k_proj(hidden_states).view(batch_size, seq_len, self.num_heads, self.head_dim)
        v = self.v_proj(hidden_states).view(batch_size, seq_len, self.num_heads, self.head_dim)
        
        q = q.transpose(1, 2)  # (batch, heads, seq_len, head_dim)
        k = k.transpose(1, 2)
        v = v.transpose(1, 2)
        
        # Compute attention scores
        scores = torch.matmul(q, k.transpose(-2, -1)) / (self.head_dim ** 0.5)
        
        # Apply citation and precedent weighting
        if citation_mask is not None:
            citation_boost = citation_mask.unsqueeze(1).unsqueeze(1) * self.citation_weight
            scores = scores + citation_boost
            
        if precedent_mask is not None:
            precedent_boost = precedent_mask.unsqueeze(1).unsqueeze(1) * self.precedent_weight
            scores = scores + precedent_boost
        
        attn_weights = F.softmax(scores, dim=-1)
        attn_output = torch.matmul(attn_weights, v)
        
        # Reshape and project
        attn_output = attn_output.transpose(1, 2).contiguous().view(
            batch_size, seq_len, hidden_size
        )
        
        return self.o_proj(attn_output)

class LegalReasoningLayer(nn.Module):
    """Specialized layer for legal reasoning and analysis."""
    
    def __init__(self, config: HelioL1Config):
        super().__init__()
        self.config = config
        
        # Multi-head attention for legal reasoning
        self.legal_attention = CitationAttention(config)
        
        # Feed-forward network for legal analysis
        self.legal_ffn = nn.Sequential(
            nn.Linear(config.hidden_size, config.intermediate_size),
            nn.GELU(),
            nn.Linear(config.intermediate_size, config.hidden_size),
            nn.Dropout(0.1)
        )
        
        # Layer normalization
        self.attention_norm = nn.LayerNorm(config.hidden_size)
        self.ffn_norm = nn.LayerNorm(config.hidden_size)
        
        # Legal concept classification head
        self.legal_classifier = nn.Linear(config.hidden_size, len(config.legal_areas))
        
        # Jurisdiction classifier
        self.jurisdiction_classifier = nn.Linear(config.hidden_size, len(config.jurisdictions))
        
    def forward(self, hidden_states, citation_mask=None, precedent_mask=None):
        # Legal attention
        attn_output = self.legal_attention(
            hidden_states, citation_mask, precedent_mask
        )
        hidden_states = self.attention_norm(hidden_states + attn_output)
        
        # Feed-forward
        ffn_output = self.legal_ffn(hidden_states)
        hidden_states = self.ffn_norm(hidden_states + ffn_output)
        
        # Legal classification outputs
        legal_logits = self.legal_classifier(hidden_states)
        jurisdiction_logits = self.jurisdiction_classifier(hidden_states)
        
        return hidden_states, legal_logits, jurisdiction_logits

class HelioL1Model(nn.Module):
    """
    Helio L1 Legal Language Model
    
    A specialized 70B parameter model for legal reasoning and analysis
    across multiple jurisdictions.
    """
    
    def __init__(self, config: HelioL1Config):
        super().__init__()
        self.config = config
        
        # Base language model (using LLaMA architecture as foundation)
        llama_config = LlamaConfig(
            vocab_size=config.vocab_size,
            hidden_size=config.hidden_size,
            intermediate_size=config.intermediate_size,
            num_hidden_layers=config.num_hidden_layers,
            num_attention_heads=config.num_attention_heads,
            num_key_value_heads=config.num_key_value_heads,
            max_position_embeddings=config.max_position_embeddings,
            rope_theta=config.rope_theta,
        )
        
        # Initialize base model
        self.base_model = LlamaForCausalLM(llama_config)
        
        # Legal-specific components
        self.legal_entity_embedding = LegalEntityEmbedding(config)
        
        # Legal reasoning layers
        self.legal_reasoning_layers = nn.ModuleList([
            LegalReasoningLayer(config) for _ in range(config.legal_reasoning_layers)
        ])
        
        # Citation processing
        self.citation_processor = nn.Sequential(
            nn.Linear(config.hidden_size, config.citation_embedding_dim),
            nn.GELU(),
            nn.Linear(config.citation_embedding_dim, config.hidden_size)
        )
        
        # Legal document type classifier
        self.document_type_classifier = nn.Linear(
            config.hidden_size, 
            20  # 20 different legal document types
        )
        
        # Legal confidence scorer
        self.confidence_scorer = nn.Sequential(
            nn.Linear(config.hidden_size, config.hidden_size // 2),
            nn.GELU(),
            nn.Linear(config.hidden_size // 2, 1),
            nn.Sigmoid()
        )
        
        # Initialize weights
        self.apply(self._init_weights)
        
    def _init_weights(self, module):
        """Initialize model weights."""
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
    
    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
        legal_entity_ids: Optional[torch.Tensor] = None,
        entity_types: Optional[torch.Tensor] = None,
        jurisdictions: Optional[torch.Tensor] = None,
        citation_mask: Optional[torch.Tensor] = None,
        precedent_mask: Optional[torch.Tensor] = None,
        labels: Optional[torch.Tensor] = None,
        return_legal_analysis: bool = True,
    ) -> Dict[str, torch.Tensor]:
        """
        Forward pass of Helio L1 model.
        
        Args:
            input_ids: Token IDs
            attention_mask: Attention mask
            legal_entity_ids: Legal entity IDs for specialized embedding
            entity_types: Types of legal entities
            jurisdictions: Jurisdiction IDs
            citation_mask: Mask for citation tokens
            precedent_mask: Mask for precedent tokens
            labels: Labels for language modeling loss
            return_legal_analysis: Whether to return legal analysis outputs
            
        Returns:
            Dictionary containing model outputs
        """
        
        # Base model forward pass
        base_outputs = self.base_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            labels=labels,
            output_hidden_states=True,
            return_dict=True
        )
        
        hidden_states = base_outputs.hidden_states[-1]  # Last layer hidden states
        
        # Legal entity embeddings (if provided)
        if legal_entity_ids is not None:
            legal_entity_emb = self.legal_entity_embedding(
                legal_entity_ids, entity_types, jurisdictions
            )
            # Add legal entity embeddings to hidden states
            hidden_states = hidden_states + legal_entity_emb
        
        # Legal reasoning layers
        legal_outputs = {}
        if return_legal_analysis:
            for i, legal_layer in enumerate(self.legal_reasoning_layers):
                hidden_states, legal_logits, jurisdiction_logits = legal_layer(
                    hidden_states, citation_mask, precedent_mask
                )
                legal_outputs[f'legal_logits_layer_{i}'] = legal_logits
                legal_outputs[f'jurisdiction_logits_layer_{i}'] = jurisdiction_logits
        
        # Citation processing
        citation_features = self.citation_processor(hidden_states)
        
        # Document type classification
        doc_type_logits = self.document_type_classifier(hidden_states.mean(dim=1))
        
        # Confidence scoring
        confidence_scores = self.confidence_scorer(hidden_states)
        
        # Prepare outputs
        outputs = {
            'logits': base_outputs.logits,
            'hidden_states': hidden_states,
            'citation_features': citation_features,
            'document_type_logits': doc_type_logits,
            'confidence_scores': confidence_scores,
            'loss': base_outputs.loss,
        }
        
        if return_legal_analysis:
            outputs.update(legal_outputs)
        
        return outputs
    
    def generate_legal_analysis(
        self,
        input_text: str,
        jurisdiction: str = "united_states",
        legal_area: str = "general",
        max_length: int = 2048,
        temperature: float = 0.7,
        top_p: float = 0.9,
    ) -> Dict[str, Any]:
        """
        Generate legal analysis for given input text.
        
        Args:
            input_text: Input legal text or question
            jurisdiction: Target jurisdiction
            legal_area: Area of law
            max_length: Maximum generation length
            temperature: Generation temperature
            top_p: Top-p sampling parameter
            
        Returns:
            Dictionary containing legal analysis
        """
        
        # This would be implemented with proper tokenization and generation
        # For now, return a structured response
        return {
            "analysis": f"Legal analysis for: {input_text}",
            "jurisdiction": jurisdiction,
            "legal_area": legal_area,
            "confidence": 0.85,
            "citations": [],
            "recommendations": []
        }
    
    def classify_document_type(self, input_ids: torch.Tensor) -> Dict[str, float]:
        """Classify the type of legal document."""
        with torch.no_grad():
            outputs = self.forward(input_ids, return_legal_analysis=False)
            doc_type_probs = F.softmax(outputs['document_type_logits'], dim=-1)
            
            document_types = [
                "contract", "brief", "motion", "opinion", "statute", 
                "regulation", "pleading", "discovery", "settlement", "appeal",
                "constitutional", "administrative", "corporate", "patent",
                "trademark", "employment", "real_estate", "tax", "criminal", "civil"
            ]
            
            return {
                doc_type: prob.item() 
                for doc_type, prob in zip(document_types, doc_type_probs[0])
            }
    
    def extract_legal_entities(self, input_ids: torch.Tensor) -> List[Dict[str, Any]]:
        """Extract legal entities from input text."""
        # This would implement proper legal NER
        # For now, return placeholder
        return [
            {"entity": "Supreme Court", "type": "court", "jurisdiction": "united_states"},
            {"entity": "42 U.S.C. § 1983", "type": "statute", "jurisdiction": "united_states"}
        ]
    
    def save_pretrained(self, save_directory: str):
        """Save the model to a directory."""
        save_path = Path(save_directory)
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Save model state dict
        torch.save(self.state_dict(), save_path / "pytorch_model.bin")
        
        # Save config
        config_dict = {
            "model_name": self.config.model_name,
            "vocab_size": self.config.vocab_size,
            "hidden_size": self.config.hidden_size,
            "num_hidden_layers": self.config.num_hidden_layers,
            "jurisdictions": self.config.jurisdictions,
            "legal_areas": self.config.legal_areas,
        }
        
        with open(save_path / "config.json", "w") as f:
            json.dump(config_dict, f, indent=2)
        
        logger.info(f"Model saved to {save_directory}")
    
    @classmethod
    def from_pretrained(cls, model_directory: str):
        """Load a pretrained model from directory."""
        model_path = Path(model_directory)
        
        # Load config
        with open(model_path / "config.json", "r") as f:
            config_dict = json.load(f)
        
        config = HelioL1Config(**config_dict)
        model = cls(config)
        
        # Load state dict
        state_dict = torch.load(model_path / "pytorch_model.bin", map_location="cpu")
        model.load_state_dict(state_dict)
        
        logger.info(f"Model loaded from {model_directory}")
        return model

# Utility functions for model usage
def create_helio_l1_model(
    model_size: str = "70b",
    device: str = "auto"
) -> HelioL1Model:
    """Create a Helio L1 model with specified configuration."""
    
    if model_size == "70b":
        config = HelioL1Config()
    elif model_size == "7b":
        # Smaller version for testing
        config = HelioL1Config(
            hidden_size=4096,
            intermediate_size=11008,
            num_hidden_layers=32,
            num_attention_heads=32,
            legal_reasoning_layers=4
        )
    else:
        raise ValueError(f"Unsupported model size: {model_size}")
    
    model = HelioL1Model(config)
    
    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"
    
    model = model.to(device)
    return model

def load_helio_l1_for_inference(
    model_path: str,
    device: str = "auto"
) -> HelioL1Model:
    """Load Helio L1 model for inference."""
    model = HelioL1Model.from_pretrained(model_path)
    
    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"
    
    model = model.to(device)
    model.eval()
    
    return model

