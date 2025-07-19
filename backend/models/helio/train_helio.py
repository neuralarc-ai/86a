#!/usr/bin/env python3
"""
Training Script for Helio Lightweight Business Model
Optimized for CPU training with limited resources
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import json
import time
import os
from typing import List, Dict
import random

from lightweight_model import HelioModel, HelioConfig
from simple_tokenizer import HelioTokenizer, create_business_training_data

class BusinessTextDataset(Dataset):
    """Dataset for business text training"""
    
    def __init__(self, texts: List[str], tokenizer: HelioTokenizer, max_length: int = 128):
        self.texts = texts
        self.tokenizer = tokenizer
        self.max_length = max_length
        
        # Preprocess and tokenize all texts
        self.tokenized_texts = []
        for text in texts:
            tokens = tokenizer.encode(text, add_special_tokens=True)
            if len(tokens) > max_length:
                tokens = tokens[:max_length]
            else:
                # Pad to max_length
                tokens.extend([tokenizer.pad_token_id] * (max_length - len(tokens)))
            self.tokenized_texts.append(tokens)
    
    def __len__(self):
        return len(self.tokenized_texts)
    
    def __getitem__(self, idx):
        tokens = self.tokenized_texts[idx]
        input_ids = torch.tensor(tokens[:-1], dtype=torch.long)  # Input sequence
        labels = torch.tensor(tokens[1:], dtype=torch.long)      # Target sequence (shifted)
        
        return {
            'input_ids': input_ids,
            'labels': labels
        }

def create_extended_business_corpus():
    """Create extended business training corpus"""
    base_texts = create_business_training_data()
    
    # Add more business scenarios
    extended_texts = base_texts + [
        # More HR scenarios
        "Employee onboarding includes orientation sessions and mentorship programs for new hires.",
        "Performance improvement plans help employees develop skills and meet expectations.",
        "Workplace diversity initiatives promote inclusive culture and equal opportunities.",
        "Remote work policies define expectations for productivity and communication standards.",
        
        # More Legal scenarios
        "Data protection regulations require secure handling of personal information and privacy compliance.",
        "Employment contracts specify job responsibilities, compensation, and termination procedures.",
        "Intellectual property agreements protect company innovations and trade secrets.",
        "Regulatory compliance audits ensure adherence to industry standards and legal requirements.",
        
        # More Finance scenarios
        "Financial planning involves risk assessment, investment strategies, and growth projections.",
        "Cost analysis identifies opportunities for expense reduction and efficiency improvements.",
        "Revenue recognition follows accounting principles and reporting standards.",
        "Capital allocation decisions consider return on investment and strategic priorities.",
        
        # More Sales scenarios
        "Lead qualification processes identify prospects with highest conversion potential.",
        "Sales forecasting uses historical data and market trends for accurate predictions.",
        "Customer retention strategies focus on satisfaction, loyalty, and long-term relationships.",
        "Territory management optimizes coverage and resource allocation for maximum results.",
        
        # More Marketing scenarios
        "Digital marketing campaigns leverage social media, email, and content strategies.",
        "Market research provides insights into customer preferences and competitive landscape.",
        "Brand positioning differentiates products and creates unique value propositions.",
        "Performance metrics track campaign effectiveness and return on marketing investment."
    ]
    
    # Generate variations and combinations
    variations = []
    for text in extended_texts:
        # Create slight variations
        words = text.split()
        if len(words) > 5:
            # Shuffle some words (keeping structure)
            mid_point = len(words) // 2
            variation = words[:2] + words[2:mid_point] + words[mid_point:]
            variations.append(' '.join(variation))
    
    return extended_texts + variations

def train_model(
    model: HelioModel,
    tokenizer: HelioTokenizer,
    train_texts: List[str],
    num_epochs: int = 5,
    batch_size: int = 4,  # Small batch size for limited RAM
    learning_rate: float = 1e-4,
    max_length: int = 64,  # Shorter sequences for efficiency
    save_path: str = "/home/ubuntu/helio_model"
):
    """Train the Helio model"""
    
    print(f"Training Helio model with {len(train_texts)} texts...")
    print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Create dataset and dataloader
    dataset = BusinessTextDataset(train_texts, tokenizer, max_length)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    # Setup optimizer
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)
    
    # Training loop
    model.train()
    total_loss = 0
    step = 0
    
    for epoch in range(num_epochs):
        epoch_loss = 0
        epoch_steps = 0
        
        print(f"\nEpoch {epoch + 1}/{num_epochs}")
        start_time = time.time()
        
        for batch in dataloader:
            input_ids = batch['input_ids']
            labels = batch['labels']
            
            # Forward pass
            outputs = model(input_ids=input_ids, labels=labels)
            loss = outputs.loss
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            
            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            optimizer.step()
            
            # Track loss
            epoch_loss += loss.item()
            total_loss += loss.item()
            epoch_steps += 1
            step += 1
            
            # Print progress
            if step % 10 == 0:
                avg_loss = total_loss / step
                print(f"Step {step}, Loss: {loss.item():.4f}, Avg Loss: {avg_loss:.4f}")
        
        epoch_time = time.time() - start_time
        avg_epoch_loss = epoch_loss / epoch_steps
        print(f"Epoch {epoch + 1} completed in {epoch_time:.2f}s, Avg Loss: {avg_epoch_loss:.4f}")
        
        # Generate sample text
        if (epoch + 1) % 2 == 0:
            print("\nSample generation:")
            sample_text = generate_sample(model, tokenizer, "The sales team")
            print(f"Generated: {sample_text}")
    
    # Save model
    os.makedirs(save_path, exist_ok=True)
    torch.save(model.state_dict(), f"{save_path}/model.pt")
    tokenizer.save_vocabulary(f"{save_path}/vocab.json")
    
    # Save config
    config_dict = {
        'vocab_size': model.config.vocab_size,
        'hidden_size': model.config.hidden_size,
        'num_hidden_layers': model.config.num_hidden_layers,
        'num_attention_heads': model.config.num_attention_heads,
        'intermediate_size': model.config.intermediate_size,
        'max_position_embeddings': model.config.max_position_embeddings,
    }
    
    with open(f"{save_path}/config.json", 'w') as f:
        json.dump(config_dict, f, indent=2)
    
    print(f"\nModel saved to {save_path}")
    return model

def generate_sample(model: HelioModel, tokenizer: HelioTokenizer, prompt: str, max_length: int = 30):
    """Generate sample text from the model"""
    model.eval()
    
    with torch.no_grad():
        input_ids = tokenizer.encode(prompt, add_special_tokens=True, return_tensors='pt')
        
        for _ in range(max_length):
            outputs = model(input_ids)
            logits = outputs.logits[0, -1, :]
            
            # Sample from top-k
            top_k = 10
            top_logits, top_indices = torch.topk(logits, top_k)
            probs = torch.softmax(top_logits, dim=-1)
            next_token_idx = torch.multinomial(probs, 1)
            next_token = top_indices[next_token_idx]
            
            input_ids = torch.cat([input_ids, next_token.unsqueeze(0)], dim=-1)
            
            # Stop if EOS token
            if next_token.item() == tokenizer.eos_token_id:
                break
        
        generated_text = tokenizer.decode(input_ids[0], skip_special_tokens=True)
        return generated_text

def load_trained_model(model_path: str):
    """Load a trained Helio model"""
    # Load config
    with open(f"{model_path}/config.json", 'r') as f:
        config_dict = json.load(f)
    
    config = HelioConfig(**config_dict)
    model = HelioModel(config)
    
    # Load weights
    model.load_state_dict(torch.load(f"{model_path}/model.pt", map_location='cpu'))
    
    # Load tokenizer
    tokenizer = HelioTokenizer(vocab_size=config.vocab_size)
    tokenizer.load_vocabulary(f"{model_path}/vocab.json")
    
    return model, tokenizer

def main():
    """Main training function"""
    print("=== Helio Lightweight Business Model Training ===")
    
    # Create tokenizer and train on business corpus
    print("Creating tokenizer...")
    tokenizer = HelioTokenizer(vocab_size=8000)
    
    # Create extended training corpus
    print("Creating training corpus...")
    train_texts = create_extended_business_corpus()
    print(f"Training corpus size: {len(train_texts)} texts")
    
    # Train tokenizer
    tokenizer.train_on_text(train_texts)
    print(f"Tokenizer vocabulary size: {len(tokenizer.vocab)}")
    
    # Create model
    print("Creating model...")
    config = HelioConfig(
        vocab_size=len(tokenizer.vocab),
        hidden_size=256,
        num_hidden_layers=6,
        num_attention_heads=8,
        intermediate_size=1024,
        max_position_embeddings=512
    )
    
    model = HelioModel(config)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Model created with {total_params:,} parameters (~{total_params * 4 / 1024 / 1024:.1f} MB)")
    
    # Train model
    print("\nStarting training...")
    trained_model = train_model(
        model=model,
        tokenizer=tokenizer,
        train_texts=train_texts,
        num_epochs=3,  # Reduced for demo
        batch_size=2,  # Small batch for limited RAM
        learning_rate=1e-4,
        max_length=64
    )
    
    print("\n=== Training Complete ===")
    
    # Test generation
    print("\nTesting text generation:")
    test_prompts = [
        "The marketing team",
        "Our financial",
        "Employee performance",
        "The legal department"
    ]
    
    for prompt in test_prompts:
        generated = generate_sample(trained_model, tokenizer, prompt)
        print(f"Prompt: '{prompt}' -> Generated: '{generated}'")

if __name__ == "__main__":
    main()

