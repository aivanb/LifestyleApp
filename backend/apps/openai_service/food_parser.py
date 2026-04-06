"""
Food Parsing Service using OpenAI API

This service handles intelligent food parsing from natural language input,
including metadata generation and automatic logging.

Key Features:
- Parse multiple foods from single input string
- For each parsed food, fill nutrition via the same OpenAI metadata path as Food Creator
  (``generate_missing_metadata`` / ``METADATA_GENERATION_PROMPT``), preserving user-stated fields
- Handle duplicate foods with different metadata
- Automatic food log creation
- Optional meal creation from parsed foods
"""

import json
import logging
import re
from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import datetime
from django.utils import timezone
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
3. For metadata, include ONLY fields the user clearly stated — never invent or estimate values:
   - "brand": string if a brand is mentioned
   - "cost": JSON number in USD (e.g. 4.5) if the user gives a price — never a string
   - "servings": number if an explicit quantity is given for that item
   - If the user states macros or serving details, include them using Food model field names, e.g.
     "calories", "protein", "fat", "carbohydrates", "serving_size", "unit", "food_group"
4. Do NOT query, look up, or infer missing nutrition — omit keys you are not sure about

Required JSON format:
[
  {{"name": "food name", "metadata": {{"brand": "Brand Name", "cost": 3.5}}}}
]

Examples:
Input: "3 brown eggs from Trader Joe's"
Output: [{{"name": "brown eggs", "metadata": {{"brand": "Trader Joes", "servings": 3}}}}]

Input: "chicken breast and rice"
Output: [{{"name": "chicken breast", "metadata": {{}}}}, {{"name": "rice", "metadata": {{}}}}]

Input: "$5 turkey sandwich"
Output: [{{"name": "turkey sandwich", "metadata": {{"cost": 5}}}}]

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
6. Never leave numeric nutrition fields null - use 0 if truly unknown
7. **cost**: required numeric USD — your best estimate of typical US retail price for **one serving** as described (single banana, one restaurant meal, 100g dry rice, etc.). Use 0 only if you cannot estimate at all.
8. Use appropriate serving sizes (e.g., 100g for most foods, 1 cup for liquids, 1 item for whole items)
9. Be realistic with micronutrients - don't make up excessive vitamin/mineral values

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
  "cost": 2.49
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
    
    def parse_food_input(self, input_text: str, create_meal: bool = False, preview_only: bool = False) -> Dict[str, Any]:
        """
        Parse food input and process all foods.
        
        Args:
            input_text: Natural language food description
            create_meal: If True, create a meal from all parsed foods
            preview_only: If True, only parse and return preview without logging
            
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
                    'error': processed.get('error'),
                    # Hints from the parse step (brand, user-mentioned price, etc.) for client preview
                    'metadata': processed.get('metadata') or {},
                }
                
                # Add food info if available
                if processed.get('food_object'):
                    food = processed['food_object']
                    serializable_processed['food'] = {
                        'food_id': food.food_id,
                        'food_name': food.food_name,
                        'serving_size': float(food.serving_size),
                        'unit': food.unit,
                        'calories': float(food.calories),
                        'protein': float(food.protein),
                        'fat': float(food.fat),
                        'carbohydrates': float(food.carbohydrates),
                        'fiber': float(food.fiber),
                        'sodium': float(food.sodium),
                        'sugar': float(food.sugar),
                        'saturated_fat': float(food.saturated_fat),
                        'trans_fat': float(food.trans_fat),
                        'calcium': float(food.calcium),
                        'iron': float(food.iron),
                        'magnesium': float(food.magnesium),
                        'cholesterol': float(food.cholesterol),
                        'vitamin_a': float(food.vitamin_a),
                        'vitamin_c': float(food.vitamin_c),
                        'vitamin_d': float(food.vitamin_d),
                        'caffeine': float(food.caffeine),
                        'food_group': food.food_group,
                        'brand': food.brand or '',
                        # Use `is not None` so Decimal('0') is included (truthiness would drop zero)
                        'cost': float(food.cost) if food.cost is not None else None
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
            
            # Step 3: Create food logs (skip if preview_only)
            if not preview_only:
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
                
                # Step 4: Optionally create meal (skip if preview_only)
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
    
    def _coerce_cost_value(self, value: Any) -> Optional[Any]:
        if value is None:
            return None
        if isinstance(value, (int, float, Decimal)):
            return value
        if isinstance(value, str):
            s = value.strip()
            if not s:
                return None
            m = re.search(r'[\d.]+', s.replace(',', ''))
            if not m:
                return None
            try:
                return float(m.group(0))
            except ValueError:
                return None
        return None

    def _normalize_parsed_metadata(self, metadata: Any) -> Dict:
        """Lower-case keys, map price→cost, and coerce cost from strings like \"$4.50\"."""
        if not isinstance(metadata, dict):
            return {}
        normalized: Dict[str, Any] = {}
        for k, v in metadata.items():
            if not isinstance(k, str):
                continue
            normalized[k.strip().lower()] = v
        if 'cost' not in normalized and 'price' in normalized:
            normalized['cost'] = normalized.get('price')
        coerced = self._coerce_cost_value(normalized.get('cost'))
        if coerced is not None:
            normalized['cost'] = coerced
        elif 'cost' in normalized:
            normalized.pop('cost', None)
        return normalized

    def _process_single_food(self, food_data: Dict) -> Dict:
        """
        Create a Food row: merge user-stated parse metadata with OpenAI-generated nutrition
        (same pipeline as Food Creator → /openai/generate-metadata/).
        """
        name = food_data.get('name', '').strip()
        metadata = self._normalize_parsed_metadata(food_data.get('metadata', {}) or {})

        try:
            servings = Decimal(str(metadata.get('servings', '1')))
        except Exception:
            servings = Decimal('1')

        result = {
            'name': name,
            'metadata': metadata,
            'servings': servings,
            'source': 'food_new',
            'food_object': None,
            'error': None,
        }

        if not name:
            result['error'] = 'Missing food name'
            return result

        try:
            meta_for_ai = dict(metadata)
            meta_for_ai.pop('servings', None)
            try:
                complete = self.generate_missing_metadata(name, meta_for_ai)
                result['food_object'] = self._persist_food_row(name, complete)
            except Exception as gen_err:
                logger.warning(
                    'OpenAI metadata generation failed for parsed food %r (%s); using defaults only',
                    name,
                    gen_err,
                )
                result['food_object'] = self._create_new_food(name, metadata)
        except Exception as e:
            logger.exception('Failed to create food from parse step')
            result['error'] = str(e)

        return result

    def _persist_food_row(self, base_name: str, complete_metadata: Dict) -> Food:
        """
        Insert a Food row from a full metadata dict (already merged / ensured).
        """
        complete_metadata = self._ensure_complete_metadata(dict(complete_metadata))
        food_name = base_name.strip()

        complete_metadata['food_name'] = food_name
        complete_metadata['make_public'] = False
        complete_metadata['created_by'] = self.user

        numeric_fields = (
            'serving_size', 'calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sodium', 'sugar',
            'saturated_fat', 'trans_fat', 'calcium', 'iron', 'magnesium', 'cholesterol',
            'vitamin_a', 'vitamin_c', 'vitamin_d', 'caffeine',
        )
        for field in numeric_fields:
            if field in complete_metadata and complete_metadata[field] is not None:
                complete_metadata[field] = Decimal(str(complete_metadata[field]))
        if complete_metadata.get('cost') is not None:
            complete_metadata['cost'] = Decimal(str(complete_metadata['cost']))

        return Food.objects.create(**complete_metadata)

    def _create_new_food(self, name: str, metadata: Dict) -> Food:
        """
        Persist a food using only parse metadata merged with numeric defaults (zeros / other).
        Does not call OpenAI.
        """
        complete_metadata = self._ensure_complete_metadata(self._get_default_metadata(metadata or {}))
        return self._persist_food_row(name, complete_metadata)
    
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
        
        # Fill in any missing fields with defaults (treat blank strings as missing except brand)
        for key, default_value in defaults.items():
            cur = valid_metadata.get(key, None)
            missing = key not in valid_metadata or cur is None
            if isinstance(cur, str) and cur.strip() == '' and key != 'brand':
                missing = True
            if missing:
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

