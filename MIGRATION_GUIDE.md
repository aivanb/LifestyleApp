# Workout Tracking System - Migration Guide

## 🔄 Migration Overview

This guide covers migrating the Workout Tracking System between different environments, databases, and versions while maintaining data integrity and system functionality.

## 🏗️ Migration Types

### Environment Migrations
- **Development to Staging**: Move from dev to staging environment
- **Staging to Production**: Deploy to production environment
- **Production to Development**: Sync production data to dev
- **Cross-Environment**: Move between different cloud providers

### Database Migrations
- **Schema Changes**: Update database structure
- **Data Migrations**: Transform or move data
- **Database Engine Changes**: Switch between MySQL, PostgreSQL, etc.
- **Database Version Upgrades**: Upgrade database versions

### Application Migrations
- **Version Upgrades**: Update application versions
- **Framework Migrations**: Migrate between Django versions
- **Dependency Updates**: Update Python/Node.js packages
- **Configuration Changes**: Update environment configurations

## 🔧 Pre-Migration Planning

### Migration Checklist
- [ ] **Backup Current System**: Full system backup
- [ ] **Document Current State**: Configuration and data documentation
- [ ] **Test Migration Process**: Dry run in staging environment
- [ ] **Plan Downtime**: Schedule maintenance window
- [ ] **Prepare Rollback Plan**: Plan for reverting changes
- [ ] **Notify Users**: Inform users of maintenance window
- [ ] **Verify Dependencies**: Check all system dependencies

### Risk Assessment
```python
# Migration risk assessment
class MigrationRiskAssessment:
    def __init__(self):
        self.risks = {
            'data_loss': 'High',
            'downtime': 'Medium',
            'compatibility': 'Low',
            'performance': 'Medium',
            'security': 'Low',
        }
    
    def assess_risks(self):
        """Assess migration risks"""
        total_risk = 0
        for risk, level in self.risks.items():
            if level == 'High':
                total_risk += 3
            elif level == 'Medium':
                total_risk += 2
            else:
                total_risk += 1
        
        return total_risk
    
    def mitigation_strategies(self):
        """Define mitigation strategies"""
        return {
            'data_loss': 'Comprehensive backups and testing',
            'downtime': 'Staged migration with minimal downtime',
            'compatibility': 'Thorough compatibility testing',
            'performance': 'Performance monitoring and optimization',
            'security': 'Security audit and testing',
        }
```

## 📊 Data Migration

### Database Schema Migration
```python
# Django migration example
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('workouts', '0001_initial'),
    ]
    
    operations = [
        migrations.AddField(
            model_name='workout',
            name='difficulty_level',
            field=models.IntegerField(
                choices=[(1, 'Beginner'), (2, 'Intermediate'), (3, 'Advanced')],
                default=1
            ),
        ),
        migrations.AddField(
            model_name='workout',
            name='equipment_required',
            field=models.JSONField(default=list),
        ),
        migrations.AlterField(
            model_name='workout',
            name='workout_name',
            field=models.CharField(max_length=200, unique=True),
        ),
    ]
```

### Data Transformation
```python
# Data transformation during migration
def transform_workout_data(apps, schema_editor):
    """Transform workout data during migration"""
    Workout = apps.get_model('workouts', 'Workout')
    
    for workout in Workout.objects.all():
        # Transform workout name to include emoji
        if 'Bench Press' in workout.workout_name:
            workout.workout_name = workout.workout_name.replace('Bench Press', 'Bench Press 💪')
        elif 'Squats' in workout.workout_name:
            workout.workout_name = workout.workout_name.replace('Squats', 'Squats 🦵')
        
        # Set difficulty level based on type
        if workout.type == 'barbell':
            workout.difficulty_level = 3
        elif workout.type == 'dumbbell':
            workout.difficulty_level = 2
        else:
            workout.difficulty_level = 1
        
        # Set equipment required
        workout.equipment_required = [workout.type]
        
        workout.save()

class Migration(migrations.Migration):
    dependencies = [
        ('workouts', '0002_workout_difficulty_level'),
    ]
    
    operations = [
        migrations.RunPython(transform_workout_data),
    ]
```

### Data Validation
```python
# Data validation during migration
def validate_migration_data(apps, schema_editor):
    """Validate data integrity after migration"""
    Workout = apps.get_model('workouts', 'Workout')
    WorkoutMuscle = apps.get_model('workouts', 'WorkoutMuscle')
    
    # Validate workout data
    for workout in Workout.objects.all():
        assert workout.workout_name, "Workout name cannot be empty"
        assert workout.type in ['barbell', 'dumbbell', 'bodyweight'], "Invalid workout type"
        assert workout.difficulty_level in [1, 2, 3], "Invalid difficulty level"
        assert isinstance(workout.equipment_required, list), "Equipment required must be a list"
    
    # Validate workout-muscle relationships
    for workout_muscle in WorkoutMuscle.objects.all():
        assert 0 <= workout_muscle.activation_rating <= 100, "Invalid activation rating"
        assert workout_muscle.workout is not None, "Workout cannot be null"
        assert workout_muscle.muscle is not None, "Muscle cannot be null"
    
    print("Data validation completed successfully")

class Migration(migrations.Migration):
    dependencies = [
        ('workouts', '0003_workout_equipment_required'),
    ]
    
    operations = [
        migrations.RunPython(validate_migration_data),
    ]
```

## 🌐 Environment Migration

### Development to Staging
```bash
#!/bin/bash
# Development to staging migration script

echo "=== Development to Staging Migration ==="

# 1. Backup staging environment
echo "1. Backing up staging environment..."
./backup_staging.sh

# 2. Export development data
echo "2. Exporting development data..."
python manage.py dumpdata --indent=2 > dev_data.json

# 3. Deploy to staging
echo "3. Deploying to staging..."
git checkout staging
git merge development
git push origin staging

# 4. Run migrations on staging
echo "4. Running migrations on staging..."
ssh staging-server "cd /opt/workout-tracker && python manage.py migrate"

# 5. Import development data
echo "5. Importing development data..."
scp dev_data.json staging-server:/opt/workout-tracker/
ssh staging-server "cd /opt/workout-tracker && python manage.py loaddata dev_data.json"

# 6. Restart staging services
echo "6. Restarting staging services..."
ssh staging-server "sudo systemctl restart workout-tracker"

# 7. Verify deployment
echo "7. Verifying deployment..."
curl -f http://staging.yourdomain.com/api/health/

echo "Migration completed successfully"
```

### Staging to Production
```bash
#!/bin/bash
# Staging to production migration script

echo "=== Staging to Production Migration ==="

# 1. Backup production environment
echo "1. Backing up production environment..."
./backup_production.sh

# 2. Export staging data
echo "2. Exporting staging data..."
ssh staging-server "cd /opt/workout-tracker && python manage.py dumpdata --indent=2 > staging_data.json"

# 3. Deploy to production
echo "3. Deploying to production..."
git checkout production
git merge staging
git push origin production

# 4. Run migrations on production
echo "4. Running migrations on production..."
ssh production-server "cd /opt/workout-tracker && python manage.py migrate"

# 5. Import staging data
echo "5. Importing staging data..."
scp staging-server:/opt/workout-tracker/staging_data.json production-server:/opt/workout-tracker/
ssh production-server "cd /opt/workout-tracker && python manage.py loaddata staging_data.json"

# 6. Restart production services
echo "6. Restarting production services..."
ssh production-server "sudo systemctl restart workout-tracker"

# 7. Verify deployment
echo "7. Verifying deployment..."
curl -f https://yourdomain.com/api/health/

echo "Migration completed successfully"
```

## 🗄️ Database Migration

### MySQL to PostgreSQL
```python
# MySQL to PostgreSQL migration
import mysql.connector
import psycopg2
import json

class DatabaseMigration:
    def __init__(self):
        self.mysql_config = {
            'host': 'mysql-host',
            'user': 'mysql-user',
            'password': 'mysql-password',
            'database': 'mysql-database',
        }
        self.postgres_config = {
            'host': 'postgres-host',
            'user': 'postgres-user',
            'password': 'postgres-password',
            'database': 'postgres-database',
        }
    
    def migrate_workouts(self):
        """Migrate workouts from MySQL to PostgreSQL"""
        # Connect to MySQL
        mysql_conn = mysql.connector.connect(**self.mysql_config)
        mysql_cursor = mysql_conn.cursor(dictionary=True)
        
        # Connect to PostgreSQL
        postgres_conn = psycopg2.connect(**self.postgres_config)
        postgres_cursor = postgres_conn.cursor()
        
        # Fetch workouts from MySQL
        mysql_cursor.execute("SELECT * FROM workouts")
        workouts = mysql_cursor.fetchall()
        
        # Insert workouts into PostgreSQL
        for workout in workouts:
            postgres_cursor.execute("""
                INSERT INTO workouts (workout_id, workout_name, type, notes, user_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                workout['workout_id'],
                workout['workout_name'],
                workout['type'],
                workout['notes'],
                workout['user_id'],
                workout['created_at']
            ))
        
        postgres_conn.commit()
        
        # Close connections
        mysql_cursor.close()
        mysql_conn.close()
        postgres_cursor.close()
        postgres_conn.close()
    
    def migrate_workout_muscles(self):
        """Migrate workout muscles from MySQL to PostgreSQL"""
        # Similar implementation for workout_muscle table
        pass
    
    def migrate_splits(self):
        """Migrate splits from MySQL to PostgreSQL"""
        # Similar implementation for splits table
        pass
```

### Database Version Upgrade
```bash
#!/bin/bash
# Database version upgrade script

echo "=== Database Version Upgrade ==="

# 1. Backup current database
echo "1. Backing up current database..."
mysqldump -u workout_user -p workout_tracker > backup_before_upgrade.sql

# 2. Stop application
echo "2. Stopping application..."
sudo systemctl stop workout-tracker

# 3. Upgrade MySQL
echo "3. Upgrading MySQL..."
sudo apt update
sudo apt upgrade mysql-server

# 4. Start MySQL
echo "4. Starting MySQL..."
sudo systemctl start mysql

# 5. Check MySQL version
echo "5. Checking MySQL version..."
mysql --version

# 6. Run mysql_upgrade
echo "6. Running mysql_upgrade..."
mysql_upgrade -u root -p

# 7. Start application
echo "7. Starting application..."
sudo systemctl start workout-tracker

# 8. Verify functionality
echo "8. Verifying functionality..."
curl -f http://localhost:8000/api/health/

echo "Database upgrade completed successfully"
```

## 🔄 Application Migration

### Django Version Upgrade
```python
# Django version upgrade migration
from django.db import migrations, models
from django.core.management import call_command

class Migration(migrations.Migration):
    dependencies = [
        ('workouts', '0001_initial'),
    ]
    
    operations = [
        # Update model fields for new Django version
        migrations.AlterField(
            model_name='workout',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        migrations.AlterField(
            model_name='workout',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, db_index=True),
        ),
    ]
    
    def upgrade_django(self, apps, schema_editor):
        """Upgrade Django-specific configurations"""
        # Update settings for new Django version
        # Update middleware
        # Update authentication backends
        pass
```

### Dependency Updates
```bash
#!/bin/bash
# Dependency update script

echo "=== Dependency Update ==="

# 1. Backup current environment
echo "1. Backing up current environment..."
pip freeze > requirements_backup.txt

# 2. Update Python packages
echo "2. Updating Python packages..."
pip install --upgrade pip
pip install -r requirements.txt --upgrade

# 3. Update Node.js packages
echo "3. Updating Node.js packages..."
cd frontend
npm update
cd ..

# 4. Run tests
echo "4. Running tests..."
python manage.py test
cd frontend
npm test
cd ..

# 5. Restart services
echo "5. Restarting services..."
sudo systemctl restart workout-tracker

# 6. Verify functionality
echo "6. Verifying functionality..."
curl -f http://localhost:8000/api/health/

echo "Dependency update completed successfully"
```

## 🔒 Security Migration

### SSL Certificate Migration
```bash
#!/bin/bash
# SSL certificate migration script

echo "=== SSL Certificate Migration ==="

# 1. Backup current certificate
echo "1. Backing up current certificate..."
sudo cp /etc/ssl/certs/yourdomain.com.crt /etc/ssl/certs/yourdomain.com.crt.backup
sudo cp /etc/ssl/private/yourdomain.com.key /etc/ssl/private/yourdomain.com.key.backup

# 2. Generate new certificate
echo "2. Generating new certificate..."
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 3. Update Nginx configuration
echo "3. Updating Nginx configuration..."
sudo nginx -t

# 4. Reload Nginx
echo "4. Reloading Nginx..."
sudo systemctl reload nginx

# 5. Verify certificate
echo "5. Verifying certificate..."
openssl x509 -in /etc/ssl/certs/yourdomain.com.crt -text -noout

# 6. Test SSL connection
echo "6. Testing SSL connection..."
openssl s_client -connect yourdomain.com:443

echo "SSL certificate migration completed successfully"
```

### Authentication Migration
```python
# Authentication system migration
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User

def migrate_authentication_system(apps, schema_editor):
    """Migrate authentication system"""
    User = apps.get_model('auth', 'User')
    
    # Update password hashing
    for user in User.objects.all():
        if not user.password.startswith('pbkdf2_'):
            # Re-hash password with new algorithm
            user.password = make_password(user.password)
            user.save()
    
    # Update user permissions
    for user in User.objects.all():
        if not user.has_perm('workouts.add_workout'):
            user.user_permissions.add(
                Permission.objects.get(codename='add_workout')
            )

class Migration(migrations.Migration):
    dependencies = [
        ('workouts', '0001_initial'),
    ]
    
    operations = [
        migrations.RunPython(migrate_authentication_system),
    ]
```

## 📊 Data Migration Tools

### Custom Migration Script
```python
# Custom migration script
import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.workouts.models import Workout, WorkoutMuscle, Split, SplitDay

class DataMigrationTool:
    def __init__(self):
        self.migration_log = []
    
    def log_migration(self, message):
        """Log migration progress"""
        print(f"[{datetime.now()}] {message}")
        self.migration_log.append(f"[{datetime.now()}] {message}")
    
    def migrate_workouts(self):
        """Migrate workout data"""
        self.log_migration("Starting workout migration...")
        
        workouts = Workout.objects.all()
        migrated_count = 0
        
        for workout in workouts:
            try:
                # Perform migration logic
                if not workout.workout_name.endswith('💪'):
                    workout.workout_name += ' 💪'
                    workout.save()
                    migrated_count += 1
            except Exception as e:
                self.log_migration(f"Error migrating workout {workout.id}: {e}")
        
        self.log_migration(f"Migrated {migrated_count} workouts")
    
    def migrate_splits(self):
        """Migrate split data"""
        self.log_migration("Starting split migration...")
        
        splits = Split.objects.all()
        migrated_count = 0
        
        for split in splits:
            try:
                # Perform migration logic
                if not split.split_name.endswith('📅'):
                    split.split_name += ' 📅'
                    split.save()
                    migrated_count += 1
            except Exception as e:
                self.log_migration(f"Error migrating split {split.id}: {e}")
        
        self.log_migration(f"Migrated {migrated_count} splits")
    
    def run_migration(self):
        """Run complete migration"""
        self.log_migration("Starting data migration...")
        
        try:
            self.migrate_workouts()
            self.migrate_splits()
            self.log_migration("Migration completed successfully")
        except Exception as e:
            self.log_migration(f"Migration failed: {e}")
            raise

if __name__ == '__main__':
    migration_tool = DataMigrationTool()
    migration_tool.run_migration()
```

### Migration Validation
```python
# Migration validation script
class MigrationValidator:
    def __init__(self):
        self.validation_results = {}
    
    def validate_data_integrity(self):
        """Validate data integrity after migration"""
        results = {}
        
        # Validate workouts
        workouts = Workout.objects.all()
        results['workouts'] = {
            'count': workouts.count(),
            'valid': all(w.workout_name for w in workouts),
            'errors': []
        }
        
        # Validate splits
        splits = Split.objects.all()
        results['splits'] = {
            'count': splits.count(),
            'valid': all(s.split_name for s in splits),
            'errors': []
        }
        
        # Validate workout muscles
        workout_muscles = WorkoutMuscle.objects.all()
        results['workout_muscles'] = {
            'count': workout_muscles.count(),
            'valid': all(0 <= wm.activation_rating <= 100 for wm in workout_muscles),
            'errors': []
        }
        
        self.validation_results = results
        return results
    
    def generate_validation_report(self):
        """Generate validation report"""
        report = []
        report.append("=== Migration Validation Report ===")
        report.append(f"Generated: {datetime.now()}")
        report.append("")
        
        for table, data in self.validation_results.items():
            report.append(f"Table: {table}")
            report.append(f"  Count: {data['count']}")
            report.append(f"  Valid: {data['valid']}")
            if data['errors']:
                report.append(f"  Errors: {len(data['errors'])}")
                for error in data['errors']:
                    report.append(f"    - {error}")
            report.append("")
        
        return "\n".join(report)
```

## 🚨 Rollback Procedures

### Database Rollback
```bash
#!/bin/bash
# Database rollback script

echo "=== Database Rollback ==="

# 1. Stop application
echo "1. Stopping application..."
sudo systemctl stop workout-tracker

# 2. Restore database from backup
echo "2. Restoring database from backup..."
mysql -u workout_user -p workout_tracker < backup_before_migration.sql

# 3. Start application
echo "3. Starting application..."
sudo systemctl start workout-tracker

# 4. Verify rollback
echo "4. Verifying rollback..."
curl -f http://localhost:8000/api/health/

echo "Database rollback completed successfully"
```

### Application Rollback
```bash
#!/bin/bash
# Application rollback script

echo "=== Application Rollback ==="

# 1. Stop application
echo "1. Stopping application..."
sudo systemctl stop workout-tracker

# 2. Restore previous version
echo "2. Restoring previous version..."
git checkout previous-stable-version
git push origin production

# 3. Restore dependencies
echo "3. Restoring dependencies..."
pip install -r requirements_backup.txt

# 4. Start application
echo "4. Starting application..."
sudo systemctl start workout-tracker

# 5. Verify rollback
echo "5. Verifying rollback..."
curl -f http://localhost:8000/api/health/

echo "Application rollback completed successfully"
```

## 📋 Migration Checklist

### Pre-Migration
- [ ] **Backup Current System**: Full system backup
- [ ] **Document Current State**: Configuration and data documentation
- [ ] **Test Migration Process**: Dry run in staging environment
- [ ] **Plan Downtime**: Schedule maintenance window
- [ ] **Prepare Rollback Plan**: Plan for reverting changes
- [ ] **Notify Users**: Inform users of maintenance window
- [ ] **Verify Dependencies**: Check all system dependencies

### During Migration
- [ ] **Monitor Progress**: Track migration progress
- [ ] **Validate Data**: Check data integrity
- [ ] **Test Functionality**: Verify system functionality
- [ ] **Monitor Performance**: Check system performance
- [ ] **Log Issues**: Document any problems
- [ ] **Update Documentation**: Update system documentation

### Post-Migration
- [ ] **Verify Functionality**: Test all system features
- [ ] **Monitor Performance**: Check system performance
- [ ] **Validate Data**: Verify data integrity
- [ ] **Update Documentation**: Update system documentation
- [ ] **Notify Users**: Inform users of completion
- [ ] **Clean Up**: Remove temporary files and backups
- [ ] **Schedule Monitoring**: Set up ongoing monitoring

---

**Remember**: Always test migrations in a staging environment first and have a rollback plan ready. Document all changes and monitor the system closely after migration.
