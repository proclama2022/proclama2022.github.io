-- Migration 009: Streak Freeze System
-- Adds streak_freeze_remaining column, weekly reset RPC, and pg_cron schedule
-- Part of Phase 19: Level & Streak Enhancement

-- ============================================================================
-- 1. Add streak_freeze_remaining column to user_progress
-- ============================================================================

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS streak_freeze_remaining INT DEFAULT 1
    CHECK (streak_freeze_remaining BETWEEN 0 AND 1);

-- Add comment for documentation
COMMENT ON COLUMN user_progress.streak_freeze_remaining IS
  'Number of streak freezes available this week (0-1, resets weekly on Sunday)';

-- ============================================================================
-- 2. Initialize existing users with default value
-- ============================================================================

UPDATE user_progress
SET streak_freeze_remaining = 1
WHERE streak_freeze_remaining IS NULL;

-- ============================================================================
-- 3. Create RPC for weekly streak freeze reset
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_weekly_streak_freeze()
RETURNS void AS $$
BEGIN
  -- Reset streak freeze for users who have used it
  UPDATE user_progress
  SET streak_freeze_remaining = 1
  WHERE streak_freeze_remaining = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_weekly_streak_freeze() TO authenticated;

-- Revoke public access
REVOKE ALL ON FUNCTION reset_weekly_streak_freeze() FROM PUBLIC;

-- Add comment for documentation
COMMENT ON FUNCTION reset_weekly_streak_freeze() IS
  'Resets streak_freeze_remaining to 1 for all users who have used their freeze. Called weekly by pg_cron on Sunday 00:00 UTC.';

-- ============================================================================
-- 4. Schedule weekly reset with pg_cron (Sunday midnight UTC)
-- ============================================================================

-- Note: pg_cron extension should already be enabled from migration 007
-- Schedule runs at the same time as weekly league promotion (Sunday 00:00 UTC)

SELECT cron.schedule(
  'weekly-streak-freeze-reset',
  '0 0 * * 0',  -- Every Sunday at 00:00 UTC
  $$
  SELECT reset_weekly_streak_freeze();
  $$
);

-- ============================================================================
-- 5. Create index for streak freeze queries (optional optimization)
-- ============================================================================

-- Index for finding users who need freeze reset (those with 0 remaining)
CREATE INDEX IF NOT EXISTS idx_user_progress_streak_freeze_zero
  ON user_progress (user_id)
  WHERE streak_freeze_remaining = 0;
