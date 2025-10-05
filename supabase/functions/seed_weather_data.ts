// supabase/functions/seed_weather_data.ts

// Fonction pour insérer des données météo de test
// À exécuter une seule fois pour remplir la base
export async function seedWeatherData(client: any) {
  const testData = [
    {
      latitude: 48.8566,  // Paris
      longitude: 2.3522,
      date: '2025-10-04',
      temperature: 22,
      precipitation: 5,
      wind_speed: 12,
      humidity: 65
    },
    {
      latitude: 43.2965,  // Marseille
      longitude: 5.3698,
      date: '2025-10-04',
      temperature: 25,
      precipitation: 0,
      wind_speed: 18,
      humidity: 55
    },
    // Ajoute tes données ici...
  ];

  const { error } = await client
    .from('weather_data')
    .upsert(testData, { onConflict: 'latitude,longitude,date' });

  if (error) {
    console.error('Erreur insertion données:', error);
    throw error;
  }

  console.log('Données météo insérées avec succès');
}