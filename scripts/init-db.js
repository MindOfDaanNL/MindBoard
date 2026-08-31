const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { DB } = require('../src/config');

const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');

console.log('MindBoard database initialisatie\n');
console.log(`  Database : ${DB.database}`);
console.log(`  Host     : ${DB.host}:${DB.port}`);
console.log(`  Gebruiker: ${DB.user}\n`);

const schema = fs.readFileSync(schemaPath, 'utf8');

try {
  execSync(`mysql --default-character-set=utf8mb4 -h "${DB.host}" -P ${DB.port} -u "${DB.user}" -p"${DB.password}" "${DB.database}"`, {
    input: schema,
    stdio: ['pipe', 'inherit', 'inherit']
  });
  console.log('\nSchema succesvol aangemaakt/vernieuwd.');
} catch (e) {
  console.error('\nFout tijdens schema-import:', e.message);
  process.exit(1);
}