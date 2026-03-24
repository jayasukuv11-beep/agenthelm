import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zuiceudkenboukonzdsu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1aWNldWRrZW5ib3Vrb256ZHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU4ODg5MSwiZXhwIjoyMDg5MTY0ODkxfQ.gWH92_FybtAOd8ptwuIcW3aC5q7nsBwDKiQIXY92CQk';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const email = 'test+e2e@agenthelm.dev';
  
  // Create user
  await supabase.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true
  });
  
  // Use password to get session
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'password123'
  });

  if (error) {
    console.error('Error getting session:', error);
    process.exit(1);
  }

  console.log('SESSION_JSON=' + JSON.stringify(data.session));
}

main();
