# WeatherWise Explorer 🛰️

A modern web application that helps users explore historical weather patterns and plan outdoor activities using NASA's climate data.

## Features

- **Location Search**: Search for any location worldwide using OpenStreetMap's Nominatim API
- **Historical Weather Data**: Access NASA POWER API data from 2000-2023
- **Weather Metrics**: View temperature, humidity, rainfall, and wind speed averages
- **Risk Assessment**: Get probabilities for extreme weather conditions
- **Activity Recommendations**: Smart suggestions based on weather patterns
- **User Accounts**: Save favorite locations with Supabase authentication
- **Interactive Charts**: Visualize weather data with responsive charts
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend
- **Supabase** for database, authentication, and edge functions
- **PostgreSQL** database with Row Level Security
- **NASA POWER API** for weather data

### Development
- **Vite** for fast development and building
- **ESLint** for code linting
- **TypeScript** for type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd metry1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   
   Run the database migrations:
   ```bash
   npx supabase db push
   ```
   
   Deploy the edge function:
   ```bash
   npx supabase functions deploy get-nasa-weather
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/
│   ├── ui/                 # Shadcn/ui components
│   ├── AuthModal.tsx       # Authentication modal
│   ├── LocationSearch.tsx  # Location search component
│   ├── NasaWeatherDashboard.tsx # Main dashboard
│   ├── SavedLocations.tsx  # Saved locations management
│   └── WeatherChart.tsx    # Weather data visualization
├── hooks/
│   └── use-toast.ts        # Toast notifications hook
├── integrations/
│   └── supabase/           # Supabase client and types
├── lib/
│   └── utils.ts            # Utility functions
└── App.tsx                 # Main app component

supabase/
├── functions/
│   └── get-nasa-weather/   # Edge function for NASA API
└── migrations/             # Database migrations
```

## Key Components

### NasaWeatherDashboard
The main dashboard component that orchestrates the entire application:
- Location selection and search
- Date picker for historical data
- Weather data display and visualization
- User authentication integration

### LocationSearch
Provides location search functionality using OpenStreetMap's Nominatim API:
- Real-time search suggestions
- Geographic coordinate resolution
- Location name formatting

### WeatherChart
Visualizes weather data using Recharts:
- Bar charts for weather metrics
- Risk probability displays
- Responsive design

### AuthModal
Handles user authentication:
- Sign up and sign in forms
- Supabase Auth integration
- Error handling and validation

### SavedLocations
Manages user's favorite locations:
- CRUD operations for saved locations
- Integration with Supabase database
- User-specific data with RLS

## API Integration

### NASA POWER API
The application uses NASA's POWER (Prediction Of Worldwide Energy Resources) API:
- **Endpoint**: `https://power.larc.nasa.gov/api/temporal/daily/point`
- **Parameters**: Temperature (T2M), Humidity (RH2M), Precipitation (PRECTOTCORR), Wind Speed (WS2M)
- **Data Range**: 2000-2023
- **Processing**: Historical averages and extreme weather probabilities

### Edge Function
The `get-nasa-weather` edge function:
- Fetches data from NASA POWER API
- Processes historical data for specific dates
- Calculates averages and probabilities
- Returns formatted weather data

## Database Schema

### saved_locations
```sql
CREATE TABLE saved_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Deployment

### Frontend Deployment
The app can be deployed to any static hosting service:

```bash
npm run build
```

### Supabase Setup
1. Create a new Supabase project
2. Run the migrations to set up the database
3. Deploy the edge functions
4. Configure authentication settings

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- **NASA POWER API** for providing comprehensive weather data
- **Supabase** for backend infrastructure
- **OpenStreetMap** for location search capabilities
- **Shadcn/ui** for beautiful UI components