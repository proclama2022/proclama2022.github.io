# Phase 17: League System - Research

**Researched:** 2026-03-09
**Domain:** Duolingo-style league system with weekly promotion/relegation
**Confidence:** HIGH

## Summary

This phase implements a Duolingo-style competitive league system where users are grouped into cohorts of 30 and compete weekly for XP-based rankings. The top 10 promote to the next tier, bottom 5 relegate. Five tiers exist: Bronze, Silver, Gold, Platinum, Diamond.

**Primary recommendation:** Leverage existing Supabase infrastructure with `pg_cron` extension for scheduled weekly promotion/relegation jobs. Extend the existing `user_progress` table with league fields and reuse the `award_event()` RPC pattern for badge awards on promotion. Use the established Zustand store pattern for client state and `react-native-confetti-cannon` for celebration animations.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Hub integrato nel Gamification Hub esistente (`app/gamification.tsx`)
- Layout a tab interno: Badge | Leghe | Sfide
- Entry point dalla Home con pulsante dedicato
- Mini-widget in Home che mostra lega attuale + posizione classifica (tap per espandere)
- Leaderboard: lista compatta, 32px avatars, nome, icona lega, XP
- Riga utente corrente sempre visibile (sticky in fondo)
- Zone evidenziate: Top 10 verde (promozione), Bottom 5 rosso (retrocessione)
- ~8 utenti visibili prima di scroll
- Promozione: Toast animato + confetti (react-native-confetti-cannon)
- Retrocessione: Toast sottile senza celebrazione
- Anticipazione: Banner countdown nel gamification hub
- Haptic: Vibrazione leggera solo su promozione
- Icona badge lega 16-20px accanto al nome utente
- Simboli: Bronze=🥉, Silver=🥈, Gold=🥇, Platinum=💎, Diamond=💠
- Colori: Bronze=#CD7F32, Silver=#C0C0C0, Gold=#FFD700, Platinum=#E5E4E2, Diamond=#B9F2FF

### Claude's Discretion
- Empty state per utenti senza lega (nuovi utenti prima dell'assegnazione)
- Animazioni transizione tra tab nel gamification hub
- Esatto posizionamento mini-widget nella Home
- Copy per toast di promozione/retrocessione (localizzato IT/EN)

### Deferred Ideas (OUT OF SCOPE)
- League chat/messaging (v3.2+)
- League competitions/challenges (v3.2+)
- Custom league names (v3.2+)
- Seasonal/limited-time leagues (future consideration)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LEAG-01 | User is assigned to a league based on XP (Bronze -> Diamond) | `league_tiers` table + `user_progress.league_tier` column + RPC `assign_user_to_league()` |
| LEAG-02 | User can view weekly leaderboard showing top 30 users in their league | `league_memberships` table + `get_league_leaderboard()` RPC + existing Leaderboard component pattern |
| LEAG-03 | Top 10 users promote to higher league at week end (Sunday midnight local time) | `pg_cron` scheduled job + `process_weekly_promotion_relegation()` RPC |
| LEAG-04 | Bottom 5 users relegate to lower league at week end | Same `pg_cron` job + RPC handles both promotion and relegation |
| LEAG-05 | League tab shows current rank, XP progress, and promotion/relegation zone | Extend `Leaderboard.tsx` with zone highlighting + sticky current user row |
| LEAG-06 | New users start in Bronze league | Default value in `user_progress.league_tier` + automatic assignment on first XP event |
| LEAG-07 | League badges are awarded on promotion (Bronze Member, Silver Member, etc.) | Extend `badges_catalog` + `user_badges` + trigger from promotion RPC |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.98.0 | Database, auth, realtime | Existing project standard |
| pg_cron | 1.6+ | Scheduled database jobs | Supabase native extension for weekly cron |
| zustand | ^5.0.11 | Client state management | Existing pattern in gamificationStore |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-haptics | ~15.0.8 | Haptic feedback | Promotion celebration only |
| @react-navigation/material-top-tabs | ^7.4.13 | Tab navigation | League tab inside gamification hub |

### New Dependencies
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| react-native-confetti-cannon | ^1.5.x | Confetti animation | NOT in current package.json - must add |

**Installation:**
```bash
npm install react-native-confetti-cannon
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pg_cron | Supabase Edge Functions + external scheduler | pg_cron runs inside DB, simpler, no external service needed |
| react-native-confetti-cannon | react-native-confetti | confetti-cannon has better Expo support, more stars |
| Separate league store | Extend gamificationStore | Single source of truth, consistent toast queue pattern |

## Architecture Patterns

### Recommended Database Schema
```sql
-- League tiers (reference table)
CREATE TABLE league_tiers (
  tier_key TEXT PRIMARY KEY,  -- 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  tier_order INT NOT NULL UNIQUE,  -- 1=bronze, 5=diamond
  display_name TEXT NOT NULL,
  color TEXT NOT NULL,
  symbol TEXT NOT NULL
);

-- Weekly league cohorts (groups of 30 users)
CREATE TABLE league_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_key TEXT REFERENCES league_tiers(tier_key) NOT NULL,
  week_start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_cohort_per_tier_week UNIQUE (tier_key, week_start_date)
);

-- User membership in weekly cohorts
CREATE TABLE league_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cohort_id UUID REFERENCES league_cohorts(id) NOT NULL,
  xp_at_start INT NOT NULL DEFAULT 0,
  xp_at_end INT,
  final_rank INT,
  promotion_result TEXT,  -- 'promoted', 'relegated', 'stayed'
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_per_week UNIQUE (user_id, cohort_id)
);

-- Add to existing user_progress
ALTER TABLE user_progress ADD COLUMN league_tier TEXT DEFAULT 'bronze';
ALTER TABLE user_progress ADD COLUMN timezone TEXT DEFAULT 'UTC';
```

### Pattern 1: Weekly Promotion/Relegation Cron Job
**What:** pg_cron job that runs every Sunday at midnight UTC, processes all league results
**When to use:** Weekly reset, promotion, relegation logic
**Example:**
```sql
-- Source: Supabase pg_cron docs (verified 2026-03-09)
-- Schedule weekly promotion/relegation
SELECT cron.schedule(
  'weekly-league-promotion',
  '0 0 * * 0',  -- Every Sunday at midnight UTC
  $$
  SELECT process_weekly_league_results();
  $$
);
```

### Pattern 2: League Leaderboard RPC
**What:** Server-side function to fetch current league standings
**When to use:** When displaying league tab or mini-widget
**Example:**
```sql
CREATE OR REPLACE FUNCTION get_league_leaderboard(p_user_id UUID)
RETURNS TABLE (
  rank INT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  xp_this_week INT,
  league_tier TEXT,
  is_current_user BOOLEAN,
  is_promotion_zone BOOLEAN,
  is_relegation_zone BOOLEAN
) AS $$
-- Implementation fetches user's current cohort, calculates ranks,
-- and flags top 10 / bottom 5 zones
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Pattern 3: Extend gamificationStore for League Events
**What:** Add league event types to existing toast queue pattern
**When to use:** When user promotes or relegates
**Example:**
```typescript
// Source: stores/gamificationStore.ts (existing pattern)
export interface GamificationToastItem {
  id: string;
  kind: 'xp' | 'level' | 'badge' | 'league_promotion' | 'league_relegation';  // ADD
  message: string;
  metadata?: { newTier?: string; oldTier?: string };
}
```

### Anti-Patterns to Avoid
- **Client-side timezone calculations:** Use server-side with user's stored timezone for "Sunday midnight local"
- **Real-time league updates:** League standings only change on XP events; poll or refresh on focus rather than subscribe
- **Separate leaderboard component:** Extend existing `Leaderboard.tsx` with `type='league'` instead of rebuilding

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scheduled jobs | Custom Node.js cron server | pg_cron | Supabase native, runs in DB, simpler deployment |
| Confetti animation | Custom Animated API animation | react-native-confetti-cannon | Battle-tested, Expo-compatible, customizable |
| Haptic feedback | Native module bridge | expo-haptics | Already in project, simple API |
| Toast queue | New league-specific toast system | Extend gamificationStore | Single source of truth, consistent UX |
| League badge icons | Custom SVG components | Emoji + color styling | Simpler, consistent across platforms |

**Key insight:** The existing gamification infrastructure (award_event RPC, badge system, toast queue) is well-designed and should be extended rather than duplicated for leagues.

## Common Pitfalls

### Pitfall 1: Timezone Confusion for "Sunday Midnight"
**What goes wrong:** Users expect "Sunday midnight" in their local time but server runs UTC
**Why it happens:** Cron jobs run in server timezone (UTC), users span multiple timezones
**How to avoid:** Store user timezone in `user_progress.timezone`, process promotions in batches per timezone, or use "Sunday 23:59 UTC" as universal cutoff with clear communication
**Warning signs:** User complaints about "promotion happened at wrong time"

### Pitfall 2: League Cohort Imbalance
**What goes wrong:** Cohorts with fewer than 30 users, or users left without a cohort
**Why it happens:** Not enough users in a tier, timing issues between cohort creation and user assignment
**How to avoid:** Allow cohorts of 10-30 users, create cohorts on-demand, ensure assignment happens atomically
**Warning signs:** Empty leaderboards, users stuck "waiting for league"

### Pitfall 3: XP Timing Edge Cases
**What goes wrong:** XP earned during promotion processing affects next week's starting XP
**Why it happens:** Race condition between XP events and promotion job
**How to avoid:** Use `xp_at_start` snapshot when creating membership, calculate weekly XP delta not total XP
**Warning signs:** Users showing 0 XP in league, XP counts inconsistent

### Pitfall 4: Bronze User Can't Relegate
**What goes wrong:** Bottom 5 Bronze users have nowhere to go
**Why it happens:** Bronze is the lowest tier
**How to avoid:** Bottom 5 Bronze users simply "stay" - no demotion below Bronze
**Warning signs:** Unexpected promotion results, negative tier lookups

### Pitfall 5: Missing react-native-confetti-cannon
**What goes wrong:** Import errors when trying to use confetti
**Why it happens:** Package mentioned in CONTEXT.md but NOT in current package.json
**How to avoid:** Add `npm install react-native-confetti-cannon` as first task
**Warning signs:** Module not found error at runtime

## Code Examples

Verified patterns from existing codebase:

### Extend gamificationStore for League Events
```typescript
// Source: stores/gamificationStore.ts (existing pattern to extend)
function createToastQueue(result: GamificationAwardResult): GamificationToastItem[] {
  const items: GamificationToastItem[] = [];

  if (result.xp_awarded > 0) {
    items.push({
      id: createId('xp'),
      kind: 'xp',
      message: `+${result.xp_awarded} XP`,
    });
  }

  // ADD: Handle league promotion/relegation
  if (result.league_promotion) {
    items.push({
      id: createId('league'),
      kind: 'league_promotion',
      message: `Promoted to ${result.new_league_tier}!`,
      metadata: { newTier: result.new_league_tier },
    });
  }

  // ... existing level and badge handling
  return items;
}
```

### pg_cron Schedule Setup
```sql
-- Source: Supabase pg_cron docs (https://supabase.com/docs/guides/database/extensions/pgcron)
-- Enable pg_cron extension (run once)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly league processing
SELECT cron.schedule(
  'weekly-league-promotion',
  '0 0 * * 0',  -- Every Sunday at 00:00 UTC
  $$
  SELECT process_weekly_league_results();
  $$
);

-- Verify job is scheduled
SELECT * FROM cron.job WHERE jobname = 'weekly-league-promotion';
```

### Extend Leaderboard Component for League Type
```typescript
// Source: components/Gamification/Leaderboard.tsx (existing pattern)
export type LeaderboardType = 'xp' | 'streak' | 'badges' | 'league';  // ADD 'league'

// In renderEntry, add zone highlighting for league type:
const isPromotionZone = type === 'league' && item.rank <= 10;
const isRelegationZone = type === 'league' && item.rank >= 26; // bottom 5 of 30

<View style={[
  styles.entry,
  isPromotionZone && { backgroundColor: '#4CAF5020' },  // Green tint
  isRelegationZone && { backgroundColor: '#F4433620' },  // Red tint
]}>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual cron servers | pg_cron in-database scheduling | Supabase standard | Simpler ops, no external service |
| Custom animation libraries | react-native-confetti-cannon | Expo ecosystem | Better compatibility, active maintenance |
| Global leaderboard | Cohort-based leagues | Duolingo popularized | Better engagement, fair competition |

**Deprecated/outdated:**
- `react-native-confetti`: Less maintained, confetti-cannon is preferred for Expo projects
- Edge Functions with external cron: pg_cron is simpler for database-centric scheduled jobs

## Open Questions

1. **Timezone Handling Strategy**
   - What we know: CONTEXT.md specifies "Sunday midnight local time"
   - What's unclear: Should we batch users by timezone or use a universal cutoff?
   - Recommendation: Start with universal UTC cutoff (Sunday 23:59 UTC), communicate clearly in UI. Can add per-timezone processing later if needed.

2. **Cohort Creation Timing**
   - What we know: Cohorts need 30 users for optimal experience
   - What's unclear: When to create cohorts? On-demand when user joins, or pre-created?
   - Recommendation: Create cohorts on-demand when first user in tier needs assignment. Allow cohorts of 10-30 users (flexible minimum).

3. **New User XP Timing**
   - What we know: New users start in Bronze
   - What's unclear: When exactly does a new user get assigned to a cohort?
   - Recommendation: Assign to cohort on first XP event (via award_event trigger), not on account creation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + react-test-renderer 19.1.0 |
| Config file | None detected - default Jest |
| Quick run command | `npm test -- --testPathPattern="league" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LEAG-01 | User assigned to league based on XP | unit | `npm test -- services/__tests__/leagueService.test.ts --testNamePattern="assign"` | No - Wave 0 |
| LEAG-02 | View weekly leaderboard top 30 | unit | `npm test -- components/Gamification/__tests__/Leaderboard.test.tsx --testNamePattern="league"` | No - Wave 0 |
| LEAG-03 | Top 10 promote at week end | integration | `npm test -- services/__tests__/leaguePromotion.test.ts` | No - Wave 0 |
| LEAG-04 | Bottom 5 relegate at week end | integration | `npm test -- services/__tests__/leaguePromotion.test.ts` | No - Wave 0 |
| LEAG-05 | League tab shows rank, XP, zones | unit | `npm test -- components/Gamification/__tests__/Leaderboard.test.tsx --testNamePattern="zone"` | No - Wave 0 |
| LEAG-06 | New users start in Bronze | unit | `npm test -- services/__tests__/leagueService.test.ts --testNamePattern="new user"` | No - Wave 0 |
| LEAG-07 | League badges awarded on promotion | integration | `npm test -- services/__tests__/leagueBadges.test.ts` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="league|gamification" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `services/__tests__/leagueService.test.ts` - covers LEAG-01, LEAG-06
- [ ] `services/__tests__/leaguePromotion.test.ts` - covers LEAG-03, LEAG-04
- [ ] `services/__tests__/leagueBadges.test.ts` - covers LEAG-07
- [ ] `components/Gamification/__tests__/Leaderboard.test.tsx` - covers LEAG-02, LEAG-05
- [ ] Framework setup: Jest is available via react-test-renderer, may need jest.config.js

*(No existing test infrastructure detected for gamification - all tests are Wave 0)*

## Sources

### Primary (HIGH confidence)
- Supabase pg_cron docs - https://supabase.com/docs/guides/database/extensions/pgcron
- Existing codebase: `stores/gamificationStore.ts` - toast queue pattern
- Existing codebase: `supabase/migrations/004_gamification_system.sql` - schema patterns
- Existing codebase: `components/Gamification/Leaderboard.tsx` - leaderboard component

### Secondary (MEDIUM confidence)
- CONTEXT.md user decisions - locked implementation choices
- REQUIREMENTS.md - phase requirements LEAG-01..07

### Tertiary (LOW confidence)
- react-native-confetti-cannon npm - assumed API based on package name (needs verification during implementation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Supabase, Zustand already in use; pg_cron is well-documented
- Architecture: HIGH - Existing patterns in gamification system provide clear templates
- Pitfalls: MEDIUM - Timezone edge cases require careful testing

**Research date:** 2026-03-09
**Valid until:** 30 days - Supabase pg_cron API is stable, React Native patterns are current
