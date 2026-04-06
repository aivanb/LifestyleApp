# Workout & Macro Tracking App

A comprehensive fitness tracking application that helps you monitor your workouts, nutrition, and health metrics - all in one place. Built with modern web technologies and featuring AI-powered food logging.

## What is this app?

This is a full-featured fitness tracking system that allows you to:
- **Track your workouts** with detailed exercise logs and muscle group targeting
- **Monitor nutrition** with an extensive food database and macro tracking
- **Log health metrics** including weight, body measurements, sleep, and more
- **Use voice commands** to log food quickly with AI transcription
- **View analytics** with comprehensive data visualization and progress tracking

## Getting Started

### System Requirements

Before installing, ensure you have:
- Python 3.8 or higher
- Node.js 16 or higher  
- MySQL 8.0 or higher
- A modern web browser (Chrome, Firefox, Safari, Edge)
- At least 2GB of free disk space

### Quick Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TrackingApp
   ```

2. **Set up the environment file**
   ```bash
   cp .env.example .env
   # or: cp env.example .env
   ```
   Edit `.env` and add:
   - Your MySQL database credentials
   - A secure SECRET_KEY (use a password generator)
   - Your OpenAI API key (optional, for AI features)

3. **Install and run with the setup script** (Recommended)
   ```bash
   # Windows
   .\scripts\setup.bat
   
   # Mac/Linux
   ./scripts/setup.sh
   ```

### Manual Installation

If you prefer manual setup:

**Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py setup_database --required  # Reference data only
python manage.py setup_database --full     # With test data
python manage.py runserver
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm start
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### Docker

**Architecture (Compose):** a **MySQL 8.4** service persists data in a named volume; the **Django** API runs in one container (Gunicorn in production, `runserver` in development); the **React** app is either a dev server with hot reload or a static build served by **nginx**, which reverse-proxies `/api`, `/admin`, and `/static` to Django. Only the web entrypoint publishes a host port in production (`WEB_PUBLISH_PORT`, default `80`).

1. Install [Docker Engine](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) (Compose V2 is included with Docker Desktop).
2. Copy `env.example` to `.env`. For Compose, set **`DB_USER`**, **`DB_PASSWORD`**, and **`MYSQL_ROOT_PASSWORD`**. The MySQL image creates `DB_NAME` and grants the app user automatically; **`DB_USER` / `DB_PASSWORD` must match** `MYSQL_USER` / `MYSQL_PASSWORD` in the compose file. Do **not** use a random `DB_PASSWORD` for `DB_USER=root` — it must equal **`MYSQL_ROOT_PASSWORD`**. Prefer **`DB_USER=tracking`** (see `env.example`).
3. **Development** (hot reload, source bind mounts):
   ```bash
   docker compose up --build
   ```
   Open http://localhost:3000 (frontend dev server proxies `/api` to the backend container). Backend: http://localhost:8000.
4. **Production** (optimized images, nginx on port 80):
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```
   Open http://localhost . Set `DEBUG=False`, a strong `SECRET_KEY`, and `ALLOWED_HOSTS` (and `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` if you use a real hostname or HTTPS).
5. **First-time database content** (invite keys, reference data): after the stack is up, either set `RUN_SETUP_REQUIRED=1` in `.env` for **one** production bring-up (the backend entrypoint runs `setup_database --required`), or run manually:
   ```bash
   docker compose exec backend python manage.py setup_database --required
   ```

**Commands reference**

| Action | Development | Production |
|--------|-------------|------------|
| Build | `docker compose build` | `docker compose -f docker-compose.prod.yml build` |
| Start | `docker compose up -d` | `docker compose -f docker-compose.prod.yml up -d` |
| Stop | `docker compose down` | `docker compose -f docker-compose.prod.yml down` |
| Rebuild cleanly | `docker compose build --no-cache && docker compose up` | Same with `-f docker-compose.prod.yml` |
| Remove DB volume | `docker compose down -v` | `docker compose -f docker-compose.prod.yml down -v` |

Helper scripts: `scripts/docker/*.sh` (Git Bash / macOS / Linux) and `scripts/docker/*.ps1` (Windows).

**Troubleshooting (Docker)**

- **504 Gateway Timeout on `/api/` (production compose):** nginx’s default upstream read timeout is 60s while Gunicorn allows 120s. Slow API calls can hit 504 in the browser even though Django is still working. `frontend/docker/nginx-frontend.conf` aligns proxy timeouts with Gunicorn; rebuild the `web` image after changing either side.
- **`dependency failed to start` / “backend has no healthcheck configured”:** `frontend` / `web` use `depends_on: backend: condition: service_healthy`. The `backend` service defines a TCP healthcheck on port 8000 (`docker-compose.yml` and `docker-compose.prod.yml`). If the API never listens (crash loop), the healthcheck fails—check `docker compose logs backend`.
- **MySQL `1045` / `Access denied for user 'root'` (backend entrypoint retrying):** Django and `wait_for_mysql.py` use `DB_USER` / `DB_PASSWORD` from `.env`. If `DB_USER=root`, `DB_PASSWORD` must be **identical** to `MYSQL_ROOT_PASSWORD`. Prefer `DB_USER=tracking` with a strong `DB_PASSWORD` (see `env.example`). If you changed passwords after the DB volume was created, MySQL still has the old passwords—use `docker compose down -v` (wipes data) or revert `.env` to the original secrets.
- **MySQL “connection refused” / backend restarts:** wait for the DB healthcheck (first start can take a minute). Check logs: `docker compose logs -f db backend`.
- **`DB_PASSWORD` / `MYSQL_ROOT_PASSWORD` errors on `up`:** Compose requires these variables; they must be set in `.env`.
- **CORS errors in the browser:** set `CORS_ALLOWED_ORIGINS` to your exact frontend origin (comma-separated), or use the production stack so the UI and API share one origin (`/api`).
- **Port already in use:** set `BACKEND_PUBLISH_PORT`, `FRONTEND_PUBLISH_PORT`, or `WEB_PUBLISH_PORT` in `.env`.
- **Stale node modules in dev:** run `docker compose down -v` (removes the anonymous `frontend_node_modules` volume) and `docker compose up --build`.

## Using the Application

### First Time Setup

1. **Create an account**: Navigate to http://localhost:3000 and click "Register". You will need a valid **invite key** (provided by an administrator or created during database setup; e.g. `dev-invite-key-001` when using `setup_database --required` or `--full`).
2. **Set your profile**: Add your name, username, email, height, birthday, units, and activity level (saved via the profile API). The **Home** page summarizes today’s workout split targets, nutrition progress, calorie budget (including cardio and estimated calories from steps), and which extra trackers still need a log.
3. **Set your goals**: Define target weight, calories, and macros

### Core Features

#### Workout Tracking
- Create custom workout routines and splits
- Log sets, reps, and weights (optional set modifiers: drop sets, partials, assisted sets, negatives, rest pause)
- Track muscle group activation
- View workout history and progress
- Manage muscle priorities for balanced training

#### Nutrition Logging
- Search our database of 8000+ foods
- Create custom foods and meals
- Use voice commands to log food naturally
- Track calories and all macronutrients
- View daily macro summaries

#### Health Metrics
- Log daily weight and body measurements
- Track water intake and steps
- Monitor sleep quality and duration
- Record cardio sessions
- View streak tracking for consistency

#### Data Analysis
- View trends and progress charts
- Export data for external analysis
- Get AI-powered insights (requires OpenAI API key)
- Comprehensive analytics dashboard

## Configuration

### Essential Settings

The app can be configured through environment variables in `.env`:

```env
# Database (Required)
DB_NAME=tracking_app
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password

# Security (Required - generate a random string)
SECRET_KEY=generate-a-long-random-string-here

# Features (Optional)
OPENAI_API_KEY=your-key-here  # For AI features
DEBUG=False                    # Set True for development only
```

### Optional Features

- **AI Food Parsing**: Add an OpenAI API key to enable natural language food logging (the parser splits your text into items and keeps only what you state; it does not look up existing foods in the database)
- **Voice Transcription**: Install Vosk for offline voice processing
- **Email Notifications**: Configure SMTP settings (coming soon)

## Data Privacy

Your data stays on your machine:
- All data is stored locally in your MySQL database
- No telemetry or usage data is collected
- API keys are only used for their intended services
- You can export and delete your data at any time

## Updates

To update to the latest version:
```bash
git pull origin main
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
# Run any new migrations
cd ../backend && python manage.py migrate
```

## Quick Start Examples

### Log Your First Workout
1. Go to "Workout Tracker"
2. Click "Create Workout" 
3. Add exercises (e.g., "Bench Press")
4. Log your sets and reps
5. Save the workout

### Track Your First Meal
1. Go to "Food Log"
2. Select the day on the calendar (entries use that local date plus the time on each card)
3. Search for a food or pick from recent items; saved **meals** also appear in the logger (highlighted in blue) and log every food in the meal
4. Enter servings or a meal multiplier, then tap **Add** / **Log meal**
5. View your daily totals on the dashboard

### Use Voice Commands
1. Click the microphone icon in Food Log
2. Say "I had 200 grams of chicken breast and a cup of brown rice"
3. Review the parsed items
4. Confirm to log

## Troubleshooting

### Common Issues

**"Cannot connect to database"**
- Ensure MySQL is running: `mysql --version`
- Check your database credentials in `.env`
- Make sure the database exists: `CREATE DATABASE tracking_app;`

**"Module not found" errors**
- Backend: Activate virtual environment and run `pip install -r requirements.txt`
- Frontend: Run `npm install` in the frontend directory

**"Port already in use"**
- Backend runs on port 8000, frontend on port 3000
- Kill existing processes or change ports in configuration
- With Docker, override `BACKEND_PUBLISH_PORT`, `FRONTEND_PUBLISH_PORT`, or `WEB_PUBLISH_PORT` in `.env`

**Voice recording not working**
- Ensure microphone permissions are granted in browser
- For better accuracy, install Vosk model: `python backend/download_vosk_model.py`

### Getting Help

1. Check the `DEVELOPER.md` for technical details
2. Review existing test files for usage examples
3. Check the `docs/` directory for additional documentation

## UI Design (November 2025 Refresh)

The application features a modern, minimalistic design:
- **Themes**: Dark and Light modes with neutral grey backdrops
- **Typography**: Josefin Sans font for clean, readable text
- **Surfaces**: Borderless glass panels with deep shadows
- **Floating Actions**: High-contrast gradient buttons
- **Animations**: Smooth transitions and hover effects

## License

This project is licensed under the MIT License. See `LICENSE` file for details.

---

**Need more help?** Check out `DEVELOPER.md` for technical documentation or explore the `docs/` directory for detailed guides.
