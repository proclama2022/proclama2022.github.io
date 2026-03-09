# Feature Landscape: Gamification 2.0 (v3.0)

**Domain:** Gamification enhancements for plant care app
**Researched:** 2026-03-09
**Mode:** Ecosystem Research

---

## Executive Summary

La ricerca su sistemi gamification (Duolingo, Strava, app piante) rivela pattern chiari per aumentare retention. Per la milestone v3.0, l'infrastruttura base XP/Livelli/Badge/Daily Challenges **esiste gia**. I gap principali sono:

1. **Leaderboard settimanale** - attualmente solo globale senza reset
2. **Achievement badges estesi** - solo 4 badge base vs 10+ necessari
3. **Weekly challenges** - mancano completamente
4. **Level titles** - utenti non vedono il proprio "titolo"
5. **Celebration moments** - no confetti/animazioni per level-up

**Priorita:** Leaderboard > Badges > Weekly Challenges > Titles > Celebrations

---

## Existing Implementation Status

### Already Built (verified in codebase)

| Component | File | Status |
|-----------|------|--------|
| XP/Level System | `004_gamification_system.sql` | Full RPC `award_event()` with idempotency |
| Badge Catalog | `badges_catalog` table | 4 badges: streak_7, streak_30, level_5, level_10 |
| Daily Challenges | `daily_challenges` + `challenge_progress` | 2 challenges: watering 3x, reminder 2x |
| Event Catalog | `gamification_event_catalog` | 6 events with XP + daily caps |
| Toast Queue | `gamificationStore.ts` | XP/level/badge notification queue |
| Community Hooks | `005_gamification_community_hooks.sql` | Auto-award on post/like |
| LevelProgressCard | `LevelProgressCard.tsx` | XP bar + level display |
| BadgeGrid | `BadgeGrid.tsx` | Horizontal scroll with locked/unlocked |
| Leaderboard | `Leaderboard.tsx` | Basic xp/streak/badges tabs |

---

## Table Stakes

Features users expect in gamified apps. Missing these makes the product feel incomplete.

### 1. XP Progression with Visible Level

| Feature | Why Expected | Current Status | Gap |
|---------|--------------|----------------|-----|
| XP per action | Core gamification loop | Implemented | None |
| Level progression | Sense of advancement | Implemented | None |
| Level progress bar | Visual feedback | Implemented | None |
| Level-up notification | Celebrate milestones | Toast only | Add celebration animation |

**Competitor patterns:**
- Duolingo: XP per lesson, daily goal, level-up fanfare
- Strava: XP per activity, weekly goal, achievement badges
- Plant apps: XP per watering, streak counter, badges

---

### 2. Streak Tracking

| Feature | Why Expected | Current Status | Gap |
|---------|--------------|----------------|-----|
| Watering streak | Daily habit formation | Implemented | None |
| Streak display | Social proof, motivation | Stats only | Add prominent header |
| Streak badges | Reward consistency | 7/30 day badges exist | Add 14, 60, 90, 180, 365 |
| Streak freeze | Protect from misses | Not implemented | Consider for v3.1 |

**Competitor patterns:**
- Duolingo: Streak freeze purchasable, prominent counter
- Strava: Weekly streak, monthly challenges
- Plant apps: Watering streaks, care streaks

---

### 3. Badges/Achievements

| Feature | Why Expected | Current Status | Gap |
|---------|--------------|----------------|-----|
| Badge catalog | Goals to work toward | 4 badges only | **Need 10+ more** |
| Badge unlock moment | Celebration | Toast only | Add modal + animation |
| Badge grid display | Collection view | Implemented | None |
| Progress toward badge | Motivation | Not implemented | **Add progress tracking** |

**Current badges:**
- `watering_streak_7` - 7-day watering streak
- `watering_streak_30` - 30-day watering streak
- `level_5` - Reach level 5
- `level_10` - Reach level 10

**Required new badges (v3.0):**
| Badge Key | Title | Requirement |
|-----------|-------|-------------|
| `first_plant` | First Plant | Add first plant |
| `green_thumb` | Green Thumb | Water all plants in one day |
| `community_star` | Community Star | Receive 50 likes |
| `identification_master` | ID Master | Identify 100 plants |
| `streak_warrior` | Streak Warrior | 14-day streak |
| `early_bird` | Early Bird | 7 daily check-ins |
| `weekly_champion` | Weekly Champion | Top 3 on leaderboard |
| `post_master` | Post Master | Publish 10 posts |

---

### 4. Daily Challenges

| Feature | Why Expected | Current Status | Gap |
|---------|--------------|----------------|-----|
| Daily reset | Fresh goals daily | Implemented | None |
| Progress tracking | See completion | Implemented | None |
| XP reward | Incentive | Implemented | None |
| Challenge variety | Keep interesting | 2 challenges only | **Add more variety** |

**Current challenges:**
- `daily_watering_3` - Water 3 plants (+30 XP)
- `daily_reminder_2` - Complete 2 reminders (+20 XP)

**Potential additions:**
| Challenge Key | Description | XP |
|---------------|-------------|-----|
| `daily_checkin` | Open the app today | +10 XP |
| `daily_post` | Share a plant photo | +40 XP |
| `daily_identify` | Identify a new plant | +25 XP |

---

### 5. Leaderboard

| Feature | Why Expected | Current Status | Gap |
|---------|--------------|----------------|-----|
| User ranking | Competition | Implemented (global) | **Need weekly reset** |
| Current user highlight | Know your position | Implemented | None |
| Filter by metric | XP/Streak/Badges | Implemented | None |
| Profile navigation | See other profiles | Not implemented | Add tap to profile |

**Key gap:** Current leaderboard is **global cumulative**. Duolingo-style leagues use **weekly cohorts with promotion/demotion**.

---

## Differentiators

Features that set product apart. Not expected, but valued.

### 1. Weekly Challenges (New)

**Value Proposition:** Mid-term goals beyond daily challenges

| Feature | Complexity | Notes |
|---------|------------|-------|
| Weekly reset | Medium | New challenges each Monday |
| Multi-event goals | Medium | "Identify 5 plants this week" |
| Bonus XP reward | Low | +100 XP for weekly completion |
| Progress bar | Low | Visual tracking |

**Suggested weekly challenges:**
| Challenge | Description | XP Reward |
|-----------|-------------|-----------|
| `weekly_watering_15` | Water plants 15 times | +100 XP |
| `weekly_posts_3` | Share 3 plant photos | +120 XP |
| `weekly_identify_5` | Identify 5 new plants | +80 XP |

---

### 2. Level Titles (New)

**Value Proposition:** Identity and status in community

| Level Range | Title | Icon |
|-------------|-------|------|
| 1-4 | Seedling | 🌱 |
| 5-9 | Sprout | 🌿 |
| 10-19 | Gardener | 👩‍🌾 |
| 20-34 | Green Thumb | 🌳 |
| 35-49 | Plant Expert | 🏆 |
| 50+ | Master Botanist | 🌺 |

**Implementation:**
```typescript
function getLevelTitle(level: number): { title: string; icon: string } {
  if (level >= 50) return { title: 'Master Botanist', icon: '🌺' };
  if (level >= 35) return { title: 'Plant Expert', icon: '🏆' };
  if (level >= 20) return { title: 'Green Thumb', icon: '🌳' };
  if (level >= 10) return { title: 'Gardener', icon: '👩‍🌾' };
  if (level >= 5) return { title: 'Sprout', icon: '🌿' };
  return { title: 'Seedling', icon: '🌱' };
}
```

---

### 3. Celebration Animations (New)

**Value Proposition:** Make achievements feel special

| Event | Animation | Implementation |
|-------|-----------|----------------|
| Level up | Confetti burst | `react-native-confetti-cannon` |
| Badge unlock | Modal + sparkle | Reanimated + haptics |
| Challenge complete | Checkmark animation | Reanimated |
| Streak milestone | Fire emoji animation | Lottie or reanimated |

---

### 4. Weekly Leaderboard Reset (Enhancement)

**Value Proposition:** Duolingo-style competitive cohorts

| Feature | Complexity | Notes |
|---------|------------|-------|
| Weekly cohort creation | High | 30 users per cohort |
| Promotion/demotion | High | Top/bottom movers |
| League tiers | Medium | Bronze to Diamond |
| End-of-week summary | Medium | Notification with results |

**Simplified MVP approach:**
- Reset leaderboard points weekly (not full cohort system)
- Show "This Week" vs "All Time" tabs
- Award `weekly_champion` badge to top 3

---

### 5. Achievement Tiers (Enhancement)

**Value Proposition:** Duolingo-style 5-tier badges

| Badge | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|-------|--------|--------|--------|--------|--------|
| Watering Streak | 7 days | 14 days | 30 days | 90 days | 365 days |
| Plants Added | 1 | 10 | 25 | 50 | 100 |
| Likes Received | 10 | 50 | 100 | 500 | 1000 |
| Posts Published | 1 | 5 | 10 | 25 | 50 |

---

## Anti-Features

Features to explicitly NOT build in v3.0.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time global leaderboard | Performance, scalability | Weekly snapshot + cached view |
| Pay-to-win XP boosts | Unfair advantage, breaks trust | All XP through app actions only |
| Standalone daily login rewards | Encourages mindless opens | XP from meaningful actions only |
| Negative consequences | Demotivating | Never lose XP, only gain |
| Infinite XP farming | Daily caps already prevent | Keep daily caps |
| Direct XP competition | Discourages casual users | Leaderboard on weekly activity |
| Gamification for every action | Notification fatigue | Focus on meaningful moments |

---

## Feature Dependencies

```
v3.0 Gamification Enhancement
|
+-- Leaderboard Enhancement
|   +-- Weekly reset mechanism → Requires: date_trunc('week') query
|   +-- RPC get_weekly_leaderboard() → New migration
|   +-- UI "This Week" tab → Minor component change
|
+-- Extended Badge Catalog
|   +-- New badge definitions → Migration INSERT
|   +-- Badge unlock logic → Extend award_gamification_badges()
|   +-- Progress tracking UI → New component
|
+-- Level Titles
|   +-- Title mapping function → Client-side helper
|   +-- Display in LevelProgressCard → Minor UI update
|   +-- Display in profile → Minor UI update
|
+-- Celebration Animations
|   +-- Install confetti-cannon → npm install
|   +-- CelebrationOverlay component → New component
|   +-- Integration with GamificationStore → Minor store update
|
+-- Weekly Challenges (stretch)
    +-- weekly_challenges table → New migration
    +-- Weekly reset logic → pg_cron or edge function
    +-- Challenge progress UI → Extend DailyChallenges component
```

---

## MVP Recommendation for v3.0

### P1 - Must Have (MVP)

1. **Weekly Leaderboard View** - Core competitive feature
   - Add `get_weekly_leaderboard()` RPC
   - Add "This Week" tab to Leaderboard component
   - Show user's weekly rank prominently

2. **Extended Badge Catalog** - More goals to achieve
   - Add 8 new badges via migration
   - Extend `award_gamification_badges()` for new badge logic
   - Add progress tracking for key badges

3. **Level Titles** - Identity/status
   - Add `getLevelTitle()` helper
   - Display in LevelProgressCard and profile

### P2 - Should Have

4. **Celebration Animations** - Make achievements feel special
   - Install `react-native-confetti-cannon`
   - Add CelebrationOverlay component
   - Integrate with level-up and badge unlock

### P3 - Nice to Have (v3.1+)

5. **Weekly Challenges** - Mid-term goals
   - New `weekly_challenges` table
   - Weekly reset mechanism
   - Challenge progress UI

6. **Achievement Tiers** - Duolingo-style multi-level badges
   - Extend badge catalog with tier structure
   - Progress tracking per tier

---

## Prioritization Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Weekly Leaderboard | High | Low | P1 |
| Extended Badges | High | Low | P1 |
| Level Titles | Medium | Very Low | P1 |
| Celebration Animations | Medium | Low | P2 |
| Weekly Challenges | Medium | Medium | P3 |
| Achievement Tiers | Low | Medium | P3 |
| League Cohorts | Medium | High | Future |

---

## Competitor Analysis

### Duolingo Gamification Elements

| Element | How Duolingo Does It | Plantid Equivalent |
|---------|---------------------|-------------------|
| XP per action | 10-50 XP per lesson | 10-20 XP per action |
| Streaks | Daily lesson streak | Daily watering streak |
| Leagues | 10 tiers, weekly reset | Weekly leaderboard (simplified) |
| Achievements | Tiered badges (5 levels) | Single-level badges |
| Gems | Currency for power-ups | Not applicable |
| Hearts | Lives system | Not applicable |

### Strava Gamification Elements

| Element | How Strava Does It | Plantid Equivalent |
|---------|-------------------|-------------------|
| Activities | Log runs/rides | Log waterings/care |
| Segments | Local leaderboards | Not applicable |
| Challenges | Monthly goals | Weekly challenges |
| Badges | Achievement badges | Badge system |
| Kudos | Social likes | Post likes + XP |

### Plant App Patterns

| App | Gamification | What to Borrow |
|-----|--------------|----------------|
| PictureThis | None | N/A - we differentiate |
| Planta | Care score | Consider care compliance % |
| Blossom | Care tracking | Visual care history |
| PlantIn | Streak counter | Prominent streak display |

---

## Sources

### HIGH Confidence (Codebase Verification)
- `stores/gamificationStore.ts` — Toast queue implementation verified
- `services/gamificationService.ts` — RPC integration verified
- `supabase/migrations/004_gamification_system.sql` — Full schema verified
- `supabase/migrations/005_gamification_community_hooks.sql` — Triggers verified
- `components/Gamification/*.tsx` — UI components verified

### MEDIUM Confidence (Training Data + Official Docs)
- Duolingo gamification patterns — Well-documented in wikis and public sources
- Strava gamification patterns — Documented in their engineering blog
- React Native confetti libraries — npm registry verification

### LOW Confidence (General Industry Knowledge)
- Optimal badge count for engagement — No specific research, industry estimate
- Weekly challenge optimal difficulty — A/B testing required

---

*Feature research for: Gamification 2.0 (v3.0 milestone)*
*Researched: 2026-03-09*
