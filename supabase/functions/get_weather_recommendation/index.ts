import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";
import MeteomaticsClient from "./meteomatics_client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { latitude, longitude, date } = await req.json();
    console.log(`Fetching weather recommendation for lat: ${latitude}, lon: ${longitude}, date: ${date}`);

    // Initialize Meteomatics Client
    const meteomaticsToken = Deno.env.get('METEOMATICS_ACCESS_TOKEN');

    if (!meteomaticsToken) {
      throw new Error('Meteomatics access token not configured');
    }

    const meteoClient = new MeteomaticsClient({
      token: meteomaticsToken,
    });

    // Fetch weather data from Meteomatics
    const weatherData = await meteoClient.getDailyForecast(latitude, longitude, date);
    console.log('Meteomatics data received:', JSON.stringify(weatherData));

    // Determine wind strength
    const windStrength = MeteomaticsClient.getWindCategory(weatherData.wind_speed);

    // Build weather description for AI
    const weatherDescription = `Température: ${weatherData.temperature}°C, Précipitations sur 24h: ${weatherData.rain_24h}mm, Humidité: ${weatherData.humidity}%, Vent: ${windStrength} (${weatherData.wind_speed} m/s)`;
    console.log('Weather description for AI:', weatherDescription);

    // Call Gemini AI to generate recommendation
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a friendly weather assistant. Your mission is to provide a SHORT and CLEAR recommendation (2-3 sentences max) about holding an outdoor event (like a parade, festival, etc.) based on the weather. Respond in English unless the user specifies another language. Always start with "Yes" or "No" to answer the question "Will it rain?", then give your practical advice.

Here is the predicted weather: ${weatherDescription}. Is it a good idea to organize an outdoor parade on this day? Should I plan for umbrellas or shelter?`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const recommendation = response.text();
    console.log('AI recommendation:', recommendation);

    // Return complete forecast and recommendation
    return new Response(
      JSON.stringify({
        ...weatherData,
        windStrength,
        recommendation,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in get_weather_recommendation:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
