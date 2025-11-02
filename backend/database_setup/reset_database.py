"""
Database Reset Utilities

This module provides functions to reset the database to various states:
- Reset to empty with only required data
- Clear all dummy data while preserving required data
- Full reset and repopulate
"""

import sys
import os

# Add the parent directory to the Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from apps.users.models import User, UserGoal
from apps.foods.models import Food, Meal, MealFood
from apps.workouts.models import Workout, WorkoutLog, MuscleLog, WorkoutMuscle, Split, SplitDay, SplitDayTarget
from apps.logging.models import FoodLog, WeightLog, BodyMeasurementLog, WaterLog, StepsLog, CardioLog
from apps.health.models import SleepLog, HealthMetricsLog
from apps.analytics.models import ApiUsageLog, ErrorLog
from django.contrib.auth.models import Group
from django.db import connection


def _reset_indexes_and_auto_increment():
    """
    Reset auto-increment counters and optimize indexes for all tables.
    This ensures clean state for database after clearing data.
    """
    try:
        with connection.cursor() as cursor:
            # List of tables that need auto-increment reset (tables with user data)
            tables_to_reset = [
                'users', 'user_goal', 'foods', 'meals', 'meals_foods',
                'workouts', 'workout_log', 'muscle_log', 'workout_muscle',
                'splits', 'split_days', 'split_day_targets',
                'food_log', 'weight_log', 'body_measurement_log',
                'water_log', 'steps_log', 'cardio_log',
                'sleep_log', 'health_metrics_log',
                'api_usage_log', 'error_log'
            ]
            
            for table in tables_to_reset:
                try:
                    # Reset auto-increment to 1
                    cursor.execute(f"ALTER TABLE {table} AUTO_INCREMENT = 1")
                    # Optimize table (rebuilds indexes and reclaims space)
                    cursor.execute(f"OPTIMIZE TABLE {table}")
                except Exception as e:
                    # Table might not exist or have auto-increment, skip it
                    pass
            
            print("  [OK] Indexes optimized and auto-increment counters reset")
    except Exception as e:
        print(f"  [WARNING] Could not reset indexes: {str(e)}")
        print("  This is usually safe to ignore if using a database that doesn't support these operations.")


def clear_dummy_data():
    """
    Clear all dummy/user-generated data while preserving required reference data.
    This removes:
    - Users and their data
    - Food logs, workout logs, health logs
    - User-created meals and workouts
    - All test data
    
    This preserves:
    - Access levels
    - Activity levels
    - Muscles
    - Units
    - Django system tables
    """
    print("\n" + "="*60)
    print("CLEARING DUMMY DATA")
    print("="*60 + "\n")
    
    try:
        # Clear logs first (have foreign keys to other tables)
        print("Clearing logs...")
        FoodLog.objects.all().delete()
        WeightLog.objects.all().delete()
        BodyMeasurementLog.objects.all().delete()
        WaterLog.objects.all().delete()
        StepsLog.objects.all().delete()
        CardioLog.objects.all().delete()
        WorkoutLog.objects.all().delete()
        SleepLog.objects.all().delete()
        HealthMetricsLog.objects.all().delete()
        MuscleLog.objects.all().delete()
        ApiUsageLog.objects.all().delete()
        ErrorLog.objects.all().delete()
        print("  [OK] Logs cleared")
        
        # Clear user-related data
        print("Clearing user data...")
        UserGoal.objects.all().delete()
        MealFood.objects.all().delete()
        Meal.objects.all().delete()
        print("  [OK] User data cleared")
        
        # Clear workout-related data
        print("Clearing workout data...")
        SplitDayTarget.objects.all().delete()
        SplitDay.objects.all().delete()
        Split.objects.all().delete()
        WorkoutMuscle.objects.all().delete()
        Workout.objects.all().delete()
        print("  [OK] Workout data cleared")
        
        # Clear foods
        print("Clearing foods...")
        Food.objects.all().delete()
        print("  [OK] Foods cleared")
        
        # Clear groups
        print("Clearing groups...")
        Group.objects.all().delete()
        print("  [OK] Groups cleared")
        
        # Clear users (do this last as they're referenced by many tables)
        print("Clearing users...")
        user_count = User.objects.all().count()
        User.objects.all().delete()
        print(f"  [OK] {user_count} users cleared")
        
        # Reset auto-increment counters and optimize indexes
        print("Resetting auto-increment counters and optimizing indexes...")
        _reset_indexes_and_auto_increment()
        
        print("\n" + "="*60)
        print("[SUCCESS] DUMMY DATA CLEARED SUCCESSFULLY")
        print("="*60 + "\n")
        print("Required reference data (access_levels, activity_levels,")
        print("muscles, units) has been preserved.")
        print("Database indexes have been optimized and auto-increment counters reset.")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Error clearing dummy data: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def reset_database():
    """
    Complete database reset. Clears all user data and resets to initial state
    with only required reference data.
    
    WARNING: This will delete ALL user data!
    """
    print("\n" + "="*60)
    print("RESETTING DATABASE TO INITIAL STATE")
    print("="*60)
    print("\nWARNING: This will delete ALL user data!")
    print("Only required reference data will remain.\n")
    
    success = clear_dummy_data()
    
    if success:
        print("\nDatabase has been reset to initial state.")
        print("Run 'python manage.py setup_database --required' to ensure")
        print("all required reference data is present.")
    
    return success


def full_reset_and_populate():
    """
    Performs a complete reset and repopulates with required data and dummy data.
    Useful for testing and development.
    """
    print("\n" + "="*60)
    print("FULL RESET AND POPULATE")
    print("="*60 + "\n")
    
    # First clear all dummy data
    if not clear_dummy_data():
        return False
    
    print("\nRepopulating required data...")
    from .required_data import populate_required_data
    if not populate_required_data():
        return False
    
    print("\nRepopulating dummy data...")
    from .dummy_data import populate_dummy_data
    if not populate_dummy_data():
        return False
    
    print("\n" + "="*60)
    print("[SUCCESS] FULL RESET AND POPULATE COMPLETED")
    print("="*60 + "\n")
    
    return True


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'clear':
            clear_dummy_data()
        elif command == 'reset':
            reset_database()
        elif command == 'full':
            full_reset_and_populate()
        else:
            print("Usage: python reset_database.py [clear|reset|full]")
            print("  clear - Clear dummy data only")
            print("  reset - Reset to initial state")
            print("  full  - Full reset and repopulate")
    else:
        print("Usage: python reset_database.py [clear|reset|full]")
        print("  clear - Clear dummy data only")
        print("  reset - Reset to initial state")
        print("  full  - Full reset and repopulate")

