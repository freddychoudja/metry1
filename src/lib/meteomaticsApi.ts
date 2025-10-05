/**
 * Meteomatics API utility functions
 * Base endpoint: https://api.meteomatics.com/
 * Pattern: {datetime}/{parameters}/{lat},{lon}/json
 */

const METEOMATICS_BASE_URL = 'https://api.meteomatics.com';

/**
 * Get current weather data from Meteomatics API
 * @param lat - Latitude
 * @param lon - Longitude  
 * @param dateTime - ISO datetime or "now" (default: "now")
 * @param parameters - Weather parameters (default: comprehensive weather)
 * @returns Weather data
 */
export async function getWeatherFromMeteomatics(
  lat: number, 
  lon: number, 
  dateTime: string = "now",
  parameters: string[] = [
    "t_2m:C", 
    "relative_humidity_2m:p", 
    "wind_speed_10m:ms", 
    "wind_dir_10m:d",
    "precip_1h:mm",
    "prob_precip_1h:p",
    "msl_pressure:hPa",
    "uv:idx"
  ]
) {
  const username = import.meta.env.VITE_METEOMATICS_USERNAME;
  const password = import.meta.env.VITE_METEOMATICS_PASSWORD;

  if (!username || !password) {
    throw new Error('Meteomatics credentials not found in environment variables');
  }

  const paramString = parameters.join(',');
  const endpoint = `${METEOMATICS_BASE_URL}/${dateTime}/${paramString}/${lat},${lon}/json`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`)
      }
    });

    if (!response.ok) {
      throw new Error(`Meteomatics API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Meteomatics API request failed:', error);
    throw error;
  }
}

/**
 * Get weather forecast from Meteomatics API
 * @param lat - Latitude
 * @param lon - Longitude
 * @param startDate - Start date (ISO format)
 * @param endDate - End date (ISO format)
 * @returns Forecast data
 */
export async function getForecastFromMeteomatics(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
) {
  const parameters = [
    "t_2m:C",
    "t_min_2m_24h:C",
    "t_max_2m_24h:C",
    "prob_precip_1h:p",
    "wind_speed_10m:ms",
    "relative_humidity_2m:p"
  ];
  
  return getWeatherFromMeteomatics(lat, lon, `${startDate}--${endDate}:PT1H`, parameters);
}

/**
 * Extract weather parameter from Meteomatics response
 * @param data - Meteomatics API response
 * @param parameter - Parameter name to extract
 * @param dateIndex - Date index (default: 0 for first/current)
 * @returns Parameter value or null
 */
export function extractParameter(data: any, parameter: string, dateIndex: number = 0): number | null {
  const paramData = data.data?.find((item: any) => item.parameter === parameter);
  return paramData?.coordinates?.[0]?.dates?.[dateIndex]?.value || null;
}

/**
 * Extract temperature from Meteomatics response
 */
export function extractTemperature(data: any): number | null {
  return extractParameter(data, 't_2m:C');
}

/**
 * Extract humidity from Meteomatics response
 */
export function extractHumidity(data: any): number | null {
  return extractParameter(data, 'relative_humidity_2m:p');
}

/**
 * Extract wind speed from Meteomatics response
 */
export function extractWindSpeed(data: any): number | null {
  return extractParameter(data, 'wind_speed_10m:ms');
}

/**
 * Extract wind direction from Meteomatics response
 */
export function extractWindDirection(data: any): number | null {
  return extractParameter(data, 'wind_dir_10m:d');
}

/**
 * Extract precipitation from Meteomatics response
 */
export function extractPrecipitation(data: any): number | null {
  return extractParameter(data, 'precip_1h:mm');
}

/**
 * Extract precipitation probability from Meteomatics response
 */
export function extractPrecipitationProbability(data: any): number | null {
  return extractParameter(data, 'prob_precip_1h:p');
}

/**
 * Extract pressure from Meteomatics response
 */
export function extractPressure(data: any): number | null {
  return extractParameter(data, 'msl_pressure:hPa');
}

/**
 * Extract UV index from Meteomatics response
 */
export function extractUVIndex(data: any): number | null {
  return extractParameter(data, 'uv:idx');
}

/**
 * Parse Meteomatics response into a structured weather object
 */
export function parseWeatherData(data: any) {
  return {
    temperature: extractTemperature(data),
    humidity: extractHumidity(data),
    windSpeed: extractWindSpeed(data),
    windDirection: extractWindDirection(data),
    precipitation: extractPrecipitation(data),
    precipitationProbability: extractPrecipitationProbability(data),
    pressure: extractPressure(data),
    uvIndex: extractUVIndex(data),
    timestamp: new Date().toISOString(),
    source: 'Meteomatics API'
  };
}