# Developer Guide for AI Agents

This guide provides essential technical context for AI agents working on the Workout & Macro Tracking App. It covers architecture, data flow, APIs, invariants, edge cases, and extension points.

## System Architecture

### Technology Stack
- **Backend**: Django 4.2.7 + Django REST Framework 3.14.0, MySQL 8.0+
- **Frontend**: React 18.2.0, React Router 6.3.0, Axios
- **Authentication**: JWT (django-rest-framework-simplejwt)
- **External Services**: OpenAI API (gpt-3.5-turbo), Vosk (offline voice)

### High-Level Data Flow
```
Frontend (React) → HTTP/JWT → Backend (Django) → MySQL Database
                              ↓
                        External APIs (OpenAI, Vosk)
```

### Directory Structure
```
TrackingApp/
├── backend/              # Django REST API
│   ├── apps/            # Feature-specific Django apps
│   ├── backend/         # Core Django configuration
│   ├── middleware/      # Request/response processing
│   └── database_setup/  # DB initialization scripts
├── frontend/            # React single-page application
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Route components
│       ├── services/    # API communication layer
│       └── contexts/   # Global state management
├── tests/               # All test files
│   ├── backend/         # Django tests
│   ├── frontend/        # React tests
│   └── e2e/            # End-to-end tests
└── docs/ai_reference/   # Deep technical reference
```

## Backend Architecture

### Django Apps Structure
1. **authentication** - JWT auth, user registration/login
2. **users** - User models, profiles, goals, body metrics
3. **foods** - Food database, meals, food logging
4. **meals** - Meal composition (currently minimal)
5. **logging** - Activity logs (food, weight, water, steps, cardio, body measurements)
6. **workouts** - Exercise tracking, splits, muscle priorities
7. **health** - Sleep tracking, health metrics
8. **analytics** - Usage tracking, error logging, data analytics
9. **openai_service** - AI integration, food parsing, voice transcription
10. **data_viewer** - Database access service (standard for all DB access)
11. **database_setup** - Database initialization commands

### API Endpoints (Complete List)

#### Authentication (`/api/auth/`)
- `POST /api/auth/login/` - User login, returns JWT tokens
- `POST /api/auth/validate-invite-key/` - Check if an invite key is valid and unused (body: `{ "key": "..." }`)
- `POST /api/auth/register/` - User registration (requires valid `invite_key` in body; each key can only be used once)
- `POST /api/auth/logout/` - Logout, blacklists refresh token
- `GET /api/auth/profile/` - Get current user profile
- `PUT /api/auth/profile/update/` - Update profile
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/token/refresh/` - Refresh JWT access token

#### Users (`/api/users/`)
- `GET /api/users/profile/` - Complete profile with metrics
- `PUT /api/users/profile/` - Update personal information
- `GET /api/users/goals/` - Retrieve user goals
- `PUT /api/users/goals/` - Update user goals
- `GET /api/users/calculate-metrics/` - Calculate body metrics
- `POST /api/users/calculate-macros/` - Generate macro goals
- `GET /api/users/body-metrics/` - Get body metrics
- `GET /api/users/historical-data/` - Weight history and trends

#### Foods (`/api/foods/`)
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

#### Logging (`/api/logging/`)
- `POST /api/logging/weight/` - Log weight
- `GET /api/logging/weight/` - Get weight logs
- `PUT /api/logging/weight/<id>/` - Update weight log
- `DELETE /api/logging/weight/<id>/` - Delete weight log
- `GET /api/logging/weight/streak/` - Get weight streak
- Similar endpoints for: `water/`, `steps/`, `cardio/`, `body-measurement/`
- `GET /api/logging/streaks/` - Get all tracker streaks

#### Workouts (`/api/workouts/`)
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

#### Health (`/api/health/`)
- `POST /api/health/sleep/` - Log sleep
- `GET /api/health/sleep/` - Get sleep logs
- `PUT /api/health/sleep/<id>/` - Update sleep log
- `DELETE /api/health/sleep/<id>/` - Delete sleep log
- `GET /api/health/sleep/streak/` - Get sleep streak
- Similar endpoints for: `health-metrics/`

#### Analytics (`/api/analytics/`)
- `GET /api/analytics/date-bounds/?section=workouts|foods` - First valid date and today for custom range default
- Workout and food chart endpoints accept shared date range: `range` (1week|2weeks|1month|6months|1year|custom) and for custom `date_from`, `date_to`. Default: 2weeks.
- `GET /api/analytics/workouts/progression/?range=...&workout_id=<id>&progression_type=...&metrics=...&metric_offset=0` - Workout progression (workout_id optional: omit for all-workouts sum per day; progression_type: avg_weight_reps Epley 1RM|avg_weight_sets|avg_weight|max_weight; optional single metric)
- `GET /api/analytics/workouts/sets-per-day/?range=...` - Total sets and attribute sets per day (layered bar)
- `GET /api/analytics/workouts/activation-progress/?range=...` - Activation progress vs expected (area line chart)
- `GET /api/analytics/foods/metadata-progress/`, `timing/`, `macro-split/`, `frequency/`, `cost/` - All accept `range=...`. Food timing: average metadata at each hour over range. Macro split: totals (g) per day. Food frequency: `entry_type=both` returns `food_groups` and `brands` with name, count, percentage for doughnut charts.
- Legacy endpoints (not used by dashboard): body-measurement-progression, rest-time-analysis, attributes-analysis, steps-cardio-distance, radar-chart, workout-tracking-heatmap, health weight-progression, health metrics-radial

#### OpenAI Service (`/api/openai/`)
- `POST /api/openai/prompt/` - Send prompt to OpenAI
- `GET /api/openai/usage/` - Get usage statistics
- `POST /api/openai/parse-food/` - Parse food from natural language
- `POST /api/openai/generate-metadata/` - Generate food metadata
- `POST /api/openai/transcribe/` - Transcribe audio
- `GET /api/openai/transcription-status/` - Check Vosk status

#### Data Viewer (`/api/data-viewer/`)
- `GET /api/data-viewer/tables/` - List available tables
- `GET /api/data-viewer/tables/<name>/schema/` - Get table schema
- `GET /api/data-viewer/tables/<name>/data/` - Get table data
- `GET /api/data-viewer/tables/<name>/count/` - Get row count

### API Response Format (Invariant)
All endpoints return:
```json
{
  "data": { ... }  // Success response
}
```
OR
```json
{
  "error": {
    "message": "Error description",
    "details": { ... }  // Optional
    }
}
```

### Authentication Flow (State Transitions)
1. User registers/logs in → receives `access_token` (1 hour) and `refresh_token` (7 days)
2. Frontend stores tokens in `localStorage`
3. Axios interceptor adds `Authorization: Bearer <access_token>` to requests
4. `AuthMiddleware` validates token, sets `request.user`
5. On 401, frontend attempts refresh using `refresh_token`
6. On refresh success, new `access_token` stored, original request retried
7. On refresh failure, user redirected to login

### Database Schema (Critical Invariants)
- All user data isolated via `user` foreign key
- Public foods/meals/workouts accessible to all users (`make_public` flag)
- Cascade deletes: deleting user deletes all related data
- Required reference data: `access_levels`, `activity_levels`, `muscles`, `units`
- Primary keys: Most use `_id` suffix (e.g., `food_id`, `workout_id`), some use `id`

### Middleware Architecture
1. **CORS Middleware** - Allows frontend origin only
2. **Security Middleware** - CSRF, XSS protection
3. **AuthMiddleware** (`middleware/auth.py`) - JWT validation, sets `request.user`
4. **LoggingMiddleware** (`middleware/logging.py`) - Request/response logging, error tracking

### Data Viewer System (Standard for DB Access)
**CRITICAL**: `apps.data_viewer` is the standard foundation for all database access.
- **MUST** use `DataAccessService` for any database viewing/access
- Provides: SQL injection prevention, XSS protection, access control, audit logging
- See `backend/apps/data_viewer/README.md` for integration

## Frontend Architecture

### Component Hierarchy
```
App
├── ThemeProvider
├── AuthProvider
├── Router
│   ├── Navbar
│   └── Routes
│       ├── Login (Public)
│       ├── Register (Public)
│       ├── Profile (Protected)
│       ├── FoodLog (Protected)
│       ├── WorkoutTracker (Protected)
│       ├── AdditionalTrackers (Protected)
│       ├── DataViewer (Protected)
│       ├── Analytics (Protected)
│       └── Personalization (Protected)
```

### Pages (`src/pages/`)
- `Login.js` - Authentication form
- `Register.js` - User registration
- `Profile.js` - User profile management
- `FoodLog.js` - Food logging interface
- `WorkoutTracker.js` - Workout tracking interface
- `AdditionalTrackers.js` - Health metrics tracking
- `DataViewer.js` - Database viewer interface
- `Analytics.js` - Data analytics dashboard
- `Personalization.js` - Muscle priorities, splits configuration

### Key Components (`src/components/`)
- `FoodLoggingDashboard.js` - Main food logging interface
- `WorkoutLoggingDashboard.js` - Main workout logging interface
- `FoodCreator.js` - Create foods
- `MealCreator.js` - Create meals
- `WorkoutAdder.js` - Create workouts
- `WorkoutLogger.js` - Log workout sessions
- `MusclePriority.js` - Manage muscle priorities
- `SplitCreator.js` - Create workout splits
- Tracker components in `trackers/`: `WeightTracker`, `WaterTracker`, `SleepTracker`, etc.

### State Management
- **AuthContext** - Global authentication state, user data, token management
- **ThemeContext** - Theme switching (dark/light only)
- Component-level state for forms and UI

### API Service Layer (`src/services/api.js`)
- Axios instance with base URL
- Request interceptor: Adds JWT token
- Response interceptor: Handles token refresh on 401
- Standardized error handling

### Styling System (November 2025 Refresh)
- **Themes**: Only `dark` and `light` (neutral grey backdrops)
- **Typography**: `Josefin Sans` font family
- **Surfaces**: Borderless glass panels, large radii, deep shadows
- **Floating Actions**: No header bars, floating buttons with gradients
- **Animations**: `menuFloatIn`, `modalFloat` keyframes
- See `frontend/src/index.css` for CSS variables

## Data Flow Patterns

### Food Logging Flow
1. User searches/creates food → `POST /api/foods/` or selects existing
2. User sets quantity → Frontend calculates macros
3. User logs food → `POST /api/foods/logs/`
4. Backend calculates macros, saves to `logging_foodlog`
5. Frontend updates daily summary display

### Workout Logging Flow
1. User selects workout → Frontend loads workout details
2. User enters weight/reps/RIR → Frontend validates
3. User logs workout → `POST /api/workouts/logs/`
4. Backend saves to `workouts_workoutlog`, calculates activation
5. Frontend updates stats, muscle progress

### Authentication Flow
1. User submits credentials → `POST /api/auth/login/`
2. Backend validates, generates JWT tokens
3. Frontend stores tokens, redirects to dashboard
4. Subsequent requests include token in header
5. Middleware validates, sets `request.user`

## Critical Invariants (DO NOT BREAK)

### Security
- **ALL** endpoints except login/register require authentication
- Users can ONLY access their own data (filtered by `user` FK)
- Public foods/meals/workouts accessible to all authenticated users
- JWT tokens expire: access (1 hour), refresh (7 days)
- Passwords hashed with Django's default hasher
- SQL injection prevention: ALWAYS use ORM, never raw SQL with string formatting

### Data Integrity
- Foreign key relationships maintain referential integrity
- Cascade deletes: User deletion removes all related data
- Required reference data must exist: `access_levels`, `activity_levels`, `muscles`, `units`
- Unique constraints: Username, email, composite keys where specified

### API Contracts
- Response format: `{data: {...}}` or `{error: {...}}`
- HTTP status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
- Pagination: Default 20 items, configurable via query params

### Frontend Contracts
- All API calls go through `services/api.js`
- Token stored in `localStorage` as `access_token` and `refresh_token`
- Protected routes use `ProtectedRoute` component
- Error handling: Display user-friendly messages, log to console

## Edge Cases and Failure Modes

### Token Expiration
- Access token expires → Frontend attempts refresh
- Refresh token expires → User must re-login
- Token invalid → 401 response, frontend redirects to login

### Database Failures
- Connection lost → Retry with exponential backoff
- Query timeout → Return 500, log error
- Constraint violation → Return 400 with validation errors

### External Service Failures
- OpenAI API failure → Return error, log usage attempt
- Vosk not available → Fall back to browser speech API
- Network timeout → Return 408, allow retry

### Data Validation Failures
- Invalid input → Return 400 with field-level errors
- Missing required fields → Return 400 with error message
- Type mismatches → Return 400, log validation error

## Extension Points (Safe to Modify)

### Adding New Trackers
1. Create model in `apps/logging/` or `apps/health/`
2. Add serializer, views, URLs following existing patterns
3. Create React component in `components/trackers/`
4. Add to `AdditionalTrackers` menu
5. Add streak calculation if applicable

### Adding New Analytics
1. Add view in `apps/analytics/views.py` (use `parse_analytics_date_range(request)` for date range)
2. Add URL in `apps/analytics/urls.py`
3. Create React chart component in `components/analytics/`; pass `dateRangeParams` from page (from shared DateRangeSelector)
4. Add to `Analytics` page (Workout or Food section); charts are full-width

**Analytics page UI (Workout / Food):** Workout section has one progression graph that switches between "All Workouts" and the selected workout; date range on the right. Metric comparison line is red-orange. Food section: date range in separate card on the right; Metadata Progress vs Goal uses red-orange solid goal line; Macro Split is stacked (carbs bottom, fat middle, protein top) with high-contrast palette. Food Frequency section has no card title; larger doughnuts with "Food Group" and "Brand" sub-headers and legend keys to the right of each chart. All analytics charts use the shared palette in `frontend/src/components/analytics/analyticsChartColors.js`.

### Adding New API Endpoints
1. Create view in appropriate app's `views.py`
2. Add serializer if needed
3. Add URL in app's `urls.py`
4. Add frontend service method in `services/api.js`
5. Create/update React component if needed

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

## Testing Requirements

### Backend Tests
- Unit tests for models, serializers, services
- Integration tests for API endpoints
- Test authentication, authorization, data isolation
- Test error handling, edge cases

### Frontend Tests
- Component unit tests
- Integration tests for user flows
- API service mocking
- Error boundary testing

### E2E Tests
- Complete user workflows
- Authentication flows
- Data persistence
- Error scenarios

## Environment Variables (Required)

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

# Frontend (Optional)
REACT_APP_API_URL=http://localhost:8000/api
```

## Development Workflow

### Adding New Features
1. Create Django app or extend existing
2. Define models, serializers, views
3. Add URLs, test endpoints
4. Create frontend components
5. Add API service methods
6. Write tests (backend, frontend, E2E)
7. Update documentation

### Database Setup
   ```bash
# Initial setup
python manage.py migrate
python manage.py setup_database --required  # Reference data only
python manage.py setup_database --full      # With dummy test data

# Test users (if using --full):
# john_doe / testpass123
# jane_smith / testpass456
   ```

### Running Tests
   ```bash
   # Backend
cd backend && python manage.py test
   
   # Frontend
cd frontend && npm test

# E2E
npm run test:e2e  # If configured
```

## Documentation References

- **Architecture Details**: `docs/ai_reference/architecture.md`
- **Code Style**: `docs/ai_reference/code_style.md`
- **Security**: `docs/ai_reference/security.md`
- **Agent Guidelines**: `docs/ai_reference/agent_guidelines.md`
- **Testing**: `docs/ai_reference/testing_guide.md`
- **Debugging**: `docs/ai_reference/debugging.md`

## What Must NOT Be Changed

- JWT authentication flow
- User data isolation (filtering by `user` FK)
- API response format (`{data: {...}}` or `{error: {...}}`)
- Database schema without migrations
- Required reference data tables
- Data Viewer system as standard for DB access

## What Can Be Safely Extended

- New tracker types (follow existing patterns)
- New analytics endpoints
- New API endpoints (with proper auth)
- Frontend components (following design system)
- Database models (with migrations)
- External service integrations

---

**Remember**: This system is in active use. Always preserve existing functionality while making improvements. Test thoroughly before deploying changes.
