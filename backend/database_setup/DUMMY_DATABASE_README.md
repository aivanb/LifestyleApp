# Dummy Database Overview

This document provides an overview of the comprehensive dummy data generation system for the TrackingApp database.

## Overview

The dummy data system generates realistic test data for a single user (username: `dummyUser`, password: `dummypass123`) spanning from **April 15, 2025** to **November 30, 2025**. This ~7.5 months of data is designed to simulate a healthy adult male with realistic fluctuations and patterns across all tracking categories.

## User Profile

- **Username**: `dummyUser`
- **Password**: `dummypass123`
- **Email**: `dummyuser@example.com`
- **Gender**: Male
- **Height**: 72 inches (6 feet)
- **Birthday**: May 15, 1990
- **Activity Level**: Very Active
- **Unit Preference**: Imperial (lb)

## Date Range

- **Start Date**: April 15, 2025
- **End Date**: November 30, 2025
- **Total Days**: 230 days

## Data Generation Specifications

### User Goals

Two goal periods are created with all fields populated:
1. **Period 1** (April 15, 2025): Cutting phase
   - Calories: 2,500
   - Weight goal: 165 lbs
   - Lean mass: 145 lbs, Fat mass: 20 lbs
   - Macros: Protein 180g, Carbs 200g, Fats 50g
   - Micronutrients: Fiber 30g, Sodium 2300mg, Sugar 50g, Saturated fat 20g, Trans fat 0g
   - Vitamins/Minerals: Calcium 1000mg, Iron 18mg, Magnesium 400mg, Cholesterol 300mg
   - Vitamins: A 900mcg, C 90mg, D 15mcg
   - Caffeine: 400mg
   - Tokens: 5000, Cost: $50.00

2. **Period 2** (July 26, 2025): Bulking phase
   - Calories: 3,200
   - Weight goal: 195 lbs
   - Lean mass: 170 lbs, Fat mass: 25 lbs
   - Macros: Protein 220g, Carbs 350g, Fats 80g
   - Micronutrients: Fiber 35g, Sodium 2500mg, Sugar 80g, Saturated fat 30g, Trans fat 0g
   - Vitamins/Minerals: Calcium 1200mg, Iron 20mg, Magnesium 450mg, Cholesterol 350mg
   - Vitamins: A 1000mcg, C 100mg, D 20mcg
   - Caffeine: 400mg
   - Tokens: 6000, Cost: $75.00

### Foods

- **Total Foods**: 50 unique food items
- **Duplicates**: 5 foods with duplicate names but different brands
- **Food Groups**: Includes proteins, grains, vegetables, fruits, dairy, and other
- **Nutritional Data**: All foods include complete macro and micronutrient information

### Meals

- **Total Meals**: 10 unique meals
- **Foods per Meal**: 2-10 foods per meal (randomized)
- **Purpose**: Meals can be used in food logs to represent recipe-based entries

### Workouts

- **Total Workouts**: 50 unique workouts
- **Types**: Barbell, dumbbell, cable machine, plate machine, and bodyweight exercises
- **Muscle Associations**: Each workout is associated with 1-5 muscles with activation ratings

### Splits

Two workout splits are created:

1. **Upper Lower Split** (Active: April 15 - June 19, 2025)
   - Day 1: Upper Body
   - Day 2: Lower Body and Abs
   - Day 3: Rest
   - Average activation rating: 100

2. **PPL Split** (Active: June 20 - October 31, 2025)
   - Day 1: Chest and Triceps
   - Day 2: Back Biceps Forearms
   - Day 3: Leg
   - Day 4: Rest
   - Average activation rating: 85

Both splits include target activations for all muscles found in the muscles table, with no muscles having activation ratings on multiple split days.

### Muscle Logs

Two sets of muscle priority logs:
1. **April 15, 2025**: All muscles logged with priority 80
2. **August 5, 2025**: 
   - Leg muscles: Priority 60
   - All other muscles: Priority 90

## Time-Series Data

### API Usage Logs

- **Frequency**: 0-3 entries per day
- **Success Rate**: 85% success, 15% error
- **Request Types**: Meal parsing, workout suggestions, nutrition analysis
- **Models**: GPT-4, GPT-3.5-turbo, Claude-3

### Body Measurement Logs

- **80% of days**: No logged data
- **10% of days**: Partially filled rows (some measurements missing)
- **10% of days**: Fully filled rows (all measurements present)
- **Trend**: Values slowly increase over time with some days lower than previous days
- **Measurements**: Upper arm, lower arm, waist, shoulder, leg, calf

### Cardio Logs

- **Frequency**: 0-2 entries per day
- **Heart Rate**: 50% of rows have empty heart_rate field
- **Types**: Running, Cycling, Rowing, Elliptical, Swimming
- **Duration**: 15-60 minutes
- **Distance**: 1-5 miles

### Error Logs

- **Total**: 100 error logs dispersed throughout the date range
- **Error Types**: 5 different types
  - ValidationError
  - DatabaseError
  - APIError
  - AuthenticationError
  - NetworkError

### Food Logs

- **Frequency**: 5-15 entries per day
- **Empty Days**: 5% of days have no food logs
- **Calorie Targets**:
  - April 15 - July 25: Average 2,500 calories/day
  - July 26 - October 31: Average 3,200 calories/day
- **Macros**:
  - Average protein: 180g
  - Average carbohydrates: 200g
  - Average fats: 50g
- **Daily Fluctuation**: ±10% variation from daily averages
- **Voice Input**: 10% of rows include voice_input, ai_response, and tokens_used

### Health Metrics Logs

- **Frequency**: 70% of days have one row, 30% have no rows
- **Partial Data**: 40% of rows include partially filled data (some metrics missing)
- **Metrics**: Resting heart rate, blood pressure, morning energy, stress level, mood, soreness, illness level

### Sleep Logs

- **Frequency**: 70% of dates have one row, 30% have no rows
- **Missing Data**: 40% of rows include no values for:
  - time_in_light_sleep
  - time_in_deep_sleep
  - time_in_rem_sleep
  - resting_heart_rate
- **Bedtimes**: Typically between 10 PM and 11:59 PM
- **Wake Times**: Typically between 6 AM and 8 AM

### Steps Logs

- **Frequency**: 0-3 entries per day
- **Daily Average**: 10,000 steps per day
- **Distribution**: Steps distributed across multiple logs when multiple entries exist

### Water Logs

- **Frequency**: 0-10 entries per day
- **Daily Average**: 3.5 liters per day
- **Distribution**: Water intake distributed across multiple logs throughout the day

### Weight Logs

- **Frequency**: 0-2 entries per day
- **Trend Period 1** (April 15 - July 25): Weight decreases from 185 lbs to 162 lbs
- **Trend Period 2** (July 26 - October 31): Weight increases from 162 lbs to 193 lbs
- **Daily Variation**: Weight can go up or down each day with realistic fluctuations

### Workout Logs

- **Frequency**: 2-7 unique workouts per day (excluding rest days)
- **Sets per Workout**: 1-4 sets per workout
- **Rest Days**: No workouts logged on rest days
- **Workout Selection**: 
  - Workouts are primarily selected based on the active split day
  - Workouts with muscles not related to the split day are allowed but minimized (10% chance)
  - Majority of muscles in a workout must match the split day target muscles

## Usage

### Generating Dummy Data

To populate the database with comprehensive dummy data:

```bash
# From the backend directory
python database_setup/comprehensive_dummy_data.py
```

Or integrate into the database setup system:

```python
from database_setup.comprehensive_dummy_data import populate_comprehensive_dummy_data
populate_comprehensive_dummy_data()
```

### Resetting the Database

Before generating new dummy data, you should reset the database to ensure a clean state:

```bash
# Clear all dummy data (preserves required reference data)
python database_setup/reset_database.py clear

# Or use the Django management command
python manage.py setup_database --clear

# Full reset and populate with comprehensive dummy data
python manage.py setup_database --full
```

The reset process:
1. Clears all user-generated data
2. Preserves required reference data (access_levels, activity_levels, muscles, units, Django system tables)
3. Resets auto-increment counters
4. Optimizes database indexes

## Data Quality

All generated data:
- **Realistic**: Values reflect believable patterns for a healthy adult male
- **Consistent**: Relationships between data points are maintained (e.g., weight trends match calorie changes)
- **Complete**: All required tables are populated for a functioning user
- **Varied**: Includes realistic fluctuations and missing data patterns
- **Time-Aware**: Data respects date ranges and split transitions

## Notes

- All dates are in the future (2025) to ensure they don't conflict with current date-based queries
- The data represents a single user's complete tracking journey over 6+ months
- Trends are designed to show realistic progression (weight loss followed by weight gain, split changes, goal adjustments)
- Some randomness is included to simulate real-world data variability
- Missing data patterns (partial entries, empty days) simulate real user behavior

