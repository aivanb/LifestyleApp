"""
Data Access Service - Foundation for all database queries

This service provides a comprehensive, abstract, and modular approach to database access
that should be used by all future systems requiring data retrieval. It enforces:
- Role-based access control
- Data filtering and sanitization
- Query optimization
- Security best practices
- Comprehensive logging

Usage:
    from apps.data_viewer.services import DataAccessService
    
    service = DataAccessService(user=request.user)
    data = service.get_table_data('foods', filters={'food_group': 'protein'}, page=1)
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from django.db import models
from django.core.exceptions import FieldDoesNotExist, ValidationError
from django.db.models import Q
from django.apps import apps
from django.core.paginator import Paginator
from apps.users.models import User
from apps.analytics.models import ApiUsageLog, ErrorLog

logger = logging.getLogger(__name__)


class DataAccessService:
    """
    Comprehensive data access service for secure database querying.
    
    This service is designed to be the standard foundation for all future systems
    that need to access database information. It provides:
    - Authentication and authorization
    - Role-based data visibility
    - Filtering, sorting, and searching
    - Security against SQL injection and XSS
    - Comprehensive error handling and logging
    - Type checking and data validation
    
    Access Control Levels:
    - admin: Full access to all tables and all user data
    - user: Access to user-specific data and public data, no internal tables
    - guest: Access to public data only, no user-specific or internal tables
    """
    
    # Internal Django tables that users should not access
    INTERNAL_TABLES = {
        'auth_permission', 'auth_group', 'auth_group_permissions',
        'auth_user_groups', 'auth_user_user_permissions',
        'django_admin_log', 'django_content_type', 'django_migrations',
        'django_session', 'auth_user'
    }
    
    # Tables that support make_public field
    TABLES_WITH_PUBLIC_FLAG = {'foods', 'workouts'}
    
    # Tables that support user_id field
    TABLES_WITH_USER_ID = {
        'users', 'user_goal', 'meals', 'food_log', 'weight_log',
        'body_measurement_log', 'water_log', 'steps_log', 'cardio_log',
        'workouts', 'workout_log', 'muscle_log', 'splits', 'sleep_log',
        'health_metrics_log', 'api_usage_log', 'error_log'
    }
    
    def __init__(self, user: User):
        """
        Initialize data access service with authenticated user.
        
        Args:
            user: Authenticated Django User object
            
        Raises:
            ValueError: If user is not authenticated or invalid
        """
        if not user or not user.is_authenticated:
            raise ValueError("User must be authenticated to use DataAccessService")
        
        self.user = user
        self.access_level = self._get_access_level()
        self._log_access_initialization()
    
    def _get_access_level(self) -> str:
        """
        Get user's access level from their profile.
        
        Returns:
            str: Access level ('admin', 'user', or 'guest')
        """
        if hasattr(self.user, 'access_level') and self.user.access_level:
            return self.user.access_level.role_name
        return 'guest'  # Default to guest if no access level set
    
    def _log_access_initialization(self):
        """Log service initialization for audit trail"""
        try:
            ApiUsageLog.objects.create(
                user=self.user,
                request_type='DataAccessService.init',
                model_used='N/A',
                tokens_used=0,
                cost=0,
                response_time=0,
                request=f"User: {self.user.username}, Level: {self.access_level}",
                response='Service initialized',
                success=True
            )
        except Exception as e:
            logger.error(f"Failed to log access initialization: {e}")
    
    def _log_data_access(self, table_name: str, filters: Dict, success: bool, 
                        row_count: int = 0, error_message: str = None):
        """
        Log data access attempt for security audit.
        
        Args:
            table_name: Name of table accessed
            filters: Filters applied to query
            success: Whether access was successful
            row_count: Number of rows returned
            error_message: Error message if failed
        """
        try:
            request_data = f"Table: {table_name}, Filters: {filters}, User: {self.user.username}"
            response_data = f"Success: {success}, Rows: {row_count}"
            
            if not success and error_message:
                ErrorLog.objects.create(
                    user=self.user,
                    error_type='DataAccessError',
                    error_message=error_message,
                    user_input=request_data
                )
            
            ApiUsageLog.objects.create(
                user=self.user,
                request_type=f'DataAccess.{table_name}',
                model_used='N/A',
                tokens_used=0,
                cost=0,
                response_time=0,
                request=request_data[:1000],
                response=response_data[:1000],
                success=success,
                error_message=error_message
            )
        except Exception as e:
            logger.error(f"Failed to log data access: {e}")
    
    def _sanitize_input(self, value: Any) -> Any:
        """
        Sanitize user input to prevent XSS and injection attacks.
        
        Args:
            value: Input value to sanitize
            
        Returns:
            Sanitized value
        """
        if isinstance(value, str):
            # Remove potential SQL injection characters
            dangerous_chars = ["'", '"', ';', '--', '/*', '*/', 'xp_', 'sp_']
            for char in dangerous_chars:
                value = value.replace(char, '')
            
            # Limit length to prevent DoS
            value = value[:500]
            
            # Strip whitespace
            value = value.strip()
        
        return value
    
    def _validate_table_name(self, table_name: str) -> Tuple[bool, str]:
        """
        Validate table name and check access permissions.
        
        Args:
            table_name: Name of table to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Sanitize table name
        table_name = self._sanitize_input(table_name)
        
        # Check if table is internal
        if table_name in self.INTERNAL_TABLES:
            if self.access_level != 'admin':
                return False, f"Access denied: '{table_name}' is an internal table"
        
        # Check if table exists
        try:
            apps.get_model('users' if table_name == 'users' else self._get_app_name(table_name), 
                          self._get_model_name(table_name))
        except LookupError:
            return False, f"Table '{table_name}' does not exist"
        
        return True, ""
    
    def _get_app_name(self, table_name: str) -> str:
        """
        Determine Django app name from table name.
        
        Args:
            table_name: Database table name
            
        Returns:
            Django app name
        """
        # Mapping of table names to Django apps
        app_mapping = {
            'foods': 'foods',
            'meals': 'foods',
            'meals_foods': 'foods',
            'food_log': 'logging',
            'weight_log': 'logging',
            'body_measurement_log': 'logging',
            'water_log': 'logging',
            'steps_log': 'logging',
            'cardio_log': 'logging',
            'workouts': 'workouts',
            'muscles': 'workouts',
            'workout_log': 'workouts',
            'muscle_log': 'workouts',
            'workout_muscle': 'workouts',
            'splits': 'workouts',
            'split_days': 'workouts',
            'split_day_targets': 'workouts',
            'sleep_log': 'health',
            'health_metrics_log': 'health',
            'users': 'users',
            'access_levels': 'users',
            'units': 'users',
            'activity_levels': 'users',
            'user_goal': 'users',
            'api_usage_log': 'analytics',
            'error_log': 'analytics',
        }
        
        return app_mapping.get(table_name, 'users')
    
    def _get_model_name(self, table_name: str) -> str:
        """
        Convert table name to Django model name.
        
        Args:
            table_name: Database table name
            
        Returns:
            Django model class name
        """
        # Convert snake_case to PascalCase
        parts = table_name.split('_')
        model_name = ''.join(word.capitalize() for word in parts)
        
        # Handle special cases
        special_cases = {
            'MealsFood': 'MealFood',
            'SplitDays': 'SplitDay',
            'SplitDayTargets': 'SplitDayTarget',
        }
        
        return special_cases.get(model_name, model_name)
    
    def _apply_access_control(self, queryset: models.QuerySet, table_name: str) -> models.QuerySet:
        """
        Apply role-based access control to queryset.
        
        Args:
            queryset: Django queryset to filter
            table_name: Name of table being queried
            
        Returns:
            Filtered queryset based on user's access level
        """
        if self.access_level == 'admin':
            # Admin sees everything
            return queryset
        
        # Build filter conditions
        filter_q = Q()
        
        # Check if table has user_id field
        if table_name in self.TABLES_WITH_USER_ID:
            # Users can see their own data
            if self.access_level in ['user', 'guest']:
                filter_q |= Q(user=self.user) | Q(user_id=self.user.user_id)
        
        # Check if table has make_public field
        if table_name in self.TABLES_WITH_PUBLIC_FLAG:
            # Users can see public data, guests cannot
            if self.access_level == 'user':
                filter_q |= Q(make_public=True)
        
        # If no conditions apply and not admin, return empty queryset
        if not filter_q:
            # Check if this is a reference table (no user_id or make_public)
            model = queryset.model
            has_user_field = any(field.name in ['user', 'user_id'] for field in model._meta.get_fields())
            has_public_field = any(field.name == 'make_public' for field in model._meta.get_fields())
            
            if not has_user_field and not has_public_field:
                # Reference table - allow access for users, deny for guests
                if self.access_level == 'guest':
                    return queryset.none()
                return queryset
            
            # Has user/public fields but no matching conditions - deny access
            return queryset.none()
        
        return queryset.filter(filter_q)
    
    def _apply_filters(self, queryset: models.QuerySet, filters: Dict[str, Any]) -> models.QuerySet:
        """
        Apply user-specified filters to queryset with validation.
        
        Args:
            queryset: Django queryset to filter
            filters: Dictionary of field:value pairs
            
        Returns:
            Filtered queryset
            
        Raises:
            ValidationError: If filter field is invalid
        """
        if not filters:
            return queryset
        
        model = queryset.model
        filter_kwargs = {}
        
        for field_name, value in filters.items():
            # Sanitize field name and value
            field_name = self._sanitize_input(field_name)
            value = self._sanitize_input(value)
            
            # Validate field exists
            try:
                field = model._meta.get_field(field_name)
            except FieldDoesNotExist:
                logger.warning(f"Invalid filter field: {field_name}")
                continue
            
            # Handle None/null values
            if value is None or value == '' or value == 'null':
                filter_kwargs[f"{field_name}__isnull"] = True
            # Handle range queries
            elif isinstance(value, dict) and 'min' in value:
                if value.get('min') is not None:
                    filter_kwargs[f"{field_name}__gte"] = value['min']
                if value.get('max') is not None:
                    filter_kwargs[f"{field_name}__lte"] = value['max']
            # Handle contains queries for text fields
            elif isinstance(field, (models.CharField, models.TextField)):
                filter_kwargs[f"{field_name}__icontains"] = value
            # Exact match for other fields
            else:
                filter_kwargs[field_name] = value
        
        try:
            return queryset.filter(**filter_kwargs)
        except (ValueError, ValidationError) as e:
            logger.error(f"Filter validation error: {e}")
            raise ValidationError(f"Invalid filter values: {e}")
    
    def _apply_sorting(self, queryset: models.QuerySet, sort_by: str, 
                      sort_order: str = 'asc') -> models.QuerySet:
        """
        Apply sorting to queryset with validation.
        
        Args:
            queryset: Django queryset to sort
            sort_by: Field name to sort by
            sort_order: Sort direction ('asc' or 'desc')
            
        Returns:
            Sorted queryset
        """
        if not sort_by:
            return queryset
        
        # Sanitize inputs
        sort_by = self._sanitize_input(sort_by)
        sort_order = self._sanitize_input(sort_order).lower()
        
        # Validate sort_order
        if sort_order not in ['asc', 'desc']:
            sort_order = 'asc'
        
        # Validate field exists
        model = queryset.model
        try:
            model._meta.get_field(sort_by)
        except FieldDoesNotExist:
            logger.warning(f"Invalid sort field: {sort_by}")
            return queryset
        
        # Apply sorting
        order_prefix = '-' if sort_order == 'desc' else ''
        return queryset.order_by(f"{order_prefix}{sort_by}")
    
    def _apply_search(self, queryset: models.QuerySet, search_term: str) -> models.QuerySet:
        """
        Apply full-text search across searchable fields.
        
        Args:
            queryset: Django queryset to search
            search_term: Search term to look for
            
        Returns:
            Filtered queryset with search results
        """
        if not search_term:
            return queryset
        
        # Sanitize search term
        search_term = self._sanitize_input(search_term)
        
        if not search_term:
            return queryset
        
        # Get text fields from model
        model = queryset.model
        text_fields = [
            field.name for field in model._meta.get_fields()
            if isinstance(field, (models.CharField, models.TextField))
        ]
        
        # Build search query
        search_q = Q()
        for field_name in text_fields:
            search_q |= Q(**{f"{field_name}__icontains": search_term})
        
        return queryset.filter(search_q) if search_q else queryset
    
    def get_available_tables(self) -> List[Dict[str, Any]]:
        """
        Get list of tables available to current user.
        
        Returns:
            List of dictionaries containing table metadata:
            - name: Table name
            - model: Model class name
            - app: Django app name
            - description: Model docstring
            - field_count: Number of fields
        """
        available_tables = []
        
        # Get all installed apps
        for app_config in apps.get_app_configs():
            if not app_config.name.startswith('apps.'):
                continue
            
            for model in app_config.get_models():
                table_name = model._meta.db_table
                
                # Skip internal tables for non-admin users
                if table_name in self.INTERNAL_TABLES and self.access_level != 'admin':
                    continue
                
                available_tables.append({
                    'name': table_name,
                    'model': model.__name__,
                    'app': app_config.name.split('.')[-1],
                    'description': model.__doc__.strip() if model.__doc__ else '',
                    'field_count': len(model._meta.get_fields()),
                    'has_user_field': table_name in self.TABLES_WITH_USER_ID,
                    'has_public_field': table_name in self.TABLES_WITH_PUBLIC_FLAG,
                })
        
        # Sort by app and name
        available_tables.sort(key=lambda x: (x['app'], x['name']))
        
        self._log_data_access('_meta', {}, True, len(available_tables))
        return available_tables
    
    def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """
        Get detailed schema information for a table.
        
        Args:
            table_name: Name of table to get schema for
            
        Returns:
            Dictionary containing:
            - fields: List of field definitions with types and constraints
            - relationships: Foreign key relationships
            - indexes: Database indexes
            
        Raises:
            ValueError: If table is invalid or access denied
        """
        # Validate table access
        is_valid, error_msg = self._validate_table_name(table_name)
        if not is_valid:
            self._log_data_access(table_name, {}, False, 0, error_msg)
            raise ValueError(error_msg)
        
        try:
            # Get model
            app_name = self._get_app_name(table_name)
            model_name = self._get_model_name(table_name)
            model = apps.get_model(app_name, model_name)
            
            # Build schema
            schema = {
                'table_name': table_name,
                'model_name': model.__name__,
                'app': app_name,
                'description': model.__doc__.strip() if model.__doc__ else '',
                'fields': [],
                'relationships': [],
            }
            
            # Get field information
            for field in model._meta.get_fields():
                field_info = {
                    'name': field.name,
                    'type': field.get_internal_type(),
                    'null': getattr(field, 'null', False),
                    'blank': getattr(field, 'blank', False),
                    'unique': getattr(field, 'unique', False),
                    'primary_key': getattr(field, 'primary_key', False),
                    'max_length': getattr(field, 'max_length', None),
                    'choices': getattr(field, 'choices', None),
                }
                
                # Handle foreign keys
                if isinstance(field, models.ForeignKey):
                    field_info['related_model'] = field.related_model.__name__
                    field_info['related_table'] = field.related_model._meta.db_table
                    schema['relationships'].append({
                        'field': field.name,
                        'related_model': field.related_model.__name__,
                        'related_table': field.related_model._meta.db_table,
                    })
                
                schema['fields'].append(field_info)
            
            self._log_data_access(table_name, {'action': 'schema'}, True, len(schema['fields']))
            return schema
            
        except Exception as e:
            error_msg = f"Failed to get schema for {table_name}: {e}"
            self._log_data_access(table_name, {'action': 'schema'}, False, 0, error_msg)
            raise ValueError(error_msg)
    
    def get_table_data(self, table_name: str, filters: Optional[Dict[str, Any]] = None,
                      sort_by: Optional[str] = None, sort_order: str = 'asc',
                      search: Optional[str] = None, page: int = 1, 
                      page_size: int = 20) -> Dict[str, Any]:
        """
        Get data from a table with filtering, sorting, searching, and pagination.
        
        This is the primary method for data retrieval and should be used by all
        future systems requiring database access.
        
        Args:
            table_name: Name of table to query
            filters: Dictionary of field:value pairs for filtering
            sort_by: Field name to sort by
            sort_order: Sort direction ('asc' or 'desc')
            search: Search term for full-text search
            page: Page number for pagination (1-indexed)
            page_size: Number of results per page
            
        Returns:
            Dictionary containing:
            - data: List of row dictionaries
            - pagination: Pagination metadata (total, pages, current_page, has_next, has_previous)
            - filters_applied: Filters that were applied
            - sort_applied: Sorting that was applied
            
        Raises:
            ValueError: If table is invalid or access denied
            ValidationError: If filter values are invalid
        """
        # Validate table access
        is_valid, error_msg = self._validate_table_name(table_name)
        if not is_valid:
            self._log_data_access(table_name, filters or {}, False, 0, error_msg)
            raise ValueError(error_msg)
        
        try:
            # Get model
            app_name = self._get_app_name(table_name)
            model_name = self._get_model_name(table_name)
            model = apps.get_model(app_name, model_name)
            
            # Start with base queryset
            queryset = model.objects.all()
            
            # Apply access control
            queryset = self._apply_access_control(queryset, table_name)
            
            # Apply filters
            if filters:
                queryset = self._apply_filters(queryset, filters)
            
            # Apply search
            if search:
                queryset = self._apply_search(queryset, search)
            
            # Apply sorting
            if sort_by:
                queryset = self._apply_sorting(queryset, sort_by, sort_order)
            else:
                # Default sorting by primary key
                queryset = queryset.order_by('pk')
            
            # Count total results before pagination
            total_count = queryset.count()
            
            # Apply pagination
            paginator = Paginator(queryset, page_size)
            
            # Validate page number
            if page < 1:
                page = 1
            if page > paginator.num_pages and paginator.num_pages > 0:
                page = paginator.num_pages
            
            page_obj = paginator.get_page(page)
            
            # Serialize data
            data = []
            for obj in page_obj:
                row = {}
                for field in model._meta.get_fields():
                    if field.many_to_many or field.one_to_many:
                        continue  # Skip reverse relations
                    
                    try:
                        value = getattr(obj, field.name, None)
                        
                        # Handle different field types
                        if value is None:
                            row[field.name] = None
                        elif isinstance(field, models.ForeignKey):
                            # Include both ID and string representation
                            row[field.name] = str(value) if value else None
                            row[f"{field.name}_id"] = value.pk if value else None
                        elif isinstance(field, (models.DateField, models.DateTimeField)):
                            row[field.name] = value.isoformat() if value else None
                        elif isinstance(field, models.DecimalField):
                            row[field.name] = float(value) if value else None
                        elif isinstance(field, models.JSONField):
                            row[field.name] = value
                        else:
                            row[field.name] = value
                    except Exception as e:
                        logger.warning(f"Error serializing field {field.name}: {e}")
                        row[field.name] = None
                
                data.append(row)
            
            # Build response
            response = {
                'data': data,
                'pagination': {
                    'total': total_count,
                    'pages': paginator.num_pages,
                    'current_page': page,
                    'page_size': page_size,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous(),
                },
                'filters_applied': filters or {},
                'sort_applied': {
                    'field': sort_by,
                    'order': sort_order
                } if sort_by else None,
                'search_applied': search,
            }
            
            self._log_data_access(table_name, filters or {}, True, len(data))
            return response
            
        except ValidationError as e:
            error_msg = f"Validation error: {e}"
            self._log_data_access(table_name, filters or {}, False, 0, error_msg)
            raise
        except Exception as e:
            error_msg = f"Failed to get data from {table_name}: {e}"
            logger.error(error_msg, exc_info=True)
            self._log_data_access(table_name, filters or {}, False, 0, error_msg)
            raise ValueError(error_msg)

