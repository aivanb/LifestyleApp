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

#### Authentication Components
- **Login** (`pages/Login.js`): User authentication form
- **Register** (`pages/Register.js`): User registration form
- **ProtectedRoute** (`components/ProtectedRoute.js`): Route protection wrapper

#### Main Components
- **Navbar** (`components/Navbar.js`): Navigation with user menu
- **Dashboard** (`pages/Dashboard.js`): User dashboard with stats
- **FoodLog** (`pages/FoodLog.js`): Food logging system (NEW)
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
