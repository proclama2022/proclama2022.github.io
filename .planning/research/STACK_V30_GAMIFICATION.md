# Stack Research: Gamification 2.0 (v3.0)

**Domain:** Gamification enhancements for plant identification app
**Researched:** 2026-03-09
**Confidence:** HIGH (based on existing codebase analysis + npm package verification)

---

## Executive Summary

L'infrastruttura gamification esistente e gia molto solida. Per la milestone v3.0 servono **MINIME aggiunte**:
- Nessuna nuova libreria di stato (Zustand gia presente)
- Nessuna nuova libreria database (Supabase gia configurato con schema completo)
- Solo **una libreria per celebrazioni visive** (confetti/badge unlock animations)
- **Schema Supabase** per weekly leaderboard (vista o query on-demand)

---

## Existing Gamification Infrastructure

### Already Built (HIGH Confidence - verified in codebase)

| Component | File | Status |
|-----------|------|--------|
| GamificationStore | `stores/gamificationStore.ts` | Toast queue for XP/level/badge notifications |
| GamificationService | `services/gamificationService.ts` | RPC calls, award helpers, summary fetch |
| XP/Level System | `supabase/migrations/004_gamification_system.sql` | Full RPC `award_event()` with idempotency |
| Badge Catalog | `004_gamification_system.sql` | `badges_catalog` + `user_badges` tables |
| Daily Challenges | `004_gamification_system.sql` | `daily_challenges` + `challenge_progress` tables |
| Community Hooks | `005_gamification_community_hooks.sql` | Auto-award on post/like events |
| Types | `types/gamification.ts` | `GamificationEventType`, `UserProgress`, `UserBadge`, etc. |

### What Already Works

```
User waters plant → wateringService calls awardWateringEvent()
                  → Supabase RPC award_event()
                  → XP awarded, level check, badge check
                  → Result returned to app
                  → GamificationStore.enqueueAwardResult()
                  → Toast displayed (+XP, Level Up, Badge Unlocked)
```

---

## Recommended Stack Additions

### New Dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `react-native-confetti-cannon` | 1.5.2 | Celebration confetti effect | Lightweight, pure JS, no native deps. Used for level-up and badge unlock moments. |

**Why confetti-cannon over alternatives:**

| Alternative | Version | Why Not |
|-------------|---------|---------|
| `lottie-react-native` | 7.3.6 | More powerful but requires animation JSON files and complex setup. Overkill for confetti. |
| `react-native-animatable` | 1.4.0 | For UI element animations (shake/bounce), we already have `react-native-reanimated` installed. |
| Custom Canvas | - | Reinventing the wheel, confetti-cannon is proven and tiny (~10KB). |

**Key benefits of confetti-cannon:**
- Pure JavaScript (no native code)
- Works with Expo SDK 54 without config plugins
- Simple API: `<ConfettiCannon count={150} origin={{x: -10, y: 0}} />`
- Last update 2021 but stable and widely used (no breaking changes needed)

### No Additional Libraries Needed For

| Feature | Existing Solution |
|---------|-------------------|
| State management | Zustand 5.0.11 (already in use) |
| Backend | Supabase with existing gamification schema |
| XP/Level system | Fully implemented in `award_event()` RPC |
| Daily challenges | `daily_challenges` + `challenge_progress` tables exist |
| Badges | `badges_catalog` + `user_badges` tables exist |
| Toast notifications | `GamificationStore.enqueueAwardResult()` |
| Animations | `react-native-reanimated` 4.1.1 (already installed) |
| Haptic feedback | `expo-haptics` 15.0.8 (already installed) |

---

## Supabase Schema Additions

### Weekly Leaderboard

Per la leaderboard settimanale serve una view. La query puo essere calcolata on-demand dalla tabella `user_progress`.

**Option A: On-demand view (recommended for MVP)**

```sql
-- View for weekly leaderboard (computed on read)
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
    ORDER BY COUNT(ge.id) FILTER (
      WHERE ge.occurred_at >= date_trunc('week', now())
    ) DESC, up.xp_total DESC
  ) AS weekly_rank
FROM user_progress up
JOIN profiles p ON p.id = up.user_id
LEFT JOIN gamification_events ge ON ge.user_id = up.user_id
GROUP BY up.user_id, p.display_name, p.avatar_url, up.level, up.xp_total, up.watering_streak;
```

**Option B: Materialized view (if performance becomes an issue)**

```sql
CREATE MATERIALIZED VIEW weekly_leaderboard_mv AS
SELECT ...; -- same as above

-- Refresh via pg_cron or edge function
REFRESH MATERIALIZED VIEW weekly_leaderboard_mv;
```

**New RPC for leaderboard fetch:**

```sql
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
```

### Extend Badge Catalog

Aggiungere nuovi badge per la milestone v3.0:

```sql
INSERT INTO badges_catalog (badge_key, title, description) VALUES
  ('first_plant', 'First Plant', 'Add your first plant to the collection'),
  ('green_thumb', 'Green Thumb', 'Water all your plants in a single day'),
  ('community_star', 'Community Star', 'Receive 50 likes on your posts'),
  ('identification_master', 'Identification Master', 'Identify 100 plants'),
  ('weekly_champion', 'Weekly Champion', 'Reach top 3 on the weekly leaderboard'),
  ('streak_warrior', 'Streak Warrior', 'Maintain a 14-day watering streak'),
  ('early_bird', 'Early Bird', 'Check in 7 days in a row')
ON CONFLICT (badge_key) DO NOTHING;
```

---

## Integration Points

### 1. GamificationStore Extensions

Il file `stores/gamificationStore.ts` va esteso per:
- Cache della leaderboard (evitare fetch ripetuti)
- Tracking achievement progress locale
- Queue per celebration animations

```typescript
// Additions needed in GamificationState
interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  xp_total: number;
  watering_streak: number;
  weekly_events: number;
  weekly_rank: number;
}

interface GamificationState {
  // ... existing
  leaderboardCache: LeaderboardEntry[] | null;
  leaderboardFetchedAt: number | null;
  fetchLeaderboard: () => Promise<void>;
  celebrationType: 'level_up' | 'badge_unlock' | 'challenge_complete' | null;
  triggerCelebration: (type: 'level_up' | 'badge_unlock' | 'challenge_complete') => void;
  clearCelebration: () => void;
}
```

### 2. GamificationService Extensions

Il file `services/gamificationService.ts` va esteso per:

```typescript
// New functions needed
export async function getWeeklyLeaderboard(limit?: number): Promise<LeaderboardEntry[] | null>;

export async function getUserWeeklyRank(userId: string): Promise<number | null>;

export async function getAchievementProgress(userId: string): Promise<AchievementProgress[]>;
```

### 3. Types Extensions

File: `types/gamification.ts`

```typescript
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
```

### 4. i18n Additions

File: `i18n/resources/en.json` e `it.json`

```json
{
  "gamification": {
    "leaderboard": {
      "title": "Weekly Leaderboard",
      "title_it": "Classifica Settimanale",
      "yourRank": "Your Rank",
      "yourRank_it": "La Tua Posizione",
      "noRank": "Not ranked yet",
      "noRank_it": "Non ancora in classifica",
      "weeklyEvents": "This Week",
      "weeklyEvents_it": "Questa Settimana"
    },
    "achievements": {
      "first_plant_title": "First Plant",
      "first_plant_title_it": "Prima Pianta",
      "first_plant_desc": "Add your first plant",
      "first_plant_desc_it": "Aggiungi la tua prima pianta",
      "green_thumb_title": "Green Thumb",
      "green_thumb_title_it": "Pollice Verde",
      "green_thumb_desc": "Water all plants in one day",
      "green_thumb_desc_it": "Annaffia tutte le piante in un giorno"
    }
  }
}
```

---

## Installation

```bash
# Single new dependency
npm install react-native-confetti-cannon@1.5.2

# No additional native configuration needed for Expo SDK 54
# Pure JavaScript library, no config plugins required
```

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `expo-lottie` | Does not exist (not in npm registry) | `lottie-react-native` if complex animations needed, but confetti-cannon is lighter |
| `react-native-animatable` | Redundant with reanimated | Existing `react-native-reanimated` for UI animations |
| Redux/MobX | Unnecessary complexity | Existing Zustand |
| Achievement SDK (e.g., gamify.js) | Overkill for app scope | Custom logic in Supabase RPC |
| Game analytics SDK | Privacy concerns, overkill | Existing Supabase analytics |
| `react-native-leaderboard` | Unmaintained, last update 2019 | Custom FlatList component |

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| react-native-confetti-cannon | 1.5.2 | RN 0.81.5, Expo 54 | Pure JS, no native deps |
| zustand | 5.0.11 (existing) | React 19.1.0 | Already in use |
| react-native-reanimated | 4.1.1 (existing) | RN 0.81.5 | Already in use |
| expo-haptics | 15.0.8 (existing) | Expo 54 | Already in use |
| @supabase/supabase-js | 2.98.0 (existing) | Expo 54 | Already in use |

---

## Implementation Order

| Phase | What | Dependencies |
|-------|------|--------------|
| 1 | Leaderboard view + RPC | Supabase migration |
| 2 | Leaderboard UI component | FlatList + existing styling |
| 3 | Extended badge catalog | Supabase seed migration |
| 4 | Achievement progress tracking | Extend GamificationService |
| 5 | Celebration animations | Install confetti-cannon |

---

## Celebration Animation Pattern

```typescript
// In GamificationToastHost or new CelebrationOverlay component
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';

const CelebrationOverlay: React.FC = () => {
  const { celebrationType, clearCelebration } = useGamificationStore();
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    if (celebrationType) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      confettiRef.current?.start();
    }
  }, [celebrationType]);

  if (!celebrationType) return null;

  return (
    <ConfettiCannon
      ref={confettiRef}
      count={150}
      origin={{ x: -10, y: 0 }}
      fadeOut
      autoStart={false}
      onAnimationEnd={clearCelebration}
    />
  );
};
```

---

## Sources

### HIGH Confidence (Codebase Verification)
- `stores/gamificationStore.ts` — Existing toast queue implementation
- `services/gamificationService.ts` — Existing RPC integration
- `supabase/migrations/004_gamification_system.sql` — Full schema
- `supabase/migrations/005_gamification_community_hooks.sql` — Trigger functions
- `types/gamification.ts` — Type definitions
- `package.json` — Installed versions verification

### HIGH Confidence (npm Registry)
- `npm view react-native-confetti-cannon` — Version 1.5.2, pure JS, no peer deps
- `npm view lottie-react-native` — Version 7.3.6, confirmed as heavier alternative

### MEDIUM Confidence (Training Data)
- react-native-confetti-cannon API patterns — Standard across React Native ecosystem
- Leaderboard query patterns — Standard PostgreSQL window functions

---
*Stack research for: Gamification 2.0 (v3.0 milestone)*
*Researched: 2026-03-09*
