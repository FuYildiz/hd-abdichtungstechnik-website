CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Sonstiges',
  status TEXT NOT NULL DEFAULT 'neu',
  source TEXT NOT NULL DEFAULT 'website',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads (category);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);
