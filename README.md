# Tracking App

A fullstack application for tracking nutrition, workouts, health metrics, and more, built with Django, React, MySQL, and OpenAI API integration.

## Features

- **User Authentication**: JWT-based authentication with registration, login, and profile management
- **OpenAI Integration**: Send prompts to OpenAI API and track usage statistics
- **Database Schema**: Comprehensive MySQL database for tracking various health and fitness metrics
- **Modern Frontend**: React-based UI with responsive design
- **API-First Architecture**: RESTful API with proper error handling and logging

## Tech Stack

### Backend
- **Django 4.2.7**: Web framework
- **Django REST Framework**: API development
- **MySQL**: Database
- **JWT Authentication**: Secure token-based auth
- **OpenAI API**: AI integration

### Frontend
- **React 18**: UI framework
- **React Router**: Navigation
- **Axios**: HTTP client
- **Context API**: State management

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- OpenAI API key

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp ../env.example .env
   # Edit .env with your database credentials and OpenAI API key
   ```

5. **Set up MySQL database**:
   ```sql
   CREATE DATABASE tracking_app;
   ```

6. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. **Create superuser**:
   ```bash
   python manage.py createsuperuser
   ```

8. **Start development server**:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/update/` - Update user profile
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/token/refresh/` - Refresh JWT token

### OpenAI Integration
- `POST /api/openai/prompt/` - Send prompt to OpenAI
- `GET /api/openai/usage/` - Get usage statistics

## Database Schema

The application uses a comprehensive MySQL database schema that includes:

- **Users**: User accounts with goals and preferences
- **Foods**: Nutritional information database
- **Meals**: Meal planning and tracking
- **Logging**: Food, weight, water, steps, cardio logs
- **Workouts**: Exercise tracking and muscle activation
- **Health**: Sleep and health metrics
- **Analytics**: API usage and error logging

See `notes/database_structure.md` for detailed schema information.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_NAME=tracking_app
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=604800

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENV=development
```

## Development

### Backend Development
- Follow the style guide in `backend/STYLE_GUIDE.md`
- Use Django's built-in development server for local development
- Run tests with `python manage.py test`

### Frontend Development
- Follow the style guide in `frontend/STYLE_GUIDE.md`
- Use `npm start` for development server with hot reload
- Run tests with `npm test`

## Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

### Backend Deployment
1. Set `DEBUG=False` in production
2. Configure production database
3. Set up static file serving
4. Use a production WSGI server (e.g., Gunicorn)

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Serve static files through web server (e.g., Nginx)

## Contributing

1. Follow the established style guides
2. Write tests for new features
3. Update documentation as needed
4. Follow the existing code structure and patterns

## License

This project is licensed under the MIT License.
