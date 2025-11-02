"""
Comprehensive Dummy Data Generation

This module generates realistic test data for one user (dummyUser) spanning
from 4/15/2025 to 10/31/2025. This data is useful for development, testing,
and demonstration purposes.

Generated Data Specifications:
- 1 user (username: dummyUser, password: dummypass123)
- Date range: 4/15/2025 - 10/31/2025
- All required tables filled with realistic, believable data for a healthy adult male
- Data includes realistic fluctuations and patterns
"""

import sys
import os
from datetime import datetime, timedelta, time, date
from decimal import Decimal
import random

# Add the parent directory to the Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from django.contrib.auth.hashers import make_password
from django.db import connection
from apps.users.models import User, AccessLevel, Unit, ActivityLevel, UserGoal
from apps.foods.models import Food, Meal, MealFood
from apps.workouts.models import (
    Workout, Muscle, WorkoutLog, MuscleLog, WorkoutMuscle, 
    Split, SplitDay, SplitDayTarget
)
from apps.logging.models import (
    FoodLog, WeightLog, BodyMeasurementLog, WaterLog, StepsLog, CardioLog
)
from apps.health.models import SleepLog, HealthMetricsLog
from apps.analytics.models import ApiUsageLog, ErrorLog

# Date range
START_DATE = date(2025, 4, 15)
END_DATE = date(2025, 10, 31)

# Fixed dates from specifications
WEIGHT_GOAL_CHANGE_DATE = date(2025, 7, 26)
CALORIES_CHANGE_DATE = date(2025, 7, 26)
PPL_START_DATE = date(2025, 6, 20)
UPPER_LOWER_START_DATE = date(2025, 4, 15)
MUSCLE_LOG_DATE_1 = date(2025, 4, 15)
MUSCLE_LOG_DATE_2 = date(2025, 8, 5)

DUMMY_USER_USERNAME = 'dummyUser'
DUMMY_USER_PASSWORD = 'dummypass123'


def create_user():
    """Create the dummy user."""
    print("Creating dummy user...")
    
    user_access = AccessLevel.objects.get(role_name='user')
    imperial_unit = Unit.objects.get(unit_name='lb')
    
    user, created = User.objects.get_or_create(
        username=DUMMY_USER_USERNAME,
        defaults={
            'username': DUMMY_USER_USERNAME,
            'password': make_password(DUMMY_USER_PASSWORD),
            'email': 'dummyuser@example.com',
            'first_name': 'Dummy',
            'last_name': 'User',
            'access_level': user_access,
            'height': Decimal('72.00'),  # 6 feet in inches
            'birthday': date(1990, 5, 15),
            'gender': 'male',
            'unit_preference': imperial_unit,
            'activity_level': ActivityLevel.objects.get(name='Very Active'),
        }
    )
    
    print(f"[OK] User {'created' if created else 'already exists'}: {user.username}")
    return user


def create_user_goals(user):
    """Create user goals at specified dates."""
    print("Creating user goals...")
    
    # Goal at 4/15/2025
    goal1 = UserGoal.objects.create(
        user=user,
        calories_goal=2500,
        weight_goal=Decimal('165.00'),
        protein_goal=Decimal('180.00'),
        fat_goal=Decimal('50.00'),
        carbohydrates_goal=Decimal('200.00'),
        created_at=datetime.combine(START_DATE, time(8, 0))
    )
    
    # Goal at 7/26/2025
    goal2 = UserGoal.objects.create(
        user=user,
        calories_goal=3200,
        weight_goal=Decimal('195.00'),
        protein_goal=Decimal('220.00'),  # Increased for bulking
        fat_goal=Decimal('80.00'),  # Increased
        carbohydrates_goal=Decimal('350.00'),  # Increased
        created_at=datetime.combine(WEIGHT_GOAL_CHANGE_DATE, time(8, 0))
    )
    
    print("[OK] Created 2 user goals")
    return [goal1, goal2]


def create_foods():
    """Create 50 unique foods, with 5 duplicate names with different brands."""
    print("Creating foods...")
    
    food_names_base = [
        'Chicken Breast', 'Ground Beef', 'Salmon', 'Tuna', 'Eggs',
        'Greek Yogurt', 'Cottage Cheese', 'Milk', 'Cheese', 'Turkey',
        'White Rice', 'Brown Rice', 'Quinoa', 'Oats', 'Whole Wheat Bread',
        'Sweet Potato', 'Potato', 'Pasta', 'Bagel', 'Cereal',
        'Broccoli', 'Spinach', 'Kale', 'Carrots', 'Peppers',
        'Apple', 'Banana', 'Orange', 'Berries', 'Grapes',
        'Almonds', 'Peanuts', 'Walnuts', 'Peanut Butter', 'Almond Butter',
        'Olive Oil', 'Avocado', 'Olives', 'Hummus', 'Tofu',
        'Protein Powder', 'Whey Protein', 'Casein Protein', 'Bread', 'Toast',
        'Cookies', 'Chips', 'Crackers', 'Nuts', 'Seeds'
    ]
    
    # Create 50 unique foods (45 unique + 5 duplicates with brands = 50 total)
    foods_data = []
    brands_for_duplicates = ['Brand A', 'Brand B', 'Generic', 'Organic', 'Premium']
    
    # First create 45 unique foods
    for i, name in enumerate(food_names_base[:45]):
        food_group = 'protein' if i < 10 else ('grain' if i < 20 else ('vegetable' if i < 25 else ('fruit' if i < 30 else 'other')))
        foods_data.append({
            'food_name': name,
            'food_group': food_group,
            'brand': None,
        })
    
    # Create 5 duplicates with different brands (using names from first 10)
    duplicate_names = ['Chicken Breast', 'Bread', 'Protein Powder', 'Milk', 'Cereal']
    for dup_name, brand in zip(duplicate_names, brands_for_duplicates):
        original_group = next(f['food_group'] for f in foods_data if f['food_name'] == dup_name)
        foods_data.append({
            'food_name': f"{dup_name} ({brand})",
            'food_group': original_group,
            'brand': brand,
        })
    
    created_foods = []
    for food_data in foods_data:
        # Generate realistic nutritional values
        base_calories = random.randint(50, 400)
        base_protein = random.randint(5, 40) if food_data['food_group'] == 'protein' else random.randint(0, 15)
        base_carbs = random.randint(10, 60) if food_data['food_group'] in ['grain', 'fruit'] else random.randint(0, 25)
        base_fat = random.randint(0, 20)
        
        food, created = Food.objects.get_or_create(
            food_name=food_data['food_name'],
            defaults={
                'serving_size': Decimal(str(random.uniform(50, 200))),
                'unit': random.choice(['g', 'oz', 'cup', 'piece']),
                'calories': Decimal(str(base_calories)),
                'protein': Decimal(str(base_protein)),
                'fat': Decimal(str(base_fat)),
                'carbohydrates': Decimal(str(base_carbs)),
                'fiber': Decimal(str(random.uniform(0, 8))),
                'sodium': Decimal(str(random.uniform(0, 800))),
                'sugar': Decimal(str(random.uniform(0, 25))),
                'saturated_fat': Decimal(str(base_fat * 0.3)),
                'trans_fat': Decimal('0'),
                'calcium': Decimal(str(random.uniform(0, 300))),
                'iron': Decimal(str(random.uniform(0, 5))),
                'magnesium': Decimal(str(random.uniform(0, 100))),
                'cholesterol': Decimal(str(random.uniform(0, 100) if food_data['food_group'] == 'protein' else 0)),
                'vitamin_a': Decimal(str(random.uniform(0, 500))),
                'vitamin_c': Decimal(str(random.uniform(0, 100))),
                'vitamin_d': Decimal(str(random.uniform(0, 10))),
                'caffeine': Decimal('0'),
                'food_group': food_data['food_group'],
                'brand': food_data['brand'],
                'make_public': True
            }
        )
        created_foods.append(food)
    
    print(f"[OK] Created {len(created_foods)} foods")
    return created_foods


def create_meals(user, foods):
    """Create 10 unique meals with 2-10 foods each."""
    print("Creating meals...")
    
    meal_names = [
        'Breakfast Platter', 'Protein Smoothie', 'Grilled Chicken Bowl',
        'Salmon and Rice', 'Turkey Wrap', 'Vegetable Stir Fry',
        'Oatmeal Bowl', 'Protein Pancakes', 'Post Workout Shake',
        'Evening Snack Mix'
    ]
    
    created_meals = []
    for meal_name in meal_names:
        meal, created = Meal.objects.get_or_create(
            user=user,
            meal_name=meal_name
        )
        
        # Add 2-10 foods to each meal (only if newly created or clear existing)
        if created:
            num_foods = random.randint(2, 10)
            selected_foods = random.sample(foods, min(num_foods, len(foods)))
            
            for food in selected_foods:
                MealFood.objects.get_or_create(
                    meal=meal,
                    food=food,
                    defaults={'servings': Decimal(str(random.uniform(0.5, 3.0)))}
                )
        
        created_meals.append(meal)
    
    print(f"[OK] Created {len(created_meals)} meals")
    return created_meals


def create_workouts(user):
    """Create 50 unique workouts."""
    print("Creating workouts...")
    
    workout_names = [
        'Barbell Bench Press', 'Barbell Squat', 'Deadlift', 'Overhead Press',
        'Barbell Row', 'Pull-ups', 'Dips', 'Barbell Curls', 'Tricep Extensions',
        'Lateral Raises', 'Front Raises', 'Rear Delt Flyes', 'Cable Crossover',
        'Incline Dumbbell Press', 'Decline Bench Press', 'Dumbbell Flyes',
        'Lat Pulldown', 'Seated BAR Row', 'T-Bar Row', 'Cable Row',
        'Leg Press', 'Leg Curls', 'Leg Extensions', 'Romanian Deadlift',
        'Walking Lunges', 'Bulgarian Split Squats', 'Calf Raises',
        'Barbell Shrugs', 'Face Pulls', 'Cable Lateral Raises',
        'Hammer Curls', 'Preacher Curls', 'Concentration Curls',
        'Close-Grip Bench Press', 'Tricep Pushdowns', 'Overhead Tricep Extension',
        'Hanging Leg Raises', 'Crunches', 'Russian Twists', 'Planks',
        'Dumbbell Bench Press', 'Dumbbell Shoulder Press', 'Dumbbell Rows',
        'Dumbbell Lunges', 'Dumbbell Squats', 'Goblet Squats',
        'Cable Flyes', 'Cable Curls', 'Machine Chest Press', 'Machine Row'
    ]
    
    workout_types = ['barbell', 'dumbbell', 'cable_machine', 'plate_machine', 'bodyweight']
    locations = ['Home Gym', 'Commercial Gym', 'Outdoor']
    
    created_workouts = []
    muscles = list(Muscle.objects.all())
    
    for workout_name in workout_names[:50]:
        workout, created = Workout.objects.get_or_create(
            user=user,
            workout_name=workout_name,
            defaults={
                'type': random.choice(workout_types),
                'location': random.choice(locations),
                'make_public': True
            }
        )
        
        # Assign muscles to workout (1-5 muscles per workout) - only if newly created
        if created:
            num_muscles = random.randint(1, 5)
            selected_muscles = random.sample(muscles, min(num_muscles, len(muscles)))
            
            for muscle in selected_muscles:
                WorkoutMuscle.objects.get_or_create(
                    workout=workout,
                    muscle=muscle,
                    defaults={'activation_rating': random.randint(50, 100)}
                )
        
        created_workouts.append(workout)
    
    print(f"[OK] Created {len(created_workouts)} workouts")
    return created_workouts


def create_splits(user):
    """Create PPL and Upper Lower splits with specified configurations."""
    print("Creating splits...")
    
    all_muscles = list(Muscle.objects.all())
    leg_muscles = [m for m in all_muscles if m.muscle_group == 'legs']
    other_muscles = [m for m in all_muscles if m.muscle_group != 'legs']
    
    # Create Upper Lower split (start: 4/15/2025)
    upper_lower_split, ul_created = Split.objects.get_or_create(
        user=user,
        split_name='Upper Lower',
        defaults={'start_date': UPPER_LOWER_START_DATE}
    )
    
    if ul_created:
        upper_day, _ = SplitDay.objects.get_or_create(
            split=upper_lower_split,
            day_name='Upper Body',
            defaults={'day_order': 1}
        )
        
        lower_abs_day, _ = SplitDay.objects.get_or_create(
            split=upper_lower_split,
            day_name='Lower Body and Abs',
            defaults={'day_order': 2}
        )
        
        rest_day_ul, _ = SplitDay.objects.get_or_create(
            split=upper_lower_split,
            day_name='Rest',
            defaults={'day_order': 3}
        )
    else:
        upper_day = SplitDay.objects.get(split=upper_lower_split, day_name='Upper Body')
        lower_abs_day = SplitDay.objects.get(split=upper_lower_split, day_name='Lower Body and Abs')
        rest_day_ul = SplitDay.objects.get(split=upper_lower_split, day_name='Rest')
    
    # Add targets for Upper Body (all non-leg muscles) - only if newly created
    if ul_created:
        for muscle in other_muscles:
            SplitDayTarget.objects.get_or_create(
                split_day=upper_day,
                muscle=muscle,
                defaults={'target_activation': 100}
            )
        
        # Add targets for Lower Body (all leg muscles + core)
        core_muscles = [m for m in all_muscles if m.muscle_group == 'core']
        for muscle in leg_muscles + core_muscles:
            SplitDayTarget.objects.get_or_create(
                split_day=lower_abs_day,
                muscle=muscle,
                defaults={'target_activation': 100}
            )
    
    # Create PPL split (start: 6/20/2025)
    ppl_split, ppl_created = Split.objects.get_or_create(
        user=user,
        split_name='PPL',
        defaults={'start_date': PPL_START_DATE}
    )
    
    if ppl_created:
        chest_triceps_day, _ = SplitDay.objects.get_or_create(
            split=ppl_split,
            day_name='Chest and Triceps',
            defaults={'day_order': 1}
        )
        
        back_biceps_forearms_day, _ = SplitDay.objects.get_or_create(
            split=ppl_split,
            day_name='Back Biceps Forearms',
            defaults={'day_order': 2}
        )
        
        leg_day, _ = SplitDay.objects.get_or_create(
            split=ppl_split,
            day_name='Leg',
            defaults={'day_order': 3}
        )
        
        rest_day_ppl, _ = SplitDay.objects.get_or_create(
            split=ppl_split,
            day_name='Rest',
            defaults={'day_order': 4}
        )
    else:
        chest_triceps_day = SplitDay.objects.get(split=ppl_split, day_name='Chest and Triceps')
        back_biceps_forearms_day = SplitDay.objects.get(split=ppl_split, day_name='Back Biceps Forearms')
        leg_day = SplitDay.objects.get(split=ppl_split, day_name='Leg')
        rest_day_ppl = SplitDay.objects.get(split=ppl_split, day_name='Rest')
    
    # Add targets for PPL (average 85 activation) - only if newly created
    if ppl_created:
        chest_muscles = [m for m in all_muscles if m.muscle_group == 'chest']
        tricep_muscles = [m for m in all_muscles if 'Triceps' in m.muscle_name or 'triceps' in m.muscle_name.lower()]
        back_muscles = [m for m in all_muscles if m.muscle_group == 'back']
        bicep_muscles = [m for m in all_muscles if 'Biceps' in m.muscle_name or 'Brachialis' in m.muscle_name or 'Brachioradialis' in m.muscle_name]
        forearm_muscles = [m for m in all_muscles if 'Forearm' in m.muscle_name]
        
        # Chest and Triceps
        for muscle in chest_muscles + tricep_muscles:
            SplitDayTarget.objects.get_or_create(
                split_day=chest_triceps_day,
                muscle=muscle,
                defaults={'target_activation': 85}
            )
        
        # Back, Biceps, Forearms
        for muscle in back_muscles + bicep_muscles + forearm_muscles:
            SplitDayTarget.objects.get_or_create(
                split_day=back_biceps_forearms_day,
                muscle=muscle,
                defaults={'target_activation': 85}
            )
        
        # Legs
        for muscle in leg_muscles:
            SplitDayTarget.objects.get_or_create(
                split_day=leg_day,
                muscle=muscle,
                defaults={'target_activation': 85}
            )
    
    print("[OK] Created 2 splits with days")
    return [upper_lower_split, ppl_split]


def create_muscle_logs(user):
    """
    Create muscle logs at specified dates.
    Note: MuscleLog has a unique constraint on (user, muscle_name), so we can only
    have one entry per user per muscle. The specifications call for:
    - First set: all muscles with priority 80 on 4/15/2025
    - Second set: leg muscles 60, all others 90 on 8/5/2025
    
    Since the constraint prevents having both sets simultaneously, and created_at
    has auto_now_add=True (so we can't set it manually), we'll create the second set
    (more recent) which represents the final state. We'll need to use raw SQL to set
    the created_at timestamp to the desired date.
    """
    print("Creating muscle logs...")
    
    from django.db import connection
    
    all_muscles = list(Muscle.objects.all())
    leg_muscles = [m for m in all_muscles if m.muscle_group == 'legs']
    other_muscles = [m for m in all_muscles if m.muscle_group != 'legs']
    
    # Delete any existing muscle logs for this user
    MuscleLog.objects.filter(user=user).delete()
    
    # Create second set with priorities from 8/5/2025
    muscle_logs_final = []
    for muscle in leg_muscles:
        muscle_logs_final.append(
            MuscleLog(
                user=user,
                muscle_name=muscle,
                priority=60
            )
        )
    
    for muscle in other_muscles:
        muscle_logs_final.append(
            MuscleLog(
                user=user,
                muscle_name=muscle,
                priority=90
            )
        )
    
    # Bulk create the muscle logs
    MuscleLog.objects.bulk_create(muscle_logs_final)
    
    # Update created_at using raw SQL since auto_now_add=True prevents manual setting
    target_date = datetime.combine(MUSCLE_LOG_DATE_2, time(8, 0))
    date_str = target_date.strftime('%Y-%m-%d %H:%M:%S')
    
    with connection.cursor() as cursor:
        cursor.execute(
            "UPDATE muscle_log SET created_at = %s WHERE user_id = %s",
            [date_str, user.user_id]
        )
    
    print("[OK] Created muscle logs (second set on 8/5/2025)")


def generate_api_usage_logs(user):
    """Generate API usage logs: 0-3 per day, 85% success, 15% error."""
    print("Generating API usage logs...")
    
    current_date = START_DATE
    logs_created = 0
    
    while current_date <= END_DATE:
        num_logs = random.randint(0, 3)
        
        for _ in range(num_logs):
            is_success = random.random() < 0.85
            log_time = datetime.combine(current_date, time(random.randint(8, 22), random.randint(0, 59)))
            
            ApiUsageLog.objects.create(
                user=user,
                request_type=random.choice(['meal_parsing', 'workout_suggestion', 'nutrition_analysis']),
                model_used=random.choice(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
                tokens_used=random.randint(100, 2000),
                cost=Decimal(str(random.uniform(0.01, 0.50))),
                response_time=Decimal(str(random.uniform(0.5, 5.0))),
                request='Sample API request',
                response='Sample API response' if is_success else 'Error occurred',
                success=is_success,
                error_message=None if is_success else 'Sample error message',
                created_at=log_time
            )
            logs_created += 1
        
        current_date += timedelta(days=1)
    
    print(f"[OK] Created {logs_created} API usage logs")


def generate_error_logs(user):
    """Generate 100 error logs dispersed throughout date range."""
    print("Generating error logs...")
    
    error_types = ['ValidationError', 'DatabaseError', 'APIError', 'AuthenticationError', 'NetworkError']
    total_days = (END_DATE - START_DATE).days + 1
    
    # Distribute 100 errors across the date range
    error_dates = random.sample([START_DATE + timedelta(days=i) for i in range(total_days)], min(100, total_days))
    
    for error_date in error_dates:
        ErrorLog.objects.create(
            user=user,
            error_type=random.choice(error_types),
            error_message=f'Sample error message for {error_date}',
            user_input=f'Sample user input for {error_date}',
            created_at=datetime.combine(error_date, time(random.randint(0, 23), random.randint(0, 59)))
        )
    
    print(f"[OK] Created {len(error_dates)} error logs")


def generate_body_measurement_logs(user):
    """Generate body measurement logs: 80% no data, 10% partial, 10% full."""
    print("Generating body measurement logs...")
    
    current_date = START_DATE
    base_upper_arm = Decimal('14.5')
    base_lower_arm = Decimal('12.0')
    base_waist = Decimal('32.0')
    base_shoulder = Decimal('46.0')
    base_leg = Decimal('24.0')
    base_calf = Decimal('15.0')
    
    # Slow increase over time
    day_counter = 0
    
    while current_date <= END_DATE:
        rand = random.random()
        
        if rand < 0.80:
            # No data - skip
            pass
        elif rand < 0.90:
            # Partial data
            measurements = {}
            fields = ['upper_arm', 'lower_arm', 'waist', 'shoulder', 'leg', 'calf']
            num_fields = random.randint(1, len(fields) - 1)
            selected_fields = random.sample(fields, num_fields)
            
            for field in selected_fields:
                base = locals()[f'base_{field}']
                # Slight variation, slow trend upward
                measurements[field] = base + Decimal(str(day_counter * 0.001)) + Decimal(str(random.uniform(-0.2, 0.2)))
            
            # Create with both date_time and created_at
            target_datetime = datetime.combine(current_date, time(8, 0))
            measurements['date_time'] = target_datetime
            log = BodyMeasurementLog.objects.create(user=user, **measurements)
            with connection.cursor() as cursor:
                date_str = target_datetime.strftime('%Y-%m-%d %H:%M:%S')
                cursor.execute(
                    "UPDATE body_measurement_log SET created_at = %s WHERE measurement_id = %s",
                    [date_str, log.measurement_id]
                )
        else:
            # Full data
            trend = day_counter * Decimal('0.001')
            fluctuation = Decimal(str(random.uniform(-0.3, 0.3)))
            
            # Create with both date_time and created_at
            target_datetime = datetime.combine(current_date, time(8, 0))
            log = BodyMeasurementLog.objects.create(
                user=user,
                upper_arm=base_upper_arm + trend + Decimal(str(random.uniform(-0.3, 0.3))),
                lower_arm=base_lower_arm + trend + Decimal(str(random.uniform(-0.2, 0.2))),
                waist=base_waist + trend + Decimal(str(random.uniform(-0.5, 0.5))),
                shoulder=base_shoulder + trend + Decimal(str(random.uniform(-0.3, 0.3))),
                leg=base_leg + trend + Decimal(str(random.uniform(-0.3, 0.3))),
                calf=base_calf + trend + Decimal(str(random.uniform(-0.2, 0.2))),
                date_time=target_datetime
            )
            with connection.cursor() as cursor:
                date_str = target_datetime.strftime('%Y-%m-%d %H:%M:%S')
                cursor.execute(
                    "UPDATE body_measurement_log SET created_at = %s WHERE measurement_id = %s",
                    [date_str, log.measurement_id]
                )
        
        current_date += timedelta(days=1)
        day_counter += 1
    
    print("[OK] Generated body measurement logs")


def generate_cardio_logs(user):
    """Generate cardio logs: 0-2 per day, 50% without heart_rate."""
    print("Generating cardio logs...")
    
    current_date = START_DATE
    cardio_types = ['Running', 'Cycling', 'Rowing', 'Elliptical', 'Swimming']
    
    while current_date <= END_DATE:
        num_logs = random.randint(0, 2)
        
        for _ in range(num_logs):
            has_heart_rate = random.random() < 0.50
            
            CardioLog.objects.create(
                user=user,
                cardio_type=random.choice(cardio_types),
                duration=Decimal(str(random.uniform(15, 60))),
                distance=Decimal(str(random.uniform(1, 5))),
                distance_unit='mile',
                calories_burned=random.randint(150, 600),
                heart_rate=random.randint(120, 180) if has_heart_rate else None,
                date_time=datetime.combine(current_date, time(random.randint(6, 20), random.randint(0, 59)))
            )
        
        current_date += timedelta(days=1)
    
    print("[OK] Generated cardio logs")


def generate_food_logs(user, foods):
    """Generate food logs: 5-15 per day, with specified calorie averages."""
    print("Generating food logs...")
    
    current_date = START_DATE
    
    # Calorie targets
    calories_per_day_period1 = 2500  # 4/15 - 7/25
    calories_per_day_period2 = 3200  # 7/26 - 10/31
    avg_protein = 180
    avg_carbs = 200
    avg_fats = 50
    
    while current_date <= END_DATE:
        # Determine period
        if current_date < CALORIES_CHANGE_DATE:
            target_calories = calories_per_day_period1
        else:
            target_calories = calories_per_day_period2
        
        # 5% of days have no rows
        if random.random() < 0.05:
            current_date += timedelta(days=1)
            continue
        
        # 5-15 rows per day
        num_entries = random.randint(5, 15)
        
        # Calculate total servings needed to hit calorie target (with fluctuation)
        calorie_multiplier = random.uniform(0.9, 1.1)  # -10% to +10%
        target_calories_adjusted = target_calories * calorie_multiplier
        
        total_calories = Decimal('0')
        total_protein = Decimal('0')
        total_carbs = Decimal('0')
        total_fats = Decimal('0')
        
        meal_times = [
            time(7, 0), time(9, 30), time(12, 0), time(15, 0),
            time(17, 30), time(20, 0), time(21, 30)
        ]
        
        entries_created = 0
        for i in range(num_entries):
            if i < len(meal_times):
                log_time = datetime.combine(current_date, meal_times[i])
            else:
                log_time = datetime.combine(current_date, time(random.randint(6, 22), random.randint(0, 59)))
            
            food = random.choice(foods)
            
            # Calculate servings to approximate daily targets
            if entries_created < num_entries - 1:
                # For most entries, use reasonable serving size
                servings = Decimal(str(random.uniform(0.5, 2.5)))
            else:
                # Last entry adjusts to hit target
                remaining_calories = Decimal(str(target_calories_adjusted)) - total_calories
                if remaining_calories > 0 and food.calories > 0:
                    servings = (remaining_calories / food.calories) * Decimal('1.2')  # Slight overestimate
                else:
                    servings = Decimal(str(random.uniform(0.5, 2.5)))
            
            # 10% of rows include voice input, ai response, tokens_used
            has_voice = random.random() < 0.10
            
            FoodLog.objects.create(
                user=user,
                food=food,
                meal=None,  # Can link to meals if needed
                servings=servings,
                measurement=food.unit,
                date_time=log_time,
                voice_input='Sample voice input' if has_voice else None,
                ai_response='Sample AI response' if has_voice else None,
                tokens_used=random.randint(50, 500) if has_voice else None
            )
            
            total_calories += food.calories * servings
            total_protein += food.protein * servings
            total_carbs += food.carbohydrates * servings
            total_fats += food.fat * servings
            entries_created += 1
        
        current_date += timedelta(days=1)
    
    print("[OK] Generated food logs")


def generate_health_metrics_logs(user):
    """Generate health metrics: 70% of days have one row, 40% partial data."""
    print("Generating health metrics logs...")
    
    current_date = START_DATE
    
    while current_date <= END_DATE:
        if random.random() < 0.70:
            # Create a row
            has_partial = random.random() < 0.40
            
            metrics = {}
            if not has_partial or random.random() < 0.5:
                metrics['resting_heart_rate'] = random.randint(55, 70)
            if not has_partial or random.random() < 0.5:
                metrics['blood_pressure_systolic'] = random.randint(110, 130)
            if not has_partial or random.random() < 0.5:
                metrics['blood_pressure_diastolic'] = random.randint(70, 85)
            if not has_partial or random.random() < 0.5:
                metrics['morning_energy'] = random.randint(5, 9)
            if not has_partial or random.random() < 0.5:
                metrics['stress_level'] = random.randint(2, 6)
            if not has_partial or random.random() < 0.5:
                metrics['mood'] = random.randint(6, 9)
            if not has_partial or random.random() < 0.5:
                metrics['soreness'] = random.randint(2, 7)
            if not has_partial or random.random() < 0.5:
                metrics['illness_level'] = random.randint(1, 2)
            
            HealthMetricsLog.objects.create(
                user=user,
                date_time=current_date,
                **metrics
            )
        
        current_date += timedelta(days=1)
    
    print("[OK] Generated health metrics logs")


def generate_sleep_logs(user):
    """Generate sleep logs: 70% of dates have one row, 40% missing sleep data."""
    print("Generating sleep logs...")
    
    current_date = START_DATE
    
    while current_date <= END_DATE:
        if random.random() < 0.70:
            bedtime_hour = random.randint(22, 23)  # 10 PM to 11:59 PM
            bedtime = time(bedtime_hour, random.randint(0, 59))
            
            wake_hour = random.randint(6, 8)
            wake_time = time(wake_hour, random.randint(0, 59))
            
            has_sleep_data = random.random() >= 0.40
            
            SleepLog.objects.create(
                user=user,
                date_time=current_date,
                time_went_to_bed=bedtime,
                time_got_out_of_bed=wake_time,
                time_fell_asleep=(datetime.combine(current_date, bedtime) + timedelta(minutes=random.randint(5, 30))).time(),
                time_in_light_sleep=random.randint(180, 300) if has_sleep_data else None,
                time_in_deep_sleep=random.randint(60, 120) if has_sleep_data else None,
                time_in_rem_sleep=random.randint(60, 120) if has_sleep_data else None,
                number_of_times_woke_up=random.randint(0, 3),
                resting_heart_rate=random.randint(55, 70) if has_sleep_data else None
            )
        
        current_date += timedelta(days=1)
    
    print("[OK] Generated sleep logs")


def generate_steps_logs(user):
    """Generate steps logs: 0-3 rows per day, average 10000 steps/day."""
    print("Generating steps logs...")
    
    current_date = START_DATE
    target_steps = 10000
    
    while current_date <= END_DATE:
        num_logs = random.randint(0, 3)
        steps_per_log = target_steps // max(num_logs, 1)
        
        for i in range(num_logs):
            # Distribute steps across logs with some variation
            if i == num_logs - 1:
                # Last log gets remainder + variation
                remaining = target_steps - (steps_per_log * (num_logs - 1))
                steps = remaining + random.randint(-500, 500)
            else:
                steps = steps_per_log + random.randint(-300, 300)
            
            StepsLog.objects.create(
                user=user,
                steps=max(0, steps),  # Ensure non-negative
                date_time=datetime.combine(current_date, time(random.randint(6, 23), random.randint(0, 59)))
            )
        
        current_date += timedelta(days=1)
    
    print("[OK] Generated steps logs")


def generate_water_logs(user):
    """Generate water logs: 0-10 rows per day, average 3.5 liters."""
    print("Generating water logs...")
    
    current_date = START_DATE
    target_liters = Decimal('3.5')
    
    while current_date <= END_DATE:
        num_logs = random.randint(0, 10)
        
        if num_logs > 0:
            liters_per_log = target_liters / Decimal(str(num_logs))
            
            for i in range(num_logs):
                amount = liters_per_log + Decimal(str(random.uniform(-0.2, 0.2)))
                amount = max(Decimal('0.1'), amount)  # Minimum 0.1 liters
                
                log_time = datetime.combine(current_date, time(random.randint(6, 22), random.randint(0, 59)))
                
                # Create with both date_time and created_at
                log = WaterLog.objects.create(user=user, amount=amount, unit='l', date_time=log_time)
                with connection.cursor() as cursor:
                    date_str = log_time.strftime('%Y-%m-%d %H:%M:%S')
                    cursor.execute(
                        "UPDATE water_log SET created_at = %s WHERE water_log_id = %s",
                        [date_str, log.water_log_id]
                    )
        
        current_date += timedelta(days=1)
    
    print("[OK] Generated water logs")


def generate_weight_logs(user):
    """Generate weight logs: 0-2 rows per day, with specified trends."""
    print("Generating weight logs...")
    
    current_date = START_DATE
    
    # Weight trends
    start_weight_1 = Decimal('185.0')  # 4/15/2025
    end_weight_1 = Decimal('162.0')  # 7/25/2025
    start_weight_2 = Decimal('162.0')  # 7/26/2025
    end_weight_2 = Decimal('193.0')  # 10/31/2025
    
    period_1_days = (CALORIES_CHANGE_DATE - START_DATE).days
    period_2_days = (END_DATE - CALORIES_CHANGE_DATE).days + 1
    
    weight_1 = start_weight_1
    weight_2 = start_weight_2
    
    day_counter_1 = 0
    day_counter_2 = 0
    
    while current_date <= END_DATE:
        num_logs = random.randint(0, 2)
        
        if current_date < CALORIES_CHANGE_DATE:
            # Period 1: 185 -> 162
            trend = (end_weight_1 - start_weight_1) / Decimal(str(period_1_days))
            weight = start_weight_1 + (trend * Decimal(str(day_counter_1)))
            weight += Decimal(str(random.uniform(-1.0, 1.0)))  # Daily fluctuation
            weight_1 = weight
            day_counter_1 += 1
        else:
            # Period 2: 162 -> 193
            trend = (end_weight_2 - start_weight_2) / Decimal(str(period_2_days))
            weight = start_weight_2 + (trend * Decimal(str(day_counter_2)))
            weight += Decimal(str(random.uniform(-1.0, 1.0)))
            weight_2 = weight
            day_counter_2 += 1
        
        for _ in range(num_logs):
            log_time = datetime.combine(current_date, time(random.randint(6, 9), random.randint(0, 59)))
            
            # Create with both date_time and created_at
            log = WeightLog.objects.create(user=user, weight=weight, weight_unit='lb', date_time=log_time)
            with connection.cursor() as cursor:
                date_str = log_time.strftime('%Y-%m-%d %H:%M:%S')
                cursor.execute(
                    "UPDATE weight_log SET created_at = %s WHERE weight_log_id = %s",
                    [date_str, log.weight_log_id]
                )
        
        current_date += timedelta(days=1)
    
    print("[OK] Generated weight logs")


def generate_workout_logs(user, workouts, splits):
    """Generate workout logs: 2-7 unique workouts per day with 1-4 sets."""
    print("Generating workout logs...")
    
    current_date = START_DATE
    
    # Determine active split for each date
    upper_lower_split = next(s for s in splits if s.split_name == 'Upper Lower')
    ppl_split = next(s for s in splits if s.split_name == 'PPL')
    
    # Get split days and their target muscles
    upper_lower_days = list(SplitDay.objects.filter(split=upper_lower_split))
    ppl_days = list(SplitDay.objects.filter(split=ppl_split))
    
    # Map dates to active split days
    def get_active_split_day(date):
        if date < PPL_START_DATE:
            # Upper Lower is active
            split = upper_lower_split
            days = upper_lower_days
        else:
            # PPL is active
            split = ppl_split
            days = ppl_days
        
        # Determine which day of the split
        if split.split_name == 'Upper Lower':
            # 3-day rotation
            day_index = ((date - split.start_date).days % 3)
            if day_index == 0:
                return next(d for d in days if d.day_name == 'Upper Body')
            elif day_index == 1:
                return next(d for d in days if d.day_name == 'Lower Body and Abs')
            else:
                return next(d for d in days if d.day_name == 'Rest')
        else:  # PPL
            # 4-day rotation
            day_index = ((date - split.start_date).days % 4)
            if day_index == 0:
                return next(d for d in days if d.day_name == 'Chest and Triceps')
            elif day_index == 1:
                return next(d for d in days if d.day_name == 'Back Biceps Forearms')
            elif day_index == 2:
                return next(d for d in days if d.day_name == 'Leg')
            else:
                return next(d for d in days if d.day_name == 'Rest')
    
    while current_date <= END_DATE:
        active_day = get_active_split_day(current_date)
        
        # Rest days have no workouts
        if 'Rest' in active_day.day_name:
            current_date += timedelta(days=1)
            continue
        
        # Get target muscles for this split day
        target_muscles = set(
            SplitDayTarget.objects.filter(split_day=active_day)
            .values_list('muscle', flat=True)
        )
        
        # Find workouts that primarily target these muscles
        suitable_workouts = []
        for workout in workouts:
            workout_muscles = set(
                WorkoutMuscle.objects.filter(workout=workout)
                .values_list('muscle', flat=True)
            )
            # Calculate overlap
            overlap = len(workout_muscles & target_muscles)
            if overlap > len(workout_muscles) * 0.5:  # Majority match
                suitable_workouts.append((workout, overlap))
            else:
                # Some workouts not in split are allowed but minimized
                if random.random() < 0.1:  # 10% chance
                    suitable_workouts.append((workout, overlap))
        
        # Sort by overlap (higher is better)
        suitable_workouts.sort(key=lambda x: x[1], reverse=True)
        suitable_workouts = [w[0] for w in suitable_workouts]
        
        if not suitable_workouts:
            current_date += timedelta(days=1)
            continue
        
        # Select 2-7 workouts
        num_workouts = random.randint(2, 7)
        selected_workouts = suitable_workouts[:num_workouts]
        
        workout_time = time(17, 0)  # Start at 5 PM
        
        for i, workout in enumerate(selected_workouts):
            # 1-4 sets per workout
            num_sets = random.randint(1, 4)
            
            for set_num in range(num_sets):
                WorkoutLog.objects.create(
                    user=user,
                    workout=workout,
                    weight=Decimal(str(random.uniform(50, 300))),
                    reps=random.randint(6, 15),
                    rir=random.randint(1, 3),
                    rest_time=random.randint(60, 180),
                    date_time=datetime.combine(
                        current_date,
                        workout_time
                    ) + timedelta(minutes=i * 10 + set_num * 3)
                )
        
        current_date += timedelta(days=1)
    
    print("[OK] Generated workout logs")


def populate_comprehensive_dummy_data():
    """
    Master function to populate all comprehensive dummy data.
    Creates 1 user with data from 4/15/2025 to 10/31/2025.
    """
    print("\n" + "="*60)
    print("POPULATING COMPREHENSIVE DUMMY DATA")
    print(f"Date Range: {START_DATE} to {END_DATE}")
    print("="*60 + "\n")
    
    try:
        # Create base entities
        user = create_user()
        create_user_goals(user)
        foods = create_foods()
        meals = create_meals(user, foods)
        workouts = create_workouts(user)
        splits = create_splits(user)
        create_muscle_logs(user)
        
        # Generate time-series data
        print("\nGenerating time-series data...")
        generate_api_usage_logs(user)
        generate_error_logs(user)
        generate_body_measurement_logs(user)
        generate_cardio_logs(user)
        generate_food_logs(user, foods)
        generate_health_metrics_logs(user)
        generate_sleep_logs(user)
        generate_steps_logs(user)
        generate_water_logs(user)
        generate_weight_logs(user)
        generate_workout_logs(user, workouts, splits)
        
        print("\n" + "="*60)
        print("[SUCCESS] ALL COMPREHENSIVE DUMMY DATA POPULATED SUCCESSFULLY")
        print("="*60)
        print(f"\nDummy User Credentials:")
        print("-" * 40)
        print(f"  Username: {DUMMY_USER_USERNAME}")
        print(f"  Password: {DUMMY_USER_PASSWORD}")
        print(f"  Email: dummyuser@example.com")
        print()
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Error populating dummy data: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    populate_comprehensive_dummy_data()

