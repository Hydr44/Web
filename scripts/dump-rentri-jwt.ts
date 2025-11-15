import { getRentriAuthorizationToken } from '@/lib/rentri/auth';

async function main() {
  const token = await getRentriAuthorizationToken();
  const [header, payload] = token.split('.');
  console.log('JWT:', token);
  console.log('Header (decoded):', Buffer.from(header, 'base64url').toString('utf8'));
  console.log('Payload (decoded):', Buffer.from(payload, 'base64url').toString('utf8'));
}

main().catch((error) => {
  console.error('Error generating JWT:', error);
  process.exit(1);
});

