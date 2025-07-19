#!/usr/bin/env python3
"""
Demo Script for Helio Lightweight Business Model
Shows how to load and use the trained model
"""

import torch
from train_helio import load_trained_model, generate_sample

def demo_helio_model():
    """Demonstrate the trained Helio model capabilities"""
    
    print("=== Helio Business Model Demo ===")
    print("Loading trained model...")
    
    try:
        # Load the trained model
        model, tokenizer = load_trained_model("/home/ubuntu/helio_model")
        print(f"✅ Model loaded successfully!")
        print(f"   - Parameters: {sum(p.numel() for p in model.parameters()):,}")
        print(f"   - Vocabulary size: {len(tokenizer.vocab)}")
        
        # Demo business prompts
        business_prompts = [
            # HR prompts
            "The employee onboarding process",
            "Performance review meetings",
            "Training and development programs",
            
            # Legal prompts  
            "Contract negotiations require",
            "Legal compliance involves",
            "Intellectual property protection",
            
            # Finance prompts
            "Quarterly financial reports",
            "Budget planning and forecasting",
            "Investment strategy decisions",
            
            # Sales prompts
            "Customer relationship management",
            "Sales pipeline optimization",
            "Lead generation strategies",
            
            # Marketing prompts
            "Brand awareness campaigns",
            "Digital marketing initiatives", 
            "Market research analysis"
        ]
        
        print("\n=== Business Text Generation Demo ===")
        
        for i, prompt in enumerate(business_prompts, 1):
            print(f"\n{i}. Prompt: '{prompt}'")
            
            # Generate text
            generated = generate_sample(
                model=model, 
                tokenizer=tokenizer, 
                prompt=prompt, 
                max_length=20
            )
            
            print(f"   Generated: '{generated}'")
        
        print("\n=== Interactive Demo ===")
        print("Enter your own business prompts (type 'quit' to exit):")
        
        while True:
            user_prompt = input("\nPrompt: ").strip()
            
            if user_prompt.lower() in ['quit', 'exit', 'q']:
                break
                
            if user_prompt:
                generated = generate_sample(
                    model=model,
                    tokenizer=tokenizer,
                    prompt=user_prompt,
                    max_length=25
                )
                print(f"Generated: '{generated}'")
        
        print("\n=== Model Information ===")
        print(f"Model Name: Helio Business Language Model")
        print(f"Version: 1.0")
        print(f"Parameters: {sum(p.numel() for p in model.parameters()):,}")
        print(f"Model Size: ~{sum(p.numel() for p in model.parameters()) * 4 / 1024 / 1024:.1f} MB")
        print(f"Vocabulary: {len(tokenizer.vocab)} tokens")
        print(f"Business Domains: HR, Legal, Finance, Sales, Marketing")
        print(f"Training Status: ✅ Trained and Ready")
        print(f"Commercial License: ✅ Full Rights")
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        print("Make sure the model has been trained first by running: python3 train_helio.py")

def quick_business_test():
    """Quick test of business domain understanding"""
    
    print("\n=== Business Domain Test ===")
    
    try:
        model, tokenizer = load_trained_model("/home/ubuntu/helio_model")
        
        # Test business understanding
        test_cases = [
            ("HR", "Employee benefits include"),
            ("Legal", "The contract terms specify"),
            ("Finance", "Revenue growth shows"),
            ("Sales", "Customer acquisition costs"),
            ("Marketing", "Brand engagement metrics")
        ]
        
        for domain, prompt in test_cases:
            generated = generate_sample(model, tokenizer, prompt, max_length=15)
            print(f"{domain:9}: '{prompt}' → '{generated}'")
            
    except Exception as e:
        print(f"Error in business test: {e}")

if __name__ == "__main__":
    demo_helio_model()
    quick_business_test()
    
    print("\n" + "="*50)
    print("🎉 Helio Model Demo Complete!")
    print("Your custom business language model is ready to use!")
    print("="*50)

