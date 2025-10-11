# Database Migration Guide

## Overview
This guide provides instructions for applying recent database schema changes to your TrackingApp database.

## Changes Made

### Model Updates
1. **workouts** table:
   - Added `make_public` field (BooleanField, default=False)

2. **workout_log** table:
   - Added `rest_time` field (DecimalField, optional)

3. **foods** table:
   - Added `make_public` field (BooleanField, default=False)

4. **muscle_log** table:
   - Renamed `id` field to `muscle_log_id` (Primary Key)
   - Removed `day_worked` field
   - Added `created_at` field (DateTimeField, auto_now_add=True)

### New Tables
1. **splits** - Stores user workout splits
   - splits_id (PK)
   - user_id (FK)
   - split_name
   - start_date
   - created_at

2. **split_days** - Individual days within a split
   - split_days_id (PK)
   - splits_id (FK)
   - day_name
   - day_order

3. **split_day_targets** - Target muscle activation per split day
   - split_day_id (FK)
   - muscle_id (FK)
   - target_activation

## Migration Files Created
- `backend/apps/workouts/migrations/0002_split_splitday_rename_id_musclelog_muscle_log_id_and_more.py`
- `backend/apps/foods/migrations/0002_food_make_public.py`

## How to Apply Database Changes

### Prerequisites
- Ensure you have a backup of your database before proceeding
- Virtual environment should be activated
- Django application should be properly configured

### Step-by-Step Instructions

#### Option 1: Using Django Migrations (Recommended)

1. **Navigate to the backend directory:**
   ```powershell
   cd backend
   ```

2. **Activate your virtual environment:**
   ```powershell
   ..\venv\Scripts\Activate.ps1
   ```

3. **Review the migrations (optional but recommended):**
   ```powershell
   python manage.py showmigrations
   ```
   
   This will show all migrations and their status.

4. **Apply the migrations:**
   ```powershell
   python manage.py migrate
   ```
   
   This will apply all pending migrations to your database.

5. **Verify the migrations were successful:**
   ```powershell
   python manage.py showmigrations
   ```
   
   All migrations should now have an [X] next to them.

#### Option 2: Manual SQL (Advanced Users Only)

If you prefer to manually apply the changes or need to apply them to a production database, here are the SQL commands:

**For PostgreSQL/MySQL:**

```sql
-- Add make_public to workouts
ALTER TABLE workouts ADD COLUMN make_public BOOLEAN DEFAULT FALSE;

-- Add rest_time to workout_log
ALTER TABLE workout_log ADD COLUMN rest_time DECIMAL(8, 2) NULL;

-- Add make_public to foods
ALTER TABLE foods ADD COLUMN make_public BOOLEAN DEFAULT FALSE;

-- Update muscle_log table
ALTER TABLE muscle_log RENAME COLUMN id TO muscle_log_id;
ALTER TABLE muscle_log DROP COLUMN day_worked;
ALTER TABLE muscle_log ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create splits table
CREATE TABLE splits (
    splits_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    split_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create split_days table
CREATE TABLE split_days (
    split_days_id SERIAL PRIMARY KEY,
    splits_id INTEGER NOT NULL REFERENCES splits(splits_id) ON DELETE CASCADE,
    day_name VARCHAR(100) NOT NULL,
    day_order INTEGER NOT NULL
);

-- Create split_day_targets table
CREATE TABLE split_day_targets (
    split_day_id INTEGER NOT NULL REFERENCES split_days(split_days_id) ON DELETE CASCADE,
    muscle_id INTEGER NOT NULL REFERENCES muscles(muscles_id) ON DELETE CASCADE,
    target_activation INTEGER NOT NULL CHECK (target_activation >= 1 AND target_activation <= 100),
    PRIMARY KEY (split_day_id, muscle_id)
);
```

**Note:** Adjust the SQL syntax based on your specific database system (PostgreSQL, MySQL, SQLite, etc.)

### Rollback Instructions

If you need to rollback the migrations:

1. **Rollback workouts app migrations:**
   ```powershell
   python manage.py migrate workouts 0001_initial
   ```

2. **Rollback foods app migrations:**
   ```powershell
   python manage.py migrate foods 0001_initial
   ```

**Warning:** Rolling back migrations may result in data loss, especially for the new tables (splits, split_days, split_day_targets) and the removed day_worked field from muscle_log.

## Verification Steps

After applying migrations, verify the changes:

1. **Check database schema:**
   ```powershell
   python manage.py dbshell
   ```
   
   Then run:
   ```sql
   \d+ workouts  -- PostgreSQL
   DESCRIBE workouts;  -- MySQL
   PRAGMA table_info(workouts);  -- SQLite
   ```

2. **Test CRUD operations:**
   - Create test records for new tables
   - Verify foreign key relationships work correctly
   - Test the new fields in existing tables

3. **Run Django tests:**
   ```powershell
   python manage.py test
   ```

## Troubleshooting

### Common Issues

1. **Migration conflicts:**
   - Run `python manage.py makemigrations --merge` to resolve
   
2. **Database connection errors:**
   - Verify database credentials in settings.py
   - Ensure database service is running

3. **Foreign key constraint errors:**
   - Ensure referenced tables exist and have proper data
   - Check that user_id values exist in the users table

4. **Permission errors:**
   - Ensure database user has ALTER TABLE permissions
   - For production, coordinate with DBA

### Getting Help

If you encounter issues:
1. Check Django migration documentation
2. Review error logs in `backend/logs/django.log`
3. Use `python manage.py migrate --plan` to see what will be executed
4. Use `python manage.py sqlmigrate workouts 0002` to see the actual SQL

## Post-Migration Tasks

1. **Update API endpoints** if needed to handle new fields
2. **Update frontend forms** to include new fields (make_public, rest_time)
3. **Update tests** to cover new models and fields
4. **Update documentation** for API consumers
5. **Notify team members** of schema changes

## Database Structure Reference

For the complete, up-to-date database structure, refer to:
- `notes/database_structure.md` - Complete schema documentation

---

**Last Updated:** October 11, 2025
**Migration Version:** v0002

