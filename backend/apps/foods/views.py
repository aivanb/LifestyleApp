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
from django.db.models import Q, Count
from django.db.models.functions import TruncDate, ExtractHour
from django.utils import timezone
from datetime import timedelta
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
        
        # Base queryset: public foods + foods the user has logged
        # Get foods user has logged
        user_logged_food_ids = FoodLog.objects.filter(user=request.user).values_list('food_id', flat=True).distinct()
        # Combine with public foods
        queryset = Food.objects.filter(
            Q(make_public=True) | Q(food_id__in=user_logged_food_ids)
        )
        
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
        
        # Check access: public foods or foods the user has logged
        # Note: Foods don't have user_id field - they're shared database
        user_has_logged = FoodLog.objects.filter(user=request.user, food_id=food_id).exists()
        if not food.make_public and not user_has_logged:
            return Response({
                'error': {'message': 'Access denied - food is not public and you have not logged this food'}
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def food_analytics(request, food_id):
    """
    GET: Get analytics data for a specific food
    Returns:
    - Stats: times_logged, time_since_last_logged, last_updated, is_public
    - Frequency data: count of logs per day for the selected time range
    - Time of day data: count of logs per hour (0-23)
    """
    try:
        food = Food.objects.get(food_id=food_id)
    except Food.DoesNotExist:
        return Response({
            'error': {'message': 'Food not found'}
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get time range parameter
    time_range = request.GET.get('time_range', '1week')
    
    # Calculate date range based on time_range
    now = timezone.now()
    if time_range == '1week':
        start_date = now - timedelta(days=7)
    elif time_range == '1month':
        start_date = now - timedelta(days=30)
    elif time_range == '6months':
        start_date = now - timedelta(days=180)
    elif time_range == '1year':
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=7)  # Default to 1 week
    
    # Get all food logs for this food for this user
    food_logs = FoodLog.objects.filter(
        user=request.user,
        food_id=food_id
    )
    
    # Calculate stats
    times_logged = food_logs.count()
    
    # Get last logged date
    last_log = food_logs.order_by('-date_time').first()
    if last_log:
        time_since_last = timezone.now() - last_log.date_time
        if time_since_last.days > 0:
            time_since_last_logged = f"{time_since_last.days} days ago"
        elif time_since_last.seconds > 3600:
            time_since_last_logged = f"{time_since_last.seconds // 3600} hours ago"
        else:
            time_since_last_logged = f"{time_since_last.seconds // 60} minutes ago"
        last_logged_date = last_log.date_time.isoformat()
    else:
        time_since_last_logged = "Never"
        last_logged_date = None
    
    # Get frequency data (logs per day)
    frequency_logs = food_logs.filter(date_time__gte=start_date)
    frequency_data = frequency_logs.annotate(
        date=TruncDate('date_time')
    ).values('date').annotate(
        count=Count('macro_log_id')
    ).order_by('date')
    
    frequency_list = []
    # Fill in missing dates with 0
    current_date = start_date.date()
    end_date = now.date()
    date_index = 0
    
    while current_date <= end_date:
        if date_index < len(frequency_data) and frequency_data[date_index]['date'] == current_date:
            frequency_list.append({
                'date': current_date.isoformat(),
                'count': frequency_data[date_index]['count']
            })
            date_index += 1
        else:
            frequency_list.append({
                'date': current_date.isoformat(),
                'count': 0
            })
        current_date += timedelta(days=1)
    
    # Get time of day data (logs per hour, 0-23)
    time_of_day_data = food_logs.annotate(
        hour=ExtractHour('date_time')
    ).values('hour').annotate(
        count=Count('macro_log_id')
    ).order_by('hour')
    
    time_of_day_list = []
    for hour_data in time_of_day_data:
        time_of_day_list.append({
            'hour': hour_data['hour'],
            'count': hour_data['count']
        })
    
    # Fill in missing hours with 0
    for hour in range(24):
        if not any(d['hour'] == hour for d in time_of_day_list):
            time_of_day_list.append({'hour': hour, 'count': 0})
    
    time_of_day_list.sort(key=lambda x: x['hour'])
    
    return Response({
        'data': {
            'stats': {
                'times_logged': times_logged,
                'time_since_last_logged': time_since_last_logged,
                'last_logged_date': last_logged_date,
                'last_updated': food.updated_at.isoformat() if hasattr(food, 'updated_at') and food.updated_at else None,
                'is_public': food.make_public
            },
            'frequencyData': frequency_list,
            'timeOfDayData': time_of_day_list
        }
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
            recent_cutoff = timezone.now() - timedelta(days=int(recent_days))
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


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def food_log_update_delete(request, log_id):
    """Update or delete food log entry (owner only)"""
    try:
        log = FoodLog.objects.get(macro_log_id=log_id, user=request.user)
    except FoodLog.DoesNotExist:
        return Response({
            'error': {'message': 'Food log not found'}
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT' or request.method == 'PATCH':
        serializer = FoodLogSerializer(log, data=request.data, partial=(request.method == 'PATCH'))
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'data': serializer.data
            })
        
        return Response({
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        log.delete()
        return Response({
            'data': {'message': 'Food log deleted successfully'}
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recently_logged_foods(request):
    """Get list of recently logged foods for quick logging"""
    days = int(request.GET.get('days', 30))
    cutoff_date = timezone.now() - timedelta(days=days)
    
    # Get unique foods from recent logs with count
    recent_logs = FoodLog.objects.filter(
        user=request.user,
        date_time__gte=cutoff_date
    ).select_related('food').order_by('-date_time')
    
    # Get unique foods (most recent first) with log count
    seen_foods = {}
    
    for log in recent_logs:
        if log.food_id not in seen_foods:
            seen_foods[log.food_id] = {
                'food': log.food,
                'log_count': 1,
                'last_logged': log.date_time
            }
        else:
            seen_foods[log.food_id]['log_count'] += 1
    
    # Sort by most recent first and add log_count to food object
    unique_foods = []
    for log in recent_logs:
        if log.food_id in seen_foods and seen_foods[log.food_id]['food'] not in unique_foods:
            food = seen_foods[log.food_id]['food']
            # Add log_count as a temporary attribute for serialization
            food.log_count = seen_foods[log.food_id]['log_count']
            food.frequency = seen_foods[log.food_id]['log_count']  # Alias for compatibility
            unique_foods.append(food)
            
            if len(unique_foods) >= 20:  # Limit to 20 most recent
                break
    
    serializer = FoodSerializer(unique_foods, many=True)
    
    # Add log_count to serialized data
    serialized_data = serializer.data
    for i, food_data in enumerate(serialized_data):
        food_data['log_count'] = seen_foods[unique_foods[i].food_id]['log_count']
        food_data['frequency'] = seen_foods[unique_foods[i].food_id]['log_count']
    
    return Response({
        'data': {
            'foods': serialized_data
        }
    })
