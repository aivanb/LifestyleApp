# Feature Expansion Guide for AI Agents

This guide provides step-by-step instructions for safely adding new features to the Workout & Macro Tracking App.

## Before You Start

### Pre-Expansion Checklist
- [ ] Understand existing architecture (see `architecture.md`)
- [ ] Check if similar functionality exists
- [ ] Plan database schema changes
- [ ] Consider API endpoint design
- [ ] Plan frontend components
- [ ] Think about testing approach

## Adding a New Tracker

Example: Adding a "Mood Tracker" feature

### Step 1: Database Model

```python
# backend/apps/health/models.py

class MoodLog(models.Model):
    mood_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    mood_value = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    mood_notes = models.TextField(blank=True, null=True)
    energy_level = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        null=True, blank=True
    )
    stress_level = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'health_moodlog'
        ordering = ['-created_at']
```

### Step 2: Create Migration

```bash
cd backend
python manage.py makemigrations health
python manage.py migrate
```

### Step 3: Create Serializer

```python
# backend/apps/health/serializers.py

class MoodLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodLog
        fields = [
            'mood_log_id', 'mood_value', 'mood_notes',
            'energy_level', 'stress_level', 'created_at'
        ]
        read_only_fields = ['mood_log_id', 'created_at']
```

### Step 4: Create Views

```python
# backend/apps/health/views.py

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def mood_logs(request):
    """Get or create mood logs"""
    if request.method == 'GET':
        logs = MoodLog.objects.filter(user=request.user)
        
        # Add date filtering
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if date_from:
            logs = logs.filter(created_at__gte=date_from)
        if date_to:
            logs = logs.filter(created_at__lte=date_to)
            
        serializer = MoodLogSerializer(logs[:100], many=True)
        return Response({'data': serializer.data})
    
    elif request.method == 'POST':
        serializer = MoodLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(
                {'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mood_trends(request):
    """Get mood trends over time"""
    days = int(request.query_params.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)
    
    logs = MoodLog.objects.filter(
        user=request.user,
        created_at__gte=start_date
    ).values('created_at__date').annotate(
        avg_mood=Avg('mood_value'),
        avg_energy=Avg('energy_level'),
        avg_stress=Avg('stress_level')
    )
    
    return Response({'data': list(logs)})
```

### Step 5: Add URLs

```python
# backend/apps/health/urls.py

urlpatterns = [
    # ... existing patterns
    path('mood/', views.mood_logs, name='mood-logs'),
    path('mood/trends/', views.mood_trends, name='mood-trends'),
]
```

### Step 6: Create React Component

```javascript
// frontend/src/components/trackers/MoodTracker.js

import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const MoodTracker = () => {
  const [moodValue, setMoodValue] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [moodNotes, setMoodNotes] = useState('');
  const [recentMoods, setRecentMoods] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecentMoods();
  }, []);

  const fetchRecentMoods = async () => {
    try {
      const response = await api.get('/health/mood/');
      setRecentMoods(response.data.data);
    } catch (error) {
      console.error('Failed to fetch moods:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        mood_value: moodValue,
        energy_level: energyLevel,
        stress_level: stressLevel,
        mood_notes: moodNotes
      };

      await api.post('/health/mood/', data);
      
      // Reset form
      setMoodValue(5);
      setEnergyLevel(5);
      setStressLevel(5);
      setMoodNotes('');
      
      // Refresh list
      fetchRecentMoods();
      
      alert('Mood logged successfully!');
    } catch (error) {
      alert('Failed to log mood');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mood-tracker">
      <h2>Mood Tracker</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Mood (1-10)</label>
          <input
            type="range"
            min="1"
            max="10"
            value={moodValue}
            onChange={(e) => setMoodValue(e.target.value)}
          />
          <span>{moodValue}</span>
        </div>

        <div className="form-group">
          <label>Energy Level (1-10)</label>
          <input
            type="range"
            min="1"
            max="10"
            value={energyLevel}
            onChange={(e) => setEnergyLevel(e.target.value)}
          />
          <span>{energyLevel}</span>
        </div>

        <div className="form-group">
          <label>Stress Level (1-10)</label>
          <input
            type="range"
            min="1"
            max="10"
            value={stressLevel}
            onChange={(e) => setStressLevel(e.target.value)}
          />
          <span>{stressLevel}</span>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={moodNotes}
            onChange={(e) => setMoodNotes(e.target.value)}
            placeholder="How are you feeling?"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging...' : 'Log Mood'}
        </button>
      </form>

      <div className="recent-moods">
        <h3>Recent Moods</h3>
        {recentMoods.map(mood => (
          <div key={mood.mood_log_id}>
            {new Date(mood.created_at).toLocaleDateString()}: 
            Mood {mood.mood_value}/10
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoodTracker;
```

### Step 7: Add to Menu

```javascript
// frontend/src/components/AdditionalTrackersMenu.js

const trackers = [
  // ... existing trackers
  {
    name: 'Mood',
    path: '/additional-trackers/mood',
    icon: '😊',
    description: 'Track your mood and energy levels'
  }
];
```

### Step 8: Add Route

```javascript
// frontend/src/pages/AdditionalTrackers.js

import MoodTracker from '../components/trackers/MoodTracker';

// In the Routes section
<Route path="mood" element={<MoodTracker />} />
```

### Step 9: Create Tests

```python
# backend/apps/health/tests.py

class MoodLogTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_mood_log(self):
        data = {
            'mood_value': 7,
            'energy_level': 6,
            'stress_level': 4,
            'mood_notes': 'Feeling good today'
        }
        response = self.client.post('/api/health/mood/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['data']['mood_value'], 7)
    
    def test_get_mood_logs(self):
        MoodLog.objects.create(
            user=self.user,
            mood_value=8
        )
        response = self.client.get('/api/health/mood/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['data']), 1)
```

## Adding AI Features

### Example: Smart Meal Suggestions

#### Step 1: Create Prompt Template

```python
# backend/apps/openai_service/prompts.py

MEAL_SUGGESTION_PROMPT = """
Based on the user's goals and recent food logs, suggest 3 meals:

User Goals:
- Calories: {calories_goal}
- Protein: {protein_goal}g
- Carbs: {carbs_goal}g
- Fat: {fat_goal}g

Today's Progress:
- Calories: {calories_consumed} consumed
- Protein: {protein_consumed}g consumed
- Carbs: {carbs_consumed}g consumed
- Fat: {fat_consumed}g consumed

Remaining:
- Calories: {calories_remaining}
- Protein: {protein_remaining}g
- Carbs: {carbs_remaining}g
- Fat: {fat_remaining}g

Suggest 3 meals that would help meet these remaining macros.
Format as JSON array with: name, calories, protein, carbs, fat, ingredients.
"""
```

#### Step 2: Add Service Method

```python
# backend/apps/openai_service/services.py

def get_meal_suggestions(self, user):
    """Get AI-powered meal suggestions based on user's goals"""
    # Get user goals
    goals = user.usergoal
    
    # Calculate today's consumption
    today_logs = FoodLog.objects.filter(
        user=user,
        created_at__date=timezone.now().date()
    ).aggregate(
        calories=Sum('food__calories'),
        protein=Sum('food__protein'),
        carbs=Sum('food__carbohydrates'),
        fat=Sum('food__fat')
    )
    
    # Prepare prompt
    prompt = MEAL_SUGGESTION_PROMPT.format(
        calories_goal=goals.calories_goal,
        protein_goal=goals.protein_goal,
        carbs_goal=goals.carbohydrates_goal,
        fat_goal=goals.fat_goal,
        calories_consumed=today_logs['calories'] or 0,
        protein_consumed=today_logs['protein'] or 0,
        carbs_consumed=today_logs['carbs'] or 0,
        fat_consumed=today_logs['fat'] or 0,
        calories_remaining=goals.calories_goal - (today_logs['calories'] or 0),
        protein_remaining=goals.protein_goal - (today_logs['protein'] or 0),
        carbs_remaining=goals.carbohydrates_goal - (today_logs['carbs'] or 0),
        fat_remaining=goals.fat_goal - (today_logs['fat'] or 0)
    )
    
    # Get AI response
    response = self.send_prompt(prompt, user)
    
    if response['success']:
        try:
            suggestions = json.loads(response['response'])
            return {
                'success': True,
                'suggestions': suggestions
            }
        except json.JSONDecodeError:
            return {
                'success': False,
                'error': 'Failed to parse AI response'
            }
    
    return response
```

## Integration Patterns

### Pattern 1: Feature Flag

```python
# backend/apps/users/models.py

class UserFeatures(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    mood_tracking_enabled = models.BooleanField(default=True)
    ai_suggestions_enabled = models.BooleanField(default=True)
    voice_logging_enabled = models.BooleanField(default=True)
```

### Pattern 2: Notification System

```python
# backend/apps/notifications/models.py

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Pattern 3: Data Export

```python
# backend/apps/data_viewer/views.py

def export_user_data(request):
    """Export all user data as ZIP"""
    user = request.user
    
    # Create ZIP file
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
        # Export each data type
        for model, filename in [
            (FoodLog, 'food_logs.csv'),
            (WeightLog, 'weight_logs.csv'),
            (Workout, 'workouts.csv'),
        ]:
            data = model.objects.filter(user=user)
            csv_data = serialize_to_csv(data)
            zip_file.writestr(filename, csv_data)
    
    # Return ZIP file
    response = HttpResponse(
        zip_buffer.getvalue(),
        content_type='application/zip'
    )
    response['Content-Disposition'] = 'attachment; filename=my_data.zip'
    return response
```

## Best Practices

### DO's
- ✅ Follow existing patterns
- ✅ Add proper validation
- ✅ Include error handling
- ✅ Write tests
- ✅ Update documentation
- ✅ Consider mobile responsiveness
- ✅ Add loading states
- ✅ Implement data pagination

### DON'Ts
- ❌ Skip authentication checks
- ❌ Hardcode values
- ❌ Ignore existing utilities
- ❌ Create duplicate functionality
- ❌ Skip database migrations
- ❌ Forget about timezones
- ❌ Ignore performance impact

## Common Expansion Areas

### 1. New Data Visualizations
- Add chart components using existing data
- Create summary dashboards
- Add export functionality

### 2. Social Features
- User connections
- Sharing workouts/meals
- Challenges and competitions

### 3. Advanced Analytics
- Progress predictions
- Trend analysis
- Recommendations

### 4. External Integrations
- Fitness device APIs
- Nutrition databases
- Health app sync

### 5. Automation
- Recurring meal plans
- Workout schedules
- Reminder notifications

## Testing New Features

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test complete user flows
4. **Performance Tests**: Check impact on speed
5. **Security Tests**: Verify data isolation

---

**Remember**: Always build on existing patterns. The codebase has established conventions - follow them for consistency.
