import { create } from 'zustand';

import type { GamificationAwardResult } from '@/types/gamification';

export interface GamificationToastItem {
  id: string;
  kind: 'xp' | 'level' | 'badge' | 'league_promotion' | 'league_relegation' | 'title';
  message: string;
  metadata?: { newTier?: string; oldTier?: string };
  emoji?: string;
}

/**
 * Badge emoji mapping for toast notifications
 */
const BADGE_EMOJIS: Record<string, string> = {
  watering_streak_7: '🌿',
  watering_streak_30: '🌳',
  level_5: '⭐',
  level_10: '🌟',
  first_plant: '🌱',
  green_thumb: '🌿',
  plant_parent: '👨‍🌾',
  community_star: '⭐',
  early_bird: '🌅',
  plant_doctor: '🩺',
  social_butterfly: '🦋',
};

interface GamificationState {
  currentToast: GamificationToastItem | null;
  queue: GamificationToastItem[];
  enqueueAwardResult: (result: GamificationAwardResult) => void;
  enqueueLeaguePromotion: (newTier: string, oldTier?: string) => void;
  enqueueLeagueRelegation: (newTier: string, oldTier?: string) => void;
  enqueueTitleChange: (titleKey: string, titleEmoji: string) => void;
  dismissToast: () => void;
  reset: () => void;
}

function createId(prefix: string): string {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function createToastQueue(result: GamificationAwardResult): GamificationToastItem[] {
  const items: GamificationToastItem[] = [];

  if (result.xp_awarded > 0) {
    items.push({
      id: createId('xp'),
      kind: 'xp',
      message: `+${result.xp_awarded} XP`,
    });
  }

  if (result.leveled_up) {
    items.push({
      id: createId('level'),
      kind: 'level',
      message: `Level ${result.level}`,
    });
  }

  result.new_badges.forEach((badgeKey) => {
    const emoji = BADGE_EMOJIS[badgeKey];
    items.push({
      id: createId('badge'),
      kind: 'badge',
      message: badgeKey,
      emoji,
    });
  });

  return items;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  currentToast: null,
  queue: [],
  enqueueAwardResult: (result) => {
    const items = createToastQueue(result);
    if (items.length === 0) {
      return;
    }

    const { currentToast, queue } = get();
    if (!currentToast) {
      const [first, ...rest] = items;
      set({ currentToast: first, queue: [...queue, ...rest] });
      return;
    }

    set({ queue: [...queue, ...items] });
  },
  dismissToast: () => {
    const { queue } = get();
    if (queue.length === 0) {
      set({ currentToast: null });
      return;
    }

    const [nextToast, ...rest] = queue;
    set({ currentToast: nextToast, queue: rest });
  },
  reset: () => set({ currentToast: null, queue: [] }),
  enqueueLeaguePromotion: (newTier: string, oldTier?: string) => {
    const item: GamificationToastItem = {
      id: createId('league_promotion'),
      kind: 'league_promotion',
      message: `Promoted to ${newTier}!`,
      metadata: { newTier, oldTier },
    };

    const { currentToast, queue } = get();
    if (!currentToast) {
      set({ currentToast: item, queue });
    } else {
      set({ queue: [...queue, item] });
    }
  },
  enqueueLeagueRelegation: (newTier: string, oldTier?: string) => {
    const item: GamificationToastItem = {
      id: createId('league_relegation'),
      kind: 'league_relegation',
      message: `Moved to ${newTier}`,
      metadata: { newTier, oldTier },
    };

    const { currentToast, queue } = get();
    if (!currentToast) {
      set({ currentToast: item, queue });
    } else {
      set({ queue: [...queue, item] });
    }
  },
  enqueueTitleChange: (titleKey: string, titleEmoji: string) => {
    const item: GamificationToastItem = {
      id: createId('title'),
      kind: 'title',
      message: titleKey,
      emoji: titleEmoji,
    };

    const { currentToast, queue } = get();
    if (!currentToast) {
      set({ currentToast: item, queue });
    } else {
      set({ queue: [...queue, item] });
    }
  },
}));
