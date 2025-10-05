import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { latitude, longitude, month, day } = await req.json()

    // NASA POWER API endpoint
    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,PRECTOTCORR,WS2M&community=RE&longitude=${longitude}&latitude=${latitude}&start=20000101&end=20231231&format=JSON`

    const response = await fetch(nasaUrl)
    const data = await response.json()

    if (!data.properties || !data.properties.parameter) {
      throw new Error('Invalid NASA API response')
    }

    const params = data.properties.parameter
    const dates = Object.keys(params.T2M || {})
    
    // Filter data for the specific month/day across all years
    const targetDates = dates.filter(date => {
      const dateObj = new Date(date.substring(0, 4) + '-' + date.substring(4, 6) + '-' + date.substring(6, 8))
      return dateObj.getMonth() + 1 === month && dateObj.getDate() === day
    })

    if (targetDates.length === 0) {
      throw new Error('No data available for the specified date')
    }

    // Calculate averages and probabilities
    const temperatures = targetDates.map(date => params.T2M[date]).filter(val => val !== -999)
    const humidity = targetDates.map(date => params.RH2M[date]).filter(val => val !== -999)
    const rainfall = targetDates.map(date => params.PRECTOTCORR[date]).filter(val => val !== -999)
    const windSpeed = targetDates.map(date => params.WS2M[date]).filter(val => val !== -999)

    const avg_temperature = temperatures.reduce((a, b) => a + b, 0) / temperatures.length
    const avg_humidity = humidity.reduce((a, b) => a + b, 0) / humidity.length
    const avg_rainfall = rainfall.reduce((a, b) => a + b, 0) / rainfall.length
    const avg_wind_speed = windSpeed.reduce((a, b) => a + b, 0) / windSpeed.length

    // Calculate extreme weather probabilities
    const extreme_heat_probability = (temperatures.filter(temp => temp > 35).length / temperatures.length) * 100
    const heavy_rain_probability = (rainfall.filter(rain => rain > 20).length / rainfall.length) * 100

    const result = {
      latitude,
      longitude,
      month,
      day,
      avg_temperature: Math.round(avg_temperature * 10) / 10,
      avg_humidity: Math.round(avg_humidity * 10) / 10,
      avg_rainfall: Math.round(avg_rainfall * 10) / 10,
      avg_wind_speed: Math.round(avg_wind_speed * 10) / 10,
      extreme_heat_probability: Math.round(extreme_heat_probability * 10) / 10,
      heavy_rain_probability: Math.round(heavy_rain_probability * 10) / 10,
      data_source: "NASA POWER"
    }

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
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})