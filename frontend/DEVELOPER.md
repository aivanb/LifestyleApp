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
- **Home.js** - `/home` dashboard: `GET /analytics/home/dashboard/` (split day + activation vs targets, macro/calorie remaining including cardio + step burn estimate, trackers missing today). Separate stacked (mobile) vs grid (desktop) layouts.
- **Navbar.js** - Bottom **half-circle** FAB opens a horizontal fan of `NavLink`s (staggered RTL animation). Mobile: icon-only strip with horizontal scroll (~3 items visible width); desktop: labels + wrap. Adds `has-bottom-nav` on `body` for main padding.
- **Profile.js** - `/profile`: grid-tinted page shell vs lighter `profile-info-surface` cards; rank badge **outside** info card (solid fill). Info/edit use shared **profile-row** grid (paired + single rows). Units dropdown only **metric/imperial**. Theme: **Appearance** section with Dark/Light buttons.
- **Profile API** - `GET/PUT /users/profile/` — `first_name`, `last_name`, `username`, `email`, `height`, `birthday`, `gender`, `unit_preference`, `activity_level`. `GET` includes `units: [{ unit_id, unit_name }]`. Overall rank = mean of per-metric tiers (`calculateOverallRank`).
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
- **FoodLogger.js** - Food logging form (`/food-log` panel + modal): sort row above search (order button, then select; right edge of select aligns with search); borderless sort controls; servings +/- transparent with bordered servings input only; macro dividers; mobile food logger modal centered via `translate(-50%, -50%)` + keyframes in **FoodLoggingDashboard**. Sub-views (metadata, edit, analytics) mount `FoodMetadataModal` / `FoodEditForm` / `FoodAnalyticsView` directly; layout uses class `food-logger-overlay-pane` on each root (flex + scroll/padding for edit/analytics; metadata keeps internal table scroll).
- **FoodLoggingDashboard.js** - Mobile food logger modal: `closeFoodLogger()` + `foodLoggerClosing` drive `modal-backdrop--food-logger` / `modal--food-logger-closing` CSS animations (~280ms) before unmount. Food creator, meal creator, and food chatbot use `food-log-feature-backdrop` + `food-log-feature-dialog--*` (card-only surface; no outer `.modal` shell). `localYmdToIsoRange(ymd)` bounds food logs to the picker’s **local** day; cardio/steps use **date-only** `start_date`/`end_date` (`YYYY-MM-DD`) because `/logging/cardio/` and `/logging/steps/` parse with `date.fromisoformat` (datetime strings skip filtering).
- **FoodChatbot.js** - AI-powered food logging interface
- **VoiceRecorder.js** - Voice input for food logging

**Food chatbot parse flow** (`FoodChatbot.js` + `src/utils/foodParsePreview.js`):

1. User enters text (and optional “Create as meal”) and taps **Parse** → `handlePreview` runs with `preview_only=true`.
2. `api.parseFoodInput(text, createMeal, true)` returns `foods_parsed[]` (each item: `name`, `servings`, optional `food` metadata object from DB / parser).
3. For each row, `mergeApiFoodWithPrevious(apiFood, previousFood, metadataFields)` builds the preview `food` object:
   - If the API sends a **valid** value for a field, it is **coerced** (numbers via `toValidNumber`, selects must match allowed options) and **wins**.
   - If the API omits or invalidates a field (`null`, `''`, invalid select), the **previous preview row** value is kept (when re-parsing with preview open).
   - Otherwise **defaults** apply (e.g. `cost` → `0`, `serving_size` → `1`).
4. `servings` on each row = API `servings` if present, else previous row’s servings, else `1`.
5. State: `previewData` = raw API result, `editedFoods` = merged rows, `showPreview` = true. User edits update `editedFoods` via `handleFoodEdit`.
6. **Re-parse** (from preview): same as step 2–4; merge **preserves** user-edited fields when the new API payload does not supply a value for that field.
7. **Log Foods** → optional `updateFood` per row if metadata changed vs `previewData.foods_parsed`, then `parseFoodInput` with `preview_only=false` to create logs.

Exports: `mergeApiFoodWithPrevious`, `normalizeParsedFoodForPreview` (alias for merge with empty previous). Tests: `src/utils/foodParsePreview.test.js`.

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
- **DateRangeSelector.js** - Shared date range (1 week–1 year + custom) for Workout and Food sections; default 2 weeks; custom default uses `getAnalyticsDateBounds(section)`.
- **AnalyticsChartBase.js** - Base chart component
- **WorkoutProgressionChart.js** - Single-workout progression (workout required, searchable); progression type (avg weight×reps, avg weight×sets, avg weight, max weight); optional comparison metrics (cardio, food, health, sleep, steps, weight, water, workout_log) with optional 1-day offset; second y-axis for metrics.
- **ActivationProgressChart.js** - Activation progress vs expected
- **FoodMetadataProgressChart.js**, **FoodTimingChart.js**, **MacroSplitChart.js**, **FoodFrequencyChart.js**, **FoodCostChart.js** - All receive `dateRangeParams` from page (no per-chart date pickers). Charts are full-width. Health Analytics section removed.

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
- `/` - Redirects to `/home`
- `/home` - Protected dashboard
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
1. Create chart component in `src/components/analytics/` that accepts `dateRangeParams` (from page’s DateRangeSelector).
2. Extend `AnalyticsChartBase` if applicable.
3. Add to `Analytics` page (Workout or Food section only); cards are full-width. Use `getAnalyticsParams(range, customFrom, customTo)` from `Analytics.js` for API params.
4. Add API method in `services/api.js`; backend should use `parse_analytics_date_range(request)` for date range.

## Critical Invariants

### API Communication
- ALL API calls go through `services/api.js`
- Tokens stored in `localStorage` as `access_token` and `refresh_token`
- Automatic token refresh on 401
- Standardized error handling

### Routing
- Protected routes use `ProtectedRoute` component
- Public routes: `/login`, `/register`
- Default route redirects to `/home` after login/register

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

## Voice / parse-food preview

The parse-food API may return `foods_parsed[]` entries with both `food` and optional `metadata` (e.g. user-mentioned `brand`, `cost`). `FoodChatbot` builds the preview row with `buildFoodLayerFromParse()` in `utils/foodParsePreview.js` (metadata overlaid on `food`), then `mergeApiFoodWithPrevious()` so user edits persist when the API omits fields.

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
