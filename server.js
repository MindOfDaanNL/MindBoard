const app = require('./src/app');
const { PORT, HOST } = require('./src/config');
const { ping } = require('./src/db');

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

const LOGO = `
  ${C.yellow}${C.bold} __  __ _       _   ____              _     ____   _____    _    ____
 |  \\/  (_)_ __ | |_| __ )  ___   __ _| |_  | __ ) / _ \\/ | | | / ___|
 | |\\/| | | '_ \\| __|  _ \\ / _ \\ / _\` | __| |  _ \\| | | | | |_| \\___ \\
 | |  | | | | | | |_| |_) | (_) | (_| | |_  | |_) | |_| | |  _  |___) |
 |_|  |_|_|_| |_|\\__|____/ \\___/ \\__,_|\\__| |____/ \\___/|_|_| |_|____/${C.reset}

  ${C.dim}Projectbeheer · Express + MariaDB · accounts · rollen · kanban${C.reset}
`;

async function start() {
  try {
    await ping();
    console.log(LOGO);
    console.log(`  ${C.green}${C.bold}● Database verbinding OK${C.reset} (MariaDB)`);
  } catch (e) {
    console.error(`\n  ${C.red}${C.bold}✖ Kan geen verbinding maken met MariaDB:${C.reset}`);
    console.error(`    ${C.dim}${e.message}${C.reset}\n`);
    console.error(`  ${C.yellow}Start MariaDB en/of maak de database aan via:${C.reset}`);
    console.error(`    npm run db:init\n`);
    process.exit(1);
  }

  app.listen(PORT, HOST, () => {
    console.log(`  ${C.green}${C.bold}● MindBoard draait op:${C.reset}`);
    console.log(`    ${C.cyan}http://localhost:${PORT}${C.reset}  (web UI)`);
    console.log(`    ${C.cyan}http://localhost:${PORT}/api/health${C.reset}  (health check)\n`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});