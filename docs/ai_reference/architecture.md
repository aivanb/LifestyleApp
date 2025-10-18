# Architecture Reference for AI Agents

This document provides a detailed architectural map of the Workout & Macro Tracking App, including module dependencies and integration points.

## Module Map

### Backend Structure

```
backend/
├── apps/                        # Django applications
│   ├── authentication/          # JWT auth, login/register
│   ├── users/                   # User profiles, goals, metrics
│   ├── foods/                   # Food database, nutrition
│   ├── meals/                   # Meal composition
│   ├── logging/                 # Activity logs (food, weight, etc.)
│   ├── workouts/                # Exercise tracking
│   ├── health/                  # Sleep, health metrics
│   ├── analytics/               # Usage tracking, errors
│   ├── openai_service/          # AI integration
│   └── database_setup/          # DB initialization
├── backend/                     # Core Django config
│   ├── settings.py             # Main configuration
│   ├── urls.py                 # Root URL routing
│   └── wsgi.py                 # WSGI entry point
└── middleware/                  # Request/response processing
    ├── auth.py                 # JWT validation
    └── logging.py              # Request logging
```

### Frontend Structure

```
frontend/src/
├── components/                  # Reusable UI components
│   ├── trackers/               # Health metric trackers
│   ├── forms/                  # Input components
│   └── display/                # Data display components
├── pages/                      # Route-level components
├── services/                   # API communication
├── contexts/                   # Global state (Auth, Theme)
└── hooks/                      # Custom React hooks
```

## Dependencies

### Backend Dependencies

```python
# Core Framework
Django==4.2.7
djangorestframework==3.14.0

# Authentication
djangorestframework-simplejwt==5.3.0

# Database
mysqlclient==2.2.0

# CORS
django-cors-headers==4.3.1

# External APIs
openai==1.3.0          # AI integration
vosk==0.3.45           # Voice transcription

# Utilities
python-dotenv==1.0.0   # Environment variables
Pillow==10.1.0         # Image processing
django-extensions==3.2.3
```

### Frontend Dependencies

```javascript
// Core
"react": "^18.2.0"
"react-dom": "^18.2.0"
"react-router-dom": "^6.3.0"

// HTTP & State
"axios": "^0.27.2"

// UI
"@heroicons/react": "^2.2.0"

// Development
"react-scripts": "5.0.1"
```

## API Endpoints

### Authentication (`/api/auth/`)
```
POST   /register/          # User registration
POST   /login/             # User login
POST   /logout/            # User logout
GET    /profile/           # Get current user
PUT    /profile/update/    # Update profile
POST   /change-password/   # Change password
POST   /token/refresh/     # Refresh JWT
```

### Users (`/api/users/`)
```
GET    /profile/           # Full profile with metrics
PUT    /profile/           # Update profile info
GET    /goals/             # Get user goals
PUT    /goals/             # Update goals
POST   /calculate-macros/  # Calculate macro targets
GET    /body-metrics/      # Get body metrics
GET    /historical-data/   # Weight history
```

### Foods (`/api/foods/`)
```
GET    /                   # List foods
POST   /                   # Create food
GET    /<id>/              # Get food details
PUT    /<id>/              # Update food
DELETE /<id>/              # Delete food
GET    /search/            # Search foods
GET    /groups/            # List food groups
```

### Meals (`/api/meals/`)
```
GET    /                   # List meals
POST   /                   # Create meal
GET    /<id>/              # Get meal details
PUT    /<id>/              # Update meal
DELETE /<id>/              # Delete meal
POST   /foods/             # Add food to meal
```

### Logging (`/api/logging/`)
```
POST   /food/              # Log food
POST   /meal/              # Log meal
GET    /food/              # Get food logs
POST   /weight/            # Log weight
GET    /weight/            # Get weight logs
POST   /water/             # Log water
POST   /steps/             # Log steps
POST   /body-measurements/ # Log measurements
GET    /daily-summary/     # Daily macro summary
GET    /weekly-trends/     # Weekly trends
```

### Workouts (`/api/workouts/`)
```
GET    /workouts/          # List workouts
POST   /workouts/          # Create workout
GET    /workouts/<id>/     # Get workout details
POST   /sets/              # Add exercise set
POST   /muscle-logs/       # Log muscle activation
GET    /muscles/           # List muscles
POST   /splits/            # Create split
POST   /split-days/        # Add split day
POST   /log/               # Log workout session
GET    /history/           # Workout history
GET    /stats/             # Workout statistics
```

### Health (`/api/health/`)
```
POST   /sleep/             # Log sleep
GET    /sleep/             # Get sleep logs
POST   /metrics/           # Log health metrics
GET    /metrics/           # Get health metrics
```

### OpenAI (`/api/openai/`)
```
POST   /prompt/            # Send prompt to AI
GET    /usage/             # Get usage stats
POST   /parse-food/        # Parse food description
POST   /transcribe/        # Transcribe audio
GET    /transcription-status/ # Check Vosk status
```

### Data Viewer (`/api/data-viewer/`)
```
GET    /tables/            # List all tables
GET    /tables/<name>/     # Get table data
GET    /export/<name>/     # Export table to CSV
```

## Database Schema

### Core Tables

**Users & Auth**:
- `users_user` - User accounts
- `users_usergoal` - Macro/weight goals
- `users_accesslevel` - Role definitions
- `users_activitylevel` - Activity multipliers
- `users_unit` - Measurement units

**Foods & Nutrition**:
- `foods_food` - Food database
- `foods_foodgroup` - Food categories
- `meals_meal` - Meal templates
- `meals_mealfood` - Meal composition

**Activity Logs**:
- `logging_foodlog` - Food intake
- `logging_weightlog` - Weight tracking
- `logging_waterlog` - Hydration
- `logging_stepslog` - Daily steps
- `logging_cardiolog` - Cardio sessions
- `logging_bodymeasurementlog` - Body measurements

**Workouts**:
- `workouts_workout` - Workout definitions
- `workouts_workoutset` - Exercise sets
- `workouts_muscle` - Muscle groups
- `workouts_musclelog` - Muscle activation
- `workouts_split` - Training splits
- `workouts_splitday` - Split schedule

**Health & Analytics**:
- `health_sleeplog` - Sleep tracking
- `health_healthmetricslog` - General health
- `analytics_apiusagelog` - API usage
- `analytics_errorlog` - Error tracking

## Integration Points

### Authentication Flow
1. User provides credentials
2. Django validates against database
3. JWT tokens generated (access + refresh)
4. Frontend stores tokens in localStorage
5. Axios interceptor adds token to requests
6. Middleware validates token on each request

### Data Flow
1. **User Input** → React Component
2. **Validation** → Frontend form validation
3. **API Call** → Axios service method
4. **Authentication** → JWT middleware
5. **Processing** → Django view/serializer
6. **Database** → MySQL via Django ORM
7. **Response** → JSON with standard format
8. **UI Update** → React state update

### OpenAI Integration
1. User input (text/voice)
2. Frontend sends to backend
3. Backend formats prompt
4. OpenAI API call
5. Response parsing
6. Usage tracking
7. Structured data return

### Voice Processing
1. Frontend records audio
2. Sends to backend as blob
3. Vosk processes offline (if available)
4. Falls back to browser speech API
5. Text sent to OpenAI for parsing
6. Structured food data returned

## Critical Paths

### User Registration
```
Register Form → /api/auth/register/ → Create User → Generate JWT → Return tokens
```

### Food Logging
```
Food Search → Select/Create Food → Set Quantity → /api/logging/food/ → Calculate Macros → Update Daily Summary
```

### Workout Tracking
```
Create Workout → Add Exercises → Log Session → Track Muscles → Update Statistics
```

## Module Communication

### Django App Dependencies
```
authentication → users (User model)
users → (standalone)
foods → users (ownership)
meals → foods, users
logging → foods, meals, users
workouts → users
health → users
analytics → users
openai_service → users, foods
```

### Frontend Service Dependencies
```
api.js → Base axios instance
├── All other services depend on api.js
├── AuthContext → Uses api.js for auth
└── Components → Use specific services
```

## Environment Dependencies

### Required Environment Variables
```
# Database
DB_NAME
DB_USER
DB_PASSWORD
DB_HOST
DB_PORT

# Security
SECRET_KEY (required, no default)
DEBUG (defaults to False)

# JWT
JWT_SECRET_KEY
JWT_ACCESS_TOKEN_LIFETIME
JWT_REFRESH_TOKEN_LIFETIME

# External Services
OPENAI_API_KEY (optional)
OPENAI_MODEL

# Frontend
REACT_APP_API_URL
```

## Performance Considerations

### Database Indexes
- Foreign keys automatically indexed
- Additional indexes on frequently queried fields
- Composite indexes for complex queries

### API Optimization
- Pagination (default 20 items)
- Select/prefetch related for joins
- Bulk operations where applicable

### Frontend Optimization
- Code splitting by route
- Lazy loading for components
- Memoization for expensive calculations
- Debounced search inputs

## Security Architecture

### Authentication Layers
1. Password hashing (Django default)
2. JWT token generation
3. Token expiration (1hr access, 7d refresh)
4. Middleware validation
5. Permission classes on views

### Data Protection
- User data isolation via foreign keys
- Input validation at serializer level
- SQL injection prevention via ORM
- XSS protection in React
- CORS restricted to frontend origin

---

**Note for AI Agents**: This architecture is actively maintained. Always verify module existence before making changes. Follow established patterns when adding new features.
