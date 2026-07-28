// Usage:
//   $env:SUPABASE_ACCESS_TOKEN='sbp_...'
//   node scripts/set_razorpay_secrets.js rzp_test_XXXXXXXX YOUR_TEST_KEY_SECRET
//
// This sets RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET as Edge Function secrets
// on the Supabase project. Values are NOT stored anywhere in this repo.

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF || 'yuvdxablxnpgkcafawlt';
const keyId = process.argv[2];
const keySecret = process.argv[3];

if (!accessToken) {
  console.error('ERROR: Set SUPABASE_ACCESS_TOKEN in your environment.');
  process.exit(1);
}

if (!keyId || !keySecret) {
  console.error('Usage: node set_razorpay_secrets.js <RAZORPAY_KEY_ID> <RAZORPAY_KEY_SECRET>');
  process.exit(1);
}

async function main() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/secrets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      { name: 'RAZORPAY_KEY_ID', value: keyId },
      { name: 'RAZORPAY_KEY_SECRET', value: keySecret },
    ]),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Failed (${res.status}):`, text);
    process.exit(1);
  }
  console.log('Razorpay secrets set successfully.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
