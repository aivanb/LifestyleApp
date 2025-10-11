"""
Dummy Data Generation

This module generates realistic test data for two users with approximately
6 months of recorded data. This data is useful for development, testing,
and demonstration purposes.

Generated Data:
- 2 users with different profiles
- ~6 months of food logs
- ~6 months of workout logs
- ~6 months of health metrics
- Goals, meals, workouts, and splits
"""

import sys
import os
from datetime import datetime, timedelta, time
from decimal import Decimal
import random

# Add the parent directory to the Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from django.contrib.auth.hashers import make_password
from apps.users.models import User, AccessLevel, Unit, ActivityLevel, UserGoal
from apps.foods.models import Food, Meal, MealFood
from apps.workouts.models import Workout, Muscle, WorkoutLog, MuscleLog, WorkoutMuscle, Split, SplitDay, SplitDayTarget
from apps.logging.models import FoodLog, WeightLog, BodyMeasurementLog, WaterLog, StepsLog, CardioLog
from apps.health.models import SleepLog, HealthMetricsLog
from apps.analytics.models import ApiUsageLog, ErrorLog

# Store credentials for easy access
DUMMY_USER_CREDENTIALS = [
    {'username': 'john_doe', 'password': 'testpass123', 'email': 'john.doe@example.com'},
    {'username': 'jane_smith', 'password': 'testpass456', 'email': 'jane.smith@example.com'},
]


def create_users():
    """Create two dummy users with different profiles."""
    print("Creating dummy users...")
    
    user_access = AccessLevel.objects.get(role_name='user')
    imperial_unit = Unit.objects.get(unit_name='lb')
    metric_unit = Unit.objects.get(unit_name='kg')
    
    users_data = [
        {
            'username': 'john_doe',
            'password': make_password('testpass123'),
            'email': 'john.doe@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'access_level': user_access,
            'height': Decimal('72.00'),  # 6 feet in inches
            'birthday': datetime(1990, 5, 15).date(),
            'gender': 'male',
            'unit_preference': imperial_unit,
            'activity_level': ActivityLevel.objects.get(name='Very Active'),
        },
        {
            'username': 'jane_smith',
            'password': make_password('testpass456'),
            'email': 'jane.smith@example.com',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'access_level': user_access,
            'height': Decimal('165.00'),  # 165 cm
            'birthday': datetime(1992, 8, 22).date(),
            'gender': 'female',
            'unit_preference': metric_unit,
            'activity_level': ActivityLevel.objects.get(name='Moderately Active'),
        },
    ]
    
    users = []
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults=user_data
        )
        users.append(user)
    
    print(f"[OK] Created {len(users)} users")
    return users


def create_user_goals(users):
    """Create goals for each user."""
    print("Creating user goals...")
    
    goals_data = [
        {  # John's goals (cutting phase)
            'user': users[0],
            'tokens_goal': 10000,
            'cost_goal': Decimal('50.00'),
            'weight_goal': Decimal('185.00'),
            'calories_goal': 2200,
            'protein_goal': Decimal('180.00'),
            'fat_goal': Decimal('60.00'),
            'carbohydrates_goal': Decimal('220.00'),
            'fiber_goal': Decimal('30.00'),
            'sodium_goal': Decimal('2300.00'),
            'sugar_goal': Decimal('50.00'),
        },
        {  # Jane's goals (maintenance)
            'user': users[1],
            'tokens_goal': 5000,
            'cost_goal': Decimal('30.00'),
            'weight_goal': Decimal('62.00'),
            'calories_goal': 1800,
            'protein_goal': Decimal('120.00'),
            'fat_goal': Decimal('50.00'),
            'carbohydrates_goal': Decimal('180.00'),
            'fiber_goal': Decimal('25.00'),
            'sodium_goal': Decimal('2000.00'),
            'sugar_goal': Decimal('40.00'),
        },
    ]
    
    for goal_data in goals_data:
        UserGoal.objects.get_or_create(
            user=goal_data['user'],
            defaults=goal_data
        )
    
    print(f"[OK] Created {len(goals_data)} user goals")


def create_foods():
    """Create a variety of common foods."""
    print("Creating foods database...")
    
    foods_data = [
        # Proteins
        {'food_name': 'Chicken Breast (Raw)', 'serving_size': 100, 'unit': 'g', 'calories': 165, 'protein': 31, 'fat': 3.6, 'carbohydrates': 0, 'fiber': 0, 'food_group': 'protein', 'make_public': True},
        {'food_name': 'Ground Beef (93% Lean)', 'serving_size': 100, 'unit': 'g', 'calories': 176, 'protein': 21, 'fat': 10, 'carbohydrates': 0, 'fiber': 0, 'food_group': 'protein', 'make_public': True},
        {'food_name': 'Salmon (Atlantic)', 'serving_size': 100, 'unit': 'g', 'calories': 206, 'protein': 22, 'fat': 13, 'carbohydrates': 0, 'fiber': 0, 'food_group': 'protein', 'make_public': True},
        {'food_name': 'Eggs (Whole, Large)', 'serving_size': 50, 'unit': 'g', 'calories': 72, 'protein': 6.3, 'fat': 4.8, 'carbohydrates': 0.4, 'fiber': 0, 'food_group': 'protein', 'make_public': True},
        {'food_name': 'Greek Yogurt (Non-Fat)', 'serving_size': 170, 'unit': 'g', 'calories': 100, 'protein': 17, 'fat': 0, 'carbohydrates': 7, 'fiber': 0, 'food_group': 'dairy', 'make_public': True},
        {'food_name': 'Whey Protein Powder', 'serving_size': 30, 'unit': 'g', 'calories': 120, 'protein': 24, 'fat': 1.5, 'carbohydrates': 3, 'fiber': 1, 'food_group': 'protein', 'brand': 'Optimum Nutrition', 'make_public': True},
        
        # Carbs
        {'food_name': 'White Rice (Cooked)', 'serving_size': 100, 'unit': 'g', 'calories': 130, 'protein': 2.7, 'fat': 0.3, 'carbohydrates': 28, 'fiber': 0.4, 'food_group': 'grain', 'make_public': True},
        {'food_name': 'Brown Rice (Cooked)', 'serving_size': 100, 'unit': 'g', 'calories': 112, 'protein': 2.6, 'fat': 0.9, 'carbohydrates': 24, 'fiber': 1.8, 'food_group': 'grain', 'make_public': True},
        {'food_name': 'Sweet Potato (Baked)', 'serving_size': 100, 'unit': 'g', 'calories': 90, 'protein': 2, 'fat': 0.2, 'carbohydrates': 21, 'fiber': 3.3, 'food_group': 'vegetable', 'make_public': True},
        {'food_name': 'Oatmeal (Dry)', 'serving_size': 40, 'unit': 'g', 'calories': 150, 'protein': 5, 'fat': 3, 'carbohydrates': 27, 'fiber': 4, 'food_group': 'grain', 'make_public': True},
        {'food_name': 'Whole Wheat Bread', 'serving_size': 30, 'unit': 'g', 'calories': 80, 'protein': 4, 'fat': 1, 'carbohydrates': 14, 'fiber': 2, 'food_group': 'grain', 'make_public': True},
        {'food_name': 'Pasta (Cooked)', 'serving_size': 100, 'unit': 'g', 'calories': 131, 'protein': 5, 'fat': 1.1, 'carbohydrates': 25, 'fiber': 1.8, 'food_group': 'grain', 'make_public': True},
        {'food_name': 'Banana', 'serving_size': 118, 'unit': 'g', 'calories': 105, 'protein': 1.3, 'fat': 0.4, 'carbohydrates': 27, 'fiber': 3.1, 'food_group': 'fruit', 'make_public': True},
        
        # Vegetables
        {'food_name': 'Broccoli (Cooked)', 'serving_size': 100, 'unit': 'g', 'calories': 35, 'protein': 2.4, 'fat': 0.4, 'carbohydrates': 7, 'fiber': 3.3, 'food_group': 'vegetable', 'make_public': True},
        {'food_name': 'Spinach (Raw)', 'serving_size': 100, 'unit': 'g', 'calories': 23, 'protein': 2.9, 'fat': 0.4, 'carbohydrates': 3.6, 'fiber': 2.2, 'food_group': 'vegetable', 'make_public': True},
        {'food_name': 'Carrots (Raw)', 'serving_size': 100, 'unit': 'g', 'calories': 41, 'protein': 0.9, 'fat': 0.2, 'carbohydrates': 10, 'fiber': 2.8, 'food_group': 'vegetable', 'make_public': True},
        {'food_name': 'Mixed Salad Greens', 'serving_size': 85, 'unit': 'g', 'calories': 15, 'protein': 1, 'fat': 0, 'carbohydrates': 3, 'fiber': 2, 'food_group': 'vegetable', 'make_public': True},
        
        # Fats
        {'food_name': 'Olive Oil', 'serving_size': 14, 'unit': 'g', 'calories': 120, 'protein': 0, 'fat': 14, 'carbohydrates': 0, 'fiber': 0, 'food_group': 'other', 'make_public': True},
        {'food_name': 'Almonds', 'serving_size': 28, 'unit': 'g', 'calories': 164, 'protein': 6, 'fat': 14, 'carbohydrates': 6, 'fiber': 3.5, 'food_group': 'protein', 'make_public': True},
        {'food_name': 'Peanut Butter', 'serving_size': 32, 'unit': 'g', 'calories': 190, 'protein': 7, 'fat': 16, 'carbohydrates': 8, 'fiber': 2, 'food_group': 'protein', 'make_public': True},
        {'food_name': 'Avocado', 'serving_size': 100, 'unit': 'g', 'calories': 160, 'protein': 2, 'fat': 15, 'carbohydrates': 9, 'fiber': 7, 'food_group': 'fruit', 'make_public': True},
    ]
    
    # Add default values for micronutrients
    for food in foods_data:
        food.setdefault('sodium', Decimal(str(random.uniform(0, 200))))
        food.setdefault('sugar', Decimal(str(random.uniform(0, 5))))
        food.setdefault('saturated_fat', Decimal(str(food['fat'] * 0.3)))
        food.setdefault('trans_fat', Decimal('0'))
        food.setdefault('calcium', Decimal(str(random.uniform(0, 100))))
        food.setdefault('iron', Decimal(str(random.uniform(0, 3))))
        food.setdefault('magnesium', Decimal(str(random.uniform(0, 50))))
        food.setdefault('cholesterol', Decimal(str(random.uniform(0, 50) if food['food_group'] == 'protein' else 0)))
        food.setdefault('vitamin_a', Decimal(str(random.uniform(0, 100))))
        food.setdefault('vitamin_c', Decimal(str(random.uniform(0, 20))))
        food.setdefault('vitamin_d', Decimal(str(random.uniform(0, 5))))
        food.setdefault('caffeine', Decimal('0'))
    
    created_foods = []
    for food_data in foods_data:
        food, created = Food.objects.get_or_create(
            food_name=food_data['food_name'],
            defaults=food_data
        )
        created_foods.append(food)
    
    print(f"[OK] Created {len(created_foods)} foods")
    return created_foods


def create_workouts(users):
    """Create common workouts for users."""
    print("Creating workouts...")
    
    # Get some muscles for workout-muscle associations
    chest_muscles = list(Muscle.objects.filter(muscle_group='chest'))
    back_muscles = list(Muscle.objects.filter(muscle_group='back'))
    leg_muscles = list(Muscle.objects.filter(muscle_group='legs'))
    arm_muscles = list(Muscle.objects.filter(muscle_group='arms'))
    
    workouts_data = [
        # John's workouts (more advanced)
        {'user': users[0], 'workout_name': 'Barbell Bench Press', 'type': 'barbell', 'location': 'Gold\'s Gym', 'muscles': chest_muscles[:3], 'make_public': True},
        {'user': users[0], 'workout_name': 'Barbell Squat', 'type': 'barbell', 'location': 'Gold\'s Gym', 'muscles': leg_muscles[:5], 'make_public': True},
        {'user': users[0], 'workout_name': 'Deadlift', 'type': 'barbell', 'location': 'Gold\'s Gym', 'muscles': back_muscles + leg_muscles[:3], 'make_public': True},
        {'user': users[0], 'workout_name': 'Pull-ups', 'type': 'bodyweight', 'location': 'Gold\'s Gym', 'muscles': back_muscles[:3], 'make_public': True},
        {'user': users[0], 'workout_name': 'Overhead Press', 'type': 'barbell', 'location': 'Gold\'s Gym', 'muscles': arm_muscles[:3], 'make_public': True},
        {'user': users[0], 'workout_name': 'Barbell Row', 'type': 'barbell', 'location': 'Gold\'s Gym', 'muscles': back_muscles, 'make_public': True},
        
        # Jane's workouts
        {'user': users[1], 'workout_name': 'Dumbbell Bench Press', 'type': 'dumbbell', 'location': 'Planet Fitness', 'muscles': chest_muscles[:2], 'make_public': True},
        {'user': users[1], 'workout_name': 'Leg Press', 'type': 'plate_machine', 'location': 'Planet Fitness', 'muscles': leg_muscles[:4], 'make_public': True},
        {'user': users[1], 'workout_name': 'Lat Pulldown', 'type': 'cable_machine', 'location': 'Planet Fitness', 'muscles': back_muscles[:2], 'make_public': True},
        {'user': users[1], 'workout_name': 'Dumbbell Shoulder Press', 'type': 'dumbbell', 'location': 'Planet Fitness', 'muscles': arm_muscles[:2], 'make_public': True},
        {'user': users[1], 'workout_name': 'Romanian Deadlift', 'type': 'dumbbell', 'location': 'Planet Fitness', 'muscles': leg_muscles[4:7], 'make_public': True},
    ]
    
    created_workouts = []
    for workout_data in workouts_data:
        muscles = workout_data.pop('muscles')
        workout, created = Workout.objects.get_or_create(
            user=workout_data['user'],
            workout_name=workout_data['workout_name'],
            defaults=workout_data
        )
        
        # Add muscle activation ratings
        if created:
            for muscle in muscles:
                activation = random.randint(60, 95)
                WorkoutMuscle.objects.get_or_create(
                    workout=workout,
                    muscle=muscle,
                    defaults={'activation_rating': activation}
                )
        
        created_workouts.append(workout)
    
    print(f"[OK] Created {len(created_workouts)} workouts")
    return created_workouts


def create_meals(users, foods):
    """Create common meals for users."""
    print("Creating meals...")
    
    meals_data = [
        # John's meals
        {'user': users[0], 'meal_name': 'Pre-Workout Breakfast', 'foods': [
            (foods[9], Decimal('1.5')),  # Oatmeal
            (foods[12], Decimal('1')),   # Banana
            (foods[5], Decimal('1')),    # Protein powder
        ]},
        {'user': users[0], 'meal_name': 'Post-Workout Lunch', 'foods': [
            (foods[0], Decimal('2')),    # Chicken
            (foods[6], Decimal('2')),    # Rice
            (foods[13], Decimal('1.5')), # Broccoli
        ]},
        
        # Jane's meals
        {'user': users[1], 'meal_name': 'Morning Protein', 'foods': [
            (foods[4], Decimal('1')),    # Greek yogurt
            (foods[12], Decimal('0.5')), # Banana
            (foods[17], Decimal('1')),   # Almonds
        ]},
        {'user': users[1], 'meal_name': 'Balanced Dinner', 'foods': [
            (foods[2], Decimal('1')),    # Salmon
            (foods[8], Decimal('1.5')),  # Sweet potato
            (foods[14], Decimal('1')),   # Spinach
        ]},
    ]
    
    created_meals = []
    for meal_data in meals_data:
        foods_list = meal_data.pop('foods')
        meal, created = Meal.objects.get_or_create(
            user=meal_data['user'],
            meal_name=meal_data['meal_name'],
            defaults=meal_data
        )
        
        # Add foods to meal
        if created:
            for food, servings in foods_list:
                MealFood.objects.get_or_create(
                    meal=meal,
                    food=food,
                    defaults={'servings': servings}
                )
        
        created_meals.append(meal)
    
    print(f"[OK] Created {len(created_meals)} meals")
    return created_meals


def create_splits(users):
    """Create workout splits for users."""
    print("Creating splits...")
    
    # Get muscles
    chest = Muscle.objects.filter(muscle_group='chest')
    back = Muscle.objects.filter(muscle_group='back')
    legs = Muscle.objects.filter(muscle_group='legs')
    arms = Muscle.objects.filter(muscle_name__icontains='deltoid')
    
    start_date = datetime.now().date() - timedelta(days=180)
    
    # John's Push/Pull/Legs split
    john_split = Split.objects.get_or_create(
        user=users[0],
        split_name='Push Pull Legs',
        defaults={'start_date': start_date}
    )[0]
    
    push_day = SplitDay.objects.get_or_create(
        split=john_split,
        day_name='Push Day',
        defaults={'day_order': 1}
    )[0]
    
    pull_day = SplitDay.objects.get_or_create(
        split=john_split,
        day_name='Pull Day',
        defaults={'day_order': 2}
    )[0]
    
    leg_day = SplitDay.objects.get_or_create(
        split=john_split,
        day_name='Leg Day',
        defaults={'day_order': 3}
    )[0]
    
    # Add target muscles
    for muscle in chest:
        SplitDayTarget.objects.get_or_create(
            split_day=push_day,
            muscle=muscle,
            defaults={'target_activation': 85}
        )
    
    for muscle in back:
        SplitDayTarget.objects.get_or_create(
            split_day=pull_day,
            muscle=muscle,
            defaults={'target_activation': 85}
        )
    
    for muscle in legs[:8]:
        SplitDayTarget.objects.get_or_create(
            split_day=leg_day,
            muscle=muscle,
            defaults={'target_activation': 85}
        )
    
    # Jane's Upper/Lower split
    jane_split = Split.objects.get_or_create(
        user=users[1],
        split_name='Upper Lower',
        defaults={'start_date': start_date}
    )[0]
    
    upper_day = SplitDay.objects.get_or_create(
        split=jane_split,
        day_name='Upper Body',
        defaults={'day_order': 1}
    )[0]
    
    lower_day = SplitDay.objects.get_or_create(
        split=jane_split,
        day_name='Lower Body',
        defaults={'day_order': 2}
    )[0]
    
    print(f"[OK] Created 2 splits with days")


def generate_time_series_data(users, workouts, foods):
    """Generate 6 months of time-series data for both users."""
    print("\nGenerating 6 months of time-series data...")
    print("(This may take a minute...)\n")
    
    start_date = datetime.now() - timedelta(days=180)
    end_date = datetime.now()
    
    # Track progress
    total_days = (end_date - start_date).days
    
    for user_idx, user in enumerate(users):
        print(f"  Generating data for {user.username}...")
        
        # User-specific configurations
        if user_idx == 0:  # John
            base_weight = Decimal('195.00')
            weight_unit = 'lb'
            water_amount = Decimal('140.00')  # oz
            steps_range = (8000, 12000)
            workout_freq = 5  # days per week
            user_workouts = [w for w in workouts if w.user == user]
        else:  # Jane
            base_weight = Decimal('65.00')
            weight_unit = 'kg'
            water_amount = Decimal('2.5')  # liters
            steps_range = (6000, 10000)
            workout_freq = 4
            user_workouts = [w for w in workouts if w.user == user]
        
        current_date = start_date
        workout_day_counter = 0
        
        while current_date <= end_date:
            # Weight log (3x per week)
            if current_date.weekday() in [0, 3, 5]:  # Mon, Thu, Sat
                days_elapsed = (current_date - start_date).days
                weight_change = Decimal(str(random.uniform(-0.5, 0.3))) * Decimal(days_elapsed / 30)
                WeightLog.objects.get_or_create(
                    user=user,
                    created_at=datetime.combine(current_date, time(7, 0)),
                    defaults={
                        'weight': base_weight + weight_change,
                        'weight_unit': weight_unit,
                    }
                )
            
            # Daily water log
            daily_water = water_amount + Decimal(str(random.uniform(-0.2, 0.2))) * water_amount
            WaterLog.objects.get_or_create(
                user=user,
                created_at=datetime.combine(current_date, time(20, 0)),
                defaults={
                    'amount': daily_water,
                    'unit': 'oz' if user_idx == 0 else 'l',
                }
            )
            
            # Daily steps
            steps = random.randint(*steps_range)
            StepsLog.objects.get_or_create(
                user=user,
                date_time=datetime.combine(current_date, time(23, 59)),
                defaults={'steps': steps}
            )
            
            # Food logs (3-5 meals per day)
            meal_times = [
                time(7, 30),   # Breakfast
                time(12, 0),   # Lunch
                time(15, 30),  # Snack
                time(18, 30),  # Dinner
                time(21, 0),   # Evening snack
            ]
            
            num_meals = random.randint(3, 5)
            for meal_time in random.sample(meal_times, num_meals):
                food = random.choice(foods[:15])  # Use common foods
                servings = Decimal(str(random.uniform(0.5, 2.5)))
                FoodLog.objects.get_or_create(
                    user=user,
                    food=food,
                    date_time=datetime.combine(current_date, meal_time),
                    defaults={
                        'servings': servings,
                        'measurement': food.unit,
                    }
                )
            
            # Workout logs (based on frequency)
            if workout_day_counter % (7 // workout_freq) == 0 and user_workouts:
                # Perform 4-6 exercises
                num_exercises = random.randint(4, 6)
                selected_workouts = random.sample(user_workouts, min(num_exercises, len(user_workouts)))
                
                workout_time = time(17, 0)  # 5 PM workout
                for i, workout in enumerate(selected_workouts):
                    workout_datetime = datetime.combine(current_date, workout_time) + timedelta(minutes=i*10)
                    
                    sets = random.randint(3, 4)
                    for set_num in range(sets):
                        WorkoutLog.objects.get_or_create(
                            user=user,
                            workout=workout,
                            date_time=workout_datetime + timedelta(minutes=set_num*3),
                            defaults={
                                'weight': Decimal(str(random.uniform(50, 200))),
                                'reps': random.randint(6, 12),
                                'rir': random.randint(1, 3),
                                'rest_time': Decimal(str(random.uniform(60, 180))),
                            }
                        )
                
                # Cardio after workout (sometimes)
                if random.random() < 0.3:
                    CardioLog.objects.get_or_create(
                        user=user,
                        date_time=datetime.combine(current_date, time(18, 0)),
                        defaults={
                            'cardio_type': random.choice(['Treadmill', 'Elliptical', 'Bike']),
                            'duration': Decimal(str(random.uniform(15, 30))),
                            'distance': Decimal(str(random.uniform(1, 3))),
                            'distance_unit': 'mile',
                            'calories_burned': random.randint(100, 300),
                            'heart_rate': random.randint(120, 150),
                        }
                    )
            
            # Sleep log
            bedtime = time(23, random.randint(0, 59))
            waketime = time(random.randint(6, 8), random.randint(0, 59))
            SleepLog.objects.get_or_create(
                user=user,
                date_time=current_date,
                defaults={
                    'time_went_to_bed': bedtime,
                    'time_got_out_of_bed': waketime,
                    'time_fell_asleep': (datetime.combine(current_date, bedtime) + timedelta(minutes=random.randint(5, 30))).time(),
                    'time_in_light_sleep': random.randint(180, 300),
                    'time_in_deep_sleep': random.randint(60, 120),
                    'time_in_rem_sleep': random.randint(60, 120),
                    'number_of_times_woke_up': random.randint(0, 3),
                    'resting_heart_rate': random.randint(55, 70),
                }
            )
            
            # Health metrics (daily)
            HealthMetricsLog.objects.get_or_create(
                user=user,
                date_time=current_date,
                defaults={
                    'resting_heart_rate': random.randint(55, 70),
                    'blood_pressure_systolic': random.randint(110, 130),
                    'blood_pressure_diastolic': random.randint(70, 85),
                    'morning_energy': random.randint(5, 9),
                    'stress_level': random.randint(2, 6),
                    'mood': random.randint(6, 9),
                    'soreness': random.randint(2, 7),
                    'illness_level': random.randint(1, 2),
                }
            )
            
            # Body measurements (weekly)
            if current_date.weekday() == 0:  # Monday
                BodyMeasurementLog.objects.get_or_create(
                    user=user,
                    created_at=datetime.combine(current_date, time(8, 0)),
                    defaults={
                        'upper_arm': Decimal(str(random.uniform(13, 16))),
                        'lower_arm': Decimal(str(random.uniform(11, 13))),
                        'waist': Decimal(str(random.uniform(30, 36))),
                        'shoulder': Decimal(str(random.uniform(44, 48))),
                        'leg': Decimal(str(random.uniform(22, 26))),
                        'calf': Decimal(str(random.uniform(14, 16))),
                    }
                )
            
            current_date += timedelta(days=1)
            workout_day_counter += 1
        
        print(f"    [OK] Generated data for {user.username}")
    
    print("\n[OK] Time-series data generation complete")


def generate_api_usage_logs(users):
    """Generate some API usage logs."""
    print("Generating API usage logs...")
    
    for user in users:
        for _ in range(random.randint(20, 50)):
            days_ago = random.randint(0, 180)
            ApiUsageLog.objects.create(
                user=user,
                request_type='meal_parsing',
                model_used='gpt-4',
                tokens_used=random.randint(100, 500),
                cost=Decimal(str(random.uniform(0.01, 0.05))),
                response_time=Decimal(str(random.uniform(0.5, 3.0))),
                request='Parse my meal',
                response='Meal parsed successfully',
                success=True,
                created_at=datetime.now() - timedelta(days=days_ago),
            )
    
    print("[OK] Generated API usage logs")


def populate_dummy_data():
    """
    Master function to populate all dummy data.
    Creates 2 users with ~6 months of realistic data.
    """
    print("\n" + "="*60)
    print("POPULATING DUMMY DATA (2 Users, ~6 Months)")
    print("="*60 + "\n")
    
    try:
        # Create base entities
        users = create_users()
        create_user_goals(users)
        foods = create_foods()
        workouts = create_workouts(users)
        meals = create_meals(users, foods)
        create_splits(users)
        
        # Generate time-series data
        generate_time_series_data(users, workouts, foods)
        generate_api_usage_logs(users)
        
        print("\n" + "="*60)
        print("[SUCCESS] ALL DUMMY DATA POPULATED SUCCESSFULLY")
        print("="*60)
        print("\nDummy User Credentials:")
        print("-" * 40)
        for cred in DUMMY_USER_CREDENTIALS:
            print(f"  Username: {cred['username']}")
            print(f"  Password: {cred['password']}")
            print(f"  Email: {cred['email']}")
            print()
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Error populating dummy data: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    populate_dummy_data()

