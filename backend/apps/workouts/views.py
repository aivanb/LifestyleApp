"""
Views for workouts app.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from collections import defaultdict

from .models import (
    Workout, Muscle, WorkoutLog, MuscleLog, WorkoutMuscle,
    Split, SplitDay, SplitDayTarget
)
from .serializers import (
    WorkoutSerializer, WorkoutCreateSerializer, WorkoutLogSerializer,
    WorkoutLogCreateSerializer, MuscleSerializer, MuscleLogSerializer,
    MuscleLogCreateSerializer, SplitSerializer, SplitCreateSerializer,
    SplitAnalysisSerializer, WorkoutStatsSerializer, RecentlyLoggedWorkoutSerializer
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
            workouts = workouts.filter(workout_muscle__muscle__muscle_group=muscle_group).distinct()
        if equipment_type:
            workouts = workouts.filter(type=equipment_type)
        
        serializer = WorkoutSerializer(workouts, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'POST':
        serializer = WorkoutCreateSerializer(data=request.data)
        if serializer.is_valid():
            workout = serializer.save(user=request.user)
            response_serializer = WorkoutSerializer(workout)
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
def workout_retrieve_update_destroy(request, workout_id):
    """Retrieve, update, or delete a specific workout"""
    try:
        workout = Workout.objects.get(workouts_id=workout_id, user=request.user)
    except Workout.DoesNotExist:
        return Response({
            'success': False,
            'error': {'message': 'Workout not found'}
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = WorkoutSerializer(workout)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'PUT':
        serializer = WorkoutCreateSerializer(workout, data=request.data)
        if serializer.is_valid():
            workout = serializer.save()
            response_serializer = WorkoutSerializer(workout)
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
    """List all available muscles grouped by muscle group"""
    muscles = Muscle.objects.all().order_by('muscle_group', 'muscle_name')
    
    # Group muscles by muscle group
    muscle_groups = defaultdict(list)
    for muscle in muscles:
        muscle_groups[muscle.muscle_group].append({
            'muscles_id': muscle.muscles_id,
            'muscle_name': muscle.muscle_name,
            'muscle_group': muscle.muscle_group
        })
    
    return Response({
        'success': True,
        'data': dict(muscle_groups)
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def muscle_priorities(request):
    """Get or update user's muscle priorities"""
    if request.method == 'GET':
        muscle_logs = MuscleLog.objects.filter(user=request.user)
        serializer = MuscleLogSerializer(muscle_logs, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'POST':
        muscle_logs_data = request.data.get('muscle_logs', [])
        
        # Update or create muscle priorities
        for muscle_data in muscle_logs_data:
            muscle_log, created = MuscleLog.objects.update_or_create(
                user=request.user,
                muscle_name_id=muscle_data['muscle_name'],
                defaults={'importance': muscle_data['importance']}
            )
        
        # Return updated muscle priorities
        muscle_logs = MuscleLog.objects.filter(user=request.user)
        serializer = MuscleLogSerializer(muscle_logs, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Muscle priorities updated successfully'
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
        
        if date_from:
            logs = logs.filter(date_time__date__gte=date_from)
        if date_to:
            logs = logs.filter(date_time__date__lte=date_to)
        if workout_id:
            logs = logs.filter(workout_id=workout_id)
        
        serializer = WorkoutLogSerializer(logs, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'POST':
        serializer = WorkoutLogCreateSerializer(data=request.data)
        if serializer.is_valid():
            log = serializer.save(user=request.user)
            response_serializer = WorkoutLogSerializer(log)
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
        serializer = SplitSerializer(user_splits, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'POST':
        serializer = SplitCreateSerializer(data=request.data)
        if serializer.is_valid():
            split = serializer.save(user=request.user)
            response_serializer = SplitSerializer(split)
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
        serializer = SplitSerializer(split)
        
        # Calculate split analysis
        analysis = calculate_split_analysis(split, request.user)
        
        return Response({
            'success': True,
            'data': {
                'split': serializer.data,
                'analysis': analysis
            }
        })
    
    elif request.method == 'PUT':
        serializer = SplitCreateSerializer(split, data=request.data)
        if serializer.is_valid():
            split = serializer.save()
            response_serializer = SplitSerializer(split)
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
    """Activate a split with a start date"""
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
    
    split.start_date = start_date
    split.save()
    
    return Response({
        'success': True,
        'message': 'Split activated successfully',
        'data': {'start_date': start_date}
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workout_stats(request):
    """Get workout statistics for the user"""
    user = request.user
    
    # Basic stats
    total_workouts = Workout.objects.filter(user=user).count()
    total_muscles = MuscleLog.objects.filter(user=user).count()
    
    # Recent workouts
    recent_workouts = Workout.objects.filter(user=user).order_by('-created_at')[:5]
    recent_serializer = WorkoutSerializer(recent_workouts, many=True)
    
    # Muscle group stats
    muscle_group_stats = {}
    muscle_logs = MuscleLog.objects.filter(user=user)
    for log in muscle_logs:
        group = log.muscle_name.muscle_group
        if group not in muscle_group_stats:
            muscle_group_stats[group] = {'count': 0, 'avg_priority': 0}
        muscle_group_stats[group]['count'] += 1
        muscle_group_stats[group]['avg_priority'] += log.importance
    
    # Calculate averages
    for group in muscle_group_stats:
        if muscle_group_stats[group]['count'] > 0:
            muscle_group_stats[group]['avg_priority'] /= muscle_group_stats[group]['count']
    
    # Equipment stats
    equipment_stats = Workout.objects.filter(user=user).values('type').annotate(count=Count('type'))
    equipment_stats = {item['type']: item['count'] for item in equipment_stats}
    
    stats_data = {
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
    
    serializer = RecentlyLoggedWorkoutSerializer(result, many=True)
    return Response({
        'success': True,
        'data': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workout_icons(request):
    """Get available workout icons"""
    icons = [
        '💪', '🏋️', '🏋️‍♂️', '🏋️‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️',
        '🏃', '🏃‍♂️', '🏃‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️',
        '🏊', '🏊‍♂️', '🏊‍♀️', '🧘', '🧘‍♂️', '🧘‍♀️',
        '🤾', '🤾‍♂️', '🤾‍♀️', '🏌️', '🏌️‍♂️', '🏌️‍♀️',
        '🏇', '🏄', '🏄‍♂️', '🏄‍♀️', '🏂', '⛷️',
        '🎯', '🏹', '🥊', '🥋', '🤺', '⚔️',
        '🏓', '🏸', '🏒', '🏑', '🥍', '🏏',
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾',
        '🏐', '🏉', '🎱', '🪀', '🪁', '🎪'
    ]
    
    return Response({
        'success': True,
        'data': icons
    })


def calculate_split_analysis(split, user):
    """Calculate split analysis with optimal ranges and status"""
    analysis = []
    
    # Get user's muscle priorities
    muscle_priorities = {}
    muscle_logs = MuscleLog.objects.filter(user=user)
    for log in muscle_logs:
        muscle_priorities[log.muscle_name.muscle_name] = log.importance
    
    # Get all muscles in the split
    split_muscles = set()
    total_activation = defaultdict(int)
    
    for split_day in split.splitday_set.all():
        for target in split_day.splitdaytarget_set.all():
            muscle_name = target.muscle.muscle_name
            split_muscles.add(muscle_name)
            total_activation[muscle_name] += target.target_activation
    
    # Calculate analysis for each muscle
    num_days = split.splitday_set.count()
    
    for muscle_name in split_muscles:
        muscle = Muscle.objects.get(muscle_name=muscle_name)
        priority = muscle_priorities.get(muscle_name, 80)  # Default priority
        activation = total_activation[muscle_name]
        
        # Calculate optimal range
        # Lower end: R(P,D) = 90 * (10 + 0.1P) * 7/D
        # Upper end: R(P,D) = 90 * (20 + 0.1P) * 7 * D
        optimal_low = 90 * (10 + 0.1 * priority) * 7 / num_days
        optimal_high = 90 * (20 + 0.1 * priority) * 7 * num_days
        
        # Determine status
        if activation == 0:
            status = 'warning'
            status_color = '#E53E3E'  # Red
        elif activation < optimal_low * 0.85:  # Below optimal
            status = 'below'
            status_color = '#95A5A6'  # Gray
        elif optimal_low * 0.85 <= activation <= optimal_high * 1.15:  # Within 15% of optimal
            status = 'optimal'
            status_color = '#38A169'  # Green
        else:  # Above optimal
            status = 'above'
            status_color = '#E53E3E'  # Red
        
        analysis.append({
            'muscle_name': muscle_name,
            'muscle_group': muscle.muscle_group,
            'total_activation': activation,
            'optimal_range_low': round(optimal_low, 1),
            'optimal_range_high': round(optimal_high, 1),
            'muscle_priority': priority,
            'status': status,
            'status_color': status_color
        })
    
    return analysis