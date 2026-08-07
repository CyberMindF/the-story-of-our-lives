const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

// Crea risposte JSON uniformi e impedisce al browser di salvarle in cache.
export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(value) {
  return typeof value === "string" && value.length >= 8;
}

// La chiave non distingue maiuscole e minuscole, come nella precedente schermata di accesso.
export function isWorldKeyValid(value, expectedValue) {
  if (typeof value !== "string" || typeof expectedValue !== "string") {
    return false;
  }

  return value.trim().toLocaleLowerCase("it") === expectedValue.trim().toLocaleLowerCase("it");
}

export async function createSession(request, env, userId) {
  const token = randomToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();

  // Elimina le sessioni scadute e memorizza soltanto l'hash del nuovo token.
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(new Date().toISOString()),
    env.DB
      .prepare("INSERT INTO sessions (user_id, token_hash, expires_at, last_seen_at) VALUES (?, ?, ?, ?)")
      .bind(userId, tokenHash, expiresAt, new Date().toISOString())
  ]);

  // Secure viene omesso in locale, dove Wrangler usa normalmente HTTP.
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const cookie = `noi_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure}`;

  return { cookie, expiresAt };
}

// Registra l'IP pubblico della connessione; non rappresenta necessariamente un singolo dispositivo.
export async function recordAccessIp(request, env, userId) {
  const ipAddress = getConnectionIp(request);
  if (!ipAddress) {
    return;
  }

  const now = new Date().toISOString();
  await env.DB
    .prepare(`
      INSERT INTO user_access_ips (user_id, ip_address, first_seen_at, last_seen_at, access_count)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT (user_id, ip_address) DO UPDATE SET
        last_seen_at = excluded.last_seen_at,
        access_count = user_access_ips.access_count + 1
    `)
    .bind(userId, ipAddress, now, now)
    .run();
}

export async function getAuthenticatedUser(request, env) {
  const token = readCookie(request.headers.get("Cookie"), "noi_session");
  if (!token) {
    return null;
  }

  // Il token ricevuto viene trasformato nello stesso hash conservato nel database.
  const tokenHash = await hashToken(token);
  const now = new Date().toISOString();
  const session = await env.DB
    .prepare(`
      SELECT users.id, users.email, users.nickname, sessions.id AS session_id
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > ?
        AND users.is_activated = 1
    `)
    .bind(tokenHash, now)
    .first();

  if (!session) {
    return null;
  }

  // last_seen_at serve a sapere quando la sessione è stata usata l'ultima volta.
  await env.DB
    .prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?")
    .bind(now, session.session_id)
    .run();

  return {
    id: session.id,
    email: session.email,
    nickname: session.nickname
  };
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64Url(bytes);
}

async function hashToken(token) {
  const bytes = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToBase64Url(new Uint8Array(hash));
}

function bytesToBase64Url(bytes) {
  // Base64URL evita caratteri problematici all'interno del valore del cookie.
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function readCookie(header, name) {
  if (!header) {
    return null;
  }

  for (const part of header.split(";")) {
    const [cookieName, ...valueParts] = part.trim().split("=");
    if (cookieName === name) {
      return valueParts.join("=");
    }
  }

  return null;
}

function getConnectionIp(request) {
  // Cloudflare valorizza CF-Connecting-IP; il secondo header facilita soltanto i test locali.
  const cloudflareIp = request.headers.get("CF-Connecting-IP")?.trim();
  if (cloudflareIp) {
    return cloudflareIp;
  }

  return request.headers.get("X-Forwarded-For")?.split(",")[0].trim() || null;
}
