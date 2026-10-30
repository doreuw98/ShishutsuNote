CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  amount_jpy INTEGER NOT NULL CHECK (amount_jpy > 0),
  category_id TEXT NOT NULL,
  expense_date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_date ON expenses(category_id, expense_date);
CREATE TABLE IF NOT EXISTS monthly_budgets (
  month_key TEXT PRIMARY KEY,
  amount_jpy INTEGER NOT NULL CHECK (amount_jpy >= 0)
);
CREATE TABLE IF NOT EXISTS budget_warnings (
  month_key TEXT PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  language TEXT NOT NULL CHECK (language IN ('ja', 'en', 'id')),
  currency TEXT NOT NULL CHECK (currency IN ('JPY', 'USD', 'IDR')),
  amounts_migrated_to_jpy INTEGER NOT NULL CHECK (amounts_migrated_to_jpy IN (0, 1)),
  legacy_amounts_assumed_jpy INTEGER NOT NULL DEFAULT 0 CHECK (legacy_amounts_assumed_jpy IN (0, 1))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS exchange_rates_cache (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  base TEXT NOT NULL CHECK (base = 'USD'),
  source_timestamp INTEGER NOT NULL,
  fetched_at INTEGER NOT NULL,
  jpy REAL NOT NULL CHECK (jpy > 0),
  idr REAL NOT NULL CHECK (idr > 0)
);
