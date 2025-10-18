# Workout Tracking System

## 🏋️ Overview

The Workout Tracking System is a comprehensive fullstack application that allows users to track workouts, manage muscle priorities, create workout splits, and log workout sessions. The system is built with Django REST Framework (backend) and React (frontend).

## ✨ Features

### 1. Muscle Priority Management
- Set and update muscle priorities (0-100 scale)
- Base priority of 80 for all muscles
- Expandable sections for muscle groups
- Explanation of priority usage

### 2. Workout Adder
- Create workouts with metadata
- Add muscles with activation ratings (0-100)
- Information tooltip for activation ratings
- Icon selection from predefined emojis
- Editable workout information

### 3. Split Creator
- Create workout splits with multiple days
- Add days with names and target muscles
- Set target activation for each muscle per day
- Calculate optimal activation ranges
- Highlight muscles based on activation status
- Select active split with start date

### 4. Workout Logger
- Add workouts to current log
- Search with filters (text, muscle activation, alphabetical)
- Editable fields when logging
- Attribute selection (Dropset, Assisted, Partial, Pause, Negatives)
- Autofill from most recent log
- RIR description and progressive overload message

### 5. Workout Log
- Determine current split day based on start date
- Show muscles worked and progress toward goals
- Display split day name
- Show all logged workouts with details
- Quick-add button for previous day workouts
- Working timer
- Statistics display (sets, weight, reps, RIR, activation)
- Calendar for day selection

## 🏗️ Architecture

### Backend (Django REST Framework)
- **Models**: Workout, WorkoutMuscle, WorkoutLog, MuscleLog, Split, SplitDay, SplitDayTarget
- **API Endpoints**: RESTful API with comprehensive serializers
- **Authentication**: JWT-based authentication
- **Database**: MySQL with existing schema

### Frontend (React)
- **Components**: Functional components with hooks
- **State Management**: React hooks (useState, useEffect, useCallback)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios for API calls

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
python manage.py test apps.workouts.tests.RealUserWorkflowTestCase
```

### Run Frontend Tests
```bash
cd frontend
npm test -- --testPathPattern=WorkoutTracker
```

## 📊 Optimal Activation Formulas

The system calculates optimal muscle activation ranges using these formulas:

```python
# Lower bound
R(P,D) = 90 × (10 + 0.1P) × 7/D

# Upper bound  
R(P,D) = 90 × (20 + 0.1P) × 7 × D

# Where:
# P = Muscle priority (0-100)
# D = Number of days in split
# R = Optimal activation range
```

**Example Calculation**:
- Priority: 80
- Split days: 3
- Lower: 90 × (10 + 0.1×80) × 7/3 = 378
- Upper: 90 × (20 + 0.1×80) × 7 × 3 = 5,292

**Muscle Status Indicators**:
- 🔴 **No activation** - 0 activation
- 🟡 **Below optimal** - Below lower bound
- 🟢 **Within optimal** - Within 15% of optimal range
- 🔵 **Above optimal** - Above upper bound

## 🔧 API Endpoints

### Workout Management
- `GET/POST /api/workouts/` - List/create workouts
- `GET/PUT/DELETE /api/workouts/<id>/` - Retrieve/update/delete workout

### Muscle Management
- `GET /api/workouts/muscles/` - List all muscles
- `GET/POST /api/workouts/muscle-priorities/` - Get/update muscle priorities

### Workout Logging
- `GET/POST /api/workouts/logs/` - List/log workouts

### Split Management
- `GET/POST /api/workouts/splits/` - List/create splits
- `GET/PUT/DELETE /api/workouts/splits/<id>/` - Retrieve/update/delete split
- `POST /api/workouts/splits/<id>/activate/` - Activate split
- `GET /api/workouts/current-split-day/` - Get current split day

### Statistics
- `GET /api/workouts/stats/` - Workout statistics
- `GET /api/workouts/recently-logged/` - Recently logged workouts
- `GET /api/workouts/icons/` - Available workout icons

## 📝 API Response Format

All workout endpoints follow a consistent response format:

```python
# Success Response
{
    'success': True,
    'data': {
        # Response data here
    }
}

# Error Response
{
    'success': False,
    'error': {
        'message': 'Error description'
    }
}
```

## 🔍 Example API Calls

### Create Workout
```bash
POST /api/workouts/
{
    'workout_name': 'Bench Press 💪',
    'type': 'barbell',
    'notes': 'Heavy compound lift',
    'muscles': [
        {'muscle': 1, 'activation_rating': 100},
        {'muscle': 2, 'activation_rating': 75}
    ]
}
```

### Activate Split
```bash
POST /api/workouts/splits/1/activate/
{
    'start_date': '2024-01-01'
}
```

### Log Workout
```bash
POST /api/workouts/logs/
{
    'workout': 1,
    'date_time': '2024-01-01T10:00:00Z',
    'weight': 100,
    'reps': 10,
    'rir': 2,
    'notes': 'Feeling strong',
    'attributes': ['dropset']
}
```

## 🛠️ Development

### Adding New Features
1. Create models in `apps/workouts/models.py`
2. Add serializers in `apps/workouts/serializers.py`
3. Create views in `apps/workouts/views.py`
4. Add URL patterns in `apps/workouts/urls.py`
5. Create frontend components
6. Write tests
7. Update documentation

### Code Quality
- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript/React code
- Write comprehensive tests for all new features
- Update documentation for any changes

## 🚨 Troubleshooting

### Common Issues

1. **Database Schema Mismatches**:
   - Ensure models match existing database schema
   - Check primary key names (`id` vs `_id`)
   - Verify foreign key relationships

2. **Foreign Key Errors**:
   - Fetch model instances before assignment
   - Use `Muscle.objects.get(muscles_id=muscle_id)` instead of passing IDs directly

3. **Related Manager Access**:
   - Use `obj.splitday_set.exists()` instead of `obj.split_days.exists()`
   - Check Django's related manager naming conventions

## 📈 Performance

### Database Optimization
- Use proper indexes for frequently queried fields
- Implement pagination for large datasets
- Use `select_related` and `prefetch_related` for foreign key queries

### Frontend Optimization
- Implement code splitting
- Use React.memo for expensive components
- Optimize API calls with proper caching

## 🔒 Security

### Input Validation
- Validate activation ratings (0-100)
- Validate muscle priorities (0-100)
- Use Django's built-in validators

### User Data Isolation
- Always filter by user in queries
- Use `@permission_classes([IsAuthenticated])` for sensitive endpoints
- Prevent SQL injection with ORM queries

## 📚 Documentation

- **Developer Guide**: See `DEVELOPER.md` for comprehensive development information
- **API Documentation**: Use Django REST Framework's built-in documentation
- **Component Documentation**: Each React component has inline documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Update documentation
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Check the documentation first
- Review test cases for usage examples
- Check API endpoints with Postman
- Consult Django and React documentation
