---
phase: 13-light-meter
plan: "05"
subsystem: light-meter
tags: [navigation, ux, ios-smoothing, care-tab, i18n]
dependency_graph:
  requires:
    - 13-03 (light meter screen at /light-meter)
    - 13-02 (cameraLightEstimator service)
  provides:
    - CareTab navigation entry point to light meter
    - iOS 4-sample moving average smoothing
  affects:
    - components/Detail/CareTab.tsx
    - services/cameraLightEstimator.ts
    - i18n translations
tech_stack:
  added: []
  patterns:
    - Module-level rolling buffer for moving average smoothing
    - expo-router push navigation from care tab
    - Pill-shaped tinted button matching app accent color
key_files:
  created: []
  modified:
    - components/Detail/CareTab.tsx
    - services/cameraLightEstimator.ts
    - i18n/resources/en.json
    - i18n/resources/it.json
decisions:
  - "measureLightButton styled as pill with colors.tint alpha background — matches existing inlineChip pattern in same file"
  - "resetIosSmoothing exported for caller to clear stale buffer between sessions"
  - "Button placed only in managed-plant main return path, not sighting path"
metrics:
  duration_seconds: 140
  completed_date: "2026-03-04"
  tasks_completed: 3
  files_modified: 4
---

# Phase 13 Plan 05: Light Meter Gap Closure (Navigation + iOS Smoothing) Summary

**One-liner:** CareTab pill button navigating to /light-meter plus 4-sample moving average on iOS camera estimator closes last two functional gaps of Phase 13.

## What Was Built

### Navigation entry point (Task 1 + 2)

Added a pill-shaped "Measure Light" button inside the Light `SectionCard` of `CareTab`. The button uses the app accent color (`colors.tint`) with 14% alpha background and 19% alpha border to create a subtle but clearly interactive element. Tapping it pushes `/light-meter` via `expo-router`. EN and IT translations added under `lightMeter.measureLight`.

The button appears only on the managed-plant path (not sightings, not empty-care), consistent with the plan requirement.

### iOS smoothing (Task 3)

Added a module-level `iosReadingsBuffer: number[]` and `IOS_SMOOTHING_SAMPLES = 4` constant to `services/cameraLightEstimator.ts`. `estimateLuxFromFrame` now pushes each calibrated lux value into the buffer, trims to the last 4 samples, and returns the moving average. A new exported `resetIosSmoothing()` function clears the buffer so stale values from a previous session do not contaminate the next measurement.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 8c1d21a | feat(13-05): add measureLight translations for light meter navigation button |
| 2 | 1bf17e9 | feat(13-05): add Measure Light navigation button to CareTab light section |
| 3 | 92dc1b9 | feat(13-05): apply 4-sample moving average smoothing to iOS camera estimator |

## Verification Results

| Check | Result |
|-------|--------|
| `router.push('/light-meter')` in CareTab | PASS (line 307) |
| `measureLight` in en.json | PASS — "Measure Light" |
| `measureLight` in it.json | PASS — "Misura la Luce" |
| `iosReadingsBuffer` in cameraLightEstimator (≥3 lines) | PASS (6 occurrences) |
| TypeScript errors in modified files | NONE |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All files confirmed present on disk. All three task commits confirmed in git history.
