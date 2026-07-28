const fs = require('fs');
const path = require('path');

const projectRef = process.env.SUPABASE_PROJECT_REF || 'yuvdxablxnpgkcafawlt';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const functionSlug = process.argv[2];

if (!accessToken) {
  console.error('ERROR: Set SUPABASE_ACCESS_TOKEN in your environment.');
  process.exit(1);
}

if (!functionSlug) {
  console.error('Usage: node deploy_function.js <function-slug>');
  process.exit(1);
}

const functionFile = path.join(__dirname, '..', '..', 'supabase', 'functions', functionSlug, 'index.ts');

if (!fs.existsSync(functionFile)) {
  console.error(`Function file not found: ${functionFile}`);
  process.exit(1);
}

// The Management API deploy endpoint silently drops the first 4 bytes of the
// "body" field (observed empirically). Pad with 4 harmless newlines so real
// source code is preserved intact after the API's stripping behavior.
const sourceCode = '\n\n\n\n' + fs.readFileSync(functionFile, 'utf-8');

async function main() {
  console.log(`Deploying function "${functionSlug}" to project ${projectRef}...`);

  // Check if function already exists
  const listRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const existing = await listRes.json();
  const exists = Array.isArray(existing) && existing.some((f) => f.slug === functionSlug);

  const method = exists ? 'PATCH' : 'POST';
  const url = exists
    ? `https://api.supabase.com/v1/projects/${projectRef}/functions/${functionSlug}`
    : `https://api.supabase.com/v1/projects/${projectRef}/functions`;

  const payload = exists
    ? { body: sourceCode, verify_jwt: false }
    : { slug: functionSlug, name: functionSlug, body: sourceCode, verify_jwt: false };

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await res.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = bodyText;
  }

  if (!res.ok) {
    console.error(`Deploy failed (${res.status}):`);
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log(`Function "${functionSlug}" deployed successfully.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
