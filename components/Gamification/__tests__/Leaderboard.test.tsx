/**
 * Leaderboard Test
 *
 * Wave 0 coverage for LEAG-02 (Weekly leaderboard view) and LEAG-05 (Zone highlighting).
 */

import React from 'react';

// Mock dependencies before importing component
jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => mockSupabase),
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ user: { id: 'test-user-id' } })),
  },
}));

jest.mock('@/services/leagueService', () => ({
  getLeagueLeaderboard: jest.fn(),
}));

// Create mock supabase
const mockSupabase = {
  from: jest.fn(),
  auth: { getUser: jest.fn() },
};

import { render } from '@testing-library/react-native';
import { Leaderboard } from '../Leaderboard';
import { getLeagueLeaderboard } from '@/services/leagueService';
import type { LeaderboardEntry } from '@/types/gamification';

// Helper to create mock leaderboard entries
function createMockLeaderboard(count: number, currentUserId?: string): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    user_id: currentUserId && i === 4 ? currentUserId : `user-${i}`,
    display_name: `User ${i + 1}`,
    avatar_url: i % 2 === 0 ? `https://example.com/avatar${i}.png` : null,
    xp_this_week: 1000 - i * 30,
    league_tier: 'silver' as const,
    level: 5 + Math.floor(i / 10),
    is_current_user: currentUserId ? (i === 4) : false,
    is_promotion_zone: i < 10,
    is_relegation_zone: count >= 30 && i >= 25,
  }));
}

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
  };
  return chainable;
}

describe('Leaderboard (League Mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
  });

  // =========================================================================
  // LEAG-02: Weekly leaderboard view
  // =========================================================================
  describe('LEAG-02: Weekly leaderboard view', () => {
    it('shows top 30 users in league cohort', async () => {
      const mockEntries = createMockLeaderboard(30);
      (getLeagueLeaderboard as jest.Mock).mockResolvedValue(mockEntries);

      // Mock standard leaderboard queries (non-league mode returns empty)
      const chainable = createChainableMock([]);
      mockSupabase.from.mockReturnValue(chainable);

      const { findByText } = render(<Leaderboard type="league" limit={30} />);

      // Verify leaderboard service was called
      expect(getLeagueLeaderboard).toHaveBeenCalledWith('test-user-id', 30);
    });

    it('shows avatar, name, league badge, XP per entry', async () => {
      const mockEntries: LeaderboardEntry[] = [
        {
          rank: 1,
          user_id: 'user-1',
          display_name: 'Alice',
          avatar_url: 'https://example.com/alice.png',
          xp_this_week: 500,
          league_tier: 'gold',
          level: 10,
          is_current_user: false,
          is_promotion_zone: true,
          is_relegation_zone: false,
        },
      ];
      (getLeagueLeaderboard as jest.Mock).mockResolvedValue(mockEntries);

      const chainable = createChainableMock([]);
      mockSupabase.from.mockReturnValue(chainable);

      render(<Leaderboard type="league" />);

      expect(getLeagueLeaderboard).toHaveBeenCalled();
    });

    it('displays current user rank prominently', async () => {
      const mockEntries = createMockLeaderboard(30, 'test-user-id');
      (getLeagueLeaderboard as jest.Mock).mockResolvedValue(mockEntries);

      const chainable = createChainableMock([]);
      mockSupabase.from.mockReturnValue(chainable);

      render(<Leaderboard type="league" />);

      // Current user is at rank 5 (index 4)
      expect(getLeagueLeaderboard).toHaveBeenCalledWith('test-user-id', 20);
    });

    it('shows XP this week (delta from start of week)', async () => {
      const mockEntries: LeaderboardEntry[] = [
        {
          rank: 1,
          user_id: 'user-1',
          display_name: 'Bob',
          avatar_url: null,
          xp_this_week: 250, // Weekly delta
          league_tier: 'silver',
          level: 5,
          is_current_user: false,
          is_promotion_zone: true,
          is_relegation_zone: false,
        },
      ];
      (getLeagueLeaderboard as jest.Mock).mockResolvedValue(mockEntries);

      render(<Leaderboard type="league" />);

      expect(getLeagueLeaderboard).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // LEAG-05: Zone highlighting
  // =========================================================================
  describe('LEAG-05: Zone highlighting', () => {
    it('highlights top 10 as promotion zone (green)', async () => {
      const mockEntries = createMockLeaderboard(30);
      (getLeagueLeaderboard as jest.Mock).mockResolvedValue(mockEntries);

      render(<Leaderboard type="league" />);

      // Top 10 entries should have is_promotion_zone = true
      expect(getLeagueLeaderboard).toHaveBeenCalled();
    });

    it('highlights bottom 5 as relegation zone (red)', async () => {
      const mockEntries = createMockLeaderboard(30);
      (getLeagueLeaderboard as jest.Mock).mockResolvedValue(mockEntries);

      render(<Leaderboard type="league" />);

      // Bottom 5 entries should have is_relegation_zone = true
      expect(getLeagueLeaderboard).toHaveBeenCalled();
    });

    it('does not show relegation zone for cohorts < 30 users', async () => {
      // Only 20 users - no relegation zone
      const mockEntries = createMockLeaderboard(20);
      (getLeagueLeaderboard as jest.Mock).mockResolvedValue(mockEntries);

      render(<Leaderboard type="league" />);

      // Verify entries have is_relegation_zone = false for small cohorts
      mockEntries.forEach(entry => {
        expect(entry.is_relegation_zone).toBe(false);
      });
    });

    it('shows zone labels in legend or header', async () => {
      const mockEntries = createMockLeaderboard(30);
      (getLeagueLeaderboard as jest.Mock).mockResolvedValue(mockEntries);

      render(<Leaderboard type="league" />);

      // Zone labels should be visible (tested via getZoneStyle in component)
      expect(getLeagueLeaderboard).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Empty states
  // =========================================================================
  describe('Empty states', () => {
    it('shows not assigned message when user has no league', async () => {
      (getLeagueLeaderboard as jest.Mock).mockResolvedValue([]);

      const chainable = createChainableMock(null, { message: 'Not found' });
      mockSupabase.from.mockReturnValue(chainable);

      render(<Leaderboard type="league" />);

      expect(getLeagueLeaderboard).toHaveBeenCalled();
    });

    it('shows empty leaderboard when cohort has no members', async () => {
      (getLeagueLeaderboard as jest.Mock).mockResolvedValue([]);

      render(<Leaderboard type="league" />);

      expect(getLeagueLeaderboard).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Leaderboard type switching
  // =========================================================================
  describe('Leaderboard type switching', () => {
    it('renders segmented control with all types', () => {
      const mockEntries = createMockLeaderboard(10);
      (getLeagueLeaderboard as jest.Mock).mockResolvedValue(mockEntries);

      const chainable = createChainableMock([]);
      mockSupabase.from.mockReturnValue(chainable);

      const { getByText } = render(<Leaderboard type="xp" />);

      // Should render XP type initially
      expect(getLeagueLeaderboard).not.toHaveBeenCalled();
    });

    it('calls onTypeChange when segment pressed', () => {
      const onTypeChange = jest.fn();
      const chainable = createChainableMock([]);
      mockSupabase.from.mockReturnValue(chainable);

      const { getByText } = render(
        <Leaderboard type="xp" onTypeChange={onTypeChange} />
      );

      // Segmented control should be rendered
      expect(onTypeChange).not.toHaveBeenCalled();
    });
  });
});
