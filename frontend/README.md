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
│   ├── Navbar.js       # Navigation component
│   └── ProtectedRoute.js # Route protection
├── contexts/            # React Context providers
│   └── AuthContext.js  # Authentication state
├── pages/              # Page components
│   ├── Login.js        # Login page
│   ├── Register.js      # Registration page
│   ├── Dashboard.js     # Main dashboard
│   ├── OpenAI.js       # OpenAI integration
│   └── Profile.js       # User profile
├── services/           # API communication
│   └── api.js          # Axios service layer
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
- **Dashboard**: User dashboard with quick stats
- **OpenAI**: Interactive prompt interface with usage stats
- **Profile**: User profile management

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

### OpenAI Endpoints
- Send prompts to OpenAI API
- Usage statistics tracking
- Cost monitoring

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

### OpenAI Integration
1. User enters prompt in textarea
2. Form submits to OpenAI endpoint
3. Response displayed to user
4. Usage statistics updated
5. Cost tracking maintained

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
