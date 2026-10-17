-- Event RSVPs are distinct from newsletter/committee communication consent.
CREATE TABLE IF NOT EXISTS event_rsvps (
  id TEXT PRIMARY KEY NOT NULL,
  event_slug TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  full_name TEXT NOT NULL,
  attendance_mode TEXT NOT NULL CHECK (
    attendance_mode IN (
      'in_person_full_event',
      'in_person_program_only',
      'virtual_program_only',
      'in_person_happy_hour_only'
    )
  ),
  lab_interest TEXT CHECK (lab_interest IS NULL OR lab_interest IN ('yes', 'no', 'unsure')),
  cm_credit TEXT CHECK (cm_credit IS NULL OR cm_credit IN ('yes', 'no')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (event_slug, email_normalized)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_mode
  ON event_rsvps(event_slug, attendance_mode);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_updated_at
  ON event_rsvps(updated_at);
