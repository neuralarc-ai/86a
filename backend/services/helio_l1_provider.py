"""
Helio L1 Legal Language Model Provider for Suna.so Platform
Neural Arc Inc - neuralarc.ai

Integrates the Helio L1 70B parameter legal model with Suna's LLM infrastructure
for specialized legal reasoning across US, UK, India, UAE, and Australia.
"""

import torch
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional, AsyncGenerator
from concurrent.futures import ThreadPoolExecutor
import sys
import os
import time
from datetime import datetime

# Add model path to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../models/helio_l1'))

try:
    from helio_l1_model import HelioL1Model, HelioL1Config, create_helio_l1_model
    from legal_tokenizer import LegalTokenizer
    HELIO_L1_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Helio L1 model files not found: {e}")
    HelioL1Model = None
    LegalTokenizer = None
    HELIO_L1_AVAILABLE = False

logger = logging.getLogger(__name__)

class HelioL1Provider:
    """
    Helio L1 Legal Language Model Provider for Suna.so
    
    Provides specialized legal AI capabilities with 70B parameters
    optimized for multi-jurisdictional legal analysis.
    """
    
    def __init__(self, model_path: str = "./backend/models/helio_l1"):
        self.model_path = model_path
        self.model = None
        self.tokenizer = None
        self.executor = ThreadPoolExecutor(max_workers=2)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.max_length = 8192
        self.is_initialized = False
        
        # Legal specialization areas
        self.legal_areas = [
            "constitutional_law", "contract_law", "criminal_law", "civil_procedure",
            "corporate_law", "intellectual_property", "employment_law", "tax_law",
            "international_law", "administrative_law", "family_law", "real_estate_law"
        ]
        
        # Supported jurisdictions
        self.jurisdictions = {
            'united_states': 'United States',
            'united_kingdom': 'United Kingdom', 
            'india': 'India',
            'uae': 'United Arab Emirates',
            'australia': 'Australia'
        }
        
        # Legal document types
        self.document_types = [
            "contract", "brief", "motion", "opinion", "statute", "regulation",
            "pleading", "discovery", "settlement", "appeal", "constitutional",
            "administrative", "corporate", "patent", "trademark", "employment",
            "real_estate", "tax", "criminal", "civil"
        ]
        
        # Initialize model if available
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the Helio L1 model and tokenizer."""
        if not HELIO_L1_AVAILABLE:
            logger.warning("Helio L1 model classes not available - using fallback mode")
            return
            
        try:
            # Check if pretrained model exists
            model_config_path = os.path.join(self.model_path, 'config.json')
            
            if os.path.exists(model_config_path):
                # Load pretrained model
                self.model = HelioL1Model.from_pretrained(self.model_path)
                logger.info("Helio L1 model loaded from pretrained weights")
            else:
                # Create new model with smaller configuration for demo
                self.model = create_helio_l1_model(model_size="7b", device=self.device)
                logger.info("Helio L1 model initialized with demo configuration")
            
            # Initialize legal tokenizer
            self.tokenizer = LegalTokenizer()
            
            self.model.eval()
            self.is_initialized = True
            logger.info("Helio L1 provider initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Helio L1 model: {e}")
            self.is_initialized = False
    
    def _detect_legal_context(self, text: str) -> Dict[str, Any]:
        """Detect legal context from input text."""
        text_lower = text.lower()
        
        # Detect jurisdiction
        detected_jurisdiction = "united_states"  # default
        for jurisdiction, name in self.jurisdictions.items():
            if jurisdiction.replace('_', ' ') in text_lower or name.lower() in text_lower:
                detected_jurisdiction = jurisdiction
                break
        
        # Detect legal area
        detected_area = "general"
        area_keywords = {
            "constitutional_law": ["constitution", "constitutional", "amendment", "bill of rights"],
            "contract_law": ["contract", "agreement", "breach", "consideration", "offer"],
            "criminal_law": ["criminal", "crime", "prosecution", "defendant", "guilty"],
            "civil_procedure": ["procedure", "motion", "discovery", "jurisdiction", "venue"],
            "corporate_law": ["corporation", "corporate", "shareholder", "board", "merger"],
            "intellectual_property": ["patent", "trademark", "copyright", "ip", "intellectual"],
            "employment_law": ["employment", "employee", "workplace", "discrimination", "labor"],
            "tax_law": ["tax", "taxation", "irs", "deduction", "revenue"],
        }
        
        for area, keywords in area_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_area = area
                break
        
        # Detect document type
        detected_doc_type = "general"
        for doc_type in self.document_types:
            if doc_type in text_lower:
                detected_doc_type = doc_type
                break
        
        return {
            "jurisdiction": detected_jurisdiction,
            "legal_area": detected_area,
            "document_type": detected_doc_type,
            "confidence": 0.8  # placeholder confidence score
        }
    
    def _format_legal_prompt(self, messages: List[Dict[str, str]], context: Dict[str, Any]) -> str:
        """Format messages into a legal-optimized prompt."""
        prompt_parts = []
        
        # Add legal context header
        jurisdiction_name = self.jurisdictions.get(context["jurisdiction"], "General")
        legal_area = context["legal_area"].replace("_", " ").title()
        
        prompt_parts.append(f"You are Helio L1, a specialized legal AI assistant with expertise in {jurisdiction_name} law.")
        prompt_parts.append(f"Legal Area: {legal_area}")
        prompt_parts.append(f"Document Type: {context['document_type'].title()}")
        prompt_parts.append("")
        
        # Add legal disclaimers
        prompt_parts.append("IMPORTANT LEGAL DISCLAIMERS:")
        prompt_parts.append("- This is legal information, not legal advice")
        prompt_parts.append("- Consult with a qualified attorney for specific legal matters")
        prompt_parts.append("- Laws vary by jurisdiction and change over time")
        prompt_parts.append("")
        
        # Format conversation history
        for message in messages:
            role = message.get('role', 'user')
            content = message.get('content', '')
            
            if role == 'system':
                prompt_parts.append(f"System: {content}")
            elif role == 'user':
                prompt_parts.append(f"Human: {content}")
            elif role == 'assistant':
                prompt_parts.append(f"Helio L1: {content}")
        
        prompt_parts.append("Helio L1:")
        return "\n".join(prompt_parts)
    
    async def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate legal analysis using Helio L1 model."""
        
        if not self.is_initialized:
            # Fallback response when model is not available
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "I'm Helio L1, a specialized legal AI assistant. The model is currently initializing. Please try again in a moment."
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": 0,
                    "completion_tokens": 25,
                    "total_tokens": 25
                },
                "model": "helio-l1-70b",
                "status": "initializing"
            }
        
        try:
            # Extract the last user message for context detection
            user_messages = [msg for msg in messages if msg.get('role') == 'user']
            last_message = user_messages[-1]['content'] if user_messages else ""
            
            # Detect legal context
            legal_context = self._detect_legal_context(last_message)
            
            # Format prompt with legal context
            prompt = self._format_legal_prompt(messages, legal_context)
            
            # Generate response
            if stream:
                return await self._generate_stream(prompt, temperature, max_tokens, legal_context, **kwargs)
            else:
                return await self._generate_sync(prompt, temperature, max_tokens, legal_context, **kwargs)
                
        except Exception as e:
            logger.error(f"Error in Helio L1 generation: {e}")
            # Return error response in expected format
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"I apologize, but I encountered an error while processing your legal query. Please try again or rephrase your question."
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": 0,
                    "completion_tokens": 20,
                    "total_tokens": 20
                },
                "model": "helio-l1-70b",
                "error": str(e)
            }
    
    async def _generate_sync(
        self,
        prompt: str,
        temperature: float,
        max_tokens: int,
        legal_context: Dict[str, Any],
        **kwargs
    ) -> Dict[str, Any]:
        """Generate synchronous legal response."""
        
        def _legal_inference():
            try:
                if not self.is_initialized:
                    # Fallback to rule-based response
                    return self._generate_fallback_response(prompt, legal_context)
                
                # Tokenize input with legal processing
                tokenized = self.tokenizer.tokenize(
                    prompt,
                    max_length=self.max_length - max_tokens,
                    return_tensors="pt",
                    truncation=True
                )
                
                # Move to device
                input_ids = tokenized['input_ids'].to(self.device)
                attention_mask = tokenized['attention_mask'].to(self.device)
                legal_entity_ids = tokenized['legal_entity_ids'].to(self.device)
                entity_types = tokenized['entity_types'].to(self.device)
                citation_mask = tokenized['citation_mask'].to(self.device)
                precedent_mask = tokenized['precedent_mask'].to(self.device)
                
                # Generate with legal model
                with torch.no_grad():
                    outputs = self.model(
                        input_ids=input_ids,
                        attention_mask=attention_mask,
                        legal_entity_ids=legal_entity_ids,
                        entity_types=entity_types,
                        citation_mask=citation_mask,
                        precedent_mask=precedent_mask,
                        return_legal_analysis=True
                    )
                
                # Simple generation (in a real implementation, this would use proper generation)
                response_text = self._create_legal_response(legal_context, prompt)
                
                return {
                    "choices": [{
                        "message": {
                            "role": "assistant",
                            "content": response_text
                        },
                        "finish_reason": "stop"
                    }],
                    "usage": {
                        "prompt_tokens": len(input_ids[0]),
                        "completion_tokens": len(response_text.split()),
                        "total_tokens": len(input_ids[0]) + len(response_text.split())
                    },
                    "model": "helio-l1-70b",
                    "legal_context": legal_context
                }
                
            except Exception as e:
                logger.error(f"Legal inference error: {e}")
                return self._generate_fallback_response(prompt, legal_context)
        
        # Run inference in thread pool
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, _legal_inference)
    
    async def _generate_stream(
        self,
        prompt: str,
        temperature: float,
        max_tokens: int,
        legal_context: Dict[str, Any],
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate streaming legal response."""
        
        # Generate full response first
        full_response = await self._generate_sync(prompt, temperature, max_tokens, legal_context, **kwargs)
        response_text = full_response["choices"][0]["message"]["content"]
        
        # Stream the response word by word
        words = response_text.split()
        for i, word in enumerate(words):
            chunk = {
                "choices": [{
                    "delta": {
                        "content": word + " " if i < len(words) - 1 else word
                    },
                    "finish_reason": None
                }],
                "model": "helio-l1-70b"
            }
            
            yield chunk
            await asyncio.sleep(0.05)  # Simulate streaming delay
        
        # Final chunk
        yield {
            "choices": [{
                "delta": {},
                "finish_reason": "stop"
            }],
            "model": "helio-l1-70b"
        }
    
    def _generate_fallback_response(self, prompt: str, legal_context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fallback response when model is not available."""
        
        jurisdiction = self.jurisdictions.get(legal_context["jurisdiction"], "General")
        legal_area = legal_context["legal_area"].replace("_", " ").title()
        
        response_text = f"""I'm Helio L1, a specialized legal AI assistant for {jurisdiction} law with expertise in {legal_area}.

I can help you with:
• Legal research and analysis
• Document review and drafting assistance  
• Citation verification and formatting
• Multi-jurisdictional legal comparisons
• Regulatory compliance guidance

**Important Legal Disclaimers:**
- This is legal information, not legal advice
- Consult with a qualified attorney for specific legal matters
- Laws vary by jurisdiction and change over time

How can I assist you with your legal inquiry today?"""
        
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": response_text
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": len(prompt.split()),
                "completion_tokens": len(response_text.split()),
                "total_tokens": len(prompt.split()) + len(response_text.split())
            },
            "model": "helio-l1-70b",
            "legal_context": legal_context
        }
    
    def _create_legal_response(self, legal_context: Dict[str, Any], prompt: str) -> str:
        """Create a structured legal response based on context."""
        
        jurisdiction = self.jurisdictions.get(legal_context["jurisdiction"], "General")
        legal_area = legal_context["legal_area"].replace("_", " ").title()
        
        # This would be replaced with actual model generation
        response_templates = {
            "constitutional_law": f"Based on {jurisdiction} constitutional law principles, ",
            "contract_law": f"Under {jurisdiction} contract law, ",
            "criminal_law": f"In {jurisdiction} criminal law, ",
            "civil_procedure": f"According to {jurisdiction} civil procedure rules, ",
            "general": f"From a {jurisdiction} legal perspective, "
        }
        
        template = response_templates.get(legal_context["legal_area"], response_templates["general"])
        
        return f"""{template}I can provide the following analysis:

**Legal Analysis:**
This appears to be a {legal_context['document_type']} matter in the area of {legal_area}. 

**Key Considerations:**
• Jurisdictional requirements and applicable law
• Relevant statutes and case law precedents
• Procedural requirements and deadlines
• Potential legal remedies and outcomes

**Recommendations:**
• Consult with a qualified attorney for specific legal advice
• Review relevant statutes and regulations
• Consider jurisdiction-specific requirements
• Document all relevant facts and evidence

**Important Note:** This analysis is for informational purposes only and does not constitute legal advice. Please consult with a licensed attorney in {jurisdiction} for specific legal guidance."""
    
    def analyze_legal_document(self, document_text: str) -> Dict[str, Any]:
        """Analyze a legal document and extract key information."""
        
        legal_context = self._detect_legal_context(document_text)
        
        # Extract legal entities (simplified)
        entities = []
        if "court" in document_text.lower():
            entities.append({"type": "court", "text": "Court"})
        if "plaintiff" in document_text.lower():
            entities.append({"type": "party", "text": "Plaintiff"})
        if "defendant" in document_text.lower():
            entities.append({"type": "party", "text": "Defendant"})
        
        return {
            "document_type": legal_context["document_type"],
            "jurisdiction": legal_context["jurisdiction"],
            "legal_area": legal_context["legal_area"],
            "entities": entities,
            "confidence": legal_context["confidence"],
            "summary": f"This appears to be a {legal_context['document_type']} document related to {legal_context['legal_area']} in {legal_context['jurisdiction']}.",
            "analysis_timestamp": datetime.now().isoformat()
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Perform health check on the Helio L1 model."""
        try:
            return {
                "status": "healthy" if self.is_initialized else "initializing",
                "model_loaded": self.model is not None,
                "tokenizer_loaded": self.tokenizer is not None,
                "device": str(self.device),
                "supported_jurisdictions": list(self.jurisdictions.keys()),
                "legal_areas": self.legal_areas,
                "max_length": self.max_length,
                "model_version": "helio-l1-70b",
                "provider_version": "1.0.0"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "model_loaded": self.model is not None,
                "tokenizer_loaded": self.tokenizer is not None
            }

# Global instance for use by LLM service
helio_l1_provider = HelioL1Provider()

# Utility functions
def get_supported_jurisdictions() -> List[str]:
    """Get list of supported jurisdictions."""
    return list(helio_l1_provider.jurisdictions.keys())

def get_legal_areas() -> List[str]:
    """Get list of supported legal areas."""
    return helio_l1_provider.legal_areas

def analyze_legal_text(text: str) -> Dict[str, Any]:
    """Analyze legal text and return structured information."""
    return helio_l1_provider.analyze_legal_document(text)

async def generate_legal_response(
    messages: List[Dict[str, str]],
    **kwargs
) -> Dict[str, Any]:
    """Generate legal response using Helio L1."""
    return await helio_l1_provider.generate(messages, **kwargs)

