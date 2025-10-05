# NASA Weather Explorer - Setup Guide

## Overview
A React web application that helps users explore historical weather patterns and plan outdoor activities using NASA's climate data.

## Features
- 🛰️ NASA POWER API integration for historical weather data
- 🗺️ Location search with OpenStreetMap integration
- 📊 Interactive weather charts and visualizations
- 👤 User authentication with Supabase
- ❤️ Save favorite locations
- 📱 Responsive design (desktop + mobile)
- 🎯 Activity recommendations based on weather conditions

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Charts**: Recharts
- **UI Components**: Radix UI + shadcn/ui
- **Data Source**: NASA POWER API

## Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Install Dependencies
```bash
cd metry1
npm install
```

### 2. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_APP_TITLE=NASA Weather Explorer
```

### 3. Database Setup
Run the database migrations:
```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Or manually run the SQL from `supabase/migrations/20240101000000_create_saved_locations.sql` in your Supabase SQL editor.

### 4. Deploy Edge Function
```bash
# Deploy the NASA weather data function
supabase functions deploy get-nasa-weather
```

### 5. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

### Basic Flow
1. **Search Location**: Use the search bar to find a city or location
2. **Select Date**: Choose a month and day to explore historical patterns
3. **Get Weather Data**: Click "Get Weather Data" to fetch NASA satellite data
4. **View Results**: See weather metrics, risk assessments, and activity recommendations
5. **Save Favorites**: Sign in to save your favorite locations

### Features Explained

#### Weather Metrics
- **Temperature**: Average temperature in Celsius
- **Humidity**: Relative humidity percentage
- **Rainfall**: Average precipitation in millimeters
- **Wind Speed**: Average wind speed in meters per second

#### Risk Assessment
- **Extreme Heat Risk**: Probability of temperatures above 35°C
- **Heavy Rain Risk**: Probability of rainfall above 20mm

#### Activity Recommendations
Smart suggestions based on weather conditions:
- 🏠 Indoor Activities (high rain risk)
- 🌅 Early Morning/Evening (extreme heat risk)
- 🥾 Perfect for Hiking (ideal conditions)
- 🚴 Great for Cycling (good conditions)

## API Integration

### NASA POWER API
The app uses NASA's POWER (Prediction Of Worldwide Energy Resources) API to fetch historical weather data from 2000-2023. The Edge Function processes this data to calculate:
- Multi-year averages for specific dates
- Extreme weather probabilities
- Statistical summaries

### Location Search
Uses OpenStreetMap's Nominatim API for location search and geocoding.

## Architecture

### Frontend Components
- `NasaWeatherDashboard`: Main dashboard component
- `LocationSearch`: Location search with autocomplete
- `WeatherChart`: Interactive charts using Recharts
- `SavedLocations`: User's favorite locations
- `AuthModal`: Authentication modal

### Backend (Supabase)
- **Database**: PostgreSQL with saved_locations table
- **Auth**: Built-in authentication system
- **Edge Functions**: Serverless functions for NASA API integration

### Data Flow
1. User selects location and date
2. Frontend calls Supabase Edge Function
3. Edge Function fetches data from NASA POWER API
4. Data is processed and statistical analysis performed
5. Results returned to frontend for visualization

## Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the dist folder to your preferred hosting service
```

### Backend (Supabase)
Already deployed when you set up your Supabase project and deploy the Edge Functions.

## Troubleshooting

### Common Issues
1. **Environment Variables**: Make sure all VITE_ prefixed variables are set correctly
2. **CORS Issues**: Ensure your domain is added to Supabase allowed origins
3. **NASA API Limits**: The NASA POWER API has rate limits; the app includes error handling
4. **Database Permissions**: Ensure RLS policies are properly set up

### Error Messages
- "Location Required": Select a location before fetching weather data
- "Failed to fetch weather data": Check your internet connection and NASA API availability
- "Authentication Error": Verify your Supabase credentials

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License
MIT License - feel free to use this project for learning or commercial purposes.