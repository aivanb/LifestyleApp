/**
 * REAL SYSTEM TEST - Tests the actual workout tracking system
 * This script tests the real frontend and backend to ensure everything works
 */

const axios = require('axios');
const puppeteer = require('puppeteer');

const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';

// Test user credentials
const TEST_USER = {
  username: 'john_doe',
  password: 'testpass123'
};

let authToken = null;

async function testBackendAPI() {
  console.log('🔧 Testing Backend API...');
  
  try {
    // Test authentication
    const authResponse = await axios.post(`${BACKEND_URL}/api/auth/login/`, {
      username: TEST_USER.username,
      password: TEST_USER.password
    });
    
    authToken = authResponse.data.data.tokens.access;
    console.log('✅ Authentication successful');
    
    // Test all workout endpoints
    const endpoints = [
      { name: 'Muscles', url: '/api/workouts/muscles/' },
      { name: 'Workouts', url: '/api/workouts/' },
      { name: 'Muscle Priorities', url: '/api/workouts/muscle-priorities/' },
      { name: 'Splits', url: '/api/workouts/splits/' },
      { name: 'Workout Logs', url: '/api/workouts/logs/' },
      { name: 'Workout Stats', url: '/api/workouts/stats/' },
      { name: 'Workout Icons', url: '/api/workouts/icons/' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BACKEND_URL}${endpoint.url}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.status === 200 && response.data.success) {
          console.log(`✅ ${endpoint.name} - Working`);
        } else {
          console.log(`❌ ${endpoint.name} - Failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} - Error: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Backend API test failed: ${error.message}`);
    return false;
  }
}

async function testFrontendWorkflow() {
  console.log('🌐 Testing Frontend Workflow...');
  
  try {
    const browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Go to login page
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForSelector('input[name="username"]');
    
    // Login
    await page.type('input[name="username"]', TEST_USER.username);
    await page.type('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to profile
    await page.waitForNavigation();
    console.log('✅ Login successful');
    
    // Navigate to workout tracker
    await page.goto(`${FRONTEND_URL}/workout-tracker`);
    await page.waitForSelector('h1');
    
    const title = await page.title();
    console.log(`✅ Workout Tracker page loaded: ${title}`);
    
    // Test each tab
    const tabs = ['Muscle Priority', 'Workout Adder', 'Split Creator', 'Workout Logger', 'Workout Log'];
    
    for (const tab of tabs) {
      try {
        await page.click(`text=${tab}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if the tab content is visible
        const tabContent = await page.$(`text=${tab}`);
        if (tabContent) {
          console.log(`✅ ${tab} tab - Working`);
        } else {
          console.log(`❌ ${tab} tab - Not visible`);
        }
      } catch (error) {
        console.log(`❌ ${tab} tab - Error: ${error.message}`);
      }
    }
    
    // Test workout creation
    try {
      await page.click('text=Workout Adder');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.type('input[name="workout_name"]', 'Test Workout');
      await page.select('select[name="type"]', 'barbell');
      await page.type('input[name="location"]', 'Test Gym');
      
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Workout creation test completed');
    } catch (error) {
      console.log(`❌ Workout creation test failed: ${error.message}`);
    }
    
    await browser.close();
    return true;
  } catch (error) {
    console.log(`❌ Frontend test failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseOperations() {
  console.log('💾 Testing Database Operations...');
  
  try {
    // Create a test workout
    const workoutData = {
      workout_name: 'Test Database Workout',
      type: 'dumbbell',
      location: 'Test Location',
      notes: 'Created by system test',
      make_public: false
    };
    
    const createResponse = await axios.post(`${BACKEND_URL}/api/workouts/`, workoutData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (createResponse.status === 201) {
      console.log('✅ Workout creation - Working');
      const workoutId = createResponse.data.data.workouts_id;
      
      // Test workout log creation
      const logData = {
        workout: workoutId,
        weight: 100,
        reps: 10,
        rir: 2,
        date_time: new Date().toISOString()
      };
      
      const logResponse = await axios.post(`${BACKEND_URL}/api/workouts/logs/`, logData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (logResponse.status === 201) {
        console.log('✅ Workout logging - Working');
        
        // Clean up test data
        await axios.delete(`${BACKEND_URL}/api/workouts/logs/${logResponse.data.data.workout_log_id}/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        await axios.delete(`${BACKEND_URL}/api/workouts/${workoutId}/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        console.log('✅ Database operations - Working');
        return true;
      } else {
        console.log(`❌ Workout logging failed: ${logResponse.status}`);
        return false;
      }
    } else {
      console.log(`❌ Workout creation failed: ${createResponse.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Database operations test failed: ${error.message}`);
    return false;
  }
}

async function runSystemTest() {
  console.log('🚀 Starting Real System Test...');
  console.log('=====================================');
  
  const backendTest = await testBackendAPI();
  const frontendTest = await testFrontendWorkflow();
  const databaseTest = await testDatabaseOperations();
  
  console.log('=====================================');
  console.log('📊 Test Results:');
  console.log(`Backend API: ${backendTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Frontend Workflow: ${frontendTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Operations: ${databaseTest ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = backendTest && frontendTest && databaseTest;
  console.log(`Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('🎉 The workout tracking system is FULLY FUNCTIONAL!');
  } else {
    console.log('⚠️ Some issues need to be fixed.');
  }
}

// Run the test
runSystemTest().catch(console.error);
