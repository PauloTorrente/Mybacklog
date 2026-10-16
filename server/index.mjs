/**
 * Backend: the public catalogue (prices + game details), the EUR→BRL rate, and the admin API.
 * In production it also serves the built site from dist/. Node only, no framework.
 *
 *   npm run server          → http://localhost:3001  (API; `npm run dev` proxies /api to it)
 *   npm run build && npm start  → site + API on one port
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { checkPassword, clearCookie, isAdmin, sessionCookie } from './auth.mjs';
import { lookup } from './lookup.mjs';
import { eurToBrl } from './rates.mjs';
import { readCatalog, saveEntry } from './store.mjs';

const PORT = Number(process.env.PORT ?? 3001);
const DIST = path.resolve(import.meta.dirname, '..', 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.ico': 'image/x-icon' };

const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
};

async function body(req) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > 64 * 1024) throw new Error('corpo grande demais');
    chunks.push(c);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
}

/** Slows down password guessing: each failed login waits a bit longer (per IP, resets after a success). */
const failures = new Map();

async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  if (route === 'GET /api/catalog') return json(res, 200, await readCatalog());
  if (route === 'GET /api/rates') return json(res, 200, await eurToBrl());
  if (route === 'GET /api/me') return json(res, 200, { admin: isAdmin(req) });

  if (route === 'POST /api/login') {
    const ip = req.socket.remoteAddress ?? '';
    const n = failures.get(ip) ?? 0;
    await new Promise((r) => setTimeout(r, Math.min(n, 10) * 500));
    const { password } = await body(req);
    if (!checkPassword(password)) {
      failures.set(ip, n + 1);
      return json(res, 401, { error: 'Senha incorreta' });
    }
    failures.delete(ip);
    const secure = (req.headers['x-forwarded-proto'] ?? '') === 'https';
    return json(res, 200, { admin: true }, { 'Set-Cookie': sessionCookie(secure) });
  }
  if (route === 'POST /api/logout') return json(res, 200, { admin: false }, { 'Set-Cookie': clearCookie });

  // Everything below needs an admin session.
  if (!isAdmin(req)) return json(res, 401, { error: 'Faça login' });

  const m = url.pathname.match(/^\/api\/catalog\/([a-z0-9-]+)$/);
  if (m && req.method === 'PUT') return json(res, 200, await saveEntry(m[1], await body(req)));
  if (route === 'GET /api/lookup') {
    const title = url.searchParams.get('title') ?? '';
    if (!title.trim()) return json(res, 400, { error: 'Falta o título' });
    return json(res, 200, (await lookup(title)) ?? { error: 'Nada encontrado' });
  }
  return json(res, 404, { error: 'Rota não encontrada' });
}

async function staticFile(req, res, url) {
  let file = path.join(DIST, decodeURIComponent(url.pathname));
  if (!file.startsWith(DIST)) return json(res, 403, { error: 'proibido' });
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
  } catch {
    file = path.join(DIST, 'index.html'); // single-page app: /admin and friends load index.html
  }
  try {
    const data = await readFile(file);
    const hashed = /\/assets\//.test(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache' });
    res.end(data);
  } catch {
    json(res, 404, { error: 'Site não compilado: rode npm run build' });
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) await api(req, res, url);
    else await staticFile(req, res, url);
  } catch (err) {
    json(res, 500, { error: err instanceof Error ? err.message : 'erro' });
  }
}).listen(PORT, () => console.log(`Servidor em http://localhost:${PORT}`));
