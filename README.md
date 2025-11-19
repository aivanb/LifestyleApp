# Workout & Macro Tracking App

A comprehensive fitness tracking application that helps you monitor your workouts, nutrition, and health metrics - all in one place. Built with modern web technologies and featuring AI-powered food logging.

## 🎯 What is this app?

This is a full-featured fitness tracking system that allows you to:
- **Track your workouts** with detailed exercise logs and muscle group targeting
- **Monitor nutrition** with an extensive food database and macro tracking
- **Log health metrics** including weight, body measurements, sleep, and more
- **Use voice commands** to log food quickly with AI transcription
- **View analytics** with comprehensive data visualization and progress tracking

## 🚀 Getting Started

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
   cp env.example .env
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

If you prefer manual setup, see the detailed instructions in `DEVELOPER.md`.

## 📱 Using the Application

### First Time Setup

1. **Create an account**: Navigate to http://localhost:3000 and click "Register"
2. **Set your profile**: Add your height, birthday, and activity level
3. **Set your goals**: Define target weight, calories, and macros

### Core Features

#### 🏋️ Workout Tracking
- Create custom workout routines and splits
- Log sets, reps, and weights
- Track muscle group activation
- View workout history and progress

#### 🍎 Nutrition Logging
- Search our database of 8000+ foods
- Create custom foods and meals
- Use voice commands to log food naturally
- Track calories and all macronutrients

#### 📊 Health Metrics
- Log daily weight and body measurements
- Track water intake and steps
- Monitor sleep quality and duration
- Record cardio sessions

#### 📈 Data Analysis
- View trends and progress charts
- Export data for external analysis
- Get AI-powered insights (requires OpenAI API key)

## 🖌️ UI Refresh (November 2025)

- Simplified theming to **Dark** and **Light** modes with neutral grey backdrops
- Adopted the **Josefin Sans** typeface for cleaner typography across dashboards
- All primary surfaces (cards, tables, modals) now use borderless glass panels with deeper shadows
- Header bars have been removed—floating, high-contrast action buttons now follow the viewport
- Menu surfaces animate with subtle float-in effects for a more polished feel

## 🛠️ Troubleshooting

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

**Voice recording not working**
- Ensure microphone permissions are granted in browser
- For better accuracy, install Vosk model: `python backend/download_vosk_model.py`

### Getting Help

1. Check the `notes/` directory for additional documentation
2. Review `DEVELOPER.md` for technical details
3. Look at existing test files for usage examples

## 🔧 Configuration

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

- **AI Food Parsing**: Add an OpenAI API key to enable natural language food logging
- **Voice Transcription**: Install Vosk for offline voice processing
- **Email Notifications**: Configure SMTP settings (coming soon)

## 📊 Data Privacy

Your data stays on your machine:
- All data is stored locally in your MySQL database
- No telemetry or usage data is collected
- API keys are only used for their intended services
- You can export and delete your data at any time

## 🔄 Updates

To update to the latest version:
```bash
git pull origin main
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
# Run any new migrations
cd ../backend && python manage.py migrate
```

## 🎮 Quick Start Examples

### Log Your First Workout
1. Go to "Workout Tracker"
2. Click "Create Workout" 
3. Add exercises (e.g., "Bench Press")
4. Log your sets and reps
5. Save the workout

### Track Your First Meal
1. Go to "Food Log"
2. Search for a food (e.g., "chicken breast")
3. Enter the amount
4. Click "Log Food"
5. View your daily totals on the dashboard

### Use Voice Commands
1. Click the microphone icon in Food Log
2. Say "I had 200 grams of chicken breast and a cup of brown rice"
3. Review the parsed items
4. Confirm to log

## 📝 License

This project is licensed under the MIT License. See `LICENSE` file for details.

---

**Need more help?** Check out `DEVELOPER.md` for technical documentation or explore the `notes/` directory for detailed guides.