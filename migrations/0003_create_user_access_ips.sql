-- Conserva gli IP pubblici dai quali ogni account ha completato un accesso valido.
CREATE TABLE user_access_ips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ip_address TEXT NOT NULL,
    first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, ip_address)
);

-- Velocizza eventuali ricerche future per IP senza duplicare i dati.
CREATE INDEX idx_user_access_ips_ip_address ON user_access_ips(ip_address);
