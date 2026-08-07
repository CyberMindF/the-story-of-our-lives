-- Visite raccolte prima dell'autenticazione, identificate da un token casuale salvato solo come hash.
CREATE TABLE visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_token_hash TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    continent TEXT,
    country TEXT,
    region TEXT,
    region_code TEXT,
    city TEXT,
    timezone TEXT,
    latitude TEXT,
    longitude TEXT,
    postal_code TEXT,
    asn INTEGER,
    as_organization TEXT,
    cloudflare_colo TEXT,
    http_protocol TEXT,
    tls_version TEXT,
    client_tcp_rtt_ms INTEGER,
    client_quic_rtt_ms INTEGER,
    first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_count INTEGER NOT NULL DEFAULT 1
);

-- Il collegamento è separato per conservare più sessioni senza alterare la visita originale.
CREATE TABLE visit_session_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    linked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES visits(id),
    UNIQUE (visit_id, session_id)
);

CREATE INDEX idx_visits_ip_last_seen ON visits(ip_address, last_seen_at);
CREATE INDEX idx_visits_created_at ON visits(first_seen_at);
CREATE INDEX idx_visit_session_links_user ON visit_session_links(user_id, linked_at);
