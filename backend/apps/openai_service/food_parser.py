"""
Food Parsing Service using OpenAI API

This service handles intelligent food parsing from natural language input,
including metadata generation, database validation, and automatic logging.

Key Features:
- Parse multiple foods from single input string
- Check existing meals and foods in database
- Generate missing nutritional metadata via OpenAI
- Handle duplicate foods with different metadata
- Automatic food log creation
- Optional meal creation from parsed foods
"""

import json
import logging
from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import datetime
from django.utils import timezone
from django.db.models import Q
from apps.foods.models import Food, Meal, MealFood
from apps.logging.models import FoodLog
from .services import OpenAIService

logger = logging.getLogger(__name__)


class FoodParserService:
    """
    Service for parsing food input and generating nutritional metadata using OpenAI.
    
    This service integrates with the existing food and meal database to:
    1. Parse natural language food descriptions
    2. Validate against existing database entries
    3. Generate missing nutritional metadata
    4. Create food/meal entries and logs
    """
    
    # Prompt template for food parsing
    FOOD_PARSING_PROMPT = """
You are a food parsing API. Parse this food description into a structured JSON list.

Input: "{input_text}"

CRITICAL INSTRUCTIONS:
1. Return ONLY a JSON array. No explanations, no markdown code blocks, just raw JSON.
2. Extract each food/meal mentioned
3. For metadata, ONLY include: brand name if mentioned
4. Do NOT include: quantity, servings, protein_per_item, or any nutritional data in metadata
5. Nutritional data will be looked up separately

Required JSON format:
[
  {{"name": "food name", "metadata": {{"brand": "Brand Name"}}}}
]

Examples:
Input: "3 brown eggs from Trader Joe's"
Output: [{{"name": "brown eggs", "metadata": {{"brand": "Trader Joes"}}}}]

Input: "chicken breast and rice"
Output: [{{"name": "chicken breast", "metadata": {{}}}}, {{"name": "rice", "metadata": {{}}}}]

Input: "My Breakfast"
Output: [{{"name": "My Breakfast", "metadata": {{}}}}]

Return ONLY the JSON array, nothing else.
"""
    
    # Prompt template for nutritional metadata generation
    METADATA_GENERATION_PROMPT = """
You are a nutritional data API. Generate complete nutritional information for: "{food_name}"

{existing_metadata}

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object. No explanations, no markdown, just raw JSON.
2. ALL fields must be included with realistic nutritional values based on USDA nutritional database
3. If a field already has a value in "Existing metadata", use that exact value - DO NOT override it
4. For missing fields, provide accurate values based on USDA nutritional data for similar foods
5. The brand field should contain the actual brand name if mentioned (e.g., "Trader Joes", "Kodiak", "Chobani")
6. Never leave fields null or empty - use 0 if truly unknown
7. Use appropriate serving sizes (e.g., 100g for most foods, 1 cup for liquids, 1 item for whole items)
8. Be realistic with micronutrients - don't make up excessive vitamin/mineral values

Required JSON structure (include ALL these fields):
{{
  "serving_size": 100,
  "unit": "g",
  "calories": 165,
  "protein": 31,
  "fat": 3.6,
  "carbohydrates": 0,
  "fiber": 0,
  "sodium": 74,
  "sugar": 0,
  "saturated_fat": 1,
  "trans_fat": 0,
  "calcium": 15,
  "iron": 0.9,
  "magnesium": 29,
  "cholesterol": 85,
  "vitamin_a": 18,
  "vitamin_c": 0,
  "vitamin_d": 0.1,
  "caffeine": 0,
  "food_group": "protein",
  "brand": "",
  "cost": null
}}

Food groups: "protein", "grain", "vegetable", "fruit", "dairy", "other"
Units: "g", "ml", "oz", "cup", "tbsp", "tsp", "item"

Examples of realistic nutritional values:
- Chicken breast (100g): ~165 calories, 31g protein, 3.6g fat, 0g carbs
- White rice (100g): ~130 calories, 2.7g protein, 0.3g fat, 28g carbs
- Banana (100g): ~89 calories, 1.1g protein, 0.3g fat, 23g carbs
- Whole milk (100ml): ~61 calories, 3.2g protein, 3.3g fat, 4.7g carbs

Return ONLY the JSON object, nothing else.
"""
    
    def __init__(self, user):
        """
        Initialize food parser with authenticated user.
        
        Args:
            user: Django User object making the request
        """
        self.user = user
        self.openai_service = OpenAIService()
    
    def parse_food_input(self, input_text: str, create_meal: bool = False) -> Dict[str, Any]:
        """
        Parse food input and process all foods.
        
        Args:
            input_text: Natural language food description
            create_meal: If True, create a meal from all parsed foods
            
        Returns:
            Dict with parsed foods, created logs, and any errors
        """
        result = {
            'foods_parsed': [],
            'logs_created': [],
            'meal_created': None,
            'errors': [],
            'success': True
        }
        
        try:
            # Step 1: Parse input to identify foods
            parsed_foods = self._parse_foods_from_text(input_text)
            
            if not parsed_foods:
                result['success'] = False
                result['errors'].append('No foods could be parsed from input')
                return result
            
            # Step 2: Process each food
            processed_foods = []
            for food_data in parsed_foods:
                processed = self._process_single_food(food_data)
                processed_foods.append(processed)
                
                # Convert to JSON-serializable format before adding to result
                serializable_processed = {
                    'name': processed['name'],
                    'source': processed['source'],
                    'servings': float(processed.get('servings', 1)),
                    'error': processed.get('error')
                }
                
                # Add food info if available
                if processed.get('food_object'):
                    food = processed['food_object']
                    serializable_processed['food'] = {
                        'food_id': food.food_id,
                        'food_name': food.food_name,
                        'calories': float(food.calories),
                        'protein': float(food.protein),
                        'fat': float(food.fat),
                        'carbohydrates': float(food.carbohydrates)
                    }
                
                # Add meal info if available
                if processed.get('meal_object'):
                    meal = processed['meal_object']
                    serializable_processed['meal'] = {
                        'meal_id': meal.meal_id,
                        'meal_name': meal.meal_name
                    }
                
                result['foods_parsed'].append(serializable_processed)
                
                if processed.get('error'):
                    result['errors'].append(processed['error'])
            
            # Step 3: Create food logs
            for processed in processed_foods:
                if processed.get('food_object'):
                    log = self._create_food_log(
                        food=processed['food_object'],
                        servings=processed.get('servings', Decimal('1')),
                        metadata=processed.get('metadata', {})
                    )
                    result['logs_created'].append({
                        'log_id': log.macro_log_id,
                        'food_name': processed['food_object'].food_name,
                        'servings': float(processed.get('servings', 1))
                    })
            
            # Step 4: Optionally create meal
            if create_meal and processed_foods:
                meal = self._create_meal_from_foods(processed_foods, input_text)
                if meal:
                    result['meal_created'] = {
                        'meal_id': meal.meal_id,
                        'meal_name': meal.meal_name
                    }
            
        except Exception as e:
            logger.error(f"Food parsing error: {e}", exc_info=True)
            result['success'] = False
            result['errors'].append(str(e))
        
        return result
    
    def _parse_foods_from_text(self, input_text: str) -> List[Dict]:
        """
        Use OpenAI to parse foods from natural language text.
        
        Args:
            input_text: User's food description
            
        Returns:
            List of dicts with 'name' and 'metadata' keys
        """
        prompt = self.FOOD_PARSING_PROMPT.format(input_text=input_text)
        
        response = self.openai_service.send_prompt(prompt, user=self.user)
        
        if not response['success']:
            logger.error(f"OpenAI parsing failed: {response.get('error')}")
            return []
        
        try:
            # Try to extract JSON from response (AI might wrap it in markdown)
            response_text = response['response'].strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                lines = response_text.split('\n')
                json_lines = []
                in_code_block = False
                for line in lines:
                    if line.startswith('```'):
                        in_code_block = not in_code_block
                        continue
                    if in_code_block:
                        json_lines.append(line)
                response_text = '\n'.join(json_lines).strip()
            
            # Parse JSON response
            parsed = json.loads(response_text)
            
            if isinstance(parsed, list):
                return parsed
            else:
                logger.warning(f"Unexpected response format: {parsed}")
                return []
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response was: {response['response'][:500]}")
            return []
    
    def _process_single_food(self, food_data: Dict) -> Dict:
        """
        Process a single parsed food item.
        
        Logic:
        1. Check if exists in user's meals
        2. Check if exists in foods database
        3. Handle metadata matching/generation
        4. Create new food if needed
        
        Args:
            food_data: Dict with 'name' and 'metadata' keys
            
        Returns:
            Dict with processing results
        """
        name = food_data.get('name', '').strip()
        metadata = food_data.get('metadata', {})
        servings = Decimal(str(metadata.get('servings', '1')))
        
        result = {
            'name': name,
            'metadata': metadata,
            'servings': servings,
            'source': None,  # 'meal', 'food_exact', 'food_duplicate', 'food_new'
            'food_object': None,
            'error': None
        }
        
        # Step 1: Check user's meals
        try:
            meal = Meal.objects.get(user=self.user, meal_name__iexact=name)
            result['source'] = 'meal'
            result['meal_object'] = meal
            # For meals, we don't create a single food object
            # The meal contains multiple foods
            return result
        except Meal.DoesNotExist:
            pass
        
        # Step 2: Check foods database
        try:
            existing_food = Food.objects.get(food_name__iexact=name)
            
            # Check if metadata matches
            if self._metadata_matches(existing_food, metadata):
                result['source'] = 'food_exact'
                result['food_object'] = existing_food
            else:
                # Metadata doesn't match - create duplicate
                result['source'] = 'food_duplicate'
                result['food_object'] = self._create_food_duplicate(existing_food, metadata)
            
            return result
            
        except Food.DoesNotExist:
            pass
        except Food.MultipleObjectsReturned:
            # If multiple foods with same name, use first one
            existing_food = Food.objects.filter(food_name__iexact=name).first()
            result['source'] = 'food_exact'
            result['food_object'] = existing_food
            return result
        
        # Step 3: Food not found - create new with metadata generation
        result['source'] = 'food_new'
        result['food_object'] = self._create_new_food(name, metadata)
        
        return result
    
    def _metadata_matches(self, food: Food, metadata: Dict) -> bool:
        """
        Check if provided metadata matches existing food.
        
        Args:
            food: Existing Food object
            metadata: Provided metadata dict
            
        Returns:
            True if metadata matches or is empty
        """
        if not metadata or len(metadata) == 0:
            return True  # No metadata provided, use existing
        
        # Check key nutritional fields
        if 'calories' in metadata:
            if abs(float(food.calories) - float(metadata['calories'])) > 10:
                return False
        
        if 'protein' in metadata:
            if abs(float(food.protein) - float(metadata['protein'])) > 2:
                return False
        
        # Check brand field - if provided, it must match exactly
        if 'brand' in metadata and metadata['brand']:
            # If existing food has empty brand and only brand metadata is provided, use existing food
            if not food.brand and len(metadata) == 1:
                return True
            # Otherwise, brand must match exactly
            if food.brand != metadata['brand']:
                return False
        
        # Check serving size and unit - if provided, they must match
        if 'serving_size' in metadata:
            if abs(float(food.serving_size) - float(metadata['serving_size'])) > 0.1:
                return False
        
        if 'unit' in metadata:
            if food.unit != metadata['unit']:
                return False
        
        return True
    
    def _create_food_duplicate(self, original_food: Food, metadata: Dict) -> Food:
        """
        Create a duplicate food entry with different metadata.
        
        Args:
            original_food: Original Food object
            metadata: New metadata to apply
            
        Returns:
            New Food object
        """
        # Create new food name with variant indicator
        new_name = f"{original_food.food_name} (variant)"
        counter = 1
        
        while Food.objects.filter(food_name=new_name).exists():
            counter += 1
            new_name = f"{original_food.food_name} (variant {counter})"
        
        # Copy all fields from original
        food_data = {
            'food_name': new_name,
            'serving_size': original_food.serving_size,
            'unit': original_food.unit,
            'calories': original_food.calories,
            'protein': original_food.protein,
            'fat': original_food.fat,
            'carbohydrates': original_food.carbohydrates,
            'fiber': original_food.fiber,
            'sodium': original_food.sodium,
            'sugar': original_food.sugar,
            'saturated_fat': original_food.saturated_fat,
            'trans_fat': original_food.trans_fat,
            'calcium': original_food.calcium,
            'iron': original_food.iron,
            'magnesium': original_food.magnesium,
            'cholesterol': original_food.cholesterol,
            'vitamin_a': original_food.vitamin_a,
            'vitamin_c': original_food.vitamin_c,
            'vitamin_d': original_food.vitamin_d,
            'caffeine': original_food.caffeine,
            'food_group': original_food.food_group,
            'brand': original_food.brand,
            'cost': original_food.cost,
            'make_public': False
        }
        
        # Override with provided metadata (only valid fields)
        valid_fields = set(food_data.keys())
        for key, value in metadata.items():
            if key in valid_fields and value:
                food_data[key] = value
        
        return Food.objects.create(**food_data)
    
    def _create_new_food(self, name: str, metadata: Dict) -> Food:
        """
        Create new food entry with metadata generation for missing fields.
        
        Args:
            name: Food name
            metadata: Partially provided metadata
            
        Returns:
            New Food object
        """
        # Generate missing metadata via OpenAI
        complete_metadata = self._generate_metadata(name, metadata)
        
        # Create food with unique name handling
        food_name = name
        if Food.objects.filter(food_name=food_name).exists():
            counter = 1
            while Food.objects.filter(food_name=f"{name} ({counter})").exists():
                counter += 1
            food_name = f"{name} ({counter})"
        
        complete_metadata['food_name'] = food_name
        complete_metadata['make_public'] = True  # New AI-generated foods are public by default
        
        return Food.objects.create(**complete_metadata)
    
    def _generate_metadata(self, food_name: str, existing_metadata: Dict) -> Dict:
        """
        Generate complete nutritional metadata for a food using OpenAI.
        
        Args:
            food_name: Name of the food
            existing_metadata: Already provided metadata
            
        Returns:
            Complete metadata dict with all required fields
        """
        # Build existing metadata string
        existing_str = ""
        if existing_metadata:
            existing_str = "Existing metadata (keep these values):\n"
            existing_str += json.dumps(existing_metadata, indent=2)
        
        prompt = self.METADATA_GENERATION_PROMPT.format(
            food_name=food_name,
            existing_metadata=existing_str
        )
        
        response = self.openai_service.send_prompt(prompt, user=self.user)
        
        if not response['success']:
            logger.error(f"Metadata generation failed: {response.get('error')}")
            # Return defaults
            return self._get_default_metadata(existing_metadata)
        
        try:
            # Try to extract JSON from response (AI might wrap it in markdown)
            response_text = response['response'].strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                # Extract content between ```json and ``` or between ``` and ```
                lines = response_text.split('\n')
                json_lines = []
                in_code_block = False
                for line in lines:
                    if line.startswith('```'):
                        in_code_block = not in_code_block
                        continue
                    if in_code_block or not any(lines[0].startswith('```') for _ in [0]):
                        json_lines.append(line)
                response_text = '\n'.join(json_lines).strip()
            
            # Parse JSON
            generated = json.loads(response_text)
            
            # Ensure generated is a dict, not a list
            if isinstance(generated, list) and len(generated) > 0:
                generated = generated[0]  # Take first item if it's a list
            elif not isinstance(generated, dict):
                logger.error(f"Unexpected response format: {type(generated)}")
                return self._get_default_metadata(existing_metadata)
            
            # Filter existing metadata to only include valid fields BEFORE merging
            valid_fields = set(self._get_default_metadata({}).keys())
            filtered_existing = {k: v for k, v in existing_metadata.items() if k in valid_fields}
            
            # Merge with filtered existing metadata (existing takes precedence)
            complete = generated.copy()
            complete.update(filtered_existing)
            
            # Ensure all required fields have values
            return self._ensure_complete_metadata(complete)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse metadata JSON: {e}")
            logger.error(f"Response was: {response.get('response', 'No response')[:200]}")
            return self._get_default_metadata(existing_metadata)
    
    def _get_default_metadata(self, existing: Dict) -> Dict:
        """
        Get default metadata values, filtering out invalid fields from existing metadata.
        
        Args:
            existing: Existing metadata (may contain invalid fields)
            
        Returns:
            Dict with only valid fields, filled with defaults where needed
        """
        defaults = {
            'serving_size': 100,
            'unit': 'g',
            'calories': 0,
            'protein': 0,
            'fat': 0,
            'carbohydrates': 0,
            'fiber': 0,
            'sodium': 0,
            'sugar': 0,
            'saturated_fat': 0,
            'trans_fat': 0,
            'calcium': 0,
            'iron': 0,
            'magnesium': 0,
            'cholesterol': 0,
            'vitamin_a': 0,
            'vitamin_c': 0,
            'vitamin_d': 0,
            'caffeine': 0,
            'food_group': 'other',
            'brand': '',
            'cost': None
        }
        
        # Only update with valid fields from existing
        valid_fields = set(defaults.keys())
        filtered_existing = {k: v for k, v in existing.items() if k in valid_fields}
        defaults.update(filtered_existing)
        
        return defaults
    
    def _ensure_complete_metadata(self, metadata: Dict) -> Dict:
        """
        Ensure all required fields are present and filter out invalid fields.
        
        This method ensures that only valid Food model fields are included
        in the metadata to prevent errors when creating Food objects.
        """
        defaults = self._get_default_metadata({})
        
        # Create a new dict with only valid fields
        valid_metadata = {}
        
        # Get all valid Food model field names
        valid_fields = set(defaults.keys())
        
        # Only include fields that are valid for the Food model
        for key, value in metadata.items():
            if key in valid_fields:
                valid_metadata[key] = value
        
        # Fill in any missing fields with defaults
        for key, default_value in defaults.items():
            if key not in valid_metadata or valid_metadata[key] is None:
                valid_metadata[key] = default_value
        
        return valid_metadata
    
    def _create_food_log(self, food: Food, servings: Decimal, metadata: Dict) -> FoodLog:
        """
        Create a food log entry.
        
        Args:
            food: Food object to log
            servings: Number of servings
            metadata: Original metadata (for voice_input tracking)
            
        Returns:
            Created FoodLog object
        """
        return FoodLog.objects.create(
            user=self.user,
            food=food,
            servings=servings,
            measurement=food.unit,
            date_time=timezone.now(),
            voice_input=metadata.get('original_input'),
            ai_response=metadata.get('ai_response')
        )
    
    def _create_meal_from_foods(self, processed_foods: List[Dict], input_text: str) -> Optional[Meal]:
        """
        Create a meal from processed foods.
        
        Args:
            processed_foods: List of processed food dicts
            input_text: Original input (used for meal name)
            
        Returns:
            Created Meal object or None
        """
        # Generate meal name from input
        meal_name = self._generate_meal_name(input_text)
        
        try:
            # Create meal
            meal = Meal.objects.create(
                user=self.user,
                meal_name=meal_name
            )
            
            # Add foods to meal
            for processed in processed_foods:
                if processed.get('food_object'):
                    MealFood.objects.create(
                        meal=meal,
                        food=processed['food_object'],
                        servings=processed.get('servings', Decimal('1'))
                    )
                elif processed.get('meal_object'):
                    # If a meal was referenced, add all its foods
                    existing_meal = processed['meal_object']
                    for meal_food in existing_meal.mealfood_set.all():
                        MealFood.objects.create(
                            meal=meal,
                            food=meal_food.food,
                            servings=meal_food.servings
                        )
            
            return meal
            
        except Exception as e:
            logger.error(f"Failed to create meal: {e}")
            return None
    
    def _generate_meal_name(self, input_text: str) -> str:
        """Generate a unique meal name from input text"""
        # Use first 50 chars of input as base
        base_name = input_text[:50].strip()
        
        # Ensure uniqueness
        meal_name = base_name
        counter = 1
        
        while Meal.objects.filter(user=self.user, meal_name=meal_name).exists():
            counter += 1
            meal_name = f"{base_name} ({counter})"
        
        return meal_name
    
    def generate_missing_metadata(self, food_name: str, partial_metadata: Dict) -> Dict:
        """
        Public method to generate missing metadata for manual food creation.
        
        Args:
            food_name: Name of the food
            partial_metadata: Already provided metadata
            
        Returns:
            Complete metadata dict
        """
        return self._generate_metadata(food_name, partial_metadata)

