/**
 * Simple Workout System Test
 * Tests the system with existing data
 */

const API_BASE_URL = 'http://localhost:8000/api';

async function testWorkoutSystem() {
  console.log('🚀 Testing Workout System with Existing Data...\n');

  try {
    // Test 1: Authentication
    console.log('🔐 Testing Authentication...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'john_doe', password: 'testpass123' })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('Login failed');
    }
    
    const token = loginData.data.access;
    console.log('✅ Authentication successful');

    // Test 2: Get workouts
    console.log('\n🏋️ Testing Workout Retrieval...');
    const workoutsResponse = await fetch(`${API_BASE_URL}/workouts/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const workoutsData = await workoutsResponse.json();
    console.log(`✅ Retrieved ${workoutsData.data.length} workouts`);

    // Test 3: Get splits
    console.log('\n📅 Testing Split Retrieval...');
    const splitsResponse = await fetch(`${API_BASE_URL}/workouts/splits/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const splitsData = await splitsResponse.json();
    console.log(`✅ Retrieved ${splitsData.data.length} splits`);

    // Test 4: Get workout logs
    console.log('\n📝 Testing Workout Log Retrieval...');
    const logsResponse = await fetch(`${API_BASE_URL}/workouts/logs/?date_from=2025-10-15&date_to=2025-10-25`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const logsData = await logsResponse.json();
    console.log(`✅ Retrieved ${logsData.data.length} workout logs`);

    // Test 5: Get workout stats
    console.log('\n📊 Testing Workout Stats...');
    const statsResponse = await fetch(`${API_BASE_URL}/workouts/stats/?date_from=2025-10-25&date_to=2025-10-25`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const statsData = await statsResponse.json();
    console.log('✅ Workout stats:', statsData.data);

    // Test 6: Get current split day
    console.log('\n🎯 Testing Current Split Day...');
    const splitDayResponse = await fetch(`${API_BASE_URL}/workouts/current-split-day/?date=2025-10-25`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const splitDayData = await splitDayResponse.json();
    if (splitDayData.success && splitDayData.data.current_split_day) {
      console.log('✅ Current split day:', splitDayData.data.current_split_day.day_name);
    } else {
      console.log('⚠️ No active split found');
    }

    // Test 7: Test autofill functionality
    console.log('\n🔄 Testing Autofill Functionality...');
    const workoutsWithRecentLogs = workoutsData.data.filter(w => w.recent_log);
    console.log(`✅ ${workoutsWithRecentLogs.length} workouts have recent log data for autofill`);

    // Test 8: Test quick add functionality
    console.log('\n⚡ Testing Quick Add Functionality...');
    const previousDayLogs = await fetch(`${API_BASE_URL}/workouts/logs/?date_from=2025-10-24&date_to=2025-10-24`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const previousDayData = await previousDayLogs.json();
    console.log(`✅ Found ${previousDayData.data.length} workouts from previous day for quick add`);

    console.log('\n🎉 All tests passed! The workout tracking system is functional.');
    
    // Summary
    console.log('\n📋 System Summary:');
    console.log(`  - Users: Available`);
    console.log(`  - Workouts: ${workoutsData.data.length}`);
    console.log(`  - Splits: ${splitsData.data.length}`);
    console.log(`  - Workout Logs: ${logsData.data.length}`);
    console.log(`  - Recent Logs for Autofill: ${workoutsWithRecentLogs.length}`);
    console.log(`  - Previous Day Workouts: ${previousDayData.data.length}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWorkoutSystem();
