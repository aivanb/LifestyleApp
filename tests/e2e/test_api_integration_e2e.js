/**
 * API Integration E2E Tests
 * 
 * Tests the actual API endpoints and database integration including:
 * - Authentication API endpoints
 * - Food creation and retrieval APIs
 * - Meal creation and management APIs
 * - Food logging APIs
 * - Data persistence and retrieval
 * - Error handling and validation
 */

const { test, expect } = require('@playwright/test');

test.describe('API Integration Tests', () => {
  let authToken = null;
  let createdFoodId = null;
  let createdMealId = null;

  test.beforeAll(async ({ browser }) => {
    // Verify backend server is running
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      const response = await page.goto('http://localhost:8000/api/auth/profile/', { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      
      if (response.status() === 404) {
        throw new Error('Backend server not running');
      }
    } catch (error) {
      throw new Error('Backend server is not accessible. Please start Django server on port 8000');
    }
    
    await context.close();
  });

  test('Authentication API - Login and Token Retrieval', async ({ page }) => {
    // Test login API endpoint
    const loginResponse = await page.request.post('http://localhost:8000/api/auth/login/', {
      data: {
        username: 'testuser',
        password: 'testpass123'
      }
    });

    expect(loginResponse.status()).toBe(200);
    
    const loginData = await loginResponse.json();
    expect(loginData).toHaveProperty('data');
    expect(loginData.data).toHaveProperty('access_token');
    
    authToken = loginData.data.access_token;
  });

  test('Authentication API - Profile Retrieval', async ({ page }) => {
    // Test profile API endpoint
    const profileResponse = await page.request.get('http://localhost:8000/api/auth/profile/', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(profileResponse.status()).toBe(200);
    
    const profileData = await profileResponse.json();
    expect(profileData).toHaveProperty('data');
    expect(profileData.data).toHaveProperty('username');
    expect(profileData.data.username).toBe('testuser');
  });

  test('Food API - Create New Food', async ({ page }) => {
    const timestamp = Date.now();
    const testFoodData = {
      food_name: `API Test Food ${timestamp}`,
      serving_size: 100,
      unit: 'g',
      calories: 300,
      protein: 25,
      carbohydrates: 40,
      fat: 12,
      fiber: 5,
      sodium: 200,
      sugar: 8,
      saturated_fat: 4,
      trans_fat: 0,
      calcium: 100,
      iron: 2,
      magnesium: 50,
      cholesterol: 30,
      vitamin_a: 500,
      vitamin_c: 60,
      vitamin_d: 10,
      caffeine: 0,
      food_group: 'other',
      brand: 'Test Brand',
      cost: 5.99,
      make_public: false
    };

    const createResponse = await page.request.post('http://localhost:8000/api/foods/', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: testFoodData
    });

    expect(createResponse.status()).toBe(201);
    
    const createData = await createResponse.json();
    expect(createData).toHaveProperty('data');
    expect(createData.data).toHaveProperty('food_id');
    expect(createData.data.food_name).toBe(testFoodData.food_name);
    
    createdFoodId = createData.data.food_id;
  });

  test('Food API - Retrieve Food by ID', async ({ page }) => {
    expect(createdFoodId).toBeTruthy();
    
    const getResponse = await page.request.get(`http://localhost:8000/api/foods/${createdFoodId}/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(getResponse.status()).toBe(200);
    
    const foodData = await getResponse.json();
    expect(foodData).toHaveProperty('data');
    expect(foodData.data.food_id).toBe(createdFoodId);
    expect(foodData.data.food_name).toContain('API Test Food');
  });

  test('Food API - Search Foods', async ({ page }) => {
    const searchResponse = await page.request.get('http://localhost:8000/api/foods/', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        search: 'API Test Food',
        page_size: 50
      }
    });

    expect(searchResponse.status()).toBe(200);
    
    const searchData = await searchResponse.json();
    expect(searchData).toHaveProperty('data');
    expect(searchData.data).toHaveProperty('foods');
    expect(Array.isArray(searchData.data.foods)).toBe(true);
    
    // Verify our created food is in the results
    const foundFood = searchData.data.foods.find(food => food.food_id === createdFoodId);
    expect(foundFood).toBeTruthy();
  });

  test('Meal API - Create New Meal', async ({ page }) => {
    expect(createdFoodId).toBeTruthy();
    
    const timestamp = Date.now();
    const testMealData = {
      meal_name: `API Test Meal ${timestamp}`,
      foods: [
        {
          food_id: createdFoodId,
          servings: '2'
        }
      ],
      create_and_log: false
    };

    const createResponse = await page.request.post('http://localhost:8000/api/meals/', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: testMealData
    });

    expect(createResponse.status()).toBe(201);
    
    const createData = await createResponse.json();
    expect(createData).toHaveProperty('data');
    expect(createData.data).toHaveProperty('meal_id');
    expect(createData.data.meal_name).toBe(testMealData.meal_name);
    
    createdMealId = createData.data.meal_id;
  });

  test('Meal API - Retrieve Meal by ID', async ({ page }) => {
    expect(createdMealId).toBeTruthy();
    
    const getResponse = await page.request.get(`http://localhost:8000/api/meals/${createdMealId}/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(getResponse.status()).toBe(200);
    
    const mealData = await getResponse.json();
    expect(mealData).toHaveProperty('data');
    expect(mealData.data.meal_id).toBe(createdMealId);
    expect(mealData.data.meal_name).toContain('API Test Meal');
    expect(mealData.data.foods).toBeDefined();
    expect(mealData.data.foods.length).toBeGreaterThan(0);
  });

  test('Food Log API - Create Food Log Entry', async ({ page }) => {
    expect(createdFoodId).toBeTruthy();
    
    const logData = {
      food_id: createdFoodId,
      servings: '1.5',
      date_time: new Date().toISOString()
    };

    const createResponse = await page.request.post('http://localhost:8000/api/food-logs/', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: logData
    });

    expect(createResponse.status()).toBe(201);
    
    const createData = await createResponse.json();
    expect(createData).toHaveProperty('data');
    expect(createData.data).toHaveProperty('macro_log_id');
    expect(createData.data.food_id).toBe(createdFoodId);
  });

  test('Food Log API - Retrieve Food Logs', async ({ page }) => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const getResponse = await page.request.get('http://localhost:8000/api/food-logs/', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        page_size: 100
      }
    });

    expect(getResponse.status()).toBe(200);
    
    const logData = await getResponse.json();
    expect(logData).toHaveProperty('data');
    expect(logData.data).toHaveProperty('logs');
    expect(Array.isArray(logData.data.logs)).toBe(true);
  });

  test('User Goals API - Retrieve User Goals', async ({ page }) => {
    const goalsResponse = await page.request.get('http://localhost:8000/api/user-goals/', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(goalsResponse.status()).toBe(200);
    
    const goalsData = await goalsResponse.json();
    expect(goalsData).toHaveProperty('data');
    // Goals data structure may vary, but should have some properties
    expect(goalsData.data).toBeDefined();
  });

  test('Recently Logged Foods API - Retrieve Recent Foods', async ({ page }) => {
    const recentResponse = await page.request.get('http://localhost:8000/api/recently-logged-foods/', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        days: 7
      }
    });

    expect(recentResponse.status()).toBe(200);
    
    const recentData = await recentResponse.json();
    expect(recentData).toHaveProperty('data');
    expect(recentData.data).toHaveProperty('foods');
    expect(Array.isArray(recentData.data.foods)).toBe(true);
  });

  test('API Error Handling - Invalid Endpoint', async ({ page }) => {
    const errorResponse = await page.request.get('http://localhost:8000/api/nonexistent-endpoint/', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(errorResponse.status()).toBe(404);
  });

  test('API Error Handling - Invalid Authentication', async ({ page }) => {
    const errorResponse = await page.request.get('http://localhost:8000/api/foods/', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    expect([401, 403]).toContain(errorResponse.status());
  });

  test('API Error Handling - Invalid Data Format', async ({ page }) => {
    const errorResponse = await page.request.post('http://localhost:8000/api/foods/', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        // Missing required fields
        food_name: 'Test'
      }
    });

    expect([400, 422]).toContain(errorResponse.status());
    
    const errorData = await errorResponse.json();
    expect(errorData).toHaveProperty('error');
  });

  test('Database Transaction Integrity - Concurrent API Calls', async ({ page }) => {
    // Test concurrent API calls to ensure database integrity
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push(
        page.request.get('http://localhost:8000/api/foods/', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          params: {
            page_size: 10
          }
        })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // All responses should be successful
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
    
    // All responses should have consistent data structure
    const responseData = await Promise.all(responses.map(r => r.json()));
    responseData.forEach(data => {
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('foods');
      expect(Array.isArray(data.data.foods)).toBe(true);
    });
  });

  test('API Performance - Response Time Validation', async ({ page }) => {
    const startTime = Date.now();
    
    const response = await page.request.get('http://localhost:8000/api/foods/', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        page_size: 50
      }
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });

  test('Data Consistency - Food Creation and Retrieval', async ({ page }) => {
    // Create a food with specific data
    const timestamp = Date.now();
    const testFoodData = {
      food_name: `Consistency Test Food ${timestamp}`,
      serving_size: 150,
      unit: 'g',
      calories: 400,
      protein: 30,
      carbohydrates: 50,
      fat: 15
    };

    const createResponse = await page.request.post('http://localhost:8000/api/foods/', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: testFoodData
    });

    expect(createResponse.status()).toBe(201);
    const createdFood = await createResponse.json();
    const foodId = createdFood.data.food_id;

    // Retrieve the food and verify data consistency
    const getResponse = await page.request.get(`http://localhost:8000/api/foods/${foodId}/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(getResponse.status()).toBe(200);
    const retrievedFood = await getResponse.json();

    // Verify all data matches
    expect(retrievedFood.data.food_name).toBe(testFoodData.food_name);
    expect(retrievedFood.data.serving_size).toBe(testFoodData.serving_size);
    expect(retrievedFood.data.unit).toBe(testFoodData.unit);
    expect(retrievedFood.data.calories).toBe(testFoodData.calories);
    expect(retrievedFood.data.protein).toBe(testFoodData.protein);
    expect(retrievedFood.data.carbohydrates).toBe(testFoodData.carbohydrates);
    expect(retrievedFood.data.fat).toBe(testFoodData.fat);
  });

  test.afterAll(async ({ page }) => {
    // Clean up created test data
    if (createdMealId) {
      try {
        await page.request.delete(`http://localhost:8000/api/meals/${createdMealId}/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
      } catch (error) {
        console.log('Failed to delete test meal:', error);
      }
    }

    if (createdFoodId) {
      try {
        await page.request.delete(`http://localhost:8000/api/foods/${createdFoodId}/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
      } catch (error) {
        console.log('Failed to delete test food:', error);
      }
    }
  });
});
