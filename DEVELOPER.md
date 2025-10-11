# Developer Guide

This guide provides technical details for developers and AI agents working on the Tracking App codebase.

## Architecture Overview

The application follows a clean separation of concerns:

```
/frontend     → React UI and client logic
/backend      → Django APIs, services, DB, business logic
/shared       → Reusable types, constants, utilities
/tests        → Unit, integration, and e2e tests
```

## Backend Architecture

### Django Apps Structure
- `apps/authentication` - JWT auth, user management
- `apps/users` - User models and profile management
- `apps/foods` - Food database and nutritional data
- `apps/meals` - Meal planning and composition
- `apps/logging` - Activity logging (food, weight, water, etc.)
- `apps/workouts` - Exercise tracking and muscle data
- `apps/health` - Sleep and health metrics
- `apps/analytics` - API usage and error logging
- `apps/openai_service` - OpenAI API integration

### Middleware
- `middleware/auth.py` - JWT token validation
- `middleware/logging.py` - Request/response logging

### Database Models
All models follow the exact schema defined in `notes/database_structure.md`. Key relationships:
- Users have access levels and unit preferences
- Foods contain comprehensive nutritional data
- Meals group foods with serving sizes
- Various log tables track user activities
- Analytics tables monitor API usage and errors

## Frontend Architecture

### Component Structure
- `components/` - Reusable UI components
- `pages/` - Route-specific page components
- `contexts/` - React Context for state management
- `services/` - API communication layer

### State Management
- Uses React Context API for authentication state
- Local component state for forms and UI interactions
- API service handles token management and refresh

### Routing
- React Router for client-side navigation
- Protected routes require authentication
- Automatic redirect to login for unauthenticated users

## API Design Patterns

### Response Format
All API responses follow a consistent format:
```json
{
  "data": { ... },     // Success data
  "error": { ... }     // Error information
}
```

### Authentication
- JWT tokens with access/refresh pattern
- Automatic token refresh on 401 responses
- Middleware validates tokens on protected routes

### Error Handling
- Consistent error response format
- Proper HTTP status codes
- Detailed error logging for debugging

## Database Integration

### Model Relationships
- Foreign keys maintain referential integrity
- Many-to-many relationships for complex data (meals-foods, workout-muscles)
- JSON fields for flexible data storage (workout attributes)

### Migration Strategy
- All models have corresponding migrations
- Database schema matches the documented structure exactly
- Use Django's migration system for schema changes

## OpenAI Integration

### Service Layer
- `OpenAIService` class handles API communication
- Automatic usage tracking and cost calculation
- Error handling and retry logic
- Response logging for analytics

### Usage Monitoring
- All API calls logged to `ApiUsageLog`
- Token usage and cost tracking
- Success/failure rate monitoring
- User-specific usage statistics

## Testing Strategy

### Backend Testing
- Unit tests for models, services, and utilities
- Integration tests for API endpoints
- Middleware testing for auth and logging
- Database transaction testing

### Frontend Testing
- Component unit tests with React Testing Library
- Integration tests for user flows
- API service mocking
- Context provider testing

### E2E Testing
- Full user journey testing
- Authentication flow testing
- OpenAI integration testing
- Cross-browser compatibility

## Development Workflow

### Code Organization
- Follow established naming conventions
- Maintain separation of concerns
- Use proper imports and exports
- Document public APIs

### Git Workflow
- Feature branches for new development
- Pull requests for code review
- Commit messages follow conventional format
- Automated testing on pull requests

### Environment Management
- Use `.env` files for configuration
- Separate development/production settings
- Never commit secrets to version control
- Document all environment variables

## Performance Considerations

### Backend Optimization
- Database query optimization
- Proper indexing on foreign keys
- Pagination for large datasets
- Caching for frequently accessed data

### Frontend Optimization
- Code splitting for large bundles
- Lazy loading for routes
- Memoization for expensive computations
- Efficient re-rendering patterns

## Security Best Practices

### Authentication Security
- JWT tokens with proper expiration
- Secure token storage
- CSRF protection
- Input validation and sanitization

### API Security
- Rate limiting for API endpoints
- Input validation on all endpoints
- SQL injection prevention
- XSS protection

### Data Protection
- Sensitive data encryption
- Secure password hashing
- Environment variable protection
- Audit logging for sensitive operations

## Monitoring and Logging

### Application Logging
- Structured logging with proper levels
- Request/response logging
- Error tracking and alerting
- Performance monitoring

### Analytics
- User behavior tracking
- API usage monitoring
- Error rate monitoring
- Performance metrics

## Deployment Considerations

### Backend Deployment
- Production database configuration
- Static file serving
- WSGI server configuration
- Environment variable management

### Frontend Deployment
- Production build optimization
- CDN configuration
- Environment variable injection
- Error boundary implementation

## Troubleshooting

### Common Issues
- Database connection problems
- JWT token expiration
- CORS configuration
- OpenAI API rate limits

### Debug Tools
- Django debug toolbar
- React DevTools
- Browser network inspector
- Database query logging

## Future Enhancements

### Planned Features
- Real-time notifications
- Advanced analytics dashboard
- Mobile app development
- Third-party integrations

### Technical Improvements
- GraphQL API implementation
- Microservices architecture
- Container orchestration
- Advanced caching strategies
