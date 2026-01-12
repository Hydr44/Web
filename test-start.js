// Script di test per verificare l'avvio del server
const { exec } = require('child_process');
const path = require('path');

console.log('🔍 Diagnostica avvio server Next.js...\n');

// Verifica Node.js
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());
console.log('');

// Verifica se node_modules esiste
const fs = require('fs');
const nodeModulesPath = path.join(__dirname, 'node_modules');
const envLocalPath = path.join(__dirname, '.env.local');

console.log('📦 Verifica dipendenze:');
console.log('  node_modules esiste:', fs.existsSync(nodeModulesPath));
console.log('  .env.local esiste:', fs.existsSync(envLocalPath));
console.log('');

// Prova a importare Next.js
console.log('📚 Verifica import Next.js:');
try {
  const nextPath = path.join(nodeModulesPath, 'next');
  if (fs.existsSync(nextPath)) {
    console.log('  ✅ Next.js trovato in node_modules');
    const packageJson = require(path.join(nextPath, 'package.json'));
    console.log('  Versione Next.js:', packageJson.version);
  } else {
    console.log('  ❌ Next.js NON trovato in node_modules');
  }
} catch (error) {
  console.log('  ⚠️  Errore:', error.message);
}

console.log('\n✅ Diagnostica completata. Prova ora: npm run dev');

