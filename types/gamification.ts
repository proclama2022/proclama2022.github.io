/**
 * Gamification Types
 *
 * Shared TypeScript types for XP progression, badges, and award events.
 */

// ============================================================================
// League System Types (needed early for UserProgress reference)
// ============================================================================

export type LeagueTierKey = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// ============================================================================
// Core Gamification Types
// ============================================================================

export type GamificationEventType =
  | 'watering_completed'
  | 'reminder_completed'
  | 'plant_added'
  | 'post_published'
  | 'like_received'
  | 'daily_checkin'
  | 'plant_identified'
  | 'followers_gained';

export interface GamificationAwardResult {
  awarded: boolean;
  xp_awarded: number;
  total_xp: number;
  level: number;
  xp_in_level: number;
  xp_for_next_level: number;
  watering_streak: number;
  leveled_up: boolean;
  new_badges: string[];
}

export interface UserProgress {
  user_id: string;
  level: number;
  xp_total: number;
  xp_in_level: number;
  xp_for_next_level: number;
  watering_streak: number;
  last_watering_date: string | null;
  league_tier: LeagueTierKey;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  badge_key: string;
  awarded_at: string;
  metadata: Record<string, unknown>;
  title?: string | null;
  description?: string | null;
}

export interface DailyChallengeSummary {
  challenge_key: string;
  event_type: GamificationEventType;
  target_count: number;
  xp_reward: number;
  progress_count: number;
  completed: boolean;
  challenge_date: string;
}

export interface GamificationActivityItem {
  event_type: GamificationEventType;
  xp_awarded: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface BadgeProgress {
  badge_key: string;
  current: number;
  target: number;
  is_unlocked: boolean;
}

export interface GamificationSummary {
  progress: UserProgress;
  badges: UserBadge[];
  badge_progress: BadgeProgress[];
  daily_challenges: DailyChallengeSummary[];
  recent_activity: GamificationActivityItem[];
}

// ============================================================================
// Extended League System Types
// ============================================================================

export interface LeagueTier {
  tier_key: LeagueTierKey;
  tier_order: number;
  display_name: string;
  color: string;
  symbol: string;
}

export interface LeagueCohort {
  id: string;
  tier_key: LeagueTierKey;
  week_start_date: string;
  created_at: string;
}

export interface LeagueMembership {
  id: string;
  user_id: string;
  cohort_id: string;
  xp_at_start: number;
  xp_at_end: number | null;
  final_rank: number | null;
  promotion_result: 'promoted' | 'relegated' | 'stayed' | null;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  xp_this_week: number;
  league_tier: LeagueTierKey;
  level: number;
  is_current_user: boolean;
  is_promotion_zone: boolean;
  is_relegation_zone: boolean;
}
