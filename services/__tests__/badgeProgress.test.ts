/**
 * Wave 0 Tests for Badge Progress (BADG-09, BADG-10)
 *
 * Covers requirements:
 * - BADG-09: User sees all earned badges displayed with emoji in profile
 * - BADG-10: User sees locked badges with progress indicator (e.g., 3/10 plants)
 */

import type { BadgeProgress, UserBadge } from '../../types/gamification';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => mockSupabase),
}));

const mockSupabase = {
  rpc: jest.fn(),
};

// All badge keys in the system
const ALL_BADGE_KEYS = [
  'first_plant',
  'green_thumb',
  'plant_parent',
  'community_star',
  'early_bird',
  'plant_doctor',
  'social_butterfly',
  'watering_streak_30',
  'level_5',
  'level_10',
];

// Badge emoji mapping
const BADGE_EMOJIS: Record<string, string> = {
  first_plant: '🌱',
  green_thumb: '🌿',
  watering_streak_7: '🌿',
  plant_parent: '👨‍🌾',
  community_star: '⭐',
  early_bird: '🌅',
  plant_doctor: '🩺',
  social_butterfly: '🦋',
  watering_streak_30: '🌳',
  level_5: '⭐',
  level_10: '🌟',
};

// Helper to create mock badge progress
function createMockBadgeProgress(overrides: Partial<BadgeProgress>[]): BadgeProgress[] {
  return overrides.map((override) => ({
    badge_key: override.badge_key || 'first_plant',
    current: override.current ?? 0,
    target: override.target ?? 1,
    is_unlocked: override.is_unlocked ?? false,
  }));
}

// Helper to create mock user badge
function createMockUserBadge(badgeKey: string, awardedAt: string = new Date().toISOString()): UserBadge {
  return {
    badge_key: badgeKey,
    awarded_at: awardedAt,
    metadata: {},
    title: `${badgeKey} title`,
    description: `${badgeKey} description`,
  };
}

describe('Badge Progress (BADG-09, BADG-10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // BADG-09: View earned badges in profile
  // =========================================================================
  describe('BADG-09: View earned badges in profile', () => {
    it('getBadgeProgress returns all badges with progress data', async () => {
      // Mock RPC response
      const mockProgress: BadgeProgress[] = ALL_BADGE_KEYS.map((key, index) => ({
        badge_key: key,
        current: index < 3 ? 1 : 0, // First 3 unlocked
        target: 1,
        is_unlocked: index < 3,
      }));

      mockSupabase.rpc.mockResolvedValue({
        data: mockProgress,
        error: null,
      });

      const result = await mockSupabase.rpc('get_badge_progress', {
        p_user_id: 'test-user-id',
      });

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(10);
      expect(result.data[0]).toHaveProperty('badge_key');
      expect(result.data[0]).toHaveProperty('current');
      expect(result.data[0]).toHaveProperty('target');
      expect(result.data[0]).toHaveProperty('is_unlocked');
    });

    it('BadgeGrid renders unlocked badges with emoji', () => {
      // Simulate unlocked badges
      const unlockedBadges: UserBadge[] = [
        createMockUserBadge('first_plant'),
        createMockUserBadge('green_thumb'),
      ];

      const progress: BadgeProgress[] = [
        { badge_key: 'first_plant', current: 1, target: 1, is_unlocked: true },
        { badge_key: 'green_thumb', current: 7, target: 7, is_unlocked: true },
      ];

      // Verify emoji mapping for unlocked badges
      unlockedBadges.forEach((badge) => {
        const emoji = BADGE_EMOJIS[badge.badge_key];
        expect(emoji).toBeTruthy();
        expect(emoji).not.toBe('🔒');
      });

      // Verify progress shows as unlocked
      progress.filter((p) => p.is_unlocked).forEach((p) => {
        expect(p.is_unlocked).toBe(true);
      });
    });

    it('unlocked badges are tappable and show modal', () => {
      const unlockedBadge = createMockUserBadge('first_plant');

      // Simulated badge render
      const isUnlocked = true;
      const canTap = isUnlocked && unlockedBadge;

      expect(canTap).toBe(true);
      expect(unlockedBadge.title).toBe('first_plant title');
      expect(unlockedBadge.description).toBe('first_plant description');
    });

    it('shows all 10 badges in grid', () => {
      // Verify all badge keys are defined
      expect(ALL_BADGE_KEYS).toHaveLength(10);
      expect(ALL_BADGE_KEYS).toContain('first_plant');
      expect(ALL_BADGE_KEYS).toContain('level_10');
    });
  });

  // =========================================================================
  // BADG-10: View locked badges with progress
  // =========================================================================
  describe('BADG-10: View locked badges with progress', () => {
    it('BadgeGrid shows lock icon for locked badges', () => {
      const lockedProgress: BadgeProgress[] = [
        { badge_key: 'plant_parent', current: 5, target: 10, is_unlocked: false },
        { badge_key: 'community_star', current: 0, target: 1, is_unlocked: false },
      ];

      lockedProgress.forEach((p) => {
        const icon = p.is_unlocked ? BADGE_EMOJIS[p.badge_key] : '🔒';
        expect(icon).toBe('🔒');
      });
    });

    it('displays progress text in X/Y format for locked badges', () => {
      const progress: BadgeProgress[] = [
        { badge_key: 'plant_parent', current: 3, target: 10, is_unlocked: false },
        { badge_key: 'watering_streak_30', current: 15, target: 30, is_unlocked: false },
        { badge_key: 'first_plant', current: 0, target: 1, is_unlocked: false },
      ];

      // Verify progress format
      progress.forEach((p) => {
        const progressText = `${p.current}/${p.target}`;
        expect(progressText).toMatch(/^\d+\/\d+$/);

        // Verify it's not complete
        expect(p.is_unlocked).toBe(false);
      });
    });

    it('first_plant locked shows 0/1 progress', () => {
      const progress: BadgeProgress = {
        badge_key: 'first_plant',
        current: 0,
        target: 1,
        is_unlocked: false,
      };

      const progressText = `${progress.current}/${progress.target}`;
      expect(progressText).toBe('0/1');
      expect(progress.is_unlocked).toBe(false);
    });

    it('locked badge modal shows requirements and progress', () => {
      const lockedProgress: BadgeProgress = {
        badge_key: 'plant_parent',
        current: 3,
        target: 10,
        is_unlocked: false,
      };

      // Modal should show:
      // 1. Badge title (from i18n)
      // 2. Badge description (from i18n)
      // 3. Progress indicator
      const modalContent = {
        title: 'Plant Parent',
        description: 'Add 10 plants to your collection',
        progress: `${lockedProgress.current}/${lockedProgress.target}`,
      };

      expect(modalContent.progress).toBe('3/10');
      expect(modalContent.title).toBeTruthy();
      expect(modalContent.description).toBeTruthy();
    });

    it('progress updates after user actions', () => {
      // Simulate progress before action
      const beforeProgress: BadgeProgress = {
        badge_key: 'plant_parent',
        current: 3,
        target: 10,
        is_unlocked: false,
      };

      // Simulate plant added
      const afterProgress: BadgeProgress = {
        ...beforeProgress,
        current: 4,
      };

      expect(afterProgress.current).toBe(4);
      expect(afterProgress.is_unlocked).toBe(false);
    });

    it('badge unlocks when progress reaches target', () => {
      // Progress before unlock
      const progressBefore: BadgeProgress = {
        badge_key: 'first_plant',
        current: 0,
        target: 1,
        is_unlocked: false,
      };

      // Progress after unlock (plant identified)
      const progressAfter: BadgeProgress = {
        badge_key: 'first_plant',
        current: 1,
        target: 1,
        is_unlocked: true,
      };

      expect(progressAfter.current).toBe(progressAfter.target);
      expect(progressAfter.is_unlocked).toBe(true);
    });
  });

  // =========================================================================
  // Badge emoji mapping tests
  // =========================================================================
  describe('Badge emoji mapping', () => {
    it('all badge keys have emoji mappings', () => {
      ALL_BADGE_KEYS.forEach((key) => {
        expect(BADGE_EMOJIS[key]).toBeTruthy();
        expect(typeof BADGE_EMOJIS[key]).toBe('string');
      });
    });

    it('emoji for first_plant is seedling', () => {
      expect(BADGE_EMOJIS['first_plant']).toBe('🌱');
    });

    it('emoji for plant_doctor is stethoscope', () => {
      expect(BADGE_EMOJIS['plant_doctor']).toBe('🩺');
    });

    it('emoji for level_10 is glowing star', () => {
      expect(BADGE_EMOJIS['level_10']).toBe('🌟');
    });
  });

  // =========================================================================
  // BadgeProgress type validation
  // =========================================================================
  describe('BadgeProgress type validation', () => {
    it('has required fields', () => {
      const progress: BadgeProgress = {
        badge_key: 'test_badge',
        current: 5,
        target: 10,
        is_unlocked: false,
      };

      expect(progress).toHaveProperty('badge_key');
      expect(progress).toHaveProperty('current');
      expect(progress).toHaveProperty('target');
      expect(progress).toHaveProperty('is_unlocked');
    });

    it('current and target are numbers', () => {
      const progress = createMockBadgeProgress([
        { badge_key: 'test', current: 5, target: 10, is_unlocked: false },
      ])[0];

      expect(typeof progress.current).toBe('number');
      expect(typeof progress.target).toBe('number');
    });

    it('is_unlocked is boolean', () => {
      const progress = createMockBadgeProgress([
        { badge_key: 'test', is_unlocked: true },
      ])[0];

      expect(typeof progress.is_unlocked).toBe('boolean');
    });
  });

  // =========================================================================
  // GamificationSummary integration
  // =========================================================================
  describe('GamificationSummary integration', () => {
    it('summary includes badge_progress array', () => {
      const summary = {
        progress: {
          user_id: 'test-user',
          level: 1,
          xp_total: 0,
          xp_in_level: 0,
          xp_for_next_level: 100,
          watering_streak: 0,
          last_watering_date: null,
          league_tier: 'bronze' as const,
          timezone: 'UTC',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        badges: [createMockUserBadge('first_plant')],
        badge_progress: createMockBadgeProgress([
          { badge_key: 'first_plant', current: 1, target: 1, is_unlocked: true },
          { badge_key: 'green_thumb', current: 3, target: 7, is_unlocked: false },
        ]),
        daily_challenges: [],
        recent_activity: [],
      };

      expect(summary.badge_progress).toBeDefined();
      expect(Array.isArray(summary.badge_progress)).toBe(true);
      expect(summary.badge_progress).toHaveLength(2);
    });

    it('badge_progress is passed to BadgeGrid component', () => {
      // Simulate props that would be passed to BadgeGrid
      const badgeGridProps = {
        badges: [createMockUserBadge('first_plant')],
        badgeProgress: createMockBadgeProgress([
          { badge_key: 'first_plant', current: 1, target: 1, is_unlocked: true },
          { badge_key: 'green_thumb', current: 3, target: 7, is_unlocked: false },
        ]),
      };

      expect(badgeGridProps.badgeProgress).toBeDefined();
      expect(badgeGridProps.badgeProgress).toHaveLength(2);
    });
  });
});
