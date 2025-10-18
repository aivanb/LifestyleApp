# Frontend Developer Guide

Technical documentation for developers and AI agents working on the React frontend.

## Architecture Overview

The frontend follows React best practices with clear component hierarchy and separation of concerns:

```
src/
├── components/          # Reusable UI components
├── contexts/            # React Context providers
├── pages/              # Route-specific pages
├── services/           # API communication layer
├── App.js              # Main application component
├── index.js            # Application entry point
└── index.css           # Global styles
```

## Component Architecture

### Component Hierarchy
```
App
├── AuthProvider (Context)
├── Router
│   ├── Navbar
│   └── Routes
│       ├── Login (Public)
│       ├── Register (Public)
│       ├── Dashboard (Protected)
│       ├── OpenAI (Protected)
│       └── Profile (Protected)
```

### Component Responsibilities

#### App Component (`App.js`)
- **Purpose**: Main application wrapper
- **Responsibilities**:
  - AuthProvider setup
  - Router configuration
  - Global layout structure
- **Key Features**: Route protection, navigation setup
- **Routes**: Profile (default), Food Log, Workout Tracker, Additional Trackers, Data Viewer

#### Authentication Components
- **Login** (`pages/Login.js`): User authentication form
- **Register** (`pages/Register.js`): User registration form
- **ProtectedRoute** (`components/ProtectedRoute.js`): Route protection wrapper

#### Main Components
- **Navbar** (`components/Navbar.js`): Navigation with user menu
- **Dashboard** (`pages/Dashboard.js`): User dashboard with stats
- **FoodLog** (`pages/FoodLog.js`): Food logging system (NEW)
- **WorkoutTracker** (`pages/WorkoutTracker.js`): Workout tracking system (NEW)
- **AdditionalTrackers** (`pages/AdditionalTrackers.js`): Health tracking system (NEW)
- **DataViewer** (`pages/DataViewer.js`): Database viewer interface (NEW)
- **OpenAI** (`pages/OpenAI.js`): AI prompt interface
- **Profile** (`pages/Profile.js`): User profile management

### Food Logging Components (NEW)
- **FoodCreator** (`components/FoodCreator.js`): Create new foods with macro preview
- **MealCreator** (`components/MealCreator.js`): Create meals with multiple foods
- **FoodLogViewer** (`components/FoodLogViewer.js`): View and filter food logs
- **Features**:
  - Real-time macro calculations
  - Search and filter foods
  - Public/private food sharing
  - Create and log simultaneously
  - Delete log entries
  - Recently logged foods

### Additional Trackers Components (NEW)
- **AdditionalTrackersMenu** (`components/AdditionalTrackersMenu.js`): Main menu with tracker buttons
- **Individual Tracker Components** (`components/trackers/`):
  - **WeightTracker**: Daily weight tracking with unit support
  - **WaterTracker**: Hydration tracking with daily totals
  - **BodyMeasurementTracker**: Flexible body measurement tracking
  - **StepsTracker**: Daily step count tracking
  - **CardioTracker**: Cardiovascular exercise tracking
  - **SleepTracker**: Sleep pattern and quality tracking
  - **HealthMetricsTracker**: Daily wellness metrics with rating systems
- **Features**:
  - Real-time streak calculations
  - Comprehensive form validation
  - Date filtering and historical data
  - Responsive design for mobile and desktop
  - Error handling and user feedback
  - Edit and delete functionality
  - Daily totals and analytics

## State Management

### Authentication Context (`contexts/AuthContext.js`)
- **Purpose**: Global authentication state management
- **State**:
  - `user`: Current user data
  - `token`: JWT access token
  - `loading`: Authentication loading state
- **Methods**:
  - `login(username, password)`: User authentication
  - `register(userData)`: User registration
  - `logout()`: User logout
  - `updateProfile(profileData)`: Profile updates

### Context Provider Pattern
```javascript
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  
  // Context value object
  const value = {
    user, token, loading,
    login, register, logout, updateProfile,
    isAuthenticated: !!user
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

## API Service Layer

### Service Architecture (`services/api.js`)
- **Purpose**: Centralized API communication
- **Features**:
  - Axios instance with base configuration
  - Automatic JWT token handling
  - Request/response interceptors
  - Token refresh logic
  - Error handling

### Token Management
```javascript
// Request interceptor adds auth token
this.api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor handles token refresh
this.api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Attempt token refresh
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken
        });
        const { access } = response.data.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return this.api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);
```

### API Methods
- **Authentication**: `login()`, `register()`, `logout()`, `getProfile()`, `updateProfile()`
- **OpenAI**: `sendPrompt()`, `getUsageStats()`
- **Generic**: `get()`, `post()`, `put()`, `patch()`, `delete()`

## Routing and Navigation

### React Router Setup
- **BrowserRouter**: Client-side routing
- **Routes**: Route definitions
- **Route**: Individual route components
- **Navigate**: Programmatic navigation
- **Link**: Navigation links

### Route Protection
```javascript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
```

### Navigation Structure
- **Public Routes**: `/login`, `/register`
- **Protected Routes**: `/dashboard`, `/openai`, `/profile`
- **Default Route**: Redirects to `/dashboard`

## Form Handling

### Form State Management
- **Local State**: Component-level form state
- **Controlled Components**: Input values controlled by React state
- **Validation**: Client-side validation with error display
- **Submission**: Async form submission with loading states

### Form Patterns
```javascript
const [formData, setFormData] = useState({
  username: '',
  password: ''
});

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  const result = await login(formData.username, formData.password);
  
  if (result.success) {
    navigate('/dashboard');
  } else {
    setError(result.error);
  }
  
  setLoading(false);
};
```

## Error Handling

### Error Display Patterns
- **Form Errors**: Inline error messages
- **API Errors**: Toast notifications or error banners
- **Network Errors**: Fallback UI states
- **Authentication Errors**: Redirect to login

### Error Boundary Implementation
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

## Visual Design System

### Design Philosophy
The application follows a **modern minimalistic design** with emphasis on:
- **Functionality over decoration**
- **High contrast for readability**
- **Monotone colors with colorful accents**
- **Smooth animations and transitions**
- **Responsive mobile and desktop layouts**

### Documentation Reference
**📚 COMPLETE DESIGN GUIDE**: See `VISUAL_FORMATTING.md` in the root directory for comprehensive visual design guidelines including:
- Complete color theme system (4 themes)
- Typography scale and font usage
- Spacing system (4px base unit)
- Border radius standards
- Shadow and layering system
- UI component specifications
- Animation guidelines
- Accessibility requirements
- Icon usage
- Responsive breakpoints

**IMPORTANT**: All frontend development MUST reference `VISUAL_FORMATTING.md` to maintain design consistency.

### Quick Reference

#### Color Themes
The app supports 4 color themes:
1. **Dark Mode** (default) - Dark blue-gray backgrounds
2. **Light Mode** - Clean white backgrounds
3. **High Contrast** - Black/white with bright accents
4. **Warm Minimal** - Warm beige tones

Switch themes using the theme switcher (bottom-right floating button).

#### Typography
- **Primary Font**: Roboto Mono (monospace)
- **Scale**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl
- **Weights**: light (300), regular (400), medium (500), bold (700)

#### Spacing
All spacing uses 4px base unit:
- Micro: 4-8px (related elements)
- Small: 12-16px (component groups)
- Medium: 20-24px (sections in cards)
- Large: 32-48px (major sections)

#### Components
- **Buttons**: Rounded (8px), shadow on hover, lift effect
- **Cards**: Rounded (12px), subtle shadow, hover elevation
- **Inputs**: Rounded (8px), focus state with accent glow
- **Tables**: Rounded container, sticky headers, hover rows

### CSS Organization
- **Global Styles**: `index.css` - design system and base styles
- **Component Styles**: Scoped `<style jsx>` tags in components
- **Utility Classes**: CSS variables for theming
- **Responsive Design**: Mobile-first with breakpoints

### Icons
- **Library**: Heroicons (MIT License)
- **Style**: Monotone, uses `currentColor`
- **Sizes**: sm (16px), md (20px), lg (24px), xl (32px)
- **Usage**: Paired with text or icon-only with tooltips

See `IMAGE_REGISTRY.md` for complete icon documentation.

### Responsive Patterns
```css
/* Mobile-first responsive design */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: var(--space-8);
  }
}
```

### Animation Guidelines
- **Use spline curves**: `cubic-bezier()` for smooth, natural motion
- **Duration**: 150-300ms for interactions, 500ms for page transitions
- **Effects**: Slide, fade, scale animations for visual feedback
- **Hover states**: Lift, scale, or color changes
- **Click feedback**: Subtle press animation

Example:
```css
.btn {
  transition: all 0.2s cubic-bezier(0.33, 1, 0.68, 1);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

## Performance Optimization

### Code Splitting
- **Route-based splitting**: Lazy load route components
- **Component splitting**: Split large components
- **Library splitting**: Separate vendor bundles

### Optimization Strategies
```javascript
// Lazy loading components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const OpenAI = React.lazy(() => import('./pages/OpenAI'));

// Memoization for expensive computations
const MemoizedComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});
```

### Bundle Optimization
- **Tree shaking**: Remove unused code
- **Minification**: Compress JavaScript and CSS
- **Asset optimization**: Optimize images and fonts
- **Caching**: Implement proper caching strategies

## Testing Strategy

### Testing Architecture
- **Unit Tests**: Component and utility testing
- **Integration Tests**: User flow testing
- **E2E Tests**: Full application testing
- **API Tests**: Service layer testing

### Testing Tools
- **React Testing Library**: Component testing
- **Jest**: Test runner and assertions
- **MSW**: API mocking
- **User Event**: User interaction simulation

### Test Patterns
```javascript
// Component testing
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import Login from '../pages/Login';

const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

test('should login user with valid credentials', async () => {
  renderWithAuth(<Login />);
  
  fireEvent.change(screen.getByLabelText(/username/i), {
    target: { value: 'testuser' }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'testpass' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});
```

## Development Workflow

### Component Development
1. **Plan**: Define component responsibilities
2. **Create**: Build component with props interface
3. **Style**: Add CSS and responsive design
4. **Test**: Write unit tests
5. **Integrate**: Connect to parent components

### Feature Development
1. **Design**: Plan user interface and interactions
2. **API**: Define API endpoints and data flow
3. **Components**: Build required components
4. **Integration**: Connect components and API
5. **Testing**: Test user flows and edge cases

### Code Organization
- **File Naming**: PascalCase for components, camelCase for utilities
- **Import Order**: External libraries, internal modules, relative imports
- **Export Patterns**: Default exports for components, named exports for utilities
- **Documentation**: JSDoc comments for complex functions

## Environment Configuration

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENV=development
```

### Build Configuration
- **Development**: Hot reloading, source maps, debug tools
- **Production**: Minification, optimization, error boundaries
- **Testing**: Test environment setup, mocking configuration

## Security Considerations

### Client-side Security
- **Input Validation**: Client-side validation for UX
- **XSS Prevention**: Proper data sanitization
- **Token Storage**: Secure token handling
- **HTTPS**: Enforce secure connections

### Authentication Security
- **Token Management**: Secure token storage and refresh
- **Route Protection**: Prevent unauthorized access
- **Session Management**: Proper logout handling
- **Error Handling**: Don't expose sensitive information

## Deployment Considerations

### Build Process
1. **Environment Setup**: Configure production environment variables
2. **Build**: Run `npm run build` to create production bundle
3. **Static Serving**: Serve build files through web server
4. **CDN**: Configure CDN for static assets

### Production Optimization
- **Bundle Analysis**: Analyze bundle size and composition
- **Performance Monitoring**: Track Core Web Vitals
- **Error Tracking**: Implement error monitoring
- **Caching**: Configure proper caching headers

## Workout Tracker System - Comprehensive Frontend Interface

### Overview
The workout tracker system provides a comprehensive frontend interface for fitness tracking with muscle priority management, workout creation, split programs, workout logging, and progress tracking. It features a tabbed interface with modern design principles and robust error handling.

### Key Components

#### 1. Main Page (`pages/WorkoutTracker.js`)
- **Purpose**: Main workout tracker page with tabbed interface
- **Features**:
  - Tab navigation (Muscle Priority, Workout Adder, Split Creator, Workout Logger, Workout Log)
  - State management for active tab and selected date
  - Integration with all workout components
- **State Management**: Active tab state, selected date for logging
- **Error Handling**: Graceful error handling with user feedback

#### 2. Core Components

##### WorkoutAdder (`components/WorkoutAdder.js`)
- **Purpose**: Create and edit custom workouts
- **Features**:
  - Workout metadata (name, type, equipment, location, notes)
  - Emoji icon selection from predefined list
  - Muscle activation rating assignment (0-100)
  - Public/private workout settings
  - Form validation and error handling
  - Edit existing workouts functionality
- **State Management**: Form data, muscle selection, validation state
- **API Integration**: Create/update workout endpoints

##### MusclePriority (`components/MusclePriority.js`)
- **Purpose**: Manage muscle group priorities
- **Features**:
  - Expandable muscle group sections
  - Slider-based priority adjustment (0-100)
  - Color-coded priority levels
  - Reset to default (80) functionality
  - Batch update capabilities
  - Priority legend and explanations
- **State Management**: Muscle priorities, expanded groups, update state
- **API Integration**: Get/update muscle priorities endpoints

##### SplitCreator (`components/SplitCreator.js`)
- **Purpose**: Create and manage workout splits
- **Features**:
  - Split creation with multiple days
  - Muscle target activation per day
  - Real-time muscle analysis with optimal ranges
  - Split activation/deactivation
  - Edit existing splits
  - Muscle progress visualization
- **State Management**: Split data, muscle analysis, form state
- **API Integration**: Split CRUD operations, activation endpoints

##### WorkoutLogger (`components/WorkoutLogger.js`)
- **Purpose**: Log individual workout sessions
- **Features**:
  - Workout selection with filtering and search
  - Weight, reps, RIR logging
  - Workout attributes (dropset, assisted, partial, pause, negatives)
  - Working timer functionality
  - Quick-add from previous sessions
  - Form validation and autofill
- **State Management**: Selected workout, form data, timer state
- **API Integration**: Workout logging, recent workouts endpoints

##### WorkoutLog (`components/WorkoutLog.js`)
- **Purpose**: View workout history and progress with split day tracking
- **Features**:
  - Date-based workout viewing with calendar navigation
  - Active split day information and muscle progress tracking
  - Workout statistics (sets, weight, reps, RIR) with real-time updates
  - Muscle progress visualization with target vs. actual activation
  - Previous day quick-add options for seamless logging
  - Working timer integration for session tracking
  - Split day determination based on start date calculation
- **State Management**: Selected date, active split, current split day, muscle progress
- **API Integration**: Current split day, workout stats, recent workouts endpoints

### Features

#### Muscle Priority Management
- **Visual Interface**: Expandable groups with slider controls
- **Priority Scale**: 0-100 with color-coded levels (blue, green, yellow, orange, red)
- **Default Reset**: One-click reset to 80 for all muscles
- **Batch Updates**: Update all priorities at once
- **Real-time Feedback**: Immediate visual feedback on changes

#### Workout Creation
- **Form Validation**: Required fields and data validation
- **Emoji Support**: Predefined emoji selection (stored in workout name)
- **Muscle Activation**: 0-100 rating assignment per muscle
- **Metadata Management**: Equipment, location, notes, type selection
- **Public/Private**: Visibility settings for workout sharing

#### Split Management
- **Day Creation**: Add multiple days to splits
- **Target Setting**: Per-muscle activation targets per day
- **Real-time Analysis**: Automatic muscle volume calculations
- **Optimal Ranges**: Color-coded muscle status (warning, below, optimal, above)
- **Split Activation**: One-click split activation with date setting

#### Workout Logging
- **Session Tracking**: Weight, reps, RIR, rest time logging
- **Advanced Attributes**: Dropset, assisted, partial, pause, negatives
- **Working Timer**: Start/stop timer for work/rest periods
- **Quick Add**: Previous session data reuse
- **Search & Filter**: Find workouts by name or muscle activation

#### Progress Tracking
- **Statistics Display**: Total sets, weight lifted, reps, RIR with real-time updates
- **Date Navigation**: Calendar-based workout viewing with date selection
- **Muscle Progress**: Current vs. target activation visualization with progress bars
- **Split Integration**: Current split day information with automatic day calculation
- **Historical Data**: Past workout performance tracking with trend analysis
- **Working Timer**: Integrated timer for work/rest periods during sessions

### Design System Integration

#### Visual Design
- **Minimalistic**: Clean, uncluttered interface
- **Modern**: Contemporary design elements
- **High Contrast**: Clear visual hierarchy
- **Responsive**: Seamless mobile and desktop experience

#### UI Elements
- **Tabbed Navigation**: Smooth transitions between sections
- **Form Controls**: Rounded edges, clear labels, validation feedback
- **Data Display**: Card-based layout for metrics and information
- **Color Coding**: Priority colors and status indicators
- **Icons**: Heroicons for consistent iconography

#### Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Desktop Enhancement**: Enhanced layout for larger screens
- **Touch Friendly**: Appropriate touch targets for mobile
- **Flexible Grid**: Adaptive grid system for different screen sizes

### State Management

#### Component State
```javascript
// WorkoutTracker main page
const [activeTab, setActiveTab] = useState('muscle-priority');
const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

// WorkoutAdder component
const [workoutName, setWorkoutName] = useState('');
const [selectedMuscles, setSelectedMuscles] = useState([]);
const [selectedEmoji, setSelectedEmoji] = useState('');

// MusclePriority component
const [musclePriorities, setMusclePriorities] = useState([]);
const [expandedGroups, setExpandedGroups] = useState({});

// SplitCreator component
const [splitDays, setSplitDays] = useState([]);
const [analysis, setAnalysis] = useState({});

// WorkoutLogger component
const [selectedWorkout, setSelectedWorkout] = useState(null);
const [workTime, setWorkTime] = useState(0);
const [isWorking, setIsWorking] = useState(false);
```

#### API Integration
- **Error Handling**: Graceful handling of API failures
- **Loading States**: User feedback during API calls
- **Data Validation**: Client-side validation with server confirmation
- **Optimistic Updates**: Immediate UI updates with rollback on failure

### Testing

#### Component Tests
- **Unit Tests**: Individual component testing
- **User Interaction**: Form submission and navigation testing
- **State Management**: React state and context testing
- **API Integration**: Mock API testing
- **Responsive Design**: Mobile and desktop layout testing

#### E2E Tests
- **Complete Workflows**: End-to-end user journey testing
- **Cross-Component**: Integration between components
- **Data Persistence**: Data saving and retrieval testing
- **Error Scenarios**: Validation and error handling testing
- **Performance**: Load time and responsiveness testing

### Usage Examples

#### Creating a Workout
```javascript
const workoutData = {
  workout_name: 'Bench Press',
  type: 'barbell',
  equipment_brand: 'Rogue Fitness',
  location: 'Home Gym',
  notes: 'Focus on form',
  make_public: true,
  muscles: [
    { muscle: 1, activation_rating: 100 }, // Chest
    { muscle: 2, activation_rating: 75 }    // Triceps
  ],
  emoji: '🏋️'
};

await api.createWorkout(workoutData);
```

#### Updating Muscle Priorities
```javascript
const priorities = [
  { muscle_name: 1, importance: 90 }, // Chest - High priority
  { muscle_name: 2, importance: 85 }, // Triceps - High priority
  { muscle_name: 3, importance: 70 }  // Quads - Medium priority
];

await api.updateMusclePriorities(priorities);
```

#### Logging a Workout
```javascript
const logData = {
  workout: 1, // Workout ID
  weight: 135.0,
  reps: 10,
  rir: 2,
  attributes: [
    { type: 'dropset', weight: 115, reps: 8 },
    { type: 'pause', reps: 5, wait_time: 3 }
  ],
  rest_time: 120
};

await api.createWorkoutLog(logData);
```

## Profile System - Comprehensive User Interface

### Overview
The profile system provides a comprehensive user interface for managing personal information, goals, body metrics, and historical data. It features a responsive tabbed interface with modern design principles and robust error handling.

### Key Components

#### 1. Main Profile Component (`pages/Profile.js`)
- **Purpose**: Main profile page with tabbed interface
- **Features**: 
  - Responsive design (mobile/desktop)
  - Tab navigation (Personal Info, Goals, Body Metrics, History)
  - User information display with fitness ranking
  - Logout functionality
- **State Management**: Comprehensive state for all profile data
- **Error Handling**: Graceful error handling with user feedback

#### 2. Sub-Components
- **PersonalInfoTab**: Personal information editing interface
- **GoalsTab**: Goals management with AI-powered macro calculator
- **MetricsTab**: Body metrics display with fitness ranking system
- **HistoryTab**: Historical data visualization and trend analysis

#### 3. API Integration (`services/api.js`)
- **Profile Methods**: Complete API integration for profile operations
- **Error Handling**: Robust error handling for API calls
- **Data Validation**: Client-side validation for user inputs

### Features

#### Personal Information Management
- **Editable Fields**: Height, birthday, gender, unit preferences, activity level
- **Form Validation**: Real-time validation with error messages
- **Data Persistence**: Automatic saving with user feedback
- **Responsive Design**: Mobile-optimized form layouts

#### Goal Management
- **Weight Goals**: Target weight, lean mass, fat mass goals
- **Macro Goals**: Complete macro tracking (calories, protein, fat, carbs, fiber, sodium)
- **AI Calculator**: Generate macro goals based on weight target and timeframe
- **Smart Warnings**: System warnings for extreme goals
- **Manual Editing**: Direct goal editing with validation

#### Body Metrics Display
- **Comprehensive Metrics**: BMI, BMR, TDEE, body ratios, body composition
- **Fitness Ranking**: 17-tier ranking system with color-coded badges
- **Progress Tracking**: Current rank with requirements for next rank
- **Visual Design**: Card-based layout with clear data presentation

#### Historical Data Analysis
- **Weight Trends**: Automatic trend classification (gaining, losing, stable, no_data)
- **Total Change**: Weight lost or gained calculation
- **Weekly Recommendations**: Recommended weekly weight change
- **Weight History**: Recent weight logs with dates and values

### Design System Integration

#### Visual Design
- **Minimalistic**: Clean, uncluttered interface
- **Modern**: Contemporary design elements
- **High Contrast**: Clear visual hierarchy
- **Responsive**: Seamless mobile and desktop experience

#### UI Elements
- **Tabbed Navigation**: Smooth transitions between sections
- **Form Controls**: Rounded edges, clear labels, validation feedback
- **Data Display**: Card-based layout for metrics and information
- **Color Coding**: Fitness rank colors and trend indicators
- **Icons**: Heroicons for consistent iconography

#### Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Desktop Enhancement**: Enhanced layout for larger screens
- **Touch Friendly**: Appropriate touch targets for mobile
- **Flexible Grid**: Adaptive grid system for different screen sizes

### State Management

#### Profile Data State
```javascript
const [profileData, setProfileData] = useState(null);
const [goals, setGoals] = useState({});
const [metrics, setMetrics] = useState({});
const [historical, setHistorical] = useState({});
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
```

#### Form State Management
- **Editing State**: Tracks which sections are being edited
- **Form Data**: Manages form input values
- **Validation**: Real-time validation state
- **Submission**: Handles form submission and API calls

### API Integration

#### Profile Endpoints
- **GET /api/users/profile/**: Complete profile data
- **PUT /api/users/profile/**: Update personal information
- **GET /api/users/goals/**: Retrieve user goals
- **PUT /api/users/goals/**: Update user goals
- **GET /api/users/calculate-metrics/**: Calculate body metrics
- **POST /api/users/calculate-macros/**: Generate macro goals

#### Error Handling
- **API Errors**: Graceful handling of API failures
- **Validation Errors**: Client-side validation with user feedback
- **Network Errors**: Offline handling and retry logic
- **User Feedback**: Clear error messages and success notifications

### Testing

#### Component Tests
- **Unit Tests**: Individual component testing
- **User Interaction**: Form submission and navigation testing
- **State Management**: React state and context testing
- **API Integration**: Mock API testing
- **Responsive Design**: Mobile and desktop layout testing

#### E2E Tests
- **Complete Workflows**: End-to-end user journey testing
- **Cross-Browser**: Multi-browser compatibility testing
- **Performance**: Load time and responsiveness testing
- **Accessibility**: Keyboard navigation and screen reader testing
- **Data Persistence**: Data saving and retrieval testing

### Usage Examples

#### Profile Data Loading
```javascript
const loadProfileData = async () => {
  try {
    setLoading(true);
    const response = await api.getUserProfile();
    
    if (response.data.data) {
      setProfileData(response.data.data.user);
      setGoals(response.data.data.goals);
      setMetrics(response.data.data.metrics);
      setHistorical(response.data.data.historical);
    }
  } catch (err) {
    setError('Failed to load profile data');
  } finally {
    setLoading(false);
  }
};
```

#### Macro Calculator
```javascript
const calculateMacros = async () => {
  try {
    setMacroCalculation(prev => ({ ...prev, calculating: true }));
    
    const response = await api.generateMacroGoals(
      macroCalculation.weight_goal,
      macroCalculation.timeframe_weeks
    );

    if (response.data.data) {
      setMacroCalculation(prev => ({
        ...prev,
        result: response.data.data,
        calculating: false
      }));
    }
  } catch (err) {
    setError('Failed to calculate macros');
    setMacroCalculation(prev => ({ ...prev, calculating: false }));
  }
};
```

#### Profile Update
```javascript
const updateProfile = async (updatedData) => {
  try {
    await api.updateUserProfile(updatedData);
    await loadProfileData();
    setEditing(false);
  } catch (err) {
    setError('Failed to update profile');
  }
};
```

## Common Development Tasks

### Adding New Components
1. Create component file in appropriate directory
2. Define component interface and props
3. Implement component logic and styling
4. Add tests for component behavior
5. Integrate with parent components

### Adding New Pages
1. Create page component in `pages/` directory
2. Add route definition in `App.js`
3. Implement page logic and styling
4. Add navigation links if needed
5. Test page functionality and routing

### API Integration
1. Add API method to service layer
2. Create component state for API data
3. Implement loading and error states
4. Add user feedback for API responses
5. Test API integration thoroughly
