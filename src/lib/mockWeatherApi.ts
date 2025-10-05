// Mock NASA Weather API for development
export const mockWeatherData = {
  generateMockData: (latitude: number, longitude: number, month: number, day: number) => {
    // Generate realistic mock data based on location and date
    const baseTemp = 20 + Math.sin((month - 1) * Math.PI / 6) * 10;
    const tempVariation = Math.random() * 10 - 5;
    
    return {
      latitude,
      longitude,
      month,
      day,
      avg_temperature: Math.round((baseTemp + tempVariation) * 10) / 10,
      avg_humidity: Math.round((50 + Math.random() * 40) * 10) / 10,
      avg_rainfall: Math.round((Math.random() * 15) * 10) / 10,
      avg_wind_speed: Math.round((5 + Math.random() * 15) * 10) / 10,
      extreme_heat_probability: Math.round((Math.random() * 30) * 10) / 10,
      heavy_rain_probability: Math.round((Math.random() * 25) * 10) / 10,
      data_source: "Mock Data (Development)"
    };
  }
};