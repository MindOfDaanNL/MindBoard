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
console.log('  Klaar: public/ gekopieerd naar capacitor/www/');
console.log('\nVolgende stappen voor een APK:');
console.log('  1. cd capacitor && npm install');
console.log('  2. npx cap add android   (eenmalig, vereist Java/Android SDK)');
console.log('  3. npx cap sync android');
console.log('  4. cd android && ./gradlew assembleDebug');
console.log('  → APK staat in capacitor/android/app/build/outputs/apk/\n');