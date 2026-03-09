-- Migration 007: League System
--
-- Introduces:
-- - League tiers (Bronze, Silver, Gold, Platinum, Diamond)
-- - Weekly league cohorts (groups of ~30 users)
-- - User memberships in cohorts with promotion/relegation tracking
-- - League badge seeds
-- - Extends user_progress with league_tier and timezone

-- ============================================================================
-- League Tiers (Reference Table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS league_tiers (
  tier_key TEXT PRIMARY KEY CHECK (tier_key IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  tier_order INT NOT NULL UNIQUE CHECK (tier_order BETWEEN 1 AND 5),
  display_name TEXT NOT NULL,
  color TEXT NOT NULL,
  symbol TEXT NOT NULL
);

-- Seed tier data
INSERT INTO league_tiers (tier_key, tier_order, display_name, color, symbol)
VALUES
  ('bronze', 1, 'Bronze', '#CD7F32', '🥉'),
  ('silver', 2, 'Silver', '#C0C0C0', '🥈'),
  ('gold', 3, 'Gold', '#FFD700', '🥇'),
  ('platinum', 4, 'Platinum', '#E5E4E2', '💎'),
  ('diamond', 5, 'Diamond', '#B9F2FF', '💠')
ON CONFLICT (tier_key) DO UPDATE
SET tier_order = EXCLUDED.tier_order,
    display_name = EXCLUDED.display_name,
    color = EXCLUDED.color,
    symbol = EXCLUDED.symbol;

-- ============================================================================
-- League Cohorts (Weekly Groups)
-- ============================================================================

CREATE TABLE IF NOT EXISTS league_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_key TEXT NOT NULL REFERENCES league_tiers(tier_key),
  week_start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_cohort_per_tier_week UNIQUE (tier_key, week_start_date)
);

CREATE INDEX IF NOT EXISTS league_cohorts_tier_week_idx
  ON league_cohorts(tier_key, week_start_date DESC);

-- ============================================================================
-- League Memberships (User Participation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS league_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES league_cohorts(id) ON DELETE CASCADE,
  xp_at_start INT NOT NULL DEFAULT 0 CHECK (xp_at_start >= 0),
  xp_at_end INT CHECK (xp_at_end >= 0),
  final_rank INT CHECK (final_rank >= 1),
  promotion_result TEXT CHECK (promotion_result IN ('promoted', 'relegated', 'stayed')),
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_user_per_cohort UNIQUE (user_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS league_memberships_user_idx
  ON league_memberships(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS league_memberships_cohort_idx
  ON league_memberships(cohort_id);

-- ============================================================================
-- Extend user_progress with League Fields
-- ============================================================================

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS league_tier TEXT DEFAULT 'bronze'
    CHECK (league_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond'));

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE league_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_memberships ENABLE ROW LEVEL SECURITY;

-- League tiers are viewable by authenticated users (reference data)
CREATE POLICY "Authenticated users can view league tiers"
  ON league_tiers
  FOR SELECT
  TO authenticated
  USING (true);

-- Cohorts are viewable by authenticated users (needed for leaderboard)
CREATE POLICY "Authenticated users can view league cohorts"
  ON league_cohorts
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can view own memberships
CREATE POLICY "Users can view own league memberships"
  ON league_memberships
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own memberships (for assignment)
CREATE POLICY "Users can insert own league memberships"
  ON league_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own memberships (rare, but allow for consistency)
CREATE POLICY "Users can update own league memberships"
  ON league_memberships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- League Badge Seeds
-- ============================================================================

INSERT INTO badges_catalog (badge_key, title, description)
VALUES
  ('bronze_member', 'Bronze Member', 'Reached Bronze league'),
  ('silver_member', 'Silver Member', 'Reached Silver league'),
  ('gold_member', 'Gold Member', 'Reached Gold league'),
  ('platinum_member', 'Platinum Member', 'Reached Platinum league'),
  ('diamond_member', 'Diamond Member', 'Reached Diamond league')
ON CONFLICT (badge_key) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get the current week's cohort for a tier, creating one if it doesn't exist
CREATE OR REPLACE FUNCTION get_or_create_current_cohort(p_tier_key TEXT)
RETURNS UUID AS $$
DECLARE
  v_cohort_id UUID;
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
BEGIN
  -- Try to get existing cohort
  SELECT id INTO v_cohort_id
  FROM league_cohorts
  WHERE tier_key = p_tier_key AND week_start_date = v_week_start;

  -- Create if doesn't exist
  IF v_cohort_id IS NULL THEN
    INSERT INTO league_cohorts (tier_key, week_start_date)
    VALUES (p_tier_key, v_week_start)
    RETURNING id INTO v_cohort_id;
  END IF;

  RETURN v_cohort_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_or_create_current_cohort(TEXT) TO authenticated;
REVOKE ALL ON FUNCTION get_or_create_current_cohort(TEXT) FROM PUBLIC;

-- Assign user to a league cohort (called on first XP event or when tier changes)
CREATE OR REPLACE FUNCTION assign_user_to_league(p_user_id UUID, p_tier_key TEXT DEFAULT 'bronze')
RETURNS UUID AS $$
DECLARE
  v_cohort_id UUID;
  v_xp_total INT;
  v_existing_membership UUID;
BEGIN
  -- Get user's current XP
  SELECT xp_total INTO v_xp_total
  FROM user_progress
  WHERE user_id = p_user_id;

  v_xp_total := COALESCE(v_xp_total, 0);

  -- Check if user already has a membership for this week in this tier
  SELECT lm.id INTO v_existing_membership
  FROM league_memberships lm
  JOIN league_cohorts lc ON lm.cohort_id = lc.id
  WHERE lm.user_id = p_user_id
    AND lc.tier_key = p_tier_key
    AND lc.week_start_date = date_trunc('week', CURRENT_DATE)::DATE;

  -- If already a member, return existing
  IF v_existing_membership IS NOT NULL THEN
    RETURN v_existing_membership;
  END IF;

  -- Get or create cohort
  v_cohort_id := get_or_create_current_cohort(p_tier_key);

  -- Create membership
  INSERT INTO league_memberships (user_id, cohort_id, xp_at_start)
  VALUES (p_user_id, v_cohort_id, v_xp_total)
  RETURNING id INTO v_existing_membership;

  -- Update user's league tier
  UPDATE user_progress
  SET league_tier = p_tier_key
  WHERE user_id = p_user_id;

  RETURN v_existing_membership;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION assign_user_to_league(UUID, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION assign_user_to_league(UUID, TEXT) FROM PUBLIC;

-- Get league leaderboard with zone indicators
CREATE OR REPLACE FUNCTION get_league_leaderboard(p_user_id UUID)
RETURNS TABLE (
  rank INT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  xp_this_week BIGINT,
  league_tier TEXT,
  level INT,
  is_current_user BOOLEAN,
  is_promotion_zone BOOLEAN,
  is_relegation_zone BOOLEAN
) AS $$
DECLARE
  v_current_tier TEXT;
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
BEGIN
  -- Get user's current tier
  SELECT up.league_tier INTO v_current_tier
  FROM user_progress up
  WHERE up.user_id = p_user_id;

  v_current_tier := COALESCE(v_current_tier, 'bronze');

  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY (up2.xp_total - lm.xp_at_start) DESC NULLS LAST) AS rank,
    up2.user_id,
    p.display_name,
    p.avatar_url,
    (up2.xp_total - lm.xp_at_start) AS xp_this_week,
    up2.league_tier,
    up2.level,
    (up2.user_id = p_user_id) AS is_current_user,
    (ROW_NUMBER() OVER (ORDER BY (up2.xp_total - lm.xp_at_start) DESC NULLS LAST) <= 10) AS is_promotion_zone,
    (ROW_NUMBER() OVER (ORDER BY (up2.xp_total - lm.xp_at_start) DESC NULLS LAST) >= 26) AS is_relegation_zone
  FROM league_memberships lm
  JOIN league_cohorts lc ON lm.cohort_id = lc.id
  JOIN user_progress up2 ON lm.user_id = up2.user_id
  LEFT JOIN profiles p ON up2.user_id = p.id
  WHERE lc.tier_key = v_current_tier
    AND lc.week_start_date = v_week_start
  ORDER BY (up2.xp_total - lm.xp_at_start) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_league_leaderboard(UUID) TO authenticated;
REVOKE ALL ON FUNCTION get_league_leaderboard(UUID) FROM PUBLIC;

-- Award league badge when user reaches a tier
CREATE OR REPLACE FUNCTION award_league_badge(p_user_id UUID, p_tier_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_badge_key TEXT;
BEGIN
  -- Map tier to badge
  v_badge_key := p_tier_key || '_member';

  -- Check if badge exists
  IF NOT EXISTS (SELECT 1 FROM badges_catalog WHERE badge_key = v_badge_key) THEN
    RETURN false;
  END IF;

  -- Award badge (idempotent)
  INSERT INTO user_badges (user_id, badge_key)
  VALUES (p_user_id, v_badge_key)
  ON CONFLICT (user_id, badge_key) DO NOTHING;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION award_league_badge(UUID, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION award_league_badge(UUID, TEXT) FROM PUBLIC;

-- ============================================================================
-- Weekly Promotion/Relegation Functions (Task 1 - Plan 17-04)
-- ============================================================================

-- Get tier order for promotion/relegation lookup
CREATE OR REPLACE FUNCTION get_adjacent_tier(
  p_current_tier TEXT,
  p_direction TEXT  -- 'up' or 'down'
) RETURNS TEXT AS $$
DECLARE
  v_current_order INT;
  v_new_order INT;
BEGIN
  SELECT tier_order INTO v_current_order
  FROM league_tiers WHERE tier_key = p_current_tier;

  IF v_current_order IS NULL THEN
    RETURN p_current_tier;
  END IF;

  IF p_direction = 'up' THEN
    v_new_order := v_current_order + 1;
  ELSE
    v_new_order := GREATEST(v_current_order - 1, 1); -- Floor at Bronze
  END IF;

  RETURN (
    SELECT tier_key FROM league_tiers WHERE tier_order = v_new_order
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main promotion/relegation processor (Task 1 - Plan 17-04)
CREATE OR REPLACE FUNCTION process_weekly_promotion_relegation()
RETURNS void AS $$
DECLARE
  v_cohort RECORD;
  v_membership RECORD;
  v_new_tier TEXT;
  v_old_tier TEXT;
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
BEGIN
  -- Process each active cohort
  FOR v_cohort IN
    SELECT id, tier_key FROM league_cohorts
    WHERE week_start_date = v_week_start
  LOOP
    -- Update final ranks and xp_at_end
    UPDATE lm SET
      final_rank = ranked.rn,
      xp_at_end = ranked.xp_total
    FROM (
      SELECT
        lm_inner.id,
        ROW_NUMBER() OVER (
          ORDER BY (up.xp_total - lm_inner.xp_at_start) DESC
        ) as rn,
        up.xp_total
      FROM league_memberships lm_inner
      JOIN user_progress up ON up.user_id = lm_inner.user_id
      WHERE lm_inner.cohort_id = v_cohort.id
    ) ranked
    WHERE league_memberships.id = ranked.id;

    -- Promote top 10
    FOR v_membership IN
      SELECT lm.*, up.league_tier
      FROM league_memberships lm
      JOIN user_progress up ON up.user_id = lm.user_id
      WHERE lm.cohort_id = v_cohort.id
        AND lm.final_rank <= 10
        AND lm.final_rank IS NOT NULL
    LOOP
      v_new_tier := get_adjacent_tier(v_membership.league_tier, 'up');
      IF v_new_tier IS NOT NULL AND v_new_tier != v_membership.league_tier THEN
        UPDATE user_progress SET league_tier = v_new_tier
        WHERE user_id = v_membership.user_id;

        UPDATE league_memberships SET promotion_result = 'promoted'
        WHERE id = v_membership.id;

        -- Award league badge (LEAG-07)
        INSERT INTO user_badges (user_id, badge_key)
        VALUES (v_membership.user_id, v_new_tier || '_member')
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;

    -- Relegate bottom 5 (not Bronze)
    FOR v_membership IN
      SELECT lm.*, up.league_tier
      FROM league_memberships lm
      JOIN user_progress up ON up.user_id = lm.user_id
      WHERE lm.cohort_id = v_cohort.id
        AND lm.final_rank >= 26
        AND lm.final_rank IS NOT NULL
        AND up.league_tier != 'bronze'
    LOOP
      v_new_tier := get_adjacent_tier(v_membership.league_tier, 'down');
      IF v_new_tier IS NOT NULL THEN
        UPDATE user_progress SET league_tier = v_new_tier
        WHERE user_id = v_membership.user_id;

        UPDATE league_memberships SET promotion_result = 'relegated'
        WHERE id = v_membership.id;
      END IF;
    END LOOP;

    -- Mark remaining as stayed
    UPDATE league_memberships SET promotion_result = 'stayed'
    WHERE cohort_id = v_cohort.id AND promotion_result IS NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
