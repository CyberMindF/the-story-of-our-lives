// Recupera l'IP pubblico visto da Cloudflare, con un fallback utile durante lo sviluppo locale.
export function getConnectionIp(request) {
  const cloudflareIp = request.headers.get("CF-Connecting-IP")?.trim();
  if (cloudflareIp) {
    return cloudflareIp;
  }

  return request.headers.get("X-Forwarded-For")?.split(",")[0].trim() || null;
}

// Estrae soltanto i dati geografici e di rete utili dal contesto Cloudflare della richiesta.
export function getConnectionContext(request) {
  const cf = request.cf || {};
  return {
    continent: normalizeOptionalText(cf.continent),
    country: normalizeOptionalText(cf.country),
    region: normalizeOptionalText(cf.region),
    regionCode: normalizeOptionalText(cf.regionCode),
    city: normalizeOptionalText(cf.city),
    timezone: normalizeOptionalText(cf.timezone),
    latitude: normalizeOptionalText(cf.latitude),
    longitude: normalizeOptionalText(cf.longitude),
    postalCode: normalizeOptionalText(cf.postalCode),
    asn: normalizeOptionalNumber(cf.asn),
    asOrganization: normalizeOptionalText(cf.asOrganization),
    colo: normalizeOptionalText(cf.colo),
    httpProtocol: normalizeOptionalText(cf.httpProtocol),
    tlsVersion: normalizeOptionalText(cf.tlsVersion),
    clientTcpRtt: normalizeOptionalNumber(cf.clientTcpRtt),
    clientQuicRtt: normalizeOptionalNumber(cf.clientQuicRtt)
  };
}

// Converte i valori testuali mancanti o inattesi in NULL per D1.
function normalizeOptionalText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Accetta soltanto numeri finiti, evitando valori non serializzabili nel database.
function normalizeOptionalNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
