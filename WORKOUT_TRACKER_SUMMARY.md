# Workout Tracker System

## Overview

The Workout Tracker system is a comprehensive fitness tracking solution that allows users to manage muscle priorities, create custom workouts, design workout splits, log workout sessions, and track progress. The system is built with a modular architecture that supports both individual workout tracking and structured training programs.

## System Architecture

### Backend Components

#### Models (`apps/workouts/models.py`)
- **Workout**: Core workout definitions with metadata
- **Muscle**: Muscle groups and individual muscles
- **WorkoutLog**: Individual workout session logs
- **MuscleLog**: User-specific muscle priority settings
- **WorkoutMuscle**: Workout-muscle activation relationships
- **Split**: Workout program definitions
- **SplitDay**: Individual days within a split
- **SplitDayTarget**: Target activation for muscles per day

#### Serializers (`apps/workouts/serializers.py`)
- **WorkoutSerializer**: Handles workout CRUD with emoji support
- **MuscleSerializer**: Basic muscle data serialization
- **WorkoutLogSerializer**: Workout session logging
- **MuscleLogSerializer**: Muscle priority management
- **SplitSerializer**: Split creation and management
- **SplitDaySerializer**: Day management within splits
- **SplitDayTargetSerializer**: Target activation management

#### Views (`apps/workouts/views.py`)
- **Muscle Priority Management**: List, update muscle priorities
- **Workout CRUD**: Create, read, update, delete workouts
- **Split Management**: Create, activate, manage workout splits
- **Workout Logging**: Log workout sessions with attributes
- **Statistics**: Track progress and performance metrics
- **Split Day Info**: Get current split day information

#### URL Patterns (`apps/workouts/urls.py`)
- `/api/workouts/` - Workout CRUD operations
- `/api/workouts/muscles/` - Muscle management
- `/api/workouts/muscle-priorities/` - Priority management
- `/api/workouts/splits/` - Split management
- `/api/workouts/logs/` - Workout logging
- `/api/workouts/stats/` - Statistics and metrics

### Frontend Components

#### Main Page (`pages/WorkoutTracker.js`)
- Tabbed interface for all workout functionality
- State management for active tab and selected date
- Integration with all workout components

#### Core Components

##### WorkoutAdder (`components/WorkoutAdder.js`)
- **Purpose**: Create and edit custom workouts
- **Features**:
  - Workout metadata (name, type, equipment, location, notes)
  - Emoji icon selection from predefined list
  - Muscle activation rating assignment
  - Public/private workout settings
  - Form validation and error handling

##### MusclePriority (`components/MusclePriority.js`)
- **Purpose**: Manage muscle group priorities
- **Features**:
  - Expandable muscle group sections
  - Slider-based priority adjustment (0-100)
  - Color-coded priority levels
  - Reset to default (80) functionality
  - Batch update capabilities

##### SplitCreator (`components/SplitCreator.js`)
- **Purpose**: Create and manage workout splits
- **Features**:
  - Split creation with multiple days
  - Muscle target activation per day
  - Real-time muscle analysis
  - Split activation/deactivation
  - Edit existing splits
  - Optimal volume calculations

##### WorkoutLogger (`components/WorkoutLogger.js`)
- **Purpose**: Log individual workout sessions
- **Features**:
  - Workout selection with filtering
  - Weight, reps, RIR logging
  - Workout attributes (dropset, assisted, partial, pause, negatives)
  - Working timer functionality
  - Quick-add from previous sessions
  - Form validation and autofill

##### WorkoutLog (`components/WorkoutLog.js`)
- **Purpose**: View workout history and progress
- **Features**:
  - Date-based workout viewing
  - Split day information display
  - Workout statistics
  - Muscle progress tracking
  - Previous day quick-add options

## Key Features

### Muscle Priority System
- **Base Priority**: All muscles start at 80 priority
- **Priority Scale**: 0-100 with color-coded levels
- **Usage**: Influences volume distribution in splits
- **Management**: Expandable groups with slider controls

### Workout Creation
- **Metadata**: Name, type, equipment, location, notes
- **Icons**: Predefined emoji selection (stored in name field)
- **Muscle Activation**: 0-100 rating per muscle
- **Visibility**: Public/private settings
- **Validation**: Required fields and data validation

### Split Management
- **Structure**: Multiple days with target activations
- **Analysis**: Real-time muscle volume calculations
- **Activation**: One active split per user
- **Targets**: Per-muscle activation goals per day
- **Optimization**: Automatic optimal range calculations

### Workout Logging
- **Session Data**: Weight, reps, RIR, rest time
- **Attributes**: Advanced training techniques
- **Timer**: Working/resting time tracking
- **Quick Add**: Previous session data reuse
- **Validation**: Required field enforcement

### Progress Tracking
- **Statistics**: Sets, weight, reps, RIR totals
- **History**: Date-based workout viewing
- **Muscle Progress**: Activation vs. targets
- **Trends**: Performance over time

## Database Schema

### Core Tables
```sql
-- Workouts table
workouts (
    workouts_id INT PRIMARY KEY,
    user_id INT REFERENCES users(id),
    workout_name VARCHAR(255),
    equipment_brand VARCHAR(100),
    type VARCHAR(50),
    location VARCHAR(100),
    notes TEXT,
    make_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Muscles table
muscles (
    muscles_id INT PRIMARY KEY,
    muscle_name VARCHAR(100),
    muscle_group VARCHAR(100)
);

-- Workout-Muscle relationships
workout_muscle (
    workout_id INT REFERENCES workouts(workouts_id),
    muscle_id INT REFERENCES muscles(muscles_id),
    activation_rating INT CHECK (activation_rating >= 0 AND activation_rating <= 100),
    PRIMARY KEY (workout_id, muscle_id)
);

-- Workout logs
workout_log (
    workout_log_id INT PRIMARY KEY,
    user_id INT REFERENCES users(id),
    workout_id INT REFERENCES workouts(workouts_id),
    weight DECIMAL(8,2),
    reps INT,
    rir INT CHECK (rir >= 0 AND rir <= 10),
    attributes JSON,
    rest_time INT,
    date_time TIMESTAMP,
    created_at TIMESTAMP
);

-- Muscle priorities
muscle_log (
    muscle_log_id INT PRIMARY KEY,
    user_id INT REFERENCES users(id),
    muscle_id INT REFERENCES muscles(muscles_id),
    importance INT DEFAULT 80 CHECK (importance >= 0 AND importance <= 100),
    created_at TIMESTAMP
);

-- Splits
splits (
    splits_id INT PRIMARY KEY,
    user_id INT REFERENCES users(id),
    split_name VARCHAR(255),
    start_date DATE,
    created_at TIMESTAMP
);

-- Split days
split_days (
    split_days_id INT PRIMARY KEY,
    split_id INT REFERENCES splits(splits_id),
    day_name VARCHAR(100),
    day_order INT
);

-- Split day targets
split_day_targets (
    split_day_id INT REFERENCES split_days(split_days_id),
    muscle_id INT REFERENCES muscles(muscles_id),
    target_activation INT,
    PRIMARY KEY (split_day_id, muscle_id)
);
```

## API Endpoints

### Workout Management
- `GET /api/workouts/` - List user's workouts and public workouts
- `POST /api/workouts/` - Create new workout
- `GET /api/workouts/{id}/` - Get specific workout
- `PUT /api/workouts/{id}/` - Update workout
- `DELETE /api/workouts/{id}/` - Delete workout
- `GET /api/workouts/icons/` - Get available workout icons

### Muscle Management
- `GET /api/workouts/muscles/` - List all muscles
- `GET /api/workouts/muscle-priorities/` - Get user's muscle priorities
- `POST /api/workouts/muscle-priorities/update/` - Update muscle priorities

### Split Management
- `GET /api/workouts/splits/` - List user's splits
- `POST /api/workouts/splits/` - Create new split
- `GET /api/workouts/splits/{id}/` - Get specific split
- `PUT /api/workouts/splits/{id}/` - Update split
- `DELETE /api/workouts/splits/{id}/` - Delete split
- `POST /api/workouts/splits/{id}/activate/` - Activate split

### Workout Logging
- `GET /api/workouts/logs/` - List workout logs (with date filtering)
- `POST /api/workouts/logs/` - Create workout log
- `GET /api/workouts/logs/{id}/` - Get specific log
- `PUT /api/workouts/logs/{id}/` - Update log
- `DELETE /api/workouts/logs/{id}/` - Delete log

### Statistics and Utilities
- `GET /api/workouts/stats/` - Get workout statistics
- `GET /api/workouts/recently-logged/` - Get recently logged workouts
- `GET /api/workouts/split-day-info/` - Get current split day information

## Usage Examples

### Creating a Workout
```javascript
const workoutData = {
  workout_name: 'Bench Press',
  type: 'barbell',
  equipment_brand: 'Rogue Fitness',
  location: 'Home Gym',
  notes: 'Focus on form',
  make_public: true,
  muscles: [
    { muscle: 1, activation_rating: 100 }, // Chest
    { muscle: 2, activation_rating: 75 }    // Triceps
  ],
  emoji: '🏋️'
};

const response = await api.createWorkout(workoutData);
```

### Setting Muscle Priorities
```javascript
const priorities = [
  { muscle_name: 1, importance: 90 }, // Chest - High priority
  { muscle_name: 2, importance: 85 }, // Triceps - High priority
  { muscle_name: 3, importance: 70 }  // Quads - Medium priority
];

await api.updateMusclePriorities(priorities);
```

### Creating a Split
```javascript
const splitData = {
  split_name: 'Push/Pull/Legs',
  split_days: [
    {
      day_name: 'Push Day',
      day_order: 1,
      targets: [
        { muscle: 1, target_activation: 225 }, // Chest
        { muscle: 2, target_activation: 200 }  // Triceps
      ]
    },
    {
      day_name: 'Pull Day',
      day_order: 2,
      targets: [
        { muscle: 4, target_activation: 250 }, // Back
        { muscle: 5, target_activation: 200 }  // Biceps
      ]
    }
  ]
};

await api.createSplit(splitData);
```

### Logging a Workout
```javascript
const logData = {
  workout: 1, // Workout ID
  weight: 135.0,
  reps: 10,
  rir: 2,
  attributes: [
    { type: 'dropset', weight: 115, reps: 8 },
    { type: 'pause', reps: 5, wait_time: 3 }
  ],
  rest_time: 120,
  date_time: '2024-01-01T10:00:00Z'
};

await api.createWorkoutLog(logData);
```

## Testing

### Backend Tests (`tests/backend/test_workout_tracker.py`)
- **Model Tests**: Workout, Muscle, WorkoutLog, Split model functionality
- **Serializer Tests**: Data validation and transformation
- **API Tests**: Endpoint functionality and authentication
- **Integration Tests**: Complete workout workflows
- **Security Tests**: User isolation and access control

### Frontend Tests (`tests/frontend/test_workout_tracker.js`)
- **Component Tests**: Individual component functionality
- **User Interaction Tests**: Form submission and navigation
- **API Integration Tests**: Mock API responses
- **State Management Tests**: React state and context
- **Responsive Tests**: Mobile and desktop layouts

### E2E Tests (`tests/e2e/test_workout_tracker_e2e.js`)
- **Complete Workflows**: End-to-end user journeys
- **Cross-Component Tests**: Integration between components
- **Data Persistence Tests**: Database operations
- **Error Handling Tests**: Validation and error scenarios
- **Performance Tests**: Load times and responsiveness

## Security Features

### Authentication
- JWT token-based authentication
- User-specific data isolation
- Role-based access control

### Data Validation
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- CSRF protection

### Access Control
- Users can only access their own data
- Public workouts visible to all users
- Admin access for system management
- Secure API endpoints

## Performance Considerations

### Database Optimization
- Indexed foreign keys
- Efficient query patterns
- Pagination for large datasets
- Connection pooling

### Frontend Optimization
- Lazy loading of components
- Memoized calculations
- Efficient state management
- Responsive design

### Caching
- API response caching
- Static asset caching
- Database query caching
- CDN integration

## Future Enhancements

### Planned Features
- **Workout Templates**: Pre-built workout programs
- **Progress Charts**: Visual progress tracking
- **Social Features**: Workout sharing and following
- **Mobile App**: Native mobile application
- **AI Recommendations**: Smart workout suggestions

### Technical Improvements
- **Real-time Updates**: WebSocket integration
- **Offline Support**: Progressive Web App features
- **Advanced Analytics**: Machine learning insights
- **Integration APIs**: Third-party fitness app connections
- **Performance Monitoring**: Advanced metrics and alerts

## Troubleshooting

### Common Issues
- **Workout Not Saving**: Check required fields and validation
- **Split Not Activating**: Verify start date format
- **Muscle Priorities Not Updating**: Check API response
- **Timer Not Working**: Verify browser permissions
- **Data Not Loading**: Check authentication status

### Debug Steps
1. Check browser console for errors
2. Verify API endpoint responses
3. Check database connection
4. Validate user authentication
5. Review component state

### Support
- Check documentation for API usage
- Review test cases for examples
- Contact development team for issues
- Submit bug reports with details
- Request feature enhancements
