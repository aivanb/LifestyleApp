# Code Style Reference for AI Agents

This document provides detailed code style rules and examples for maintaining consistency across the Workout & Macro Tracking App.

## Python Style Guide

### General Rules

- **PEP 8 compliant** with 100-character line limit
- **4 spaces** for indentation (no tabs)
- **UTF-8** encoding for all files
- **Unix-style** line endings (LF)

### Imports

```python
# Standard library imports first
import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal

# Third-party imports second
import django
from django.db import models, transaction
from django.utils import timezone
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes

# Local application imports last
from apps.users.models import User
from apps.foods.models import Food
from .models import FoodLog
from .serializers import FoodLogSerializer
```

### Naming Conventions

```python
# Classes: PascalCase
class FoodLogManager(models.Manager):
    pass

# Functions and variables: snake_case
def calculate_daily_macros(user, date):
    total_calories = 0
    return total_calories

# Constants: UPPER_SNAKE_CASE
MAX_CALORIES_PER_DAY = 10000
DEFAULT_PORTION_SIZE = 100

# Private methods: leading underscore
def _validate_portion_size(size):
    pass

# Module-level private: leading underscore
_cache = {}
```

### Function Definitions

```python
def create_food_log(
    user: User,
    food: Food,
    quantity: Decimal,
    meal_type: str = 'snack',
    notes: str = None
) -> FoodLog:
    """
    Create a new food log entry.
    
    Args:
        user: The user logging the food
        food: The food being logged
        quantity: Amount in grams
        meal_type: One of 'breakfast', 'lunch', 'dinner', 'snack'
        notes: Optional notes about the meal
        
    Returns:
        FoodLog: The created food log instance
        
    Raises:
        ValidationError: If quantity is negative or meal_type invalid
    """
    if quantity <= 0:
        raise ValidationError("Quantity must be positive")
        
    if meal_type not in ['breakfast', 'lunch', 'dinner', 'snack']:
        raise ValidationError(f"Invalid meal type: {meal_type}")
    
    return FoodLog.objects.create(
        user=user,
        food=food,
        quantity=quantity,
        meal_type=meal_type,
        notes=notes
    )
```

### Class Definitions

```python
class FoodLog(models.Model):
    """
    Represents a single food consumption entry.
    
    Tracks what food was eaten, when, how much, and calculates
    the nutritional values based on the quantity consumed.
    """
    
    # Model fields
    food_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='food_logs'
    )
    food = models.ForeignKey(
        Food,
        on_delete=models.PROTECT,
        related_name='logs'
    )
    quantity = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    meal_type = models.CharField(
        max_length=20,
        choices=[
            ('breakfast', 'Breakfast'),
            ('lunch', 'Lunch'),
            ('dinner', 'Dinner'),
            ('snack', 'Snack')
        ],
        default='snack'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'logging_foodlog'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'meal_type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.food.food_name} ({self.quantity}g)"
    
    @property
    def calories(self):
        """Calculate calories based on quantity."""
        return (self.food.calories * self.quantity) / 100
    
    def save(self, *args, **kwargs):
        """Override save to add custom validation."""
        self.full_clean()
        super().save(*args, **kwargs)
```

### Django Views

```python
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def food_logs(request):
    """
    List or create food logs.
    
    GET: Returns user's food logs with optional date filtering
    POST: Creates a new food log entry
    """
    if request.method == 'GET':
        # Get query parameters
        date = request.query_params.get('date')
        meal_type = request.query_params.get('meal_type')
        
        # Build query
        queryset = FoodLog.objects.filter(user=request.user)
        
        if date:
            queryset = queryset.filter(created_at__date=date)
            
        if meal_type:
            queryset = queryset.filter(meal_type=meal_type)
        
        # Optimize query
        queryset = queryset.select_related('food').order_by('-created_at')
        
        # Paginate
        page = request.query_params.get('page', 1)
        paginator = PageNumberPagination()
        paginator.page_size = 20
        result_page = paginator.paginate_queryset(queryset, request)
        
        # Serialize
        serializer = FoodLogSerializer(result_page, many=True)
        
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        serializer = FoodLogSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(
                {'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
            
        return Response(
            {'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
```

## JavaScript/React Style Guide

### General Rules

- **ES6+ syntax** required
- **2 spaces** for indentation
- **Single quotes** for strings (except JSX)
- **Semicolons** required
- **Trailing commas** in multi-line structures

### Variable Declarations

```javascript
// Use const by default
const MAX_FILE_SIZE = 5242880;
const userProfile = { name: 'John', age: 30 };

// Use let only when reassignment needed
let currentPage = 1;
currentPage += 1;

// Never use var
// var oldStyle = 'bad';  // Don't do this
```

### Function Definitions

```javascript
// Arrow functions for most cases
const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

// Regular functions for methods and when 'this' is needed
function UserService() {
  this.getUser = function(id) {
    return api.get(`/users/${id}`);
  };
}

// Async functions
const fetchUserData = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
};
```

### React Components

```javascript
// Functional components with hooks
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const FoodLogger = ({ onFoodLogged, mealType = 'snack' }) => {
  // State declarations
  const [searchTerm, setSearchTerm] = useState('');
  const [foods, setFoods] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Context
  const { user } = useAuth();
  
  // Effects
  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchFoods();
    } else {
      setFoods([]);
    }
  }, [searchTerm]);
  
  // Callbacks
  const searchFoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/foods/search/', {
        params: { q: searchTerm }
      });
      setFoods(response.data.data);
    } catch (err) {
      setError('Failed to search foods');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);
  
  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    setSearchTerm('');
    setFoods([]);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFood) {
      setError('Please select a food');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/logging/food/', {
        food_id: selectedFood.food_id,
        quantity,
        meal_type: mealType
      });
      
      // Reset form
      setSelectedFood(null);
      setQuantity(100);
      
      // Notify parent
      onFoodLogged && onFoodLogged(response.data.data);
      
      // Show success message
      alert('Food logged successfully!');
    } catch (err) {
      setError('Failed to log food');
      console.error('Logging error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Render
  return (
    <div className="food-logger">
      <h2>Log Food</h2>
      
      {error && (
        <div className="alert alert-error">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Search input */}
        <div className="form-group">
          <label htmlFor="food-search">Search Foods</label>
          <input
            id="food-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search..."
            className="form-control"
          />
        </div>
        
        {/* Search results */}
        {foods.length > 0 && (
          <div className="search-results">
            {foods.map(food => (
              <button
                key={food.food_id}
                type="button"
                onClick={() => handleFoodSelect(food)}
                className="food-item"
              >
                <span className="food-name">{food.food_name}</span>
                <span className="food-calories">{food.calories} cal</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Selected food */}
        {selectedFood && (
          <div className="selected-food">
            <h3>{selectedFood.food_name}</h3>
            <p>{selectedFood.calories} calories per 100g</p>
            
            <div className="form-group">
              <label htmlFor="quantity">Quantity (g)</label>
              <input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                max="5000"
                className="form-control"
              />
            </div>
            
            <div className="macro-preview">
              <p>Total: {Math.round(selectedFood.calories * quantity / 100)} cal</p>
            </div>
          </div>
        )}
        
        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !selectedFood}
          className="btn btn-primary"
        >
          {loading ? 'Logging...' : 'Log Food'}
        </button>
      </form>
    </div>
  );
};

// PropTypes
FoodLogger.propTypes = {
  onFoodLogged: PropTypes.func,
  mealType: PropTypes.oneOf(['breakfast', 'lunch', 'dinner', 'snack'])
};

export default FoodLogger;
```

### Service Files

```javascript
// services/foodApi.js

import api from './api';

/**
 * Food-related API calls
 */
export const foodApi = {
  /**
   * Search foods by name
   * @param {string} query - Search term
   * @returns {Promise<Array>} List of matching foods
   */
  search: async (query) => {
    const response = await api.get('/foods/search/', {
      params: { q: query }
    });
    return response.data.data;
  },
  
  /**
   * Get food by ID
   * @param {number} foodId - Food ID
   * @returns {Promise<Object>} Food details
   */
  getById: async (foodId) => {
    const response = await api.get(`/foods/${foodId}/`);
    return response.data.data;
  },
  
  /**
   * Create new food
   * @param {Object} foodData - Food information
   * @returns {Promise<Object>} Created food
   */
  create: async (foodData) => {
    const response = await api.post('/foods/', foodData);
    return response.data.data;
  },
  
  /**
   * Update existing food
   * @param {number} foodId - Food ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated food
   */
  update: async (foodId, updates) => {
    const response = await api.patch(`/foods/${foodId}/`, updates);
    return response.data.data;
  },
  
  /**
   * Delete food
   * @param {number} foodId - Food ID
   * @returns {Promise<void>}
   */
  delete: async (foodId) => {
    await api.delete(`/foods/${foodId}/`);
  }
};
```

## CSS/Styling

### Class Names

```css
/* BEM-style naming */
.food-logger { }
.food-logger__header { }
.food-logger__search { }
.food-logger__search--active { }

/* Component states */
.btn { }
.btn--primary { }
.btn--loading { }
.btn--disabled { }

/* Utility classes */
.mt-4 { margin-top: 1rem; }
.text-center { text-align: center; }
.hidden { display: none; }
```

### CSS Organization

```css
/* Component styles */
.food-logger {
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.food-logger__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

/* State variations */
.food-logger--loading {
  opacity: 0.6;
  pointer-events: none;
}

/* Responsive design */
@media (max-width: 768px) {
  .food-logger {
    padding: 0.5rem;
  }
  
  .food-logger__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

## Comments and Documentation

### Python Docstrings

```python
def calculate_macro_distribution(food_log):
    """
    Calculate the macro distribution for a food log entry.
    
    This function calculates the actual grams of protein, carbs, and fat
    based on the food's nutritional values and the logged quantity.
    
    Args:
        food_log (FoodLog): The food log entry to calculate for
        
    Returns:
        dict: A dictionary containing:
            - protein (Decimal): Grams of protein
            - carbohydrates (Decimal): Grams of carbohydrates  
            - fat (Decimal): Grams of fat
            - calories (Decimal): Total calories
            
    Example:
        >>> log = FoodLog.objects.get(pk=1)
        >>> macros = calculate_macro_distribution(log)
        >>> print(macros['protein'])
        Decimal('25.5')
    """
    multiplier = food_log.quantity / 100
    
    return {
        'protein': food_log.food.protein * multiplier,
        'carbohydrates': food_log.food.carbohydrates * multiplier,
        'fat': food_log.food.fat * multiplier,
        'calories': food_log.food.calories * multiplier
    }
```

### JavaScript Comments

```javascript
/**
 * Custom hook for managing food search functionality
 * 
 * @param {Object} options - Hook options
 * @param {number} options.debounceMs - Debounce delay in milliseconds
 * @param {number} options.minSearchLength - Minimum search term length
 * 
 * @returns {Object} Hook state and methods
 * @returns {string} returns.searchTerm - Current search term
 * @returns {Array} returns.results - Search results
 * @returns {boolean} returns.loading - Loading state
 * @returns {Function} returns.setSearchTerm - Update search term
 * 
 * @example
 * const { searchTerm, results, loading, setSearchTerm } = useFoodSearch({
 *   debounceMs: 300,
 *   minSearchLength: 2
 * });
 */
const useFoodSearch = ({ debounceMs = 300, minSearchLength = 2 } = {}) => {
  // Implementation
};
```

## File Organization

### Python Module Structure

```
apps/foods/
├── __init__.py
├── models.py          # Database models
├── serializers.py     # DRF serializers
├── views.py           # API views
├── urls.py            # URL routing
├── services.py        # Business logic
├── utils.py           # Helper functions
├── validators.py      # Custom validators
├── managers.py        # Custom model managers
├── signals.py         # Django signals
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_views.py
│   └── test_services.py
└── migrations/
    └── ...
```

### React Component Structure

```
src/components/FoodLogger/
├── index.js           # Main component export
├── FoodLogger.js      # Component implementation
├── FoodLogger.css     # Component styles
├── FoodLogger.test.js # Component tests
├── components/        # Sub-components
│   ├── SearchInput.js
│   └── FoodItem.js
└── hooks/             # Component-specific hooks
    └── useFoodSearch.js
```

## Error Handling

### Python Error Handling

```python
# Custom exceptions
class FoodNotFoundError(Exception):
    """Raised when a food item cannot be found."""
    pass

class InsufficientPermissionsError(Exception):
    """Raised when user lacks required permissions."""
    pass

# Usage in views
try:
    food = Food.objects.get(food_id=food_id)
    
    if food.user != request.user and not food.is_public:
        raise InsufficientPermissionsError("Cannot access private food")
        
except Food.DoesNotExist:
    return Response(
        {'error': {'message': 'Food not found'}},
        status=status.HTTP_404_NOT_FOUND
    )
except InsufficientPermissionsError as e:
    return Response(
        {'error': {'message': str(e)}},
        status=status.HTTP_403_FORBIDDEN
    )
except Exception as e:
    logger.error(f"Unexpected error: {str(e)}")
    return Response(
        {'error': {'message': 'An unexpected error occurred'}},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
```

### JavaScript Error Handling

```javascript
// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    
    return this.props.children;
  }
}

// Async error handling
const fetchData = async () => {
  try {
    setLoading(true);
    const data = await api.get('/endpoint');
    setData(data);
  } catch (error) {
    if (error.response?.status === 404) {
      setError('Data not found');
    } else if (error.response?.status === 403) {
      setError('Permission denied');
    } else {
      setError('An unexpected error occurred');
    }
    console.error('Fetch error:', error);
  } finally {
    setLoading(false);
  }
};
```

---

**Remember**: Consistency is key. When in doubt, follow the existing patterns in the codebase. Use linters and formatters to maintain style automatically.
