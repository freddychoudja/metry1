// Test script for Meteomatics API integration
import fetch from 'node-fetch';

const METEOMATICS_USERNAME = 'choudja_freddy';
const METEOMATICS_PASSWORD = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2IjoxLCJ1c2VyIjoiY2hvdWRqYV9mcmVkZHkiLCJpc3MiOiJsb2dpbi5tZXRlb21hdGljcy5jb20iLCJleHAiOjE3NTk2MDM1NDIsInN1YiI6ImFjY2VzcyJ9.Tn2Sl0sbssh2ElTu7nIyOCES1CGtY0Muf6rDB8wXG8wLlX0jXIJrQrIPsTkDKTwF24Xk9scZV7pi3gS7G1lmbg';

async function testMeteomaticsAPI() {
  try {
    console.log('Testing Meteomatics API...');
    
    // Test current weather
    const lat = 48.8566; // Paris
    const lon = 2.3522;
    const parameters = ['t_2m:C', 'relative_humidity_2m:p', 'wind_speed_10m:ms', 'precip_1h:mm'];
    const paramString = parameters.join(',');
    
    const endpoint = `https://api.meteomatics.com/now/${paramString}/${lat},${lon}/json`;
    
    console.log('Endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${METEOMATICS_USERNAME}:${METEOMATICS_PASSWORD}`).toString('base64')
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Success! Weather data received:');
    console.log(JSON.stringify(data, null, 2));
    
    // Extract values
    if (data.data) {
      console.log('\nExtracted values:');
      for (const param of data.data) {
        const value = param.coordinates?.[0]?.dates?.[0]?.value;
        console.log(`${param.parameter}: ${value}`);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testMeteomaticsAPI();