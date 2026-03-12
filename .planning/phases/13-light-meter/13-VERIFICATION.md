---
phase: 13-light-meter
verified: 2026-03-04T16:00:00Z
status: gaps_found
score: 8/11 must-haves verified
re_verification: false
gaps:
  - truth: "Feature accessible from plant onboarding flow"
    status: failed
    reason: "app/light-meter.tsx exists as a routable screen (file-system based) but no navigation entry point links to it from any other screen — no href, router.push, or Link pointing to '/light-meter' found in any component outside the screen itself"
    artifacts:
      - path: "app/light-meter.tsx"
        issue: "Screen exists but is an orphaned route — not linked from plant detail, onboarding, tabs, or settings"
      - path: "app/_layout.tsx"
        issue: "Stack does not explicitly register 'light-meter' route (minor, expo-router auto-discovers it, but no navigation entry point)"
    missing:
      - "Add navigation entry point to light-meter screen from at least one existing screen (e.g., plant detail CareTab, Settings, or index)"
  - truth: "REQUIREMENTS.md requirement IDs (FEED-01 through MODR-11) are satisfied by this phase"
    status: failed
    reason: "REQUIREMENTS.md maps FEED-01, FEED-02, FEED-03, FEED-04, FEED-05, FEED-06, FEED-07, FEED-08, FEED-09, FEED-10, COMM-01 through COMM-06, LIKE-01, LIKE-02, LIKE-03, MODR-01 through MODR-11 to Phase 13. These are Community Feed requirements. The 13-light-meter phase implements a Light Meter feature ('v2.1-light-meter') — none of these community requirements are implemented or addressed by this phase."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "Phase 13 row in requirements table maps 28 community feed/moderation requirements to Phase 13, but phase 13-light-meter builds a light sensor feature. This is a requirements tracking mismatch — these IDs belong to Phase 13 (Community Feed), which is a different phase that has already been completed."
    missing:
      - "REQUIREMENTS.md needs to either: (a) clarify that '13-light-meter' and '13' are separate phases with distinct requirement ownership, or (b) add v2.1-light-meter requirement entries to the document and requirements table"
  - truth: "Smoothing algorithm reduces noise/jitter in displayed values"
    status: partial
    reason: "Weighted moving average is fully implemented in services/lightMeterService.ts and is wired through the hook on Android. However, the camera estimator on iOS does not apply any smoothing — each CameraPreview snapshot maps directly to a lux reading with no averaging. iOS readings may be noisy between frames."
    artifacts:
      - path: "services/cameraLightEstimator.ts"
        issue: "estimateLuxFromFrame() applies no smoothing — each frame snapshot produces a single-point lux estimate. No moving average applied on the iOS path."
    missing:
      - "Apply smoothing (moving average of last 3-5 readings) in CameraPreview frame processing or in useCameraLightEstimator.handleFrame"
human_verification:
  - test: "Android real-time sensor accuracy"
    expected: "On Android device with light sensor: tap Start Measurement, readings update in real time (approximately 10x/second), values change when moving device between light and dark areas, category bar indicator moves smoothly"
    why_human: "Cannot run native sensor in static analysis; requires physical Android device"
  - test: "iOS camera estimation functionality"
    expected: "On iOS device or simulator: grant camera permission, point camera at light source, lux values change as lighting changes, accuracy badge shows 'Estimate (±30%)', camera auto-stops after 30 seconds"
    why_human: "Cannot run camera in static analysis; requires physical iOS device or simulator"
  - test: "Save to Plant flow end-to-end"
    expected: "After taking a reading, tap 'Save to Plant', a modal shows list of managed plants, select a plant, measurement is saved to plant location field as formatted string (e.g., '1240 lux (medium) — 3/4/2026'), confirmation alert appears"
    why_human: "Requires running app with plants in store"
  - test: "Dark mode compatibility"
    expected: "All light meter UI elements (gauge, category bar, camera preview overlay) render correctly in dark mode with appropriate colors from useThemeColors"
    why_human: "Requires visual inspection"
  - test: "Navigation accessibility"
    expected: "User can navigate to the light meter screen from somewhere in the app (currently no entry point exists — needs manual navigation to /light-meter)"
    why_human: "Entry point gap must be confirmed as intended or as a bug before closing"
---

# Phase 13-light-meter: Light Meter Verification Report

**Phase Goal:** Implement a Light Meter feature that uses the device's ambient light sensor (Android) or camera-based estimation (iOS) to help users assess whether a location receives adequate light for their plants.
**Verified:** 2026-03-04T16:00:00Z
**Status:** GAPS FOUND
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Android devices with light sensor show real-time lux readings | VERIFIED | `services/lightMeterService.ts` uses `LightSensor.addListener({illuminance})` at 100ms interval; `hooks/useLightSensor.ts` exposes live `lux` value |
| 2 | Readings update at least 10 times per second (100ms interval) | VERIFIED | `LightSensor.setUpdateInterval(100)` in `startLightReading()` — 100ms = 10 Hz |
| 3 | Smoothing algorithm reduces noise/jitter in displayed values (Android) | VERIFIED | Weighted moving average over last 5 samples in `calculateWeightedAverage()` with weight = index+1 |
| 3b | Smoothing algorithm applied on iOS camera path | PARTIAL | No smoothing in `estimateLuxFromFrame()` or `useCameraLightEstimator.handleFrame` — each snapshot is a single point estimate |
| 4 | Devices without sensor gracefully fallback to camera estimation | VERIFIED | `Platform.OS !== 'android'` guard in service throws; hook sets `status='unavailable'`; screen renders `CameraPreview` on iOS |
| 5 | Service exposes consistent interface regardless of implementation | VERIFIED | Both `useLightSensor` and `useCameraLightEstimator` return `{lux, category, status, error, start, stop}` |
| 6 | iOS devices estimate lux using camera brightness analysis | VERIFIED | `CameraPreview` takes periodic snapshots at 500ms, estimates luminance from base64 length, calls `estimateLuxFromFrame()` |
| 7 | Calibration flow improves accuracy with white paper reference | VERIFIED | `calibrateWithReference(luminance, actualLux)` calculates offset, stored in AsyncStorage under `@light_meter_calibration` |
| 8 | Auto-stop after 30 seconds to preserve battery | VERIFIED | `AUTO_STOP_TIMEOUT_MS = 30_000` in CameraPreview with `setTimeout` → `onTimeout()` callback |
| 9 | Light meter screen shows real-time lux value with prominent display | VERIFIED | `LightMeterGauge` renders 64pt lux value, accuracy badge, category bar, recommendations |
| 10 | Plant recommendations appear based on current light category | VERIFIED | `PLANT_RECOMMENDATIONS` map in `LightMeterGauge.tsx` renders chips for each category |
| 11 | Users can save measurements linked to specific plants | VERIFIED | `SaveModal` lists managed plants from `plantsStore`, `handleSaveMeasurement` calls `updatePlant` with lux data in `location` field |
| 12 | Accuracy indicator shows "±15%" on Android, "Estimate (±30%)" on iOS | VERIFIED | `accuracy: IS_ANDROID ? 'high' : 'estimate'`; gauge badge uses `t('lightMeter.accuracy.high')` / `t('lightMeter.accuracy.estimate')` |
| 13 | Feature accessible from plant onboarding flow | FAILED | No navigation entry point found in any existing screen — screen exists at `/light-meter` but no Link, `router.push`, or `href` points to it |
| 14 | Color-coded progress bar indicates current light category | VERIFIED | `LightCategoryBar` has 4 segments (Low=#607D8B, Medium=#8BC34A, Bright=#FF9800, Sun=#F44336) with Animated.spring indicator |

**Score:** 8/11 truths fully verified (2 partial, 1 failed)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `types/lightMeter.ts` | Shared types for light meter feature | VERIFIED | Exports `LuxReading`, `LightCategory`, `LightSensorStatus`, `getLightCategory()`, `formatLuxValue()`, helper functions — 165 lines |
| `services/lightMeterService.ts` | Light sensor abstraction with Android native support | VERIFIED | Exports `checkLightSensorAvailability`, `startLightReading`, `stopLightReading`, `isLightReadingActive`, `getPlatformSupport` — 264 lines |
| `hooks/useLightSensor.ts` | React hook for light sensor with auto-cleanup | VERIFIED | Exports `useLightSensor`, returns `{lux, category, status, error, isAvailable, start, stop}` — 229 lines |
| `services/cameraLightEstimator.ts` | Camera-based lux estimation for iOS | VERIFIED | Exports `initializeCameraEstimator`, `estimateLuxFromFrame`, `calibrateWithReference`, `resetCalibration` — 307 lines |
| `components/LightMeter/CameraPreview.tsx` | Camera preview component with frame processing | VERIFIED | Exports `CameraPreview`, 500ms frame interval, 30s auto-stop, permission handling — 482 lines |
| `hooks/useCameraLightEstimator.ts` | React hook for camera-based estimation | VERIFIED | Exports `useCameraLightEstimator`, full calibration API, AppState background listener — 384 lines |
| `components/LightMeter/LightMeterGauge.tsx` | Main gauge component with lux display | VERIFIED | Exports `LightMeterGauge`, 64pt lux value, accuracy badge, category bar, recommendations, action buttons — 324 lines |
| `components/LightMeter/LightCategoryBar.tsx` | Color-coded category visualization | VERIFIED | Exports `LightCategoryBar`, 4 segments with Animated.spring position indicator — 281 lines |
| `app/light-meter.tsx` | Full light meter screen with routing | VERIFIED | Dual-platform screen, SaveModal, InstructionsCard — 615 lines (>150 minimum) |
| `i18n/resources/en.json` | English translations for light meter | VERIFIED | Contains `lightMeter.title`, `lightMeter.categories.low`, all sub-keys (accuracy, recommendations, instructions, calibration) |
| `i18n/resources/it.json` | Italian translations for light meter | VERIFIED | Contains complete `lightMeter` namespace in Italian |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `hooks/useLightSensor.ts` | `services/lightMeterService.ts` | import + service calls | WIRED | Imports `startLightReading`, `stopLightReading`; calls both in `startReading()`/`stopReading()` callbacks |
| `services/lightMeterService.ts` | `expo-sensors` LightSensor API | `import { LightSensor }` | WIRED | `LightSensor.addListener()`, `LightSensor.setUpdateInterval()`, `LightSensor.isAvailableAsync()` all used |
| `hooks/useCameraLightEstimator.ts` | `services/cameraLightEstimator.ts` | service calls | WIRED | Imports `initializeCameraEstimator`, `calibrateWithReference`, `resetCalibration`, `isCalibrated`, `getCalibrationStatus` |
| `components/LightMeter/CameraPreview.tsx` | `expo-camera` CameraView | `import { CameraView }` | WIRED | `CameraView` rendered in JSX, `cameraRef.current.takePictureAsync()` called in `processFrame()` |
| `services/cameraLightEstimator.ts` | `types/lightMeter.ts` | `import { LuxReading }` | WIRED | `LuxReading` imported from `../types/lightMeter`, used as return type of `estimateLuxFromFrame()` |
| `app/light-meter.tsx` | `hooks/useLightSensor.ts` | hook import | WIRED | `import { useLightSensor }` at line 38; called at line 221 `const androidSensor = useLightSensor()` |
| `app/light-meter.tsx` | `hooks/useCameraLightEstimator.ts` | hook import | WIRED | `import { useCameraLightEstimator }` at line 39; called at line 224 |
| `components/LightMeter/LightMeterGauge.tsx` | `types/lightMeter.ts` | `LightCategory` type | WIRED | `import { type LightCategory }` used in `PLANT_RECOMMENDATIONS`, props interface, category label map |
| `app/light-meter.tsx` | `stores/plantsStore.ts` | save measurement | WIRED | `import { usePlantsStore }` at line 40; `usePlantsStore.getState().updatePlant()` in `handleSaveMeasurement()` |
| `app/light-meter.tsx` | Any entry point screen | navigation href | NOT WIRED | No screen navigates to `/light-meter` — screen is discovery-accessible but not reachable from app UI |

### Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
|-------------|--------|-------------|--------|----------|
| v2.1-light-meter | All 3 PLANs | Light Meter feature (v2.1 milestone) | SATISFIED | All phase 13-light-meter plans declare this requirement; feature is fully implemented across all artifacts |
| FEED-01 through FEED-10 | Specified in verification prompt as phase req IDs | Community Feed requirements | ORPHANED | These IDs are in the prompt but belong to Phase 13 (Community Feed), a different phase already completed. The 13-light-meter PLANs do NOT claim these IDs — only `v2.1-light-meter` is declared. REQUIREMENTS.md maps these IDs to "Phase 13" which refers to the Community Feed phase, not the light-meter insertion. |
| COMM-01 through COMM-06 | Same | Comments requirements | ORPHANED | Same as above — belong to Phase 13 Community Feed |
| LIKE-01, LIKE-02, LIKE-03 | Same | Likes requirements | ORPHANED | Same as above — belong to Phase 13 Community Feed |
| MODR-01 through MODR-11 | Same | Moderation requirements | ORPHANED | Same as above — belong to Phase 13 Community Feed |

**Critical Note:** The requirement IDs passed to this verifier (FEED-01 through MODR-11) appear to have been incorrectly associated with this phase. These are v2.0 Community requirements belonging to the integer "Phase 13" (Community Feed Core & Moderation), which is a separate phase from "Phase 13-light-meter" (the light sensor feature). The ROADMAP.md confirms: *"Phase 13-light-meter: Light Meter — Inserted between Phase 12 and Phase 13"*. The light meter plans correctly declare `v2.1-light-meter` as their requirement, not the community requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/light-meter.tsx` | 298 | `usePlantsStore.getState()` called inside a callback (not in render) | INFO | Technically valid Zustand pattern for imperative calls; no re-render needed |
| `services/cameraLightEstimator.ts` | 161-163 | `hasPermission: true` hardcoded in `initializeCameraEstimator` with comment "Actual permission check done in CameraPreview" | WARNING | Permission status is not actually checked in the service — delegated to component. This is intentional per the decision log but means the service's `InitializeResult.hasPermission` is always `true` regardless of actual permission state |
| `hooks/useCameraLightEstimator.ts` | 247 | `console.info` log on non-iOS platform — minor noise | INFO | Development log, not a blocker |

### Human Verification Required

#### 1. Android Real-Time Sensor Test

**Test:** On physical Android device with ambient light sensor, open app, navigate to `/light-meter` URL, tap Start Measurement. Move device between light and dark environments.
**Expected:** Lux readings update approximately 10 times per second, category bar indicator moves smoothly, accuracy badge shows "±15% accuracy", category name updates correctly.
**Why human:** Cannot activate native LightSensor API in static analysis.

#### 2. iOS Camera Estimation Test

**Test:** On iOS device/simulator, navigate to light meter screen, tap Start Measurement, grant camera permission when prompted.
**Expected:** Camera preview appears with target bracket overlay and "Estimating... (±30%)" status, lux values update every ~500ms as camera captures frames, accuracy badge shows "Estimate (±30%)", auto-stop fires after 30 seconds.
**Why human:** Cannot run camera or process frames in static analysis.

#### 3. Save to Plant Flow

**Test:** With at least one managed plant in the collection, complete a measurement, tap "Save to Plant", select a plant from the modal list.
**Expected:** Modal shows managed plants with name/species, selecting a plant updates its `location` field to a string like "1240 lux (medium) — 3/4/2026", Alert confirms save, modal closes.
**Why human:** Requires running app with populated store.

#### 4. Dark Mode Rendering

**Test:** Toggle device to dark mode, navigate to light meter screen, activate a measurement.
**Expected:** All components (gauge card, category bar labels, camera overlay) use dark-mode-appropriate colors from `useThemeColors`.
**Why human:** Requires visual inspection.

#### 5. Navigation Entry Point (Gap Confirmation)

**Test:** Attempt to find light meter screen from normal app navigation (tabs, plant detail, settings).
**Expected:** Feature should be reachable from at least one location per PLAN 13-03 success criterion ("Light meter screen accessible from app navigation").
**Why human:** No entry point was found in static analysis — this gap needs user confirmation as intentional (deferred to next phase) or as a bug requiring immediate fix.

### Gaps Summary

**Two functional gaps identified:**

1. **Navigation entry point missing (Blocking UX):** The light meter screen exists at `/light-meter` and is file-system routable in expo-router, but no existing screen links to it. The PLAN 13-03 success criterion #1 states "Light meter screen accessible from app navigation" — this is not satisfied. The feature is built but unreachable through normal app flow. The SUMMARY.md notes: "needs navigation entry point to be linked from plant detail or onboarding" — this was flagged but not resolved.

2. **Requirement ID mismatch (Documentation issue, not implementation):** The 28 requirement IDs (FEED-01 through MODR-11) passed to this verifier belong to Phase 13 Community Feed, not Phase 13-light-meter. The light meter PLANs correctly use `v2.1-light-meter` as their requirement identifier. REQUIREMENTS.md needs to be updated to separate the two "Phase 13" entries and add v2.1-light-meter to the requirements table.

**Minor gap:**

3. **No smoothing on iOS camera path (Warning):** The Android sensor path applies a 5-sample weighted moving average. The iOS camera estimation returns raw single-frame estimates with no temporal smoothing, which may cause visible lux value jitter between the 500ms snapshots.

---

_Verified: 2026-03-04T16:00:00Z_
_Verifier: Claude (gsd-verifier)_
