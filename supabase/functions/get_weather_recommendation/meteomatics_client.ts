// supabase/functions/get_weather_recommendation/meteomatics_client.ts
const METEOMATICS_BASE = "https://api.meteomatics.com"

interface MeteomaticsConfig {
  token: string
}

class MeteomaticsClient {
  private baseUrl: string
  private token: string

  constructor(config: MeteomaticsConfig) {
    this.baseUrl = METEOMATICS_BASE
    this.token = config.token
  }

  private formatDate(date: string) {
    return date.replace(/-/g, '') + '0000'  // YYYYMMDD0000 format
  }

  async getDailyForecast(lat: number, lon: number, date: string) {
    const formattedDate = this.formatDate(date)
    
    // Parameters to fetch (daily values)
    const params = [
      't_2m:C',            // température à 2m en Celsius
      'precip_24h:mm',     // précipitations sur 24h en mm
      'wind_speed_10m:ms', // vitesse du vent à 10m en m/s
      'relative_humidity_2m:p' // humidité relative à 2m en %
    ].join(',')

    const url = `${this.baseUrl}/${formattedDate}/${params}/${lat},${lon}/json`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`Meteomatics API error: ${response.status}`)
    }

    // Define types for the Meteomatics API response
    interface MeteomaticsDate {
      date: string;
      value: number;
    }
    interface MeteomaticsCoordinate {
      lat: number;
      lon: number;
      dates: MeteomaticsDate[];
    }
    interface MeteomaticsParameter {
      parameter: string;
      coordinates: MeteomaticsCoordinate[];
    }
    interface MeteomaticsResponse {
      version: string;
      user: string;
      dateGenerated: string;
      status: string;
      data: MeteomaticsParameter[];
    }

    const data: MeteomaticsResponse = await response.json()
    
    // Parse response format specific to Meteomatics
    const result = {
      temperature: data.data[0].coordinates[0].dates[0].value,
      rain_24h: data.data[1].coordinates[0].dates[0].value,
      wind_speed: data.data[2].coordinates[0].dates[0].value,
      humidity: data.data[3].coordinates[0].dates[0].value
    }

    return result
  }

  // Convertit la vitesse du vent en catégorie
  static getWindCategory(speed: number): string {
    if (speed > 30) return 'fort'
    if (speed > 15) return 'moyen'
    return 'faible'
  }
}

export default MeteomaticsClient