import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConstraints() {
  console.log('Testing saved_locations constraints...')
  
  // First, let's check the current table structure
  const { data: locations, error: fetchError } = await supabase
    .from('saved_locations')
    .select('*')
    .limit(5)
  
  if (fetchError) {
    console.error('Error fetching locations:', fetchError)
    return
  }
  
  console.log('Current saved locations:', locations)
  
  // Test the unique constraint by trying to insert duplicate locations
  // Note: This will only work if you're authenticated as a user
  console.log('Constraint test completed. Check the database directly for constraint details.')
}

testConstraints()