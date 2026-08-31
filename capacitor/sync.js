const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'public');
const DEST = path.join(__dirname, 'www');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log('MindBoard PWA → Capacitor www sync');
copyDir(SRC, DEST);

// config.js aanmaken/bewaren: hier stel je de API-URL in voor de Android-app.
const configPath = path.join(DEST, 'config.js');
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, [
    '// MindBoard API-configuratie voor Capacitor/Android.',
    '// Stel hier de URL in van de server waar MindBoard draait, bijv.:',
    "//   window.MB_API_BASE = 'https://mindboard.mijndomein.nl/api';",
    "// Of voor een lokaal netwerk:",
    "//   window.MB_API_BASE = 'http://192.168.1.10:3002/api';",
    "window.MB_API_BASE = '/api';",
    ''
  ].join('\n'));
}

// config.js vóór app.js laden zodat window.MB_API_BASE beschikbaar is.
const indexPath = path.join(DEST, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('config.js')) {
  html = html.replace('<script src="/app.js', '<script src="/config.js"></script>\n  <script src="/app.js');
  fs.writeFileSync(indexPath, html);
  console.log('  + config.js script-tag toegevoegd in www/index.html');
}

console.log('  Klaar: public/ gekopieerd naar capacitor/www/ (met config.js injectie)');
console.log('\nVolgende stappen voor een APK:');
console.log('  1. cd capacitor && npm install');
console.log('  2. npx cap add android   (eenmalig, vereist Java/Android SDK)');
console.log('  3. npx cap sync android');
console.log('  4. cd android && ./gradlew assembleDebug');
console.log('  → APK staat in capacitor/android/app/build/outputs/apk/\n');