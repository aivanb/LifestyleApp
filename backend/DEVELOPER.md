# Backend Developer Guide

Technical documentation for developers and AI agents working on the Django backend.

## Architecture Overview

The backend follows Django's app-based architecture with clear separation of concerns:

```
backend/
├── apps/                    # Django applications
│   ├── authentication/     # JWT auth, user management
│   ├── users/              # User models and profiles
│   ├── foods/              # Food database and meals
│   ├── logging/            # Activity logging
│   ├── workouts/            # Exercise tracking
│   ├── health/              # Health metrics
│   ├── analytics/          # Usage and error tracking
│   └── openai_service/     # AI integration
├── middleware/              # Custom middleware
├── backend/                # Django project settings
└── requirements.txt        # Dependencies
```

## App Structure and Responsibilities

### Authentication App (`apps/authentication/`)
- **Purpose**: JWT-based authentication and user management
- **Key Files**:
  - `serializers.py` - User registration, login, profile serializers
  - `views.py` - Authentication endpoints
  - `urls.py` - Authentication URL patterns
- **Endpoints**: Registration, login, logout, profile management, password change

### Users App (`apps/users/`)
- **Purpose**: User models and profile management
- **Key Files**:
  - `models.py` - User, AccessLevel, Unit, ActivityLevel, UserGoal models
- **Models**: Custom User model extending AbstractUser with additional fields

### Foods App (`apps/foods/`)
- **Purpose**: Food database and meal management
- **Key Files**:
  - `models.py` - Food, Meal, MealFood models
- **Models**: Nutritional data, meal compositions, food-meal relationships

### Logging App (`apps/logging/`)
- **Purpose**: Activity and consumption tracking
- **Key Files**:
  - `models.py` - FoodLog, WeightLog, BodyMeasurementLog, WaterLog, StepsLog, CardioLog
- **Models**: Various logging tables for tracking user activities

### Workouts App (`apps/workouts/`)
- **Purpose**: Exercise tracking and muscle data
- **Key Files**:
  - `models.py` - Workout, Muscle, WorkoutLog, MuscleLog, WorkoutMuscle models
- **Models**: Exercise definitions, muscle activation, workout performance

### Health App (`apps/health/`)
- **Purpose**: Health metrics and sleep tracking
- **Key Files**:
  - `models.py` - SleepLog, HealthMetricsLog models
- **Models**: Sleep data, daily health metrics

### Analytics App (`apps/analytics/`)
- **Purpose**: API usage and error tracking
- **Key Files**:
  - `models.py` - ApiUsageLog, ErrorLog models
- **Models**: Usage statistics, error logging

### OpenAI Service App (`apps/openai_service/`)
- **Purpose**: AI integration and prompt handling
- **Key Files**:
  - `services.py` - OpenAIService class
  - `views.py` - OpenAI endpoints
  - `urls.py` - OpenAI URL patterns
- **Features**: Prompt processing, usage tracking, cost calculation

## Middleware Architecture

### AuthMiddleware (`middleware/auth.py`)
- **Purpose**: JWT token validation for protected routes
- **Functionality**:
  - Extracts Bearer token from Authorization header
  - Validates token and retrieves user
  - Sets request.user for authenticated requests
  - Returns 401 for invalid/missing tokens

### LoggingMiddleware (`middleware/logging.py`)
- **Purpose**: Request/response logging and error tracking
- **Functionality**:
  - Logs API requests and responses
  - Tracks response times
  - Logs exceptions and errors
  - Stores data in ApiUsageLog and ErrorLog models

## Database Schema Integration

### Model Relationships
All models follow the exact schema from `notes/database_structure.md`:

- **Foreign Key Relationships**: Proper FK constraints maintain data integrity
- **Many-to-Many**: MealFood, WorkoutMuscle junction tables
- **JSON Fields**: WorkoutLog.attributes for flexible data storage
- **Unique Constraints**: Username, email uniqueness, composite unique keys

### Migration Strategy
- All models have corresponding Django migrations
- Database schema matches documentation exactly
- Use `python manage.py makemigrations` for schema changes
- Use `python manage.py migrate` to apply changes

## Database Setup System

### Overview
The database setup system provides comprehensive tools for initializing and managing database state. It's organized into three main categories:

1. **Required Data**: Reference tables necessary for application functionality
2. **Dummy Data**: Realistic test data for development and testing
3. **Reset Utilities**: Tools for resetting database to various states

### Directory Structure
```
backend/
├── database_setup/              # Standalone scripts (can be run directly)
│   ├── __init__.py
│   ├── required_data.py        # Populate required reference tables
│   ├── dummy_data.py           # Generate realistic test data
│   └── reset_database.py       # Database reset utilities
└── apps/
    └── database_setup/          # Django app with management commands
        ├── apps.py
        └── management/
            └── commands/
                └── setup_database.py  # Django management command
```

### Required Data Tables

#### Purpose
These tables contain reference data that must exist for the application to function properly. They should be populated after migrations and preserved during data resets.

#### Tables and Content
1. **access_levels**: User permission roles
   - admin, user, guest

2. **activity_levels**: Physical activity levels for TDEE calculations
   - Sedentary, Lightly Active, Moderately Active, Very Active, Extremely Active
   - Each with description for user selection

3. **muscles**: Complete muscle database (45+ muscles)
   - Organized by muscle groups: chest, back, arms, legs, core, other
   - Includes major and minor muscles for workout tracking
   - Examples: Pectoralis Major (Upper/Middle/Lower), Latissimus Dorsi, Quadriceps, etc.

4. **units**: Measurement units for various metrics
   - Weight: lb, kg, oz, g
   - Volume: ml, l, fl oz, cup, tbsp, tsp, gallon, pint, quart
   - Length: in, cm, ft, m, mile, km
   - Other: unit, serving, piece, slice, scoop

#### Usage
```bash
# Populate all required data
python manage.py setup_database --required

# Or run script directly
python backend/database_setup/required_data.py
```

### Dummy Data System

#### Purpose
Generates realistic test data for development, testing, and demonstration. Creates 2 users with approximately 6 months of varied data.

#### Generated Data

**Users (2 profiles)**:
- **john_doe**: Male, imperial units, very active, cutting phase
  - Height: 72 inches (6 feet)
  - Target: 185 lb
  - Location: Gold's Gym
  - Workout: Push/Pull/Legs split, 5 days/week
  
- **jane_smith**: Female, metric units, moderately active, maintenance
  - Height: 165 cm
  - Target: 62 kg
  - Location: Planet Fitness
  - Workout: Upper/Lower split, 4 days/week

**Foods Database** (~20 items):
- Proteins: Chicken, beef, salmon, eggs, Greek yogurt, protein powder
- Carbs: Rice (white/brown), sweet potato, oatmeal, bread, pasta, banana
- Vegetables: Broccoli, spinach, carrots, mixed greens
- Fats: Olive oil, almonds, peanut butter, avocado

**Time-Series Data** (~180 days each):
- **Weight Logs**: 3x per week with gradual trends
- **Food Logs**: 3-5 meals per day with realistic portions
- **Workout Logs**: Based on user's workout frequency
  - 3-4 sets per exercise
  - Progressive weight tracking
  - RIR (Reps in Reserve) tracking
- **Cardio Logs**: Occasional cardio sessions (30% probability after workouts)
- **Sleep Logs**: Daily sleep data with realistic variations
  - Bedtime, wake time, sleep stages
  - Number of wake-ups, resting heart rate
- **Health Metrics**: Daily wellness tracking
  - Energy levels, mood, stress, soreness
  - Blood pressure, resting heart rate
- **Body Measurements**: Weekly tracking
  - Upper arm, lower arm, waist, shoulder, leg, calf
- **Water Logs**: Daily hydration tracking
- **Steps Logs**: Daily step counts (6,000-12,000 range)

**Workouts and Splits**:
- User-specific workout routines with muscle activation ratings
- Complete workout splits with target muscle activation
- Realistic progression over 6 months

**API Usage Logs**:
- 20-50 API calls per user
- Meal parsing requests with realistic token usage

#### Credentials
Test user credentials for login:
```
Username: john_doe    | Password: testpass123 | Email: john.doe@example.com
Username: jane_smith  | Password: testpass456 | Email: jane.smith@example.com
```

#### Usage
```bash
# Generate dummy data only (requires required data to exist)
python manage.py setup_database --dummy

# Generate both required and dummy data
python manage.py setup_database --full

# Or run script directly
python backend/database_setup/dummy_data.py
```

### Reset Utilities

#### Clear Dummy Data
Removes all user-generated and test data while preserving required reference tables.

**What it clears**:
- All user accounts and related data
- Food logs, workout logs, health logs
- User-created meals and workouts
- API usage and error logs

**What it preserves**:
- access_levels, activity_levels, muscles, units
- Django system tables (migrations, sessions, etc.)

```bash
python manage.py setup_database --clear
```

#### Reset Database
Complete reset to initial state. Removes all user data, leaving only required reference data.

```bash
python manage.py setup_database --reset
```

#### Full Reset and Repopulate
Comprehensive operation that:
1. Clears all dummy data
2. Repopulates required data
3. Generates fresh dummy data

Useful for:
- Starting development with clean data
- Resetting test environment
- Demonstrating features with fresh data

```bash
python manage.py setup_database --reset-full
```

### Implementation Details

#### Module Design
Each module is standalone and can be run independently:
```python
# Import and use programmatically
from database_setup import populate_required_data, populate_dummy_data
from database_setup import reset_database, clear_dummy_data

# In tests or scripts
populate_required_data()
populate_dummy_data()
```

#### Django Integration
The `apps.database_setup` Django app provides management commands:
- Registered in INSTALLED_APPS
- Available via `python manage.py setup_database`
- Includes user confirmations for destructive operations
- Provides colored console output for better UX

#### Error Handling
All functions include:
- Try-catch blocks for graceful error handling
- Detailed error messages with stack traces
- Success/failure return values
- Progress indicators for long operations

#### Data Generation Strategy
Dummy data uses controlled randomization:
- Consistent patterns for realistic data
- Appropriate ranges for each metric
- Logical progressions (weight trends, strength gains)
- Varied but realistic daily fluctuations

### Development Workflow

#### Initial Setup
```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE tracking_app;"

# 2. Run migrations
python manage.py migrate

# 3. Populate with test data
python manage.py setup_database --full
```

#### Testing Workflow
```bash
# Before tests: Reset with fresh data
python manage.py setup_database --reset-full

# Run tests
python manage.py test

# After tests: Verify data state
python manage.py shell
>>> from apps.users.models import User
>>> User.objects.count()  # Should have 2 test users
```

#### Production Deployment
```bash
# Populate only required data
python manage.py setup_database --required

# Never run --dummy or --full in production!
```

### Best Practices

1. **Don't Modify Required Data Scripts**: These define application constants
2. **Version Control**: All setup scripts should be in version control
3. **Test After Changes**: Run full setup after modifying generation logic
4. **Document Custom Data**: If adding new dummy data, document it
5. **Separate Concerns**: Keep required and dummy data strictly separated
6. **Idempotency**: Scripts use get_or_create to allow multiple runs

## API Design Patterns

### Response Format
Consistent API response structure:
```json
{
  "data": { ... },     // Success response data
  "error": { ... }     // Error information
}
```

### Authentication Flow
1. User registers/logs in → receives JWT tokens
2. Access token included in Authorization header
3. Middleware validates token on protected routes
4. Refresh token used to get new access tokens
5. Logout blacklists refresh token

### Error Handling
- Structured error responses with consistent format
- Proper HTTP status codes
- Detailed error logging for debugging
- User-friendly error messages

## OpenAI Integration

### Service Architecture
- `OpenAIService` class handles all OpenAI API communication
- Automatic usage tracking and cost calculation
- Error handling with retry logic
- Response logging for analytics

### Usage Monitoring
- All API calls logged to `ApiUsageLog`
- Token usage and cost tracking
- Success/failure rate monitoring
- User-specific usage statistics

## Security Implementation

### Authentication Security
- JWT tokens with proper expiration times
- Secure token storage recommendations
- Token blacklisting on logout
- Automatic token refresh mechanism

### Data Protection
- Input validation on all endpoints
- SQL injection prevention through ORM
- XSS protection in responses
- CSRF protection for state-changing operations

### API Security
- Rate limiting considerations
- Input sanitization
- Proper error handling without information leakage
- Audit logging for sensitive operations

## Development Guidelines

### Code Organization
- Follow Django's app-based structure
- Keep models, views, serializers in separate files
- Use proper imports and avoid circular dependencies
- Document public APIs and complex logic

### Testing Strategy
- Unit tests for models, services, utilities
- Integration tests for API endpoints
- Middleware testing for auth and logging
- Database transaction testing

### Performance Considerations
- Database query optimization
- Proper indexing on foreign keys and search fields
- Pagination for large datasets
- Caching strategies for frequently accessed data

## Environment Configuration

### Required Environment Variables
```env
DB_NAME=tracking_app
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
SECRET_KEY=your-secret-key
DEBUG=True
OPENAI_API_KEY=your-openai-key
JWT_SECRET_KEY=your-jwt-secret
```

### Settings Configuration
- Database connection settings
- JWT token lifetime configuration
- CORS settings for frontend integration
- Logging configuration
- OpenAI API configuration

## Deployment Considerations

### Production Settings
- Set `DEBUG=False` for production
- Configure production database
- Set up static file serving
- Use production WSGI server (Gunicorn)
- Configure proper logging

### Database Considerations
- Use connection pooling for high traffic
- Set up database backups
- Monitor query performance
- Use read replicas if needed

## Monitoring and Debugging

### Logging Strategy
- Structured logging with proper levels
- Request/response logging for debugging
- Error tracking and alerting
- Performance monitoring

### Debug Tools
- Django debug toolbar for development
- Database query logging
- API usage monitoring
- Error rate tracking

## Common Development Tasks

### Adding New Models
1. Define model in appropriate app's `models.py`
2. Run `python manage.py makemigrations`
3. Run `python manage.py migrate`
4. Update admin interface if needed

### Adding New API Endpoints
1. Create serializer in app's `serializers.py`
2. Create view in app's `views.py`
3. Add URL pattern in app's `urls.py`
4. Include app URLs in main `urls.py`

### Database Schema Changes
1. Modify model definitions
2. Create migration: `python manage.py makemigrations`
3. Review migration file
4. Apply migration: `python manage.py migrate`
5. Test changes thoroughly

## Integration Points

### Frontend Integration
- CORS configuration for React frontend
- JWT token handling
- API response format consistency
- Error handling coordination

### External Services
- OpenAI API integration
- Database connection management
- Third-party service error handling
- Rate limiting considerations
