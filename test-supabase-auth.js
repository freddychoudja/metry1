import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xetfzkjqvnfzvhcgqvyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldGZ6a2pxdm5menZoY2dxdnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODMzMDIsImV4cCI6MjA3NTE1OTMwMn0.cKK82sNqlh_FdRrHKZxwfEeRtA3HdeNDRgtj-daGPxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔍 Testing Supabase Authentication Setup...\n');
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing connection...');
    const { data: session } = await supabase.auth.getSession();
    console.log('✅ Connection successful');
    
    // Test 2: Try to sign up with a test email
    console.log('\n2. Testing sign up...');
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (error) {
      console.log('❌ Sign up failed:', error.message);
      
      if (error.message.includes('Signup is disabled')) {
        console.log('💡 Solution: Enable email signup in Supabase Dashboard > Authentication > Settings');
      } else if (error.message.includes('Invalid API key')) {
        console.log('💡 Solution: Check your SUPABASE_ANON_KEY in .env file');
      } else if (error.message.includes('Invalid URL')) {
        console.log('💡 Solution: Check your SUPABASE_URL in .env file');
      }
    } else {
      console.log('✅ Sign up test successful');
      if (data.user && !data.user.email_confirmed_at) {
        console.log('📧 Email confirmation required (this is normal)');
      }
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testAuth();