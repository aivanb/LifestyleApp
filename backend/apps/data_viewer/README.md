# Data Viewer Module - Standard Foundation for Database Access

## Overview

The Data Viewer module provides a **comprehensive, secure, and modular foundation** for all database access in the application. It implements industry-standard patterns for data retrieval with built-in authentication, authorization, filtering, sorting, searching, and comprehensive security measures.

**🚨 IMPORTANT**: This module should be used as the standard approach for all future systems that need to access database information.

## Why Use This Module

### For Future Development
- **Consistency**: Single pattern for all data access across the application
- **Security**: Built-in SQL injection prevention, XSS protection, and access control
- **Maintainability**: Centralized logic easier to update and debug
- **Performance**: Optimized queries with pagination and filtering
- **Auditing**: Automatic logging of all data access attempts

### Key Features
✅ Role-based access control (admin, user, guest)  
✅ Automatic data filtering based on user permissions  
✅ SQL injection and XSS prevention  
✅ Comprehensive input validation and sanitization  
✅ Full-text search across all text fields  
✅ Field-specific filtering with multiple operators  
✅ Sorting with field validation  
✅ Pagination for large datasets  
✅ Audit logging for security compliance  
✅ Detailed error handling with user-friendly messages

## Architecture

### Components

1. **DataAccessService** (`services.py`)
   - Core service class for all database access
   - Handles authentication, authorization, filtering, and security
   - Foundation class that should be used by all future data access needs

2. **API Endpoints** (`views.py`)
   - RESTful API endpoints for data retrieval
   - Standard interface for frontend integration
   - Comprehensive error handling

3. **URL Routing** (`urls.py`)
   - Clean URL structure for data access
   - Follows REST conventions

## Access Control Model

### Role Hierarchy

#### Admin
- **Access**: ALL tables including internal Django tables
- **Data Visibility**: ALL data from ALL users
- **Use Case**: System administration, debugging, analytics

#### User
- **Access**: All user-accessible tables (NO internal Django tables)
- **Data Visibility**: 
  - Own data (tables with `user_id` field)
  - Public data (tables with `make_public=True`)
  - Reference tables (no user_id or make_public fields)
- **Use Case**: Normal application usage

#### Guest
- **Access**: User-accessible tables only
- **Data Visibility**:
  - Own data (if authenticated as guest)
  - Reference tables
  - NO access to `make_public` data
- **Use Case**: Limited access, trial accounts

### Table Classification

**User-Specific Tables** (have `user_id` field):
- `users`, `user_goal`, `meals`, `food_log`, `weight_log`
- `body_measurement_log`, `water_log`, `steps_log`, `cardio_log`
- `workouts`, `workout_log`, `muscle_log`, `splits`
- `sleep_log`, `health_metrics_log`, `api_usage_log`, `error_log`

**Public Data Tables** (have `make_public` field):
- `foods` - Users can share food entries
- `workouts` - Users can share workout routines

**Reference Tables** (no user_id or make_public):
- `access_levels`, `activity_levels`, `muscles`, `units`
- Users can view, admins can modify

**Internal Tables** (Django system tables):
- `auth_permission`, `django_session`, etc.
- Admin-only access

## Usage Guide

### Backend Integration

#### Basic Usage
```python
from apps.data_viewer.services import DataAccessService

# Initialize service with authenticated user
service = DataAccessService(user=request.user)

# Get available tables
tables = service.get_available_tables()

# Get table schema
schema = service.get_table_schema('foods')

# Get table data with filtering
data = service.get_table_data(
    table_name='foods',
    filters={'food_group': 'protein'},
    sort_by='food_name',
    sort_order='asc',
    search='chicken',
    page=1,
    page_size=20
)
```

#### Advanced Filtering
```python
# Range queries
data = service.get_table_data(
    table_name='foods',
    filters={
        'calories': {'min': 100, 'max': 500},
        'food_group': 'protein'
    }
)

# Text search
data = service.get_table_data(
    table_name='foods',
    search='chicken breast'  # Searches across all text fields
)

# Multiple filters with sorting
data = service.get_table_data(
    table_name='workout_log',
    filters={
        'user_id': request.user.user_id,
        'date_time': {'min': '2024-01-01'}
    },
    sort_by='date_time',
    sort_order='desc',
    page=1,
    page_size=50
)
```

### API Integration

#### Get Available Tables
```http
GET /api/data-viewer/tables/
Authorization: Bearer <token>

Response:
{
  "data": {
    "tables": [
      {
        "name": "foods",
        "model": "Food",
        "app": "foods",
        "description": "Nutritional information for food items",
        "field_count": 20,
        "has_user_field": false,
        "has_public_field": true
      }
    ],
    "access_level": "user",
    "total_count": 15
  }
}
```

#### Get Table Schema
```http
GET /api/data-viewer/tables/foods/schema/
Authorization: Bearer <token>

Response:
{
  "data": {
    "table_name": "foods",
    "model_name": "Food",
    "fields": [
      {
        "name": "food_id",
        "type": "AutoField",
        "null": false,
        "primary_key": true
      },
      {
        "name": "food_name",
        "type": "CharField",
        "max_length": 200,
        "null": false
      }
    ],
    "relationships": []
  }
}
```

#### Get Table Data
```http
POST /api/data-viewer/tables/foods/data/
Authorization: Bearer <token>
Content-Type: application/json

{
  "filters": {
    "food_group": "protein",
    "calories": {"min": 100, "max": 300}
  },
  "sort_by": "food_name",
  "sort_order": "asc",
  "search": "chicken",
  "page": 1,
  "page_size": 20
}

Response:
{
  "data": {
    "data": [
      {
        "food_id": 1,
        "food_name": "Chicken Breast",
        "calories": 165
      }
    ],
    "pagination": {
      "total": 5,
      "pages": 1,
      "current_page": 1,
      "page_size": 20,
      "has_next": false,
      "has_previous": false
    },
    "filters_applied": {
      "food_group": "protein"
    },
    "sort_applied": {
      "field": "food_name",
      "order": "asc"
    }
  }
}
```

### Frontend Integration

```javascript
import dataViewerAPI from '../services/dataViewerApi';

// Get available tables
const tables = await dataViewerAPI.getAvailableTables();

// Get table data
const result = await dataViewerAPI.getTableData('foods', {
  filters: { food_group: 'protein' },
  sortBy: 'food_name',
  sortOrder: 'asc',
  search: 'chicken',
  page: 1,
  pageSize: 20
});
```

## Security Features

### Input Sanitization
All user inputs are sanitized to prevent:
- SQL injection attacks
- XSS attacks
- Path traversal
- Command injection

Dangerous characters and patterns are automatically removed:
- SQL operators: `'`, `"`, `;`, `--`, `/*`, `*/`
- Stored procedure prefixes: `xp_`, `sp_`
- Maximum length enforcement (500 characters)

### Authentication
- JWT token validation required for all endpoints
- User identity verified on every request
- Automatic token refresh handled by middleware

### Authorization
- Role-based access control enforced at service layer
- Automatic data filtering based on user permissions
- Table-level and row-level security

### Audit Logging
All data access attempts are logged:
- User identity
- Table accessed
- Filters applied
- Success/failure status
- Error messages
- Timestamp

## Error Handling

### Validation Errors
```json
{
  "error": {
    "message": "Invalid filter values: Field 'invalid_field' does not exist"
  }
}
```

### Authorization Errors
```json
{
  "error": {
    "message": "Access denied: 'auth_permission' is an internal table"
  }
}
```

### Not Found Errors
```json
{
  "error": {
    "message": "Table 'nonexistent' does not exist"
  }
}
```

## Performance Considerations

### Query Optimization
- Automatic pagination prevents large result sets
- Index utilization for sorting and filtering
- Lazy loading with Django ORM
- Efficient queryset chaining

### Pagination
- Default page size: 20 rows
- Maximum page size: 100 rows
- Total count provided for UI pagination
- Next/previous page indicators

### Caching
Future enhancement: Consider caching for:
- Table schemas (rarely change)
- Reference table data (static)
- User permissions (session-based)

## Extending the System

### Adding New Filters
To add custom filter types, extend the `_apply_filters` method in `DataAccessService`:

```python
def _apply_filters(self, queryset, filters):
    # Existing filter logic...
    
    # Add custom filter type
    if 'custom_filter' in filters:
        queryset = queryset.filter(custom_logic=filters['custom_filter'])
    
    return queryset
```

### Adding New Access Levels
1. Add new role to `AccessLevel` model
2. Update access control logic in `_apply_access_control`
3. Document new role's permissions

### Custom Data Transformations
For complex data transformations, extend the serialization in `get_table_data`:

```python
# In get_table_data method
for obj in page_obj:
    row = self._serialize_object(obj, model)  # New method
    data.append(row)
```

## Integration Examples

### Example 1: User Dashboard Data
```python
# Get user's recent food logs
service = DataAccessService(user=request.user)
logs = service.get_table_data(
    'food_log',
    filters={'user_id': request.user.user_id},
    sort_by='date_time',
    sort_order='desc',
    page=1,
    page_size=10
)
```

### Example 2: Public Food Database
```python
# Get public food entries
service = DataAccessService(user=request.user)
foods = service.get_table_data(
    'foods',
    filters={'make_public': True},
    sort_by='food_name',
    page=1
)
```

### Example 3: Admin Analytics
```python
# Admin viewing all users' data
service = DataAccessService(user=admin_user)
all_logs = service.get_table_data(
    'api_usage_log',
    filters={'created_at': {'min': '2024-01-01'}},
    sort_by='created_at',
    sort_order='desc'
)
```

## Best Practices

### DO
✅ Always use `DataAccessService` for database queries  
✅ Let the service handle access control automatically  
✅ Use pagination for large datasets  
✅ Provide meaningful search terms and filters  
✅ Handle errors gracefully in UI  
✅ Log data access in critical workflows

### DON'T
❌ Bypass `DataAccessService` for direct database access  
❌ Trust user input without validation  
❌ Return all data without pagination  
❌ Expose sensitive fields (passwords, tokens)  
❌ Allow unrestricted file/field access  
❌ Ignore access control checks

## Troubleshooting

### "Access denied" errors
- Check user's access_level in database
- Verify table has appropriate user_id or make_public fields
- Ensure user is authenticated

### "Table does not exist" errors
- Verify table name matches database schema
- Check for typos in table name
- Ensure migrations have been run

### Empty result sets
- Check applied filters match data
- Verify user has permission to see data
- Review access control rules

### Performance issues
- Reduce page_size for faster queries
- Add database indexes on filtered/sorted fields
- Limit number of active filters
- Consider caching for reference data

## Future Enhancements

Planned improvements:
- [ ] GraphQL API support
- [ ] Real-time data subscriptions
- [ ] Advanced query builder UI
- [ ] Export to CSV/Excel
- [ ] Saved filter presets
- [ ] Column visibility controls
- [ ] Advanced aggregations
- [ ] Multi-table joins

## Support

For questions or issues:
- Review this documentation
- Check `DEVELOPER.md` for technical details
- Review test cases for usage examples
- Check audit logs for access issues

