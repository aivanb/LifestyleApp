"""
Body Metrics Calculation Service

Provides comprehensive body metrics calculations including:
- BMI, BMR, TDEE calculations
- Body composition ratios
- Fitness ranking system
- Goal-based macro calculations
- Weight change recommendations

All calculations follow standard medical and fitness formulas.
"""

import math
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from datetime import date, datetime


class BodyMetricsService:
    """
    Service for calculating body metrics and fitness rankings.
    
    Provides comprehensive calculations for:
    - Body Mass Index (BMI)
    - Basal Metabolic Rate (BMR) 
    - Total Daily Energy Expenditure (TDEE)
    - Body composition ratios
    - Fitness ranking system
    - Macro goal calculations
    """
    
    # Activity level multipliers for TDEE calculation
    ACTIVITY_MULTIPLIERS = {
        'sedentary': 1.2,      # Little to no exercise
        'light': 1.375,        # Light exercise 1-3 days/week
        'moderate': 1.55,      # Moderate exercise 3-5 days/week
        'active': 1.725,       # Heavy exercise 6-7 days/week
        'very_active': 1.9     # Very heavy exercise, physical job
    }
    
    # Fitness ranking thresholds (BMI-based for general fitness)
    FITNESS_RANKS = {
        'dirt': (0, 15),           # Underweight
        'gravel': (15, 16),        # Severely underweight
        'tin': (16, 18.5),         # Underweight
        'aluminum': (18.5, 20),    # Normal weight (lower)
        'lead': (20, 22),          # Normal weight
        'bronze': (22, 24),        # Normal weight (upper)
        'copper': (24, 26),        # Overweight (lower)
        'iron': (26, 28),          # Overweight
        'quartz': (28, 30),         # Overweight (upper)
        'gold': (30, 32),          # Obese Class I
        'ruby': (32, 35),          # Obese Class I (upper)
        'crystal': (35, 40),       # Obese Class II
        'emerald': (40, 45),       # Obese Class II (upper)
        'diamond': (45, 50),       # Obese Class III
        'titanium': (50, 60),      # Super obese
        'platinum': (60, 70),      # Hyper obese
        'mithril': (70, 100)       # Ultra obese
    }
    
    def __init__(self, user_data: Dict):
        """
        Initialize with user data.
        
        Args:
            user_data: Dict containing user information:
                - height: Height in cm
                - weight: Current weight in kg
                - age: Age in years
                - gender: 'male', 'female', or 'other'
                - activity_level: Activity level name
                - birthday: Date of birth
                - measurements: Dict with body measurements
        """
        self.height = float(user_data.get('height', 0))  # cm
        self.weight = float(user_data.get('weight', 0))   # kg
        self.age = self._calculate_age(user_data.get('birthday'))
        self.gender = user_data.get('gender', 'other')
        self.activity_level = user_data.get('activity_level', 'sedentary')
        self.measurements = user_data.get('measurements', {})
    
    def _calculate_age(self, birthday) -> int:
        """Calculate age from birthday."""
        if not birthday:
            return 0
        
        if isinstance(birthday, str):
            birthday = datetime.strptime(birthday, '%Y-%m-%d').date()
        elif isinstance(birthday, datetime):
            birthday = birthday.date()
        
        today = date.today()
        return today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))
    
    def calculate_bmi(self) -> float:
        """
        Calculate Body Mass Index.
        
        Formula: BMI = weight(kg) / height(m)²
        
        Returns:
            BMI value rounded to 1 decimal place
        """
        if self.height <= 0 or self.weight <= 0:
            return 0.0
        
        height_m = self.height / 100
        bmi = self.weight / (height_m ** 2)
        return round(bmi, 1)
    
    def calculate_bmr(self) -> float:
        """
        Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation.
        
        Formula:
        - Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
        - Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
        
        Returns:
            BMR in calories per day
        """
        if self.height <= 0 or self.weight <= 0 or self.age <= 0:
            return 0.0
        
        if self.gender == 'male':
            bmr = (10 * self.weight) + (6.25 * self.height) - (5 * self.age) + 5
        else:  # female or other
            bmr = (10 * self.weight) + (6.25 * self.height) - (5 * self.age) - 161
        
        return round(bmr, 0)
    
    def calculate_tdee(self) -> float:
        """
        Calculate Total Daily Energy Expenditure.
        
        Formula: TDEE = BMR × Activity Multiplier
        
        Returns:
            TDEE in calories per day
        """
        bmr = self.calculate_bmr()
        if bmr <= 0:
            return 0.0
        
        multiplier = self.ACTIVITY_MULTIPLIERS.get(self.activity_level.lower(), 1.2)
        tdee = bmr * multiplier
        
        return round(tdee, 0)
    
    def calculate_waist_to_height_ratio(self) -> float:
        """
        Calculate Waist-to-Height Ratio.
        
        Formula: WHtR = waist(cm) / height(cm)
        
        Returns:
            WHtR ratio rounded to 3 decimal places
        """
        waist = self.measurements.get('waist', 0)
        if waist <= 0 or self.height <= 0:
            return 0.0
        
        ratio = waist / self.height
        return round(ratio, 3)
    
    def calculate_waist_to_shoulder_ratio(self) -> float:
        """
        Calculate Waist-to-Shoulder Ratio.
        
        Formula: WSr = waist(cm) / shoulder(cm)
        
        Returns:
            WSr ratio rounded to 3 decimal places
        """
        waist = self.measurements.get('waist', 0)
        shoulder = self.measurements.get('shoulder', 0)
        
        if waist <= 0 or shoulder <= 0:
            return 0.0
        
        ratio = waist / shoulder
        return round(ratio, 3)
    
    def calculate_legs_to_height_ratio(self) -> float:
        """
        Calculate Legs-to-Height Ratio.
        
        Formula: LHr = leg(cm) / height(cm)
        
        Returns:
            LHr ratio rounded to 3 decimal places
        """
        leg = self.measurements.get('leg', 0)
        if leg <= 0 or self.height <= 0:
            return 0.0
        
        ratio = leg / self.height
        return round(ratio, 3)
    
    def calculate_body_composition(self) -> Dict[str, float]:
        """
        Calculate body composition percentages.
        
        Uses simplified formulas for fat and lean mass estimation:
        - Fat Mass %: Based on BMI and gender
        - Lean Mass %: 100% - Fat Mass %
        
        Returns:
            Dict with fat_mass_percentage and lean_mass_percentage
        """
        bmi = self.calculate_bmi()
        
        if bmi <= 0:
            return {'fat_mass_percentage': 0.0, 'lean_mass_percentage': 0.0}
        
        # Simplified fat percentage estimation
        if self.gender == 'male':
            if bmi < 18.5:
                fat_percentage = 8 + (18.5 - bmi) * 2
            elif bmi <= 25:
                fat_percentage = 8 + (bmi - 18.5) * 1.2
            else:
                fat_percentage = 15 + (bmi - 25) * 1.5
        else:  # female
            if bmi < 18.5:
                fat_percentage = 15 + (18.5 - bmi) * 2
            elif bmi <= 25:
                fat_percentage = 15 + (bmi - 18.5) * 1.2
            else:
                fat_percentage = 25 + (bmi - 25) * 1.5
        
        # Clamp values to reasonable ranges
        fat_percentage = max(3, min(50, fat_percentage))
        lean_percentage = 100 - fat_percentage
        
        return {
            'fat_mass_percentage': round(fat_percentage, 1),
            'lean_mass_percentage': round(lean_percentage, 1)
        }
    
    def calculate_ffbmi(self) -> float:
        """
        Calculate Fat-Free Body Mass Index.
        
        Formula: FFBMI = (weight(kg) × (100 - fat%) / 100) / (height(m)²)
        
        Returns:
            FFBMI rounded to 1 decimal place
        """
        body_comp = self.calculate_body_composition()
        fat_percentage = body_comp['fat_mass_percentage']
        
        if self.height <= 0 or self.weight <= 0:
            return 0.0
        
        lean_mass = self.weight * (100 - fat_percentage) / 100
        height_m = self.height / 100
        ffbmi = lean_mass / (height_m ** 2)
        
        return round(ffbmi, 1)
    
    def get_fitness_rank(self) -> Dict[str, any]:
        """
        Get current fitness rank and next rank requirements.
        
        Returns:
            Dict with current rank, next rank, and requirements
        """
        bmi = self.calculate_bmi()
        
        if bmi <= 0:
            return {
                'current_rank': 'unknown',
                'next_rank': 'unknown',
                'current_bmi': bmi,
                'next_rank_bmi': 0,
                'bmi_to_next': 0
            }
        
        # Find current rank
        current_rank = 'unknown'
        for rank, (min_bmi, max_bmi) in self.FITNESS_RANKS.items():
            if min_bmi <= bmi < max_bmi:
                current_rank = rank
                break
        
        # Find next rank
        ranks = list(self.FITNESS_RANKS.keys())
        current_index = ranks.index(current_rank) if current_rank in ranks else -1
        
        if current_index >= 0 and current_index < len(ranks) - 1:
            next_rank = ranks[current_index + 1]
            next_rank_bmi = self.FITNESS_RANKS[next_rank][0]
            bmi_to_next = next_rank_bmi - bmi
        else:
            next_rank = 'max'
            next_rank_bmi = 0
            bmi_to_next = 0
        
        return {
            'current_rank': current_rank,
            'next_rank': next_rank,
            'current_bmi': bmi,
            'next_rank_bmi': next_rank_bmi,
            'bmi_to_next': round(bmi_to_next, 1)
        }
    
    def calculate_macro_goals(self, weight_goal: float, timeframe_weeks: int) -> Dict[str, any]:
        """
        Calculate macro goals based on weight change goal and timeframe.
        
        Args:
            weight_goal: Target weight in kg
            timeframe_weeks: Timeframe in weeks to achieve goal
            
        Returns:
            Dict with calculated macros and warnings
        """
        if self.weight <= 0 or weight_goal <= 0 or timeframe_weeks <= 0:
            return {
                'success': False,
                'error': 'Invalid input parameters'
            }
        
        weight_change = weight_goal - self.weight
        weekly_change = weight_change / timeframe_weeks
        
        # Calculate calorie adjustment
        # 1 lb ≈ 0.45 kg ≈ 3500 calories
        # So 1 kg ≈ 7778 calories
        calories_per_kg = 7778
        weekly_calorie_change = weekly_change * calories_per_kg
        daily_calorie_change = weekly_calorie_change / 7
        
        tdee = self.calculate_tdee()
        target_calories = tdee + daily_calorie_change
        
        # Calculate macros (standard ratios)
        protein_per_kg = 2.2 if self.gender == 'male' else 1.8  # g per kg body weight
        fat_percentage = 0.25  # 25% of calories from fat
        carb_percentage = 0.45  # 45% of calories from carbs
        
        protein_grams = self.weight * protein_per_kg
        fat_grams = (target_calories * fat_percentage) / 9  # 9 cal/g fat
        carb_grams = (target_calories * carb_percentage) / 4  # 4 cal/g carbs
        
        # Additional nutrients (comprehensive)
        fiber_grams = max(25, self.weight * 0.4)  # 0.4g per kg, min 25g
        sodium_mg = 2300  # Standard recommendation
        
        # Sugar (limit to 10% of calories)
        sugar_calories = target_calories * 0.1
        sugar_grams = sugar_calories / 4  # 4 cal/g sugar
        
        # Saturated fat (limit to 10% of calories)
        saturated_fat_calories = target_calories * 0.1
        saturated_fat_grams = saturated_fat_calories / 9  # 9 cal/g fat
        
        # Trans fat (minimize)
        trans_fat_grams = 0  # Ideally 0
        
        # Micronutrients (based on weight and gender)
        if self.gender == 'male':
            calcium_mg = 1000
            iron_mg = 8
            magnesium_mg = 400
            vitamin_a_mcg = 900
            vitamin_c_mg = 90
            vitamin_d_iu = 600
        else:  # female
            calcium_mg = 1000
            iron_mg = 18  # Higher for women
            magnesium_mg = 310
            vitamin_a_mcg = 700
            vitamin_c_mg = 75
            vitamin_d_iu = 600
        
        # Cholesterol (limit to 300mg)
        cholesterol_mg = 300
        
        # Caffeine (moderate intake)
        caffeine_mg = 400  # Safe daily limit
        
        # Warnings
        warnings = []
        if abs(weekly_change) > 1.0:  # More than 1 kg per week
            warnings.append("Weight change goal is aggressive. Consider extending timeframe.")
        
        if target_calories < 1200:  # Minimum safe calories
            warnings.append("Target calories below minimum safe level (1200).")
            target_calories = 1200
        
        if target_calories > 4000:  # Very high calories
            warnings.append("Target calories very high. Consider reducing goal.")
        
        return {
            'success': True,
            'calories': round(target_calories, 0),
            'protein': round(protein_grams, 1),
            'fat': round(fat_grams, 1),
            'carbohydrates': round(carb_grams, 1),
            'fiber': round(fiber_grams, 1),
            'sodium': round(sodium_mg, 0),
            'sugar': round(sugar_grams, 1),
            'saturated_fat': round(saturated_fat_grams, 1),
            'trans_fat': round(trans_fat_grams, 1),
            'calcium': round(calcium_mg, 0),
            'iron': round(iron_mg, 1),
            'magnesium': round(magnesium_mg, 0),
            'cholesterol': round(cholesterol_mg, 0),
            'vitamin_a': round(vitamin_a_mcg, 0),
            'vitamin_c': round(vitamin_c_mg, 0),
            'vitamin_d': round(vitamin_d_iu, 0),
            'caffeine': round(caffeine_mg, 0),
            'weekly_weight_change': round(weekly_change, 2),
            'warnings': warnings,
            'timeframe_weeks': timeframe_weeks
        }
    
    def get_all_metrics(self) -> Dict[str, any]:
        """
        Get all calculated body metrics.
        
        Returns:
            Comprehensive dict with all metrics
        """
        body_comp = self.calculate_body_composition()
        fitness_rank = self.get_fitness_rank()
        
        return {
            'bmi': self.calculate_bmi(),
            'bmr': self.calculate_bmr(),
            'tdee': self.calculate_tdee(),
            'waist_to_height_ratio': self.calculate_waist_to_height_ratio(),
            'waist_to_shoulder_ratio': self.calculate_waist_to_shoulder_ratio(),
            'legs_to_height_ratio': self.calculate_legs_to_height_ratio(),
            'fat_mass_percentage': body_comp['fat_mass_percentage'],
            'lean_mass_percentage': body_comp['lean_mass_percentage'],
            'ffbmi': self.calculate_ffbmi(),
            'fitness_rank': fitness_rank,
            'measurements': self.measurements,
            'user_data': {
                'height': self.height,
                'weight': self.weight,
                'age': self.age,
                'gender': self.gender,
                'activity_level': self.activity_level
            }
        }

