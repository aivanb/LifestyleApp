"""
Profile API Views

Provides comprehensive profile management including:
- User personal information CRUD
- Goal management and macro calculations
- Body metrics calculations
- Historical data analysis
- Weight change recommendations
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta
from decimal import Decimal
from .models import User, UserGoal, Unit, ActivityLevel
from .services import BodyMetricsService
from apps.logging.models import WeightLog, BodyMeasurementLog


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_detail(request):
    """
    Get or update user profile information.
    
    GET: Returns complete user profile with calculated metrics
    PUT: Updates user profile information
    """
    user = request.user
    
    if request.method == 'GET':
        try:
            # Get user goals - handle case where multiple goals exist (get most recent)
            try:
                goals = UserGoal.objects.filter(user=user).order_by('-updated_at', '-created_at').first()
            except UserGoal.DoesNotExist:
                goals = None
            
            # Get latest weight and measurements
            latest_weight = WeightLog.objects.filter(user=user).order_by('-created_at').first()
            latest_measurements = BodyMeasurementLog.objects.filter(user=user).order_by('-created_at').first()
            
            # Prepare user data for metrics calculation
            user_data = {
                'height': float(user.height) if user.height else 0,
                'weight': float(latest_weight.weight) if latest_weight else 0,
                'age': user.age if hasattr(user, 'age') else 0,
                'gender': user.gender or 'other',
                'activity_level': user.activity_level.name if user.activity_level else 'sedentary',
                'birthday': user.birthday,
                'measurements': {
                    'waist': float(latest_measurements.waist) if latest_measurements and latest_measurements.waist else 0,
                    'shoulder': float(latest_measurements.shoulder) if latest_measurements and latest_measurements.shoulder else 0,
                    'leg': float(latest_measurements.leg) if latest_measurements and latest_measurements.leg else 0,
                } if latest_measurements else {}
            }
            
            # Calculate body metrics
            metrics_service = BodyMetricsService(user_data)
            metrics = metrics_service.get_all_metrics()
            
            # Calculate historical data
            historical_data = _calculate_historical_data(user)
            
            # Prepare response
            profile_data = {
                'user': {
                    'user_id': user.user_id,
                    'username': user.username,
                    'email': user.email,
                    'height': float(user.height) if user.height else None,
                    'birthday': user.birthday.isoformat() if user.birthday else None,
                    'gender': user.gender,
                    'unit_preference': {
                        'unit_id': user.unit_preference.unit_id,
                        'unit_name': user.unit_preference.unit_name
                    } if user.unit_preference else None,
                    'activity_level': {
                        'activity_level_id': user.activity_level.activity_level_id,
                        'name': user.activity_level.name,
                        'description': user.activity_level.description
                    } if user.activity_level else None,
                    'created_at': user.created_at.isoformat(),
                    'updated_at': user.updated_at.isoformat()
                },
                'goals': {
                    'weight_goal': float(goals.weight_goal) if goals and goals.weight_goal else None,
                    'lean_mass_goal': float(goals.lean_mass_goal) if goals and goals.lean_mass_goal else None,
                    'fat_mass_goal': float(goals.fat_mass_goal) if goals and goals.fat_mass_goal else None,
                    'cost_goal': float(goals.cost_goal) if goals and goals.cost_goal else None,
                    'calories_goal': goals.calories_goal,
                    'protein_goal': float(goals.protein_goal) if goals and goals.protein_goal else None,
                    'fat_goal': float(goals.fat_goal) if goals and goals.fat_goal else None,
                    'carbohydrates_goal': float(goals.carbohydrates_goal) if goals and goals.carbohydrates_goal else None,
                    'fiber_goal': float(goals.fiber_goal) if goals and goals.fiber_goal else None,
                    'sodium_goal': float(goals.sodium_goal) if goals and goals.sodium_goal else None,
                    'sugar_goal': float(goals.sugar_goal) if goals and goals.sugar_goal else None,
                    'saturated_fat_goal': float(goals.saturated_fat_goal) if goals and goals.saturated_fat_goal else None,
                    'trans_fat_goal': float(goals.trans_fat_goal) if goals and goals.trans_fat_goal else None,
                    'calcium_goal': float(goals.calcium_goal) if goals and goals.calcium_goal else None,
                    'iron_goal': float(goals.iron_goal) if goals and goals.iron_goal else None,
                    'magnesium_goal': float(goals.magnesium_goal) if goals and goals.magnesium_goal else None,
                    'cholesterol_goal': float(goals.cholesterol_goal) if goals and goals.cholesterol_goal else None,
                    'vitamin_a_goal': float(goals.vitamin_a_goal) if goals and goals.vitamin_a_goal else None,
                    'vitamin_c_goal': float(goals.vitamin_c_goal) if goals and goals.vitamin_c_goal else None,
                    'vitamin_d_goal': float(goals.vitamin_d_goal) if goals and goals.vitamin_d_goal else None,
                    'caffeine_goal': float(goals.caffeine_goal) if goals and goals.caffeine_goal else None,
                } if goals else {},
                'metrics': metrics,
                'historical': historical_data
            }
            
            return Response({'data': profile_data})
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            return Response({
                'error': {
                    'message': f'Failed to load profile data: {str(e)}',
                    'details': error_details if settings.DEBUG else None
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'PUT':
        # Update user profile
        data = request.data
        
        try:
            with transaction.atomic():
                # Update basic user information
                if 'height' in data:
                    user.height = Decimal(str(data['height'])) if data['height'] else None
                
                if 'birthday' in data:
                    if data['birthday']:
                        user.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
                    else:
                        user.birthday = None
                
                if 'gender' in data:
                    user.gender = data['gender']
                
                if 'unit_preference' in data and data['unit_preference']:
                    try:
                        unit = Unit.objects.get(unit_id=data['unit_preference'])
                        user.unit_preference = unit
                    except Unit.DoesNotExist:
                        pass
                
                if 'activity_level' in data and data['activity_level']:
                    try:
                        activity = ActivityLevel.objects.get(activity_level_id=data['activity_level'])
                        user.activity_level = activity
                    except ActivityLevel.DoesNotExist:
                        pass
                
                user.save()
                
                return Response({
                    'data': {'message': 'Profile updated successfully'}
                })
                
        except Exception as e:
            return Response({
                'error': {'message': f'Failed to update profile: {str(e)}'}
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def goals_detail(request):
    """
    Get or update user goals.
    
    GET: Returns current user goals
    PUT: Updates user goals
    """
    user = request.user
    
    if request.method == 'GET':
        # Get most recent goal, or create one if none exist
        goals = UserGoal.objects.filter(user=user).order_by('-updated_at', '-created_at').first()
        if not goals:
            goals = UserGoal.objects.create(user=user)
        
        goals_data = {
            'weight_goal': float(goals.weight_goal) if goals.weight_goal else None,
            'lean_mass_goal': float(goals.lean_mass_goal) if goals.lean_mass_goal else None,
            'fat_mass_goal': float(goals.fat_mass_goal) if goals.fat_mass_goal else None,
            'cost_goal': float(goals.cost_goal) if goals.cost_goal else None,
            'calories_goal': goals.calories_goal,
            'protein_goal': float(goals.protein_goal) if goals.protein_goal else None,
            'fat_goal': float(goals.fat_goal) if goals.fat_goal else None,
            'carbohydrates_goal': float(goals.carbohydrates_goal) if goals.carbohydrates_goal else None,
            'fiber_goal': float(goals.fiber_goal) if goals.fiber_goal else None,
            'sodium_goal': float(goals.sodium_goal) if goals.sodium_goal else None,
            'sugar_goal': float(goals.sugar_goal) if goals.sugar_goal else None,
            'saturated_fat_goal': float(goals.saturated_fat_goal) if goals.saturated_fat_goal else None,
            'trans_fat_goal': float(goals.trans_fat_goal) if goals.trans_fat_goal else None,
            'calcium_goal': float(goals.calcium_goal) if goals.calcium_goal else None,
            'iron_goal': float(goals.iron_goal) if goals.iron_goal else None,
            'magnesium_goal': float(goals.magnesium_goal) if goals.magnesium_goal else None,
            'cholesterol_goal': float(goals.cholesterol_goal) if goals.cholesterol_goal else None,
            'vitamin_a_goal': float(goals.vitamin_a_goal) if goals.vitamin_a_goal else None,
            'vitamin_c_goal': float(goals.vitamin_c_goal) if goals.vitamin_c_goal else None,
            'vitamin_d_goal': float(goals.vitamin_d_goal) if goals.vitamin_d_goal else None,
            'caffeine_goal': float(goals.caffeine_goal) if goals.caffeine_goal else None,
        }
        
        return Response({'data': goals_data})
    
    elif request.method == 'PUT':
        data = request.data
        
        try:
            with transaction.atomic():
                # Get most recent goal, or create one if none exist
                goals = UserGoal.objects.filter(user=user).order_by('-updated_at', '-created_at').first()
                if not goals:
                    goals = UserGoal.objects.create(user=user)
                
                # Update goals
                goal_fields = [
                    'weight_goal', 'lean_mass_goal', 'fat_mass_goal', 'cost_goal',
                    'calories_goal', 'protein_goal', 'fat_goal', 'carbohydrates_goal',
                    'fiber_goal', 'sodium_goal', 'sugar_goal', 'saturated_fat_goal',
                    'trans_fat_goal', 'calcium_goal', 'iron_goal', 'magnesium_goal',
                    'cholesterol_goal', 'vitamin_a_goal', 'vitamin_c_goal',
                    'vitamin_d_goal', 'caffeine_goal'
                ]
                
                for field in goal_fields:
                    if field in data:
                        if field == 'calories_goal':
                            goals.calories_goal = data[field]
                        else:
                            setattr(goals, field, Decimal(str(data[field])) if data[field] is not None else None)
                
                goals.save()
                
                return Response({
                    'data': {'message': 'Goals updated successfully'}
                })
                
        except Exception as e:
            return Response({
                'error': {'message': f'Failed to update goals: {str(e)}'}
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_macro_goals(request):
    """
    Calculate macro goals based on weight goal and timeframe.
    
    Expected payload:
    {
        "weight_goal": 70.0,
        "timeframe_weeks": 12
    }
    
    Returns calculated macros with warnings.
    """
    user = request.user
    data = request.data
    
    weight_goal = data.get('weight_goal')
    timeframe_weeks = data.get('timeframe_weeks')
    
    if not weight_goal or not timeframe_weeks:
        return Response({
            'error': {'message': 'Weight goal and timeframe are required'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get latest weight
        latest_weight = WeightLog.objects.filter(user=user).order_by('-created_at').first()
        if not latest_weight:
            return Response({
                'error': {'message': 'No weight data found. Please log your current weight first.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare user data for calculation
        user_data = {
            'height': float(user.height) if user.height else 0,
            'weight': float(latest_weight.weight),
            'age': user.age if hasattr(user, 'age') else 0,
            'gender': user.gender,
            'activity_level': user.activity_level.name if user.activity_level else 'sedentary',
            'birthday': user.birthday,
            'measurements': {}
        }
        
        # Calculate macros
        metrics_service = BodyMetricsService(user_data)
        result = metrics_service.calculate_macro_goals(weight_goal, timeframe_weeks)
        
        if not result['success']:
            return Response({
                'error': {'message': result['error']}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'data': result})
        
    except Exception as e:
        return Response({
            'error': {'message': f'Calculation failed: {str(e)}'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def body_metrics(request):
    """
    Get calculated body metrics for the user.
    
    Returns comprehensive body metrics including BMI, BMR, TDEE, etc.
    """
    user = request.user
    
    try:
        # Get latest weight and measurements
        latest_weight = WeightLog.objects.filter(user=user).order_by('-created_at').first()
        latest_measurements = BodyMeasurementLog.objects.filter(user=user).order_by('-created_at').first()
        
        if not latest_weight:
            return Response({
                'error': {'message': 'No weight data found. Please log your current weight first.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare user data
        user_data = {
            'height': float(user.height) if user.height else 0,
            'weight': float(latest_weight.weight),
            'age': user.age if hasattr(user, 'age') else 0,
            'gender': user.gender,
            'activity_level': user.activity_level.name if user.activity_level else 'sedentary',
            'birthday': user.birthday,
            'measurements': {
                'waist': float(latest_measurements.waist) if latest_measurements and latest_measurements.waist else 0,
                'shoulder': float(latest_measurements.shoulder) if latest_measurements and latest_measurements.shoulder else 0,
                'leg': float(latest_measurements.leg) if latest_measurements and latest_measurements.leg else 0,
            } if latest_measurements else {}
        }
        
        # Calculate metrics
        metrics_service = BodyMetricsService(user_data)
        metrics = metrics_service.get_all_metrics()
        
        return Response({'data': metrics})
        
    except Exception as e:
        return Response({
            'error': {'message': f'Failed to calculate metrics: {str(e)}'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historical_data(request):
    """
    Get historical weight and measurement data.
    
    Returns weight change trends and recommendations.
    """
    user = request.user
    
    try:
        historical_data = _calculate_historical_data(user)
        return Response({'data': historical_data})
        
    except Exception as e:
        return Response({
            'error': {'message': f'Failed to get historical data: {str(e)}'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _calculate_historical_data(user):
    """
    Calculate historical data for weight changes and trends.
    
    Args:
        user: User object
        
    Returns:
        Dict with historical data and recommendations
    """
    try:
        # Get weight logs
        weight_logs = WeightLog.objects.filter(user=user).order_by('created_at')
        
        if not weight_logs.exists():
            return {
                'total_weight_change': 0,
                'weekly_recommendation': 0,
                'weight_trend': 'no_data',
                'weight_logs': []
            }
        
        first_log = weight_logs.first()
        last_log = weight_logs.last()
        
        # Calculate total weight change
        first_weight = float(first_log.weight) if first_log and first_log.weight else 0
        latest_weight = float(last_log.weight) if last_log and last_log.weight else 0
        total_change = latest_weight - first_weight
        
        # Calculate time span
        if first_log and last_log and first_log.created_at and last_log.created_at:
            first_date = first_log.created_at
            latest_date = last_log.created_at
            days_span = (latest_date - first_date).days
        else:
            days_span = 0
        
        # Calculate weekly recommendation
        weekly_change = (total_change / days_span) * 7 if days_span > 0 else 0
        
        # Determine trend
        if abs(weekly_change) < 0.1:
            trend = 'stable'
        elif weekly_change > 0:
            trend = 'gaining'
        else:
            trend = 'losing'
        
        # Prepare weight logs for response
        weight_logs_data = []
        for log in weight_logs:
            if log and log.weight is not None:
                weight_logs_data.append({
                    'weight': float(log.weight),
                    'date': log.created_at.isoformat() if log.created_at else log.date_time.isoformat() if hasattr(log, 'date_time') and log.date_time else None,
                    'weight_unit': log.weight_unit if hasattr(log, 'weight_unit') else None
                })
        
        return {
            'total_weight_change': round(total_change, 2),
            'weekly_recommendation': round(weekly_change, 2),
            'weight_trend': trend,
            'weight_logs': weight_logs_data,
            'time_span_days': days_span,
            'first_weight': first_weight,
            'latest_weight': latest_weight
        }
    except Exception as e:
        # Return safe defaults if calculation fails
        import traceback
        if settings.DEBUG:
            print(f"Error calculating historical data: {str(e)}")
            print(traceback.format_exc())
        return {
            'total_weight_change': 0,
            'weekly_recommendation': 0,
            'weight_trend': 'no_data',
            'weight_logs': [],
            'error': str(e) if settings.DEBUG else None
        }
