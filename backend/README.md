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
- OpenAI API key

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
   This creates only required reference data (access_levels, activity_levels, muscles, units).

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
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user
- `POST /api/auth/logout/` - Logout user
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/update/` - Update profile
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/token/refresh/` - Refresh token

### OpenAI Integration
- `POST /api/openai/prompt/` - Send prompt to OpenAI
- `GET /api/openai/usage/` - Get usage statistics

## Database Models

### Core Models
- `User` - Custom user model with extended fields
- `AccessLevel` - User permission levels
- `Unit` - Measurement units
- `ActivityLevel` - User activity levels

### Data Models
- `Food` - Nutritional information
- `Meal` - Meal compositions
- `FoodLog` - Food consumption tracking
- `WeightLog` - Weight tracking
- `Workout` - Exercise definitions
- `WorkoutLog` - Exercise performance tracking

### Analytics Models
- `ApiUsageLog` - API usage tracking
- `ErrorLog` - Error logging

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
Access admin interface at `/admin/` after creating superuser.

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
