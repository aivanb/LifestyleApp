"""
Analytics Views - Comprehensive data analytics endpoints
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Count, Sum, Avg, Max, Min, F, DecimalField
from django.db.models.functions import TruncDate, ExtractHour, Extract
from django.utils import timezone
from datetime import datetime, timedelta, date
from decimal import Decimal
import json

from apps.logging.models import (
    FoodLog, WeightLog, BodyMeasurementLog, WaterLog, StepsLog, CardioLog
)
from apps.health.models import SleepLog, HealthMetricsLog
from apps.workouts.models import (
    Workout, WorkoutLog, Split, SplitDay, SplitDayTarget,
)
from apps.foods.models import Food
from apps.users.models import UserGoal


def parse_analytics_date_range(request, default_preset='2weeks'):
    """
    Parse date range from request. Supports preset or custom.
    Presets: 1week, 2weeks, 1month, 6months, 1year, custom.
    For custom, date_from and date_to must be provided (or use first_date/today from caller).
    Returns (date_from, date_to) as date objects.
    """
    today = timezone.now().date()
    preset = request.GET.get('range', default_preset).lower()
    date_from_param = request.GET.get('date_from')
    date_to_param = request.GET.get('date_to')

    if preset == 'custom':
        if date_from_param and date_to_param:
            date_from = datetime.strptime(date_from_param, '%Y-%m-%d').date()
            date_to = datetime.strptime(date_to_param, '%Y-%m-%d').date()
        else:
            date_to = today
            date_from = today - timedelta(days=14)  # fallback
        return (date_from, date_to)

    if preset == '1week':
        date_from = today - timedelta(days=7)
    elif preset == '2weeks':
        date_from = today - timedelta(days=14)
    elif preset == '1month':
        date_from = today - timedelta(days=30)
    elif preset == '6months':
        date_from = today - timedelta(days=30 * 6)
    elif preset == '1year':
        date_from = today - timedelta(days=365)
    else:
        date_from = today - timedelta(days=14)
    return (date_from, today)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_date_bounds(request):
    """
    Return first valid date and today for a section (workouts | foods).
    Used to default custom date range: first_date to today.
    """
    section = request.GET.get('section', 'workouts')
    today = timezone.now().date()

    if section == 'workouts':
        first = WorkoutLog.objects.filter(user=request.user).order_by('date_time').values_list('date_time', flat=True).first()
    elif section == 'foods':
        first = FoodLog.objects.filter(user=request.user).order_by('date_time').values_list('date_time', flat=True).first()
    else:
        return Response({'success': False, 'error': {'message': 'section must be workouts or foods'}}, status=status.HTTP_400_BAD_REQUEST)

    first_date = first.date() if first else today
    return Response({
        'success': True,
        'data': {
            'first_date': first_date.isoformat(),
            'today': today.isoformat()
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def body_measurement_progression(request):
    """
    Body Measurement Progression Chart
    - Selectable body measurement dropdown
    - Selectable timeframe of chart
    """
    measurement_type = request.GET.get('measurement_type', 'waist')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    # Validate measurement type
    valid_measurements = ['upper_arm', 'lower_arm', 'waist', 'shoulder', 'leg', 'calf']
    if measurement_type not in valid_measurements:
        return Response({
            'success': False,
            'error': {'message': f'Invalid measurement_type. Must be one of: {valid_measurements}'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Set date range defaults
    if not date_to:
        date_to = timezone.now().date()
    else:
        date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
    
    if not date_from:
        date_from = date_to - timedelta(days=90)
    else:
        date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
    
    # Query body measurements with filtering
    measurements = BodyMeasurementLog.objects.filter(
        user=request.user,
        date_time__gte=date_from,
        date_time__lte=date_to,
        **{f'{measurement_type}__isnull': False}
    ).order_by('date_time')
    
    # Build response data
    data = []
    for measurement in measurements:
        value = getattr(measurement, measurement_type)
        if value is not None:
            data.append({
                'date': measurement.date_time.isoformat(),
                'value': float(value)
            })
    
    return Response({
        'success': True,
        'data': {
            'measurement_type': measurement_type,
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'points': data
        }
    })


def _get_workout_progression_metric_value(user, metric_key, metric_date):
    """Return a single metric value for a given date for comparison with workout progression."""
    parts = metric_key.split('__')
    if len(parts) != 2:
        return None
    source, field = parts[0], parts[1]

    if source == 'cardio':
        agg = CardioLog.objects.filter(user=user, date_time__date=metric_date).aggregate(
            calories=Sum('calories_burned'),
            duration=Sum('duration')
        )
        if field == 'calories_burned':
            return int(agg['calories'] or 0)
        if field == 'duration':
            return float(agg['duration'] or 0)
        return None

    if source == 'food':
        food_agg_fields = {
            'total_calories': F('food__calories') * F('servings'),
            'total_carbohydrates': F('food__carbohydrates') * F('servings'),
            'total_sugar': F('food__sugar') * F('servings'),
            'total_fat': F('food__fat') * F('servings'),
            'total_protein': F('food__protein') * F('servings'),
            'total_sodium': F('food__sodium') * F('servings'),
        }
        if field not in food_agg_fields:
            return None
        agg = FoodLog.objects.filter(user=user, date_time__date=metric_date).aggregate(
            total=Sum(food_agg_fields[field], output_field=DecimalField(max_digits=12, decimal_places=2))
        )
        return round(float(agg['total'] or 0), 2)

    if source == 'health':
        health = HealthMetricsLog.objects.filter(user=user, date_time=metric_date).first()
        if not health:
            return None
        return getattr(health, field, None)

    if source == 'sleep':
        sleep = SleepLog.objects.filter(user=user, date_time=metric_date).first()
        if not sleep:
            return None
        if field == 'total_sleep_time':
            if sleep.time_got_out_of_bed and sleep.time_went_to_bed:
                from datetime import datetime as dt
                out = dt.combine(metric_date, sleep.time_got_out_of_bed)
                bed = dt.combine(metric_date, sleep.time_went_to_bed)
                if out < bed:
                    out = dt.combine(metric_date + timedelta(days=1), sleep.time_got_out_of_bed)
                return (out - bed).total_seconds() / 60.0  # minutes
            return None
        return getattr(sleep, field, None)

    if source == 'steps':
        agg = StepsLog.objects.filter(user=user, date_time__date=metric_date).aggregate(total=Sum('steps'))
        return int(agg['total'] or 0) if field == 'total_steps' else None

    if source == 'weight':
        w = WeightLog.objects.filter(user=user, date_time__date=metric_date).order_by('-date_time').first()
        return float(w.weight) if w and field == 'weight' else None

    if source == 'water':
        agg = WaterLog.objects.filter(user=user, date_time__date=metric_date).aggregate(total=Sum('amount'))
        return float(agg['total'] or 0) if field == 'total_water' else None

    if source == 'workout_log':
        logs = WorkoutLog.objects.filter(user=user, date_time__date=metric_date)
        if field == 'avg_rest_time':
            agg = logs.filter(rest_time__isnull=False).aggregate(avg=Avg('rest_time'))
            return round(float(agg['avg'] or 0), 2)
        if field == 'total_sets':
            return logs.count()
        return None

    return None


def _compute_progression_for_row(row, progression_type):
    """Compute single progression value from a row (weights, reps, sets)."""
    weights = row['weights']
    if not weights:
        return None
    avg_weight = sum(weights) / len(weights)
    total_reps = sum(row['reps']) if row['reps'] else 0
    total_sets = row['sets']
    max_weight = max(weights)
    if progression_type == 'avg_weight_reps':
        return round(avg_weight * (1 + 0.333 * total_reps), 2)
    if progression_type == 'avg_weight_sets':
        return round(avg_weight * total_sets, 2)
    if progression_type == 'avg_weight':
        return round(avg_weight, 2)
    return round(max_weight, 2)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workout_progression(request):
    """
    Workout Progression Chart.
    - workout_id optional: when empty or "all", returns combined progression (sum of each workout's
      progression per day). When set, only that workout; only dates where it was logged.
    - progression_type: avg_weight_reps (Epley 1RM) | avg_weight_sets | avg_weight | max_weight.
    - Optional metrics (single or comma-separated) with optional metric_offset=1.
    """
    workout_id = request.GET.get('workout_id', '').strip()
    date_from, date_to = parse_analytics_date_range(request)
    progression_type = request.GET.get('progression_type', 'avg_weight_reps')
    metric_offset = int(request.GET.get('metric_offset', 0))
    metrics_param = request.GET.get('metrics', '')
    metric_keys = [m.strip() for m in metrics_param.split(',') if m.strip()]

    valid_progression = ('avg_weight_reps', 'avg_weight_sets', 'avg_weight', 'max_weight')
    if progression_type not in valid_progression:
        return Response({
            'success': False,
            'error': {'message': f'progression_type must be one of: {valid_progression}'}
        }, status=status.HTTP_400_BAD_REQUEST)

    all_workouts = not workout_id
    if not all_workouts:
        try:
            workout = Workout.objects.get(workouts_id=int(workout_id), user=request.user)
        except (ValueError, Workout.DoesNotExist):
            return Response({
                'success': False,
                'error': {'message': 'Workout not found'}
            }, status=status.HTTP_404_NOT_FOUND)

    logs_query = WorkoutLog.objects.filter(
        user=request.user,
        date_time__date__gte=date_from,
        date_time__date__lte=date_to,
        weight__isnull=False
    ).order_by('date_time')
    if not all_workouts:
        logs_query = logs_query.filter(workout_id=workout_id)

    # Group by date and (for all) by workout
    by_date = {}
    for log in logs_query:
        d = log.date_time.date()
        key = d.isoformat()
        wkey = str(log.workout_id) if all_workouts else '_'
        if key not in by_date:
            by_date[key] = {}
        if wkey not in by_date[key]:
            by_date[key][wkey] = {'weights': [], 'reps': [], 'sets': 0, 'rest_times': []}
        row = by_date[key][wkey]
        row['weights'].append(float(log.weight))
        if log.reps is not None:
            row['reps'].append(log.reps)
        row['sets'] += 1
        if log.rest_time is not None:
            row['rest_times'].append(log.rest_time)

    data = []
    for date_key in sorted(by_date.keys()):
        day_data = by_date[date_key]
        if all_workouts:
            progression = sum(
                _compute_progression_for_row(row, progression_type)
                for row in day_data.values()
                if _compute_progression_for_row(row, progression_type) is not None
            )
            progression = round(progression, 2)
        else:
            row = next(iter(day_data.values()))
            progression = _compute_progression_for_row(row, progression_type)
            if progression is None:
                continue

        point_data = {'date': date_key, 'progression': progression}
        date_obj = datetime.strptime(date_key, '%Y-%m-%d').date()
        for mk in metric_keys:
            metric_date = date_obj - timedelta(days=metric_offset) if metric_offset else date_obj
            val = _get_workout_progression_metric_value(request.user, mk, metric_date)
            if val is not None:
                point_data[mk] = val
        data.append(point_data)

    payload = {
        'workout_id': int(workout_id) if workout_id and not all_workouts else None,
        'workout_name': None if all_workouts else workout.workout_name,
        'date_from': date_from.isoformat(),
        'date_to': date_to.isoformat(),
        'progression_type': progression_type,
        'points': data
    }
    return Response({'success': True, 'data': payload})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workout_sets_per_day(request):
    """
    Layered bar chart: total sets logged per day and attribute sets (sets with attributes) per day.
    """
    date_from, date_to = parse_analytics_date_range(request)
    logs = WorkoutLog.objects.filter(
        user=request.user,
        date_time__date__gte=date_from,
        date_time__date__lte=date_to
    )
    by_date = {}
    for log in logs:
        d = log.date_time.date().isoformat()
        if d not in by_date:
            by_date[d] = {'total_sets': 0, 'attribute_sets': 0}
        by_date[d]['total_sets'] += 1
        if log.attributes and len(log.attributes) > 0:
            by_date[d]['attribute_sets'] += 1
    data = [{'date': k, 'total_sets': v['total_sets'], 'attribute_sets': v['attribute_sets']}
            for k, v in sorted(by_date.items())]
    return Response({
        'success': True,
        'data': {
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'points': data
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workout_rest_time_analysis(request):
    """
    Rest time vs weight change analysis
    Shows how rest time affects weight lifted in next set
    """
    workout_id = request.GET.get('workout_id')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    # Set date range defaults
    if not date_to:
        date_to = timezone.now()
    else:
        date_to = datetime.strptime(date_to, '%Y-%m-%d')
    
    if not date_from:
        date_from = date_to - timedelta(days=90)
    else:
        date_from = datetime.strptime(date_from, '%Y-%m-%d')
    
    # Get workout logs grouped by date and workout
    logs_query = WorkoutLog.objects.filter(
        user=request.user,
        date_time__gte=date_from,
        date_time__lte=date_to,
        weight__isnull=False,
        rest_time__isnull=False
    )
    
    if workout_id:
        logs_query = logs_query.filter(workout_id=workout_id)
    
    logs = logs_query.order_by('date_time', 'workout_id', 'created_at')
    
    # Group by date and workout, then calculate rest time vs next set weight change
    data = []
    current_date = None
    current_workout = None
    previous_log = None
    
    for log in logs:
        date_key = log.date_time.date()
        workout_key = log.workout_id
        
        if (date_key != current_date or workout_key != current_workout) or previous_log is None:
            previous_log = log
            current_date = date_key
            current_workout = workout_key
            continue
        
        # Calculate weight difference
        weight_diff = float(log.weight) - float(previous_log.weight)
        
        data.append({
            'date': date_key.isoformat(),
            'rest_time': log.rest_time,
            'weight_change': round(weight_diff, 2),
            'previous_weight': float(previous_log.weight),
            'current_weight': float(log.weight)
        })
        
        previous_log = log
    
    return Response({
        'success': True,
        'data': {
            'workout_id': workout_id,
            'date_from': date_from.date().isoformat(),
            'date_to': date_to.date().isoformat(),
            'points': data
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workout_attributes_analysis(request):
    """
    Attributes vs progression analysis
    Compares progression when attributes were used vs not used
    """
    workout_id = request.GET.get('workout_id')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    # Set date range defaults
    if not date_to:
        date_to = timezone.now()
    else:
        date_to = datetime.strptime(date_to, '%Y-%m-%d')
    
    if not date_from:
        date_from = date_to - timedelta(days=90)
    else:
        date_from = datetime.strptime(date_from, '%Y-%m-%d')
    
    # Get workout logs
    logs_query = WorkoutLog.objects.filter(
        user=request.user,
        date_time__gte=date_from,
        date_time__lte=date_to,
        weight__isnull=False,
        reps__isnull=False
    )
    
    if workout_id:
        logs_query = logs_query.filter(workout_id=workout_id)
    
    logs = logs_query.order_by('date_time')
    
    # Calculate progression and check for attributes
    data = []
    for log in logs:
        progression = float(log.weight) * (1 + 0.0333 * log.reps)
        has_attributes = len(log.attributes) > 0 if log.attributes else False
        
        data.append({
            'date': log.date_time.date().isoformat(),
            'progression': round(progression, 2),
            'has_attributes': has_attributes,
            'attributes': log.attributes if log.attributes else []
        })
    
    return Response({
        'success': True,
        'data': {
            'workout_id': workout_id,
            'date_from': date_from.date().isoformat(),
            'date_to': date_to.date().isoformat(),
            'points': data
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def steps_cardio_distance(request):
    """
    Steps distance + cardio distance comparison
    - Calculate distance from steps based on user height
    - Show difference between steps and cardio distance
    - Show average steps per day
    """
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    # Set date range defaults
    if not date_to:
        date_to = timezone.now().date()
    else:
        date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
    
    if not date_from:
        date_from = date_to - timedelta(days=30)
    else:
        date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
    
    # Get user height for step distance calculation
    user = request.user
    height_inches = float(user.height) if user.height else 70  # Default to 70 inches
    
    # Calculate step length (approximately 0.413 × height in inches for men, 0.413 × height for women)
    # Using average of both
    step_length_meters = (height_inches * 0.0254) * 0.413  # Convert to meters and apply factor
    step_length_miles = step_length_meters * 0.000621371
    
    # Get steps logs
    steps_logs = StepsLog.objects.filter(
        user=request.user,
        date_time__gte=date_from,
        date_time__lte=date_to
    ).values('date_time__date').annotate(
        total_steps=Sum('steps')
    ).order_by('date_time__date')
    
    # Get cardio logs
    cardio_logs = CardioLog.objects.filter(
        user=request.user,
        date_time__gte=date_from,
        date_time__lte=date_to,
        distance__isnull=False
    ).extra(select={'date': "DATE(date_time)"}).values('date').annotate(
        total_distance=Sum('distance')
    ).order_by('date')
    
    # Convert cardio to miles (assuming input is in miles, adjust if needed)
    cardio_dict = {item['date'].isoformat() if isinstance(item['date'], date) else item['date']: float(item['total_distance']) 
                   for item in cardio_logs}
    
    # Build response data
    data = []
    total_steps = 0
    total_steps_days = 0
    
    for step_log in steps_logs:
        date_key = step_log['date_time__date'].isoformat()
        steps = step_log['total_steps']
        steps_distance_miles = steps * step_length_miles
        cardio_distance = cardio_dict.get(date_key, 0)
        
        data.append({
            'date': date_key,
            'steps': steps,
            'steps_distance_miles': round(steps_distance_miles, 2),
            'cardio_distance_miles': round(cardio_distance, 2),
            'difference_miles': round(steps_distance_miles - cardio_distance, 2)
        })
        
        total_steps += steps
        total_steps_days += 1
    
    avg_steps_per_day = total_steps / total_steps_days if total_steps_days > 0 else 0
    
    return Response({
        'success': True,
        'data': {
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'average_steps_per_day': round(avg_steps_per_day, 0),
            'points': data
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activation_progress(request):
    """
    Progress of done activation ratings compared to expected during split day
    """
    date_from, date_to = parse_analytics_date_range(request)
    
    # Get active split
    active_split = Split.objects.filter(
        user=request.user,
        start_date__isnull=False
    ).order_by('-start_date').first()
    
    if not active_split:
        return Response({
            'success': False,
            'error': {'message': 'No active split found'}
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get split days
    split_days = SplitDay.objects.filter(split=active_split).order_by('day_order')
    
    # Calculate day of split for each date
    data = []
    current_date = date_from
    
    while current_date <= date_to:
        # Calculate which day of the split this is
        days_since_start = (current_date - active_split.start_date).days
        if days_since_start < 0:
            current_date += timedelta(days=1)
            continue
        
        split_day_index = days_since_start % split_days.count() if split_days.count() > 0 else 0
        split_day = split_days[split_day_index] if split_days.count() > 0 else None
        
        if not split_day:
            current_date += timedelta(days=1)
            continue
        
        # Get expected activations for this split day
        expected_activations = SplitDayTarget.objects.filter(split_day=split_day).select_related('muscle')
        expected_dict = {target.muscle.muscles_id: target.target_activation for target in expected_activations}
        
        # Get actual activations from workout logs on this date
        workout_logs = WorkoutLog.objects.filter(
            user=request.user,
            date_time__date=current_date
        ).select_related('workout').prefetch_related('workout__workoutmuscle_set__muscle')
        
        actual_activations = {}
        for log in workout_logs:
            workout_muscles = log.workout.workoutmuscle_set.all()
            for wm in workout_muscles:
                muscle_id = wm.muscle.muscles_id
                if muscle_id not in actual_activations:
                    actual_activations[muscle_id] = 0
                actual_activations[muscle_id] += wm.activation_rating
        
        # Calculate total expected and actual
        total_expected = sum(expected_dict.values())
        total_actual = sum(actual_activations.values())
        
        data.append({
            'date': current_date.isoformat(),
            'split_day_name': split_day.day_name,
            'total_expected': total_expected,
            'total_actual': total_actual,
            'difference': total_actual - total_expected,
            'percentage': round((total_actual / total_expected * 100) if total_expected > 0 else 0, 2)
        })
        
        current_date += timedelta(days=1)
    
    return Response({
        'success': True,
        'data': {
            'split_name': active_split.split_name,
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'points': data
        }
    })


# ========== FOOD ANALYTICS ==========


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def food_metadata_progress(request):
    """
    Metadata progress vs goal
    - Selectable metadata
    - Selectable timeframe
    - Daily totals vs goal line
    - Color coding (below/above goal)
    - Ratio of days within 8% of goal
    - Average metadata value
    """
    metadata_type = request.GET.get('metadata_type', 'calories')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    # Validate metadata type
    valid_metadata = [
        'calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sodium',
        'sugar', 'saturated_fat', 'trans_fat', 'calcium', 'iron', 'magnesium',
        'cholesterol', 'vitamin_a', 'vitamin_c', 'vitamin_d', 'caffeine'
    ]
    if metadata_type not in valid_metadata:
        return Response({
            'success': False,
            'error': {'message': f'Invalid metadata_type. Must be one of: {valid_metadata}'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    date_from, date_to = parse_analytics_date_range(request)
    
    # Get food logs grouped by date
    food_logs = FoodLog.objects.filter(
        user=request.user,
        date_time__gte=date_from,
        date_time__lte=date_to
    ).select_related('food').extra(
        select={'date': "DATE(date_time)"}
    ).values('date').annotate(
        total=Sum(F(f'food__{metadata_type}') * F('servings'), output_field=DecimalField(max_digits=10, decimal_places=2))
    ).order_by('date')
    
    # Get goals for the timeframe
    goals = UserGoal.objects.filter(
        user=request.user,
        created_at__lte=date_to
    ).order_by('-created_at')
    
    # Build data points with goals
    data = []
    total_value = Decimal('0')
    days_within_8_percent = 0
    total_days = 0
    
    current_date = date_from
    while current_date <= date_to:
        date_key = current_date.isoformat()
        
        # Find applicable goal (most recent goal before or on this date)
        goal_obj = goals.filter(created_at__lte=current_date).first() if goals.exists() else None
        goal_field = f'{metadata_type}_goal'
        goal_value = float(getattr(goal_obj, goal_field, 0) or 0) if goal_obj else None
        
        # Find food log total for this date
        log_entry = next((item for item in food_logs if item['date'].isoformat() == date_key), None)
        actual_value = float(log_entry['total']) if log_entry and log_entry['total'] else 0.0
        
        if log_entry:
            total_value += Decimal(str(actual_value))
            total_days += 1
            
            # Check if within 8% of goal
            if goal_value and goal_value > 0:
                percent_diff = abs((actual_value - goal_value) / goal_value * 100)
                if percent_diff <= 8:
                    days_within_8_percent += 1
        
        point_data = {
            'date': date_key,
            'actual': round(actual_value, 2),
            'goal': round(goal_value, 2) if goal_value else None,
            'is_below_goal': goal_value and actual_value < goal_value,
            'is_above_goal': goal_value and actual_value > goal_value,
            'is_within_goal': goal_value and abs(actual_value - goal_value) / goal_value * 100 <= 8
        }
        
        data.append(point_data)
        
        current_date += timedelta(days=1)
    
    avg_value = float(total_value / total_days) if total_days > 0 else 0.0
    ratio_within_8_percent = (days_within_8_percent / total_days * 100) if total_days > 0 else 0.0
    
    return Response({
        'success': True,
        'data': {
            'metadata_type': metadata_type,
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'average': round(avg_value, 2),
            'ratio_within_8_percent': round(ratio_within_8_percent, 2),
            'points': data
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def food_timing(request):
    """
    Food timing heatmap
    Shows what times most calories (or other metadata) are eaten
    """
    metadata_type = request.GET.get('metadata_type', 'calories')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    # Validate metadata type
    valid_metadata = [
        'calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sodium',
        'sugar', 'saturated_fat', 'trans_fat', 'calcium', 'iron', 'magnesium',
        'cholesterol', 'vitamin_a', 'vitamin_c', 'vitamin_d', 'caffeine'
    ]
    if metadata_type not in valid_metadata:
        return Response({
            'success': False,
            'error': {'message': f'Invalid metadata_type. Must be one of: {valid_metadata}'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    date_from, date_to = parse_analytics_date_range(request)
    num_days = max((date_to - date_from).days + 1, 1)

    # Per (date, hour) sum of metadata, then average at each hour over the date range
    food_logs = FoodLog.objects.filter(
        user=request.user,
        date_time__gte=date_from,
        date_time__lte=date_to
    ).select_related('food').annotate(
        date=TruncDate('date_time'),
        hour=ExtractHour('date_time')
    ).values('date', 'hour').annotate(
        total=Sum(F(f'food__{metadata_type}') * F('servings'), output_field=DecimalField(max_digits=10, decimal_places=2))
    ).order_by('hour', 'date')

    hour_totals = {}
    for item in food_logs:
        h = item['hour']
        if h not in hour_totals:
            hour_totals[h] = 0
        hour_totals[h] += float(item['total'] or 0)

    data = []
    for hour in range(24):
        total_at_hour = hour_totals.get(hour, 0)
        avg_at_hour = round(total_at_hour / num_days, 2)
        data.append({'hour': hour, 'value': avg_at_hour})

    return Response({
        'success': True,
        'data': {
            'metadata_type': metadata_type,
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'heatmap': data
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def macro_split(request):
    """
    Macro split chart
    Shows split of protein, carbohydrates, and fats over calories
    """
    date_from, date_to = parse_analytics_date_range(request)
    
    # Get food logs grouped by date
    food_logs = FoodLog.objects.filter(
        user=request.user,
        date_time__gte=date_from,
        date_time__lte=date_to
    ).select_related('food').extra(
        select={'date': "DATE(date_time)"}
    ).values('date').annotate(
        total_calories=Sum(F('food__calories') * F('servings'), output_field=DecimalField(max_digits=10, decimal_places=2)),
        total_protein=Sum(F('food__protein') * F('servings'), output_field=DecimalField(max_digits=10, decimal_places=2)),
        total_fat=Sum(F('food__fat') * F('servings'), output_field=DecimalField(max_digits=10, decimal_places=2)),
        total_carbs=Sum(F('food__carbohydrates') * F('servings'), output_field=DecimalField(max_digits=10, decimal_places=2))
    ).order_by('date')
    
    # Build response data
    data = []
    for log_entry in food_logs:
        calories = float(log_entry['total_calories'] or 0)
        protein = float(log_entry['total_protein'] or 0)
        fat = float(log_entry['total_fat'] or 0)
        carbs = float(log_entry['total_carbs'] or 0)
        
        # Calculate percentages of calories (protein and carbs = 4 cal/g, fat = 9 cal/g)
        protein_cals = protein * 4
        fat_cals = fat * 9
        carbs_cals = carbs * 4
        total_macro_cals = protein_cals + fat_cals + carbs_cals
        
        if calories > 0:
            protein_pct = (protein_cals / calories * 100) if calories > 0 else 0
            fat_pct = (fat_cals / calories * 100) if calories > 0 else 0
            carbs_pct = (carbs_cals / calories * 100) if calories > 0 else 0
        else:
            protein_pct = fat_pct = carbs_pct = 0
        
        data.append({
            'date': log_entry['date'].isoformat(),
            'calories': round(calories, 2),
            'protein': round(protein, 2),
            'protein_percentage': round(protein_pct, 2),
            'fat': round(fat, 2),
            'fat_percentage': round(fat_pct, 2),
            'carbohydrates': round(carbs, 2),
            'carbohydrates_percentage': round(carbs_pct, 2)
        })
    
    return Response({
        'success': True,
        'data': {
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'points': data
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def food_frequency(request):
    """
    Food frequency chart.
    - entry_type: 'food_group' | 'brand' | 'both'. When 'both', returns food_groups and brands
      each with name, count, percentage (over date range). No limit for 'both'.
    - Otherwise top N with optional order (used by legacy bar view).
    """
    entry_type = request.GET.get('entry_type', 'food_group')
    limit = int(request.GET.get('limit', 10))
    order = request.GET.get('order', 'desc')
    date_from, date_to = parse_analytics_date_range(request)

    food_logs = FoodLog.objects.filter(
        user=request.user,
        date_time__gte=date_from,
        date_time__lte=date_to
    ).select_related('food')

    if entry_type == 'both':
        fg = food_logs.values('food__food_group').annotate(
            count=Count('food__food_group')
        ).order_by('-count')
        total_fg = sum(item['count'] for item in fg)
        food_groups = [{
            'name': item['food__food_group'],
            'count': item['count'],
            'percentage': round(100 * item['count'] / total_fg, 2) if total_fg else 0
        } for item in fg]

        brand_qs = food_logs.exclude(food__brand__isnull=True).exclude(food__brand='')
        br = brand_qs.values('food__brand').annotate(count=Count('food__brand')).order_by('-count')
        total_br = sum(item['count'] for item in br)
        brands = [{
            'name': item['food__brand'],
            'count': item['count'],
            'percentage': round(100 * item['count'] / total_br, 2) if total_br else 0
        } for item in br]

        return Response({
            'success': True,
            'data': {
                'date_from': date_from.isoformat(),
                'date_to': date_to.isoformat(),
                'food_groups': food_groups,
                'brands': brands
            }
        })

    if entry_type == 'food_group':
        if order == 'desc':
            frequency_data = food_logs.values('food__food_group').annotate(
                count=Count('food__food_group'),
                total_servings=Sum('servings')
            ).order_by('-count')[:limit]
        else:
            frequency_data = food_logs.values('food__food_group').annotate(
                count=Count('food__food_group'),
                total_servings=Sum('servings')
            ).order_by('count')[:limit]
        data = [{'name': item['food__food_group'], 'count': item['count'], 'total_servings': float(item['total_servings'])} for item in frequency_data]
    elif entry_type == 'brand':
        if order == 'desc':
            frequency_data = food_logs.exclude(food__brand__isnull=True).exclude(food__brand='').values('food__brand').annotate(
                count=Count('food__brand'),
                total_servings=Sum('servings')
            ).order_by('-count')[:limit]
        else:
            frequency_data = food_logs.exclude(food__brand__isnull=True).exclude(food__brand='').values('food__brand').annotate(
                count=Count('food__brand'),
                total_servings=Sum('servings')
            ).order_by('count')[:limit]
        data = [{'name': item['food__brand'], 'count': item['count'], 'total_servings': float(item['total_servings'])} for item in frequency_data]
    else:
        return Response({
            'success': False,
            'error': {'message': "entry_type must be 'food_group', 'brand', or 'both'"}
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'success': True,
        'data': {'entry_type': entry_type, 'limit': limit, 'order': order, 'items': data}
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def food_cost(request):
    """
    Food cost analytics
    - Average cost per day/week/month/year
    - Most expensive brands vs calorie density
    - Cost vs macro/micro metadata
    - Date range from shared analytics range
    """
    period = request.GET.get('period', 'day')  # 'day', 'week', 'month', 'year'
    analysis_type = request.GET.get('analysis_type', 'average')  # 'average', 'brand_density', 'cost_vs_metadata'
    date_from, date_to = parse_analytics_date_range(request)
    
    if analysis_type == 'average':
        # Calculate average cost per period
        food_logs = FoodLog.objects.filter(
            user=request.user,
            date_time__gte=date_from,
            date_time__lte=date_to,
            food__cost__isnull=False
        ).select_related('food').extra(
            select={'date': "DATE(date_time)"}
        ).values('date').annotate(
            total_cost=Sum(F('food__cost') * F('servings'), output_field=DecimalField(max_digits=10, decimal_places=2))
        ).order_by('date')
        
        total_cost = sum(float(item['total_cost'] or 0) for item in food_logs)
        
        # Calculate number of periods
        if period == 'day':
            num_periods = (date_to - date_from).days + 1
        elif period == 'week':
            num_periods = ((date_to - date_from).days + 1) / 7
        elif period == 'month':
            num_periods = ((date_to - date_from).days + 1) / 30
        else:  # year
            num_periods = ((date_to - date_from).days + 1) / 365
        
        avg_cost = total_cost / num_periods if num_periods > 0 else 0
        
        return Response({
            'success': True,
            'data': {
                'period': period,
                'date_from': date_from.isoformat(),
                'date_to': date_to.isoformat(),
                'average_cost': round(avg_cost, 2),
                'total_cost': round(total_cost, 2),
                'num_periods': round(num_periods, 2)
            }
        })
    
    elif analysis_type == 'brand_density':
        # Most expensive brands vs calorie density
        food_logs = FoodLog.objects.filter(
            user=request.user,
            date_time__gte=date_from,
            date_time__lte=date_to,
            food__cost__isnull=False,
            food__brand__isnull=False
        ).exclude(food__brand='').select_related('food').values('food__brand').annotate(
            total_cost=Sum(F('food__cost') * F('servings'), output_field=DecimalField(max_digits=10, decimal_places=2)),
            total_calories=Sum(F('food__calories') * F('servings'), output_field=DecimalField(max_digits=10, decimal_places=2)),
            total_servings=Sum('servings')
        ).order_by('-total_cost')[:20]
        
        data = []
        for item in food_logs:
            cost = float(item['total_cost'] or 0)
            calories = float(item['total_calories'] or 0)
            calorie_density = (calories / cost) if cost > 0 else 0
            
            data.append({
                'brand': item['food__brand'],
                'total_cost': round(cost, 2),
                'total_calories': round(calories, 2),
                'calorie_density': round(calorie_density, 2)
            })
        
        return Response({
            'success': True,
            'data': {
                'date_from': date_from.isoformat(),
                'date_to': date_to.isoformat(),
                'brands': data
            }
        })
    
    elif analysis_type == 'cost_vs_metadata':
        # Cost vs macro/micro metadata
        metadata_type = request.GET.get('metadata_type', 'calories')
        
        food_logs = FoodLog.objects.filter(
            user=request.user,
            date_time__gte=date_from,
            date_time__lte=date_to,
            food__cost__isnull=False
        ).select_related('food').extra(
            select={'date': "DATE(date_time)"}
        ).values('date').annotate(
            total_cost=Sum(F('food__cost') * F('servings'), output_field=DecimalField(max_digits=10, decimal_places=2)),
            total_metadata=Sum(F(f'food__{metadata_type}') * F('servings'), output_field=DecimalField(max_digits=10, decimal_places=2))
        ).order_by('date')
        
        data = []
        for item in food_logs:
            cost = float(item['total_cost'] or 0)
            metadata_value = float(item['total_metadata'] or 0)
            
            data.append({
                'date': item['date'].isoformat(),
                'cost': round(cost, 2),
                'metadata_value': round(metadata_value, 2),
                'cost_per_unit': round((cost / metadata_value) if metadata_value > 0 else 0, 4)
            })
        
        return Response({
            'success': True,
            'data': {
                'metadata_type': metadata_type,
                'date_from': date_from.isoformat(),
                'date_to': date_to.isoformat(),
                'points': data
            }
        })
    
    else:
        return Response({
            'success': False,
            'error': {'message': "analysis_type must be 'average', 'brand_density', or 'cost_vs_metadata'"}
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def food_radar_chart(request):
    """
    Radar chart of average goal vs actual
    Shows multiple metadata types on radar chart
    """
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    # Set date range defaults
    if not date_to:
        date_to = timezone.now().date()
    else:
        date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
    
    if not date_from:
        date_from = date_to - timedelta(days=30)
    else:
        date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
    
    # Get applicable goal (most recent before date_to)
    goal = UserGoal.objects.filter(
        user=request.user,
        created_at__lte=date_to
    ).order_by('-created_at').first()
    
    # Get actual averages from food logs
    metadata_types = [
        'calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sodium',
        'sugar', 'saturated_fat', 'calcium', 'iron', 'vitamin_a', 'vitamin_c', 'vitamin_d'
    ]
    
    actual_data = {}
    goal_data = {}
    
    for metadata in metadata_types:
        # Get average actual
        food_logs = FoodLog.objects.filter(
            user=request.user,
            date_time__gte=date_from,
            date_time__lte=date_to
        ).aggregate(
            total=Sum(F(f'food__{metadata}') * F('servings'), output_field=DecimalField(max_digits=10, decimal_places=2))
        )
        
        total_days = (date_to - date_from).days + 1
        avg_actual = float(food_logs['total'] or 0) / total_days if total_days > 0 else 0
        actual_data[metadata] = round(avg_actual, 2)
        
        # Get goal
        goal_field = f'{metadata}_goal'
        goal_value = float(getattr(goal, goal_field, 0) or 0) if goal else 0
        goal_data[metadata] = round(goal_value, 2)
    
    return Response({
        'success': True,
        'data': {
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'actual': actual_data,
            'goal': goal_data
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workout_tracking_heatmap(request):
    """
    Heatmap of days workouts were tracked over the past year
    """
    date_to = request.GET.get('date_to')
    
    if not date_to:
        date_to = timezone.now().date()
    else:
        date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
    
    date_from = date_to - timedelta(days=365)
    
    # Get all workout log dates
    workout_dates = WorkoutLog.objects.filter(
        user=request.user,
        date_time__gte=date_from,
        date_time__lte=date_to
    ).extra(
        select={'date': "DATE(date_time)"}
    ).values('date').annotate(
        workout_count=Count('workout_log_id')
    ).order_by('date')
    
    # Build heatmap data
    data = {}
    for item in workout_dates:
        date_key = item['date'].isoformat() if isinstance(item['date'], date) else item['date']
        data[date_key] = item['workout_count']
    
    return Response({
        'success': True,
        'data': {
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'heatmap': data
        }
    })


# ========== HEALTH ANALYTICS ==========


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def weight_progression(request):
    """
    Weight progression chart
    - Show weight across selected timeframe
    - Optional additional metrics as points
    - Goal weight line
    - Ratio of fat mass vs lean mass
    """
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    include_metrics = request.GET.get('include_metrics', 'false').lower() == 'true'
    
    # Set date range defaults
    if not date_to:
        date_to = timezone.now().date()
    else:
        date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
    
    if not date_from:
        date_from = date_to - timedelta(days=90)
    else:
        date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
    
    # Get weight logs
    weight_logs = WeightLog.objects.filter(
        user=request.user,
        date_time__gte=date_from,
        date_time__lte=date_to
    ).order_by('date_time')
    
    # Get goals
    goals = UserGoal.objects.filter(
        user=request.user,
        created_at__lte=date_to
    ).order_by('-created_at')
    
    # Build data points
    data = []
    current_date = date_from
    
    while current_date <= date_to:
        # Get weight for this date
        weight_log = weight_logs.filter(date_time__date=current_date).order_by('-date_time').first()
        
        # Get goal weight (most recent goal before or on this date)
        goal = goals.filter(created_at__lte=current_date).first() if goals.exists() else None
        goal_weight = float(goal.weight_goal) if goal and goal.weight_goal else None
        
        # Get lean mass and fat mass goals for ratio calculation
        lean_mass_goal = float(goal.lean_mass_goal) if goal and goal.lean_mass_goal else None
        fat_mass_goal = float(goal.fat_mass_goal) if goal and goal.fat_mass_goal else None
        
        point_data = {
            'date': current_date.isoformat(),
            'weight': float(weight_log.weight) if weight_log else None,
            'goal_weight': goal_weight,
            'lean_mass_goal': lean_mass_goal,
            'fat_mass_goal': fat_mass_goal
        }
        
        # Calculate fat/lean ratio if both goals exist
        if lean_mass_goal and fat_mass_goal and fat_mass_goal > 0:
            point_data['fat_lean_ratio'] = round(fat_mass_goal / lean_mass_goal, 3)
        elif weight_log and lean_mass_goal and fat_mass_goal:
            # Estimate from goals if current weight matches
            estimated_fat = (weight_log.weight * (fat_mass_goal / (lean_mass_goal + fat_mass_goal))) if (lean_mass_goal + fat_mass_goal) > 0 else None
            estimated_lean = (weight_log.weight * (lean_mass_goal / (lean_mass_goal + fat_mass_goal))) if (lean_mass_goal + fat_mass_goal) > 0 else None
            if estimated_fat and estimated_lean and estimated_lean > 0:
                point_data['fat_lean_ratio'] = round(float(estimated_fat / estimated_lean), 3)
        
        # Add optional metrics
        if include_metrics:
            # Calories, fat, carbs, protein logged
            food_logs = FoodLog.objects.filter(
                user=request.user,
                date_time__date=current_date
            ).select_related('food').aggregate(
                total_calories=Sum(F('food__calories') * F('servings')),
                total_protein=Sum(F('food__protein') * F('servings')),
                total_fat=Sum(F('food__fat') * F('servings')),
                total_carbs=Sum(F('food__carbohydrates') * F('servings'))
            )
            
            point_data['calories'] = float(food_logs['total_calories'] or 0)
            point_data['protein'] = float(food_logs['total_protein'] or 0)
            point_data['fat'] = float(food_logs['total_fat'] or 0)
            point_data['carbohydrates'] = float(food_logs['total_carbs'] or 0)
            
            # Sleep the night before
            sleep_before = SleepLog.objects.filter(
                user=request.user,
                date_time=current_date - timedelta(days=1)
            ).first()
            if sleep_before:
                point_data['sleep_hours'] = None  # Would need time calculation
            
            # Health metrics
            health = HealthMetricsLog.objects.filter(
                user=request.user,
                date_time=current_date
            ).first()
            if health:
                if health.stress_level is not None:
                    point_data['stress'] = health.stress_level
                if health.mood is not None:
                    point_data['mood'] = health.mood
                if health.illness_level is not None:
                    point_data['illness'] = health.illness_level
                if health.blood_pressure_systolic is not None:
                    point_data['blood_pressure_systolic'] = health.blood_pressure_systolic
                if health.blood_pressure_diastolic is not None:
                    point_data['blood_pressure_diastolic'] = health.blood_pressure_diastolic
            
            # Cardio calories burned
            cardio = CardioLog.objects.filter(
                user=request.user,
                date_time__date=current_date
            ).aggregate(total_calories=Sum('calories_burned'))
            point_data['cardio_calories'] = int(cardio['total_calories'] or 0)
            
            # Daily water
            water = WaterLog.objects.filter(
                user=request.user,
                date_time__date=current_date
            ).aggregate(total=Sum('amount'))
            point_data['water'] = float(water['total'] or 0)
        
        data.append(point_data)
        current_date += timedelta(days=1)
    
    return Response({
        'success': True,
        'data': {
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'points': data
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_metrics_radial(request):
    """
    Radial map of average mood, morning energy, soreness, illness, and stress level
    """
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    # Set date range defaults
    if not date_to:
        date_to = timezone.now().date()
    else:
        date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
    
    if not date_from:
        date_from = date_to - timedelta(days=30)
    else:
        date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
    
    # Get health metrics logs
    health_logs = HealthMetricsLog.objects.filter(
        user=request.user,
        date_time__gte=date_from,
        date_time__lte=date_to
    ).aggregate(
        avg_mood=Avg('mood'),
        avg_morning_energy=Avg('morning_energy'),
        avg_soreness=Avg('soreness'),
        avg_illness=Avg('illness_level'),
        avg_stress=Avg('stress_level')
    )
    
    return Response({
        'success': True,
        'data': {
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'mood': round(float(health_logs['avg_mood'] or 0), 2),
            'morning_energy': round(float(health_logs['avg_morning_energy'] or 0), 2),
            'soreness': round(float(health_logs['avg_soreness'] or 0), 2),
            'illness': round(float(health_logs['avg_illness'] or 0), 2),
            'stress': round(float(health_logs['avg_stress'] or 0), 2)
        }
    })


def _latest_user_goal(user):
    return UserGoal.objects.filter(user=user).order_by('-updated_at', '-created_at').first()


def _weight_kg_latest(user):
    """Most recent weight log in kilograms, or None."""
    wl = WeightLog.objects.filter(user=user).order_by('-date_time', '-created_at').first()
    if not wl or wl.weight is None:
        return None
    w = float(wl.weight)
    unit = (wl.weight_unit or 'kg').lower()
    if unit in ('lb', 'lbs', 'pound', 'pounds'):
        return round(w * 0.45359237, 2)
    return round(w, 2)


def _steps_to_walking_kcal(steps, height_cm, weight_kg):
    """
    Approximate walking kcal from steps using stride length from height (m) and body mass.
    stride ≈ 0.414 × height_m; energy ≈ 0.7 kcal/kg/km (walking).
    """
    if not steps or steps <= 0 or not height_cm or not weight_kg:
        return 0.0
    height_m = float(height_cm) / 100.0
    stride_m = height_m * 0.414
    distance_km = (steps * stride_m) / 1000.0
    return round(distance_km * float(weight_kg) * 0.7, 1)


def _activation_actual_by_muscle(user, target_date):
    """Sum WorkoutMuscle activation_rating for all sets logged on target_date."""
    logs = WorkoutLog.objects.filter(
        user=user, date_time__date=target_date
    ).select_related('workout').prefetch_related('workout__workoutmuscle_set__muscle')
    actual = {}
    for log in logs:
        for wm in log.workout.workoutmuscle_set.all():
            mid = wm.muscle.muscles_id
            actual[mid] = actual.get(mid, 0) + int(wm.activation_rating or 0)
    return actual


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def home_dashboard(request):
    """
    Single-day home summary: split day + activation targets vs done, macro goals vs logged,
    calorie budget including cardio and estimated walking burn from steps (height + latest weight),
    and which additional trackers have no entry today.
    """
    date_str = request.GET.get('date')
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'success': False, 'error': {'message': 'Invalid date; use YYYY-MM-DD'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        target_date = timezone.localdate()

    user = request.user
    goals = _latest_user_goal(user)

    goal_macros = {
        'calories': int(goals.calories_goal) if goals and goals.calories_goal is not None else None,
        'protein': float(goals.protein_goal) if goals and goals.protein_goal is not None else None,
        'carbohydrates': float(goals.carbohydrates_goal) if goals and goals.carbohydrates_goal is not None else None,
        'fat': float(goals.fat_goal) if goals and goals.fat_goal is not None else None,
    }

    food_totals = FoodLog.objects.filter(user=user, date_time__date=target_date).aggregate(
        calories=Sum(F('food__calories') * F('servings'), output_field=DecimalField(max_digits=14, decimal_places=4)),
        protein=Sum(F('food__protein') * F('servings'), output_field=DecimalField(max_digits=14, decimal_places=4)),
        carbohydrates=Sum(F('food__carbohydrates') * F('servings'), output_field=DecimalField(max_digits=14, decimal_places=4)),
        fat=Sum(F('food__fat') * F('servings'), output_field=DecimalField(max_digits=14, decimal_places=4)),
    )
    consumed = {
        'calories': round(float(food_totals['calories'] or 0), 1),
        'protein': round(float(food_totals['protein'] or 0), 1),
        'carbohydrates': round(float(food_totals['carbohydrates'] or 0), 1),
        'fat': round(float(food_totals['fat'] or 0), 1),
    }

    macro_remaining = {}
    for key in ('protein', 'carbohydrates', 'fat'):
        g = goal_macros.get(key)
        if g is not None:
            macro_remaining[key] = round(g - consumed[key], 1)
        else:
            macro_remaining[key] = None

    cardio_sum = CardioLog.objects.filter(user=user, date_time__date=target_date).aggregate(
        total=Sum('calories_burned')
    )
    cardio_calories = int(cardio_sum['total'] or 0)

    steps_sum = StepsLog.objects.filter(user=user, date_time__date=target_date).aggregate(
        total=Sum('steps')
    )
    steps_today = int(steps_sum['total'] or 0)

    height_cm = float(user.height) if user.height else None
    weight_kg = _weight_kg_latest(user)
    steps_calories = _steps_to_walking_kcal(steps_today, height_cm, weight_kg)

    calorie_remaining = None
    if goal_macros['calories'] is not None:
        calorie_remaining = round(
            goal_macros['calories']
            - consumed['calories']
            + cardio_calories
            + steps_calories,
            1,
        )

    split_section = {
        'active_split': None,
        'current_split_day': None,
        'muscle_rows': [],
    }
    active_split = Split.objects.filter(user=user, start_date__lte=target_date).order_by('-start_date').first()
    if active_split:
        split_days = active_split.splitday_set.all().order_by('day_order')
        if split_days.exists() and active_split.start_date:
            days_since = (target_date - active_split.start_date).days
            idx = days_since % split_days.count()
            current_day = split_days[idx]
            targets = SplitDayTarget.objects.filter(split_day=current_day).select_related('muscle')
            actual_map = _activation_actual_by_muscle(user, target_date)
            rows = []
            for t in targets:
                mid = t.muscle.muscles_id
                tgt = int(t.target_activation or 0)
                act = int(actual_map.get(mid, 0))
                rows.append({
                    'muscle_id': mid,
                    'muscle_name': t.muscle.muscle_name,
                    'target_activation': tgt,
                    'done_activation': act,
                    'remaining_activation': max(0, tgt - act),
                })
            split_section = {
                'active_split': {
                    'splits_id': active_split.splits_id,
                    'split_name': active_split.split_name,
                    'start_date': active_split.start_date.isoformat() if active_split.start_date else None,
                },
                'current_split_day': {
                    'split_days_id': current_day.split_days_id,
                    'day_name': current_day.day_name,
                    'day_order': current_day.day_order,
                },
                'muscle_rows': rows,
            }

    tracker_logged = {
        'weight': WeightLog.objects.filter(user=user, date_time__date=target_date).exists(),
        'water': WaterLog.objects.filter(user=user, date_time__date=target_date).exists(),
        'body_measurement': BodyMeasurementLog.objects.filter(user=user, date_time__date=target_date).exists(),
        'steps': StepsLog.objects.filter(user=user, date_time__date=target_date).exists(),
        'cardio': CardioLog.objects.filter(user=user, date_time__date=target_date).exists(),
        'sleep': SleepLog.objects.filter(user=user, date_time=target_date).exists(),
        'health_metrics': HealthMetricsLog.objects.filter(user=user, date_time=target_date).exists(),
    }
    tracker_labels = {
        'weight': 'Weight',
        'water': 'Water',
        'body_measurement': 'Body measurements',
        'steps': 'Steps',
        'cardio': 'Cardio',
        'sleep': 'Sleep',
        'health_metrics': 'Health metrics',
    }
    trackers_not_logged = [
        {'id': k, 'label': tracker_labels[k]}
        for k, v in tracker_logged.items() if not v
    ]

    return Response({
        'success': True,
        'data': {
            'date': target_date.isoformat(),
            'goals': goal_macros,
            'consumed': consumed,
            'macro_remaining': macro_remaining,
            'cardio_calories_burned': cardio_calories,
            'steps_today': steps_today,
            'steps_calories_estimate': steps_calories,
            'calorie_remaining': calorie_remaining,
            'split': split_section,
            'trackers_not_logged': trackers_not_logged,
            'weight_kg_used_for_steps': weight_kg,
            'height_cm': height_cm,
        },
    })
