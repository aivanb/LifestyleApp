# System Overview - Workout & Macro Tracking App

This document provides a comprehensive overview of the application architecture, features, data flow, and expansion guidelines.

## 🎯 Purpose

A full-stack fitness tracking application that helps users monitor workouts, nutrition, and health metrics with AI-powered features for enhanced usability.

## 🏗️ Architecture

### Technology Stack

**Backend**:
- Django 4.2.7 + Django REST Framework 3.14.0
- MySQL 8.0+ Database
- JWT Authentication (django-rest-framework-simplejwt)
- OpenAI API Integration (gpt-3.5-turbo)
- Vosk for offline voice transcription

**Frontend**:
- React 18.2.0 with React Router 6.3.0
- Axios for API communication
- Context API for state management
- Tailwind CSS for styling (via index.css)
- Heroicons for UI icons

**Testing**:
- Playwright for E2E tests
- Jest + React Testing Library for frontend
- Django TestCase for backend

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Pages     │  │  Components  │  │  Services/Contexts     │ │
│  │  - Login    │  │  - Navbar    │  │  - AuthContext         │ │
│  │  - Profile  │  │  - Forms     │  │  - ThemeContext        │ │
│  │  - FoodLog  │  │  - Charts    │  │  - API Service         │ │
│  │  - Workout  │  │  - Trackers  │  │  - Voice Service       │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ HTTP/JWT
┌─────────────────────────────────┴───────────────────────────────┐
│                          Backend (Django)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Django Apps │  │  Middleware  │  │  External Services     │ │
│  │ - auth      │  │  - JWT Auth  │  │  - OpenAI API          │ │
│  │ - users     │  │  - Logging   │  │  - Vosk (Voice)        │ │
│  │ - foods     │  │  - CORS      │  │                        │ │
│  │ - workouts  │  └──────────────┘  └────────────────────────┘ │
│  │ - logging   │                                                 │
│  │ - health    │                                                 │
│  └─────────────┘                                                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ SQL
┌─────────────────────────────────┴───────────────────────────────┐
│                         MySQL Database                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ User Data   │  │ Food/Meals   │  │  Activity Logs         │ │
│  │ - users     │  │ - foods      │  │  - food_logs           │ │
│  │ - goals     │  │ - meals      │  │  - weight_logs         │ │
│  │ - profiles  │  │ - groups     │  │  - workout_logs        │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## 📋 Major Features

### 1. User Management
- **Registration/Login**: JWT-based authentication with refresh tokens
- **Profile Management**: Height, weight, activity level, goals
- **Goal Setting**: Calories, macros, weight targets
- **Body Metrics**: BMI, BMR, TDEE calculations

### 2. Nutrition Tracking
- **Food Database**: 8000+ pre-loaded foods with full nutritional data
- **Custom Foods**: Users can create private or public foods
- **Meal Planning**: Create reusable meal combinations
- **Food Logging**: Track daily intake by meal type
- **Voice Logging**: Natural language food input via AI
- **Macro Tracking**: Real-time macro calculations and goal progress

### 3. Workout Tracking
- **Exercise Library**: Create custom workouts with sets/reps/weight
- **Muscle Tracking**: Log muscle group activation levels
- **Workout Splits**: Create weekly training routines
- **Progress Tracking**: View workout history and statistics
- **Performance Metrics**: Track volume, frequency, and progress

### 4. Health Metrics
- **Weight Tracking**: Daily weight logs with trend analysis
- **Body Measurements**: Track waist, chest, arms, etc.
- **Water Intake**: Daily hydration tracking
- **Step Counter**: Daily step logging
- **Sleep Tracking**: Quality and duration monitoring
- **Cardio Sessions**: Track duration, distance, calories

### 5. Data Analysis
- **Dashboard Views**: Real-time progress visualization
- **Data Export**: Export any data table to CSV
- **Historical Trends**: View progress over time
- **Goal Adherence**: Track consistency with targets
- **AI Insights**: OpenAI-powered analysis (optional)

### 6. AI Features
- **Food Parsing**: Natural language to structured food data
- **Meal Suggestions**: AI-powered meal recommendations
- **Chatbot Interface**: Conversational food logging
- **Voice Transcription**: Offline voice-to-text with Vosk

## 🔄 Data Flow

### Authentication Flow
```
User Login → JWT Generation → Token Storage → API Authorization → Protected Resources
            ↓                                  ↓
       Refresh Token                    Middleware Validation
```

### Food Logging Flow
```
User Input → Food Search/Creation → Quantity Selection → Log Entry → Macro Calculation
     ↓              ↓                                        ↓
Voice/Text    AI Parsing                               Daily Summary
```

### Workout Tracking Flow
```
Create Workout → Add Exercises → Log Session → Track Muscles → View History
                      ↓              ↓              ↓
                 Set Details    Performance    Activation
```

## 🗄️ Core Modules

### Backend Apps

1. **authentication** (`apps/authentication/`)
   - JWT token management
   - User registration/login
   - Password management

2. **users** (`apps/users/`)
   - User profiles and preferences
   - Goal management
   - Body metrics calculations

3. **foods** (`apps/foods/`)
   - Food CRUD operations
   - Nutritional data management
   - Search functionality

4. **meals** (`apps/meals/`)
   - Meal composition
   - Meal templates
   - Portion calculations

5. **logging** (`apps/logging/`)
   - Food intake logs
   - Weight tracking
   - Health metric logs

6. **workouts** (`apps/workouts/`)
   - Exercise management
   - Workout sessions
   - Muscle activation tracking

7. **health** (`apps/health/`)
   - Sleep tracking
   - Additional health metrics
   - Wellness indicators

8. **openai_service** (`apps/openai_service/`)
   - OpenAI API integration
   - Food parsing service
   - Voice transcription

### Frontend Components

1. **Pages** (`src/pages/`)
   - Login/Register
   - Profile
   - FoodLog
   - WorkoutTracker
   - DataViewer
   - AdditionalTrackers

2. **Components** (`src/components/`)
   - Form components (FoodCreator, MealCreator, etc.)
   - Display components (DataTable, ProgressBar, etc.)
   - Tracker components (WeightTracker, SleepTracker, etc.)

3. **Services** (`src/services/`)
   - API communication layer
   - Authentication handling
   - Voice recording service

## 🔌 Integration Patterns

### API Integration
- All APIs follow RESTful conventions
- Standard response format: `{data: {...}}` or `{error: {...}}`
- Pagination for large datasets
- Consistent error handling

### Database Integration
- Foreign key relationships maintain data integrity
- Cascade deletes for dependent data
- Optimized indexes for common queries
- Transaction support for complex operations

### External Service Integration
- OpenAI API for natural language processing
- Vosk for offline voice transcription
- Future: Fitness device APIs, nutrition databases

## 🚀 Expansion Guidelines

### Adding New Features

1. **Create Django App**:
   ```bash
   cd backend
   python manage.py startapp feature_name
   ```

2. **Define Models** following existing patterns
3. **Create Serializers** for API responses
4. **Add Views** with proper authentication
5. **Configure URLs** in app and main urlpatterns
6. **Create Frontend Components** following React patterns
7. **Add API Service** methods
8. **Write Tests** for both backend and frontend

### Adding New Trackers

1. Create model in appropriate app (health/logging)
2. Add serializer and views
3. Create React component in `components/trackers/`
4. Add to AdditionalTrackers menu
5. Implement data visualization

### Extending AI Features

1. Add new prompt templates in OpenAI service
2. Create parsing logic for responses
3. Add error handling for edge cases
4. Create frontend interface
5. Add usage tracking

## 🔐 Security Considerations

- JWT tokens expire (1 hour access, 7 days refresh)
- All sensitive endpoints require authentication
- Input validation on all user data
- SQL injection prevention via ORM
- XSS protection in React
- CORS configured for frontend origin only

## 📊 Performance Optimizations

- Database query optimization with select_related/prefetch_related
- Pagination for large datasets (20 items default)
- Frontend code splitting for faster loads
- Memoization for expensive calculations
- Caching strategy for frequently accessed data

## 🧪 Testing Strategy

- **Unit Tests**: Individual function/component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user journey testing
- **Performance Tests**: Load and response time testing
- **Security Tests**: Authentication and authorization testing

## 📈 Future Enhancements

### Planned Features
- Mobile app (React Native)
- Social features (sharing, challenges)
- Advanced analytics dashboard
- Barcode scanning for foods
- Wearable device integration
- Meal planning automation

### Technical Improvements
- GraphQL API option
- Real-time updates (WebSockets)
- Microservices architecture
- Enhanced caching with Redis
- Background job processing (Celery)
- Containerization (Docker)

## 🔧 Maintenance

### Regular Tasks
- Dependency updates
- Security patches
- Database optimization
- Log rotation
- Backup procedures
- Performance monitoring

### Monitoring Points
- API response times
- Database query performance
- Error rates
- User activity patterns
- Resource utilization

---

For detailed technical documentation, see:
- `DEVELOPER.md` - Development guidelines
- `STYLE_GUIDE.md` - Code style standards
- `README.md` - Setup instructions
- `docs/ai_reference/` - AI agent documentation
