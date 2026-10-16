/**
 * Admin login: one password (ADMIN_PASSWORD in .env). A successful login gets a signed,
 * http-only session cookie valid for 7 days. No user table, no database.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'admin_session';
const WEEK = 7 * 24 * 60 * 60 * 1000;

function secret() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error('ADMIN_PASSWORD não definido (veja .env.example)');
  // Derived from the password: changing the password logs every session out.
  return createHash('sha256').update(`session:${pw}`).digest();
}

const sign = (payload) => createHmac('sha256', secret()).update(payload).digest('base64url');

function same(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(given) {
  const pw = process.env.ADMIN_PASSWORD ?? '';
  // Compare hashes so the comparison time doesn't depend on the password length.
  const h = (s) => createHash('sha256').update(String(s)).digest('hex');
  return pw !== '' && same(h(given), h(pw));
}

export function sessionCookie(secure) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + WEEK })).toString('base64url');
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${WEEK / 1000}${secure ? '; Secure' : ''}`;
}

export const clearCookie = `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;

export function isAdmin(req) {
  const raw = (req.headers.cookie ?? '').split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return false;
  const [payload, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!payload || !sig || !same(sig, sign(payload))) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}
