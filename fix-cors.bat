@echo off
echo Fixing CORS issue for get-weather-data function...
echo.

echo Step 1: Redeploying the function...
supabase functions deploy get-weather-data --project-ref VITE_SUPABASE_ANON_KEY
supabase functions deploy proxy-nominatim --project-ref VITE_SUPABASE_ANON_KEY
echo.
echo Step 2: Checking if Meteomatics credentials are set...
supabase secrets list --project-ref VITE_SUPABASE_ANON_KEY

echo.
echo If you see METEOMATICS_USERNAME and METEOMATICS_PASSWORD above, you're good!
echo If not, run these commands:
echo supabase secrets set METEOMATICS_USERNAME="username" --project-ref VITE_SUPABASE_ANON_KEY
echo supabase secrets set METEOMATICS_PASSWORD="password" --project-ref VITE_SUPABASE_ANON_KEY

echo.
echo Step 3: Testing the function...
curl -X POST "https://VITE_SUPABASE_ANON_KEY.supabase.co/functions/v1/get-weather-data" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %VITE_SUPABASE_ANON_KEY%" ^
  -d "{\"latitude\": 40.7128, \"longitude\": -74.0060, \"month\": 12, \"day\": 15}"

pause