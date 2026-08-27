const path = require('path');
const fs = require('fs');

const TARGET = process.env.PKG_TARGET || 'node22-win-x64';
const OUT = path.join(__dirname, '..', 'Dev', 'build');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

console.log(`
  MindBoard Windows-exe packaging
  -------------------------------
  Doel  : ${TARGET}
  Uitvoer: ${path.relative(process.cwd(), OUT)}/MindBoard.exe

  Dit gebruikt @yao-pkg/pkg. De eerste keer downloadt het de
  Node.js binary van GitHub. Vervolgens wordt alles tot één
  enkele .exe samengebundeld — geen installatie nodig.
`);

(async () => {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const cmd = `npx pkg . --target ${TARGET} --output "${path.join(OUT, 'MindBoard.exe')}"`;
    const { stdout, stderr } = await execAsync(cmd, { cwd: path.join(__dirname, '..'), timeout: 300000 });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log('\nKlaar! MindBoard.exe staat in Dev/build/');
    console.log('\nLet op: de exe heeft een draaiende MariaDB nodig (config via .env of env-vars).\n');
  } catch (e) {
    console.error('\nPackaging mislukt:', e.message);
    process.exit(1);
  }
})();