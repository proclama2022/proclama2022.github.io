import { getSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import type {
  BadgeProgress,
  DailyChallengeSummary,
  GamificationActivityItem,
  GamificationAwardResult,
  GamificationEventType,
  GamificationSummary,
  UserBadge,
  UserProgress,
} from '@/types/gamification';

const DEFAULT_PROGRESS = {
  level: 1,
  xp_total: 0,
  xp_in_level: 0,
  xp_for_next_level: 100,
  watering_streak: 0,
  last_watering_date: null,
  streak_freeze_remaining: 1,
} as const;

function getUtcDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

async function getCurrentUserId(): Promise<string | null> {
  const authUser = useAuthStore.getState().user;
  if (authUser?.id) {
    return authUser.id;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

function normalizeAwardResult(raw: any): GamificationAwardResult | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  return {
    awarded: Boolean(raw.awarded),
    xp_awarded: Number(raw.xp_awarded ?? 0),
    total_xp: Number(raw.total_xp ?? 0),
    level: Number(raw.level ?? 1),
    xp_in_level: Number(raw.xp_in_level ?? 0),
    xp_for_next_level: Number(raw.xp_for_next_level ?? 100),
    watering_streak: Number(raw.watering_streak ?? 0),
    streak_freeze_remaining: Number(raw.streak_freeze_remaining ?? 1),
    leveled_up: Boolean(raw.leveled_up),
    new_badges: Array.isArray(raw.new_badges) ? raw.new_badges : [],
  };
}

function normalizeChallengeSummary(catalogRows: any[], progressRows: any[]): DailyChallengeSummary[] {
  const progressByKey = new Map(
    (progressRows ?? []).map((item: any) => [item.challenge_key, item])
  );

  return (catalogRows ?? []).map((challenge: any) => {
    const progress = progressByKey.get(challenge.challenge_key);
    return {
      challenge_key: challenge.challenge_key,
      event_type: challenge.event_type,
      target_count: Number(challenge.target_count ?? 0),
      xp_reward: Number(challenge.xp_reward ?? 0),
      progress_count: Number(progress?.progress_count ?? 0),
      completed: Boolean(progress?.completed ?? false),
      challenge_date: progress?.challenge_date ?? getUtcDateKey(),
    };
  });
}

function normalizeActivity(rows: any[]): GamificationActivityItem[] {
  return (rows ?? []).map((item: any) => ({
    event_type: item.event_type,
    xp_awarded: Number(item.xp_awarded ?? 0),
    created_at: item.created_at,
    metadata: (item.metadata ?? {}) as Record<string, unknown>,
  }));
}

function normalizeBadgeProgress(rows: any[]): BadgeProgress[] {
  return (rows ?? []).map((item: any) => ({
    badge_key: String(item.badge_key ?? ''),
    current: Number(item.current ?? 0),
    target: Number(item.target ?? 1),
    is_unlocked: Boolean(item.is_unlocked ?? false),
  }));
}

function maybeNotifyAward(result: GamificationAwardResult | null) {
  if (!result || !result.awarded) {
    return;
  }

  if (result.xp_awarded <= 0 && !result.leveled_up && result.new_badges.length === 0) {
    return;
  }

  useGamificationStore.getState().enqueueAwardResult(result);
}

/**
 * Awards a gamification event through Supabase RPC.
 *
 * Returns null when user is not authenticated or when the RPC fails.
 */
export async function awardGamificationEvent(
  eventType: GamificationEventType,
  sourceId: string,
  metadata: Record<string, unknown> = {}
): Promise<GamificationAwardResult | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('award_event', {
      p_event_type: eventType,
      p_source_id: sourceId,
      p_metadata: metadata,
    });

    if (error) {
      console.warn('[gamification] Failed to award event:', error.message);
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    const result = normalizeAwardResult(row);
    maybeNotifyAward(result);
    return result;
  } catch (error) {
    console.warn('[gamification] RPC exception:', error);
    return null;
  }
}

/**
 * Fetches badge progress for the current user.
 * Returns progress for all badges (unlocked and locked).
 */
export async function getBadgeProgress(): Promise<BadgeProgress[] | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_badge_progress', {
      p_user_id: userId,
    });

    if (error) {
      console.warn('[gamification] Failed to fetch badge progress:', error.message);
      return null;
    }

    return normalizeBadgeProgress(data);
  } catch (error) {
    console.warn('[gamification] Badge progress exception:', error);
    return null;
  }
}

/**
 * Returns current user gamification summary (progress + badges + daily challenges + recent activity).
 */
export async function getUserGamificationSummary(): Promise<GamificationSummary | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  try {
    const supabase = getSupabaseClient();
    const todayKey = getUtcDateKey();

    const { error: upsertError } = await supabase
      .from('user_progress')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });

    if (upsertError) {
      console.warn('[gamification] Failed to ensure user_progress row:', upsertError.message);
    }

    const [
      progressResponse,
      badgeResponse,
      dailyChallengeCatalogResponse,
      challengeProgressResponse,
      activityResponse,
      badgeProgressResponse,
    ] = await Promise.all([
      supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_badges')
        .select('badge_key, awarded_at, metadata, badges_catalog(title, description)')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false }),
      supabase
        .from('daily_challenges')
        .select('challenge_key, event_type, target_count, xp_reward')
        .eq('is_active', true)
        .order('challenge_key', { ascending: true }),
      supabase
        .from('challenge_progress')
        .select('challenge_key, challenge_date, progress_count, completed')
        .eq('user_id', userId)
        .eq('challenge_date', todayKey),
      supabase
        .from('gamification_events')
        .select('event_type, xp_awarded, created_at, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.rpc('get_badge_progress', { p_user_id: userId }),
    ]);

    if (progressResponse.error) {
      console.warn('[gamification] Failed to fetch user progress:', progressResponse.error.message);
      return null;
    }

    if (badgeResponse.error) {
      console.warn('[gamification] Failed to fetch badges:', badgeResponse.error.message);
      return null;
    }

    if (dailyChallengeCatalogResponse.error) {
      console.warn('[gamification] Failed to fetch daily challenge catalog:', dailyChallengeCatalogResponse.error.message);
      return null;
    }

    if (challengeProgressResponse.error) {
      console.warn('[gamification] Failed to fetch challenge progress:', challengeProgressResponse.error.message);
      return null;
    }

    if (activityResponse.error) {
      console.warn('[gamification] Failed to fetch activity:', activityResponse.error.message);
      return null;
    }

    const progress: UserProgress = progressResponse.data
      ? {
          user_id: progressResponse.data.user_id,
          level: progressResponse.data.level,
          xp_total: progressResponse.data.xp_total,
          xp_in_level: progressResponse.data.xp_in_level,
          xp_for_next_level: progressResponse.data.xp_for_next_level,
          watering_streak: progressResponse.data.watering_streak,
          last_watering_date: progressResponse.data.last_watering_date,
          league_tier: progressResponse.data.league_tier ?? 'bronze',
          timezone: progressResponse.data.timezone ?? 'UTC',
          streak_freeze_remaining: progressResponse.data.streak_freeze_remaining ?? 1,
          created_at: progressResponse.data.created_at,
          updated_at: progressResponse.data.updated_at,
        }
      : {
          user_id: userId,
          ...DEFAULT_PROGRESS,
          league_tier: 'bronze',
          timezone: 'UTC',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

    const badges: UserBadge[] = (badgeResponse.data ?? []).map((badge: any) => ({
      badge_key: badge.badge_key,
      awarded_at: badge.awarded_at,
      metadata: (badge.metadata ?? {}) as Record<string, unknown>,
      title: Array.isArray(badge.badges_catalog)
        ? badge.badges_catalog[0]?.title ?? null
        : badge.badges_catalog?.title ?? null,
      description: Array.isArray(badge.badges_catalog)
        ? badge.badges_catalog[0]?.description ?? null
        : badge.badges_catalog?.description ?? null,
    }));

    return {
      progress,
      badges,
      badge_progress: normalizeBadgeProgress(badgeProgressResponse.data ?? []),
      daily_challenges: normalizeChallengeSummary(
        dailyChallengeCatalogResponse.data ?? [],
        challengeProgressResponse.data ?? []
      ),
      recent_activity: normalizeActivity(activityResponse.data ?? []),
    };
  } catch (error) {
    console.warn('[gamification] Summary exception:', error);
    return null;
  }
}

export async function awardWateringEvent(
  plantId: string,
  eventDateIso: string,
  wateringTime?: Date
): Promise<GamificationAwardResult | null> {
  // Check for early bird badge (watering before 7am)
  let earlyWatering = false;
  if (wateringTime) {
    const hour = wateringTime.getHours();
    earlyWatering = hour < 7;
  }

  return awardGamificationEvent('watering_completed', `watering:${plantId}:${eventDateIso}`, {
    plant_id: plantId,
    event_date: eventDateIso,
    early_watering: earlyWatering,
  });
}

export async function awardReminderCompletedEvent(
  plantId: string,
  reminderId: string,
  reminderDateIso: string
): Promise<GamificationAwardResult | null> {
  return awardGamificationEvent(
    'reminder_completed',
    `reminder:${plantId}:${reminderId}:${reminderDateIso}`,
    {
      plant_id: plantId,
      reminder_id: reminderId,
      reminder_date: reminderDateIso,
    }
  );
}

export async function awardPlantAddedEvent(
  plantId: string,
  entryKind: 'managed' | 'sighting'
): Promise<GamificationAwardResult | null> {
  return awardGamificationEvent('plant_added', `plant:${plantId}`, {
    plant_id: plantId,
    entry_kind: entryKind,
  });
}

export async function awardDailyCheckinEvent(date: Date = new Date()): Promise<GamificationAwardResult | null> {
  const utcDateKey = getUtcDateKey(date);
  return awardGamificationEvent('daily_checkin', `daily-checkin:${utcDateKey}`, {
    checkin_date: utcDateKey,
  });
}

/**
 * Awards a plant identification event.
 * Used after a successful PlantNet identification.
 * @param plantId - ID of the identified plant
 * @param hasDisease - Whether the plant appears diseased (for Plant Doctor badge)
 */
export async function awardPlantIdentifiedEvent(
  plantId: string,
  hasDisease: boolean = false
): Promise<GamificationAwardResult | null> {
  return awardGamificationEvent('plant_identified', `plant-identified:${plantId}`, {
    plant_id: plantId,
    has_disease: hasDisease,
  });
}

/**
 * Awards a followers gained event.
 * Used after a user gains a new follower.
 * @param followedUserId - ID of the user who was followed
 * @param totalFollowers - Total follower count after the new follow
 */
export async function awardFollowersGainedEvent(
  followedUserId: string,
  totalFollowers: number
): Promise<GamificationAwardResult | null> {
  return awardGamificationEvent(
    'followers_gained',
    `followers-gained:${followedUserId}:${Date.now()}`,
    {
      followed_user_id: followedUserId,
      total_followers: totalFollowers,
    }
  );
}
