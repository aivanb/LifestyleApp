# Frontend README

React frontend for the Tracking App with modern UI components, authentication, and OpenAI integration.

## Features

- **Modern React UI**: Built with React 18 and modern hooks
- **Authentication**: JWT-based login/registration with protected routes
- **OpenAI Integration**: Interactive prompt interface with usage statistics
- **Responsive Design**: Mobile-friendly interface
- **State Management**: Context API for authentication state
- **API Integration**: Axios-based service layer with automatic token handling

## Quick Start

### Prerequisites
- Node.js 16+
- Backend server running on port 8000

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```

3. **Open browser**:
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── trackers/       # Health metric trackers
│   ├── analytics/      # Chart components
│   └── ...             # Other components
├── pages/              # Route-level components
├── services/           # API communication
├── contexts/           # React Context providers
├── App.js              # Main app component
├── index.js            # App entry point
└── index.css           # Global styles
```

## Components

### Authentication Components
- **Login**: User login form with validation
- **Register**: User registration with profile fields
- **ProtectedRoute**: Route wrapper requiring authentication

### Main Components
- **Navbar**: Navigation with user menu and logout
- **Profile**: User profile management (icon-only log out, left-aligned with the profile column; rank badge on the right when shown)
- **FoodLog**: Food logging interface
- **WorkoutTracker**: Workout tracking interface (logging UI shares `/home`-style page shell; set “attributes” on a log are limited to drop sets, partials, assisted sets, negatives, and rest pause—see `src/constants/workoutLoggingAttributes.js`)
- **AdditionalTrackers**: Health metrics tracking
- **DataViewer**: Database viewer interface
- **Analytics**: Workout and food charts on a Profile-style page shell (grid background, card surfaces); full-bleed layout like `/profile`
- **Personalization**: Muscle priorities and splits configuration

## State Management

### Authentication Context
- Global authentication state
- User profile data
- Login/logout functions
- Token management
- Automatic token refresh

### API Service Layer
- Centralized API communication
- Automatic JWT token handling
- Request/response interceptors
- Error handling
- Token refresh logic

## API Integration

### Authentication Endpoints
- User registration and login
- Profile management
- Password changes
- Token refresh

### Data Endpoints
- Food logging and management
- Workout tracking
- Health metrics
- Analytics data

## Styling

### CSS Architecture
- Global styles in `index.css`
- Component-specific styles
- Responsive design patterns
- Modern CSS features

### Design System
- Dark and light themes only (neutral grey backgrounds, black/white surfaces)
- Josefin Sans type hierarchy with uppercase floating action buttons
- High-contrast gradients for primary/secondary actions; no header bars
- Borderless glass panels for cards, tables, and modals with deep shadows

## Development

### Available Scripts
- `npm start` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENV=development
```

## Features

### Authentication Flow
1. User visits protected route
2. Redirected to login if not authenticated
3. Login form submits credentials
4. JWT tokens stored in localStorage
5. User redirected to dashboard
6. Tokens automatically refreshed

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Responsive navigation
- Touch-friendly interfaces

## Security

### Token Management
- JWT tokens stored securely
- Automatic token refresh
- Logout clears all tokens
- Protected route enforcement

### Input Validation
- Client-side form validation
- Server-side validation feedback
- XSS protection
- CSRF considerations

## Performance

### Optimization Strategies
- Code splitting for routes
- Lazy loading components
- Efficient re-rendering
- Optimized bundle size

### Loading States
- Spinner components
- Loading indicators
- Skeleton screens
- Error boundaries

## Testing

### Test Structure
- Component unit tests
- Integration tests
- API service tests
- Context provider tests

### Testing Tools
- React Testing Library
- Jest test runner
- Mock service worker
- User event simulation

## Deployment

### Build Process
1. Run `npm run build`
2. Static files generated in `build/`
3. Serve through web server
4. Configure environment variables

### Production Considerations
- Environment variable configuration
- Static file serving
- CDN integration
- Error monitoring

## Browser Support

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills
- Modern JavaScript features
- Fetch API
- Promise support
- ES6+ features
