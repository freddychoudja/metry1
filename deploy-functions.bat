@echo off
echo Deploying Supabase functions with Meteomatics integration...

echo.
echo Setting environment variables...
supabase secrets set METEOMATICS_USERNAME=choudja_freddy
supabase secrets set METEOMATICS_PASSWORD=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2IjoxLCJ1c2VyIjoiY2hvdWRqYV9mcmVkZHkiLCJpc3MiOiJsb2dpbi5tZXRlb21hdGljcy5jb20iLCJleHAiOjE3NTk2MDM1NDIsInN1YiI6ImFjY2VzcyJ9.Tn2Sl0sbssh2ElTu7nIyOCES1CGtY0Muf6rDB8wXG8wLlX0jXIJrQrIPsTkDKTwF24Xk9scZV7pi3gS7G1lmbg

echo.
echo Deploying functions...
supabase functions deploy get-nasa-weather
supabase functions deploy get-weather-forecast

echo.
echo Deployment complete! Your app now uses real Meteomatics weather data.
echo.
pause