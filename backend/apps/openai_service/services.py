import time
from django.conf import settings
from openai import OpenAI
from apps.analytics.models import ApiUsageLog


class OpenAIService:
    """Service for handling OpenAI API requests (openai-python v1.x client)."""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self.client = None
        if self.api_key:
            try:
                self.client = OpenAI(api_key=self.api_key)
            except Exception:
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
                'response_time': time.time() - start_time,
            }

        try:
            # Reasoning / newer families often need a higher cap than classic chat models
            max_tokens = (
                5000
                if ('gpt-5' in self.model or 'o1' in self.model or 'o3' in self.model)
                else 1000
            )

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{'role': 'user', 'content': prompt}],
                max_tokens=max_tokens,
            )

            response_time = time.time() - start_time
            choice = response.choices[0]
            ai_response = (choice.message.content or '') if choice.message else ''
            usage = response.usage
            tokens_used = usage.total_tokens if usage else 0

            cost = self._calculate_cost(tokens_used)

            self._log_api_usage(
                user=user,
                request_type='chat_completion',
                model_used=self.model,
                tokens_used=tokens_used,
                cost=cost,
                response_time=response_time,
                request=prompt,
                response=ai_response,
                success=True,
            )

            return {
                'success': True,
                'response': ai_response,
                'tokens_used': tokens_used,
                'cost': cost,
                'response_time': response_time,
            }

        except Exception as e:
            response_time = time.time() - start_time

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
                error_message=str(e),
            )

            return {
                'success': False,
                'error': str(e),
                'response_time': response_time,
            }

    def _calculate_cost(self, tokens_used):
        """Calculate approximate cost based on tokens used"""
        # GPT-3.5-turbo pricing (as of 2024)
        # Input: $0.0015 per 1K tokens
        # Output: $0.002 per 1K tokens
        # Using average of input/output for simplicity
        cost_per_token = 0.00175 / 1000
        return round(tokens_used * cost_per_token, 4)

    def _log_api_usage(
        self,
        user,
        request_type,
        model_used,
        tokens_used,
        cost,
        response_time,
        request,
        response,
        success,
        error_message=None,
    ):
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
                error_message=error_message,
            )
        except Exception:
            # Don't let logging errors break the main functionality
            pass
