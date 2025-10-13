import openai
import os
import time
from django.conf import settings
from apps.analytics.models import ApiUsageLog


class OpenAIService:
    """Service for handling OpenAI API requests"""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        if not self.api_key:
            self.client = None
        else:
            # Use the old OpenAI 0.28.x API
            try:
                import openai
                
                # Set the API key directly (old method)
                openai.api_key = self.api_key
                self.client = openai
                print(f"OpenAI client initialized using old API (0.28.x)")
                print(f"Client type: {type(self.client)}")
                
            except Exception as e:
                print(f"OpenAI client initialization failed: {e}")
                print(f"API Key present: {bool(self.api_key)}")
                print(f"API Key length: {len(self.api_key) if self.api_key else 0}")
                self.client = None
    
    def send_prompt(self, prompt, user=None):
        """
        Send a prompt to OpenAI API and return the response
        
        Args:
            prompt (str): The prompt to send to OpenAI
            user (User, optional): The user making the request
            
        Returns:
            dict: Response containing the AI response and metadata
        """
        start_time = time.time()
        
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.',
                'response_time': time.time() - start_time
            }
        
        try:
            # Use the old OpenAI 0.28.x API
            # For reasoning models (gpt-5-*), use higher token limit as they use tokens for internal reasoning
            max_tokens = 5000 if 'gpt-5' in self.model or 'o1' in self.model or 'o3' in self.model else 1000
            
            response = self.client.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=max_tokens
            )
            
            response_time = time.time() - start_time
            ai_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
            # Debug logging
            if not ai_response or ai_response.strip() == '':
                print(f"WARNING: OpenAI returned empty response!")
                print(f"Model: {self.model}")
                print(f"Prompt length: {len(prompt)}")
                print(f"Tokens used: {tokens_used}")
                print(f"Full response object: {response}")
            
            # Calculate cost (approximate for gpt-3.5-turbo)
            cost = self._calculate_cost(tokens_used)
            
            # Log API usage
            self._log_api_usage(
                user=user,
                request_type='chat_completion',
                model_used=self.model,
                tokens_used=tokens_used,
                cost=cost,
                response_time=response_time,
                request=prompt,
                response=ai_response,
                success=True
            )
            
            return {
                'success': True,
                'response': ai_response,
                'tokens_used': tokens_used,
                'cost': cost,
                'response_time': response_time
            }
            
        except Exception as e:
            response_time = time.time() - start_time
            
            # Log failed API usage
            self._log_api_usage(
                user=user,
                request_type='chat_completion',
                model_used=self.model,
                tokens_used=0,
                cost=0,
                response_time=response_time,
                request=prompt,
                response='',
                success=False,
                error_message=str(e)
            )
            
            return {
                'success': False,
                'error': str(e),
                'response_time': response_time
            }
    
    def _calculate_cost(self, tokens_used):
        """Calculate approximate cost based on tokens used"""
        # GPT-3.5-turbo pricing (as of 2024)
        # Input: $0.0015 per 1K tokens
        # Output: $0.002 per 1K tokens
        # Using average of input/output for simplicity
        cost_per_token = 0.00175 / 1000
        return round(tokens_used * cost_per_token, 4)
    
    def _log_api_usage(self, user, request_type, model_used, tokens_used, cost, 
                      response_time, request, response, success, error_message=None):
        """Log API usage to database"""
        try:
            ApiUsageLog.objects.create(
                user=user,
                request_type=request_type,
                model_used=model_used,
                tokens_used=tokens_used,
                cost=cost,
                response_time=response_time,
                request=request[:1000],  # Truncate for storage
                response=response[:1000] if response else '',
                success=success,
                error_message=error_message
            )
        except Exception as e:
            # Don't let logging errors break the main functionality
            print(f"Failed to log API usage: {e}")
