from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Workout(models.Model):
    """The specific workouts that a user has performed"""
    workouts_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    workout_name = models.CharField(max_length=200)
    equipment_brand = models.CharField(max_length=100, null=True, blank=True)
    type = models.CharField(max_length=20, choices=[
        ('barbell', 'Barbell'),
        ('dumbbell', 'Dumbbell'),
        ('plate_machine', 'Plate Machine'),
        ('cable_machine', 'Cable Machine'),
        ('bodyweight', 'Bodyweight'),
    ])
    location = models.CharField(max_length=100, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    make_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'workouts'

    def __str__(self):
        return f"{self.user.username} - {self.workout_name}"


class Muscle(models.Model):
    """The muscles in the human body"""
    muscles_id = models.AutoField(primary_key=True)
    muscle_name = models.CharField(max_length=100, unique=True)
    muscle_group = models.CharField(max_length=20, choices=[
        ('legs', 'Legs'),
        ('core', 'Core'),
        ('arms', 'Arms'),
        ('back', 'Back'),
        ('chest', 'Chest'),
        ('other', 'Other'),
    ])

    class Meta:
        db_table = 'muscles'

    def __str__(self):
        return self.muscle_name


class WorkoutLog(models.Model):
    """The log of workouts a user does"""
    workout_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, db_column='workout_id')
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    reps = models.IntegerField(null=True, blank=True)
    rir = models.IntegerField(null=True, blank=True)  # Reps in reserve
    attributes = models.JSONField(null=True, blank=True)  # Optional details like dropset, assisted, etc.
    rest_time = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)  # Rest time before workout
    date_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'workout_log'

    def __str__(self):
        return f"{self.user.username} - {self.workout.workout_name} ({self.date_time})"


class MuscleLog(models.Model):
    """List of all the muscles in the human body"""
    muscle_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    muscle_name = models.ForeignKey(Muscle, on_delete=models.CASCADE, db_column='muscle_name', to_field='muscle_name')
    importance = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(100)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'muscle_log'

    def __str__(self):
        return f"{self.user.username} - {self.muscle_name.muscle_name} (Importance: {self.importance})"


class WorkoutMuscle(models.Model):
    """Gives each workout a list of activation ratings for each muscle"""
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, db_column='workout_id')
    muscle = models.ForeignKey(Muscle, on_delete=models.CASCADE, db_column='muscle_id')
    activation_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(100)])

    class Meta:
        db_table = 'workout_muscle'
        unique_together = ('workout', 'muscle')

    def __str__(self):
        return f"{self.workout.workout_name} - {self.muscle.muscle_name} ({self.activation_rating}%)"


class Split(models.Model):
    """The different splits that a user has"""
    splits_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    split_name = models.CharField(max_length=100)
    start_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'splits'

    def __str__(self):
        return f"{self.user.username} - {self.split_name}"


class SplitDay(models.Model):
    """Days within a split"""
    split_days_id = models.AutoField(primary_key=True)
    split = models.ForeignKey(Split, on_delete=models.CASCADE, db_column='splits_id')
    day_name = models.CharField(max_length=100)
    day_order = models.IntegerField()

    class Meta:
        db_table = 'split_days'

    def __str__(self):
        return f"{self.split.split_name} - {self.day_name} (Order: {self.day_order})"


class SplitDayTarget(models.Model):
    """Target muscle activation for each split day"""
    split_day = models.ForeignKey(SplitDay, on_delete=models.CASCADE, db_column='split_day_id')
    muscle = models.ForeignKey(Muscle, on_delete=models.CASCADE, db_column='muscle_id')
    target_activation = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(100)])

    class Meta:
        db_table = 'split_day_targets'
        unique_together = ('split_day', 'muscle')

    def __str__(self):
        return f"{self.split_day.day_name} - {self.muscle.muscle_name} (Target: {self.target_activation}%)"
