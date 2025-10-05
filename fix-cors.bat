@echo off
echo Fixing CORS issue for get-weather-data function...
echo.

echo Step 1: Redeploying the function...
supabase functions deploy get-weather-data --project-ref esszvyxcduucbtrqmokv
supabase functions deploy proxy-nominatim --project-ref esszvyxcduucbtrqmokv
echo.
echo Step 2: Checking if Meteomatics credentials are set...
supabase secrets list --project-ref esszvyxcduucbtrqmokv

echo.
echo If you see METEOMATICS_USERNAME and METEOMATICS_PASSWORD above, you're good!
echo If not, run these commands:
echo supabase secrets set METEOMATICS_USERNAME="sinengkengni_juvenal" --project-ref esszvyxcduucbtrqmokv
echo supabase secrets set METEOMATICS_PASSWORD="HIA8GfHYr5Jh6z58vj2I" --project-ref esszvyxcduucbtrqmokv

echo.
echo Step 3: Testing the function...
curl -X POST "https://esszvyxcduucbtrqmokv.supabase.co/functions/v1/get-weather-data" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %VITE_SUPABASE_ANON_KEY%" ^
  -d "{\"latitude\": 40.7128, \"longitude\": -74.0060, \"month\": 12, \"day\": 15}"

pause