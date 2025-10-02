## Database Schema

### Users Tables

#### **access_levels**
user application access levels
```sql
- access_level_id (PK) : Auto-increment ID
- role_name (Unique)   : ENUM [admin, user, guest]
```

#### **users**
Stores user accounts and their goals/preferences.
```sql
- user_id (PK): Auto-incrementing ID
- username (Unique)
- password_hash
- password_algorithm: Hashing algorithm used
- email (Unique)
- access_level_id (FK): access_levels.access_level_id
- height
- birthday
- gender: Must be: [male, female, Other]
- unit_preference (FK): units.unit_id
- activity_level (FK): activity_levels.activity_level_id
- created_at
- updated_at
```

### **units**
A list of usable units
```sql
- unit_id (PK): Auto-incrementing ID
- unit_name (Unique): The name of the unit
```

#### **activity_levels**
```sql
- activity_level_id (PK): Auto-incrementing ID
- name (Unique): the name of the level of activity
- description: the description for this level of activity
```

#### **user_goal**
Stores user defined tracking goals
```sql
- user_goal_id (PK): Auto-incrementing ID
- user_id (FK): References users table
- tokens_goal: Token usage goal
- cost_goal: Food cost goal
- weight_goal: Weight goal
- lean_mass_goal: Lean mass goal
- fat_mass_goal: Fat mass goal
- calories_goal: Calories goal
- protein_goal: Protein goal
- fat_goal: Fat goal
- carbohydrates_goal: Carbohydrates goal
- fiber_goal: Fiber goal
- sodium_goal: Sodium goal
- sugar_goal: Sugar goal
- saturated_fat_goal: Saturated fat goal
- trans_fat_goal: Trans fat goal
- calcium_goal: Calcium goal
- iron_goal: Iron goal
- magnesium_goal: Magnesium goal
- cholesterol_goal: Cholesterol goal
- vitamin_a_goal: Vitamin A goal
- vitamin_c_goal: Vitamin C goal
- vitamin_d_goal: Vitamin D goal
- caffeine_goal: Caffeine goal
- created_at: Timestamp when created
- updated_at: Timestamp when last updated
```

### Dataset Tables

#### **foods**
Nutritional information for food items (master food database).
```sql
- food_id (PK): Auto-incrementing ID
- food_name (Unique): Food item name
- serving_size: Serving size
- unit: Measurement unit
- calories: Calories amount
- protein: Protein amount
- fat: Fat amount
- carbohydrates: Carbohydrates amount
- fiber: Fiber amount
- sodium: Sodium amount
- sugar: Sugar amount
- saturated_fat: Saturated fat amount
- trans_fat: Trans fat amount
- calcium: Calcium amount
- iron: Iron amount
- magnesium: Magnesium amount
- cholesterol: Cholesterol amount
- vitamin_a: Vitamin A amount
- vitamin_c: Vitamin C amount
- vitamin_d: Vitamin D amount
- caffeine: Caffeine amount
- food_group: food group. ENUM [fruit, vegetable, grain, protein, dairy, other]
- brand: Brand name
- cost: Cost of food
- created_at: Timestamp when created
- updated_at: Timestamp when last updated
```

#### **meals**
Groups food entries into meals.
```sql
- meal_id (PK): Auto-incrementing ID
- user_id (FK): users.user_id
- meal_name: Meal name
- created_at: Timestamp when created
- updated_at: Timestamp when last updated
- UNIQUE(user_id, meal_name)
```

### **meals_foods**
Connects meals with many foods.
```sql
- meal_id (FK): meals.meal_id
- food_id (FK): foods.food_id
- servings: Number of servings
- PRIMARY KEY (meal_id, food_id)
```

### Logging Tables

#### **food_log**
Individual food consumption entries.
```sql
- macro_log_id (PK): Auto-incrementing ID
- user_id (FK): users.user_id
- food_id (FK): foods.food_id
- meal_id (FK): meals.meal_id
- servings: Number of servings consumed
- measurement: Unit of measurement
- date_time: Timestamp when logged
- voice_input: Original voice command
- ai_response: AI response
- tokens_used: API tokens consumed
```

#### **weight_log**
User weight tracking.
```sql
- weight_log_id (PK): Auto-incrementing ID
- user_id (FK): users.user_id
- weight: Weight value
- weight_unit: Weight unit
- created_at: Timestamp when created
```

#### **body_measurement_log**
User body measurement tracking
```sql
- measurement_id (PK): Auto-incrementing ID
- user_id (FK): users.user_id
- upper_arm: Size of upper arms
- lower_arm: Size of lower arms
- waist: Size of waist
- shoulder: Size of shoulders
- leg: Size of legs
- calf: Size of calves
- created_at: Timestamp when created
```

#### **water_log**
Water intake tracking.
```sql
- water_log_id (PK): Auto-incrementing ID
- user_id (FK): users.user_id
- amount: Amount of water
- unit: Unit of measurement
- created_at: Timestamp when created
```

### Workout Tables

#### **workouts**
The specific workouts that a user has performed
```sql
- workouts_id (PK): Auto-incrementing ID
- user_id (FK): users.user_id
- workout_name: Searchable name of the workout
- equipment_brand: Brand of equipment
- type: Workout type. ENUM [barbell, dumbbell, plate_machine, cable_machine, bodyweight]
- location: Gym where workout is performed
- notes: Any notes for this workout
- created_at: Timestamp when created
- updated_at: Timestamp when last updated
```

#### **muscles**
The muscles in the human body
```sql
- muscles_id (PK): Auto-incrementing ID
- muscle_name (Unique): name of the muscle
- muscle_group: the general group of the muscle. ENUM [legs, core, arms, back, chest, other]
```

#### **workout_log**
The log of workouts a user does
```sql
- workout_log_id (PK): Auto-incrementing ID
- user_id (FK): users.user_id
- workout_id (FK): workouts.workout_id
- weight: Weight added to the workout
- reps: Number of reps
- rir: Reps in reserve
- attributes: JSON column for optional details (e.g., { "dropset": true, "dropset_reps": 8, "assisted": false })
- date_time: Timestamp when performed
- created_at: Timestamp when created
```

#### **muscle_log**
List of all the muscles in the human body
```sql
- id (PK): Auto-incrementing ID
- user_id (FK): users.user_id
- muscle_name (FK): muscles.muscle_name
- importance: User-determined importance. INT [1–100]
- day_worked: Weekday worked. INT
```

#### **workout_muscle**
Gives each workout a list of activation ratings for each muscle
```sql
- workout_id (FK): workouts.workout_id
- muscle_id (FK): muscles.muscle_id
- activation_rating: Activation rating. INT [1–100]
- PRIMARY KEY (workout_id, muscle_id)
```

#### **steps_log**
The log of steps a user does each day
```sql
- step_log_id (PK): Auto-incrementing ID
- user_id (FK): users.user_id
- steps: Number of steps
- date_time: Timestamp when performed
- created_at: Timestamp when created
```

#### **cardio_log*
The log of cardio done by the user
```sql
- cardio_log_id (PK): Auto-incrementing ID
- user_id (FK): users.user_id
- cardio_type: the machine or type of cardio done
- duration: the duration of the cardio
- distance: the distance of of the cardio
- distance_unit: the unit of distance
- calories_burned: the amount of calories burned
- heart_rate: the average heart rate during the cardio
- date_time: Timestamp when performed
- created_at: Timestamp when created
```

### Health & Sleep Tables

#### **sleep_log**
Sleep tracking and analysis data
```sql
- sleep_log_id (PK): Auto-incrementing ID
- user_id (FK): users.user_id
- date_time: Date of sleep
- time_went_to_bed: Time went to bed
- time_got_out_of_bed: Time got out of bed
- time_fell_asleep: Time fell asleep
- time_in_light_sleep: Time spent in light sleep (minutes)
- time_in_deep_sleep: Time spent in deep sleep (minutes)
- time_in_rem_sleep: Time spent in REM sleep (minutes)
- number_of_times_woke_up: Number of times woke up during night
- resting_heart_rate: Resting heart rate during sleep
- created_at: Timestamp when created
```

#### **health_metrics_log**
Daily health metrics and wellness tracking
```sql
- health_metrics_id (PK): Auto-incrementing entry ID
- user_id (FK): users.user_id
- resting_heart_rate: Resting heart rate (BPM)
- blood_pressure_systolic: Systolic blood pressure
- blood_pressure_diastolic: Diastolic blood pressure
- morning_energy: Morning energy level. INT [1–10]
- stress_level: Stress level. INT [1–10]
- mood: Mood rating. INT [1–10]
- soreness: Muscle soreness level. INT [1–10]
- illness_level: Illness/sickness level. INT [1–10]
- date_time: Date of metrics
- created_at: Timestamp when created
```

### Analytics Tables

#### **api_usage_log**
Tracks API usage for cost monitoring.
```sql
- api_log_id (PK): Auto-incrementing log ID
- user_id (FK): users.user_id
- request_type: Endpoint requested
- model_used: GPT model used
- tokens_used: Number of tokens
- cost: Dollar cost of request
- response_time: API response time in seconds
- request: What user requested
- response: What API responded
- success: Whether request succeeded
- error_message: Error details if failed
- created_at: Timestamp when created
```

#### **error_log**
System error tracking for debugging.
```sql
- error_log_id (PK): Auto-incrementing error ID
- user_id (FK, optional): users.user_id
- error_type: Category of error
- error_message: Error description
- user_input: What user entered
- created_at: Timestamp when occurred
```
