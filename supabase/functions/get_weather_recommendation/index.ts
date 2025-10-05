import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import MeteomaticsClient from "./meteomatics_client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Call Lovable AI to generate recommendation
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant météo sympathique. Ta mission est de donner une recommandation COURTE et CLAIRE (2-3 phrases maximum) sur la tenue d\'un événement en extérieur (défilé, parade, etc.) en fonction de la météo. Réponds en français avec un ton amical et rassurant. Commence toujours par "Oui" ou "Non" pour répondre à la question "Va-t-il pleuvoir ?", puis donne tes conseils pratiques.'
          },
          {
            role: 'user',
            content: `Voici la météo prévue : ${weatherDescription}. Peux-tu me dire si c'est une bonne idée d'organiser un défilé en extérieur ce jour-là ? Dois-je prévoir des parapluies ou un abri ?`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`Lovable AI error: ${aiResponse.status}`);
    }

    // Define types for the AI service response
    interface AIChoice {
      index: number;
      message: {
        role: string;
        content: string;
      };
      finish_reason: string;
    }
    interface AIResponse {
      id: string;
      object: string;
      created: number;
      model: string;
      choices: AIChoice[];
    }

    const aiData: AIResponse = await aiResponse.json();
    const recommendation = aiData.choices[0].message.content;
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
