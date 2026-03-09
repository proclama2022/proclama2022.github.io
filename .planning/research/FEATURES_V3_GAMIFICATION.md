# Feature Landscape: Gamification 2.0 for Plantid

**Domain:** Adding gamification to existing plant care app
**Milestone:** v3.0 Gamification 2.0
**Researched:** 2026-03-09
**Confidence:** MEDIUM (based on training knowledge and codebase analysis; web search unavailable)

---

## Table Stakes

Features users expect from gamification. Missing = system feels incomplete or "why bother?"

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **XP/Level System** | Standard across all gamified apps; users understand "earn points, level up" | Low | Already implemented: `user_progress` table with `level`, `xp_total`, `xp_for_next_level` |
| **Progress Visualization** | Users need to see progress toward next level; opaque systems frustrate | Low | Already implemented: `LevelProgressCard` component shows XP bar |
| **Activity Feed** | Users want to see what earned XP; transparency builds trust | Low | Already implemented: `recent_activity` in summary |
| **Badge Collection** | Collecting is fundamental to gamification psychology | Medium | Schema exists (`user_badges`, `badges_catalog`), needs badge definitions and trigger logic |
| **Daily Challenges** | Habit formation requires daily triggers; expected in 2026 apps | Medium | Schema exists (`daily_challenges`, `challenge_progress`), needs UI and reset logic |
| **Streak Counter** | Duolingo made streaks essential; users expect to see consistency rewarded | Low | Already implemented: `watering_streak` in `user_progress` |

---

## Differentiators

Features that set Plantid apart from competitors (PictureThis, Planta). Not expected, but highly valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Leaderboard (Weekly)** | Social proof + competition drives engagement; most plant apps lack this | Medium | Requires aggregation queries, pagination, privacy controls |
| **Achievement Stories** | Unlocks feel like milestones; "First Plant", "30-Day Streak", "Community Star" | Medium | Need badge definitions with meaningful criteria |
| **Seasonal Challenges** | "Spring Planting", "Winter Care" tied to real plant cycles - unique to plant apps | Medium | Time-boxed challenges with exclusive badges |
| **Social Badges** | "Followed by 100 plant lovers", "100 likes received" - leverages v2.0 community | Low | Build on existing `follows` and `likes` tables |
| **Care Streaks (Multi-type)** | Watering streak, posting streak, login streak - multiple engagement vectors | Medium | Extend `user_progress` or create `streaks` table |
| **Level Titles** | "Novice Gardener" -> "Plant Parent" -> "Green Thumb" -> "Botanist" | Low | Cosmetic but adds personality; store in level thresholds |
| **XP Multipliers (Pro)** | Pro users get 1.5x XP - adds Pro value without gating features | Low | Add `xp_multiplier` to profile, apply in `award_event` RPC |
| **Retroactive Awards** | Existing plants/waterings count toward badges on v3.0 launch | High | Requires data migration to seed `gamification_events` |

---

## Anti-Features

Features to explicitly NOT build. Based on gamification pitfalls research.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Pay-to-Win XP** | Undermines authenticity; "rich player = top leaderboard" feels unfair | XP only from actions, not purchases. Pro = cosmetic perks or multipliers, not free XP |
| **Infinite Notifications** | Every badge popup becomes noise; users disable notifications entirely | Queue toasts, show max 1 per action, batch summary at day end |
| **Complex Badge Trees** | Users lose track of progress; "unlock 5 badges to unlock badge slot" is confusing | Flat badge list; prerequisites are simple (e.g., "Water 10 plants before Green Thumb") |
| **Leaderboard for Everything** | "Top waterers", "Top posters", "Top identifiers" dilutes competition | Single weekly leaderboard focused on total XP or plants cared for |
| **XP Decay** | Negative reinforcement damages long-term retention; "I lost my progress" feels punishing | Streak breaks reset streak counter but don't subtract XP. Encourage return, don't punish absence |
| **Daily Login Gates** | Forcing daily login to maintain progress feels like a chore | Streaks are bonus, not requirement. Missing a day doesn't lose previous XP |
| **Grinding Mechanics** | "Water 1000 plants for badge" encourages mindless action over meaningful care | Cap daily XP per event type (already in schema: `daily_cap`), time-bound challenges |
| **Social Comparison Everywhere** | Constant "Friend X is level 10" notifications create anxiety | Opt-in social features. Leaderboard is separate screen, not home screen feed |
| **Hidden Progress** | Users can't see what badges exist or how close they are | Badge catalog visible from start. Progress shown as "7/10 plants" even if locked |
| **Competitive Direct Challenges** | "Challenge User X to plant-off" creates toxicity in plant community | Weekly global leaderboard only. No head-to-head competition |

---

## Feature Dependencies

```
XP/Level System -----+--> Leaderboard (needs XP totals)
                     |
                     +--> Level Titles (needs level thresholds)

Badge System --------+--> Achievement Stories (needs badge definitions)
                     |
                     +--> Social Badges (needs follows/likes data)

Daily Challenges ----+--> Seasonal Challenges (needs challenge infrastructure)
                     |
                     +--> Challenge Reset Logic (needs scheduled jobs)

Streak Tracking -----+--> Care Streaks (extend existing watering_streak)
                     |
                     +--> Streak Badges (needs streak data)

Pro Benefits --------+--> XP Multipliers (needs Pro status check)
```

---

## MVP Recommendation

Based on existing infrastructure and v3.0 milestone goals:

### Must Have (Phase 1)
1. **XP/Level System Enhancement** - Already functional, add level titles
2. **Badge Definitions & Triggers** - Define 8-12 initial badges, wire triggers for watering/plant_added
3. **Daily Challenges UI** - Show challenges in gamification screen, track completion
4. **Toast Queue System** - Ensure notification spam is controlled (already in store)

### Should Have (Phase 2)
5. **Weekly Leaderboard** - Single global leaderboard, opt-in visibility
6. **Achievement Unlocks** - "First Plant", "Green Thumb" (10 plants), "30-Day Streak" badges
7. **Pro XP Multiplier** - 1.5x for Pro users, adds value without gating

### Nice to Have (Phase 3+)
8. **Seasonal Challenges** - Time-boxed challenges with exclusive badges
9. **Social Badges** - "100 followers", "50 likes" achievements
10. **Retroactive Awards** - Seed gamification_events from existing plant/watering data

### Defer
- **Competitive Challenges**: Too complex, risks toxicity
- **XP Decay**: Punitive, damages retention
- **Badge Trees/Prerequisites**: Adds confusion without clear value

---

## Event Types & XP Values (Recommended)

Based on `gamification_events` schema and desired behaviors:

| Event Type | Base XP | Daily Cap | Why |
|------------|---------|-----------|-----|
| `watering_completed` | 5 | 50 | Core action, moderate reward, cap prevents spam |
| `reminder_completed` | 10 | 30 | Higher value, follows through on commitment |
| `plant_added` | 25 | 100 | One-time per plant, high value for growth |
| `post_published` | 15 | 45 | Community engagement, moderate cap |
| `like_received` | 2 | 20 | Passive reward, encourages quality posts |
| `daily_checkin` | 5 | 5 | Simple login incentive |

---

## Badge Definitions (Initial Set)

| Badge Key | Title | Description | Trigger |
|-----------|-------|-------------|---------|
| `first_plant` | First Plant | Added your first plant to the collection | `plant_added` count = 1 |
| `green_thumb` | Green Thumb | Caring for 10 plants | `plant_added` count = 10 |
| `plant_parent` | Plant Parent | Caring for 25 plants | `plant_added` count = 25 |
| `botanist` | Botanist | Caring for 50 plants | `plant_added` count = 50 |
| `streak_7` | Week Warrior | 7-day watering streak | `watering_streak` = 7 |
| `streak_30` | Monthly Master | 30-day watering streak | `watering_streak` = 30 |
| `first_post` | Community Sprout | Published your first post | `post_published` count = 1 |
| `social_butterfly` | Social Butterfly | Received 50 likes on posts | `like_received` total = 50 |
| `early_bird` | Early Bird | Logged in 7 days in a row | `daily_checkin` streak = 7 |
| `challenger` | Challenger | Completed 10 daily challenges | `challenge_progress` completed = 10 |

---

## Level Titles (Recommended)

| Level Range | Title | Why |
|-------------|-------|-----|
| 1-5 | Seedling | Starting the journey |
| 6-10 | Sprout | Growing knowledge |
| 11-20 | Gardener | Regular care habits |
| 21-35 | Plant Parent | Dedicated caretaker |
| 36-50 | Green Thumb | Expert care skills |
| 51-75 | Horticulturist | Advanced knowledge |
| 76-100 | Botanist | Master level |

---

## Sources

- **Codebase Analysis**: `types/gamification.ts`, `services/gamificationService.ts`, `stores/gamificationStore.ts`, `supabase/migrations/004_gamification_system.sql` (HIGH confidence - actual implementation)
- **Project Context**: `.planning/PROJECT.md` v3.0 milestone goals (HIGH confidence - source of truth)
- **Gamification Best Practices**: Training knowledge (MEDIUM confidence - general patterns, not plant-app specific)
- **Competitor Gap Analysis**: PictureThis and Planta lack gamification based on training knowledge (LOW confidence - needs verification with current app versions)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Existing Infrastructure | HIGH | Reviewed actual code and schema |
| Event Types & XP Values | MEDIUM | Reasonable defaults, may need tuning based on analytics |
| Badge Definitions | MEDIUM | Need user feedback on which badges feel meaningful |
| Anti-Features | MEDIUM | Based on general gamification pitfalls, plant-specific risks may differ |
| Competitor Analysis | LOW | Cannot verify current competitor features without web search |
| Leaderboard Mechanics | MEDIUM | Standard implementation, privacy/scale considerations need testing |

---

## Open Questions for Phase-Specific Research

1. **XP Economy Balance**: What XP values feel rewarding without making levels trivial? Need playtesting with real users.

2. **Leaderboard Privacy**: Should leaderboard be opt-in (default hidden) or opt-out (default visible)? Privacy-conscious users may avoid gamification entirely if forced visibility.

3. **Badge Notification Timing**: Batch badge unlocks at day end vs immediate? Immediate feels more rewarding but risks spam.

4. **Retroactive Award Scope**: How far back to seed data? v2.0 launch (community) or v1.0 launch (first plant)? Large seed may overwhelm new users comparing to veterans.

5. **Pro XP Multiplier Value**: 1.5x? 2x? Need to balance Pro value vs fairness perception.

---

*Last updated: 2026-03-09*
*Researcher: GSD Project Research Agent*
*Mode: Ecosystem Research - Gamification 2.0 Features*
