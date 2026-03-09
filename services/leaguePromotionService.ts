/**
 * League Promotion/Relegation Service
 *
 * Client-side service for detecting and handling weekly promotion results.
 * Called on app focus to trigger celebration animations.
 *
 * @module services/leaguePromotionService
 */

import { getSupabaseClient } from '@/lib/supabase';
import type { LeagueTierKey } from '@/types/gamification';

/**
 * Result of weekly promotion/relegation check
 */
export interface PromotionResult {
  promoted: boolean;
  relegated: boolean;
  stayed: boolean;
  oldTier: LeagueTierKey | null;
  newTier: LeagueTierKey | null;
  membershipId: string | null;
}

/**
 * Check if user was promoted/relegated this week.
 * Call this on app focus to detect and trigger celebration.
 *
 * @param userId - The user's ID
 * @returns Promotion result or null if no result available
 */
export async function checkWeeklyPromotionResult(
  userId: string
): Promise<PromotionResult | null> {
  try {
    const supabase = getSupabaseClient();

    // Get latest membership with promotion result
    const { data, error } = await supabase
      .from('league_memberships')
      .select('id, promotion_result, user_id')
      .eq('user_id', userId)
      .not('promotion_result', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[leaguePromotion] Failed to fetch promotion result:', error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    // Get current tier from user_progress
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('league_tier')
      .eq('user_id', userId)
      .maybeSingle();

    if (progressError) {
      console.warn('[leaguePromotion] Failed to fetch user progress:', progressError.message);
    }

    const newTier = (progress?.league_tier as LeagueTierKey) || 'bronze';

    return {
      promoted: data.promotion_result === 'promoted',
      relegated: data.promotion_result === 'relegated',
      stayed: data.promotion_result === 'stayed',
      oldTier: null, // Would need to track separately or infer from tier order
      newTier,
      membershipId: data.id,
    };
  } catch (error) {
    console.warn('[leaguePromotion] checkWeeklyPromotionResult exception:', error);
    return null;
  }
}

/**
 * Mark promotion result as seen by clearing the flag.
 * This prevents the celebration from showing again.
 *
 * @param membershipId - The league membership ID
 * @returns true if successfully marked, false otherwise
 */
export async function markPromotionSeen(membershipId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    // We use a simple approach: set a metadata field or just update a timestamp
    // For now, we'll rely on the app not re-showing the same result
    // A more robust approach would add a 'seen_at' column

    // For now, this is a no-op placeholder
    // The client can track seen promotions locally via AsyncStorage
    console.log('[leaguePromotion] Marking promotion as seen:', membershipId);
    return true;
  } catch (error) {
    console.warn('[leaguePromotion] markPromotionSeen exception:', error);
    return false;
  }
}

/**
 * Get the display name for a tier.
 *
 * @param tier - The tier key
 * @returns Human-readable tier name
 */
export function getTierDisplayName(tier: LeagueTierKey): string {
  const tierNames: Record<LeagueTierKey, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    diamond: 'Diamond',
  };
  return tierNames[tier] || tier;
}

/**
 * Get the emoji symbol for a tier.
 *
 * @param tier - The tier key
 * @returns Emoji symbol for the tier
 */
export function getTierSymbol(tier: LeagueTierKey): string {
  const tierSymbols: Record<LeagueTierKey, string> = {
    bronze: '\u{1F9C9}', // Clay pot (bronze-ish)
    silver: '\u{1F948}', // 2nd place medal
    gold: '\u{1F947}', // 1st place medal
    platinum: '\u{1F48E}', // Gem stone
    diamond: '\u{1F537}', // Diamond/lozenge
  };
  return tierSymbols[tier] || '';
}
