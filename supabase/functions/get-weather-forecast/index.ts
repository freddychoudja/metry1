import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, date } = await req.json();
    
    console.log(`Fetching weather for lat: ${latitude}, lon: ${longitude}, date: ${date}`);

    // Call Open-Meteo API for weather data
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&start_date=${date}&end_date=${date}`;
    
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      throw new Error(`Open-Meteo API error: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json();
    console.log('Weather data received:', JSON.stringify(weatherData));

    // Extract weather metrics
    const tempMax = weatherData.daily.temperature_2m_max[0];
    const tempMin = weatherData.daily.temperature_2m_min[0];
    const rainProbability = weatherData.daily.precipitation_probability_max[0];
    const windSpeed = weatherData.daily.wind_speed_10m_max[0];

    // Calculate average temperature
    const avgTemp = Math.round((tempMax + tempMin) / 2);

    // Determine wind strength
    let windStrength = 'faible';
    if (windSpeed > 30) windStrength = 'fort';
    else if (windSpeed > 15) windStrength = 'moyen';

    // Build weather description for AI
    const weatherDescription = `Température moyenne: ${avgTemp}°C (min: ${tempMin}°C, max: ${tempMax}°C), Probabilité de pluie: ${rainProbability}%, Vent: ${windStrength} (${windSpeed} km/h)`;

    console.log('Weather description:', weatherDescription);

    // Call Lovable AI to generate recommendation
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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

    const aiData = await aiResponse.json();
    const recommendation = aiData.choices[0].message.content;

    console.log('AI recommendation:', recommendation);

    // Return complete forecast
    return new Response(
      JSON.stringify({
        temperature: avgTemp,
        temperatureMin: tempMin,
        temperatureMax: tempMax,
        rainProbability,
        windSpeed,
        windStrength,
        recommendation,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in get-weather-forecast:', error);
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