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

### Foods App - Food Logging System (`apps/foods/`)
- **Purpose**: Food database, meals, and food logging
- **Key Files**:
  - `models.py` - Food, Meal, MealFood models
  - `serializers.py` - Food/Meal creation with macro calculations
  - `views.py` - Food CRUD, meal creation, food logging endpoints
  - `urls.py` - Food logging URL patterns
- **Features**:
  - **Food Creation**: Create foods with complete nutritional data
  - **Meal Creation**: Combine multiple foods into meals with custom servings
  - **Food Logging**: Track food consumption with automatic macro calculations
  - **Public Sharing**: Mark foods/meals as public for community access
  - **Macro Previews**: Real-time macro calculations for foods and meals
  - **Create & Log**: Option to log food/meal immediately after creation
  - **Search & Filter**: Find foods by keyword, macro ranges, food group
  - **Recently Logged**: Quick access to frequently logged foods
- **Access Control**:
  - Users can only edit/delete their own foods
  - Users can view own foods + public foods
  - Public flag enables sharing across users

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

## Data Viewer System - Standard for Database Access

### Overview
**IMPORTANT**: The Data Viewer system (`apps.data_viewer`) is the **STANDARD FOUNDATION** for all database access in this application. All future systems requiring data retrieval MUST use this module.

### Why It's Required
- **Security**: Built-in SQL injection prevention, XSS protection, access control
- **Consistency**: Single pattern for all data access
- **Auditability**: Automatic logging of all data access
- **Maintainability**: Centralized logic easier to update
- **Performance**: Optimized queries with pagination

### When to Use
✅ **ALWAYS** use for:
- Viewing database tables
- User data retrieval
- Admin panels
- Analytics dashboards
- Reports and exports
- API endpoints returning database data

❌ **NEVER** bypass for:
- Direct database queries in views
- Custom data access without authorization
- Unlogged data access

### Quick Start
```python
from apps.data_viewer.services import DataAccessService

# In any view or service
service = DataAccessService(user=request.user)

# Get filtered data
data = service.get_table_data(
    table_name='foods',
    filters={'food_group': 'protein'},
    sort_by='food_name',
    page=1,
    page_size=20
)
```

### Access Control
The system automatically enforces role-based access:
- **admin**: All tables, all data
- **user**: User-accessible tables, own data + public data
- **guest**: Limited access, own data + reference tables

### Integration Guide
See `apps/data_viewer/README.md` for complete documentation including:
- API endpoints
- Frontend integration
- Security features
- Error handling
- Performance tips
- Best practices

## Known Issues and Fixes

### Issue: OpenAI Food Parser Invalid Fields & JSON Serialization (Fixed: October 2025)
**Cause**: The OpenAI food parser had two related issues:
1. **Invalid Fields**: AI responses included fields like `quantity`, `protein_per_item`, `servings`, `protein_per_serving` that don't exist in the `Food` model
2. **JSON Serialization**: The parser was returning Django model objects (`Food`, `Meal`) directly in the API response, which can't be serialized to JSON

**Error Symptoms**:
```
TypeError: Food() got unexpected keyword arguments: 'quantity', 'protein_per_item'
TypeError: Object of type Food is not JSON serializable
```
- Food parsing fails when using the voice input/chatbot feature
- Food logs are not created  
- UI shows "0 food(s) logged" with error message
- Internal Server Error when returning parsed food data

**Fix**: 
1. Updated `_ensure_complete_metadata()`, `_generate_metadata()`, and `_get_default_metadata()` methods to filter invalid fields at ALL entry points
2. Modified `parse_food_input()` to convert Food/Meal objects to serializable dicts before adding to result
3. Added field filtering BEFORE merging with existing metadata to catch invalid fields early

**How to avoid**:
- Always validate and filter external data (especially AI responses) before passing to model constructors
- Never return Django model objects directly in API responses - always serialize them
- Use a whitelist of valid field names when dealing with dynamic metadata
- Filter invalid fields at multiple points in the pipeline for robustness
- Add comprehensive E2E tests that call actual API endpoints
- Consider using Django's `get_fields()` method to dynamically get valid model fields

### Issue: FoodLog Serializer Field Mismatch (Fixed: October 2025)
**Cause**: The `FoodLogSerializer` in `apps/foods/serializers.py` was trying to access a `created_at` field that doesn't exist in the `FoodLog` model (located in `apps/logging/models.py`). The `FoodLog` model only has a `date_time` field for temporal tracking, not `created_at`.

**Error Symptoms**:
```
django.core.exceptions.ImproperlyConfigured: Field name `created_at` is not valid for model `FoodLog`.
```
- Food logs API endpoint returns 500 error
- Frontend unable to fetch food logs

**Fix**: Removed `created_at` from the `FoodLogSerializer` fields list and read_only_fields.

**How to avoid**:
- Always verify that serializer fields match the actual model fields
- When models are in different apps (e.g., serializer in `foods` but model in `logging`), double-check field names
- Run comprehensive tests after adding new serializer fields
- Consider using `fields = '__all__'` during development and explicitly list fields in production

### Issue: OpenAI Empty Responses - Reasoning Model Token Limits (Fixed: October 2025)
**Cause**: The application uses `gpt-5-mini`, a reasoning model that uses "reasoning tokens" for internal thought processing. With `max_completion_tokens=1000`, the model was using all 1000 tokens for reasoning and had no tokens left for the actual response content.

**Error Symptoms**:
```python
{
  "choices": [{"message": {"content": ""}, "finish_reason": "length"}],
  "usage": {
    "completion_tokens": 1000,
    "completion_tokens_details": {"reasoning_tokens": 1000}
  }
}
```
- Metadata generation returns all zeros
- Brand names not captured
- Food logs created with empty nutritional data
- Response content is empty string

**Fix**: Updated `apps/openai_service/services.py` to detect reasoning models (gpt-5-*, o1-*, o3-*) and increase `max_completion_tokens` to 5000, ensuring enough tokens for both reasoning and response content.

**How to avoid**:
- When using reasoning models, allocate 3-5x more tokens than standard models
- Monitor `finish_reason` in responses - "length" indicates truncation
- Check `completion_tokens_details.reasoning_tokens` to see internal token usage
- Add debug logging to detect empty responses immediately
- Test with actual API calls, not just mocked responses

### Issue: OpenAI Prompt Clarity - JSON Parsing Failures (Fixed: October 2025)
**Cause**: The AI prompts were not explicit enough about output format requirements. The OpenAI API was sometimes returning responses wrapped in markdown code blocks (```json ... ```) or with extra explanatory text, causing JSON parsing to fail.

**Error Symptoms**:
```
ERROR Failed to parse metadata JSON: Expecting value: line 1 column 1 (char 0)
ERROR Response was: ```json\n{...}\n```
```
- Metadata generation fails silently
- Falls back to default metadata (all zeros)
- No error visible to user

**Fix**: 
1. Rewrote prompts with explicit "CRITICAL INSTRUCTIONS" sections
2. Added "Return ONLY valid JSON" emphasis repeated multiple times
3. Provided concrete examples of expected output
4. Listed valid enum values explicitly
5. Implemented markdown code block detection and removal
6. Enhanced error logging to show first 200-500 chars of failed responses

**How to avoid**:
- Be extremely explicit with LLM formatting requirements
- Repeat critical instructions multiple times in prompts
- Always provide concrete examples of expected output
- Implement robust parsing that handles common variations (markdown, whitespace)
- Log raw responses when parsing fails for debugging
- Test prompts with actual API calls to verify behavior

### Issue: Data Viewer Table Mapping - Model Name Resolution (Fixed: October 2025)
**Cause**: The `_get_model_name()` function was using generic pluralization logic (e.g., `foods` → `Foods`) instead of actual Django model names (`Food`). Django models are typically singular, but the function was making them plural.

**Error Symptoms**:
```
ERROR Table 'foods' does not exist
```
- Data Viewer shows table list but can't access tables
- Schema requests fail with 400 errors
- Data requests fail even though tables exist in database
- Inconsistent behavior across different tables

**Fix**: Replaced generic conversion logic with comprehensive direct mapping dictionary:
```python
direct_mapping = {
    'foods': 'Food',
    'meals': 'Meal',
    'users': 'User',
    ...  # All 26 tables mapped explicitly
}
```

**How to avoid**:
- Never rely on naming conventions when mapping between layers
- Use explicit mappings that can be verified
- Test with actual data, not just mocked responses
- Create integration tests that verify all tables are accessible
- Document the mapping in code comments

## Common Development Tasks

### Adding New Models
1. Define model in appropriate app's `models.py`
2. Run `python manage.py makemigrations`
3. Run `python manage.py migrate`
4. Update admin interface if needed
5. **NEW**: Test access through Data Viewer system

### Adding New API Endpoints
1. Create serializer in app's `serializers.py`
2. Create view in app's `views.py`
3. Add URL pattern in app's `urls.py`
4. Include app URLs in main `urls.py`
5. **NEW**: Consider using DataAccessService instead of custom queries

### Database Schema Changes
1. Modify model definitions
2. Create migration: `python manage.py makemigrations`
3. Review migration file
4. Apply migration: `python manage.py migrate`
5. Test changes thoroughly
6. **NEW**: Update Data Viewer table mappings if needed

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
