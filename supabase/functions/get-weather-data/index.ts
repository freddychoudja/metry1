import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Get weather data from OpenWeatherMap API
async function getWeatherFromOpenWeatherMap(
  lat: number,
  lon: number
) {
  const apiKey = Deno.env.get('OPENWEATHER_API_KEY')
  if (!apiKey) throw new Error('OpenWeatherMap API key not configured')
  
  try {
    console.log('Fetching weather from OpenWeatherMap API')
    const endpoint = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    const response = await fetch(endpoint)
    
    if (!response.ok) throw new Error(`OpenWeatherMap API error: ${response.status}`)
    
    const data = await response.json()
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain?.['1h'] || 0,
      windSpeed: data.wind.speed,
      dataPoints: 1,
      source: 'OpenWeatherMap API'
    }
  } catch (error) {
    console.warn('OpenWeatherMap API failed:', error)
    throw error
  }
}

// Fallback to Open-Meteo API (free, no API key required)
async function getWeatherFromOpenMeteo(
  lat: number,
  lon: number
) {
  try {
    console.log('Fetching weather from Open-Meteo API (fallback)')
    const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=auto`
    const response = await fetch(endpoint)
    
    if (!response.ok) throw new Error(`Open-Meteo API error: ${response.status}`)
    
    const data = await response.json()
    const current = data.current
    
    return {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      rainfall: current.precipitation || 0,
      windSpeed: current.wind_speed_10m,
      dataPoints: 1,
      source: 'Open-Meteo API (Fallback)'
    }
  } catch (error) {
    console.warn('Open-Meteo API failed:', error)
    throw error
  }
}

// Get weather data with OpenWeatherMap primary, Open-Meteo fallback
async function getWeatherData(
  lat: number, 
  lon: number
) {
  // Try OpenWeatherMap first
  try {
    const data = await getWeatherFromOpenWeatherMap(lat, lon)
    return {
      source: data.source,
      data: {
        temperature: data.temperature,
        humidity: data.humidity,
        rainfall: data.rainfall,
        windSpeed: data.windSpeed,
        dataPoints: data.dataPoints
      }
    }
  } catch (error) {
    console.warn('OpenWeatherMap failed, trying Open-Meteo:', error)
  }
  
  // Fallback to Open-Meteo
  try {
    const data = await getWeatherFromOpenMeteo(lat, lon)
    return {
      source: data.source,
      data: {
        temperature: data.temperature,
        humidity: data.humidity,
        rainfall: data.rainfall,
        windSpeed: data.windSpeed,
        dataPoints: data.dataPoints
      }
    }
  } catch (error) {
    console.warn('All weather APIs failed:', error)
    throw new Error('Weather APIs unavailable. Both OpenWeatherMap and Open-Meteo failed.')
  }
}

// Process weather data
function processWeatherData(result: any) {
  const data = result.data
  return {
    temperature: {
      avg: data.temperature,
      min: data.temperature - 2,
      max: data.temperature + 2,
      extremeHeatProb: data.temperature > 35 ? 80 : data.temperature > 30 ? 40 : 0
    },
    humidity: {
      avg: data.humidity
    },
    rainfall: {
      avg: data.rainfall,
      heavyRainProb: data.rainfall > 10 ? 60 : data.rainfall > 5 ? 30 : 5
    },
    windSpeed: {
      avg: data.windSpeed
    },
    dataPoints: data.dataPoints
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid or missing JSON body' }), {
      status: 400,
      headers: corsHeaders
    })
  }
  
  try {
    const { latitude, longitude, month, day, dateType } = body

    // Validate input parameters
    if (!latitude || !longitude || !month || !day) {
      throw new Error('Missing required parameters: latitude, longitude, month, day')
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90')
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180')
    }

    if (month < 1 || month > 12) {
      throw new Error('Invalid month: must be between 1 and 12')
    }

    if (day < 1 || day > 31) {
      throw new Error('Invalid day: must be between 1 and 31')
    }

    console.log(`[Weather API] ${latitude},${longitude} -> weather data`)
    
    // Get weather data with fallback
    const weatherResult = await getWeatherData(latitude, longitude)
    const processedData = processWeatherData(weatherResult)

    // Validate data reasonableness
    const temp = Math.round(processedData.temperature.avg * 10) / 10;
    const humidity = Math.round(processedData.humidity.avg * 10) / 10;
    
    // Basic sanity checks
    if (temp < -60 || temp > 60) {
      console.warn(`Suspicious temperature: ${temp}°C for ${latitude},${longitude}`);
    }
    if (humidity < 0 || humidity > 100) {
      console.warn(`Invalid humidity: ${humidity}% for ${latitude},${longitude}`);
    }
    
    // Format result with validation info
    const result = {
      latitude: Math.round(latitude * 10000) / 10000, // Ensure precision
      longitude: Math.round(longitude * 10000) / 10000,
      month,
      day,
      date_type: dateType || 'current',
      avg_temperature: temp,
      avg_humidity: humidity,
      avg_rainfall: Math.round(processedData.rainfall.avg * 10) / 10,
      avg_wind_speed: Math.round(processedData.windSpeed.avg * 10) / 10,
      extreme_heat_probability: Math.round(processedData.temperature.extremeHeatProb * 10) / 10,
      heavy_rain_probability: Math.round(processedData.rainfall.heavyRainProb * 10) / 10,
      data_source: weatherResult.source,
      coordinates_verified: true,
      api_endpoint_used: weatherResult.source.includes('OpenWeatherMap') ? 'openweathermap' : 'open-meteo',
      timestamp: new Date().toISOString()
    }

    console.log(`[Weather API] ${latitude},${longitude} -> source: ${result.data_source}`)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Weather API Error:', error)
    
    const errorResponse = {
      error: error.message,
      timestamp: new Date().toISOString(),
      service: 'get-weather-data'
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: error.message.includes('Invalid') ? 400 : 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})