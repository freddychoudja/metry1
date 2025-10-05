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

    // Get Meteomatics credentials
    const username = Deno.env.get('METEOMATICS_USERNAME');
    const password = Deno.env.get('METEOMATICS_PASSWORD');

    if (!username || !password) {
      throw new Error('Meteomatics credentials not found in environment variables');
    }

    // Call Meteomatics API for weather forecast
    const parameters = ['t_2m:C', 't_min_2m_24h:C', 't_max_2m_24h:C', 'prob_precip_1h:p', 'wind_speed_10m:ms'];
    const paramString = parameters.join(',');
    const weatherUrl = `https://api.meteomatics.com/${date}T12:00:00Z/${paramString}/${latitude},${longitude}/json`;
    
    const weatherResponse = await fetch(weatherUrl, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`)
      }
    });
    
    if (!weatherResponse.ok) {
      throw new Error(`Meteomatics API error: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json();
    console.log('Meteomatics weather data received:', JSON.stringify(weatherData));

    // Extract weather metrics from Meteomatics response
    let avgTemp = 20, tempMin = 15, tempMax = 25, rainProbability = 20, windSpeed = 10;
    
    if (weatherData.data) {
      for (const param of weatherData.data) {
        const value = param.coordinates?.[0]?.dates?.[0]?.value;
        if (value !== null && value !== undefined) {
          switch (param.parameter) {
            case 't_2m:C':
              avgTemp = value;
              break;
            case 't_min_2m_24h:C':
              tempMin = value;
              break;
            case 't_max_2m_24h:C':
              tempMax = value;
              break;
            case 'prob_precip_1h:p':
              rainProbability = value;
              break;
            case 'wind_speed_10m:ms':
              windSpeed = value * 3.6; // Convert m/s to km/h
              break;
          }
        }
      }
    }

    // Use the average temperature from Meteomatics or calculate if needed
    if (avgTemp === 20 && tempMin !== 15 && tempMax !== 25) {
      avgTemp = Math.round((tempMax + tempMin) / 2);
    } else {
      avgTemp = Math.round(avgTemp);
    }

    // Determine wind strength
    let windStrength = 'faible';
    if (windSpeed > 30) windStrength = 'fort';
    else if (windSpeed > 15) windStrength = 'moyen';

    // Build weather description for AI
    const weatherDescription = `Température moyenne: ${avgTemp}°C (min: ${tempMin}°C, max: ${tempMax}°C), Probabilité de pluie: ${rainProbability}%, Vent: ${windStrength} (${windSpeed} km/h)`;

    console.log('Weather description:', weatherDescription);

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