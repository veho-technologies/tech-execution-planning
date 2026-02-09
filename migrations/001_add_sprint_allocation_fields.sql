-- Migration: Add enhanced sprint allocation fields
-- Date: 2026-02-04
-- Description: Adds phase, sprint_goal, num_engineers, and is_manual_override columns

-- Add phase column (defaults to 'Execution')
ALTER TABLE sprint_allocations ADD COLUMN phase TEXT DEFAULT 'Execution';

-- Add sprint_goal column
ALTER TABLE sprint_allocations ADD COLUMN sprint_goal TEXT;

-- Add num_engineers column (supports fractional like 1.5)
ALTER TABLE sprint_allocations ADD COLUMN num_engineers REAL DEFAULT 0;

-- Add is_manual_override flag
ALTER TABLE sprint_allocations ADD COLUMN is_manual_override BOOLEAN DEFAULT 0;
