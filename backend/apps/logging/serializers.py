from rest_framework import serializers
from apps.logging.models import (
    WeightLog, BodyMeasurementLog, WaterLog, 
    StepsLog, CardioLog
)
from apps.health.models import SleepLog, HealthMetricsLog


class WeightLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightLog
        fields = [
            'weight_log_id', 'user', 'weight', 'weight_unit', 'created_at'
        ]
        read_only_fields = ['weight_log_id', 'user', 'created_at']

    def validate_weight(self, value):
        if value <= 0:
            raise serializers.ValidationError("Weight must be greater than 0")
        return value

    def validate_weight_unit(self, value):
        allowed_units = ['kg', 'lbs', 'lb']
        if value not in allowed_units:
            raise serializers.ValidationError(f"Weight unit must be one of: {', '.join(allowed_units)}")
        return value


class BodyMeasurementLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyMeasurementLog
        fields = [
            'measurement_id', 'user', 'upper_arm', 'lower_arm', 
            'waist', 'shoulder', 'leg', 'calf', 'created_at'
        ]
        read_only_fields = ['measurement_id', 'user', 'created_at']

    def validate(self, data):
        # At least one measurement should be provided
        measurement_fields = ['upper_arm', 'lower_arm', 'waist', 'shoulder', 'leg', 'calf']
        if not any(data.get(field) for field in measurement_fields):
            raise serializers.ValidationError("At least one measurement must be provided")
        
        # All measurements should be positive
        for field in measurement_fields:
            if data.get(field) is not None and data.get(field) <= 0:
                raise serializers.ValidationError(f"{field} must be greater than 0")
        
        return data


class WaterLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterLog
        fields = [
            'water_log_id', 'user', 'amount', 'unit', 'created_at'
        ]
        read_only_fields = ['water_log_id', 'user', 'created_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Water amount must be greater than 0")
        return value

    def validate_unit(self, value):
        allowed_units = ['ml', 'fl oz', 'oz', 'cup', 'liter', 'L']
        if value not in allowed_units:
            raise serializers.ValidationError(f"Unit must be one of: {', '.join(allowed_units)}")
        return value


class StepsLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = StepsLog
        fields = [
            'step_log_id', 'user', 'steps', 'date_time', 'created_at'
        ]
        read_only_fields = ['step_log_id', 'user', 'created_at']

    def validate_steps(self, value):
        if value < 0:
            raise serializers.ValidationError("Steps cannot be negative")
        return value


class CardioLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardioLog
        fields = [
            'cardio_log_id', 'user', 'cardio_type', 'duration', 
            'distance', 'distance_unit', 'calories_burned', 
            'heart_rate', 'date_time', 'created_at'
        ]
        read_only_fields = ['cardio_log_id', 'user', 'created_at']

    def validate_duration(self, value):
        if value <= 0:
            raise serializers.ValidationError("Duration must be greater than 0")
        return value

    def validate_distance(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Distance cannot be negative")
        return value

    def validate_calories_burned(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Calories burned cannot be negative")
        return value

    def validate_heart_rate(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Heart rate must be greater than 0")
        return value

    def validate_distance_unit(self, value):
        if value is not None:
            allowed_units = ['miles', 'km', 'meters', 'yards']
            if value not in allowed_units:
                raise serializers.ValidationError(f"Distance unit must be one of: {', '.join(allowed_units)}")
        return value


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
        if data.get('time_went_to_bed') and data.get('time_got_out_of_bed'):
            if data['time_got_out_of_bed'] <= data['time_went_to_bed']:
                raise serializers.ValidationError("Time got out of bed must be after time went to bed")
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
