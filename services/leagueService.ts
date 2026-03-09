import { getSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type {
  LeagueTierKey,
  LeagueMembership,
  LeaderboardEntry,
  UserProgress,
} from '@/types/gamification';

/**
 * User league information returned by getUserLeagueInfo
 */
export interface UserLeagueInfo {
  tier: LeagueTierKey;
  cohort_id: string | null;
  current_rank: number | null;
  xp_this_week: number;
  total_members: number;
}

/**
 * Get the current week's start date (Monday) in ISO format
 */
function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/**
 * Get current user ID from auth store or Supabase session
 */
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

/**
 * Assigns a user to a league tier if not already assigned.
 * New users are automatically assigned to Bronze league (LEAG-06).
 *
 * @param userId - The user's ID
 * @returns The user's current league tier
 */
export async function assignUserToLeague(userId: string): Promise<LeagueTierKey> {
  try {
    const supabase = getSupabaseClient();

    // Check if user already has a league tier
    const { data: progress, error: fetchError } = await supabase
      .from('user_progress')
      .select('league_tier')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.warn('[league] Failed to fetch user progress:', fetchError.message);
      return 'bronze';
    }

    // If user already has a tier, return it
    if (progress?.league_tier) {
      return progress.league_tier as LeagueTierKey;
    }

    // Ensure user_progress row exists
    const { error: upsertError } = await supabase
      .from('user_progress')
      .upsert({ user_id: userId, league_tier: 'bronze' }, { onConflict: 'user_id' });

    if (upsertError) {
      console.warn('[league] Failed to assign league tier:', upsertError.message);
      return 'bronze';
    }

    return 'bronze';
  } catch (error) {
    console.warn('[league] assignUserToLeague exception:', error);
    return 'bronze';
  }
}

/**
 * Ensures a user is a member of a cohort for the current week.
 * Creates cohort if needed, creates membership if not exists.
 *
 * @param userId - The user's ID
 * @returns The user's league membership for the current week
 */
export async function ensureCohortMembership(userId: string): Promise<LeagueMembership | null> {
  try {
    const supabase = getSupabaseClient();
    const weekStart = getWeekStartDate();

    // Get user's current tier and XP
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('league_tier, xp_total')
      .eq('user_id', userId)
      .maybeSingle();

    if (progressError || !progress) {
      console.warn('[league] Failed to fetch user progress for cohort:', progressError?.message);
      return null;
    }

    const tier = (progress.league_tier as LeagueTierKey) || 'bronze';
    const currentXp = progress.xp_total || 0;

    // Find or create cohort for current week
    const { data: existingCohort, error: cohortFindError } = await supabase
      .from('league_cohorts')
      .select('id')
      .eq('tier_key', tier)
      .eq('week_start_date', weekStart)
      .maybeSingle();

    if (cohortFindError) {
      console.warn('[league] Failed to find cohort:', cohortFindError.message);
      return null;
    }

    let cohortId: string;

    if (existingCohort) {
      cohortId = existingCohort.id;
    } else {
      // Create new cohort via RPC
      const { data: newCohortId, error: createError } = await supabase.rpc('get_or_create_current_cohort', {
        p_tier_key: tier,
        p_week_start_date: weekStart,
      });

      if (createError || !newCohortId) {
        console.warn('[league] Failed to create cohort:', createError?.message);
        return null;
      }
      cohortId = newCohortId;
    }

    // Check for existing membership
    const { data: existingMembership, error: membershipError } = await supabase
      .from('league_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)
      .maybeSingle();

    if (membershipError) {
      console.warn('[league] Failed to check membership:', membershipError.message);
      return null;
    }

    if (existingMembership) {
      return {
        id: existingMembership.id,
        user_id: existingMembership.user_id,
        cohort_id: existingMembership.cohort_id,
        xp_at_start: existingMembership.xp_at_start,
        xp_at_end: existingMembership.xp_at_end,
        final_rank: existingMembership.final_rank,
        promotion_result: existingMembership.promotion_result,
        created_at: existingMembership.created_at,
      };
    }

    // Create new membership via RPC
    const { data: membershipData, error: assignError } = await supabase.rpc('assign_user_to_league', {
      p_user_id: userId,
      p_tier_key: tier,
      p_xp_at_start: currentXp,
    });

    if (assignError) {
      console.warn('[league] Failed to create membership:', assignError.message);
      return null;
    }

    // Fetch the created membership
    const { data: newMembership, error: fetchNewError } = await supabase
      .from('league_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)
      .maybeSingle();

    if (fetchNewError || !newMembership) {
      console.warn('[league] Failed to fetch new membership:', fetchNewError?.message);
      return null;
    }

    return {
      id: newMembership.id,
      user_id: newMembership.user_id,
      cohort_id: newMembership.cohort_id,
      xp_at_start: newMembership.xp_at_start,
      xp_at_end: newMembership.xp_at_end,
      final_rank: newMembership.final_rank,
      promotion_result: newMembership.promotion_result,
      created_at: newMembership.created_at,
    };
  } catch (error) {
    console.warn('[league] ensureCohortMembership exception:', error);
    return null;
  }
}

/**
 * Gets the user's current league information including tier, rank, and XP.
 *
 * @param userId - The user's ID
 * @returns User league info or null if not in a league
 */
export async function getUserLeagueInfo(userId: string): Promise<UserLeagueInfo | null> {
  try {
    const supabase = getSupabaseClient();
    const weekStart = getWeekStartDate();

    // Get user's tier and XP
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('league_tier, xp_total')
      .eq('user_id', userId)
      .maybeSingle();

    if (progressError || !progress) {
      console.warn('[league] Failed to fetch user progress:', progressError?.message);
      return null;
    }

    const tier = (progress.league_tier as LeagueTierKey) || 'bronze';
    const currentXp = progress.xp_total || 0;

    // Find current week's cohort for user's tier
    const { data: cohort, error: cohortError } = await supabase
      .from('league_cohorts')
      .select('id')
      .eq('tier_key', tier)
      .eq('week_start_date', weekStart)
      .maybeSingle();

    if (cohortError) {
      console.warn('[league] Failed to find cohort:', cohortError.message);
    }

    if (!cohort) {
      return {
        tier,
        cohort_id: null,
        current_rank: null,
        xp_this_week: 0,
        total_members: 0,
      };
    }

    // Get user's membership in this cohort
    const { data: membership, error: membershipError } = await supabase
      .from('league_memberships')
      .select('xp_at_start')
      .eq('user_id', userId)
      .eq('cohort_id', cohort.id)
      .maybeSingle();

    if (membershipError) {
      console.warn('[league] Failed to fetch membership:', membershipError.message);
    }

    const xpAtStart = membership?.xp_at_start || 0;
    const xpThisWeek = currentXp - xpAtStart;

    // Get total members in cohort
    const { count, error: countError } = await supabase
      .from('league_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('cohort_id', cohort.id);

    if (countError) {
      console.warn('[league] Failed to count members:', countError.message);
    }

    // Calculate rank by counting members with more XP this week
    // This is a simplified approach - a full leaderboard query would be more accurate
    const { data: rankData, error: rankError } = await supabase.rpc('get_league_leaderboard', {
      p_user_id: userId,
      p_limit: 30,
    });

    let currentRank: number | null = null;
    if (!rankError && rankData) {
      const userEntry = rankData.find((entry: any) => entry.user_id === userId);
      currentRank = userEntry?.rank ?? null;
    }

    return {
      tier,
      cohort_id: cohort.id,
      current_rank: currentRank,
      xp_this_week: Math.max(0, xpThisWeek),
      total_members: count || 0,
    };
  } catch (error) {
    console.warn('[league] getUserLeagueInfo exception:', error);
    return null;
  }
}

/**
 * Gets the league leaderboard for a user's current cohort.
 * Returns top 30 entries with zone flags for promotion/relegation.
 *
 * @param userId - The user's ID
 * @param limit - Maximum entries to return (default 30)
 * @returns Array of leaderboard entries or empty array if not in a cohort
 */
export async function getLeagueLeaderboard(
  userId: string,
  limit: number = 30
): Promise<LeaderboardEntry[]> {
  try {
    const supabase = getSupabaseClient();

    // Try to use the RPC function first
    const { data, error } = await supabase.rpc('get_league_leaderboard', {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      console.warn('[league] RPC failed, falling back to manual query:', error.message);
      // Fall back to manual query
      return await getLeagueLeaderboardManual(userId, limit);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((entry: any) => ({
      rank: entry.rank,
      user_id: entry.user_id,
      display_name: entry.display_name || 'Anonymous',
      avatar_url: entry.avatar_url,
      xp_this_week: entry.xp_this_week || 0,
      league_tier: entry.league_tier as LeagueTierKey,
      level: entry.level || 1,
      is_current_user: entry.user_id === userId,
      is_promotion_zone: entry.rank <= 10,
      is_relegation_zone: entry.rank >= 26,
    }));
  } catch (error) {
    console.warn('[league] getLeagueLeaderboard exception:', error);
    return [];
  }
}

/**
 * Manual leaderboard query fallback when RPC is not available.
 */
async function getLeagueLeaderboardManual(
  userId: string,
  limit: number
): Promise<LeaderboardEntry[]> {
  try {
    const supabase = getSupabaseClient();
    const weekStart = getWeekStartDate();

    // Get user's tier
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('league_tier')
      .eq('user_id', userId)
      .maybeSingle();

    if (progressError || !progress?.league_tier) {
      return [];
    }

    const tier = progress.league_tier as LeagueTierKey;

    // Find current week's cohort
    const { data: cohort, error: cohortError } = await supabase
      .from('league_cohorts')
      .select('id')
      .eq('tier_key', tier)
      .eq('week_start_date', weekStart)
      .maybeSingle();

    if (cohortError || !cohort) {
      return [];
    }

    // Get all memberships with user data
    const { data: memberships, error: membershipsError } = await supabase
      .from('league_memberships')
      .select(
        `user_id,
        xp_at_start,
        user_progress!inner(xp_total, level, league_tier),
        profiles!inner(display_name, avatar_url)`
      )
      .eq('cohort_id', cohort.id)
      .limit(limit);

    if (membershipsError || !memberships) {
      console.warn('[league] Failed to fetch memberships:', membershipsError?.message);
      return [];
    }

    // Calculate XP this week and sort
    const entries: LeaderboardEntry[] = memberships.map((m: any) => {
      const xpTotal = m.user_progress?.xp_total || 0;
      const xpAtStart = m.xp_at_start || 0;
      return {
        user_id: m.user_id,
        display_name: m.profiles?.display_name || 'Anonymous',
        avatar_url: m.profiles?.avatar_url || null,
        xp_this_week: xpTotal - xpAtStart,
        league_tier: (m.user_progress?.league_tier as LeagueTierKey) || tier,
        level: m.user_progress?.level || 1,
        is_current_user: m.user_id === userId,
        rank: 0,
        is_promotion_zone: false,
        is_relegation_zone: false,
      };
    });

    // Sort by XP this week descending
    entries.sort((a, b) => b.xp_this_week - a.xp_this_week);

    // Assign ranks and zone flags
    const totalMembers = entries.length;
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
      entry.is_promotion_zone = entry.rank <= 10;
      entry.is_relegation_zone = totalMembers >= 30 && entry.rank >= 26;
    });

    return entries;
  } catch (error) {
    console.warn('[league] getLeagueLeaderboardManual exception:', error);
    return [];
  }
}
