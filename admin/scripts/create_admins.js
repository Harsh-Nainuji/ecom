const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load admin .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Could not find env file at:', envPath);
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8');
for (const line of env.split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const [k, ...v] = line.split('=');
  if (k) process.env[k.trim()] = v.join('=').trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in admin/.env.local');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = process.argv.slice(2);
if (args.length < 6 || args.length % 3 !== 0) {
  console.log('Usage: node admin/scripts/create_admins.js <email1> <password1> <name1> <email2> <password2> <name2> ...');
  process.exit(1);
}

async function run() {
  const admins = [];
  for (let i = 0; i < args.length; i += 3) {
    admins.push({
      email: args[i],
      password: args[i+1],
      fullName: args[i+2],
    });
  }

  console.log(`Starting admin creation for ${admins.length} accounts...`);

  for (const admin of admins) {
    console.log(`Creating auth account for: ${admin.email}...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true,
      user_metadata: { full_name: admin.fullName },
    });

    if (error) {
      console.error(`Failed to create ${admin.email}:`, error.message);
      continue;
    }

    const userId = data.user.id;
    console.log(`Auth account created! UID: ${userId}. Creating profile...`);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        role: 'admin',
        full_name: admin.fullName,
      });

    if (profileError) {
      console.error(`Failed to create profile for ${admin.email}:`, profileError.message);
    } else {
      console.log(`Successfully created admin profile for ${admin.fullName} (${admin.email})`);
    }
  }
}

run().catch(console.error);
