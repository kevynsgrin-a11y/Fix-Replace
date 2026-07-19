-- RepairOrReplace — initial schema (Cloudflare D1 / SQLite).
-- Covers the MVP calculation log plus the Phase 2 account + inventory model and
-- the localized labor-rate grid described in the build brief.

-- Registered users (Phase 2+). Anonymous MVP usage writes no user rows.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,               -- uuid
  email         TEXT UNIQUE NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'free',   -- free | premium | pro
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Saved household appliance inventory (Phase 2 "digital home hardware" log).
CREATE TABLE IF NOT EXISTS appliances (
  id             TEXT PRIMARY KEY,              -- uuid
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category       TEXT NOT NULL,
  brand_tier     TEXT NOT NULL DEFAULT 'mid',
  nickname       TEXT,
  brand          TEXT,
  model_number   TEXT,
  serial_number  TEXT,
  purchase_date  TEXT,                          -- ISO date
  fuel_type      TEXT,                          -- gas | electric | null
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_appliances_user ON appliances(user_id);

-- Proactive maintenance alerts (Phase 2 asset-management hooks).
CREATE TABLE IF NOT EXISTS maintenance_alerts (
  id            TEXT PRIMARY KEY,
  appliance_id  TEXT NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL,                  -- e.g. condenser_coil_clean
  due_date      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | done | dismissed
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_alerts_appliance ON maintenance_alerts(appliance_id);

-- Anonymized calculation log for heuristic calibration (no PII).
CREATE TABLE IF NOT EXISTS calculations (
  id              TEXT PRIMARY KEY,
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  category        TEXT NOT NULL,
  brand_tier      TEXT NOT NULL,
  age_years       REAL,
  fault_component TEXT,
  repair_quote    REAL NOT NULL,
  metro           TEXT,
  state           TEXT,
  verdict         TEXT NOT NULL,
  npc_replace     REAL,
  npc_repair      REAL,
  confidence      INTEGER,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_calc_category ON calculations(category);
CREATE INDEX IF NOT EXISTS idx_calc_created ON calculations(created_at);

-- Localized labor-rate grid (BLS OEWS 49-9031), keyed by metro and by ZIP-3.
CREATE TABLE IF NOT EXISTS labor_rates (
  metro_slug        TEXT PRIMARY KEY,
  metro_name        TEXT NOT NULL,
  state             TEXT NOT NULL,
  mean_hourly_wage  REAL NOT NULL,
  multiplier        REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS zip_metro (
  zip3        TEXT PRIMARY KEY,                 -- first 3 digits of ZIP
  metro_slug  TEXT NOT NULL REFERENCES labor_rates(metro_slug)
);
