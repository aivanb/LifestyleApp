"""
Workout Serializers - Complete rewrite from scratch
"""

from rest_framework import serializers
from .models import Workout, Muscle, WorkoutMuscle, MuscleLog, WorkoutLog, Split, SplitDay, SplitDayTarget


class MuscleSerializer(serializers.ModelSerializer):
    """Serializer for Muscle model"""
    
    class Meta:
        model = Muscle
        fields = ['muscles_id', 'muscle_name', 'muscle_group']


class WorkoutMuscleSerializer(serializers.ModelSerializer):
    """Serializer for WorkoutMuscle model"""
    muscle_name = serializers.CharField(source='muscle.muscle_name', read_only=True)
    muscle_group = serializers.CharField(source='muscle.muscle_group', read_only=True)
    
    class Meta:
        model = WorkoutMuscle
        fields = ['id', 'muscle', 'muscle_name', 'muscle_group', 'activation_rating']


class WorkoutSerializer(serializers.ModelSerializer):
    """Serializer for Workout model"""
    muscles = WorkoutMuscleSerializer(source='workoutmuscle_set', many=True, read_only=True)
    recent_log = serializers.SerializerMethodField()
    
    class Meta:
        model = Workout
        fields = [
            'workouts_id', 'workout_name', 'equipment_brand', 'type', 
            'location', 'notes', 'make_public', 'created_at', 'updated_at', 'muscles', 'recent_log'
        ]
        read_only_fields = ['workouts_id', 'created_at', 'updated_at']
    
    def get_recent_log(self, obj):
        """Get the most recent workout log for this workout"""
        try:
            # Get the user from context
            user = self.context['request'].user
            recent_log = WorkoutLog.objects.filter(
                workout=obj, 
                user=user
            ).order_by('-date_time').first()
            
            if recent_log:
                return {
                    'last_weight': recent_log.weight,
                    'last_reps': recent_log.reps,
                    'last_rir': recent_log.rir,
                    'last_rest_time': recent_log.rest_time,
                    'last_attributes': recent_log.attributes,
                    'last_date': recent_log.date_time
                }
            return None
        except:
            return None


class WorkoutCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating workouts"""
    muscles = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="List of muscles with activation ratings"
    )
    
    class Meta:
        model = Workout
        fields = [
            'workout_name', 'equipment_brand', 'type', 'location', 
            'notes', 'make_public', 'muscles'
        ]
    
    def create(self, validated_data):
        """Create workout with associated muscles"""
        muscles_data = validated_data.pop('muscles', [])
        workout = Workout.objects.create(**validated_data)
        
        for muscle_data in muscles_data:
            WorkoutMuscle.objects.create(
                workout=workout,
                muscle_id=muscle_data['muscle'],
                activation_rating=muscle_data['activation_rating']
            )
        
        return workout


class WorkoutLogSerializer(serializers.ModelSerializer):
    """Serializer for WorkoutLog model"""
    workout_name = serializers.CharField(source='workout.workout_name', read_only=True)
    workout = WorkoutSerializer(read_only=True)  # Include full workout object
    
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
    muscle_id = serializers.IntegerField(source='muscle_name.muscles_id', read_only=True)
    
    class Meta:
        model = MuscleLog
        fields = ['muscle_log_id', 'muscle_name', 'muscle_group', 'muscle_id', 'priority', 'created_at']
        read_only_fields = ['muscle_log_id', 'created_at']


class MuscleLogCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating muscle logs"""
    
    class Meta:
        model = MuscleLog
        fields = ['muscle_name', 'priority']


class SplitDayTargetSerializer(serializers.ModelSerializer):
    """Serializer for SplitDayTarget model"""
    muscle_name = serializers.CharField(source='muscle.muscle_name', read_only=True)
    muscle_group = serializers.CharField(source='muscle.muscle_group', read_only=True)
    
    class Meta:
        model = SplitDayTarget
        fields = ['muscle', 'muscle_name', 'muscle_group', 'target_activation']


class SplitDaySerializer(serializers.ModelSerializer):
    """Serializer for SplitDay model"""
    targets = SplitDayTargetSerializer(source='splitdaytarget_set', many=True, read_only=True)
    
    class Meta:
        model = SplitDay
        fields = ['split_days_id', 'day_name', 'day_order', 'targets']


class SplitSerializer(serializers.ModelSerializer):
    """Serializer for Split model"""
    split_days = SplitDaySerializer(source='splitday_set', many=True, read_only=True)
    analysis = serializers.SerializerMethodField()
    
    class Meta:
        model = Split
        fields = [
            'splits_id', 'split_name', 'start_date', 
            'created_at', 'split_days', 'analysis'
        ]
        read_only_fields = ['splits_id', 'created_at']
    
    def get_analysis(self, obj):
        """Calculate split analysis"""
        if not obj.splitday_set.exists():
            return []
        
        # Get user's muscle priorities
        user = self.context['request'].user
        muscle_logs = MuscleLog.objects.filter(user=user)
        
        analysis = []
        num_days = obj.splitday_set.count()
        
        for muscle_log in muscle_logs:
            priority = muscle_log.priority
            muscle_id = muscle_log.muscle_name.muscles_id
            
            # Calculate total activation across all days
            total_activation = 0
            for split_day in obj.splitday_set.all():
                target = SplitDayTarget.objects.filter(
                    split_day=split_day, 
                    muscle_id=muscle_id
                ).first()
                if target:
                    total_activation += target.target_activation
            
            # Calculate optimal range
            lower_end = 90 * (10 + 0.1 * priority) * 7 / num_days
            upper_end = 90 * (20 + 0.1 * priority) * 7 * num_days
            
            # Determine status
            if total_activation == 0:
                status = 'warning'
                status_color = '#E74C3C'
            elif total_activation < lower_end:
                status = 'below'
                status_color = '#95A5A6'
            elif total_activation <= upper_end * 1.15:
                status = 'optimal'
                status_color = '#27AE60'
            else:
                status = 'above'
                status_color = '#E74C3C'
            
            analysis.append({
                'muscle_name': muscle_log.muscle_name.muscle_name,
                'muscle_group': muscle_log.muscle_name.muscle_group,
                'total_activation': total_activation,
                'optimal_range_low': round(lower_end, 1),
                'optimal_range_high': round(upper_end, 1),
                'muscle_priority': priority,
                'status': status,
                'status_color': status_color
            })
        
        return analysis


class SplitCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating splits"""
    split_days = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="List of split days with targets"
    )
    
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
                SplitDayTarget.objects.create(
                    split_day=split_day,
                    muscle_id=target_data['muscle'],
                    target_activation=target_data['target_activation']
                )
        
        return split


class WorkoutStatsSerializer(serializers.Serializer):
    """Serializer for workout statistics"""
    total_sets = serializers.IntegerField()
    total_weight_lifted = serializers.IntegerField()
    total_reps = serializers.IntegerField()
    total_rir = serializers.IntegerField()
    total_workouts = serializers.IntegerField()
    total_muscles = serializers.IntegerField()
    recent_workouts = WorkoutSerializer(many=True)
    muscle_group_stats = serializers.DictField()
    equipment_stats = serializers.DictField()
