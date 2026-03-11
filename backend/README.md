# Backend README

Django backend for the Tracking App with comprehensive API endpoints for user management, data tracking, and OpenAI integration.

## Features

- **JWT Authentication**: Secure token-based authentication
- **User Management**: Registration, login, profile management
- **Database Models**: Complete schema matching the requirements
- **OpenAI Integration**: AI prompt handling with usage tracking
- **API Logging**: Comprehensive request/response logging
- **Error Handling**: Structured error responses and logging

## Quick Start

### Prerequisites
- Python 3.8+
- MySQL 8.0+
- OpenAI API key (optional, for AI features)

### Installation

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   cp ../env.example .env
   # Edit .env with your settings
   ```

4. **Set up database**:
   ```sql
   CREATE DATABASE tracking_app;
   ```

5. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Initialize database** (choose one):
   
   a. **Development/Testing** (with dummy data):
   ```bash
   python manage.py setup_database --full
   ```
   This creates required reference data AND 2 test users with 6 months of realistic data.
   
   b. **Production** (required data only):
   ```bash
   python manage.py setup_database --required
   ```
   This creates only required reference data (access_levels, activity_levels, muscles, units, invite_key). Default dev invite keys (e.g. `dev-invite-key-001`) are created for local use; each key can only be used once for registration.

7. **Start server**:
   ```bash
   python manage.py runserver
   ```

### Dummy Test Users
When using `--full` or `--dummy` flag, two test users are created:
- **Username**: `john_doe` | **Password**: `testpass123`
- **Username**: `jane_smith` | **Password**: `testpass456`

## API Endpoints

### Authentication
- `POST /api/auth/validate-invite-key/` - Validate an invite key (body: `{ "key": "..." }`)
- `POST /api/auth/register/` - Register new user (requires valid, unused `invite_key` in body)
- `POST /api/auth/login/` - Login user
- `POST /api/auth/logout/` - Logout user
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/update/` - Update profile
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/token/refresh/` - Refresh token

### Users
- `GET /api/users/profile/` - Complete profile with metrics
- `PUT /api/users/profile/` - Update personal information
- `GET /api/users/goals/` - Retrieve user goals
- `PUT /api/users/goals/` - Update user goals
- `GET /api/users/calculate-metrics/` - Calculate body metrics
- `POST /api/users/calculate-macros/` - Generate macro goals

### Foods
- `GET /api/foods/` - List foods
- `POST /api/foods/` - Create food
- `GET /api/foods/<id>/` - Get food details
- `PUT /api/foods/<id>/` - Update food
- `DELETE /api/foods/<id>/` - Delete food
- `POST /api/foods/logs/` - Log food consumption
- `GET /api/foods/logs/` - Get food logs

### Workouts
- `GET /api/workouts/` - List workouts
- `POST /api/workouts/` - Create workout
- `GET /api/workouts/logs/` - List workout logs
- `POST /api/workouts/logs/` - Log workout session
- `GET /api/workouts/splits/` - List splits
- `POST /api/workouts/splits/` - Create split

### Health & Logging
- `POST /api/logging/weight/` - Log weight
- `POST /api/logging/water/` - Log water
- `POST /api/health/sleep/` - Log sleep
- Similar endpoints for steps, cardio, body measurements, health metrics

### Analytics
- `GET /api/analytics/workouts/progression/` - Workout progression
- `GET /api/analytics/foods/timing/` - Food timing analysis
- `GET /api/analytics/health/weight-progression/` - Weight progression
- Many more analytics endpoints available

### OpenAI
- `POST /api/openai/prompt/` - Send prompt to OpenAI
- `GET /api/openai/usage/` - Get usage statistics
- `POST /api/openai/parse-food/` - Parse food from natural language

## Database Management

### Setup Commands
```bash
# Populate required reference data
python manage.py setup_database --required

# Populate dummy test data (2 users, 6 months)
python manage.py setup_database --dummy

# Both required and dummy data
python manage.py setup_database --full

# Clear all dummy data (preserves required data)
python manage.py setup_database --clear

# Reset database to initial state
python manage.py setup_database --reset

# Full reset and repopulate
python manage.py setup_database --reset-full
```

### Required Data Tables
These tables are essential for the application to function:
- `access_levels` - User permission roles (admin, user, guest)
- `activity_levels` - Physical activity levels
- `muscles` - Complete muscle database (45+ muscles)
- `units` - Measurement units (weight, volume, length, etc.)

### Dummy Data Tables
Test data includes realistic entries for:
- **Users**: 2 test accounts with different profiles
- **Foods**: 20+ common food items
- **Meals**: Pre-configured meal combinations
- **Workouts**: Exercise definitions with muscle activation
- **Splits**: Workout split programs
- **Logs**: ~180 days of food, workout, sleep, and health data

## Configuration

### Environment Variables
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

### Settings
- JWT token lifetime configuration
- CORS settings for frontend integration
- Database connection settings
- Logging configuration

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Django Admin
Access admin interface at `/admin/` after creating superuser:
```bash
python manage.py createsuperuser
```

## Architecture

### Apps Structure
- `authentication` - JWT auth and user management
- `users` - User models and profiles
- `foods` - Food database and meals
- `logging` - Activity logging
- `workouts` - Exercise tracking
- `health` - Health metrics
- `analytics` - Usage and error tracking
- `openai_service` - AI integration
- `data_viewer` - Database access service

### Middleware
- `AuthMiddleware` - JWT token validation
- `LoggingMiddleware` - Request/response logging

## Security

### Authentication
- JWT tokens with access/refresh pattern
- Secure password hashing
- Token blacklisting on logout
- Automatic token refresh

### Data Protection
- Input validation on all endpoints
- SQL injection prevention
- XSS protection
- CSRF protection

## Monitoring

### Logging
- Request/response logging
- Error tracking
- API usage monitoring
- Performance metrics

### Analytics
- User behavior tracking
- API usage statistics
- Error rate monitoring
- Cost tracking for OpenAI usage
