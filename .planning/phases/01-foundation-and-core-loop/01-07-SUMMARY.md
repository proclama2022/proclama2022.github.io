---
phase: 01-foundation-and-core-loop
plan: 07
subsystem: ui
tags: [expo-camera, expo-image-picker, react-native, camera, permissions, modal, tab-navigation]

# Dependency graph
requires:
  - phase: 01-01
    provides: plantnet service (identifyPlant), types (OrganType)
  - phase: 01-02
    provides: i18n, settingsStore (language preference)
  - phase: 01-03
    provides: Zustand stores foundation
provides:
  - Tab bar navigation: Home, Camera, Settings
  - Full-screen camera screen with live CameraView
  - Gallery picker via launchImageLibraryAsync
  - Post-capture preview confirm flow
  - OrganSelector modal (leaf/flower/fruit/bark/auto)
  - identifyPlant integration in camera flow
  - Loading state while identification runs
affects:
  - 01-08 (results screen - receives imageUri + organ + data params from camera)
  - 01-09 (collection screen - Home tab destination)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Multi-step camera flow: camera -> preview -> organ-selector -> identify -> results
    - Conditional render pattern for screen state machine (camera/preview/organ/identifying)
    - CameraView ref as useRef<CameraView> (class component, not CameraViewRef interface)
    - Tab layout with href:null to hide legacy screens without deleting files

key-files:
  created:
    - app/(tabs)/camera.tsx
    - components/OrganSelector.tsx
    - components/PreviewConfirm.tsx
  modified:
    - app/(tabs)/_layout.tsx

key-decisions:
  - "Camera screen calls identifyPlant directly and passes serialised response to /results via router params"
  - "CameraViewRef is wrong type for useRef — must use useRef<CameraView> (class component ref)"
  - "takePictureAsync is the correct method name (not takePicture) on CameraView class"
  - "OrganSelector shown after PreviewConfirm, not immediately after capture — user sees preview first"
  - "Legacy 'two' tab hidden with href:null rather than deleted (avoids file deletion risk)"

patterns-established:
  - "Screen state machine with union type: 'camera' | 'preview' | 'organ' | 'identifying'"
  - "Identifying loading state shows blurred captured image behind overlay"
  - "OrganSelector as bottom-sheet style Modal with transparent overlay and slide animation"
  - "PreviewConfirm as full-screen overlay with image + retake/confirm buttons at bottom"

requirements-completed: [ID-01, ID-02, ID-03, UI-03]

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 1 Plan 07: Camera and Tab Layout Summary

**Full-screen camera with CameraView, separate gallery button, organ selector modal (5 types), and preview-confirm flow before identifyPlant API call**

## Performance

- **Duration:** 4 min (232s)
- **Started:** 2026-02-19T18:00:58Z
- **Completed:** 2026-02-19T18:04:50Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- Updated tab layout to Home / Camera / Settings with Ionicons; hid legacy 'two' tab
- Full-screen CameraView with flip button and corner-bracket viewfinder guide
- Separate shutter button and gallery button (launchImageLibraryAsync)
- Camera permission handling with friendly denial screen
- PreviewConfirm component: full-screen image with Retake / Use Photo buttons
- OrganSelector bottom-sheet modal: leaf, flower, fruit, bark, auto-detect with icons and descriptions
- identifyPlant called in camera screen after organ selection with loading overlay
- Navigation to /results with imageUri, organ, lang, and serialised PlantNet response

## Task Commits

1. **Task 1: Update tab layout and build camera screen** - `767b8e1` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `app/(tabs)/_layout.tsx` - Three-tab layout (Home/Camera/Settings) with Ionicons, hides legacy 'two' tab
- `app/(tabs)/camera.tsx` - Full-screen camera with state machine, permissions, capture, gallery, identify flow
- `components/OrganSelector.tsx` - Bottom-sheet Modal with 5 organ options (leaf/flower/fruit/bark/auto)
- `components/PreviewConfirm.tsx` - Full-screen image preview with retake/confirm controls

## Decisions Made
- Camera screen calls `identifyPlant` directly and passes serialised response as JSON string in router params to `/results` — results screen does not re-call the API
- `useRef<CameraView>` is the correct type (CameraView is a class component); `CameraViewRef` is an internal type not suitable for the public ref interface
- OrganSelector appears after user taps "Use Photo" in PreviewConfirm (not immediately post-capture) so user can review image before committing to organ type
- Legacy `two` tab file left on disk but hidden with `href: null` in Tabs.Screen

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CameraViewRef type mismatch**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** Plan pseudocode used `useRef<CameraViewRef>` and imported `CameraViewRef` — TypeScript error because `CameraViewRef` is not assignable to `Ref<CameraView>`. The public ref for `CameraView` must be `useRef<CameraView>` (class component ref).
- **Fix:** Changed `useRef<CameraViewRef>(null)` to `useRef<CameraView>(null)` and removed `CameraViewRef` from import
- **Files modified:** `app/(tabs)/camera.tsx`
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** `767b8e1` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added identifying loading state**
- **Found during:** Task 1 (identifyPlant integration)
- **Issue:** Plan had no loading UI for while API call runs (could take 2-5s); without it the screen appears frozen
- **Fix:** Added `'identifying'` to ScreenState union; shows blurred captured image with overlay text during API call
- **Files modified:** `app/(tabs)/camera.tsx`
- **Verification:** TypeScript passes; state transitions correctly
- **Committed in:** `767b8e1` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both auto-fixes required for correctness. No scope creep.

## Issues Encountered
None beyond the TypeScript type fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Camera flow complete end-to-end: capture -> preview -> organ select -> identify -> navigate to /results
- Plan 08 (results screen) receives params: `imageUri`, `organ`, `lang`, `success`, `error`, `data` (JSON)
- Plan 09 (collection/home screen) needs Home tab to show saved plants

## Self-Check: PASSED

- FOUND: app/(tabs)/_layout.tsx
- FOUND: app/(tabs)/camera.tsx
- FOUND: components/OrganSelector.tsx
- FOUND: components/PreviewConfirm.tsx
- FOUND: .planning/phases/01-foundation-and-core-loop/01-07-SUMMARY.md
- FOUND commit: 767b8e1

---
*Phase: 01-foundation-and-core-loop*
*Completed: 2026-02-19*
