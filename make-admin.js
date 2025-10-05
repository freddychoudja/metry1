// Quick script to make a user admin
// Usage: node make-admin.js your-email@example.com

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY // You'll need this key
);

async function makeAdmin(email) {
  if (!email) {
    console.error('Please provide an email: node make-admin.js user@example.com');
    process.exit(1);
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('email', email)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      console.log('❌ User not found. Make sure they have signed up first.');
    } else {
      console.log(`✅ ${email} is now an admin!`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const email = process.argv[2];
makeAdmin(email);