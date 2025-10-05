// Simple test script to verify NASA POWER API integration
// Run with: node test-nasa-api.js

const testNasaAPI = async () => {
  console.log('🛰️ Testing NASA POWER API...');
  
  // Test coordinates (New York City)
  const latitude = 40.7128;
  const longitude = -74.0060;
  
  const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,PRECTOTCORR,WS2M&community=RE&longitude=${longitude}&latitude=${latitude}&start=20230101&end=20230131&format=JSON`;
  
  try {
    console.log('📡 Fetching data from NASA POWER API...');
    console.log('URL:', nasaUrl);
    
    const response = await fetch(nasaUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API Response received!');
    console.log('📊 Available parameters:', Object.keys(data.properties?.parameter || {}));
    
    if (data.properties?.parameter?.T2M) {
      const temperatures = Object.values(data.properties.parameter.T2M);
      const validTemps = temperatures.filter(temp => temp !== -999);
      const avgTemp = validTemps.reduce((a, b) => a + b, 0) / validTemps.length;
      
      console.log(`🌡️ Average temperature for January 2023: ${avgTemp.toFixed(1)}°C`);
      console.log(`📈 Data points: ${validTemps.length}`);
    }
    
    console.log('🎉 NASA API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing NASA API:', error.message);
    console.log('💡 This might be due to:');
    console.log('   - Network connectivity issues');
    console.log('   - NASA API temporary unavailability');
    console.log('   - Rate limiting');
  }
};

// Run the test
testNasaAPI();