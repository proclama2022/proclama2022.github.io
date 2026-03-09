# Architecture Patterns: Gamification 2.0 (v3.0)

**Domain:** Gamification enhancements for plant care app
**Researched:** 2026-03-09
**Mode:** Ecosystem Research

---

## Executive Summary

L'architettura gamification esistente e solida e ben strutturata con:
- **Server-side logic** in Supabase RPC (`award_event`)
- **Client-side state** in Zustand (`gamificationStore`)
- **UI components** modulari in `components/Gamification/`

Per v3.0, l'architettura richiede **estensioni minime**:
1. Nuova RPC `get_weekly_leaderboard()` per leaderboard settimanale
2. Estensione badge catalog con nuovi achievement
3. Nuovo componente `CelebrationOverlay` per animazioni
4. Estensione store per cache leaderboard e celebration state

---

## Existing Architecture

### Component Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Gamification │  │ Leaderboard  │  │ GamificationToast    │  │
│  │ Screen       │  │ Component    │  │ Host                 │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                  │                    │                │
│         ▼                  ▼                    ▼                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ LevelProgress│  │ BadgeGrid    │  │ DailyChallenges      │  │
│  │ Card         │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      State Layer (Zustand)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ gamificationStore                                        │   │
│  │ - currentToast: GamificationToastItem | null             │   │
│  │ - queue: GamificationToastItem[]                         │   │
│  │ - enqueueAwardResult(result)                             │   │
│  │ - dismissToast()                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ gamificationService.ts                                   │   │
│  │ - awardGamificationEvent(eventType, sourceId, metadata)  │   │
│  │ - getUserGamificationSummary()                           │   │
│  │ - awardWateringEvent(plantId, date)                      │   │
│  │ - awardReminderCompletedEvent(plantId, reminderId, date) │   │
│  │ - awardPlantAddedEvent(plantId, entryKind)               │   │
│  │ - awardDailyCheckinEvent(date)                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Supabase)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Tables:                                                  │   │
│  │ - gamification_event_catalog (event definitions)         │   │
│  │ - user_progress (level, XP, streak)                      │   │
│  │ - gamification_events (immutable event log)              │   │
│  │ - badges_catalog (badge definitions)                     │   │
│  │ - user_badges (awarded badges)                           │   │
│  │ - daily_challenges (challenge definitions)               │   │
│  │ - challenge_progress (per-user daily progress)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ RPC Functions:                                           │   │
│  │ - award_event() - Main awarding logic                    │   │
│  │ - award_event_for_user() - Server-side hook version      │   │
│  │ - award_gamification_badges() - Badge unlock logic       │   │
│  │ - get_xp_for_next_level() - XP curve helper              │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Triggers:                                                │   │
│  │ - on_post_created_award_gamification                     │   │
│  │ - on_like_received_award_gamification                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Event Awarding Flow (Existing)

```
User Action (watering, post, etc.)
    │
    ▼
Service Layer
    │ awardWateringEvent(plantId, date)
    │ → awardGamificationEvent('watering_completed', sourceId, metadata)
    ▼
Supabase RPC: award_event()
    │
    ├─► Check idempotency (source_id already exists?)
    │       └─► YES: Return current state, no changes
    │
    ├─► Check daily cap (events today < cap?)
    │       └─► NO: XP = 0, but still log event
    │
    ├─► Update daily challenge progress
    │       └─► If challenge completed: bonus XP
    │
    ├─► Calculate total XP delta
    │
    ├─► Update streak (if watering event)
    │       └─► Consecutive day: streak++
    │       └─► Gap: streak = 1
    │
    ├─► Update user_progress
    │       ├─► xp_total += delta
    │       ├─► xp_in_level += delta
    │       ├─► Check level up (xp_in_level >= xp_for_next_level)
    │       │       └─► level++, recalculate xp_for_next_level
    │       └─► Update watering_streak
    │
    ├─► Check badge unlocks
    │       └─► award_gamification_badges(userId, level, streak)
    │
    └─► Return result
            ├─► awarded: boolean
            ├─► xp_awarded: number
            ├─► total_xp: number
            ├─► level: number
            ├─► leveled_up: boolean
            └─► new_badges: string[]
    │
    ▼
Service Layer
    │ normalizeAwardResult(raw)
    │ maybeNotifyAward(result)
    ▼
Zustand Store
    │ enqueueAwardResult(result)
    │ → Create toast items for XP, level, badges
    │ → Queue them for sequential display
    ▼
UI: GamificationToastHost
    │ Display currentToast
    │ Auto-dismiss after 2.6s
    │ Show next in queue
```

### Summary Fetch Flow (Existing)

```
Screen Focus / Pull to Refresh
    │
    ▼
Service: getUserGamificationSummary()
    │
    ├─► Ensure user_progress row exists (upsert)
    │
    └─► Parallel queries:
            ├─► user_progress (level, XP, streak)
            ├─► user_badges + badges_catalog (join for titles)
            ├─► daily_challenges (active challenges)
            ├─► challenge_progress (today's progress)
            └─► gamification_events (recent activity, limit 8)
    │
    ▼
Normalize and return GamificationSummary
    │
    ▼
UI: Render LevelProgressCard, BadgeGrid, DailyChallenges, Activity
```

---

## Recommended Architecture for v3.0

### New Components

```
components/Gamification/
├── LevelProgressCard.tsx      (existing - add level title)
├── BadgeGrid.tsx              (existing - add progress tracking)
├── DailyChallenges.tsx        (existing)
├── GamificationStats.tsx      (existing)
├── Leaderboard.tsx            (existing - add weekly tab)
├── index.ts                   (exports)
│
├── CelebrationOverlay.tsx     (NEW - confetti + haptics)
├── BadgeProgress.tsx          (NEW - progress toward badge)
├── WeeklyLeaderboardTab.tsx   (NEW - weekly view)
└── LevelTitleBadge.tsx        (NEW - displays title + icon)
```

### New Types

```typescript
// types/gamification.ts additions

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  xp_total: number;
  watering_streak: number;
  weekly_events: number;
  weekly_rank: number;
}

export interface AchievementProgress {
  badge_key: string;
  title: string | null;
  description: string | null;
  current_progress: number;
  target_progress: number;
  completed: boolean;
}

export interface LevelTitle {
  title: string;
  icon: string;
  minLevel: number;
  maxLevel: number;
}

export type CelebrationType = 'level_up' | 'badge_unlock' | 'challenge_complete' | 'streak_milestone';
```

### Store Extensions

```typescript
// stores/gamificationStore.ts additions

interface GamificationState {
  // Existing
  currentToast: GamificationToastItem | null;
  queue: GamificationToastItem[];
  enqueueAwardResult: (result: GamificationAwardResult) => void;
  dismissToast: () => void;
  reset: () => void;

  // NEW for v3.0
  leaderboardCache: LeaderboardEntry[] | null;
  leaderboardFetchedAt: number | null;
  celebrationType: CelebrationType | null;

  // NEW actions
  fetchLeaderboard: () => Promise<void>;
  triggerCelebration: (type: CelebrationType) => void;
  clearCelebration: () => void;
}
```

### Service Extensions

```typescript
// services/gamificationService.ts additions

// Fetch weekly leaderboard
export async function getWeeklyLeaderboard(limit?: number): Promise<LeaderboardEntry[] | null>;

// Get user's current weekly rank
export async function getUserWeeklyRank(userId: string): Promise<number | null>;

// Get progress toward all badges
export async function getAchievementProgress(userId: string): Promise<AchievementProgress[]>;
```

---

## Supabase Schema Additions

### Migration 007: Weekly Leaderboard Support

```sql
-- Migration 007: Weekly leaderboard and extended badges for v3.0
-- Creates: weekly_leaderboard view, get_weekly_leaderboard RPC, extended badge catalog

-- ============================================================================
-- Weekly Leaderboard View
-- ============================================================================

CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT
  up.user_id,
  p.display_name,
  p.avatar_url,
  up.level,
  up.xp_total,
  up.watering_streak,
  COUNT(ge.id) FILTER (
    WHERE ge.occurred_at >= date_trunc('week', now())
  ) AS weekly_events,
  RANK() OVER (
    ORDER BY
      COUNT(ge.id) FILTER (WHERE ge.occurred_at >= date_trunc('week', now())) DESC,
      up.xp_total DESC
  ) AS weekly_rank
FROM user_progress up
JOIN profiles p ON p.id = up.user_id
LEFT JOIN gamification_events ge ON ge.user_id = up.user_id
GROUP BY up.user_id, p.display_name, p.avatar_url, up.level, up.xp_total, up.watering_streak;

-- ============================================================================
-- Weekly Leaderboard RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION get_weekly_leaderboard(p_limit INT DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  level INT,
  xp_total INT,
  watering_streak INT,
  weekly_events BIGINT,
  weekly_rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM weekly_leaderboard
  ORDER BY weekly_rank
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_weekly_leaderboard(INT) TO authenticated;
REVOKE ALL ON FUNCTION get_weekly_leaderboard(INT) FROM PUBLIC;

-- ============================================================================
-- Extended Badge Catalog
-- ============================================================================

INSERT INTO badges_catalog (badge_key, title, description) VALUES
  ('first_plant', 'First Plant', 'Add your first plant to the collection'),
  ('green_thumb', 'Green Thumb', 'Water all your plants in a single day'),
  ('community_star', 'Community Star', 'Receive 50 likes on your posts'),
  ('identification_master', 'Identification Master', 'Identify 100 plants'),
  ('weekly_champion', 'Weekly Champion', 'Reach top 3 on the weekly leaderboard'),
  ('streak_warrior', 'Streak Warrior', 'Maintain a 14-day watering streak'),
  ('early_bird', 'Early Bird', 'Check in 7 days in a row'),
  ('post_master', 'Post Master', 'Publish 10 community posts')
ON CONFLICT (badge_key) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description;

-- ============================================================================
-- Extended Badge Unlock Logic
-- ============================================================================

CREATE OR REPLACE FUNCTION award_gamification_badges_v2(
  p_user_id UUID,
  p_level INT,
  p_watering_streak INT,
  p_plants_count INT DEFAULT 0,
  p_likes_received INT DEFAULT 0,
  p_posts_count INT DEFAULT 0,
  p_identifications INT DEFAULT 0
)
RETURNS TEXT[] AS $$
DECLARE
  v_new_badges TEXT[] := ARRAY[]::TEXT[];
BEGIN
  WITH eligible_badges AS (
    SELECT badge_key
    FROM (VALUES
      -- Streak badges
      ('watering_streak_7', p_watering_streak >= 7),
      ('watering_streak_30', p_watering_streak >= 30),
      ('streak_warrior', p_watering_streak >= 14),
      -- Level badges
      ('level_5', p_level >= 5),
      ('level_10', p_level >= 10),
      -- Plant badges
      ('first_plant', p_plants_count >= 1),
      ('identification_master', p_identifications >= 100),
      -- Community badges
      ('community_star', p_likes_received >= 50),
      ('post_master', p_posts_count >= 10)
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

GRANT EXECUTE ON FUNCTION award_gamification_badges_v2(UUID, INT, INT, INT, INT, INT, INT) TO authenticated;
REVOKE ALL ON FUNCTION award_gamification_badges_v2(UUID, INT, INT, INT, INT, INT, INT) FROM PUBLIC;

-- ============================================================================
-- Achievement Progress RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION get_achievement_progress(p_user_id UUID)
RETURNS TABLE (
  badge_key TEXT,
  title TEXT,
  description TEXT,
  current_progress INT,
  target_progress INT,
  completed BOOLEAN
) AS $$
DECLARE
  v_user_progress RECORD;
BEGIN
  -- Get user's current stats
  SELECT level, watering_streak
  INTO v_user_progress
  FROM user_progress
  WHERE user_id = p_user_id;

  IF v_user_progress IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    bc.badge_key,
    bc.title,
    bc.description,
    CASE bc.badge_key
      WHEN 'watering_streak_7' THEN LEAST(v_user_progress.watering_streak, 7)
      WHEN 'watering_streak_30' THEN LEAST(v_user_progress.watering_streak, 30)
      WHEN 'streak_warrior' THEN LEAST(v_user_progress.watering_streak, 14)
      WHEN 'level_5' THEN LEAST(v_user_progress.level, 5)
      WHEN 'level_10' THEN LEAST(v_user_progress.level, 10)
      ELSE 0
    END AS current_progress,
    CASE bc.badge_key
      WHEN 'watering_streak_7' THEN 7
      WHEN 'watering_streak_30' THEN 30
      WHEN 'streak_warrior' THEN 14
      WHEN 'level_5' THEN 5
      WHEN 'level_10' THEN 10
      ELSE 1
    END AS target_progress,
    EXISTS (
      SELECT 1 FROM user_badges ub
      WHERE ub.user_id = p_user_id AND ub.badge_key = bc.badge_key
    ) AS completed
  FROM badges_catalog bc
  WHERE bc.badge_key IN (
    'watering_streak_7', 'watering_streak_30', 'streak_warrior',
    'level_5', 'level_10', 'first_plant', 'green_thumb'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_achievement_progress(UUID) TO authenticated;
REVOKE ALL ON FUNCTION get_achievement_progress(UUID) FROM PUBLIC;
```

---

## Integration Points

### 1. GamificationStore Integration

```typescript
// stores/gamificationStore.ts - Extended implementation

import { create } from 'zustand';
import type { GamificationAwardResult, LeaderboardEntry, CelebrationType } from '@/types/gamification';
import { getWeeklyLeaderboard } from '@/services/gamificationService';

export interface GamificationToastItem {
  id: string;
  kind: 'xp' | 'level' | 'badge';
  message: string;
}

interface GamificationState {
  // Existing toast queue
  currentToast: GamificationToastItem | null;
  queue: GamificationToastItem[];
  enqueueAwardResult: (result: GamificationAwardResult) => void;
  dismissToast: () => void;
  reset: () => void;

  // NEW: Leaderboard cache
  leaderboardCache: LeaderboardEntry[] | null;
  leaderboardFetchedAt: number | null;
  fetchLeaderboard: () => Promise<void>;

  // NEW: Celebration state
  celebrationType: CelebrationType | null;
  triggerCelebration: (type: CelebrationType) => void;
  clearCelebration: () => void;
}

const LEADERBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useGamificationStore = create<GamificationState>((set, get) => ({
  // ... existing toast logic ...

  // Leaderboard caching
  leaderboardCache: null,
  leaderboardFetchedAt: null,

  fetchLeaderboard: async () => {
    const { leaderboardFetchedAt } = get();
    const now = Date.now();

    // Use cache if fresh
    if (leaderboardFetchedAt && now - leaderboardFetchedAt < LEADERBOARD_CACHE_TTL) {
      return;
    }

    const data = await getWeeklyLeaderboard(50);
    set({
      leaderboardCache: data,
      leaderboardFetchedAt: now
    });
  },

  // Celebration state
  celebrationType: null,

  triggerCelebration: (type) => set({ celebrationType: type }),

  clearCelebration: () => set({ celebrationType: null }),
}));
```

### 2. CelebrationOverlay Component

```typescript
// components/Gamification/CelebrationOverlay.tsx

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';

import { useGamificationStore } from '@/stores/gamificationStore';

export function CelebrationOverlay() {
  const celebrationType = useGamificationStore((s) => s.celebrationType);
  const clearCelebration = useGamificationStore((s) => s.clearCelebration);
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    if (celebrationType) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      confettiRef.current?.start();
    }
  }, [celebrationType]);

  if (!celebrationType) return null;

  const confettiCount = celebrationType === 'level_up' ? 200 :
                        celebrationType === 'badge_unlock' ? 150 : 100;

  return (
    <View style={styles.container} pointerEvents="none">
      <ConfettiCannon
        ref={confettiRef}
        count={confettiCount}
        origin={{ x: -10, y: 0 }}
        fadeOut
        autoStart={false}
        onAnimationEnd={clearCelebration}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
```

### 3. Level Title Helper

```typescript
// utils/levelTitles.ts

export interface LevelTitle {
  title: string;
  icon: string;
  minLevel: number;
  maxLevel: number;
}

export const LEVEL_TITLES: LevelTitle[] = [
  { title: 'Master Botanist', icon: '🌺', minLevel: 50, maxLevel: Infinity },
  { title: 'Plant Expert', icon: '🏆', minLevel: 35, maxLevel: 49 },
  { title: 'Green Thumb', icon: '🌳', minLevel: 20, maxLevel: 34 },
  { title: 'Gardener', icon: '👩‍🌾', minLevel: 10, maxLevel: 19 },
  { title: 'Sprout', icon: '🌿', minLevel: 5, maxLevel: 9 },
  { title: 'Seedling', icon: '🌱', minLevel: 1, maxLevel: 4 },
];

export function getLevelTitle(level: number): LevelTitle {
  return LEVEL_TITLES.find(t => level >= t.minLevel && level <= t.maxLevel)
    || LEVEL_TITLES[LEVEL_TITLES.length - 1];
}
```

---

## Patterns to Follow

### Pattern 1: Server-Side Awarding

**What:** All XP/badge awards go through Supabase RPC
**When:** Any action that should award gamification
**Why:** Ensures consistency, idempotency, and security

```typescript
// CORRECT
const result = await awardGamificationEvent('watering_completed', sourceId, metadata);

// WRONG - never award XP client-side
user.xp += 10; // Never do this
```

### Pattern 2: Toast Queue for Sequential Display

**What:** Multiple rewards queue up and display one at a time
**When:** User completes action that awards multiple things

```typescript
// If user levels up AND gets a badge:
enqueueAwardResult({
  xp_awarded: 50,
  leveled_up: true,
  new_badges: ['level_5']
});
// Shows: "+50 XP" → "Level 5" → "Badge: Level 5 Gardener"
```

### Pattern 3: Cache with TTL for Leaderboard

**What:** Don't fetch leaderboard on every render
**When:** Displaying leaderboard data

```typescript
// In store
const LEADERBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

fetchLeaderboard: async () => {
  const { leaderboardFetchedAt } = get();
  if (leaderboardFetchedAt && Date.now() - leaderboardFetchedAt < LEADERBOARD_CACHE_TTL) {
    return; // Use cache
  }
  // Fetch fresh data...
}
```

### Pattern 4: Celebration Cooldown

**What:** Don't spam celebrations, use cooldown
**When:** User triggers multiple level-ups rapidly

```typescript
// Add to store
lastCelebrationAt: number | null;
CELEBRATION_COOLDOWN: 3000, // 3 seconds

triggerCelebration: (type) => {
  const { lastCelebrationAt } = get();
  if (lastCelebrationAt && Date.now() - lastCelebrationAt < 3000) {
    return; // Skip, too soon
  }
  set({ celebrationType: type, lastCelebrationAt: Date.now() });
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side XP Calculation

**What:** Calculating XP in client code
**Why bad:** Cheating, inconsistency, sync issues
**Instead:** Always use Supabase RPC

### Anti-Pattern 2: Immediate Toast on Event

**What:** Showing toast before RPC confirms
**Why bad:** May fail, shows wrong values
**Instead:** Wait for RPC response, then enqueue toast

### Anti-Pattern 3: Polling for Progress Updates

**What:** setInterval to check XP progress
**Why bad:** Wasteful, battery drain
**Instead:** Fetch on screen focus, or use Supabase Realtime subscriptions

### Anti-Pattern 4: Hardcoded Badge Checks in Client

**What:** Checking badge requirements in UI code
**Why bad:** Logic duplicated, can desync from server
**Instead:** Server checks badges in `award_gamification_badges()`

---

## Build Order

### Phase 1: Leaderboard Enhancement (1-2 days)
1. Create migration 007 with `weekly_leaderboard` view
2. Add `get_weekly_leaderboard()` RPC
3. Extend `gamificationService.ts` with leaderboard fetch
4. Add "This Week" tab to Leaderboard component
5. Add leaderboard cache to store

### Phase 2: Extended Badges (1 day)
1. Add new badge definitions to migration 007
2. Extend `award_gamification_badges_v2()` with new checks
3. Update BadgeGrid to show all badges
4. Add progress tracking for trackable badges

### Phase 3: Level Titles (0.5 days)
1. Create `utils/levelTitles.ts` helper
2. Update LevelProgressCard to show title + icon
3. Update profile screen to show title

### Phase 4: Celebrations (1 day)
1. Install `react-native-confetti-cannon`
2. Create CelebrationOverlay component
3. Add celebration state to store
4. Integrate with toast host for level-up moments

### Phase 5: Polish (0.5 days)
1. Add i18n strings for new content
2. Test all flows
3. Performance audit
4. Dark mode verification

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Leaderboard query | On-demand view | On-demand view OK | Materialized view + cron refresh |
| Event log size | Minimal | ~1M rows/year | Partition by month |
| Badge checks | In RPC | In RPC | Consider caching in user_progress |
| Real-time updates | Not needed | Not needed | Supabase Realtime |

---

## Sources

### HIGH Confidence (Codebase Verification)
- `stores/gamificationStore.ts` — Existing implementation verified
- `services/gamificationService.ts` — RPC integration patterns verified
- `supabase/migrations/004_gamification_system.sql` — Schema verified
- `components/Gamification/*.tsx` — Component patterns verified

### HIGH Confidence (npm Registry)
- `react-native-confetti-cannon` — Version 1.5.2, stable API

### MEDIUM Confidence (PostgreSQL Patterns)
- Weekly leaderboard query pattern — Standard window functions
- Materialized view patterns — Standard PostgreSQL feature

---

*Architecture research for: Gamification 2.0 (v3.0 milestone)*
*Researched: 2026-03-09*
