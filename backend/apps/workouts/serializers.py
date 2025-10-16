"""
Serializers for workouts app.
"""

from rest_framework import serializers
from .models import (
    Workout, Muscle, WorkoutLog, MuscleLog, WorkoutMuscle,
    Split, SplitDay, SplitDayTarget
)


class MuscleSerializer(serializers.ModelSerializer):
    """Serializer for Muscle model"""
    
    class Meta:
        model = Muscle
        fields = ['muscles_id', 'muscle_name', 'muscle_group']


class WorkoutMuscleSerializer(serializers.ModelSerializer):
    """Serializer for WorkoutMuscle junction table"""
    muscle_name = serializers.CharField(source='muscle.muscle_name', read_only=True)
    muscle_group = serializers.CharField(source='muscle.muscle_group', read_only=True)
    
    class Meta:
        model = WorkoutMuscle
        fields = ['muscle', 'muscle_name', 'muscle_group', 'activation_rating']


class WorkoutSerializer(serializers.ModelSerializer):
    """Serializer for Workout model"""
    workout_muscles = WorkoutMuscleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Workout
        fields = [
            'workouts_id', 'workout_name', 'equipment_brand', 'type',
            'location', 'notes', 'make_public', 'created_at', 'updated_at',
            'workout_muscles'
        ]
        read_only_fields = ['workouts_id', 'created_at', 'updated_at']


class WorkoutCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating workouts with muscle associations"""
    workout_muscles = WorkoutMuscleSerializer(many=True, required=False)
    
    class Meta:
        model = Workout
        fields = [
            'workout_name', 'equipment_brand', 'type', 'location',
            'notes', 'make_public', 'workout_muscles'
        ]
    
    def create(self, validated_data):
        """Create workout with associated muscles"""
        workout_muscles_data = validated_data.pop('workout_muscles', [])
        workout = Workout.objects.create(**validated_data)
        
        for muscle_data in workout_muscles_data:
            WorkoutMuscle.objects.create(
                workout=workout,
                muscle=muscle_data['muscle'],
                activation_rating=muscle_data['activation_rating']
            )
        
        return workout
    
    def update(self, instance, validated_data):
        """Update workout and its muscle associations"""
        workout_muscles_data = validated_data.pop('workout_muscles', [])
        
        # Update workout fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update muscle associations
        if workout_muscles_data:
            # Clear existing associations
            WorkoutMuscle.objects.filter(workout=instance).delete()
            
            # Create new associations
            for muscle_data in workout_muscles_data:
                WorkoutMuscle.objects.create(
                    workout=instance,
                    muscle=muscle_data['muscle'],
                    activation_rating=muscle_data['activation_rating']
                )
        
        return instance


class WorkoutLogSerializer(serializers.ModelSerializer):
    """Serializer for WorkoutLog model"""
    workout_name = serializers.CharField(source='workout.workout_name', read_only=True)
    
    class Meta:
        model = WorkoutLog
        fields = [
            'workout_log_id', 'workout', 'workout_name', 'weight', 'reps',
            'rir', 'attributes', 'rest_time', 'date_time', 'created_at'
        ]
        read_only_fields = ['workout_log_id', 'created_at']


class WorkoutLogCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating workout logs"""
    
    class Meta:
        model = WorkoutLog
        fields = [
            'workout', 'weight', 'reps', 'rir', 'attributes',
            'rest_time', 'date_time'
        ]


class MuscleLogSerializer(serializers.ModelSerializer):
    """Serializer for MuscleLog model"""
    muscle_name = serializers.CharField(source='muscle_name.muscle_name', read_only=True)
    muscle_group = serializers.CharField(source='muscle_name.muscle_group', read_only=True)
    
    class Meta:
        model = MuscleLog
        fields = ['muscle_log_id', 'muscle_name', 'muscle_group', 'importance', 'created_at']
        read_only_fields = ['muscle_log_id', 'created_at']


class MuscleLogCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating muscle logs"""
    
    class Meta:
        model = MuscleLog
        fields = ['muscle_name', 'importance']


class SplitDayTargetSerializer(serializers.ModelSerializer):
    """Serializer for SplitDayTarget model"""
    muscle_name = serializers.CharField(source='muscle.muscle_name', read_only=True)
    muscle_group = serializers.CharField(source='muscle.muscle_group', read_only=True)
    
    class Meta:
        model = SplitDayTarget
        fields = ['muscle', 'muscle_name', 'muscle_group', 'target_activation']


class SplitDaySerializer(serializers.ModelSerializer):
    """Serializer for SplitDay model"""
    targets = SplitDayTargetSerializer(many=True, read_only=True)
    
    class Meta:
        model = SplitDay
        fields = ['split_days_id', 'day_name', 'day_order', 'targets']
        read_only_fields = ['split_days_id']


class SplitSerializer(serializers.ModelSerializer):
    """Serializer for Split model"""
    split_days = SplitDaySerializer(many=True, read_only=True)
    
    class Meta:
        model = Split
        fields = [
            'splits_id', 'split_name', 'start_date', 'created_at', 'split_days'
        ]
        read_only_fields = ['splits_id', 'created_at']


class SplitCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating splits with days and targets"""
    split_days = serializers.ListField(child=serializers.DictField(), required=False)
    
    class Meta:
        model = Split
        fields = ['split_name', 'start_date', 'split_days']
    
    def create(self, validated_data):
        """Create split with associated days and targets"""
        split_days_data = validated_data.pop('split_days', [])
        split = Split.objects.create(**validated_data)
        
        for day_data in split_days_data:
            targets_data = day_data.pop('targets', [])
            split_day = SplitDay.objects.create(
                split=split,
                day_name=day_data['day_name'],
                day_order=day_data['day_order']
            )
            
            for target_data in targets_data:
                muscle = Muscle.objects.get(muscles_id=target_data['muscle'])
                SplitDayTarget.objects.create(
                    split_day=split_day,
                    muscle=muscle,
                    target_activation=target_data['target_activation']
                )
        
        return split
    
    def update(self, instance, validated_data):
        """Update split and its associated days and targets"""
        split_days_data = validated_data.pop('split_days', [])
        
        # Update split fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update split days and targets
        if split_days_data:
            # Clear existing days and targets
            SplitDay.objects.filter(split=instance).delete()
            
            # Create new days and targets
            for day_data in split_days_data:
                targets_data = day_data.pop('targets', [])
                split_day = SplitDay.objects.create(
                    split=instance,
                    day_name=day_data['day_name'],
                    day_order=day_data['day_order']
                )
                
            for target_data in targets_data:
                muscle = Muscle.objects.get(muscles_id=target_data['muscle'])
                SplitDayTarget.objects.create(
                    split_day=split_day,
                    muscle=muscle,
                    target_activation=target_data['target_activation']
                )
        
        return instance


class SplitAnalysisSerializer(serializers.Serializer):
    """Serializer for split analysis data"""
    muscle_name = serializers.CharField()
    muscle_group = serializers.CharField()
    total_activation = serializers.IntegerField()
    optimal_range_low = serializers.FloatField()
    optimal_range_high = serializers.FloatField()
    muscle_priority = serializers.IntegerField()
    status = serializers.CharField()  # 'warning', 'below', 'optimal', 'above'
    status_color = serializers.CharField()


class WorkoutStatsSerializer(serializers.Serializer):
    """Serializer for workout statistics"""
    total_workouts = serializers.IntegerField()
    total_muscles = serializers.IntegerField()
    recent_workouts = WorkoutSerializer(many=True)
    muscle_group_stats = serializers.DictField()
    equipment_stats = serializers.DictField()


class RecentlyLoggedWorkoutSerializer(serializers.Serializer):
    """Serializer for recently logged workouts"""
    workout_id = serializers.IntegerField()
    workout_name = serializers.CharField()
    last_logged = serializers.DateTimeField()
    last_weight = serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True)
    last_reps = serializers.IntegerField(allow_null=True)
    last_rir = serializers.IntegerField(allow_null=True)
    log_count = serializers.IntegerField()
