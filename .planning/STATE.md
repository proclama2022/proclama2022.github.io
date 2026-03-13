---
gsd_state_version: 1.0
milestone: v3.1
milestone_name: Gap Closure
status: planning
last_updated: "2026-03-13T12:00:00.000Z"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Free, subscription-free plant identification with species-specific care guidance
**Current focus:** v3.1 Gap Closure — Level Titles, XP Bar, Remaining Badges

## Current Position

phase: —
plan: —
status: Defining requirements
last_activity: 2026-03-13 — Milestone v3.1 started

Progress: [░░░░░░░░░░] 0% (Requirements definition)

## Milestone Goals

Chiudere tutti i gap rimanenti da v3.0 Gamification 2.0:
- Level Titles — Display in profile, leaderboard, level-up toast
- XP Progress Bar — Visual progress in profile header
- Green Thumb Badge — 7-day watering streak
- Weekend Warrior Badge — Complete all weekend care tasks

## Performance Metrics

**Velocity:**
- Total plans completed: 37 (v1.0-v1.3)
- Average duration: -- min
- Total execution time: -- hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1-10 (v1.0-v1.3) | 37 | -- | -- |
| 11-14 (v2.0) | 18 | - | - |
| 15 (v2.1) | 2 | - | - |

**Recent Trend:**
- Last 5 plans: -- (new milestone)
- Trend: Stable

*Updated after each plan completion*
| Phase 11 P01 | 272 | 5 tasks | 6 files |
| Phase 11 P02 | 18 | 5 tasks | 2 files |
| Phase 11 P03 | 25 | 5 tasks | 5 files |
| Phase 11 P04 | 3 | 5 tasks | 2 files |
| Phase 11 P05 | 413 | 6 tasks | 5 files |
| Phase 07-search-filter P01 | 1 | 2 tasks | 4 files |
| Phase 07-search-filter P02 | 2 | 2 tasks | 1 files |
| Phase 07-search-filter P02 | 2 | 3 tasks | 1 files |
| Phase 08 P01 | 12 | 3 tasks | 3 files |
| Phase 08-statistics-dashboard P02 | 1 | 2 tasks | 1 files |
| Phase 09-care-calendar P01 | 5 | 1 tasks | 1 files |
| Phase 10 P01 | 192 | 2 tasks | 3 files |
| Phase 10 P02 | 5 | 1 tasks | 1 files |
| Phase 12 P01 | 63 | 5 tasks | 5 files |
| Phase 12 P02 | 4 | 5 tasks | 7 files |
| Phase 12 P03 | 2 | 5 tasks | 5 files |
| Phase 12 P04 | 3 | 2 tasks | 5 files |
| Phase 12 P05 | 1 | 5 tasks | 5 files |
| Phase 13-light-meter P01 | 164 | 3 tasks | 3 files |
| Phase 13-light-meter P02 | 7 | 4 tasks | 3 files |
| Phase 13-light-meter P03 | 4 | 4 tasks | 5 files |
| Phase 13-light-meter P03 | 4 | 5 tasks | 5 files |
| Phase 13-light-meter P04 | 1 | 1 tasks | 1 files |
| Phase 13-light-meter P05 | 140 | 3 tasks | 4 files |
| Phase 14 P02 | 10 | 4 tasks | 6 files |
| Phase 15 P01 | -- | 8 tasks | 6 files |
| Phase 15 P02 | -- | 4 tasks | 4 files |
| Phase 17 P03 | 360 | 5 tasks | 5 files |
| Phase 17 P04 | 327 | 6 tasks | 5 files |
| Phase 17 P05 | 464 | 5 tasks | 7 files |
| Phase 18 P03 | 360 | 4 tasks | 5 files |
| Phase 19 P01 | 180 | 7 tasks | 8 files |
| Phase 19 P02 | 900 | 5 tasks | 6 files |
| Phase 20 P00 | 84 | 2 tasks | 2 files |
| Phase 21 P01 | 5 | 2 tasks | 2 files |
| Phase 21 P02 | 3 | 2 tasks | 3 files |
| Phase 21 P03 | 427 | 4 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- (Phase 1-10): v1.x architecture established AsyncStorage + Zustand for offline-first plant tracking
- (v2.0 kickoff): Supabase selected as backend platform for community features (parallel to existing local storage, not replacement)
- (v2.0 research): Auth to remain OPTIONAL for all v1.x features to preserve offline-first experience
- (11-01): Lazy initialization pattern for Supabase client—prevents blocking app launch, preserves offline-first
- (11-01): Expo SecureStore for session persistence—encrypted storage (iOS Keychain, Android Keystore) required for App Store
- (15-01): Use Open-Meteo API (free, no key) and store location locally for privacy.
- (15-02): Use simple heuristics (Rain > 5mm, Temp > 30°C) for climate advice; display in WeatherWidget.
- (17-01): Separate tables for tiers/cohorts/memberships for league flexibility; extended user_progress with league_tier and timezone.
- (17-02): Used RPC fallback pattern for getLeagueLeaderboard; extended gamificationStore with league_promotion/relegation event types with metadata.
- (17-03): League UI uses emoji tier badges, zone colors as transparent tints, tab navigation in gamification hub
- (17-04): pg_cron scheduled at Sunday 00:00 UTC for weekly promotion; confetti with tier-colored particles on promotion
- (17-05): Wave 0 tests for all 7 LEAG requirements; league badge in PostCard (non-Bronze only) and ProfileStats (all tiers)
- (18-01): 6 new achievement badges with server-side progress calculation via get_badge_progress RPC; BadgeProgress type and getBadgeProgress service
- [Phase 18-02]: Gamification triggers use fire-and-forget pattern to never block core UX
- [Phase 18-02]: Disease detection uses keyword matching in PlantNet common names
- [Phase 18]: Updated gamification.tsx instead of GamificationStats.tsx for badge progress wiring (BadgeGrid is rendered in gamification.tsx)
- [Phase 19-02]: Streak freeze: 1/week free, auto-apply on missed day, timezone-aware calculation, weekly pg_cron reset Sunday 00:00 UTC
- [Phase 20-00]: TDD Wave 0 test scaffolds for CelebrationOverlay and gamificationStore cooldown logic
- [Phase 21-01]: Compact XP bar placed between displayName and bio in profile header; 4px progress bar height for compact sizing; TouchableOpacity with activeOpacity 0.7 for button feel
- [Session 2026-03-12]: Completed 21-01 (Compact XP Progress Bar) in 5 minutes; 2 tasks, 2 files, 2 commits
- [Phase 21-01]: Compact XP bar placed between displayName and bio in profile header; 4px progress bar height for compact sizing; TouchableOpacity with activeOpacity 0.7 for button feel
- [Phase 21-02]: Weekly streak calendar with 7-day visualization using Italian weekday labels (L-D), completed days as filled circles, current day double-border highlight, freeze days with snowflake emoji (❄️), and stats row showing streak count + freeze remaining
- [Phase 21]: Empty state only in vertical mode to avoid breaking existing horizontal BadgeGrid usages
- [Phase 21]: i18n for all user-facing strings - changed hardcoded 'View Full Profile' to use i18n
- [Phase 21]: League tier optional in PostWithAuthor type to handle users without gamification data
- [Phase 21]: BadgeGrid uses flexWrap with gap for 4-column vertical layout
