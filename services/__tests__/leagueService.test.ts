/**
 * League Service Tests
 *
 * Tests for LEAG-01 (league assignment based on XP) and LEAG-06 (new users start in Bronze).
 */

import {
  assignUserToLeague,
  getUserLeagueInfo,
  getLeagueLeaderboard,
  ensureCohortMembership,
  UserLeagueInfo,
} from '../leagueService';
import type { LeaderboardEntry, LeagueTierKey } from '../../types/gamification';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => mockSupabase),
}));

// Mock auth store
jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ user: { id: 'test-user-id' } })),
  },
}));

// Create a mutable mock supabase object
const mockSupabase = {
  from: jest.fn(),
  auth: { getUser: jest.fn() },
  rpc: jest.fn(),
};

// Helper to create chainable query mock
function createChainableMock(returnValue: any, error: any = null) {
  const chainable: any = {
    select: jest.fn(() => chainable),
    eq: jest.fn(() => chainable),
    not: jest.fn(() => chainable),
    order: jest.fn(() => chainable),
    limit: jest.fn(() => chainable),
    maybeSingle: jest.fn(() => Promise.resolve({ data: returnValue, error })),
    single: jest.fn(() => Promise.resolve({ data: returnValue, error })),
    upsert: jest.fn(() => Promise.resolve({ data: returnValue, error })),
    insert: jest.fn(() => chainable),
  };
  return chainable;
}

describe('leagueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
  });

  // =========================================================================
  // LEAG-06: New user Bronze assignment
  // =========================================================================
  describe('LEAG-06: New user Bronze assignment', () => {
    it('assigns new users to Bronze league (LEAG-06)', async () => {
      // Mock: user_progress doesn't exist (new user)
      const chainable = createChainableMock(null, { code: 'PGRST116' });
      chainable.upsert = jest.fn(() => Promise.resolve({ data: null, error: null }));
      mockSupabase.from.mockReturnValue(chainable);

      const tier = await assignUserToLeague('new-user-id');

      expect(tier).toBe('bronze');
      expect(mockSupabase.from).toHaveBeenCalledWith('user_progress');
    });

    it('returns existing tier when user already has one', async () => {
      // Mock: user already has silver tier
      const chainable = createChainableMock({ league_tier: 'silver' }, null);
      mockSupabase.from.mockReturnValue(chainable);

      const tier = await assignUserToLeague('existing-user-id');

      expect(tier).toBe('silver');
    });

    it('defaults to bronze on database error', async () => {
      // Mock: database error
      const chainable = createChainableMock(null, { message: 'Connection error' });
      mockSupabase.from.mockReturnValue(chainable);

      const tier = await assignUserToLeague('error-user-id');

      expect(tier).toBe('bronze');
    });
  });

  // =========================================================================
  // LEAG-01: XP-based league assignment (via getUserLeagueInfo)
  // =========================================================================
  describe('LEAG-01: League info retrieval', () => {
    it('returns user league info with correct tier (LEAG-01)', async () => {
      // Mock user_progress
      const progressChainable = createChainableMock(
        { league_tier: 'gold', xp_total: 7500 },
        null
      );

      // Mock cohort
      const cohortChainable = createChainableMock(
        { id: 'cohort-123' },
        null
      );

      // Mock membership
      const membershipChainable = createChainableMock(
        { xp_at_start: 5000 },
        null
      );

      // Mock count query
      const countChainable = {
        select: jest.fn(() => countChainable),
        eq: jest.fn(() => countChainable),
      };

      // Mock RPC for leaderboard
      mockSupabase.rpc.mockResolvedValue({
        data: [{ user_id: 'test-user-id', rank: 5 }],
        error: null,
      });

      // Setup from mock to return different chainables
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return progressChainable;
        if (callCount === 2) return cohortChainable;
        if (callCount === 3) return membershipChainable;
        return countChainable;
      });

      const info = await getUserLeagueInfo('test-user-id');

      expect(info).not.toBeNull();
      expect(info?.tier).toBe('gold');
      expect(info?.xp_this_week).toBe(2500); // 7500 - 5000
    });

    it('returns null tier when user has no progress', async () => {
      const chainable = createChainableMock(null, { message: 'Not found' });
      mockSupabase.from.mockReturnValue(chainable);

      const info = await getUserLeagueInfo('nonexistent-user');

      expect(info).toBeNull();
    });
  });

  // =========================================================================
  // LEAG-02: Weekly leaderboard view
  // =========================================================================
  describe('getLeagueLeaderboard (LEAG-02)', () => {
    it('returns top 30 users for current week (LEAG-02)', async () => {
      const mockLeaderboardData = Array.from({ length: 30 }, (_, i) => ({
        rank: i + 1,
        user_id: `user-${i}`,
        display_name: `User ${i + 1}`,
        avatar_url: null,
        xp_this_week: 1000 - i * 30,
        league_tier: 'silver',
        level: 5 + Math.floor(i / 10),
      }));

      mockSupabase.rpc.mockResolvedValue({
        data: mockLeaderboardData,
        error: null,
      });

      const entries = await getLeagueLeaderboard('test-user-id', 30);

      expect(entries).toHaveLength(30);
      expect(entries[0].rank).toBe(1);
      expect(entries[0].is_promotion_zone).toBe(true);
      expect(entries[0].is_current_user).toBe(false);
    });

    it('shows avatar, name, league badge, XP per entry', async () => {
      const mockData = [
        {
          rank: 1,
          user_id: 'user-1',
          display_name: 'Alice',
          avatar_url: 'https://example.com/avatar.png',
          xp_this_week: 500,
          league_tier: 'gold',
          level: 10,
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const entries = await getLeagueLeaderboard('test-user-id');

      expect(entries[0].display_name).toBe('Alice');
      expect(entries[0].avatar_url).toBe('https://example.com/avatar.png');
      expect(entries[0].xp_this_week).toBe(500);
      expect(entries[0].league_tier).toBe('gold');
    });

    it('identifies current user in leaderboard', async () => {
      const mockData = [
        {
          rank: 5,
          user_id: 'test-user-id',
          display_name: 'Current User',
          avatar_url: null,
          xp_this_week: 300,
          league_tier: 'silver',
          level: 7,
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const entries = await getLeagueLeaderboard('test-user-id');

      expect(entries[0].is_current_user).toBe(true);
    });

    it('returns empty array on RPC error', async () => {
      // Mock RPC failure and manual query fallback failure
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      });

      // Mock fallback query - no user progress
      const chainable = createChainableMock(null, { message: 'Not found' });
      mockSupabase.from.mockReturnValue(chainable);

      const entries = await getLeagueLeaderboard('test-user-id');

      expect(entries).toEqual([]);
    });
  });

  // =========================================================================
  // LEAG-05: Zone highlighting
  // =========================================================================
  describe('LEAG-05: Zone highlighting', () => {
    it('marks top 10 as promotion zone (LEAG-05)', async () => {
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        rank: i + 1,
        user_id: `user-${i}`,
        display_name: `User ${i + 1}`,
        avatar_url: null,
        xp_this_week: 1000 - i * 30,
        league_tier: 'silver',
        level: 5,
      }));

      mockSupabase.rpc.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const entries = await getLeagueLeaderboard('test-user-id', 30);

      // Ranks 1-10 should be in promotion zone
      for (let i = 0; i < 10; i++) {
        expect(entries[i].is_promotion_zone).toBe(true);
        expect(entries[i].is_relegation_zone).toBe(false);
      }
    });

    it('marks bottom 5 as relegation zone (LEAG-05)', async () => {
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        rank: i + 1,
        user_id: `user-${i}`,
        display_name: `User ${i + 1}`,
        avatar_url: null,
        xp_this_week: 1000 - i * 30,
        league_tier: 'silver',
        level: 5,
      }));

      mockSupabase.rpc.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const entries = await getLeagueLeaderboard('test-user-id', 30);

      // Ranks 26-30 should be in relegation zone
      for (let i = 25; i < 30; i++) {
        expect(entries[i].is_relegation_zone).toBe(true);
        expect(entries[i].is_promotion_zone).toBe(false);
      }
    });

    it('does not mark relegation zone for small cohorts', async () => {
      // Only 20 users - no relegation zone
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        user_id: `user-${i}`,
        display_name: `User ${i + 1}`,
        avatar_url: null,
        xp_this_week: 500 - i * 20,
        league_tier: 'bronze',
        level: 2,
      }));

      mockSupabase.rpc.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const entries = await getLeagueLeaderboard('test-user-id', 30);

      // Bottom 5 should NOT be relegation zone (cohort < 30)
      expect(entries[19].is_relegation_zone).toBe(false);
    });
  });

  // =========================================================================
  // Cohort membership tests
  // =========================================================================
  describe('ensureCohortMembership', () => {
    it('returns null when user has no progress', async () => {
      const chainable = createChainableMock(null, { message: 'Not found' });
      mockSupabase.from.mockReturnValue(chainable);

      const result = await ensureCohortMembership('no-progress-user');

      expect(result).toBeNull();
    });

    it('returns existing membership when already in cohort', async () => {
      const progressChainable = createChainableMock(
        { league_tier: 'silver', xp_total: 3000 },
        null
      );

      const cohortChainable = createChainableMock(
        { id: 'cohort-123' },
        null
      );

      const existingMembership = {
        id: 'membership-1',
        user_id: 'test-user-id',
        cohort_id: 'cohort-123',
        xp_at_start: 2500,
        xp_at_end: null,
        final_rank: null,
        promotion_result: null,
        created_at: '2026-03-09T00:00:00Z',
      };

      const membershipChainable = createChainableMock(existingMembership, null);

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return progressChainable;
        if (callCount === 2) return cohortChainable;
        return membershipChainable;
      });

      const result = await ensureCohortMembership('test-user-id');

      expect(result).not.toBeNull();
      expect(result?.cohort_id).toBe('cohort-123');
      expect(result?.xp_at_start).toBe(2500);
    });
  });
});
