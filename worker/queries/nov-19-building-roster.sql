SELECT
  full_name,
  email_normalized AS email,
  attendance_mode,
  lab_interest,
  cm_credit,
  created_at,
  updated_at
FROM event_rsvps
WHERE event_slug = '2026-11-19-tech-table'
  AND attendance_mode IN (
    'in_person_full_event',
    'in_person_program_only',
    'in_person_happy_hour_only'
  )
ORDER BY full_name COLLATE NOCASE, email_normalized;
