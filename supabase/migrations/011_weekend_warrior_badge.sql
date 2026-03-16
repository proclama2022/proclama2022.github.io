-- Migration 011: Weekend Warrior Badge
--
-- Introduces:
-- - Weekend Warrior badge for completing all care tasks on both Saturday and Sunday
-- - Helper function to check weekend care completion eligibility
-- - Progress tracking for weekend completion (0-2 days)

-- ============================================================================
-- Insert Weekend Warrior Badge into badges_catalog
-- ============================================================================

INSERT INTO badges_catalog (badge_key, title, description)
VALUES ('weekend_warrior', 'Weekend Warrior', 'Complete all care tasks on both Saturday and Sunday')
ON CONFLICT (badge_key) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description;

-- ============================================================================
-- Weekend Warrior Eligibility Check Function
-- ============================================================================

CREATE OR REPLACE FUNCTION check_weekend_warrior_eligibility(p_user_id UUID, p_week_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
DECLARE
  v_saturday_complete BOOLEAN := false;
  v_sunday_complete BOOLEAN := false;
  v_week_start DATE;
BEGIN
  -- Get the ISO week start (Monday)
  v_week_start := date_trunc('week', p_week_date)::date;

  -- Check Saturday (week_start + 5 days)
  -- User must have at least one care event (watering or reminder) on Saturday
  SELECT EXISTS (
    SELECT 1
    FROM gamification_events ge
    WHERE ge.user_id = p_user_id
      AND ge.event_type IN ('watering_completed', 'reminder_completed')
      AND ge.created_at >= (v_week_start + 5)::timestamp
      AND ge.created_at < (v_week_start + 6)::timestamp
      AND DATE(ge.created_at AT TIME ZONE 'UTC') = (v_week_start + 5)
  ) INTO v_saturday_complete;

  -- Check Sunday (week_start + 6 days)
  -- User must have at least one care event (watering or reminder) on Sunday
  SELECT EXISTS (
    SELECT 1
    FROM gamification_events ge
    WHERE ge.user_id = p_user_id
      AND ge.event_type IN ('watering_completed', 'reminder_completed')
      AND ge.created_at >= (v_week_start + 6)::timestamp
      AND ge.created_at < (v_week_start + 7)::timestamp
      AND DATE(ge.created_at AT TIME ZONE 'UTC') = (v_week_start + 6)
  ) INTO v_sunday_complete;

  RETURN v_saturday_complete AND v_sunday_complete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION check_weekend_warrior_eligibility(UUID, DATE) TO authenticated;
REVOKE ALL ON FUNCTION check_weekend_warrior_eligibility(UUID, DATE) FROM PUBLIC;

-- ============================================================================
-- Update get_badge_progress() to include weekend_warrior
-- ============================================================================

CREATE OR REPLACE FUNCTION get_badge_progress(p_user_id UUID)
RETURNS TABLE (
  badge_key TEXT,
  current INT,
  target INT,
  is_unlocked BOOLEAN
) AS $$
DECLARE
  v_plant_count INT := 0;
  v_total_likes INT := 0;
  v_total_followers INT := 0;
  v_diseased_plants INT := 0;
  v_watering_streak INT := 0;
  v_level INT := 1;
  v_has_early_bird BOOLEAN := false;
  v_weekend_days_complete INT := 0;
  v_weekend_unlocked BOOLEAN := false;
BEGIN
  -- Get user progress stats
  SELECT
    COALESCE(up.watering_streak, 0),
    COALESCE(up.level, 1)
  INTO v_watering_streak, v_level
  FROM user_progress up
  WHERE up.user_id = p_user_id;

  -- Get plant count from user's plants (managed entries)
  SELECT COUNT(*)
  INTO v_plant_count
  FROM plants
  WHERE user_id = p_user_id AND entry_kind = 'managed';

  -- Get total likes received from posts
  SELECT COALESCE(SUM(like_count), 0)
  INTO v_total_likes
  FROM (
    SELECT COUNT(*) as like_count
    FROM post_likes pl
    JOIN posts p ON pl.post_id = p.id
    WHERE p.author_id = p_user_id
  ) sub;

  -- Get total followers
  SELECT COUNT(*)
  INTO v_total_followers
  FROM follows
  WHERE following_id = p_user_id;

  -- Check for early bird badge (user has watered before 7am)
  SELECT EXISTS (
    SELECT 1
    FROM gamification_events ge
    WHERE ge.user_id = p_user_id
      AND ge.event_type = 'watering_completed'
      AND (ge.metadata->>'early_watering')::boolean = true
  )
  INTO v_has_early_bird;

  -- Get diseased plants identified
  SELECT COUNT(DISTINCT source_id)
  INTO v_diseased_plants
  FROM gamification_events
  WHERE user_id = p_user_id
    AND event_type = 'plant_identified'
    AND (metadata->>'is_diseased')::boolean = true;

  -- Check weekend warrior progress
  -- Count how many weekend days (Saturday/Sunday) had care events in the current week
  SELECT COUNT(DISTINCT DATE(created_at AT TIME ZONE 'UTC'))
  INTO v_weekend_days_complete
  FROM gamification_events
  WHERE user_id = p_user_id
    AND event_type IN ('watering_completed', 'reminder_completed')
    AND DATE(created_at AT TIME ZONE 'UTC') IN (
      date_trunc('week', CURRENT_DATE)::date + 5,  -- Saturday
      date_trunc('week', CURRENT_DATE)::date + 6   -- Sunday
    );

  -- Check if weekend warrior badge is unlocked
  v_weekend_unlocked := check_weekend_warrior_eligibility(p_user_id);

  -- Return progress for all badges
  RETURN QUERY
  SELECT * FROM (
    VALUES
      -- Original badges
      ('watering_streak_7', v_watering_streak, 7, v_watering_streak >= 7),
      ('watering_streak_30', v_watering_streak, 30, v_watering_streak >= 30),
      ('level_5', v_level, 5, v_level >= 5),
      ('level_10', v_level, 10, v_level >= 10),
      -- Extended badges
      ('first_plant', v_plant_count, 1, v_plant_count >= 1),
      ('plant_parent', v_plant_count, 10, v_plant_count >= 10),
      ('community_star', v_total_likes, 50, v_total_likes >= 50),
      ('early_bird', CASE WHEN v_has_early_bird THEN 1 ELSE 0 END, 1, v_has_early_bird),
      ('plant_doctor', v_diseased_plants, 5, v_diseased_plants >= 5),
      ('social_butterfly', v_total_followers, 10, v_total_followers >= 10),
      -- Weekend warrior badge
      ('weekend_warrior', v_weekend_days_complete, 2, v_weekend_unlocked)
  ) AS t(badge_key, current, target, is_unlocked);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_badge_progress(UUID) TO authenticated;
REVOKE ALL ON FUNCTION get_badge_progress(UUID) FROM PUBLIC;
