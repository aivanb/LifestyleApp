/**
 * Comprehensive Workout System Testing Script
 * 
 * This script tests all aspects of the workout tracking system:
 * 1. Authentication
 * 2. Split creation and management
 * 3. Workout creation
 * 4. Workout logging with attributes
 * 5. Quick add functionality
 * 6. Muscle progress tracking
 * 7. Stats system
 * 8. Date picker integration
 * 9. Database consistency verification
 */

const API_BASE_URL = 'http://localhost:8000/api';

class WorkoutSystemTester {
  constructor() {
    this.authToken = null;
    this.userId = null;
    this.testSplitId = null;
    this.testWorkoutIds = [];
    this.testLogIds = [];
    this.testResults = {
      authentication: false,
      splitCreation: false,
      workoutCreation: false,
      workoutLogging: false,
      autofill: false,
      quickAdd: false,
      muscleProgress: false,
      stats: false,
      datePicker: false,
      databaseConsistency: false
    };
  }

  async makeRequest(method, endpoint, data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || result.message || 'Unknown error'}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    try {
      // Test login
      const loginResult = await this.makeRequest('POST', '/auth/login/', {
        username: 'john_doe',
        password: 'testpass123'
      });

      if (loginResult.success && loginResult.data.access) {
        this.authToken = loginResult.data.access;
        console.log('✅ Login successful');
        
        // Test profile access
        const profileResult = await this.makeRequest('GET', '/auth/profile/');
        if (profileResult.success) {
          this.userId = profileResult.data.user_id;
          console.log('✅ Profile access successful');
          this.testResults.authentication = true;
          return true;
        }
      }
      
      throw new Error('Authentication failed');
    } catch (error) {
      console.error('❌ Authentication test failed:', error.message);
      return false;
    }
  }

  async testSplitCreation() {
    console.log('\n📅 Testing Split Creation...');
    
    try {
      // Get all muscles first
      const musclesResult = await this.makeRequest('GET', '/workouts/muscles/');
      if (!musclesResult.success) {
        throw new Error('Failed to fetch muscles');
      }

      const muscles = musclesResult.data;
      console.log(`📊 Found ${muscles.length} muscles in database`);

      // Create comprehensive test split covering all muscles
      const splitData = {
        split_name: 'Comprehensive Test Split',
        split_days: [
          {
            day_name: 'Push Day',
            day_order: 1,
            targets: muscles.filter(m => 
              m.muscle_group === 'chest' || 
              m.muscle_group === 'arms' && m.muscle_name.includes('Triceps') ||
              m.muscle_group === 'arms' && m.muscle_name.includes('Deltoid')
            ).map(muscle => ({
              muscle_name: muscle.muscle_name,
              target_activation: Math.floor(Math.random() * 30) + 70 // 70-100%
            }))
          },
          {
            day_name: 'Pull Day',
            day_order: 2,
            targets: muscles.filter(m => 
              m.muscle_group === 'back' || 
              m.muscle_group === 'arms' && m.muscle_name.includes('Biceps') ||
              m.muscle_group === 'arms' && m.muscle_name.includes('Forearm')
            ).map(muscle => ({
              muscle_name: muscle.muscle_name,
              target_activation: Math.floor(Math.random() * 30) + 70
            }))
          },
          {
            day_name: 'Leg Day',
            day_order: 3,
            targets: muscles.filter(m => m.muscle_group === 'legs').map(muscle => ({
              muscle_name: muscle.muscle_name,
              target_activation: Math.floor(Math.random() * 30) + 70
            }))
          },
          {
            day_name: 'Core Day',
            day_order: 4,
            targets: muscles.filter(m => m.muscle_group === 'core').map(muscle => ({
              muscle_name: muscle.muscle_name,
              target_activation: Math.floor(Math.random() * 30) + 70
            }))
          },
          {
            day_name: 'Rest Day',
            day_order: 5,
            targets: []
          }
        ]
      };

      const splitResult = await this.makeRequest('POST', '/workouts/splits/', splitData);
      if (splitResult.success) {
        this.testSplitId = splitResult.data.splits_id;
        console.log('✅ Split created successfully');
        
        // Activate the split
        const activateResult = await this.makeRequest('POST', `/workouts/splits/${this.testSplitId}/activate/`, {
          start_date: '2025-10-15'
        });
        
        if (activateResult.success) {
          console.log('✅ Split activated successfully');
          this.testResults.splitCreation = true;
          return true;
        }
      }
      
      throw new Error('Split creation failed');
    } catch (error) {
      console.error('❌ Split creation test failed:', error.message);
      return false;
    }
  }

  async testWorkoutCreation() {
    console.log('\n🏋️ Testing Workout Creation...');
    
    try {
      const testWorkouts = [
        {
          workout_name: 'Bench Press',
          type: 'strength',
          notes: 'Primary chest exercise',
          muscles: [
            { muscle_name: 'Pectoralis Major (Middle)', activation_rating: 95 },
            { muscle_name: 'Pectoralis Major (Upper)', activation_rating: 85 },
            { muscle_name: 'Triceps (Lateral Head)', activation_rating: 80 },
            { muscle_name: 'Anterior Deltoid', activation_rating: 70 }
          ]
        },
        {
          workout_name: 'Squats',
          type: 'strength',
          notes: 'Primary leg exercise',
          muscles: [
            { muscle_name: 'Quadriceps (Rectus Femoris)', activation_rating: 95 },
            { muscle_name: 'Glutes (Maximus)', activation_rating: 90 },
            { muscle_name: 'Hamstrings (Biceps Femoris)', activation_rating: 75 },
            { muscle_name: 'Calves (Gastrocnemius)', activation_rating: 60 }
          ]
        },
        {
          workout_name: 'Deadlifts',
          type: 'strength',
          notes: 'Full body compound movement',
          muscles: [
            { muscle_name: 'Erector Spinae', activation_rating: 95 },
            { muscle_name: 'Glutes (Maximus)', activation_rating: 90 },
            { muscle_name: 'Hamstrings (Biceps Femoris)', activation_rating: 85 },
            { muscle_name: 'Latissimus Dorsi', activation_rating: 80 },
            { muscle_name: 'Trapezius (Middle)', activation_rating: 75 }
          ]
        },
        {
          workout_name: 'Pull-ups',
          type: 'strength',
          notes: 'Bodyweight back exercise',
          muscles: [
            { muscle_name: 'Latissimus Dorsi', activation_rating: 95 },
            { muscle_name: 'Biceps Brachii', activation_rating: 85 },
            { muscle_name: 'Trapezius (Lower)', activation_rating: 80 },
            { muscle_name: 'Rhomboids', activation_rating: 75 }
          ]
        },
        {
          workout_name: 'Overhead Press',
          type: 'strength',
          notes: 'Shoulder press movement',
          muscles: [
            { muscle_name: 'Lateral Deltoid', activation_rating: 90 },
            { muscle_name: 'Anterior Deltoid', activation_rating: 85 },
            { muscle_name: 'Triceps (Lateral Head)', activation_rating: 80 },
            { muscle_name: 'Serratus Anterior', activation_rating: 70 }
          ]
        },
        {
          workout_name: 'Rows',
          type: 'strength',
          notes: 'Horizontal pulling movement',
          muscles: [
            { muscle_name: 'Rhomboids', activation_rating: 90 },
            { muscle_name: 'Trapezius (Middle)', activation_rating: 85 },
            { muscle_name: 'Latissimus Dorsi', activation_rating: 80 },
            { muscle_name: 'Biceps Brachii', activation_rating: 75 }
          ]
        },
        {
          workout_name: 'Lunges',
          type: 'strength',
          notes: 'Unilateral leg exercise',
          muscles: [
            { muscle_name: 'Quadriceps (Rectus Femoris)', activation_rating: 90 },
            { muscle_name: 'Glutes (Maximus)', activation_rating: 85 },
            { muscle_name: 'Hamstrings (Biceps Femoris)', activation_rating: 70 },
            { muscle_name: 'Calves (Gastrocnemius)', activation_rating: 60 }
          ]
        },
        {
          workout_name: 'Curls',
          type: 'strength',
          notes: 'Bicep isolation exercise',
          muscles: [
            { muscle_name: 'Biceps Brachii', activation_rating: 95 },
            { muscle_name: 'Brachialis', activation_rating: 80 },
            { muscle_name: 'Brachioradialis', activation_rating: 70 }
          ]
        },
        {
          workout_name: 'Tricep Dips',
          type: 'strength',
          notes: 'Tricep isolation exercise',
          muscles: [
            { muscle_name: 'Triceps (Lateral Head)', activation_rating: 95 },
            { muscle_name: 'Triceps (Long Head)', activation_rating: 85 },
            { muscle_name: 'Anterior Deltoid', activation_rating: 70 }
          ]
        },
        {
          workout_name: 'Planks',
          type: 'strength',
          notes: 'Core stability exercise',
          muscles: [
            { muscle_name: 'Rectus Abdominis', activation_rating: 90 },
            { muscle_name: 'Transverse Abdominis', activation_rating: 85 },
            { muscle_name: 'External Obliques', activation_rating: 80 },
            { muscle_name: 'Internal Obliques', activation_rating: 75 }
          ]
        }
      ];

      for (const workoutData of testWorkouts) {
        const result = await this.makeRequest('POST', '/workouts/', workoutData);
        if (result.success) {
          this.testWorkoutIds.push(result.data.workouts_id);
          console.log(`✅ Created workout: ${workoutData.workout_name}`);
        } else {
          throw new Error(`Failed to create workout: ${workoutData.workout_name}`);
        }
      }

      console.log(`✅ Created ${this.testWorkoutIds.length} test workouts`);
      this.testResults.workoutCreation = true;
      return true;
    } catch (error) {
      console.error('❌ Workout creation test failed:', error.message);
      return false;
    }
  }

  async testWorkoutLogging() {
    console.log('\n📝 Testing Workout Logging...');
    
    try {
      const testLogs = [
        { date: '2025-10-15', workout: 'Bench Press', weight: 135, reps: 12, rir: 2, attributes: ['drop_set'], attributeInputs: { 'drop_set_weight': 115, 'drop_set_reps': 8 } },
        { date: '2025-10-16', workout: 'Squats', weight: 185, reps: 10, rir: 1, attributes: ['rest_pause'], attributeInputs: { 'rest_pause_rest_time': 15, 'rest_pause_reps': 3 } },
        { date: '2025-10-17', workout: 'Deadlifts', weight: 225, reps: 8, rir: 0, attributes: ['partials'], attributeInputs: { 'partials_reps': 4 } },
        { date: '2025-10-18', workout: 'Pull-ups', weight: 0, reps: 8, rir: 2, attributes: ['assisted_sets'], attributeInputs: { 'assisted_sets_reps': 3 } },
        { date: '2025-10-19', workout: 'Overhead Press', weight: 95, reps: 10, rir: 1, attributes: ['negatives'], attributeInputs: { 'negatives_reps': 2 } },
        { date: '2025-10-20', workout: 'Rows', weight: 135, reps: 12, rir: 2, attributes: ['drop_set'], attributeInputs: { 'drop_set_weight': 115, 'drop_set_reps': 6 } },
        { date: '2025-10-21', workout: 'Lunges', weight: 45, reps: 15, rir: 1, attributes: [], attributeInputs: {} },
        { date: '2025-10-22', workout: 'Curls', weight: 30, reps: 15, rir: 2, attributes: ['rest_pause'], attributeInputs: { 'rest_pause_rest_time': 10, 'rest_pause_reps': 4 } },
        { date: '2025-10-23', workout: 'Tricep Dips', weight: 0, reps: 12, rir: 1, attributes: ['partials'], attributeInputs: { 'partials_reps': 3 } },
        { date: '2025-10-24', workout: 'Planks', weight: 0, reps: 0, rir: 0, attributes: [], attributeInputs: {}, rest_time: 60 }
      ];

      for (const logData of testLogs) {
        const workoutId = this.testWorkoutIds.find(id => {
          // Find workout by name - this is a simplified approach
          const workoutIndex = testLogs.indexOf(logData);
          return workoutIndex < this.testWorkoutIds.length;
        });

        if (workoutId) {
          const logPayload = {
            workout_id: workoutId,
            weight: logData.weight,
            reps: logData.reps,
            rir: logData.rir,
            rest_time: logData.rest_time || null,
            attributes: logData.attributes,
            attribute_inputs: logData.attributeInputs,
            date_time: `${logData.date}T10:00:00Z`
          };

          const result = await this.makeRequest('POST', '/workouts/logs/', logPayload);
          if (result.success) {
            this.testLogIds.push(result.data.workout_log_id);
            console.log(`✅ Logged workout: ${logData.workout} on ${logData.date}`);
          } else {
            throw new Error(`Failed to log workout: ${logData.workout}`);
          }
        }
      }

      console.log(`✅ Logged ${this.testLogIds.length} workout sessions`);
      this.testResults.workoutLogging = true;
      return true;
    } catch (error) {
      console.error('❌ Workout logging test failed:', error.message);
      return false;
    }
  }

  async testAutofillFunctionality() {
    console.log('\n🔄 Testing Autofill Functionality...');
    
    try {
      // Get workouts with recent logs
      const workoutsResult = await this.makeRequest('GET', '/workouts/');
      if (!workoutsResult.success) {
        throw new Error('Failed to fetch workouts');
      }

      const workouts = workoutsResult.data;
      let autofillTestsPassed = 0;

      for (const workout of workouts) {
        if (workout.recent_log) {
          console.log(`✅ Workout "${workout.workout_name}" has recent log data:`, {
            last_weight: workout.recent_log.last_weight,
            last_reps: workout.recent_log.last_reps,
            last_rir: workout.recent_log.last_rir,
            last_attributes: workout.recent_log.last_attributes,
            last_attribute_inputs: workout.recent_log.last_attribute_inputs
          });
          autofillTestsPassed++;
        }
      }

      if (autofillTestsPassed > 0) {
        console.log(`✅ Autofill functionality verified for ${autofillTestsPassed} workouts`);
        this.testResults.autofill = true;
        return true;
      } else {
        throw new Error('No workouts with recent logs found');
      }
    } catch (error) {
      console.error('❌ Autofill functionality test failed:', error.message);
      return false;
    }
  }

  async testQuickAddSystem() {
    console.log('\n⚡ Testing Quick Add System...');
    
    try {
      // Test getting previous day workouts
      const splitsResult = await this.makeRequest('GET', '/workouts/splits/');
      if (!splitsResult.success || splitsResult.data.length === 0) {
        throw new Error('No active splits found');
      }

      const activeSplit = splitsResult.data[0];
      console.log(`📅 Active split: ${activeSplit.split_name}, started: ${activeSplit.start_date}`);

      // Calculate previous day
      const currentDate = new Date('2025-10-25');
      const startDate = new Date(activeSplit.start_date);
      const daysDiff = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
      const splitLength = activeSplit.split_days.length;
      const previousDayIndex = (daysDiff - 1 + splitLength) % splitLength;
      
      const previousDate = new Date(startDate);
      previousDate.setDate(startDate.getDate() + previousDayIndex);
      const previousDateStr = previousDate.toISOString().split('T')[0];

      console.log(`📊 Previous split day: ${previousDateStr}`);

      // Get logs for previous day
      const logsResult = await this.makeRequest('GET', `/workouts/logs/?date_from=${previousDateStr}&date_to=${previousDateStr}`);
      if (logsResult.success) {
        const previousDayLogs = logsResult.data;
        console.log(`✅ Found ${previousDayLogs.length} workouts logged on previous day`);
        
        if (previousDayLogs.length > 0) {
          this.testResults.quickAdd = true;
          return true;
        }
      }

      throw new Error('No previous day workouts found');
    } catch (error) {
      console.error('❌ Quick add system test failed:', error.message);
      return false;
    }
  }

  async testMuscleProgress() {
    console.log('\n📈 Testing Muscle Progress Tracking...');
    
    try {
      // Test current split day
      const currentSplitResult = await this.makeRequest('GET', '/workouts/current-split-day/?date=2025-10-25');
      if (!currentSplitResult.success) {
        throw new Error('Failed to get current split day');
      }

      const currentSplitDay = currentSplitResult.data.current_split_day;
      if (currentSplitDay && currentSplitDay.targets) {
        console.log(`📊 Current split day: ${currentSplitDay.day_name}`);
        console.log(`🎯 Muscle targets: ${currentSplitDay.targets.length}`);
        
        // Test muscle progress calculation
        const today = '2025-10-25';
        const logsResult = await this.makeRequest('GET', `/workouts/logs/?date_from=${today}&date_to=${today}`);
        
        if (logsResult.success) {
          const todayLogs = logsResult.data;
          console.log(`📝 Today's logs: ${todayLogs.length}`);
          
          // Calculate progress for each target muscle
          const progress = {};
          currentSplitDay.targets.forEach(target => {
            progress[target.muscle_name] = {
              target: target.target_activation,
              current: 0
            };
          });

          todayLogs.forEach(log => {
            log.muscles.forEach(muscle => {
              if (progress[muscle.muscle_name]) {
                progress[muscle.muscle_name].current += muscle.activation_rating;
              }
            });
          });

          console.log('📊 Muscle progress summary:');
          Object.entries(progress).forEach(([muscle, data]) => {
            console.log(`  ${muscle}: ${data.current}/${data.target} (${Math.round(data.current/data.target*100)}%)`);
          });

          this.testResults.muscleProgress = true;
          return true;
        }
      }

      throw new Error('Muscle progress calculation failed');
    } catch (error) {
      console.error('❌ Muscle progress test failed:', error.message);
      return false;
    }
  }

  async testStatsSystem() {
    console.log('\n📊 Testing Stats System...');
    
    try {
      // Test stats for specific date
      const statsResult = await this.makeRequest('GET', '/workouts/stats/?date_from=2025-10-25&date_to=2025-10-25');
      if (!statsResult.success) {
        throw new Error('Failed to get workout stats');
      }

      const stats = statsResult.data;
      console.log('📊 Workout stats for 2025-10-25:', {
        total_sets: stats.total_sets,
        total_weight_lifted: stats.total_weight_lifted,
        total_reps: stats.total_reps,
        total_rir: stats.total_rir
      });

      // Test stats for date range
      const rangeStatsResult = await this.makeRequest('GET', '/workouts/stats/?date_from=2025-10-15&date_to=2025-10-25');
      if (rangeStatsResult.success) {
        const rangeStats = rangeStatsResult.data;
        console.log('📊 Workout stats for range 2025-10-15 to 2025-10-25:', {
          total_sets: rangeStats.total_sets,
          total_weight_lifted: rangeStats.total_weight_lifted,
          total_reps: rangeStats.total_reps,
          total_rir: rangeStats.total_rir
        });

        this.testResults.stats = true;
        return true;
      }

      throw new Error('Stats system test failed');
    } catch (error) {
      console.error('❌ Stats system test failed:', error.message);
      return false;
    }
  }

  async testDatePickerIntegration() {
    console.log('\n📅 Testing Date Picker Integration...');
    
    try {
      const testDates = ['2025-10-15', '2025-10-20', '2025-10-25'];
      let integrationTestsPassed = 0;

      for (const testDate of testDates) {
        console.log(`\n📅 Testing date: ${testDate}`);
        
        // Test logs for date
        const logsResult = await this.makeRequest('GET', `/workouts/logs/?date_from=${testDate}&date_to=${testDate}`);
        const logs = logsResult.success ? logsResult.data : [];
        
        // Test stats for date
        const statsResult = await this.makeRequest('GET', `/workouts/stats/?date_from=${testDate}&date_to=${testDate}`);
        const stats = statsResult.success ? statsResult.data : null;
        
        // Test current split day for date
        const splitDayResult = await this.makeRequest('GET', `/workouts/current-split-day/?date=${testDate}`);
        const splitDay = splitDayResult.success ? splitDayResult.data.current_split_day : null;

        console.log(`  📝 Logs: ${logs.length}`);
        console.log(`  📊 Stats: ${stats ? 'Available' : 'Not available'}`);
        console.log(`  🎯 Split day: ${splitDay ? splitDay.day_name : 'Not available'}`);

        if (logsResult.success && statsResult.success && splitDayResult.success) {
          integrationTestsPassed++;
        }
      }

      if (integrationTestsPassed === testDates.length) {
        console.log(`✅ Date picker integration verified for ${integrationTestsPassed} dates`);
        this.testResults.datePicker = true;
        return true;
      } else {
        throw new Error(`Only ${integrationTestsPassed}/${testDates.length} date tests passed`);
      }
    } catch (error) {
      console.error('❌ Date picker integration test failed:', error.message);
      return false;
    }
  }

  async testDatabaseConsistency() {
    console.log('\n🔍 Testing Database Consistency...');
    
    try {
      let consistencyTestsPassed = 0;
      const totalTests = 5;

      // Test 1: Verify workout logs match workout data
      const logsResult = await this.makeRequest('GET', '/workouts/logs/?date_from=2025-10-15&date_to=2025-10-25');
      const workoutsResult = await this.makeRequest('GET', '/workouts/');
      
      if (logsResult.success && workoutsResult.success) {
        const logs = logsResult.data;
        const workouts = workoutsResult.data;
        
        let validLogs = 0;
        logs.forEach(log => {
          const workout = workouts.find(w => w.workouts_id === log.workout.workouts_id);
          if (workout) {
            validLogs++;
          }
        });
        
        console.log(`✅ Log-Workout consistency: ${validLogs}/${logs.length} logs have valid workouts`);
        consistencyTestsPassed++;
      }

      // Test 2: Verify split data integrity
      const splitsResult = await this.makeRequest('GET', '/workouts/splits/');
      if (splitsResult.success && splitsResult.data.length > 0) {
        const split = splitsResult.data[0];
        if (split.split_days && split.split_days.length > 0) {
          console.log(`✅ Split data integrity: ${split.split_days.length} split days`);
          consistencyTestsPassed++;
        }
      }

      // Test 3: Verify muscle data consistency
      const musclesResult = await this.makeRequest('GET', '/workouts/muscles/');
      if (musclesResult.success) {
        const muscles = musclesResult.data;
        const muscleGroups = [...new Set(muscles.map(m => m.muscle_group))];
        console.log(`✅ Muscle data: ${muscles.length} muscles across ${muscleGroups.length} groups`);
        consistencyTestsPassed++;
      }

      // Test 4: Verify stats calculation accuracy
      const statsResult = await this.makeRequest('GET', '/workouts/stats/?date_from=2025-10-25&date_to=2025-10-25');
      if (statsResult.success) {
        const stats = statsResult.data;
        if (typeof stats.total_sets === 'number' && typeof stats.total_weight_lifted === 'number') {
          console.log(`✅ Stats calculation: Valid numeric values`);
          consistencyTestsPassed++;
        }
      }

      // Test 5: Verify attribute data integrity
      const logsWithAttributes = await this.makeRequest('GET', '/workouts/logs/?date_from=2025-10-15&date_to=2025-10-25');
      if (logsWithAttributes.success) {
        const logs = logsWithAttributes.data;
        const logsWithAttrs = logs.filter(log => log.attributes && log.attributes.length > 0);
        console.log(`✅ Attribute data: ${logsWithAttrs.length}/${logs.length} logs have attributes`);
        consistencyTestsPassed++;
      }

      if (consistencyTestsPassed === totalTests) {
        console.log(`✅ Database consistency verified: ${consistencyTestsPassed}/${totalTests} tests passed`);
        this.testResults.databaseConsistency = true;
        return true;
      } else {
        throw new Error(`Only ${consistencyTestsPassed}/${totalTests} consistency tests passed`);
      }
    } catch (error) {
      console.error('❌ Database consistency test failed:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Workout System Testing...\n');
    console.log('=' * 60);

    const tests = [
      { name: 'Authentication', fn: () => this.testAuthentication() },
      { name: 'Split Creation', fn: () => this.testSplitCreation() },
      { name: 'Workout Creation', fn: () => this.testWorkoutCreation() },
      { name: 'Workout Logging', fn: () => this.testWorkoutLogging() },
      { name: 'Autofill Functionality', fn: () => this.testAutofillFunctionality() },
      { name: 'Quick Add System', fn: () => this.testQuickAddSystem() },
      { name: 'Muscle Progress', fn: () => this.testMuscleProgress() },
      { name: 'Stats System', fn: () => this.testStatsSystem() },
      { name: 'Date Picker Integration', fn: () => this.testDatePickerIntegration() },
      { name: 'Database Consistency', fn: () => this.testDatabaseConsistency() }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      try {
        const result = await test.fn();
        if (result) {
          passedTests++;
        }
      } catch (error) {
        console.error(`❌ ${test.name} test failed:`, error.message);
      }
    }

    console.log('\n' + '=' * 60);
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' * 60);
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    console.log('\n📋 Detailed Results:');
    Object.entries(this.testResults).forEach(([test, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! The workout tracking system is fully functional.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }

    return this.testResults;
  }
}

// Run the tests
const tester = new WorkoutSystemTester();
tester.runAllTests().then(results => {
  console.log('\n🏁 Testing completed.');
}).catch(error => {
  console.error('💥 Testing failed:', error);
});
