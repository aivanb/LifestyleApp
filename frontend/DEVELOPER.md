# Frontend Developer Guide for AI Agents

Technical documentation for AI agents working on the React frontend. This document covers architecture, components, state management, APIs, and extension points.

## Architecture Overview

### Directory Structure
```
frontend/src/
├── components/          # Reusable UI components
│   ├── trackers/       # Health metric trackers
│   ├── analytics/      # Chart components
│   └── ...             # Other components
├── pages/              # Route-level components
├── services/           # API communication layer
├── contexts/           # React Context providers
├── utils/              # Utility functions
├── App.js              # Main application component
├── index.js            # Application entry point
└── index.css           # Global styles
```

### Component Hierarchy
```
App
├── ThemeProvider
├── AuthProvider
├── Router
│   ├── Navbar
│   └── Routes
│       ├── Login (Public)
│       ├── Register (Public)
│       ├── Profile (Protected)
│       ├── FoodLog (Protected)
│       ├── WorkoutTracker (Protected)
│       ├── AdditionalTrackers (Protected)
│       ├── DataViewer (Protected)
│       ├── Analytics (Protected)
│       └── Personalization (Protected)
```

## Pages (`src/pages/`)

### Public Pages
- **Login.js** - User authentication form
- **Register.js** - User registration form

### Protected Pages
- **Profile.js** - User profile management (tabs: Personal Info, Goals, Body Metrics, History)
- **FoodLog.js** - Food logging interface (uses FoodLoggingDashboard)
- **WorkoutTracker.js** - Workout tracking interface (uses WorkoutLoggingDashboard)
- **AdditionalTrackers.js** - Health metrics tracking menu
- **DataViewer.js** - Database viewer interface
- **Analytics.js** - Data analytics dashboard
- **Personalization.js** - Muscle priorities, splits configuration

## Key Components (`src/components/`)

### Food Logging Components
- **FoodLoggingDashboard.js** - Main food logging interface
- **FoodCreator.js** - Create new foods with macro preview
- **MealCreator.js** - Create meals with multiple foods
- **FoodLogger.js** - Food logging form
- **FoodChatbot.js** - AI-powered food logging interface
- **VoiceRecorder.js** - Voice input for food logging

### Workout Components
- **WorkoutLoggingDashboard.js** - Main workout logging interface
- **WorkoutAdder.js** - Create and edit workouts
- **WorkoutLogger.js** - Log workout sessions
- **WorkoutLog.js** - View workout history
- **MusclePriority.js** - Manage muscle priorities
- **SplitCreator.js** - Create workout splits
- **WorkoutAnalytics.js** - Workout analytics display

### Tracker Components (`src/components/trackers/`)
- **WeightTracker.js** - Daily weight tracking
- **WaterTracker.js** - Hydration tracking
- **BodyMeasurementTracker.js** - Body measurements
- **StepsTracker.js** - Step count tracking
- **CardioTracker.js** - Cardiovascular exercise tracking
- **SleepTracker.js** - Sleep pattern tracking
- **HealthMetricsTracker.js** - Daily wellness metrics

### Analytics Components (`src/components/analytics/`)
- **AnalyticsChartBase.js** - Base chart component
- **WeightProgressionChart.js** - Weight trends
- **MacroSplitChart.js** - Macro distribution
- **FoodTimingChart.js** - Food timing analysis
- **WorkoutProgressionChart.js** - Workout progress
- **ActivationProgressChart.js** - Muscle activation progress
- And many more chart components

### Utility Components
- **Navbar.js** - Navigation with user menu
- **ProtectedRoute.js** - Route protection wrapper
- **DataTable.js** - Reusable data table
- **DataFilters.js** - Data filtering interface
- **ProgressBar.js** - Progress visualization
- **ThemeSwitcher.js** - Theme switching (dark/light)

## State Management

### Authentication Context (`contexts/AuthContext.js`)
- **State**: `user`, `token`, `loading`, `isAuthenticated`
- **Methods**: `login()`, `register()`, `logout()`, `updateProfile()`
- **Token Management**: Automatic token refresh on 401
- **Storage**: Tokens in `localStorage` as `access_token` and `refresh_token`

### Theme Context (`contexts/ThemeContext.js`)
- **State**: `theme` ('dark' or 'light')
- **Methods**: `toggleTheme()`, `setTheme()`
- **Storage**: Theme preference in `localStorage`

### Component State
- Local state for forms, UI interactions
- React hooks: `useState`, `useEffect`, `useCallback`, `useMemo`
- No global state management library (Redux, etc.)

## API Service Layer (`src/services/api.js`)

### Architecture
- Axios instance with base URL from environment
- Request interceptor: Adds JWT token to headers
- Response interceptor: Handles token refresh on 401
- Standardized error handling

### Token Management
```javascript
// Request interceptor
config.headers.Authorization = `Bearer ${accessToken}`;

// Response interceptor
if (error.response?.status === 401) {
      // Attempt token refresh
  // Retry original request with new token
  }
```

### API Methods
- Generic: `get()`, `post()`, `put()`, `patch()`, `delete()`
- Authentication: `login()`, `register()`, `logout()`, `getProfile()`
- Food: `getFoods()`, `createFood()`, `logFood()`
- Workout: `getWorkouts()`, `createWorkout()`, `logWorkout()`
- And many more specific methods

## Styling System (November 2025 Refresh)

### Design Philosophy
- **Themes**: Only `dark` and `light` (neutral grey backdrops)
- **Typography**: `Josefin Sans` font family (`--font-primary`)
- **Surfaces**: Borderless glass panels, large radii, deep shadows
- **Floating Actions**: No header bars, floating buttons with gradients
- **Animations**: `menuFloatIn`, `modalFloat` keyframes

### CSS Variables (`src/index.css`)
- Theme colors: `--bg-primary`, `--surface-primary`, `--text-primary`
- Accent colors: `--accent-primary`, `--accent-secondary`
- Spacing: `--space-*` variables (4px base unit)
- Shadows: `--shadow-*` variables
- Transitions: `--transition-*` variables

### Component Styling
- Use CSS variables for theming
- Borderless cards with `border-radius: var(--radius-lg)`
- Deep shadows: `box-shadow: 0 24px 55px ...`
- Floating buttons: `.btn-primary-header`, `.btn-secondary-header`
- Menu animations: `animation: menuFloatIn 0.3s ease-out`

### Responsive Design
- Mobile-first approach
- Breakpoints: 768px (tablet), 1024px (desktop)
- Flexible grid layouts
- Touch-friendly interfaces

## Routing

### React Router Setup
- `BrowserRouter` for client-side routing
- `Routes` and `Route` components
- `Navigate` for programmatic navigation
- `Link` for navigation links

### Route Protection
```javascript
<ProtectedRoute>
  <Component />
</ProtectedRoute>
```

`ProtectedRoute` checks authentication and redirects to login if not authenticated.

### Route Structure
- `/login` - Public
- `/register` - Public
- `/` - Redirects to `/profile`
- `/profile` - Protected
- `/food-log` - Protected
- `/workout-tracker` - Protected
- `/additional-trackers/*` - Protected
- `/data-viewer` - Protected
- `/analytics` - Protected
- `/personalization` - Protected

## Form Handling

### Patterns
- Controlled components with `useState`
- Form validation with error display
- Loading states during submission
- Success/error feedback

### Example
```javascript
const [formData, setFormData] = useState({ name: '', email: '' });
const [errors, setErrors] = useState({});
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    await api.post('/endpoint', formData);
    // Success handling
  } catch (error) {
    setErrors(error.response.data.error);
  } finally {
  setLoading(false);
  }
};
```

## Error Handling

### Patterns
- Try-catch blocks for async operations
- Error state management
- User-friendly error messages
- Console logging for debugging
- Error boundaries for React errors

### API Error Handling
```javascript
try {
  const response = await api.get('/endpoint');
  return response.data.data;
} catch (error) {
  if (error.response?.status === 401) {
    // Token refresh handled by interceptor
  } else if (error.response?.status === 400) {
    setErrors(error.response.data.error);
  } else {
    setError('An unexpected error occurred');
}
}
```

## Performance Optimization

### Code Splitting
- Route-based lazy loading (if implemented)
- Component-level code splitting
- Dynamic imports for heavy components

### Memoization
- `useMemo` for expensive calculations
- `useCallback` for stable function references
- `React.memo` for component memoization

### Bundle Optimization
- Tree shaking for unused code
- Minification in production builds
- Asset optimization

## Testing

### Test Structure
- Component tests: `ComponentName.test.js`
- Integration tests for user flows
- E2E tests in `tests/e2e/`

### Testing Tools
- Jest test runner
- React Testing Library
- User event simulation
- API mocking

## Extension Points

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `App.js`
3. Add navigation link in `Navbar.js` if needed
4. Create API service methods if needed

### Adding New Components
1. Create component in `src/components/`
2. Follow existing patterns (props, state, styling)
3. Use CSS variables for theming
4. Add tests if applicable

### Adding New Trackers
1. Create component in `src/components/trackers/`
2. Follow existing tracker patterns
3. Add to `AdditionalTrackers` menu
4. Create API service methods
5. Add streak calculation if applicable

### Adding New Analytics
1. Create chart component in `src/components/analytics/`
2. Extend `AnalyticsChartBase` if applicable
3. Add to `Analytics` page
4. Create API service method

## Critical Invariants

### API Communication
- ALL API calls go through `services/api.js`
- Tokens stored in `localStorage` as `access_token` and `refresh_token`
- Automatic token refresh on 401
- Standardized error handling

### Routing
- Protected routes use `ProtectedRoute` component
- Public routes: `/login`, `/register`
- Default route redirects to `/profile`

### Styling
- Use CSS variables for theming
- Follow design system (borderless, shadows, animations)
- Only `dark` and `light` themes supported
- `Josefin Sans` font family

### State Management
- Authentication state in `AuthContext`
- Theme state in `ThemeContext`
- Component-level state for forms/UI
- No global state management library

## Known Issues and Patterns

### Token Refresh
- Handled automatically by API service interceptor
- On refresh failure, user redirected to login
- Original request retried after successful refresh

### Form Validation
- Client-side validation for UX
- Server-side validation for security
- Error messages displayed inline

### Loading States
- Show loading indicators during API calls
- Disable forms during submission
- Optimistic updates where appropriate

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENV=development
```

## Development Workflow

### Running the App
```bash
npm start
```

### Building for Production
```bash
npm run build
```

### Running Tests
```bash
npm test
```

## What Must NOT Be Changed

- API service architecture (centralized in `api.js`)
- Authentication flow (JWT tokens, refresh logic)
- Route protection pattern
- Design system (themes, styling approach)
- Token storage location (`localStorage`)

## What Can Be Safely Extended

- New pages and components
- New tracker types
- New analytics charts
- New API service methods
- Utility functions
- Styling enhancements (following design system)

---

**Remember**: Follow existing patterns. Maintain design system consistency. Test thoroughly before deploying.
