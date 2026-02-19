---
phase: 01-foundation-and-core-loop
plan: 05
subsystem: ui
tags: [i18n, settings, react-native, expo-router, zustand, i18next, privacy]

# Dependency graph
requires:
  - phase: 01-02
    provides: i18n system (initI18n, changeLanguage, translation resources en/it)
  - phase: 01-03
    provides: settingsStore Zustand store with language persistence
provides:
  - i18n initialized on app startup before splash screen hides
  - Settings tab in tab bar (gear icon)
  - Language switcher (EN/IT) with live i18n change
  - PlantNet attribution text in Settings
  - Privacy policy screen with local-only data explanation
affects:
  - All future screens that use translations
  - Any screen that links to Settings or Privacy

# Tech tracking
tech-stack:
  added: []
  patterns:
    - i18n init in root layout using useState gate to delay splash screen
    - TouchableOpacity language switcher as SegmentedControl substitute
    - Stack.Screen registration for modal-style screens (privacy) in root layout

key-files:
  created:
    - app/(tabs)/settings.tsx
    - app/privacy.tsx
  modified:
    - app/_layout.tsx
    - app/(tabs)/_layout.tsx
    - stores/settingsStore.ts
    - components/ExternalLink.tsx
    - i18n/index.ts

key-decisions:
  - "Use TouchableOpacity buttons for language switcher — @react-native-community/segmented-control not installed"
  - "Gate splash screen on both fonts loaded AND i18n ready to prevent untranslated flash"
  - "Register privacy as a Stack.Screen in root layout for back-button navigation"

patterns-established:
  - "Async init pattern: useState flag + useEffect + error fallback, gate SplashScreen.hideAsync on both fonts and i18n"
  - "Language switcher: TouchableOpacity pair with tint background on active, white text"

requirements-completed: [I18N-03, UI-05, LEGAL-02]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 1 Plan 05: Settings Screen and i18n Init Summary

**Settings screen with EN/IT language switcher, PlantNet attribution, and privacy policy; i18n initialized in root layout before splash screen hides**

## Performance

- **Duration:** 3 min (160s)
- **Started:** 2026-02-19T17:51:57Z
- **Completed:** 2026-02-19T17:54:57Z
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments

- i18n (i18next) now initializes before the splash screen hides, using a `useState` gate so the app never shows untranslated strings on first render
- Settings tab added to tab bar with gear icon; settings screen has live EN/IT language switcher powered by `useSettingsStore` + `changeLanguage`
- Privacy policy screen created explaining local-only data storage and Pl@ntNet API usage; accessible from Settings via `Link href="/privacy"`

## Task Commits

1. **Task 1: Initialize i18n in root layout and create Settings screen with privacy link** - `edef590` (feat)

**Plan metadata:** _(pending docs commit)_

## Files Created/Modified

- `app/_layout.tsx` - Added `initI18n()` call with `i18nReady` state gate before `SplashScreen.hideAsync()`; registered `privacy` as Stack.Screen
- `app/(tabs)/_layout.tsx` - Added Settings tab with `FontAwesome` gear icon
- `app/(tabs)/settings.tsx` - Settings screen with language switcher (TouchableOpacity), PlantNet attribution, and privacy link (159 lines)
- `app/privacy.tsx` - Privacy policy screen explaining local-only data and Pl@ntNet API usage (86 lines)
- `stores/settingsStore.ts` - Added `syncI18n()` helper that calls `changeLanguage` with stored language
- `components/ExternalLink.tsx` - Removed unused `@ts-expect-error` (types improved in newer expo-router)
- `i18n/index.ts` - Fixed `compatibilityJSON: 'v3'` -> `'v4'` for i18next v25 compatibility

## Decisions Made

- Used `TouchableOpacity` buttons for language switcher since `@react-native-community/segmented-control` is not in the project dependencies
- Splash screen gate waits for both `loaded` (fonts) AND `i18nReady` to avoid a flash of untranslated UI
- Privacy screen registered as a `Stack.Screen` in root layout (not in tabs) so it gets proper back navigation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Language switcher using TouchableOpacity instead of SegmentedControl**
- **Found during:** Task 1 (settings.tsx creation)
- **Issue:** Plan specified `SegmentedControl` but `@react-native-community/segmented-control` is not installed and not in package.json
- **Fix:** Implemented equivalent UI using two `TouchableOpacity` buttons with active-state tint background color
- **Files modified:** `app/(tabs)/settings.tsx`
- **Verification:** TypeScript compiles; language switcher visually equivalent and functionally identical
- **Committed in:** edef590 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed i18next compatibilityJSON version**
- **Found during:** Task 1 (TypeScript verification)
- **Issue:** `compatibilityJSON: 'v3'` is not assignable to `'v4'` in i18next v25 types — caused `tsc --noEmit` to fail
- **Fix:** Changed `compatibilityJSON: 'v3'` to `'v4'` in `i18n/index.ts`
- **Files modified:** `i18n/index.ts`
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** edef590 (Task 1 commit)

**3. [Rule 1 - Bug] Removed unused @ts-expect-error in ExternalLink.tsx**
- **Found during:** Task 1 (TypeScript verification)
- **Issue:** `@ts-expect-error` directive on a line where TypeScript no longer reports an error (newer expo-router types allow string hrefs) — caused `TS2578` error
- **Fix:** Removed the unused `@ts-expect-error` comment line
- **Files modified:** `components/ExternalLink.tsx`
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** edef590 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** All auto-fixes necessary for compilation or functionality. No scope creep. The language switcher is functionally identical to SegmentedControl.

## Issues Encountered

None — TypeScript errors were pre-existing and fixed inline as part of making `tsc --noEmit` pass (the plan's own verification requirement).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- i18n initialized system-wide; all screens can use `useTranslation()` without additional setup
- Settings and Privacy screens ready for use from any navigation context
- Language persistence working: user preference stored in AsyncStorage, restored on next launch
- Ready for Plan 06 (camera/identification screen)

---
*Phase: 01-foundation-and-core-loop*
*Completed: 2026-02-19*
