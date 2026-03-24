# Backend Developer Guide for AI Agents

Technical documentation for AI agents working on the Django backend. This document covers architecture, APIs, data models, invariants, and extension points.

## Architecture Overview

### Django App Structure
```
backend/
├── apps/                    # Django applications
│   ├── authentication/     # JWT auth, user management
│   ├── users/              # User models and profiles
│   ├── foods/              # Food database and meals
│   ├── meals/              # Meal composition (minimal)
│   ├── logging/             # Activity logging (7 trackers)
│   ├── workouts/            # Exercise tracking
│   ├── health/              # Health metrics
│   ├── analytics/          # Usage and error tracking
│   ├── openai_service/     # AI integration
│   ├── data_viewer/        # Database access service (STANDARD)
│   └── database_setup/     # DB initialization
├── backend/                # Core Django configuration
│   ├── settings.py        # Main configuration
│   ├── urls.py            # Root URL routing
│   └── wsgi.py            # WSGI entry point
└── middleware/             # Request/response processing
    ├── auth.py            # JWT validation
    └── logging.py         # Request logging
```

### App Responsibilities

#### authentication (`apps/authentication/`)
- JWT token generation and validation
- User registration (requires valid, unused invite key) and login
- `POST /api/auth/validate-invite-key/`: validate invite key before registration
- Password management
- Profile retrieval
- Token refresh

#### users (`apps/users/`)
- Custom User model (extends AbstractUser)
- **InviteKey model**: invite keys for gated registration; each key can be used by at most one user (`User.invite_key` OneToOne)
- User profiles with height, birthday, gender, unit preferences
- UserGoal model for macro/weight targets
- BodyMetricsService: BMI, BMR, TDEE calculations
- MacroGoalsService: AI-powered macro generation
- ProfileService: Complete profile aggregation

#### foods (`apps/foods/`)
- Food model: Nutritional database (8000+ foods)
- Meal model: Meal compositions
- MealFood model: Food-meal relationships
- Food CRUD operations
- Food logging endpoints
- Public/private food sharing
- Recently logged foods

#### meals (`apps/meals/`)
- Currently minimal (meals handled in foods app)
- Placeholder for future meal-specific features

#### logging (`apps/logging/`)
- **7 Tracker Types**:
  - WeightLog: Daily weight tracking
  - WaterLog: Hydration tracking
  - BodyMeasurementLog: Body measurements
  - StepsLog: Daily step counts
  - CardioLog: Cardiovascular exercise
  - (Sleep and HealthMetrics in health app)
- Streak calculation for all trackers
- CRUD operations with user isolation
- Bulk streak retrieval

#### workouts (`apps/workouts/`)
- Workout model: Exercise definitions
- WorkoutMuscle model: Muscle activation ratings
- WorkoutLog model: Session logs with attributes
- MuscleLog model: User muscle priorities
- Split model: Workout program definitions
- SplitDay model: Days within splits
- SplitDayTarget model: Muscle targets per day
- Current split day calculation
- Workout statistics

#### health (`apps/health/`)
- SleepLog: Sleep pattern tracking
- HealthMetricsLog: Daily wellness metrics
- Streak calculations
- CRUD operations

#### analytics (`apps/analytics/`)
- ApiUsageLog: API usage tracking
- ErrorLog: Error logging
- Analytics endpoints for:
  - Workout progression, rest time, attributes
  - Food timing, frequency, cost, macro split
  - Health weight progression, metrics radial charts
  - Body measurement progression
  - Steps/cardio distance
  - Muscle activation progress

#### openai_service (`apps/openai_service/`)
- OpenAIService: API communication
- FoodParser: Natural language to structured food data
- TranscriptionService: Voice-to-text (Vosk + browser fallback)
- Metadata generation for foods
- Usage tracking and cost calculation

#### data_viewer (`apps/data_viewer/`)
- **CRITICAL**: Standard foundation for ALL database access
- DataAccessService: Secure, logged, access-controlled DB access
- Table listing, schema retrieval, data querying
- Role-based access control (admin/user/guest)
- SQL injection prevention, XSS protection
- **MUST** use for any database viewing/access

#### database_setup (`apps/database_setup/`)
- Management command: `setup_database`
- Required data: access_levels, activity_levels, muscles, units
- Dummy data: 2 test users with 6 months of realistic data
- Reset utilities: clear, reset, reset-full

## API Endpoints (Complete Reference)

### Authentication (`/api/auth/`)
- `POST /api/auth/login/` - Login, returns JWT tokens
- `POST /api/auth/register/` - User registration
- `POST /api/auth/logout/` - Logout, blacklists refresh token
- `GET /api/auth/profile/` - Get current user
- `PUT /api/auth/profile/update/` - Update profile
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/token/refresh/` - Refresh access token

### Users (`/api/users/`)
- `GET /api/users/profile/` - Complete profile with metrics
- `PUT /api/users/profile/` - Update personal information
- `GET /api/users/goals/` - Retrieve user goals
- `PUT /api/users/goals/` - Update user goals
- `GET /api/users/calculate-metrics/` - Calculate body metrics
- `POST /api/users/calculate-macros/` - Generate macro goals
- `GET /api/users/body-metrics/` - Get body metrics
- `GET /api/users/historical-data/` - Weight history and trends

### Foods (`/api/foods/`)
- `GET /api/foods/` - List foods (user's + public)
- `POST /api/foods/` - Create food
- `GET /api/foods/<id>/` - Get food details
- `PUT /api/foods/<id>/` - Update food
- `DELETE /api/foods/<id>/` - Delete food
- `GET /api/foods/<id>/analytics/` - Food analytics
- `GET /api/foods/meals/` - List meals
- `POST /api/foods/meals/` - Create meal
- `GET /api/foods/meals/<id>/` - Get meal details
- `POST /api/foods/logs/` - Log food consumption
- `GET /api/foods/logs/` - Get food logs
- `PUT /api/foods/logs/<id>/` - Update food log
- `DELETE /api/foods/logs/<id>/` - Delete food log
- `GET /api/foods/logs/recent-foods/` - Recently logged foods

### Logging (`/api/logging/`)
- `POST /api/logging/weight/` - Log weight
- `GET /api/logging/weight/` - Get weight logs
- `PUT /api/logging/weight/<id>/` - Update weight log
- `DELETE /api/logging/weight/<id>/` - Delete weight log
- `GET /api/logging/weight/streak/` - Get weight streak
- Similar endpoints for: `water/`, `steps/`, `cardio/`, `body-measurement/`
- `GET /api/logging/streaks/` - Get all tracker streaks

### Workouts (`/api/workouts/`)
- `GET /api/workouts/` - List workouts
- `POST /api/workouts/` - Create workout
- `GET /api/workouts/<id>/` - Get workout details
- `PUT /api/workouts/<id>/` - Update workout
- `DELETE /api/workouts/<id>/` - Delete workout
- `GET /api/workouts/muscles/` - List muscles
- `GET /api/workouts/muscle-priorities/` - Get muscle priorities
- `POST /api/workouts/muscle-priorities/` - Update muscle priorities
- `GET /api/workouts/logs/` - List workout logs
- `POST /api/workouts/logs/` - Log workout session
- `GET /api/workouts/logs/<id>/` - Get workout log
- `PUT /api/workouts/logs/<id>/` - Update workout log
- `DELETE /api/workouts/logs/<id>/` - Delete workout log
- `GET /api/workouts/splits/` - List splits
- `POST /api/workouts/splits/` - Create split
- `GET /api/workouts/splits/<id>/` - Get split details
- `PUT /api/workouts/splits/<id>/` - Update split
- `DELETE /api/workouts/splits/<id>/` - Delete split
- `POST /api/workouts/splits/<id>/activate/` - Activate split
- `GET /api/workouts/current-split-day/` - Get current split day
- `GET /api/workouts/stats/` - Workout statistics
- `GET /api/workouts/recently-logged/` - Recently logged workouts
- `GET /api/workouts/icons/` - Available workout icons

### Health (`/api/health/`)
- `POST /api/health/sleep/` - Log sleep
- `GET /api/health/sleep/` - Get sleep logs
- `PUT /api/health/sleep/<id>/` - Update sleep log
- `DELETE /api/health/sleep/<id>/` - Delete sleep log
- `GET /api/health/sleep/streak/` - Get sleep streak
- Similar endpoints for: `health-metrics/`

### Analytics (`/api/analytics/`)
- `GET /api/analytics/home/dashboard/?date=YYYY-MM-DD` — authenticated home summary: active split day, per-muscle activation target vs logged today, macro goals vs food logged today, calorie remaining (goal − food + cardio kcal + estimated walking kcal from steps using user height + latest weight log), list of additional trackers with no entry today (`weight`, `water`, `body_measurement`, `steps`, `cardio`, `sleep`, `health_metrics`).
- `GET /api/analytics/workouts/body-measurement-progression/`
- `GET /api/analytics/workouts/progression/`
- `GET /api/analytics/workouts/rest-time-analysis/`
- `GET /api/analytics/workouts/attributes-analysis/`
- `GET /api/analytics/workouts/steps-cardio-distance/`
- `GET /api/analytics/workouts/activation-progress/`
- `GET /api/analytics/foods/metadata-progress/`
- `GET /api/analytics/foods/timing/`
- `GET /api/analytics/foods/macro-split/`
- `GET /api/analytics/foods/frequency/`
- `GET /api/analytics/foods/cost/`
- `GET /api/analytics/foods/radar-chart/`
- `GET /api/analytics/foods/workout-tracking-heatmap/`
- `GET /api/analytics/health/weight-progression/`
- `GET /api/analytics/health/metrics-radial/`

### OpenAI Service (`/api/openai/`)
- `POST /api/openai/prompt/` - Send prompt to OpenAI
- `GET /api/openai/usage/` - Get usage statistics
- `POST /api/openai/parse-food/` - Parse food from natural language
- `POST /api/openai/generate-metadata/` - Generate food metadata
- `POST /api/openai/transcribe/` - Transcribe audio
- `GET /api/openai/transcription-status/` - Check Vosk status

### Data Viewer (`/api/data-viewer/`)
- `GET /api/data-viewer/tables/` - List available tables
- `GET /api/data-viewer/tables/<name>/schema/` - Get table schema
- `GET /api/data-viewer/tables/<name>/data/` - Get table data
- `GET /api/data-viewer/tables/<name>/count/` - Get row count

## API Response Format (Invariant)

**Success:**
```json
{
  "data": { ... }
}
```

**Error:**
```json
{
  "error": {
    "message": "Error description",
    "details": { ... }  // Optional
  }
}
```

## Database Models (Critical Schema)

### Core Models
- **User** (`users_user`): Custom user model with height, birthday, gender, unit preferences
- **AccessLevel** (`users_accesslevel`): Role definitions (admin, user, guest)
- **Unit** (`users_unit`): Measurement units
- **ActivityLevel** (`users_activitylevel`): Activity multipliers for TDEE
- **UserGoal** (`users_usergoal`): Macro/weight goals

### Food Models
- **Food** (`foods_food`): Nutritional database, public/private flag
- **Meal** (`foods_meal`): Meal templates
- **MealFood** (`meals_mealfoods`): Food-meal relationships

### Logging Models
- **FoodLog** (`logging_foodlog`): Food consumption logs
- **WeightLog** (`logging_weightlog`): Weight tracking
- **WaterLog** (`logging_waterlog`): Hydration
- **StepsLog** (`logging_stepslog`): Step counts
- **CardioLog** (`logging_cardiolog`): Cardio sessions
- **BodyMeasurementLog** (`logging_bodymeasurementlog`): Body measurements

### Workout Models
- **Muscle** (`muscles`): Muscle definitions (reference data)
- **Workout** (`workouts_workout`): Exercise definitions
- **WorkoutMuscle** (`workouts_workoutmuscle`): Muscle activation ratings
- **WorkoutLog** (`workouts_workoutlog`): Session logs with attributes JSON
- **MuscleLog** (`workouts_musclelog`): User muscle priorities
- **Split** (`workouts_split`): Workout program definitions
- **SplitDay** (`workouts_splitday`): Days within splits
- **SplitDayTarget** (`workouts_splitdaytarget`): Muscle targets per day

### Health Models
- **SleepLog** (`health_sleeplog`): Sleep tracking
- **HealthMetricsLog** (`health_healthmetricslog`): Daily wellness metrics

### Analytics Models
- **ApiUsageLog** (`analytics_apiusagelog`): API usage tracking
- **ErrorLog** (`analytics_errorlog`): Error logging

## Middleware Architecture

### AuthMiddleware (`middleware/auth.py`)
- Validates JWT tokens from Authorization header
- Sets `request.user` for authenticated requests
- Skips: `/admin/`, `/api/auth/login/`, `/api/auth/register/`, `/api/auth/token/refresh/`
  - Returns 401 for invalid/missing tokens

### LoggingMiddleware (`middleware/logging.py`)
- Logs all API requests/responses to `ApiUsageLog`
  - Tracks response times
- Logs exceptions to `ErrorLog`
- Truncates data to 1000 chars for storage

## Critical Invariants

### Security
- **ALL** endpoints except login/register require authentication
- Users can ONLY access their own data (filtered by `user` FK)
- Public foods/meals/workouts accessible to all authenticated users
- JWT tokens: access (1 hour), refresh (7 days)
- Passwords hashed with Django's default hasher
- SQL injection prevention: ALWAYS use ORM

### Data Integrity
- Foreign keys maintain referential integrity
- Cascade deletes: User deletion removes all related data
- Required reference data: `access_levels`, `activity_levels`, `muscles`, `units`
- Unique constraints: Username, email, composite keys

### Primary Key Naming
- Most models use `_id` suffix: `food_id`, `workout_id`, `user_id`
- Some use `id`: `WorkoutMuscle.id`, `WorkoutLog.workout_log_id`
- Check model definitions for exact field names

## Database Setup System

### Management Command
```bash
python manage.py setup_database [options]
```

### Options
- `--required`: Populate only required reference data
- `--dummy`: Generate dummy test data (requires required data)
- `--full`: Both required and dummy data
- `--clear`: Remove all dummy data (preserves required)
- `--reset`: Complete reset to initial state
- `--reset-full`: Reset and repopulate everything

### Required Data Tables
- `access_levels`: admin, user, guest
- `activity_levels`: Sedentary, Lightly Active, etc.
- `muscles`: 45+ muscle definitions
- `units`: Weight, volume, length units

### Dummy Data
- 2 test users: `john_doe`/`testpass123`, `jane_smith`/`testpass456`
- 6 months of realistic data: foods, meals, logs, workouts, splits
- ~20 common foods, workout definitions, health logs

## Data Viewer System (Standard for DB Access)

**CRITICAL**: `apps.data_viewer` is the standard foundation for ALL database access.

### Why Required
- Security: SQL injection prevention, XSS protection, access control
- Consistency: Single pattern for all data access
- Auditability: Automatic logging of all access
- Maintainability: Centralized logic

### Usage
```python
from apps.data_viewer.services import DataAccessService

service = DataAccessService(user=request.user)
data = service.get_table_data(
    table_name='foods',
    filters={'food_group': 'protein'},
    sort_by='food_name',
    page=1,
    page_size=20
)
```

### Access Control
- **admin**: All tables, all data
- **user**: User-accessible tables, own data + public data
- **guest**: Limited access, own data + reference tables

See `apps/data_viewer/README.md` for complete documentation.

## Extension Points

### Adding New Trackers
1. Create model in `apps/logging/` or `apps/health/`
2. Add serializer in `serializers.py`
3. Add views (ListCreateView, RetrieveUpdateDestroyView, streak endpoint)
4. Add URLs following existing patterns
5. Create React component in `frontend/src/components/trackers/`

### Adding New Analytics
1. Add view in `apps/analytics/views.py`
2. Add URL in `apps/analytics/urls.py`
3. Create React chart component
4. Add to Analytics page

### Adding New API Endpoints
1. Create view in appropriate app's `views.py`
2. Add serializer if needed
3. Add URL in app's `urls.py`
4. Include in main `backend/urls.py`
5. Add frontend service method

### Database Schema Changes
1. Modify model in `models.py`
2. Create migration: `python manage.py makemigrations`
3. Review migration file
4. Apply: `python manage.py migrate`
5. Update `DataAccessService` table mappings if needed

## Known Issues and Fixes

### OpenAI Food Parser (Fixed: October 2025)
- **Issue**: Invalid fields in AI responses, JSON serialization errors
- **Fix**: Filter invalid fields at all entry points, serialize objects before returning
- **Prevention**: Always validate external data, use whitelist of valid fields

### FoodLog Serializer (Fixed: October 2025)
- **Issue**: `created_at` field doesn't exist in `FoodLog` model
- **Fix**: Removed `created_at` from serializer
- **Prevention**: Verify serializer fields match model fields

### OpenAI Token Limits (Fixed: October 2025)
- **Issue**: Reasoning models using all tokens for reasoning, empty responses
- **Fix**: Increased `max_completion_tokens` to 5000 for reasoning models
- **Prevention**: Monitor `finish_reason`, check `reasoning_tokens`

### Data Viewer Table Mapping (Fixed: October 2025)
- **Issue**: Generic pluralization causing table name mismatches
- **Fix**: Direct mapping dictionary for all 26 tables
- **Prevention**: Use explicit mappings, test with actual data

## Environment Variables

```env
# Database (Required)
DB_NAME=tracking_app
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

# Security (Required)
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=604800

# Django (Required)
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# OpenAI (Optional)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
```

## Development Workflow

### Running the Server
```bash
cd backend
python manage.py runserver
```

### Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Database Setup
```bash
python manage.py setup_database --required  # Reference data only
python manage.py setup_database --full      # With test data
```

### Running Tests
```bash
python manage.py test
python manage.py test apps.workouts.tests
```

## What Must NOT Be Changed

- JWT authentication flow
- User data isolation (filtering by `user` FK)
- API response format
- Database schema without migrations
- Required reference data tables
- Data Viewer system as standard for DB access

## What Can Be Safely Extended

- New tracker types (follow existing patterns)
- New analytics endpoints
- New API endpoints (with proper auth)
- Database models (with migrations)
- External service integrations

---

**Remember**: Always preserve existing functionality. Test thoroughly before deploying changes.
