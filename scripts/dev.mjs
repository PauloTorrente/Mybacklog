/**
 * `npm run dev`: starts the backend (server/index.mjs, port 3001) and Vite together,
 * so the site always has its API. Ctrl+C stops both.
 */
import { spawn } from 'node:child_process';

const run = (cmd, args) => spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
const server = run(process.execPath, ['--env-file-if-exists=.env', 'server/index.mjs']);
const vite = run(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)]);

const stop = () => {
  server.kill();
  vite.kill();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
server.on('exit', (code) => code && console.error(`\nServidor parou (código ${code}). Veja o erro acima.`));
vite.on('exit', () => {
  server.kill();
  process.exit();
});
