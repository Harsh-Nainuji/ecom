const fs = require('fs');
const path = require('path');

const projectRef = process.env.SUPABASE_PROJECT_REF || 'yuvdxablxnpgkcafawlt';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const migrationFile = process.argv[2] || path.join(__dirname, '..', '..', 'supabase', 'migrations', '20260725180000_seller_banners_and_storage.sql');

if (!accessToken) {
  console.error('ERROR: Set SUPABASE_ACCESS_TOKEN in your environment.');
  console.error('Generate one at: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

if (!fs.existsSync(migrationFile)) {
  console.error(`Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const sql = fs.readFileSync(migrationFile, 'utf-8');

async function main() {
  console.log(`Applying migration to project ${projectRef}...`);
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const bodyText = await res.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = bodyText;
  }

  if (!res.ok) {
    console.error(`Migration failed (${res.status}):`);
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log('Migration applied successfully.');
  console.log(JSON.stringify(body, null, 2));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
