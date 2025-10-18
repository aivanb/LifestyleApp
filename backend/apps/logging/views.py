from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import date, timedelta

from apps.logging.models import (
    WeightLog, BodyMeasurementLog, WaterLog, 
    StepsLog, CardioLog
)
from apps.health.models import SleepLog, HealthMetricsLog
from apps.logging.serializers import (
    WeightLogSerializer, BodyMeasurementLogSerializer, WaterLogSerializer,
    StepsLogSerializer, CardioLogSerializer
)


# --- Weight Log Views ---
class WeightLogListCreateView(generics.ListCreateAPIView):
    serializer_class = WeightLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = WeightLog.objects.filter(user=user).order_by('-created_at')
        
        # Filter by date if provided
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                log_date = date.fromisoformat(date_param)
                queryset = queryset.filter(created_at__date=log_date)
            except ValueError:
                pass
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WeightLogRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WeightLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WeightLog.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_weight_streak(request):
    """Calculate consecutive days of weight logging"""
    user = request.user
    today = date.today()
    streak = 0
    
    # Check backwards from today
    for i in range(365):  # Max 1 year back
        check_date = today - timedelta(days=i)
        if WeightLog.objects.filter(user=user, created_at__date=check_date).exists():
            streak += 1
        else:
            break
    
    return Response({"streak": streak}, status=status.HTTP_200_OK)


# --- Body Measurement Log Views ---
class BodyMeasurementLogListCreateView(generics.ListCreateAPIView):
    serializer_class = BodyMeasurementLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = BodyMeasurementLog.objects.filter(user=user).order_by('-created_at')
        
        # Filter by date if provided
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                log_date = date.fromisoformat(date_param)
                queryset = queryset.filter(created_at__date=log_date)
            except ValueError:
                pass
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BodyMeasurementLogRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BodyMeasurementLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BodyMeasurementLog.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_body_measurement_streak(request):
    """Calculate consecutive days of body measurement logging"""
    user = request.user
    today = date.today()
    streak = 0
    
    # Check backwards from today
    for i in range(365):  # Max 1 year back
        check_date = today - timedelta(days=i)
        if BodyMeasurementLog.objects.filter(user=user, created_at__date=check_date).exists():
            streak += 1
        else:
            break
    
    return Response({"streak": streak}, status=status.HTTP_200_OK)


# --- Water Log Views ---
class WaterLogListCreateView(generics.ListCreateAPIView):
    serializer_class = WaterLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = WaterLog.objects.filter(user=user).order_by('-created_at')
        
        # Filter by date if provided
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                log_date = date.fromisoformat(date_param)
                queryset = queryset.filter(created_at__date=log_date)
            except ValueError:
                pass
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WaterLogRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WaterLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WaterLog.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_water_streak(request):
    """Calculate consecutive days of water logging"""
    user = request.user
    today = date.today()
    streak = 0
    
    # Check backwards from today
    for i in range(365):  # Max 1 year back
        check_date = today - timedelta(days=i)
        if WaterLog.objects.filter(user=user, created_at__date=check_date).exists():
            streak += 1
        else:
            break
    
    return Response({"streak": streak}, status=status.HTTP_200_OK)


# --- Steps Log Views ---
class StepsLogListCreateView(generics.ListCreateAPIView):
    serializer_class = StepsLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = StepsLog.objects.filter(user=user).order_by('-date_time')
        
        # Filter by date if provided
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                log_date = date.fromisoformat(date_param)
                queryset = queryset.filter(date_time__date=log_date)
            except ValueError:
                pass
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StepsLogRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StepsLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StepsLog.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_steps_streak(request):
    """Calculate consecutive days of steps logging"""
    user = request.user
    today = date.today()
    streak = 0
    
    # Check backwards from today
    for i in range(365):  # Max 1 year back
        check_date = today - timedelta(days=i)
        if StepsLog.objects.filter(user=user, date_time__date=check_date).exists():
            streak += 1
        else:
            break
    
    return Response({"streak": streak}, status=status.HTTP_200_OK)


# --- Cardio Log Views ---
class CardioLogListCreateView(generics.ListCreateAPIView):
    serializer_class = CardioLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = CardioLog.objects.filter(user=user).order_by('-date_time')
        
        # Filter by date if provided
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                log_date = date.fromisoformat(date_param)
                queryset = queryset.filter(date_time__date=log_date)
            except ValueError:
                pass
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CardioLogRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CardioLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CardioLog.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cardio_streak(request):
    """Calculate consecutive days of cardio logging"""
    user = request.user
    today = date.today()
    streak = 0
    
    # Check backwards from today
    for i in range(365):  # Max 1 year back
        check_date = today - timedelta(days=i)
        if CardioLog.objects.filter(user=user, date_time__date=check_date).exists():
            streak += 1
        else:
            break
    
    return Response({"streak": streak}, status=status.HTTP_200_OK)




# --- All Trackers Streak View ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_tracker_streaks(request):
    """Get streaks for all tracker types"""
    user = request.user
    today = date.today()
    
    def calculate_streak(model_class, date_field='created_at'):
        streak = 0
        for i in range(365):  # Max 1 year back
            check_date = today - timedelta(days=i)
            filter_kwargs = {f'{date_field}__date': check_date}
            if date_field == 'date_time' and hasattr(model_class.objects.first(), 'date_time'):
                # For models with date_time field that's a DateField
                filter_kwargs = {date_field: check_date}
            elif date_field == 'created_at':
                filter_kwargs = {f'{date_field}__date': check_date}
            
            if model_class.objects.filter(user=user, **filter_kwargs).exists():
                streak += 1
            else:
                break
        return streak
    
    streaks = {
        'weight': calculate_streak(WeightLog, 'created_at'),
        'body_measurement': calculate_streak(BodyMeasurementLog, 'created_at'),
        'water': calculate_streak(WaterLog, 'created_at'),
        'steps': calculate_streak(StepsLog, 'date_time'),
        'cardio': calculate_streak(CardioLog, 'date_time'),
        'sleep': calculate_streak(SleepLog, 'date_time'),
        'health_metrics': calculate_streak(HealthMetricsLog, 'date_time'),
    }
    
    return Response(streaks, status=status.HTTP_200_OK)