-- Confidential signup records. No public read route exists in the Worker.
CREATE TABLE IF NOT EXISTS signups (
  id TEXT PRIMARY KEY NOT NULL,
  email_normalized TEXT NOT NULL UNIQUE,
  name TEXT,
  committee_emails INTEGER NOT NULL CHECK (committee_emails IN (0, 1)),
  event_notifications INTEGER NOT NULL CHECK (event_notifications IN (0, 1)),
  consent_at TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  consent_source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'unsubscribed', 'suppressed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signups_status ON signups(status);
CREATE INDEX IF NOT EXISTS idx_signups_updated_at ON signups(updated_at);
