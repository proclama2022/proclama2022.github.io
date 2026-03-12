---
phase: 20
title: Celebrations
plan: 01
requires:
  - phase: 19-01
    provides: Level titles system, gamification store, toast queue
provides:
  - Confetti animations for badge unlock and level-up
  - Haptic feedback during celebrations
  - Non-blocking UI with auto-dismiss
  - Cooldown prevents spam (3s between celebrations)
affects: [gamification-toast-host, gamification-stats-ui]
---

# Dependency graph
requires:
  - phase: 19-01
    provides: Level titles system, getLevelTitle(), i18n translations foundation
provides:
  - Streak freeze system with 1 freeze/week (free feature)
  - Timezone-aware streak calculation
  - Auto-apply streak freeze when user misses a day
  - Weekly reset via pg_cron (Sunday 00:00 UTC)
  - Freeze indicator UI in GamificationStats
  - i18n translations for streak freeze
affects: [gamification-service, user-progress, gamification-stats-ui]
---

phase: 20 implements the celebration system for gamification events.

 This:
- Badge unlock confetti
- Level-up confetti
- League promotion confetti (extend existing)
- Haptic feedback for all celebrations
- 3s auto-dismiss for non-blocking
- 3s cooldown between celebrations

---

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Confetti for all gamification celebrations (not just promotions)"
    - "Cooldown via queue delay (3s between events)"
    - "Haptic feedback on celebration trigger"
    - "Auto-dismiss after 3s with fade-out"

  modified:
    - components/GamificationToastHost.tsx
    - types/gamification.ts
    - i18n/resources/en.json
    - i18n/resources/it.json
  created: []
    - components/Gamification/Cp/CelebrationOverlay.tsx (optional, if generalizing)

---
phase: 20 - Celebrations
plan: 01
subsystem: gamification
tags: [confetti, haptics, celebration, cooldown, toast]
---

# Gray areas to discuss

1. Which events deserve confetti?
2. What confetti intensity?
3. How to handle celebration spam?

4. Should we use one generic component or keep specialized components?

## Discussion Summary

 See end of this document for detailed notes.

 below are the context-aware gray areas the resulting from this phase.

 decisions made for each.

 along with relevant code context from prior phases.

### Decisions Made

1. **Confetti events:** Badge unlock + Level-up + League promotion (all three)
   - Rationale: User wants all gamification milestones celebrated equally
   - Implementation: Extend existing pattern to all three events

2. **Confetti intensity:** Party mode (100 particles)
   - Count: 100 confetti
   - colors: Gold (#FFD700), Silver (#C0C0C1), Diamond (#B9F2FF), Platinum (#E5E4E2), Bronze (#CD7F32)
   - origin: Bottom center (x: -10, y: 0) - fadeOut: true
   - Note: Same colors as existing LeagueCelebration

3. **Spam handling:** Queue with 3-second debounce
   - Cooldown: 3 seconds between celebrations
   - Implementation: Add timestamp tracking to gamificationStore
   - Queue events during `enqueueToast()` and process with debounce

4. **Haptic feedback:** Success feedback for all celebrations
   - Badge/Level-up/League promotion: Haptics.notificationAsync(S)
   - League relegation: NO haptic (negative event)
   - Title change: NO haptic (informational)

5. **Auto-dismiss:** 3 seconds with fade-out
   - Toast automatically dismisses after celebration completes
   - Confetti fades out naturally

6. **Component architecture:** Generalize LeagueCelebration → CelebrationOverlay
   - Create generic CelebrationOverlay component
   - Accept event type for customization (colors, count)
   - Keep LeagueCelebration as wrapper for backward compatibility
   - Alternative: Inline confetti in GamificationToastHost

### Code Context
- react-native-confetti-cannon: Already installed
- expo-haptics: Already installed
- GamificationToastHost: Central toast manager (197 lines)
  - Handles: badge, level, league_promotion, league_relegation, title events
  - Currently triggers confetti only for league_promotion
  - Uses haptics for badge, level, promotion (NOT relegation/title)
- LeagueCelebration: Existing confetti component (79 lines)
  - Props: visible, tier, onComplete
  - 100 confetti particles
  - 3s duration + fadeOut

### Integration Notes
- Phase 18 decided "NO confetti for badges" - this plan OVERRIDES that decision
- Phase 19 decided "NO haptic for title changes" - keeping this
- Existing haptics in GamificationToastHost already work (no changes needed)
- Toast queue pattern already handles sequential display

### Requirements Mapping
- CELE-01: Badge unlock confetti ✓
- CELE-02: Level-up confetti ✓
- CELE-03: League promotion confetti ✓ (already exists)
- CELE-04: Haptic feedback ✓ (already exists)
- CELE-05: Non-blocking UI ✓ (already exists)
- CELE-06: Cooldown/debounce ✓ (this plan)

### Next Phase
- Phase 21: Gamification UI

---
*Context captured during /gsd:discuss-phase workflow.*
