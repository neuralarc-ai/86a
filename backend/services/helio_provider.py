"""
Helio Lightweight Model Provider for Suna.so Platform
Integrates the custom Helio 6.6M parameter business model with Suna's LLM infrastructure
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

# Add model path to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../models/helio'))

try:
    from lightweight_model import LightweightTransformer
    from simple_tokenizer import SimpleTokenizer
except ImportError as e:
    logging.warning(f"Helio model files not found: {e}")
    LightweightTransformer = None
    SimpleTokenizer = None

logger = logging.getLogger(__name__)

class HelioProvider:
    """Custom provider for Helio lightweight model integration with Suna.so"""
    
    def __init__(self, model_path: str = "./backend/models/helio"):
        self.model_path = model_path
        self.model = None
        self.tokenizer = None
        self.executor = ThreadPoolExecutor(max_workers=2)
        self.device = torch.device("cpu")  # Helio is optimized for CPU
        self.max_length = 512
        self.vocab_size = 391
        self.is_initialized = False
        
        # Business domain keywords for enhanced processing
        self.business_keywords = {
            'hr': ['employee', 'performance', 'benefits', 'training', 'recruitment', 'onboarding', 'review'],
            'legal': ['contract', 'compliance', 'liability', 'agreement', 'terms', 'legal', 'policy'],
            'finance': ['revenue', 'profit', 'budget', 'investment', 'financial', 'cost', 'analysis'],
            'sales': ['customer', 'lead', 'conversion', 'pipeline', 'prospect', 'sales', 'client'],
            'marketing': ['campaign', 'brand', 'audience', 'engagement', 'promotion', 'marketing', 'content']
        }
        
        # Initialize model if available
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the Helio model and tokenizer"""
        if not LightweightTransformer or not SimpleTokenizer:
            logger.warning("Helio model classes not available - skipping initialization")
            return
            
        try:
            # Load vocabulary
            vocab_path = os.path.join(self.model_path, 'tokenizer', 'helio_vocab.json')
            if not os.path.exists(vocab_path):
                logger.warning(f"Helio vocabulary file not found at {vocab_path}")
                return
                
            with open(vocab_path, 'r') as f:
                vocab = json.load(f)
            
            # Initialize tokenizer
            self.tokenizer = SimpleTokenizer(vocab_path)
            
            # Initialize model
            self.model = LightweightTransformer(vocab_size=len(vocab))
            
            # Try to load trained weights if available
            weights_path = os.path.join(self.model_path, 'weights', 'helio_model.pth')
            if os.path.exists(weights_path):
                self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
                logger.info("Helio model loaded with trained weights")
            else:
                logger.info("Helio model initialized with random weights (no trained weights found)")
            
            self.model.eval()
            self.is_initialized = True
            logger.info("Helio model initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Helio model: {e}")
            self.is_initialized = False
    
    def _detect_business_domain(self, text: str) -> str:
        """Detect the primary business domain of the input text"""
        text_lower = text.lower()
        domain_scores = {}
        
        for domain, keywords in self.business_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            domain_scores[domain] = score
        
        if not domain_scores or max(domain_scores.values()) == 0:
            return 'general'
        
        return max(domain_scores, key=domain_scores.get)
    
    def _format_business_prompt(self, messages: List[Dict[str, str]], domain: str) -> str:
        """Format messages into a business-optimized prompt"""
        prompt_parts = []
        
        # Add domain-specific context
        domain_contexts = {
            'hr': "You are a professional HR assistant. Provide helpful, accurate, and sensitive responses to HR-related queries.",
            'legal': "You are a business legal assistant. Provide informative responses about business legal matters. Note: This is not legal advice.",
            'finance': "You are a financial analysis assistant. Provide accurate and insightful responses to financial queries.",
            'sales': "You are a sales support assistant. Provide helpful responses to sales-related questions and scenarios.",
            'marketing': "You are a marketing assistant. Provide creative and strategic responses to marketing queries.",
            'general': "You are a professional business assistant. Provide helpful and accurate responses to business queries."
        }
        
        prompt_parts.append(domain_contexts.get(domain, domain_contexts['general']))
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
                prompt_parts.append(f"Assistant: {content}")
        
        prompt_parts.append("Assistant:")
        return "\n".join(prompt_parts)
    
    async def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 200,
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate response using Helio model"""
        
        if not self.is_initialized:
            # Fallback response when model is not available
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "I'm a Helio business assistant. The model is currently initializing. Please try again in a moment."
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": 0,
                    "completion_tokens": 20,
                    "total_tokens": 20
                },
                "model": "helio-1.0",
                "status": "initializing"
            }
        
        try:
            # Extract the last user message for domain detection
            user_messages = [msg for msg in messages if msg.get('role') == 'user']
            last_message = user_messages[-1]['content'] if user_messages else ""
            
            # Detect business domain
            domain = self._detect_business_domain(last_message)
            
            # Format prompt with business context
            prompt = self._format_business_prompt(messages, domain)
            
            # Generate response
            if stream:
                return await self._generate_stream(prompt, temperature, max_tokens, domain, **kwargs)
            else:
                return await self._generate_sync(prompt, temperature, max_tokens, domain, **kwargs)
                
        except Exception as e:
            logger.error(f"Error in Helio generation: {e}")
            # Return error response in expected format
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"I apologize, but I encountered an error while processing your request. Please try again."
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": 0,
                    "completion_tokens": 15,
                    "total_tokens": 15
                },
                "model": "helio-1.0",
                "error": str(e)
            }
    
    async def _generate_sync(
        self,
        prompt: str,
        temperature: float,
        max_tokens: int,
        domain: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate synchronous response"""
        
        def _inference():
            try:
                # Tokenize input
                input_ids = self.tokenizer.encode(prompt)
                input_tensor = torch.tensor([input_ids], dtype=torch.long)
                
                # Limit input length
                if input_tensor.shape[1] > self.max_length - max_tokens:
                    input_tensor = input_tensor[:, -(self.max_length - max_tokens):]
                
                # Generate response
                with torch.no_grad():
                    generated_ids = []
                    current_input = input_tensor
                    
                    for _ in range(min(max_tokens, 100)):  # Limit generation length
                        outputs = self.model(current_input)
                        logits = outputs[:, -1, :]  # Get last token logits
                        
                        # Apply temperature
                        if temperature > 0:
                            logits = logits / temperature
                            probs = torch.softmax(logits, dim=-1)
                            next_token = torch.multinomial(probs, 1)
                        else:
                            next_token = torch.argmax(logits, dim=-1, keepdim=True)
                        
                        generated_ids.append(next_token.item())
                        
                        # Check for end of sequence
                        if next_token.item() == self.tokenizer.vocab.get('<eos>', 0):
                            break
                        
                        # Update input for next iteration
                        current_input = torch.cat([current_input, next_token], dim=1)
                        
                        # Limit total length
                        if current_input.shape[1] >= self.max_length:
                            break
                
                # Decode response
                response_text = self.tokenizer.decode(generated_ids)
                response_text = response_text.strip()
                
                # Apply business domain post-processing
                response_text = self._post_process_response(response_text, domain)
                
                return {
                    "choices": [{
                        "message": {
                            "role": "assistant",
                            "content": response_text
                        },
                        "finish_reason": "stop"
                    }],
                    "usage": {
                        "prompt_tokens": len(input_ids),
                        "completion_tokens": len(generated_ids),
                        "total_tokens": len(input_ids) + len(generated_ids)
                    },
                    "model": "helio-1.0",
                    "business_domain": domain
                }
                
            except Exception as e:
                logger.error(f"Inference error: {e}")
                raise
        
        # Run inference in thread pool
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, _inference)
    
    async def _generate_stream(
        self,
        prompt: str,
        temperature: float,
        max_tokens: int,
        domain: str,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate streaming response"""
        
        def _stream_inference():
            try:
                # Tokenize input
                input_ids = self.tokenizer.encode(prompt)
                input_tensor = torch.tensor([input_ids], dtype=torch.long)
                
                # Limit input length
                if input_tensor.shape[1] > self.max_length - max_tokens:
                    input_tensor = input_tensor[:, -(self.max_length - max_tokens):]
                
                # Generate response token by token
                with torch.no_grad():
                    current_input = input_tensor
                    
                    for i in range(min(max_tokens, 100)):
                        outputs = self.model(current_input)
                        logits = outputs[:, -1, :]
                        
                        # Apply temperature
                        if temperature > 0:
                            logits = logits / temperature
                            probs = torch.softmax(logits, dim=-1)
                            next_token = torch.multinomial(probs, 1)
                        else:
                            next_token = torch.argmax(logits, dim=-1, keepdim=True)
                        
                        # Decode token
                        token_text = self.tokenizer.decode([next_token.item()])
                        
                        # Yield token
                        yield {
                            "choices": [{
                                "delta": {
                                    "content": token_text
                                },
                                "finish_reason": None
                            }],
                            "model": "helio-1.0"
                        }
                        
                        # Check for end of sequence
                        if next_token.item() == self.tokenizer.vocab.get('<eos>', 0):
                            break
                        
                        # Update input
                        current_input = torch.cat([current_input, next_token], dim=1)
                        
                        if current_input.shape[1] >= self.max_length:
                            break
                
                # Final chunk
                yield {
                    "choices": [{
                        "delta": {},
                        "finish_reason": "stop"
                    }],
                    "model": "helio-1.0"
                }
                
            except Exception as e:
                logger.error(f"Streaming inference error: {e}")
                raise
        
        # Stream tokens asynchronously
        for chunk in _stream_inference():
            yield chunk
            await asyncio.sleep(0.01)  # Small delay for responsiveness
    
    def _post_process_response(self, response: str, domain: str) -> str:
        """Apply business domain-specific post-processing"""
        
        # Remove any incomplete sentences at the end
        sentences = response.split('.')
        if len(sentences) > 1 and sentences[-1].strip() and not sentences[-1].strip().endswith(('.', '!', '?')):
            response = '.'.join(sentences[:-1]) + '.'
        
        # Ensure professional tone
        response = response.replace(' and and ', ' and ')
        response = response.replace(' the the ', ' the ')
        
        # Domain-specific formatting
        if domain == 'legal':
            if response and not "legal advice" in response.lower():
                response += "\n\nNote: This information is for general business purposes only and does not constitute legal advice."
        elif domain == 'finance':
            if response and not "financial advice" in response.lower():
                response += "\n\nNote: This analysis is for informational purposes only and should not be considered financial advice."
        
        return response.strip()
    
    def health_check(self) -> Dict[str, Any]:
        """Perform health check on the Helio model"""
        try:
            if not self.is_initialized:
                return {
                    "status": "unhealthy",
                    "error": "Model not initialized",
                    "model_loaded": False,
                    "tokenizer_loaded": False
                }
            
            # Simple inference test
            test_prompt = "Test prompt for health check"
            input_ids = self.tokenizer.encode(test_prompt)
            input_tensor = torch.tensor([input_ids], dtype=torch.long)
            
            with torch.no_grad():
                outputs = self.model(input_tensor)
            
            return {
                "status": "healthy",
                "model_loaded": True,
                "tokenizer_loaded": True,
                "vocab_size": self.vocab_size,
                "max_length": self.max_length,
                "business_domains": list(self.business_keywords.keys())
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "model_loaded": self.model is not None,
                "tokenizer_loaded": self.tokenizer is not None
            }

# Global instance for use by LLM service
helio_provider = HelioProvider()

