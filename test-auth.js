import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xetfzkjqvnfzvhcgqvyh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldGZ6a2pxdm5menZoY2dxdnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODMzMDIsImV4cCI6MjA3NTE1OTMwMn0.cKK82sNqlh_FdRrHKZxwfEeRtA3HdeNDRgtj-daGPxY'

const supabase = createClient(supabaseUrl, supabaseKey)

// Test sign up
async function testAuth() {
  try {
    console.log('Testing Supabase auth...')
    
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    if (error) {
      console.error('Auth error:', error.message)
    } else {
      console.log('Auth success:', data)
    }
  } catch (err) {
    console.error('Network error:', err)
  }
}

testAuth()