-- Move pto_days_per_engineer from quarters to teams table
-- PTO is a team-specific policy, not quarter-specific

-- Add pto_days_per_engineer to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS pto_days_per_engineer NUMERIC DEFAULT 0;

-- Migrate existing PTO data from quarters to teams (if any)
-- This is a one-time data migration - we'll use the first quarter's PTO value as the team default
UPDATE teams t
SET pto_days_per_engineer = COALESCE(
  (SELECT q.pto_days_per_engineer
   FROM quarters q
   WHERE q.pto_days_per_engineer IS NOT NULL
   ORDER BY q.start_date ASC
   LIMIT 1),
  0
)
WHERE t.pto_days_per_engineer IS NULL OR t.pto_days_per_engineer = 0;

-- Note: We're keeping pto_days_per_engineer in quarters table for backward compatibility
-- but new code should read from teams table
-- If you want to remove it from quarters, uncomment the following line:
-- ALTER TABLE quarters DROP COLUMN IF EXISTS pto_days_per_engineer;
