# Workout Tracking System - API Documentation

## 🌐 API Overview

The Workout Tracking System provides a RESTful API built with Django REST Framework. All endpoints require authentication via JWT tokens and follow a consistent response format.

## 🔐 Authentication

### JWT Token Authentication
All API endpoints require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Refresh
```http
POST /api/auth/refresh/
Content-Type: application/json

{
    "refresh": "<your-refresh-token>"
}
```

## 📋 Response Format

### Success Response
```json
{
    "success": true,
    "data": {
        // Response data here
    }
}
```

### Error Response
```json
{
    "success": false,
    "error": {
        "message": "Error description",
        "details": {} // Optional additional error details
    }
}
```

## 🏋️ Workout Management

### List Workouts
```http
GET /api/workouts/
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "workout_id": 1,
            "workout_name": "Bench Press 💪",
            "type": "barbell",
            "notes": "Heavy compound lift",
            "muscles": [
                {
                    "id": 1,
                    "muscle": 1,
                    "muscle_name": "Chest",
                    "muscle_group": "Upper Body",
                    "activation_rating": 100
                }
            ],
            "created_at": "2024-01-01T10:00:00Z"
        }
    ]
}
```

### Create Workout
```http
POST /api/workouts/
Content-Type: application/json

{
    "workout_name": "Bench Press 💪",
    "type": "barbell",
    "notes": "Heavy compound lift",
    "muscles": [
        {
            "muscle": 1,
            "activation_rating": 100
        },
        {
            "muscle": 2,
            "activation_rating": 75
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "workout_id": 1,
        "workout_name": "Bench Press 💪",
        "type": "barbell",
        "notes": "Heavy compound lift",
        "muscles": [
            {
                "id": 1,
                "muscle": 1,
                "muscle_name": "Chest",
                "muscle_group": "Upper Body",
                "activation_rating": 100
            }
        ],
        "created_at": "2024-01-01T10:00:00Z"
    }
}
```

### Get Workout
```http
GET /api/workouts/{workout_id}/
```

### Update Workout
```http
PUT /api/workouts/{workout_id}/
Content-Type: application/json

{
    "workout_name": "Updated Bench Press 💪",
    "type": "barbell",
    "notes": "Updated notes",
    "muscles": [
        {
            "muscle": 1,
            "activation_rating": 95
        }
    ]
}
```

### Delete Workout
```http
DELETE /api/workouts/{workout_id}/
```

## 🎯 Muscle Management

### List Muscles
```http
GET /api/workouts/muscles/
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "muscles_id": 1,
            "muscle_name": "Chest",
            "muscle_group": "Upper Body"
        },
        {
            "muscles_id": 2,
            "muscle_name": "Back",
            "muscle_group": "Upper Body"
        }
    ]
}
```

### Get Muscle Priorities
```http
GET /api/workouts/muscle-priorities/
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "muscle_log_id": 1,
            "muscle_name": 1,
            "muscle_name_display": "Chest",
            "muscle_group": "Upper Body",
            "priority": 80
        }
    ]
}
```

### Update Muscle Priorities
```http
POST /api/workouts/muscle-priorities/
Content-Type: application/json

{
    "muscle_logs": [
        {
            "muscle_name": 1,
            "priority": 95
        },
        {
            "muscle_name": 2,
            "priority": 75
        }
    ]
}
```

## 📝 Workout Logging

### List Workout Logs
```http
GET /api/workouts/logs/
```

**Query Parameters:**
- `date` (optional): Filter by date (YYYY-MM-DD)
- `workout` (optional): Filter by workout ID

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "workout_log_id": 1,
            "workout": 1,
            "workout_name": "Bench Press 💪",
            "date_time": "2024-01-01T10:00:00Z",
            "weight": 100,
            "reps": 10,
            "rir": 2,
            "notes": "Feeling strong",
            "attributes": ["dropset"]
        }
    ]
}
```

### Log Workout
```http
POST /api/workouts/logs/
Content-Type: application/json

{
    "workout": 1,
    "date_time": "2024-01-01T10:00:00Z",
    "weight": 100,
    "reps": 10,
    "rir": 2,
    "notes": "Feeling strong",
    "attributes": ["dropset"]
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "workout_log_id": 1,
        "workout": 1,
        "workout_name": "Bench Press 💪",
        "date_time": "2024-01-01T10:00:00Z",
        "weight": 100,
        "reps": 10,
        "rir": 2,
        "notes": "Feeling strong",
        "attributes": ["dropset"]
    }
}
```

## 📅 Split Management

### List Splits
```http
GET /api/workouts/splits/
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "splits_id": 1,
            "split_name": "Push/Pull/Legs",
            "start_date": "2024-01-01",
            "created_at": "2024-01-01T10:00:00Z",
            "split_days": [
                {
                    "split_days_id": 1,
                    "day_name": "Push Day",
                    "day_order": 1,
                    "targets": [
                        {
                            "id": 1,
                            "muscle": 1,
                            "muscle_name": "Chest",
                            "target_activation": 250
                        }
                    ]
                }
            ],
            "analysis": [
                {
                    "muscle_id": 1,
                    "muscle_name": "Chest",
                    "muscle_group": "Upper Body",
                    "total_activation": 250,
                    "optimal_range": {
                        "lower": 378,
                        "upper": 5292
                    },
                    "priority": 80
                }
            ]
        }
    ]
}
```

### Create Split
```http
POST /api/workouts/splits/
Content-Type: application/json

{
    "split_name": "Push/Pull/Legs",
    "start_date": "2024-01-01",
    "split_days": [
        {
            "day_name": "Push Day",
            "day_order": 1,
            "targets": [
                {
                    "muscle": 1,
                    "target_activation": 250
                },
                {
                    "muscle": 2,
                    "target_activation": 150
                }
            ]
        },
        {
            "day_name": "Pull Day",
            "day_order": 2,
            "targets": [
                {
                    "muscle": 3,
                    "target_activation": 300
                }
            ]
        }
    ]
}
```

### Get Split
```http
GET /api/workouts/splits/{split_id}/
```

### Update Split
```http
PUT /api/workouts/splits/{split_id}/
Content-Type: application/json

{
    "split_name": "Updated Push/Pull/Legs",
    "start_date": "2024-01-01",
    "split_days": [
        {
            "day_name": "Updated Push Day",
            "day_order": 1,
            "targets": [
                {
                    "muscle": 1,
                    "target_activation": 300
                }
            ]
        }
    ]
}
```

### Delete Split
```http
DELETE /api/workouts/splits/{split_id}/
```

### Activate Split
```http
POST /api/workouts/splits/{split_id}/activate/
Content-Type: application/json

{
    "start_date": "2024-01-01"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Split activated successfully"
}
```

### Get Current Split Day
```http
GET /api/workouts/current-split-day/?date=2024-01-01
```

**Query Parameters:**
- `date` (required): Date to check (YYYY-MM-DD)

**Response:**
```json
{
    "success": true,
    "data": {
        "active_split": {
            "splits_id": 1,
            "split_name": "Push/Pull/Legs",
            "start_date": "2024-01-01",
            "created_at": "2024-01-01T10:00:00Z",
            "split_days": [
                {
                    "split_days_id": 1,
                    "day_name": "Push Day",
                    "day_order": 1,
                    "targets": [
                        {
                            "id": 1,
                            "muscle": 1,
                            "muscle_name": "Chest",
                            "target_activation": 250
                        }
                    ]
                }
            ],
            "analysis": []
        },
        "current_split_day": {
            "split_days_id": 1,
            "day_name": "Push Day",
            "day_order": 1,
            "targets": [
                {
                    "muscle": 1,
                    "muscle_name": "Chest",
                    "target_activation": 250
                }
            ]
        }
    }
}
```

## 📊 Statistics

### Get Workout Statistics
```http
GET /api/workouts/stats/
```

**Response:**
```json
{
    "success": true,
    "data": {
        "total_workouts": 5,
        "total_muscles": 8,
        "total_splits": 2,
        "total_logs": 15,
        "recent_activity": [
            {
                "date": "2024-01-01",
                "workouts_logged": 3,
                "total_volume": 1500
            }
        ]
    }
}
```

### Get Recently Logged Workouts
```http
GET /api/workouts/recently-logged/
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "workout_log_id": 1,
            "workout": 1,
            "workout_name": "Bench Press 💪",
            "date_time": "2024-01-01T10:00:00Z",
            "weight": 100,
            "reps": 10,
            "rir": 2,
            "notes": "Feeling strong",
            "attributes": ["dropset"]
        }
    ]
}
```

### Get Workout Icons
```http
GET /api/workouts/icons/
```

**Response:**
```json
{
    "success": true,
    "data": [
        "💪", "🏋️", "🦵", "💨", "🔥", "⚡", "🎯", "💎", "🌟", "🚀"
    ]
}
```

## 🔍 Error Handling

### Common Error Codes

#### 400 Bad Request
```json
{
    "success": false,
    "error": {
        "message": "Invalid input data",
        "details": {
            "workout_name": ["This field is required."],
            "muscles": ["This field is required."]
        }
    }
}
```

#### 401 Unauthorized
```json
{
    "success": false,
    "error": {
        "message": "Authentication credentials were not provided."
    }
}
```

#### 403 Forbidden
```json
{
    "success": false,
    "error": {
        "message": "You do not have permission to perform this action."
    }
}
```

#### 404 Not Found
```json
{
    "success": false,
    "error": {
        "message": "Workout not found"
    }
}
```

#### 500 Internal Server Error
```json
{
    "success": false,
    "error": {
        "message": "An unexpected error occurred"
    }
}
```

## 📝 Data Validation

### Workout Validation
- `workout_name`: Required, max 200 characters
- `type`: Required, max 50 characters
- `notes`: Optional, max 1000 characters
- `muscles`: Required, array of muscle objects
  - `muscle`: Required, valid muscle ID
  - `activation_rating`: Required, integer 0-100

### Split Validation
- `split_name`: Required, max 200 characters
- `start_date`: Optional, valid date format (YYYY-MM-DD)
- `split_days`: Required, array of split day objects
  - `day_name`: Required, max 100 characters
  - `day_order`: Required, positive integer
  - `targets`: Required, array of target objects
    - `muscle`: Required, valid muscle ID
    - `target_activation`: Required, non-negative integer

### Workout Log Validation
- `workout`: Required, valid workout ID
- `date_time`: Required, valid ISO datetime
- `weight`: Optional, non-negative number
- `reps`: Optional, positive integer
- `rir`: Optional, non-negative integer
- `notes`: Optional, max 1000 characters
- `attributes`: Optional, array of valid attributes

### Valid Attributes
- `dropset`
- `assisted`
- `partial`
- `pause`
- `negatives`

## 🔧 Rate Limiting

### Current Limits
- **Workout Creation**: 100 requests per hour
- **Workout Logging**: 200 requests per hour
- **Split Management**: 50 requests per hour
- **Statistics**: 1000 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🚀 Performance Tips

### Optimizing Requests
1. **Use Pagination**: For large datasets, use pagination parameters
2. **Filter Data**: Use query parameters to filter results
3. **Batch Operations**: Group related operations when possible
4. **Cache Responses**: Cache frequently accessed data

### Example Optimized Request
```http
GET /api/workouts/logs/?date=2024-01-01&workout=1&page=1&page_size=20
```

## 📚 SDK Examples

### JavaScript/React
```javascript
import api from './services/api';

// Create workout
const createWorkout = async (workoutData) => {
    try {
        const response = await api.post('/workouts/', workoutData);
        return response.data;
    } catch (error) {
        console.error('Error creating workout:', error);
        throw error;
    }
};

// Log workout
const logWorkout = async (logData) => {
    try {
        const response = await api.post('/workouts/logs/', logData);
        return response.data;
    } catch (error) {
        console.error('Error logging workout:', error);
        throw error;
    }
};
```

### Python
```python
import requests

class WorkoutAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def create_workout(self, workout_data):
        response = requests.post(
            f'{self.base_url}/api/workouts/',
            json=workout_data,
            headers=self.headers
        )
        return response.json()
    
    def log_workout(self, log_data):
        response = requests.post(
            f'{self.base_url}/api/workouts/logs/',
            json=log_data,
            headers=self.headers
        )
        return response.json()
```

## 🔍 Testing the API

### Using cURL
```bash
# Create workout
curl -X POST http://localhost:8000/api/workouts/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "workout_name": "Test Workout",
    "type": "barbell",
    "muscles": [
      {"muscle": 1, "activation_rating": 100}
    ]
  }'

# Log workout
curl -X POST http://localhost:8000/api/workouts/logs/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "workout": 1,
    "date_time": "2024-01-01T10:00:00Z",
    "weight": 100,
    "reps": 10
  }'
```

### Using Postman
1. Import the API collection
2. Set up authentication with JWT token
3. Test all endpoints with sample data
4. Verify response formats and error handling

## 📖 Additional Resources

- **Django REST Framework**: https://www.django-rest-framework.org/
- **JWT Authentication**: https://django-rest-framework-simplejwt.readthedocs.io/
- **API Testing**: https://www.postman.com/
- **cURL Documentation**: https://curl.se/docs/

---

**Note**: This API is designed for the Workout Tracking System. All endpoints require authentication and follow the established response format. For questions or issues, refer to the main documentation or contact the development team.
