"""
Helio L1 Legal Language Model Package
Neural Arc Inc - neuralarc.ai

A specialized 70B parameter legal language model for multi-jurisdictional legal analysis.
Supports US, UK, India, UAE, and Australia legal systems.
"""

from .helio_l1_model import HelioL1Model, HelioL1Config
from .legal_tokenizer import LegalTokenizer
from .legal_reasoning import LegalReasoningModule
from .citation_processor import CitationProcessor

__version__ = "1.0.0"
__author__ = "Neural Arc Inc"
__email__ = "contact@neuralarc.ai"

__all__ = [
    "HelioL1Model",
    "HelioL1Config", 
    "LegalTokenizer",
    "LegalReasoningModule",
    "CitationProcessor"
]

