---
phase: 01-foundation-and-core-loop
plan: 09
subsystem: ui
tags: [react-native, expo-router, zustand, flatlist, grid, collection]

# Dependency graph
requires:
  - phase: 01-03
    provides: usePlantsStore with persist middleware (SavedPlant state)
provides:
  - Home screen with plant collection grid/list view
  - PlantGrid component with 2-col grid / 1-col list toggle, sorted newest first
  - PlantCard component with photo, display name, location, and detail navigation
  - Empty state with CTA and camera FAB
affects:
  - Phase 2 (watering badges on cards)
  - Any plan adding plants to collection

# Tech tracking
tech-stack:
  added: []
  patterns:
    - FlatList with key={viewMode} to force remount on numColumns change
    - Display name resolution: nickname > commonName > scientificName > species
    - Sort by addedDate descending without mutating source array (spread copy)

key-files:
  created:
    - components/PlantCard.tsx
    - components/PlantGrid.tsx
  modified:
    - app/(tabs)/index.tsx

key-decisions:
  - "PlantCard display name priority: nickname > commonName > scientificName > species"
  - "FlatList key={viewMode} used to force remount when switching grid/list column count"
  - "Sort applied inside PlantGrid via spread copy to avoid mutating store state"

patterns-established:
  - "Card component: base card style + conditional grid/list variant styles for layout"
  - "Home screen: conditional render — onboarding gate first, then empty vs. collection"

requirements-completed:
  - COLL-01
  - COLL-02
  - COLL-03
  - COLL-04
  - COLL-05
  - COLL-06
  - UI-01

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 1 Plan 9: Home Screen Collection Summary

**Plant collection home screen with 2-col grid / 1-col list toggle, empty state + camera FAB, and sorted PlantCard navigation to detail screen**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-19T18:25:43Z
- **Completed:** 2026-02-19T18:27:42Z
- **Tasks:** 1 of 2 (task 2 is checkpoint:human-verify)
- **Files modified:** 3

## Accomplishments
- Replaced placeholder Home screen with full usePlantsStore-backed collection view
- PlantGrid component: grid/list icon toggle, FlatList with correct numColumns switching, sorted newest-first
- PlantCard component: thumbnail photo, display name, location row with pin icon, router.push to detail
- Empty state: leaf icon, "You haven't saved any plants yet", "Identify your first plant!" CTA, green camera button
- Camera FAB (position:absolute bottom-right) on collection view for quick access
- TypeScript clean (npx tsc --noEmit)

## Task Commits

1. **Task 1: Build home screen with collection grid/list and empty state** - `7cc16ff` (feat)

**Plan metadata:** `21d2ca1` (docs: complete plan)

## Files Created/Modified
- `app/(tabs)/index.tsx` - Home screen: onboarding gate, empty state with CTA, collection view with FAB
- `components/PlantGrid.tsx` - FlatList grid/list toggle, icon-based toggle buttons, sort newest-first
- `components/PlantCard.tsx` - Plant card with photo, display name, location, navigation to /plant/[id]

## Decisions Made
- Display name resolution order: nickname > commonName > scientificName > species (covers all SavedPlant field combinations)
- FlatList `key={viewMode}` forces full remount when toggling grid/list to handle numColumns change correctly
- Sort via spread copy `[...plants].sort(...)` to avoid mutating Zustand state array

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error in PlantCard style array references**
- **Found during:** Task 1 (PlantCard implementation)
- **Issue:** Initial implementation used `styles.photo` and `styles.info` as base in array but these keys were never defined in StyleSheet; TypeScript caught `TS2339` errors
- **Fix:** Removed non-existent base style references; used conditional ternary directly: `style={isGrid ? styles.gridPhoto : styles.listPhoto}`
- **Files modified:** components/PlantCard.tsx
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** 7cc16ff (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for TypeScript correctness. No scope creep.

## Issues Encountered
None beyond the TypeScript style key error resolved above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Home screen complete with grid/list collection, empty state, FAB, and detail navigation
- Watering badges on cards deferred to Phase 2 (per CONTEXT.md deferred list)
- All COLL and UI-01 requirements satisfied

---
*Phase: 01-foundation-and-core-loop*
*Completed: 2026-02-19*
