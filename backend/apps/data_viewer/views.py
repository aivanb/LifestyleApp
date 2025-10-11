"""
Data Viewer API Endpoints

Provides RESTful API endpoints for database viewing with comprehensive
access control, filtering, sorting, and searching capabilities.

These endpoints serve as the foundation for all future data access needs
and should be the standard pattern for implementing data retrieval APIs.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from .services import DataAccessService
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_tables(request):
    """
    Get list of tables available to current user.
    
    Access Control:
    - admin: All tables including internal Django tables
    - user: All user-accessible tables (no internal tables)
    - guest: Same as user
    
    Returns:
        200: List of available tables with metadata
        401: Unauthorized
        500: Server error
    """
    try:
        service = DataAccessService(user=request.user)
        tables = service.get_available_tables()
        
        return Response({
            'data': {
                'tables': tables,
                'access_level': service.access_level,
                'total_count': len(tables)
            }
        })
    except ValueError as e:
        return Response({
            'error': {'message': str(e)}
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Error getting available tables: {e}", exc_info=True)
        return Response({
            'error': {'message': 'Failed to retrieve table list'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_table_schema(request, table_name):
    """
    Get detailed schema information for a specific table.
    
    Args:
        table_name: Name of table to get schema for
    
    Access Control:
    - admin: All tables
    - user/guest: Only accessible tables (no internal)
    
    Returns:
        200: Table schema with field definitions
        400: Invalid table name
        401: Unauthorized/access denied
        500: Server error
    """
    try:
        service = DataAccessService(user=request.user)
        schema = service.get_table_schema(table_name)
        
        return Response({
            'data': schema
        })
    except ValueError as e:
        return Response({
            'error': {'message': str(e)}
        }, status=status.HTTP_400_BAD_REQUEST if 'does not exist' in str(e) else status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Error getting table schema for {table_name}: {e}", exc_info=True)
        return Response({
            'error': {'message': 'Failed to retrieve table schema'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_table_data(request, table_name):
    """
    Get data from a table with filtering, sorting, searching, and pagination.
    
    This is the primary data retrieval endpoint and should be used as the
    foundation for all future data access patterns.
    
    Args:
        table_name: Name of table to query
    
    Request Body:
        {
            "filters": {
                "field_name": "value",           // Exact match or contains
                "numeric_field": {               // Range query
                    "min": 0,
                    "max": 100
                }
            },
            "sort_by": "field_name",             // Field to sort by
            "sort_order": "asc",                 // 'asc' or 'desc'
            "search": "search term",             // Full-text search
            "page": 1,                           // Page number (1-indexed)
            "page_size": 20                      // Results per page
        }
    
    Access Control:
    - admin: All data from all tables
    - user: Own data + public data (tables with make_public=True)
    - guest: Public data only (no make_public field access)
    
    Returns:
        200: Table data with pagination metadata
        400: Invalid parameters or validation error
        401: Unauthorized/access denied
        500: Server error
    
    Example Usage:
        POST /api/data-viewer/tables/foods/data
        {
            "filters": {"food_group": "protein"},
            "sort_by": "food_name",
            "sort_order": "asc",
            "search": "chicken",
            "page": 1,
            "page_size": 20
        }
    """
    try:
        # Parse request body
        filters = request.data.get('filters', {})
        sort_by = request.data.get('sort_by')
        sort_order = request.data.get('sort_order', 'asc')
        search = request.data.get('search')
        page = request.data.get('page', 1)
        page_size = request.data.get('page_size', 20)
        
        # Validate pagination parameters
        try:
            page = int(page)
            page_size = int(page_size)
        except (ValueError, TypeError):
            return Response({
                'error': {'message': 'Invalid pagination parameters'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Limit page size to prevent abuse
        if page_size > 100:
            page_size = 100
        if page_size < 1:
            page_size = 20
        
        # Get data through service
        service = DataAccessService(user=request.user)
        result = service.get_table_data(
            table_name=table_name,
            filters=filters,
            sort_by=sort_by,
            sort_order=sort_order,
            search=search,
            page=page,
            page_size=page_size
        )
        
        return Response({
            'data': result
        })
        
    except ValueError as e:
        error_msg = str(e)
        status_code = status.HTTP_400_BAD_REQUEST if 'does not exist' in error_msg else status.HTTP_401_UNAUTHORIZED
        return Response({
            'error': {'message': error_msg}
        }, status=status_code)
    except ValidationError as e:
        return Response({
            'error': {'message': str(e)}
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error getting table data for {table_name}: {e}", exc_info=True)
        return Response({
            'error': {'message': 'Failed to retrieve table data'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_table_row_count(request, table_name):
    """
    Get total row count for a table (respecting access control).
    
    Args:
        table_name: Name of table to count rows for
    
    Query Parameters:
        filters: URL-encoded JSON filter object (optional)
    
    Access Control:
    - Respects same access control rules as get_table_data
    
    Returns:
        200: Row count
        400: Invalid table name
        401: Unauthorized/access denied
        500: Server error
    """
    try:
        import json
        
        # Parse filters from query params if provided
        filters_json = request.GET.get('filters')
        filters = json.loads(filters_json) if filters_json else {}
        
        service = DataAccessService(user=request.user)
        result = service.get_table_data(
            table_name=table_name,
            filters=filters,
            page=1,
            page_size=1  # We only need the count, not the data
        )
        
        return Response({
            'data': {
                'table_name': table_name,
                'total_rows': result['pagination']['total'],
                'filters_applied': result['filters_applied']
            }
        })
        
    except ValueError as e:
        error_msg = str(e)
        status_code = status.HTTP_400_BAD_REQUEST if 'does not exist' in error_msg else status.HTTP_401_UNAUTHORIZED
        return Response({
            'error': {'message': error_msg}
        }, status=status_code)
    except Exception as e:
        logger.error(f"Error getting row count for {table_name}: {e}", exc_info=True)
        return Response({
            'error': {'message': 'Failed to retrieve row count'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

