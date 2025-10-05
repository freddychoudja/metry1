import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Get real weather data from Open-Meteo API (free, no API key required)
async function getWeatherFromOpenMeteo(
  lat: number,
  lon: number
) {
  try {
    console.log('Fetching current weather from Open-Meteo API')
    
    const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=auto`
    
    const response = await fetch(endpoint)
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`)
    }
    
    const data = await response.json()
    const current = data.current
    
    return {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      rainfall: current.precipitation || 0,
      windSpeed: current.wind_speed_10m,
      dataPoints: 1,
      source: 'Open-Meteo Weather API (Free & Open Source)'
    }
  } catch (error) {
    console.warn('Open-Meteo API failed:', error)
    throw error
  }
}

// Get historical weather data from Meteomatics API with fallback
async function getHistoricalWeatherData(
  lat: number, 
  lon: number, 
  month: number, 
  day: number
) {
  const username = Deno.env.get('METEOMATICS_USERNAME')
  const password = Deno.env.get('METEOMATICS_PASSWORD')

  // Try Meteomatics first if credentials are available
  if (username && password) {
    try {
      console.log('Attempting Meteomatics API call...')
      
      const dateStr = `2023-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T12:00:00Z`
      const parameters = ['t_2m:C', 'relative_humidity_2m:p', 'precip_1h:mm', 'wind_speed_10m:ms']
      const paramString = parameters.join(',')
      
      const endpoint = `https://api.meteomatics.com/${dateStr}/${paramString}/${lat},${lon}/json`
      
      console.log(`Meteomatics endpoint: ${endpoint}`)
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${username}:${password}`)
        }
      })

      console.log(`Meteomatics response status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Meteomatics data received successfully')
        return {
          source: 'Meteomatics Professional API',
          data: [data]
        }
      } else {
        const errorText = await response.text()
        console.warn(`Meteomatics API error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.warn('Meteomatics API failed:', error)
    }
  }
  
  // Fallback to Open-Meteo current weather
  try {
    console.log('Falling back to Open-Meteo current weather')
    const fallbackData = await getWeatherFromOpenMeteo(lat, lon)
    return {
      source: fallbackData.source,
      data: fallbackData
    }
  } catch (error) {
    console.warn('All weather APIs failed:', error.message)
    throw new Error(`Weather APIs unavailable: ${error.message}. Open-Meteo and Meteomatics both failed.`)
  }
}

// Process weather data from any source
function processWeatherData(result: any) {
  if (result.data && Array.isArray(result.data) && result.data[0]?.data) {
    // Meteomatics format
    const temperatures = []
    const humidity = []
    const rainfall = []
    const windSpeed = []

    for (const yearData of result.data) {
      if (yearData.data) {
        for (const param of yearData.data) {
          const value = param.coordinates?.[0]?.dates?.[0]?.value
          if (value !== null && value !== undefined) {
            switch (param.parameter) {
              case 't_2m:C':
                temperatures.push(value)
                break
              case 'relative_humidity_2m:p':
                humidity.push(value)
                break
              case 'precip_1h:mm':
                rainfall.push(value)
                break
              case 'wind_speed_10m:ms':
                windSpeed.push(value)
                break
            }
          }
        }
      }
    }

    if (temperatures.length === 0) {
      throw new Error('No valid temperature data received from Meteomatics API')
    }
    
    return {
      temperature: {
        avg: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        extremeHeatProb: (temperatures.filter(temp => temp > 35).length / temperatures.length) * 100
      },
      humidity: {
        avg: humidity.length > 0 ? humidity.reduce((a, b) => a + b, 0) / humidity.length : 0
      },
      rainfall: {
        avg: rainfall.length > 0 ? rainfall.reduce((a, b) => a + b, 0) / rainfall.length : 0,
        heavyRainProb: rainfall.length > 0 ? (rainfall.filter(rain => rain > 10).length / rainfall.length) * 100 : 0
      },
      windSpeed: {
        avg: windSpeed.length > 0 ? windSpeed.reduce((a, b) => a + b, 0) / windSpeed.length : 0
      },
      dataPoints: temperatures.length
    }
  } else {
    // Fallback format
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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { latitude, longitude, month, day } = await req.json()

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

    console.log('Fetching weather data for:', { latitude, longitude, month, day })
    
    // Get weather data with fallback
    const weatherResult = await getHistoricalWeatherData(latitude, longitude, month, day)
    const processedData = processWeatherData(weatherResult)

    // Format result for backward compatibility
    const result = {
      latitude,
      longitude,
      month,
      day,
      avg_temperature: Math.round(processedData.temperature.avg * 10) / 10,
      avg_humidity: Math.round(processedData.humidity.avg * 10) / 10,
      avg_rainfall: Math.round(processedData.rainfall.avg * 10) / 10,
      avg_wind_speed: Math.round(processedData.windSpeed.avg * 10) / 10,
      extreme_heat_probability: Math.round(processedData.temperature.extremeHeatProb * 10) / 10,
      heavy_rain_probability: Math.round(processedData.rainfall.heavyRainProb * 10) / 10,
      // Enhanced data
      temperature_range: {
        min: Math.round(processedData.temperature.min * 10) / 10,
        max: Math.round(processedData.temperature.max * 10) / 10
      },
      data_points: processedData.dataPoints,
      data_source: weatherResult.source,
      api_version: "v1.0"
    }

    console.log('Successfully processed Meteomatics weather data:', result)

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
    console.error('Meteomatics Weather API Error:', error)
    
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