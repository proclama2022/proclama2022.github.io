-- Migration 008: Extended Badges System
--
-- Introduces:
-- - New event types for extended badge tracking (plant_identified, followers_gained)
-- - 6 new achievement badges: first_plant, plant_parent, community_star, early_bird, plant_doctor, social_butterfly
-- - Extended award_gamification_badges RPC with new parameters
-- - get_badge_progress RPC for client-side progress display

-- ============================================================================
-- Add New Event Types to Catalog
-- ============================================================================

INSERT INTO gamification_event_catalog (event_type, base_xp, daily_cap)
VALUES
  ('plant_identified', 15, 10),
  ('followers_gained', 0, NULL)
ON CONFLICT (event_type) DO UPDATE
SET base_xp = EXCLUDED.base_xp,
    daily_cap = EXCLUDED.daily_cap,
    is_active = true;

-- ============================================================================
-- Insert New Badges into badges_catalog
-- ============================================================================

INSERT INTO badges_catalog (badge_key, title, description)
VALUES
  ('first_plant', 'Prima Pianta', 'Identify your first plant'),
  ('plant_parent', 'Genitore di Piante', 'Add 10 plants to your collection'),
  ('community_star', 'Stella della Community', 'Receive 50 likes from the community'),
  ('early_bird', 'Mattiniero', 'Water a plant before 7am'),
  ('plant_doctor', 'Dottore delle Piante', 'Identify 5 diseased plants'),
  ('social_butterfly', 'Farfalla Sociale', 'Gain 10 followers')
ON CONFLICT (badge_key) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description;

-- ============================================================================
-- Extended Badge Awarding RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION award_gamification_badges(
  p_user_id UUID,
  p_level INT,
  p_watering_streak INT,
  p_plant_count INT DEFAULT 0,
  p_total_likes INT DEFAULT 0,
  p_total_followers INT DEFAULT 0,
  p_diseased_plants INT DEFAULT 0,
  p_early_watering BOOLEAN DEFAULT false
)
RETURNS TEXT[] AS $$
DECLARE
  v_new_badges TEXT[] := ARRAY[]::TEXT[];
BEGIN
  WITH eligible_badges AS (
    SELECT badge_key
    FROM (VALUES
      -- Original badges
      ('watering_streak_7', p_watering_streak >= 7),
      ('watering_streak_30', p_watering_streak >= 30),
      ('level_5', p_level >= 5),
      ('level_10', p_level >= 10),
      -- Extended badges
      ('first_plant', p_plant_count >= 1),
      ('plant_parent', p_plant_count >= 10),
      ('community_star', p_total_likes >= 50),
      ('early_bird', p_early_watering = true),
      ('plant_doctor', p_diseased_plants >= 5),
      ('social_butterfly', p_total_followers >= 10)
    ) AS b(badge_key, is_unlocked)
    WHERE is_unlocked
  ),
  inserted AS (
    INSERT INTO user_badges (user_id, badge_key)
    SELECT p_user_id, e.badge_key
    FROM eligible_badges e
    WHERE EXISTS (
      SELECT 1
      FROM badges_catalog bc
      WHERE bc.badge_key = e.badge_key
    )
    ON CONFLICT (user_id, badge_key) DO NOTHING
    RETURNING badge_key
  )
  SELECT COALESCE(array_agg(badge_key), ARRAY[]::TEXT[])
  INTO v_new_badges
  FROM inserted;

  RETURN v_new_badges;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION award_gamification_badges(UUID, INT, INT, INT, INT, INT, INT, BOOLEAN) TO authenticated;
REVOKE ALL ON FUNCTION award_gamification_badges(UUID, INT, INT, INT, INT, INT, INT, BOOLEAN) FROM PUBLIC;

-- ============================================================================
-- Badge Progress RPC
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
      ('social_butterfly', v_total_followers, 10, v_total_followers >= 10)
  ) AS t(badge_key, current, target, is_unlocked);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_badge_progress(UUID) TO authenticated;
REVOKE ALL ON FUNCTION get_badge_progress(UUID) FROM PUBLIC;
