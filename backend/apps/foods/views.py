"""
Food Logging API Views

Provides endpoints for:
- Creating and managing food entries
- Creating and managing meals
- Logging food consumption
- Viewing food logs with filtering
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from datetime import datetime, timedelta
from .models import Food, Meal, MealFood
from apps.logging.models import FoodLog
from .serializers import (
    FoodSerializer,
    FoodCreateSerializer,
    MealSerializer,
    MealCreateSerializer,
    FoodLogSerializer,
    FoodLogCreateSerializer
)
import logging

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def food_list_create(request):
    """
    GET: List foods accessible to user (own foods + public foods)
    POST: Create new food entry
    """
    if request.method == 'GET':
        # Get search and filter parameters
        search = request.GET.get('search', '')
        food_group = request.GET.get('food_group', '')
        min_calories = request.GET.get('min_calories')
        max_calories = request.GET.get('max_calories')
        min_protein = request.GET.get('min_protein')
        max_protein = request.GET.get('max_protein')
        
        # Base queryset: all public foods (foods don't have user_id, they're shared)
        # In future, if user-specific foods needed, add user foreign key to Food model
        queryset = Food.objects.filter(make_public=True)
        
        # Apply search
        if search:
            queryset = queryset.filter(
                Q(food_name__icontains=search) |
                Q(brand__icontains=search)
            )
        
        # Apply filters
        if food_group:
            queryset = queryset.filter(food_group=food_group)
        
        if min_calories:
            queryset = queryset.filter(calories__gte=min_calories)
        if max_calories:
            queryset = queryset.filter(calories__lte=max_calories)
        
        if min_protein:
            queryset = queryset.filter(protein__gte=min_protein)
        if max_protein:
            queryset = queryset.filter(protein__lte=max_protein)
        
        # Order by name
        queryset = queryset.order_by('food_name')
        
        # Paginate
        page_size = int(request.GET.get('page_size', 20))
        page = int(request.GET.get('page', 1))
        
        start = (page - 1) * page_size
        end = start + page_size
        
        total = queryset.count()
        foods = queryset[start:end]
        
        serializer = FoodSerializer(foods, many=True)
        
        return Response({
            'data': {
                'foods': serializer.data,
                'pagination': {
                    'total': total,
                    'page': page,
                    'page_size': page_size,
                    'pages': (total + page_size - 1) // page_size
                }
            }
        })
    
    elif request.method == 'POST':
        serializer = FoodCreateSerializer(data=request.data, context={'user': request.user})
        
        if serializer.is_valid():
            food = serializer.save()
            return Response({
                'data': FoodSerializer(food).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def food_detail(request, food_id):
    """
    GET: Retrieve food details
    PUT: Update food (owner only)
    DELETE: Delete food (owner only)
    """
    try:
        food = Food.objects.get(food_id=food_id)
        
        # Check access: public foods only for now
        # Note: Foods don't have user_id field - they're shared database
        if not food.make_public:
            return Response({
                'error': {'message': 'Access denied - food is not public'}
            }, status=status.HTTP_403_FORBIDDEN)
        
    except Food.DoesNotExist:
        return Response({
            'error': {'message': 'Food not found'}
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = FoodSerializer(food)
        return Response({
            'data': serializer.data
        })
    
    elif request.method == 'PUT':
        # Food updates allowed (no owner concept for shared food database)
        # In future, could add user field and restrict updates
        
        serializer = FoodSerializer(food, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'data': serializer.data
            })
        
        return Response({
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Food deletions allowed (no owner concept for shared food database)
        # In future, could add user field and restrict deletions
        food.delete()
        return Response({
            'data': {'message': 'Food deleted successfully'}
        })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def meal_list_create(request):
    """
    GET: List user's meals
    POST: Create new meal
    """
    if request.method == 'GET':
        meals = Meal.objects.filter(user=request.user).order_by('-created_at')
        serializer = MealSerializer(meals, many=True)
        
        return Response({
            'data': {
                'meals': serializer.data
            }
        })
    
    elif request.method == 'POST':
        serializer = MealCreateSerializer(data=request.data, context={'user': request.user})
        
        if serializer.is_valid():
            meal = serializer.save()
            return Response({
                'data': MealSerializer(meal).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def meal_detail(request, meal_id):
    """
    GET: Retrieve meal details
    DELETE: Delete meal (owner only)
    """
    try:
        meal = Meal.objects.get(meal_id=meal_id, user=request.user)
    except Meal.DoesNotExist:
        return Response({
            'error': {'message': 'Meal not found'}
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = MealSerializer(meal)
        return Response({
            'data': serializer.data
        })
    
    elif request.method == 'DELETE':
        meal.delete()
        return Response({
            'data': {'message': 'Meal deleted successfully'}
        })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def food_log_list_create(request):
    """
    GET: List user's food logs with filtering
    POST: Create new food log entry
    """
    if request.method == 'GET':
        # Get filter parameters
        search = request.GET.get('search', '')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        meal_id = request.GET.get('meal_id')
        recent_days = request.GET.get('recent_days', 7)  # Default to last 7 days
        
        # Base queryset: user's logs only
        queryset = FoodLog.objects.filter(user=request.user)
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(food__food_name__icontains=search) |
                Q(meal__meal_name__icontains=search)
            )
        
        if start_date:
            queryset = queryset.filter(date_time__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(date_time__lte=end_date)
        
        if meal_id:
            queryset = queryset.filter(meal_id=meal_id)
        
        # Default filter: recent logs
        if not start_date and not end_date:
            recent_cutoff = datetime.now() - timedelta(days=int(recent_days))
            queryset = queryset.filter(date_time__gte=recent_cutoff)
        
        # Order by most recent first
        queryset = queryset.order_by('-date_time')
        
        # Paginate
        page_size = int(request.GET.get('page_size', 20))
        page = int(request.GET.get('page', 1))
        
        start = (page - 1) * page_size
        end = start + page_size
        
        total = queryset.count()
        logs = queryset[start:end]
        
        serializer = FoodLogSerializer(logs, many=True)
        
        return Response({
            'data': {
                'logs': serializer.data,
                'pagination': {
                    'total': total,
                    'page': page,
                    'page_size': page_size,
                    'pages': (total + page_size - 1) // page_size
                }
            }
        })
    
    elif request.method == 'POST':
        serializer = FoodLogCreateSerializer(data=request.data, context={'user': request.user})
        
        if serializer.is_valid():
            log = serializer.save()
            return Response({
                'data': FoodLogSerializer(log).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def food_log_delete(request, log_id):
    """Delete food log entry (owner only)"""
    try:
        log = FoodLog.objects.get(macro_log_id=log_id, user=request.user)
    except FoodLog.DoesNotExist:
        return Response({
            'error': {'message': 'Food log not found'}
        }, status=status.HTTP_404_NOT_FOUND)
    
    log.delete()
    return Response({
        'data': {'message': 'Food log deleted successfully'}
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recently_logged_foods(request):
    """Get list of recently logged foods for quick logging"""
    days = int(request.GET.get('days', 30))
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # Get unique foods from recent logs
    recent_logs = FoodLog.objects.filter(
        user=request.user,
        date_time__gte=cutoff_date
    ).select_related('food').order_by('-date_time')
    
    # Get unique foods (most recent first)
    seen_foods = set()
    unique_foods = []
    
    for log in recent_logs:
        if log.food_id not in seen_foods:
            seen_foods.add(log.food_id)
            unique_foods.append(log.food)
            
            if len(unique_foods) >= 20:  # Limit to 20 most recent
                break
    
    serializer = FoodSerializer(unique_foods, many=True)
    
    return Response({
        'data': {
            'foods': serializer.data
        }
    })
