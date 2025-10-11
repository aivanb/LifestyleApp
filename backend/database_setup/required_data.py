"""
Required Data Population

This module contains functions to populate required reference tables that
are necessary for the application to run properly. These tables contain
static/reference data that should always be present in the database.

Required Tables:
- access_levels
- activity_levels
- auth_permission (handled by Django)
- django_content_type (handled by Django)
- muscles
- units
"""

import sys
import os

# Add the parent directory to the Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from apps.users.models import AccessLevel, Unit, ActivityLevel
from apps.workouts.models import Muscle


def populate_access_levels():
    """
    Populate the access_levels table with user roles.
    Roles: admin, user, guest
    """
    print("Populating access_levels...")
    
    access_levels = [
        {'role_name': 'admin'},
        {'role_name': 'user'},
        {'role_name': 'guest'},
    ]
    
    for level in access_levels:
        AccessLevel.objects.get_or_create(role_name=level['role_name'])
    
    print(f"[OK] Created {len(access_levels)} access levels")


def populate_activity_levels():
    """
    Populate the activity_levels table with standard activity levels.
    """
    print("Populating activity_levels...")
    
    activity_levels = [
        {
            'name': 'Sedentary',
            'description': 'Little or no exercise, desk job'
        },
        {
            'name': 'Lightly Active',
            'description': 'Light exercise or sports 1-3 days per week'
        },
        {
            'name': 'Moderately Active',
            'description': 'Moderate exercise or sports 3-5 days per week'
        },
        {
            'name': 'Very Active',
            'description': 'Hard exercise or sports 6-7 days per week'
        },
        {
            'name': 'Extremely Active',
            'description': 'Very hard exercise, physical job, or training twice per day'
        },
    ]
    
    for level in activity_levels:
        ActivityLevel.objects.get_or_create(
            name=level['name'],
            defaults={'description': level['description']}
        )
    
    print(f"[OK] Created {len(activity_levels)} activity levels")


def populate_units():
    """
    Populate the units table with common measurement units.
    """
    print("Populating units...")
    
    units = [
        # Weight units
        'lb', 'kg', 'oz', 'g',
        # Volume units
        'ml', 'l', 'fl oz', 'cup', 'tbsp', 'tsp', 'gallon', 'pint', 'quart',
        # Length units
        'in', 'cm', 'ft', 'm', 'mile', 'km',
        # Other
        'unit', 'serving', 'piece', 'slice', 'scoop',
    ]
    
    for unit_name in units:
        Unit.objects.get_or_create(unit_name=unit_name)
    
    print(f"[OK] Created {len(units)} units")


def populate_muscles():
    """
    Populate the muscles table with all major muscles and muscle groups.
    """
    print("Populating muscles...")
    
    muscles = [
        # Chest
        {'muscle_name': 'Pectoralis Major (Upper)', 'muscle_group': 'chest'},
        {'muscle_name': 'Pectoralis Major (Middle)', 'muscle_group': 'chest'},
        {'muscle_name': 'Pectoralis Major (Lower)', 'muscle_group': 'chest'},
        {'muscle_name': 'Pectoralis Minor', 'muscle_group': 'chest'},
        
        # Back
        {'muscle_name': 'Latissimus Dorsi', 'muscle_group': 'back'},
        {'muscle_name': 'Trapezius (Upper)', 'muscle_group': 'back'},
        {'muscle_name': 'Trapezius (Middle)', 'muscle_group': 'back'},
        {'muscle_name': 'Trapezius (Lower)', 'muscle_group': 'back'},
        {'muscle_name': 'Rhomboids', 'muscle_group': 'back'},
        {'muscle_name': 'Erector Spinae', 'muscle_group': 'back'},
        {'muscle_name': 'Teres Major', 'muscle_group': 'back'},
        {'muscle_name': 'Teres Minor', 'muscle_group': 'back'},
        
        # Arms
        {'muscle_name': 'Biceps Brachii', 'muscle_group': 'arms'},
        {'muscle_name': 'Brachialis', 'muscle_group': 'arms'},
        {'muscle_name': 'Brachioradialis', 'muscle_group': 'arms'},
        {'muscle_name': 'Triceps (Long Head)', 'muscle_group': 'arms'},
        {'muscle_name': 'Triceps (Lateral Head)', 'muscle_group': 'arms'},
        {'muscle_name': 'Triceps (Medial Head)', 'muscle_group': 'arms'},
        {'muscle_name': 'Forearm Flexors', 'muscle_group': 'arms'},
        {'muscle_name': 'Forearm Extensors', 'muscle_group': 'arms'},
        
        # Shoulders
        {'muscle_name': 'Anterior Deltoid', 'muscle_group': 'arms'},
        {'muscle_name': 'Lateral Deltoid', 'muscle_group': 'arms'},
        {'muscle_name': 'Posterior Deltoid', 'muscle_group': 'arms'},
        {'muscle_name': 'Rotator Cuff', 'muscle_group': 'arms'},
        
        # Legs
        {'muscle_name': 'Quadriceps (Rectus Femoris)', 'muscle_group': 'legs'},
        {'muscle_name': 'Quadriceps (Vastus Lateralis)', 'muscle_group': 'legs'},
        {'muscle_name': 'Quadriceps (Vastus Medialis)', 'muscle_group': 'legs'},
        {'muscle_name': 'Quadriceps (Vastus Intermedius)', 'muscle_group': 'legs'},
        {'muscle_name': 'Hamstrings (Biceps Femoris)', 'muscle_group': 'legs'},
        {'muscle_name': 'Hamstrings (Semitendinosus)', 'muscle_group': 'legs'},
        {'muscle_name': 'Hamstrings (Semimembranosus)', 'muscle_group': 'legs'},
        {'muscle_name': 'Glutes (Maximus)', 'muscle_group': 'legs'},
        {'muscle_name': 'Glutes (Medius)', 'muscle_group': 'legs'},
        {'muscle_name': 'Glutes (Minimus)', 'muscle_group': 'legs'},
        {'muscle_name': 'Adductors', 'muscle_group': 'legs'},
        {'muscle_name': 'Abductors', 'muscle_group': 'legs'},
        {'muscle_name': 'Calves (Gastrocnemius)', 'muscle_group': 'legs'},
        {'muscle_name': 'Calves (Soleus)', 'muscle_group': 'legs'},
        {'muscle_name': 'Tibialis Anterior', 'muscle_group': 'legs'},
        
        # Core
        {'muscle_name': 'Rectus Abdominis', 'muscle_group': 'core'},
        {'muscle_name': 'External Obliques', 'muscle_group': 'core'},
        {'muscle_name': 'Internal Obliques', 'muscle_group': 'core'},
        {'muscle_name': 'Transverse Abdominis', 'muscle_group': 'core'},
        {'muscle_name': 'Serratus Anterior', 'muscle_group': 'core'},
        
        # Other
        {'muscle_name': 'Neck Flexors', 'muscle_group': 'other'},
        {'muscle_name': 'Neck Extensors', 'muscle_group': 'other'},
    ]
    
    for muscle in muscles:
        Muscle.objects.get_or_create(
            muscle_name=muscle['muscle_name'],
            defaults={'muscle_group': muscle['muscle_group']}
        )
    
    print(f"[OK] Created {len(muscles)} muscles")


def populate_required_data():
    """
    Master function to populate all required data tables.
    This should be run when setting up a new database.
    """
    print("\n" + "="*60)
    print("POPULATING REQUIRED DATA")
    print("="*60 + "\n")
    
    try:
        populate_access_levels()
        populate_activity_levels()
        populate_units()
        populate_muscles()
        
        print("\n" + "="*60)
        print("[SUCCESS] ALL REQUIRED DATA POPULATED SUCCESSFULLY")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Error populating required data: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    populate_required_data()

