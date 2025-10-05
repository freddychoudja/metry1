# Quick Setup Guide

## 1. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Supabase Setup

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

4. Push database changes:
   ```bash
   supabase db push
   ```

5. Deploy edge functions:
   ```bash
   supabase functions deploy get-nasa-weather
   ```

### Option B: Manual Setup

1. Go to your Supabase dashboard
2. Run the SQL from `supabase/migrations/20240101000000_create_saved_locations.sql`
3. Create a new edge function called `get-nasa-weather`
4. Copy the code from `supabase/functions/get-nasa-weather/index.ts`

## 4. Start Development Server

```bash
npm run dev
```

## 5. Test the Application

1. Open http://localhost:5173
2. Search for a location (e.g., "New York")
3. Select a date and click "Get Weather Data"
4. Sign up/in to save favorite locations

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your Supabase URL and keys are correct
2. **NASA API Timeout**: The NASA API can be slow; wait a few seconds
3. **Location Search Not Working**: Check your internet connection
4. **Database Errors**: Ensure RLS policies are properly set up

### Environment Variables

Double-check your `.env` file has the correct Supabase credentials:
- URL should start with `https://` and end with `.supabase.co`
- Keys should be long alphanumeric strings

### Edge Function Issues

If the weather data isn't loading:
1. Check the edge function is deployed
2. Verify the function URL in the dashboard
3. Check the function logs for errors

## Next Steps

- Customize the UI colors and styling
- Add more weather parameters
- Implement weather alerts
- Add data export functionality
- Create weather comparison features