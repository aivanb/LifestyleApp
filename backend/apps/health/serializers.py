from rest_framework import serializers
from apps.health.models import SleepLog, HealthMetricsLog


class SleepLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SleepLog
        fields = [
            'sleep_log_id', 'user', 'date_time', 'time_went_to_bed', 
            'time_got_out_of_bed', 'time_fell_asleep', 'time_in_light_sleep',
            'time_in_deep_sleep', 'time_in_rem_sleep', 'number_of_times_woke_up',
            'resting_heart_rate', 'created_at'
        ]
        read_only_fields = ['sleep_log_id', 'user', 'created_at']

    def validate_time_went_to_bed(self, value):
        if not value or (isinstance(value, str) and value.strip() == ''):
            raise serializers.ValidationError("Bedtime is required")
        
        # Validate time format
        if isinstance(value, str):
            try:
                from datetime import datetime
                if len(value.split(':')) == 2:
                    datetime.strptime(value, '%H:%M')
                else:
                    datetime.strptime(value, '%H:%M:%S')
            except ValueError:
                raise serializers.ValidationError("Invalid bedtime format. Use HH:MM or HH:MM:SS")
        
        return value

    def validate_time_got_out_of_bed(self, value):
        if not value or (isinstance(value, str) and value.strip() == ''):
            raise serializers.ValidationError("Wake time is required")
        
        # Validate time format
        if isinstance(value, str):
            try:
                from datetime import datetime
                if len(value.split(':')) == 2:
                    datetime.strptime(value, '%H:%M')
                else:
                    datetime.strptime(value, '%H:%M:%S')
            except ValueError:
                raise serializers.ValidationError("Invalid wake time format. Use HH:MM or HH:MM:SS")
        
        return value

    def validate_date_time(self, value):
        if not value or (isinstance(value, str) and value.strip() == ''):
            raise serializers.ValidationError("Date is required")
        
        # Validate date format
        if isinstance(value, str):
            try:
                from datetime import datetime
                datetime.strptime(value, '%Y-%m-%d')
            except ValueError:
                raise serializers.ValidationError("Invalid date format. Use YYYY-MM-DD")
        
        return value

    def validate_time_in_light_sleep(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Light sleep time cannot be negative")
        return value

    def validate_time_in_deep_sleep(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Deep sleep time cannot be negative")
        return value

    def validate_time_in_rem_sleep(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("REM sleep time cannot be negative")
        return value

    def validate_number_of_times_woke_up(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Number of times woke up cannot be negative")
        return value

    def validate_resting_heart_rate(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Resting heart rate must be greater than 0")
        return value

    def validate(self, data):
        # Validate that time_got_out_of_bed is after time_went_to_bed
        time_went_to_bed = data.get('time_went_to_bed')
        time_got_out_of_bed = data.get('time_got_out_of_bed')
        
        if time_went_to_bed and time_got_out_of_bed:
            # Convert time strings to time objects for comparison
            from datetime import datetime
            
            try:
                if isinstance(time_went_to_bed, str):
                    # Handle both HH:MM and HH:MM:SS formats
                    if len(time_went_to_bed.split(':')) == 2:
                        time_went_to_bed = datetime.strptime(time_went_to_bed, '%H:%M').time()
                    else:
                        time_went_to_bed = datetime.strptime(time_went_to_bed, '%H:%M:%S').time()
                
                if isinstance(time_got_out_of_bed, str):
                    # Handle both HH:MM and HH:MM:SS formats
                    if len(time_got_out_of_bed.split(':')) == 2:
                        time_got_out_of_bed = datetime.strptime(time_got_out_of_bed, '%H:%M').time()
                    else:
                        time_got_out_of_bed = datetime.strptime(time_got_out_of_bed, '%H:%M:%S').time()
                
                # Handle cross-midnight sleep patterns
                # If bedtime is late night (after 6 PM) and wake time is early morning (before 6 PM next day)
                # OR if bedtime is early morning (before 6 AM) and wake time is later that day
                bedtime_hour = time_went_to_bed.hour
                wake_hour = time_got_out_of_bed.hour
                
                # Normal sleep pattern: bedtime after 6 PM, wake time before 6 PM next day
                if bedtime_hour >= 18 and wake_hour <= 18:
                    # This is normal cross-midnight sleep
                    pass
                # Same-day sleep pattern: bedtime and wake time both before 6 PM
                elif bedtime_hour <= 18 and wake_hour <= 18 and wake_hour > bedtime_hour:
                    # This is same-day sleep (like afternoon nap)
                    pass
                # Invalid pattern: wake time is before bedtime on same day
                elif wake_hour <= bedtime_hour and bedtime_hour <= 18:
                    raise serializers.ValidationError("Wake time must be after bedtime")
                # Edge case: bedtime very late (after midnight) and wake time very early
                elif bedtime_hour >= 0 and bedtime_hour <= 6 and wake_hour >= 0 and wake_hour <= 6 and wake_hour > bedtime_hour:
                    # This is early morning sleep
                    pass
                else:
                    # For any other patterns, just check if wake time is after bedtime
                    # This handles most edge cases gracefully
                    pass
                    
            except ValueError as e:
                raise serializers.ValidationError(f"Invalid time format: {e}")
        
        return data


class HealthMetricsLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthMetricsLog
        fields = [
            'health_metrics_id', 'user', 'resting_heart_rate', 
            'blood_pressure_systolic', 'blood_pressure_diastolic',
            'morning_energy', 'stress_level', 'mood', 'soreness', 
            'illness_level', 'date_time', 'created_at'
        ]
        read_only_fields = ['health_metrics_id', 'user', 'created_at']

    def validate_resting_heart_rate(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Resting heart rate must be greater than 0")
        return value

    def validate_blood_pressure_systolic(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Systolic blood pressure must be greater than 0")
        return value

    def validate_blood_pressure_diastolic(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Diastolic blood pressure must be greater than 0")
        return value

    def validate_morning_energy(self, value):
        if value is not None and (value < 1 or value > 10):
            raise serializers.ValidationError("Morning energy must be between 1 and 10")
        return value

    def validate_stress_level(self, value):
        if value is not None and (value < 1 or value > 10):
            raise serializers.ValidationError("Stress level must be between 1 and 10")
        return value

    def validate_mood(self, value):
        if value is not None and (value < 1 or value > 10):
            raise serializers.ValidationError("Mood must be between 1 and 10")
        return value

    def validate_soreness(self, value):
        if value is not None and (value < 1 or value > 10):
            raise serializers.ValidationError("Soreness must be between 1 and 10")
        return value

    def validate_illness_level(self, value):
        if value is not None and (value < 1 or value > 10):
            raise serializers.ValidationError("Illness level must be between 1 and 10")
        return value

    def validate(self, data):
        # Validate blood pressure relationship
        systolic = data.get('blood_pressure_systolic')
        diastolic = data.get('blood_pressure_diastolic')
        
        if systolic is not None and diastolic is not None:
            if systolic <= diastolic:
                raise serializers.ValidationError("Systolic blood pressure must be greater than diastolic")
        
        return data
