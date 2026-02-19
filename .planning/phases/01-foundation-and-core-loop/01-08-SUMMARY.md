---
phase: 01-foundation-and-core-loop
plan: 08
subsystem: ui
tags: [react-native, expo-router, flatlist, i18next, zustand, plantnet, care-db]

# Dependency graph
requires:
  - phase: 01-01
    provides: identifyPlant service, cache service (getCachedResult/setCachedResult)
  - phase: 01-02
    provides: i18n setup (useTranslation, en/it keys for results.*)
  - phase: 01-03
    provides: Zustand plantsStore (addPlant, SavedPlant type)
  - phase: 01-04
    provides: careDB service (getCareInfo, PlantCareInfo)
  - phase: 01-07
    provides: camera screen that calls identifyPlant and routes to /results with serialised data
provides:
  - Results screen (app/results.tsx) displaying plant identification cards
  - ResultsCarousel component with FlatList pagingEnabled + pagination dots
  - ResultCard component with photo, confidence bar, care expand, add button
  - PlantNet attribution on results screen (LEGAL-01)
affects:
  - 01-09 (collection/home screen — plants added via ResultCard appear here)
  - 01-10 (plant detail screen — SavedPlant records created by ResultCard)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - FlatList pagingEnabled carousel with pagination dots (no third-party carousel lib)
    - Confidence bar using percentage width + threshold color (green/yellow/red)
    - Results bootstrapped from camera screen serialised params, then cache, then API

key-files:
  created:
    - app/results.tsx
    - components/Results/ResultsCarousel.tsx
    - components/Results/ResultCard.tsx
  modified:
    - app/_layout.tsx

key-decisions:
  - "Phase 01-08: Use FlatList pagingEnabled for results carousel — react-native-snap-carousel@3.9.1 (installed by npm) is incompatible with React Native 0.81 New Architecture (Fabric). Matches onboarding carousel precedent from Phase 01-06."
  - "Phase 01-08: Results bootstrapped from camera screen serialised params (fast path) then cache then API — avoids duplicate API call on screen mount"
  - "Phase 01-08: ResultCard uses local added state for instant UI feedback on Add to Collection; no toast/modal needed at this stage"

patterns-established:
  - "Carousel pattern: FlatList + pagingEnabled + viewabilityConfig + PaginationDots — reuse for any swipeable card lists"
  - "Care info pattern: getCareInfo(scientificName) with bilingual tips, falls back to careComingSoon i18n key"
  - "Confidence pattern: score * 100 as percentage width, three color thresholds (>=0.8 green, >=0.5 yellow, <0.5 red)"

requirements-completed: [ID-04, ID-05, ID-06, ID-07, CARE-01, UI-04, LEGAL-01]

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 1 Plan 08: Results Screen Summary

**Swipeable results carousel with confidence bars, expandable care info, low-confidence warnings, and Add to Collection button backed by careDB and Zustand plantsStore**

## Performance

- **Duration:** 294s (~5 min)
- **Started:** 2026-02-19T12:07:32Z
- **Completed:** 2026-02-19T12:12:26Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- Results screen receives serialised PlantNet data from camera screen (fast path), falls back to cache check then API call
- ResultsCarousel renders each PlantNetResult as a swipeable card with pagination dots indicator
- ResultCard shows plant photo, scientific name, common names, family, animated confidence bar (green >=80%, yellow >=50%, red <50%), low-confidence warning banner when score <50%
- Expandable care section calls getCareInfo(scientificName) from static careDB — displays watering frequency, sunlight, temperature, difficulty, toxic-to-pets flag, and bilingual tip text; shows "coming soon" fallback when species not in DB
- Add to Collection button creates SavedPlant and calls addPlant from Zustand plantsStore; button state updates to "Added" immediately
- PlantNet attribution visible on every results view (LEGAL-01 satisfied)
- TypeScript compiles cleanly, results screen registered in root Stack layout

## Task Commits

Each task was committed atomically:

1. **Task 1: Build results screen with carousel, care info, and save button** - `7f82947` (feat)

**Plan metadata:** pending

## Files Created/Modified

- `app/results.tsx` - Results screen with loading/error states, param parsing, cache + API fallback, carousel, attribution (301 lines)
- `components/Results/ResultsCarousel.tsx` - FlatList pagingEnabled carousel with pagination dots (139 lines)
- `components/Results/ResultCard.tsx` - Card with photo, confidence bar, care expand, toxic warning, Add to Collection (426 lines)
- `app/_layout.tsx` - Added results Stack.Screen with headerShown: false

## Decisions Made

- **react-native-snap-carousel replaced with FlatList pagingEnabled**: npm resolves snap-carousel to v3.9.1 (2019) which uses the legacy RN bridge and is incompatible with React Native 0.81 New Architecture (Fabric/JSI). Using built-in FlatList matches the established pattern from Phase 01-06 (ScrollView pagingEnabled for onboarding carousel).
- **Fast-path results from camera params**: Camera screen (01-07) already called identifyPlant and serialised the response into router params. Results screen consumes these directly rather than making a second API call. Cache and API fallback paths handle edge cases where params are absent.
- **Local `added` state for Add to Collection feedback**: ResultCard tracks added state locally for immediate button UX. No toast/modal required at this stage — collection count on Home tab serves as confirmation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Compatibility] Replaced react-native-snap-carousel with FlatList pagingEnabled**
- **Found during:** Task 1 (install attempt)
- **Issue:** `npm install react-native-snap-carousel` resolves to v3.9.1 (2019), which uses the legacy RN bridge architecture and is incompatible with RN 0.81 + New Architecture (Fabric). Installing it would add a broken dependency.
- **Fix:** Implemented carousel using React Native's built-in `FlatList` with `pagingEnabled`, `snapToAlignment`, `viewabilityConfig`, and custom `PaginationDots` component. Identical user-visible behaviour: swipeable cards with dots indicator.
- **Files modified:** `components/Results/ResultsCarousel.tsx` (implementation only, no package.json change)
- **Verification:** TypeScript compiles cleanly; no new dependencies added
- **Committed in:** `7f82947` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - compatibility/bug)
**Impact on plan:** Necessary to avoid broken dependency. User-visible behaviour is identical. No scope creep.

## Issues Encountered

- `useLocalSearchParams<T>` requires all values to be `string` type (expo-router constraint) — fixed generic type alias on first TypeScript pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Results screen complete; plants added via Add to Collection button land in Zustand plantsStore
- Plan 09 (Home/Collection screen) can now display saved plants from plantsStore
- No blockers

---
*Phase: 01-foundation-and-core-loop*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: app/results.tsx
- FOUND: components/Results/ResultsCarousel.tsx
- FOUND: components/Results/ResultCard.tsx
- FOUND: app/_layout.tsx (modified)
- FOUND: commit 7f82947
