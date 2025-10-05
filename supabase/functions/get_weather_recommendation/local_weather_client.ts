// supabase/functions/get_weather_recommendation/local_weather_client.ts

interface WeatherResult {
  temperature: number;
  rain_24h: number;
  wind_speed: number;
  humidity: number;
}

class LocalWeatherClient {
  private client: any; // Supabase client

  constructor(supabaseClient: any) {
    this.client = supabaseClient;
  }

  async getDailyForecast(lat: number, lon: number, date: string): Promise<WeatherResult> {
    // Appelle la fonction SQL qui trouve les données météo les plus proches
    const { data, error } = await this.client.rpc(
      'get_nearest_weather',
      { lat, lon, target_date: date }
    );

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée météo disponible pour cette localisation/date');
    }

    const nearest = data[0];

    return {
      temperature: nearest.temperature,
      rain_24h: nearest.precipitation,
      wind_speed: nearest.wind_speed,
      humidity: nearest.humidity
    };
  }

  // Convertit la vitesse du vent en catégorie
  static getWindCategory(speed: number): string {
    if (speed > 30) return 'fort';
    if (speed > 15) return 'moyen';
    return 'faible';
  }
}

export default LocalWeatherClient;