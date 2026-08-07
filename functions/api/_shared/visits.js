import { getConnectionContext, getConnectionIp } from "./request-context.js";

const VISIT_COOKIE = "noi_visit";
const VISIT_DURATION_SECONDS = 60 * 60 * 24 * 365;

// Crea o aggiorna la visita anonima e restituisce l'eventuale cookie da inviare al browser.
export async function captureVisit(request, env) {
  const existingToken = readCookie(request.headers.get("Cookie"), VISIT_COOKIE);
  const token = existingToken || randomToken();
  const tokenHash = await hashToken(token);
  const connection = getConnectionContext(request);
  const now = new Date().toISOString();

  await env.DB
    .prepare(`
      INSERT INTO visits (
        visitor_token_hash, ip_address, user_agent,
        continent, country, region, region_code, city, timezone, latitude, longitude, postal_code,
        asn, as_organization, cloudflare_colo, http_protocol, tls_version,
        client_tcp_rtt_ms, client_quic_rtt_ms, first_seen_at, last_seen_at, request_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT (visitor_token_hash) DO UPDATE SET
        ip_address = COALESCE(excluded.ip_address, visits.ip_address),
        user_agent = COALESCE(excluded.user_agent, visits.user_agent),
        continent = COALESCE(excluded.continent, visits.continent),
        country = COALESCE(excluded.country, visits.country),
        region = COALESCE(excluded.region, visits.region),
        region_code = COALESCE(excluded.region_code, visits.region_code),
        city = COALESCE(excluded.city, visits.city),
        timezone = COALESCE(excluded.timezone, visits.timezone),
        latitude = COALESCE(excluded.latitude, visits.latitude),
        longitude = COALESCE(excluded.longitude, visits.longitude),
        postal_code = COALESCE(excluded.postal_code, visits.postal_code),
        asn = COALESCE(excluded.asn, visits.asn),
        as_organization = COALESCE(excluded.as_organization, visits.as_organization),
        cloudflare_colo = COALESCE(excluded.cloudflare_colo, visits.cloudflare_colo),
        http_protocol = COALESCE(excluded.http_protocol, visits.http_protocol),
        tls_version = COALESCE(excluded.tls_version, visits.tls_version),
        client_tcp_rtt_ms = COALESCE(excluded.client_tcp_rtt_ms, visits.client_tcp_rtt_ms),
        client_quic_rtt_ms = COALESCE(excluded.client_quic_rtt_ms, visits.client_quic_rtt_ms),
        last_seen_at = excluded.last_seen_at,
        request_count = visits.request_count + 1
    `)
    .bind(
      tokenHash,
      getConnectionIp(request),
      request.headers.get("User-Agent")?.slice(0, 512) || null,
      connection.continent,
      connection.country,
      connection.region,
      connection.regionCode,
      connection.city,
      connection.timezone,
      connection.latitude,
      connection.longitude,
      connection.postalCode,
      connection.asn,
      connection.asOrganization,
      connection.colo,
      connection.httpProtocol,
      connection.tlsVersion,
      connection.clientTcpRtt,
      connection.clientQuicRtt,
      now,
      now
    )
    .run();

  const visit = await env.DB
    .prepare("SELECT id FROM visits WHERE visitor_token_hash = ?")
    .bind(tokenHash)
    .first();

  return {
    id: visit.id,
    cookie: existingToken ? null : buildVisitCookie(request, token)
  };
}

// Collega una visita già catturata a utente e sessione senza sovrascrivere collegamenti precedenti.
export async function linkVisitToSession(request, env, userId, sessionId) {
  const token = readCookie(request.headers.get("Cookie"), VISIT_COOKIE);
  if (!token) {
    return;
  }

  const tokenHash = await hashToken(token);
  const visit = await env.DB
    .prepare("SELECT id FROM visits WHERE visitor_token_hash = ?")
    .bind(tokenHash)
    .first();
  if (visit) {
    await linkVisitIdToSession(env, visit.id, userId, sessionId);
  }
}

// Collega direttamente una visita appena creata, anche se il cookie non era presente nella richiesta.
export async function linkVisitIdToSession(env, visitId, userId, sessionId) {
  await env.DB
    .prepare("INSERT OR IGNORE INTO visit_session_links (visit_id, user_id, session_id) VALUES (?, ?, ?)")
    .bind(visitId, userId, sessionId)
    .run();
}

// Genera un token anonimo casuale che non contiene informazioni sul dispositivo.
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64Url(bytes);
}

// Salva nel database soltanto l'hash SHA-256 del token anonimo.
async function hashToken(token) {
  const bytes = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToBase64Url(new Uint8Array(hash));
}

// Converte i byte in Base64URL, formato sicuro per il valore del cookie.
function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

// Legge un cookie per nome senza dipendere da librerie esterne.
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

// Costruisce il cookie anonimo annuale, HttpOnly e limitato allo stesso sito.
function buildVisitCookie(request, token) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${VISIT_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${VISIT_DURATION_SECONDS}${secure}`;
}
