import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mutex } from 'async-mutex';
import { RateLimitState } from '@/types';

const RATE_LIMIT_KEY = '@plantid_rate_limit';
const DAILY_LIMIT = 5;

// Create mutex for atomic rate limit operations
const mutex = new Mutex();

/**
 * Get today's date string (YYYY-MM-DD) in LOCAL timezone
 * Using local date ensures rate limit resets at user's midnight, not UTC
 */
function getTodayString(): string {
  const now = new Date();
  // Create date in local timezone (not UTC)
  const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return localDate.toISOString().split('T')[0];
}

/**
 * Get current rate limit state
 */
async function getRateLimitState(): Promise<RateLimitState> {
  try {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading rate limit state:', error);
  }

  return {
    date: getTodayString(),
    count: 0,
  };
}

/**
 * Save rate limit state
 */
async function saveRateLimitState(state: RateLimitState): Promise<void> {
  try {
    await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving rate limit state:', error);
  }
}

/**
 * Check if user can make another identification
 * Uses mutex to prevent race conditions from concurrent API calls
 */
export async function canIdentify(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  // Wrap in mutex for atomic read-modify-write
  return await mutex.runExclusive(async () => {
    const state = await getRateLimitState();
    const today = getTodayString();

    // Reset count if it's a new day
    if (state.date !== today) {
      // Don't save here - let incrementIdentificationCount handle it
      return { allowed: true, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
    }

    const remaining = Math.max(0, DAILY_LIMIT - state.count);
    return {
      allowed: state.count < DAILY_LIMIT,
      remaining,
      limit: DAILY_LIMIT,
    };
  });
}

/**
 * Increment the identification count
 * Uses mutex to prevent race conditions from concurrent API calls
 */
export async function incrementIdentificationCount(): Promise<void> {
  // Wrap in mutex for atomic read-modify-write
  await mutex.runExclusive(async () => {
    const state = await getRateLimitState();
    const today = getTodayString();

    // Reset count if it's a new day
    if (state.date !== today) {
      await saveRateLimitState({ date: today, count: 1 });
    } else {
      await saveRateLimitState({ ...state, count: state.count + 1 });
    }
  });
}

/**
 * Reset rate limit (for testing)
 */
export async function resetRateLimit(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RATE_LIMIT_KEY);
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
}

/**
 * Get current rate limit state (for debugging/UI display)
 */
export async function getRateLimitInfo(): Promise<{ date: string; count: number; remaining: number; limit: number }> {
  return await mutex.runExclusive(async () => {
    const state = await getRateLimitState();
    const today = getTodayString();

    // Reset count if it's a new day
    if (state.date !== today) {
      return {
        date: today,
        count: 0,
        remaining: DAILY_LIMIT,
        limit: DAILY_LIMIT,
      };
    }

    return {
      date: state.date,
      count: state.count,
      remaining: Math.max(0, DAILY_LIMIT - state.count),
      limit: DAILY_LIMIT,
    };
  });
}
