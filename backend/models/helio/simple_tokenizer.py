#!/usr/bin/env python3
"""
Simple Business-Focused Tokenizer for Helio Model
Optimized for business domain text processing
"""

import re
import json
from collections import Counter
from typing import List, Dict, Optional

class HelioTokenizer:
    """Simple tokenizer optimized for business text"""
    
    def __init__(self, vocab_size: int = 8000):
        self.vocab_size = vocab_size
        self.vocab = {}
        self.inverse_vocab = {}
        
        # Special tokens
        self.pad_token = "[PAD]"
        self.bos_token = "[BOS]"
        self.eos_token = "[EOS]"
        self.unk_token = "[UNK]"
        
        self.pad_token_id = 0
        self.bos_token_id = 1
        self.eos_token_id = 2
        self.unk_token_id = 3
        
        # Business-specific tokens
        self.business_tokens = [
            # HR terms
            "[HR]", "[EMPLOYEE]", "[MANAGER]", "[PERFORMANCE]", "[SALARY]", "[BENEFITS]",
            "[TRAINING]", "[POLICY]", "[COMPLIANCE]", "[RECRUITMENT]",
            
            # Legal terms
            "[LEGAL]", "[CONTRACT]", "[AGREEMENT]", "[CLAUSE]", "[LIABILITY]", "[TERMS]",
            "[CONDITIONS]", "[CONFIDENTIAL]", "[INTELLECTUAL_PROPERTY]", "[DISPUTE]",
            
            # Finance terms
            "[FINANCE]", "[REVENUE]", "[EXPENSE]", "[PROFIT]", "[BUDGET]", "[FORECAST]",
            "[INVESTMENT]", "[ASSET]", "[LIABILITY]", "[CASH_FLOW]",
            
            # Sales terms
            "[SALES]", "[CUSTOMER]", "[PROSPECT]", "[LEAD]", "[CONVERSION]", "[PIPELINE]",
            "[QUOTA]", "[COMMISSION]", "[TERRITORY]", "[ACCOUNT]",
            
            # Marketing terms
            "[MARKETING]", "[CAMPAIGN]", "[BRAND]", "[AUDIENCE]", "[ENGAGEMENT]", "[ROI]",
            "[CONVERSION_RATE]", "[ANALYTICS]", "[CONTENT]", "[SOCIAL_MEDIA]"
        ]
        
        self._build_initial_vocab()
    
    def _build_initial_vocab(self):
        """Build initial vocabulary with special and business tokens"""
        self.vocab = {
            self.pad_token: self.pad_token_id,
            self.bos_token: self.bos_token_id,
            self.eos_token: self.eos_token_id,
            self.unk_token: self.unk_token_id,
        }
        
        # Add business tokens
        for i, token in enumerate(self.business_tokens):
            self.vocab[token] = len(self.vocab)
        
        # Add common punctuation and symbols
        common_chars = list("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?;:()[]{}\"'-_@#$%&*+=/<>|\\~`")
        for char in common_chars:
            if char not in self.vocab:
                self.vocab[char] = len(self.vocab)
        
        # Build inverse vocabulary
        self.inverse_vocab = {v: k for k, v in self.vocab.items()}
    
    def train_on_text(self, texts: List[str]):
        """Train tokenizer on business text corpus"""
        # Simple word-level tokenization for business terms
        word_counts = Counter()
        
        for text in texts:
            # Preprocess text
            text = self._preprocess_text(text)
            words = self._tokenize_text(text)
            word_counts.update(words)
        
        # Add most common words to vocabulary
        remaining_slots = self.vocab_size - len(self.vocab)
        most_common = word_counts.most_common(remaining_slots)
        
        for word, count in most_common:
            if word not in self.vocab and len(self.vocab) < self.vocab_size:
                self.vocab[word] = len(self.vocab)
        
        # Update inverse vocabulary
        self.inverse_vocab = {v: k for k, v in self.vocab.items()}
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for business domain"""
        # Convert to lowercase
        text = text.lower()
        
        # Add spaces around punctuation
        text = re.sub(r'([.,!?;:()[\]{}"\'-])', r' \1 ', text)
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _tokenize_text(self, text: str) -> List[str]:
        """Simple tokenization"""
        return text.split()
    
    def encode(self, text: str, add_special_tokens: bool = True, return_tensors: Optional[str] = None) -> List[int]:
        """Encode text to token IDs"""
        text = self._preprocess_text(text)
        words = self._tokenize_text(text)
        
        token_ids = []
        
        if add_special_tokens:
            token_ids.append(self.bos_token_id)
        
        for word in words:
            if word in self.vocab:
                token_ids.append(self.vocab[word])
            else:
                token_ids.append(self.unk_token_id)
        
        if add_special_tokens:
            token_ids.append(self.eos_token_id)
        
        if return_tensors == 'pt':
            import torch
            return torch.tensor(token_ids).unsqueeze(0)
        
        return token_ids
    
    def decode(self, token_ids: List[int], skip_special_tokens: bool = True) -> str:
        """Decode token IDs to text"""
        if hasattr(token_ids, 'tolist'):  # Handle torch tensors
            token_ids = token_ids.tolist()
        
        tokens = []
        for token_id in token_ids:
            if token_id in self.inverse_vocab:
                token = self.inverse_vocab[token_id]
                if skip_special_tokens and token in [self.pad_token, self.bos_token, self.eos_token]:
                    continue
                tokens.append(token)
        
        return ' '.join(tokens)
    
    def save_vocabulary(self, path: str):
        """Save vocabulary to file"""
        with open(path, 'w') as f:
            json.dump(self.vocab, f, indent=2)
    
    def load_vocabulary(self, path: str):
        """Load vocabulary from file"""
        with open(path, 'r') as f:
            self.vocab = json.load(f)
        self.inverse_vocab = {v: k for k, v in self.vocab.items()}

def create_business_training_data():
    """Create sample business training data"""
    business_texts = [
        # HR examples
        "The employee performance review process includes quarterly assessments and annual evaluations.",
        "Our company benefits package includes health insurance, retirement plans, and professional development opportunities.",
        "The recruitment team is seeking qualified candidates for senior management positions.",
        "Training programs focus on leadership development and technical skill enhancement.",
        
        # Legal examples
        "The contract terms specify intellectual property rights and confidentiality obligations.",
        "Legal compliance requires adherence to industry regulations and corporate policies.",
        "The agreement includes liability limitations and dispute resolution procedures.",
        "Confidential information must be protected according to data privacy regulations.",
        
        # Finance examples
        "The quarterly financial report shows revenue growth and expense management improvements.",
        "Budget forecasting includes investment planning and cash flow projections.",
        "Asset management strategies focus on portfolio diversification and risk assessment.",
        "Profit margins have increased due to operational efficiency improvements.",
        
        # Sales examples
        "The sales pipeline includes qualified leads and conversion opportunities.",
        "Customer relationship management systems track prospect engagement and account history.",
        "Sales quotas are based on territory analysis and market potential assessment.",
        "Commission structures incentivize performance and customer satisfaction metrics.",
        
        # Marketing examples
        "Marketing campaigns target specific audience segments with personalized content strategies.",
        "Brand engagement metrics include social media analytics and conversion rate optimization.",
        "Content marketing focuses on thought leadership and customer education initiatives.",
        "Return on investment analysis guides marketing budget allocation decisions."
    ]
    
    return business_texts

if __name__ == "__main__":
    # Create tokenizer
    tokenizer = HelioTokenizer(vocab_size=8000)
    
    # Train on business data
    business_texts = create_business_training_data()
    tokenizer.train_on_text(business_texts)
    
    print(f"Vocabulary size: {len(tokenizer.vocab)}")
    print(f"Special tokens: {tokenizer.pad_token_id}, {tokenizer.bos_token_id}, {tokenizer.eos_token_id}, {tokenizer.unk_token_id}")
    
    # Test encoding/decoding
    test_text = "The sales team achieved quarterly revenue targets through customer engagement strategies."
    encoded = tokenizer.encode(test_text)
    decoded = tokenizer.decode(encoded)
    
    print(f"\nOriginal: {test_text}")
    print(f"Encoded: {encoded[:10]}...")  # Show first 10 tokens
    print(f"Decoded: {decoded}")
    
    # Save vocabulary
    tokenizer.save_vocabulary("/home/ubuntu/helio_vocab.json")
    print("\nVocabulary saved to helio_vocab.json")

