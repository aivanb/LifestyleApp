# Workout Tracking System - User Guide

## 🏋️ Welcome to the Workout Tracking System

The Workout Tracking System is a comprehensive tool designed to help you track your workouts, manage muscle priorities, create workout splits, and monitor your progress. This guide will walk you through all the features and how to use them effectively.

## 🚀 Getting Started

### First Time Setup
1. **Create an Account**: Sign up with your email and password
2. **Set Muscle Priorities**: Configure your muscle priorities (default is 80 for all muscles)
3. **Create Your First Workout**: Add exercises with muscle activation ratings
4. **Create a Split**: Design your workout routine with multiple days
5. **Start Logging**: Begin tracking your workout sessions

### Navigation
The system has five main tabs:
- 🎯 **Muscle Priority** - Manage muscle priorities
- 🏋️ **Workout Adder** - Create and edit workouts
- 📅 **Split Creator** - Design workout splits
- 📝 **Workout Logger** - Log workout sessions
- 📊 **Workout Log** - View workout history and stats

## 🎯 Muscle Priority Management

### Understanding Muscle Priorities
Muscle priorities determine how much focus each muscle group gets in your training. The system uses these priorities to calculate optimal activation ranges for your workouts.

**Priority Scale:**
- **0-20**: Low priority (minimal focus)
- **21-40**: Below average priority
- **41-60**: Average priority
- **61-80**: Above average priority (default)
- **81-100**: High priority (maximum focus)

### Setting Muscle Priorities
1. **Navigate to Muscle Priority Tab**
2. **Expand Muscle Groups**: Click on muscle group headers to expand/collapse
3. **Adjust Priorities**: Use sliders or input fields to set priorities (0-100)
4. **Update Changes**: Click the "Update" button to save your changes

### Muscle Groups
- **Upper Body**: Chest, Back, Shoulders, Biceps, Triceps
- **Lower Body**: Quads, Hamstrings, Glutes, Calves
- **Core**: Abs, Obliques, Lower Back
- **Other**: Forearms, Neck, etc.

### Priority Usage Explanation
The system uses your muscle priorities to:
- Calculate optimal activation ranges for each muscle
- Highlight muscles that need more or less attention
- Provide recommendations for workout adjustments
- Track progress toward your goals

## 🏋️ Workout Adder

### Creating Workouts
1. **Navigate to Workout Adder Tab**
2. **Fill Basic Information**:
   - **Workout Name**: Enter a descriptive name (e.g., "Bench Press 💪")
   - **Type**: Select equipment type (barbell, dumbbell, bodyweight, etc.)
   - **Notes**: Add any additional information
3. **Add Muscle Activations**:
   - Select muscles that are worked by this exercise
   - Set activation rating (0-100) for each muscle
   - Higher ratings indicate more muscle activation
4. **Choose Icon**: Select an emoji icon to represent the workout
5. **Save Workout**: Click "Create Workout" to save

### Understanding Activation Ratings
**Activation Rating Scale:**
- **0-20**: Minimal activation (stabilizer muscles)
- **21-40**: Low activation (secondary muscles)
- **41-60**: Moderate activation (supporting muscles)
- **61-80**: High activation (primary muscles)
- **81-100**: Maximum activation (main target muscles)

### Example Workouts
**Bench Press 💪**
- Chest: 100 (primary target)
- Triceps: 75 (secondary)
- Shoulders: 50 (stabilizer)

**Squats 🦵**
- Quads: 100 (primary target)
- Hamstrings: 90 (secondary)
- Glutes: 80 (secondary)

### Editing Workouts
1. **Find the workout** in the workout list
2. **Click Edit** button
3. **Modify information** as needed
4. **Save changes**

### Workout Icons
Available emoji icons:
- 💪 (muscle/strength)
- 🏋️ (weightlifting)
- 🦵 (legs)
- 💨 (cardio)
- 🔥 (intensity)
- ⚡ (power)
- 🎯 (precision)
- 💎 (quality)
- 🌟 (excellence)
- 🚀 (progress)

## 📅 Split Creator

### Understanding Workout Splits
A workout split is a structured training plan that divides your workouts across multiple days. Each day focuses on specific muscle groups with target activation levels.

### Creating a Split
1. **Navigate to Split Creator Tab**
2. **Enter Split Information**:
   - **Split Name**: Give your split a descriptive name
   - **Start Date**: Set when you want to begin this split
3. **Add Split Days**:
   - **Day Name**: Name each day (e.g., "Push Day", "Pull Day")
   - **Day Order**: Set the order of days (1, 2, 3, etc.)
   - **Target Muscles**: Select muscles and set target activation for each
4. **Review Analysis**: Check the optimal activation analysis
5. **Save Split**: Click "Create Split" to save

### Split Day Examples
**Push/Pull/Legs Split:**
- **Day 1 - Push Day**: Chest, Shoulders, Triceps
- **Day 2 - Pull Day**: Back, Biceps
- **Day 3 - Leg Day**: Quads, Hamstrings, Glutes

**Upper/Lower Split:**
- **Day 1 - Upper Body**: Chest, Back, Shoulders, Arms
- **Day 2 - Lower Body**: Quads, Hamstrings, Glutes, Calves

### Target Activation
Set target activation levels for each muscle on each day. This helps ensure balanced training across your split.

### Optimal Activation Analysis
The system calculates optimal activation ranges using your muscle priorities:
- **Lower Bound**: `R(P,D) = 90 × (10 + 0.1P) × 7/D`
- **Upper Bound**: `R(P,D) = 90 × (20 + 0.1P) × 7 × D`

**Muscle Status Indicators:**
- 🔴 **No activation** - 0 activation
- 🟡 **Below optimal** - Below lower bound
- 🟢 **Within optimal** - Within 15% of optimal range
- 🔵 **Above optimal** - Above upper bound

### Activating a Split
1. **Select a split** from your splits list
2. **Click "Activate Split"**
3. **Set start date** for the split
4. **Confirm activation**

## 📝 Workout Logger

### Logging Workouts
1. **Navigate to Workout Logger Tab**
2. **Search for Workouts**:
   - Use the search bar to find workouts
   - Filter by muscle activation threshold
   - Sort alphabetically
3. **Select a Workout**: Click on a workout to log it
4. **Fill Workout Details**:
   - **Weight**: Enter the weight used
   - **Reps**: Number of repetitions
   - **RIR**: Reps in Reserve (how many more reps you could do)
   - **Notes**: Add any additional notes
   - **Attributes**: Select workout attributes
5. **Log Workout**: Click "Log Workout" to save

### Understanding RIR (Reps in Reserve)
RIR indicates how many more repetitions you could perform:
- **0 RIR**: Maximum effort (couldn't do another rep)
- **1 RIR**: Very hard (could do 1 more rep)
- **2 RIR**: Hard (could do 2 more reps)
- **3 RIR**: Moderate (could do 3 more reps)
- **4+ RIR**: Easy (could do 4+ more reps)

### Workout Attributes
- **Dropset**: Reducing weight and continuing the set
- **Assisted**: Using assistance to complete reps
- **Partial**: Performing partial range of motion
- **Pause**: Pausing at specific points in the movement
- **Negatives**: Focusing on the eccentric (lowering) portion

### Autofill Feature
The system automatically fills workout fields from your most recent log of the same exercise, making logging faster and more consistent.

### Progressive Overload
The system tracks your progress and encourages progressive overload by:
- Showing previous performance
- Suggesting weight increases
- Tracking volume progression
- Monitoring strength gains

## 📊 Workout Log

### Viewing Workout History
1. **Navigate to Workout Log Tab**
2. **Select Date**: Use the calendar to choose a date
3. **View Workout Details**: See all logged workouts for that day
4. **Check Progress**: Monitor your progress toward daily goals

### Current Split Day
The system automatically determines your current split day based on:
- Your active split's start date
- The selected date
- The number of days in your split

### Workout Statistics
**Daily Stats:**
- **Total Sets**: Number of sets completed
- **Total Weight**: Total weight lifted
- **Total Reps**: Total repetitions performed
- **Total RIR**: Average RIR across all sets
- **Total Activation**: Total muscle activation completed

### Muscle Progress
Track your progress toward daily muscle activation goals:
- **Target Activation**: Goal for each muscle
- **Completed Activation**: What you've achieved
- **Progress Percentage**: How close you are to your goal

### Quick Add Feature
Quickly add workouts from your previous split day:
1. **Click "Quick Add"** button
2. **Select workouts** from the previous day
3. **Modify details** as needed
4. **Log workouts** to current day

### Timer Feature
Use the built-in timer for:
- **Rest periods** between sets
- **Workout duration** tracking
- **Interval training** timing

### Calendar Navigation
- **Previous/Next Day**: Navigate between days
- **Today**: Jump to current date
- **Date Picker**: Select specific dates
- **Week View**: See weekly workout patterns

## 📈 Progress Tracking

### Muscle Balance Analysis
Monitor muscle balance across your training:
- **Overdeveloped**: Muscles with excessive activation
- **Underdeveloped**: Muscles with insufficient activation
- **Balanced**: Muscles within optimal ranges

### Strength Progression
Track strength improvements:
- **Weight Progression**: Increases in weight over time
- **Volume Progression**: Increases in total volume
- **Intensity Progression**: Changes in RIR and effort

### Recovery Monitoring
Monitor recovery indicators:
- **RIR Trends**: Changes in reps in reserve
- **Volume Tolerance**: Ability to handle training volume
- **Performance Consistency**: Variability in performance

## 🎯 Best Practices

### Setting Up Your System
1. **Start Simple**: Begin with basic workouts and a simple split
2. **Set Realistic Priorities**: Don't set all muscles to maximum priority
3. **Track Consistently**: Log workouts regularly for accurate data
4. **Review Regularly**: Check progress and adjust as needed

### Workout Planning
1. **Balance Your Split**: Ensure all muscle groups get adequate attention
2. **Progressive Overload**: Gradually increase weight, reps, or volume
3. **Recovery**: Allow adequate rest between training sessions
4. **Variation**: Periodically change exercises and routines

### Data Entry
1. **Be Accurate**: Enter precise weights, reps, and RIR
2. **Use Notes**: Add context about how you felt, form, etc.
3. **Track Attributes**: Note special techniques used
4. **Consistent Timing**: Log workouts at consistent times

### Progress Monitoring
1. **Weekly Reviews**: Check progress weekly
2. **Monthly Assessments**: Evaluate monthly progress
3. **Adjust Priorities**: Update muscle priorities based on progress
4. **Modify Splits**: Adjust splits based on results

## 🔧 Troubleshooting

### Common Issues

**Split Day Not Showing Correctly**
- Check that your split is activated
- Verify the start date is correct
- Ensure the selected date is after the start date

**Muscle Priorities Not Updating**
- Click the "Update" button after making changes
- Refresh the page if changes don't appear
- Check that all required fields are filled

**Workout Not Appearing in Logger**
- Verify the workout was created successfully
- Check the search filters
- Ensure the workout has muscle activations

**Statistics Not Calculating**
- Make sure you have logged workouts
- Check that the date range includes logged workouts
- Verify muscle priorities are set

### Getting Help
1. **Check Documentation**: Review this guide and other documentation
2. **Test Features**: Try different approaches to see what works
3. **Contact Support**: Reach out if issues persist
4. **Report Bugs**: Report any system bugs you encounter

## 🚀 Advanced Features

### Custom Muscle Groups
Create custom muscle groups for specialized training:
1. **Go to Muscle Priority**
2. **Add Custom Groups**
3. **Assign Muscles**
4. **Set Priorities**

### Workout Templates
Create workout templates for common routines:
1. **Design Template**
2. **Save as Template**
3. **Use Template** for quick workout creation

### Export Data
Export your workout data for analysis:
1. **Go to Settings**
2. **Select Export Options**
3. **Download Data**

### Integration Options
Connect with other fitness apps:
1. **Check Integration Settings**
2. **Authorize Connections**
3. **Sync Data**

## 📚 Additional Resources

### Learning Materials
- **Exercise Database**: Comprehensive exercise library
- **Form Guides**: Proper technique instructions
- **Training Principles**: Scientific training methods
- **Recovery Strategies**: Optimal recovery techniques

### Community Features
- **Workout Sharing**: Share workouts with others
- **Progress Photos**: Track visual progress
- **Achievement Badges**: Earn recognition for milestones
- **Community Challenges**: Participate in group challenges

### Mobile Access
- **Responsive Design**: Works on all devices
- **Offline Mode**: Log workouts without internet
- **Push Notifications**: Reminders and updates
- **Quick Logging**: Fast workout entry

---

**Remember**: The Workout Tracking System is designed to help you achieve your fitness goals. Use it consistently, track accurately, and adjust based on your progress. Success comes from consistent effort and smart training decisions.
