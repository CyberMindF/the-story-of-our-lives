-- Uno slug identifica il frammento HTML di un giorno dentro il suo periodo. Due giorni con
-- lo stesso slug produrrebbero ID duplicati e collegamenti ambigui nella Bacheca.
CREATE UNIQUE INDEX idx_bacheca_days_period_slug ON bacheca_days(period_id, slug);
