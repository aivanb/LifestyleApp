"""
Workout Views - Complete rewrite from scratch
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Count, Sum, Avg, Max
from django.utils import timezone
from datetime import datetime, timedelta, date
from .models import (
    Workout, Muscle, WorkoutMuscle, MuscleLog, WorkoutLog, 
    Split, SplitDay, SplitDayTarget
)
from .serializers import (
    WorkoutSerializer, WorkoutCreateSerializer, WorkoutLogSerializer,
    WorkoutLogCreateSerializer, MuscleSerializer, MuscleLogSerializer,
    MuscleLogCreateSerializer, SplitSerializer, SplitCreateSerializer,
    WorkoutStatsSerializer
)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def workout_list_create(request):
    """List user's workouts or create a new workout"""
    if request.method == 'GET':
        workouts = Workout.objects.filter(user=request.user).order_by('-created_at')
        
        # Apply filters
        search = request.GET.get('search', '')
        muscle_group = request.GET.get('muscle_group', '')
        equipment_type = request.GET.get('equipment_type', '')
        
        if search:
            workouts = workouts.filter(workout_name__icontains=search)
        if muscle_group:
            workouts = workouts.filter(workoutmuscle__muscle__muscle_group=muscle_group).distinct()
        if equipment_type:
            workouts = workouts.filter(type=equipment_type)
        
        serializer = WorkoutSerializer(workouts, many=True, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'POST':
        serializer = WorkoutCreateSerializer(data=request.data)
        if serializer.is_valid():
            workout = serializer.save(user=request.user)
            response_serializer = WorkoutSerializer(workout, context={'request': request})
            return Response({
                'success': True,
                'data': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def workout_detail(request, workout_id):
    """Get, update, or delete a specific workout"""
    try:
        workout = Workout.objects.get(workouts_id=workout_id, user=request.user)
    except Workout.DoesNotExist:
        return Response({
            'success': False,
            'error': {'message': 'Workout not found'}
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = WorkoutSerializer(workout, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'PUT':
        serializer = WorkoutCreateSerializer(workout, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_serializer = WorkoutSerializer(workout, context={'request': request})
            return Response({
                'success': True,
                'data': response_serializer.data
            })
        return Response({
            'success': False,
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        workout.delete()
        return Response({
            'success': True,
            'message': 'Workout deleted successfully'
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def muscle_list(request):
    """Get all muscles"""
    muscles = Muscle.objects.all().order_by('muscle_group', 'muscle_name')
    serializer = MuscleSerializer(muscles, many=True)
    return Response({
        'success': True,
        'data': serializer.data
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def muscle_priorities(request):
    """Get or update muscle priorities"""
    if request.method == 'GET':
        # Check if user has any muscle logs, if not create default ones
        muscle_logs = MuscleLog.objects.filter(user=request.user)
        if not muscle_logs.exists():
            # Create default muscle logs for all muscles
            muscles = Muscle.objects.all()
            for muscle in muscles:
                MuscleLog.objects.get_or_create(
                    user=request.user,
                    muscle_name=muscle,
                    defaults={'priority': 80}
                )
            muscle_logs = MuscleLog.objects.filter(user=request.user)
        
        muscle_logs = muscle_logs.order_by('muscle_name__muscle_group', 'muscle_name__muscle_name')
        serializer = MuscleLogSerializer(muscle_logs, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'POST':
        muscle_logs_data = request.data.get('muscle_logs', [])
        
        updated_logs = []
        for log_data in muscle_logs_data:
            muscle = Muscle.objects.get(muscles_id=log_data['muscle_name'])
            muscle_log, created = MuscleLog.objects.update_or_create(
                user=request.user,
                muscle_name=muscle,
                defaults={'priority': log_data['priority']}
            )
            updated_logs.append(muscle_log)
        
        serializer = MuscleLogSerializer(updated_logs, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def workout_logs(request):
    """Get or create workout logs"""
    if request.method == 'GET':
        logs = WorkoutLog.objects.filter(user=request.user).order_by('-date_time')
        
        # Apply filters
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        workout_id = request.GET.get('workout_id')
        limit = request.GET.get('limit')
        
        if date_from:
            logs = logs.filter(date_time__date__gte=date_from)
        if date_to:
            logs = logs.filter(date_time__date__lte=date_to)
        if workout_id:
            logs = logs.filter(workout_id=workout_id)
        if limit:
            logs = logs[:int(limit)]
        
        serializer = WorkoutLogSerializer(logs, many=True, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'POST':
        serializer = WorkoutLogCreateSerializer(data=request.data)
        if serializer.is_valid():
            log = serializer.save(user=request.user)
            response_serializer = WorkoutLogSerializer(log, context={'request': request})
            return Response({
                'success': True,
                'data': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def splits(request):
    """Get or create workout splits"""
    if request.method == 'GET':
        user_splits = Split.objects.filter(user=request.user).order_by('-created_at')
        serializer = SplitSerializer(user_splits, many=True, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'POST':
        serializer = SplitCreateSerializer(data=request.data)
        if serializer.is_valid():
            split = serializer.save(user=request.user)
            response_serializer = SplitSerializer(split, context={'request': request})
            return Response({
                'success': True,
                'data': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def split_detail(request, split_id):
    """Get, update, or delete a specific split"""
    try:
        split = Split.objects.get(splits_id=split_id, user=request.user)
    except Split.DoesNotExist:
        return Response({
            'success': False,
            'error': {'message': 'Split not found'}
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = SplitSerializer(split, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'PUT':
        serializer = SplitCreateSerializer(split, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_serializer = SplitSerializer(split, context={'request': request})
            return Response({
                'success': True,
                'data': response_serializer.data
            })
        return Response({
            'success': False,
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        split.delete()
        return Response({
            'success': True,
            'message': 'Split deleted successfully'
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def split_activate(request, split_id):
    """Activate a split with start date"""
    try:
        split = Split.objects.get(splits_id=split_id, user=request.user)
    except Split.DoesNotExist:
        return Response({
            'success': False,
            'error': {'message': 'Split not found'}
        }, status=status.HTTP_404_NOT_FOUND)
    
    start_date = request.data.get('start_date')
    if not start_date:
        return Response({
            'success': False,
            'error': {'message': 'Start date is required'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Ensure start_date is a string
    if isinstance(start_date, dict):
        start_date = start_date.get('start_date', '')
    
    if not start_date:
        return Response({
            'success': False,
            'error': {'message': 'Start date is required'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Deactivate all other splits (remove this since is_active doesn't exist)
    # Split.objects.filter(user=request.user, is_active=True).update(is_active=False)
    
    # Activate this split
    split.start_date = start_date
    # split.is_active = True  # Remove this line
    split.save()
    
    return Response({
        'success': True,
        'message': 'Split activated successfully'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_split_day(request):
    """Get the current split day based on active split and date"""
    date_str = request.GET.get('date')
    if not date_str:
        return Response({
            'success': False,
            'error': {'message': 'Date parameter is required'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({
            'success': False,
            'error': {'message': 'Invalid date format'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get active split
    try:
        active_split = Split.objects.filter(
            user=request.user,
            start_date__lte=target_date
        ).order_by('-start_date').first()
        
        if not active_split:
            return Response({
                'success': True,
                'data': {
                    'active_split': None,
                    'current_split_day': None
                }
            })
        
        # Calculate current split day
        days_since_start = (target_date - active_split.start_date).days
        split_days = active_split.splitday_set.all().order_by('day_order')
        
        if not split_days.exists():
            return Response({
                'success': True,
                'data': {
                    'active_split': SplitSerializer(active_split, context={'request': request}).data,
                    'current_split_day': None
                }
            })
        
        current_day_index = days_since_start % split_days.count()
        current_split_day = split_days[current_day_index]
        
        # Get targets for this day
        targets = SplitDayTarget.objects.filter(split_day=current_split_day)
        targets_data = []
        for target in targets:
            targets_data.append({
                'muscle': target.muscle.muscles_id,
                'muscle_name': target.muscle.muscle_name,
                'target_activation': target.target_activation
            })
        
        current_split_day_data = {
            'split_days_id': current_split_day.split_days_id,
            'day_name': current_split_day.day_name,
            'day_order': current_split_day.day_order,
            'targets': targets_data
        }
        
        return Response({
            'success': True,
            'data': {
                'active_split': SplitSerializer(active_split, context={'request': request}).data,
                'current_split_day': current_split_day_data
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': {'message': str(e)}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workout_stats(request):
    """Get workout statistics for the user"""
    user = request.user
    
    # Get workout logs for stats calculation
    workout_logs = WorkoutLog.objects.filter(user=user)
    
    # Calculate stats from workout logs
    total_sets = workout_logs.count()
    total_weight_lifted = workout_logs.aggregate(
        total=Sum('weight')
    )['total'] or 0
    total_reps = workout_logs.aggregate(
        total=Sum('reps')
    )['total'] or 0
    total_rir = workout_logs.aggregate(
        total=Sum('rir')
    )['total'] or 0
    
    # Basic stats
    total_workouts = Workout.objects.filter(user=user).count()
    total_muscles = MuscleLog.objects.filter(user=user).count()
    
    # Recent workouts
    recent_workouts = Workout.objects.filter(user=user).order_by('-created_at')[:5]
    recent_serializer = WorkoutSerializer(recent_workouts, many=True, context={'request': request})
    
    # Muscle group stats
    muscle_group_stats = {}
    muscle_logs = MuscleLog.objects.filter(user=user)
    for log in muscle_logs:
        group = log.muscle_name.muscle_group
        if group not in muscle_group_stats:
            muscle_group_stats[group] = {'count': 0, 'avg_priority': 0}
        muscle_group_stats[group]['count'] += 1
        muscle_group_stats[group]['avg_priority'] += log.priority
    
    # Calculate averages
    for group in muscle_group_stats:
        if muscle_group_stats[group]['count'] > 0:
            muscle_group_stats[group]['avg_priority'] /= muscle_group_stats[group]['count']
    
    # Equipment stats
    equipment_stats = Workout.objects.filter(user=user).values('type').annotate(count=Count('type'))
    equipment_stats = {item['type']: item['count'] for item in equipment_stats}
    
    stats_data = {
        'total_sets': total_sets,
        'total_weight_lifted': total_weight_lifted,
        'total_reps': total_reps,
        'total_rir': total_rir,
        'total_workouts': total_workouts,
        'total_muscles': total_muscles,
        'recent_workouts': recent_serializer.data,
        'muscle_group_stats': muscle_group_stats,
        'equipment_stats': equipment_stats
    }
    
    serializer = WorkoutStatsSerializer(stats_data)
    return Response({
        'success': True,
        'data': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recently_logged_workouts(request):
    """Get recently logged workouts for quick add functionality"""
    # Get workouts logged in the last 30 days
    thirty_days_ago = timezone.now() - timedelta(days=30)
    
    recent_logs = WorkoutLog.objects.filter(
        user=request.user,
        date_time__gte=thirty_days_ago
    ).values('workout').annotate(
        last_logged=Max('date_time'),
        last_weight=Max('weight'),
        last_reps=Max('reps'),
        last_rir=Max('rir'),
        log_count=Count('workout_log_id')
    ).order_by('-last_logged')[:10]
    
    # Get workout details
    workout_ids = [log['workout'] for log in recent_logs]
    workouts = Workout.objects.filter(workouts_id__in=workout_ids)
    workout_dict = {w.workouts_id: w for w in workouts}
    
    # Combine data
    result = []
    for log in recent_logs:
        workout = workout_dict[log['workout']]
        result.append({
            'workout_id': workout.workouts_id,
            'workout_name': workout.workout_name,
            'last_logged': log['last_logged'],
            'last_weight': log['last_weight'],
            'last_reps': log['last_reps'],
            'last_rir': log['last_rir'],
            'log_count': log['log_count']
        })
    
    return Response({
        'success': True,
        'data': result
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workout_icons(request):
    """Get available workout icons"""
    icons = [
        '⚡', '🔥', '💎', '🌟', '⭐', '✨', '💫',
        '🎨', '🎭', '🎪', '🎯', '🎲', '🎳',
        '🔮', '💧', '🌊', '❄️', '🌈', '☀️', '🌙',
        '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔴',
        '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫',
        '⚪', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪',
        '🟫', '⬛', '⬜'
    ]
    
    return Response({
        'success': True,
        'data': icons
    })
