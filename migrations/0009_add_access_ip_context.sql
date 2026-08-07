-- Contesto geografico approssimativo fornito da Cloudflare per l'IP pubblico.
ALTER TABLE user_access_ips ADD COLUMN continent TEXT;
ALTER TABLE user_access_ips ADD COLUMN country TEXT;
ALTER TABLE user_access_ips ADD COLUMN region TEXT;
ALTER TABLE user_access_ips ADD COLUMN region_code TEXT;
ALTER TABLE user_access_ips ADD COLUMN city TEXT;
ALTER TABLE user_access_ips ADD COLUMN timezone TEXT;
ALTER TABLE user_access_ips ADD COLUMN latitude TEXT;
ALTER TABLE user_access_ips ADD COLUMN longitude TEXT;
ALTER TABLE user_access_ips ADD COLUMN postal_code TEXT;

-- Informazioni sul provider e sulla connessione osservata da Cloudflare.
ALTER TABLE user_access_ips ADD COLUMN asn INTEGER;
ALTER TABLE user_access_ips ADD COLUMN as_organization TEXT;
ALTER TABLE user_access_ips ADD COLUMN cloudflare_colo TEXT;
ALTER TABLE user_access_ips ADD COLUMN http_protocol TEXT;
ALTER TABLE user_access_ips ADD COLUMN tls_version TEXT;
ALTER TABLE user_access_ips ADD COLUMN client_tcp_rtt_ms INTEGER;
ALTER TABLE user_access_ips ADD COLUMN client_quic_rtt_ms INTEGER;

CREATE INDEX idx_user_access_ips_country_region ON user_access_ips(country, region_code);
CREATE INDEX idx_user_access_ips_asn ON user_access_ips(asn);
