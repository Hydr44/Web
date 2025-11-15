import { rentriClient } from '@/lib/rentri/client';

async function main() {
  try {
    const response = await rentriClient.lookupCodifica('TIPO_REGISTRO');
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error: any) {
    console.error('Error response:', JSON.stringify(error?.response ?? error, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

