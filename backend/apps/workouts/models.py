"""
Workout Models - Complete rewrite from scratch
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Muscle(models.Model):
    """Muscle definitions"""
    muscles_id = models.AutoField(primary_key=True)
    muscle_name = models.CharField(max_length=100, unique=True)
    muscle_group = models.CharField(max_length=50)
    
    class Meta:
        db_table = 'muscles'
    
    def __str__(self):
        return f"{self.muscle_name} ({self.muscle_group})"


class Workout(models.Model):
    """Workout definitions"""
    workouts_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    workout_name = models.CharField(max_length=200)  # Includes emoji
    equipment_brand = models.CharField(max_length=100, blank=True, null=True)
    type = models.CharField(max_length=50)  # barbell, dumbbell, etc.
    location = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    make_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'workouts'
    
    def __str__(self):
        return f"{self.workout_name} ({self.user.username})"


class WorkoutMuscle(models.Model):
    """Muscle activation ratings for workouts"""
    id = models.AutoField(primary_key=True)
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, db_column='workout_id')
    muscle = models.ForeignKey(Muscle, on_delete=models.CASCADE, db_column='muscle_id')
    activation_rating = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Muscle activation rating 0-100"
    )
    
    class Meta:
        db_table = 'workout_muscle'
        unique_together = ['workout', 'muscle']
    
    def __str__(self):
        return f"{self.workout.workout_name} - {self.muscle.muscle_name} ({self.activation_rating})"


class MuscleLog(models.Model):
    """User muscle priorities"""
    muscle_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    muscle_name = models.ForeignKey(Muscle, on_delete=models.CASCADE, db_column='muscle_name', to_field='muscle_name')
    priority = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        default=80,
        help_text="Muscle priority 1-100, default 80"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'muscle_log'
        unique_together = ['user', 'muscle_name']
    
    def __str__(self):
        return f"{self.user.username} - {self.muscle_name.muscle_name} (Priority: {self.priority})"


class WorkoutLog(models.Model):
    """Workout session logs"""
    workout_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, db_column='workout_id')
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    reps = models.IntegerField(null=True, blank=True)
    rir = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="Reps in reserve 0-10"
    )
    attributes = models.JSONField(default=list, blank=True)
    attribute_inputs = models.JSONField(default=dict, blank=True, help_text="Input values for attributes")
    rest_time = models.IntegerField(null=True, blank=True, help_text="Rest time in seconds")
    date_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'workout_log'
    
    def __str__(self):
        return f"{self.user.username} - {self.workout.workout_name} ({self.date_time.date()})"


class Split(models.Model):
    """Workout splits"""
    splits_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    split_name = models.CharField(max_length=200)
    start_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'splits'
    
    def __str__(self):
        return f"{self.split_name} ({self.user.username})"


class SplitDay(models.Model):
    """Days within a split"""
    split_days_id = models.AutoField(primary_key=True)
    split = models.ForeignKey(Split, on_delete=models.CASCADE, db_column='splits_id')
    day_name = models.CharField(max_length=100)
    day_order = models.IntegerField()
    
    class Meta:
        db_table = 'split_days'
        unique_together = ['split', 'day_order']
    
    def __str__(self):
        return f"{self.split.split_name} - {self.day_name}"


class SplitDayTarget(models.Model):
    """Muscle targets for each split day"""
    id = models.AutoField(primary_key=True)
    split_day = models.ForeignKey(SplitDay, on_delete=models.CASCADE, db_column='split_day_id')
    muscle = models.ForeignKey(Muscle, on_delete=models.CASCADE, db_column='muscle_id')
    target_activation = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="Target activation for this muscle on this day"
    )
    
    class Meta:
        db_table = 'split_day_targets'
        unique_together = ['split_day', 'muscle']
    
    def __str__(self):
        return f"{self.split_day.day_name} - {self.muscle.muscle_name} ({self.target_activation})"
