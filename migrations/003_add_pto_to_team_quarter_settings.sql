-- Add pto_days_per_engineer to team_quarter_settings for per-quarter overrides
ALTER TABLE team_quarter_settings ADD COLUMN IF NOT EXISTS pto_days_per_engineer NUMERIC DEFAULT NULL;

-- NULL means "use the team default", a value means "override for this quarter"
