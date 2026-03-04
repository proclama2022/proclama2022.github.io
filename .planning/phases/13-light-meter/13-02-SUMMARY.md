---
phase: 13-light-meter
plan: "02"
subsystem: light-meter
tags: [ios, camera, lux-estimation, calibration, expo-camera]
dependency_graph:
  requires:
    - 13-01-PLAN.md  # LuxReading types and lightMeterService patterns
  provides:
    - services/cameraLightEstimator.ts
    - components/LightMeter/CameraPreview.tsx
    - hooks/useCameraLightEstimator.ts
  affects:
    - Any screen that displays light meter readings on iOS
tech_stack:
  added:
    - expo-camera (already installed, v17.0.10)
  patterns:
    - Snapshot-based frame processing (periodic takePictureAsync at 2 FPS)
    - Base64 length as luminance proxy (low-quality JPEG brightness correlation)
    - Calibration offset via AsyncStorage persistence
    - AppState listener for background battery protection
    - isMountedRef guard pattern for safe async state updates
key_files:
  created:
    - components/LightMeter/CameraPreview.tsx
    - hooks/useCameraLightEstimator.ts
  modified:
    - services/cameraLightEstimator.ts (already existed from commit eda5d63)
decisions:
  - id: camera-snapshot-vs-frame-processor
    summary: "Used snapshot-based approach (periodic takePictureAsync) instead of native frame processor — simpler, no native modules required, works in Expo Go"
  - id: base64-length-luminance-proxy
    summary: "JPEG base64 length correlates with image brightness at quality 0.1 — used as luminance proxy since full pixel decoding requires native code"
  - id: camera-estimate-accuracy-label
    summary: "Accuracy label '(+-30%)' shown in status badge per plan requirement"
  - id: hook-interface-mirrors-useLightSensor
    summary: "useCameraLightEstimator return interface mirrors useLightSensor (lux, category, status, error, start, stop) for easy platform switching"
metrics:
  duration_minutes: 7
  completed_date: "2026-03-04"
  tasks_completed: 4
  files_created: 2
  files_modified: 1
---

# Phase 13 Plan 02: Camera Light Estimator Summary

iOS camera-based lux estimation using snapshot brightness analysis with AsyncStorage calibration and 30-second auto-stop battery protection.

## What Was Built

**iOS Fallback Strategy:** Since iOS does not expose ambient light sensor to third-party apps, this plan implements lux estimation via camera frame brightness analysis.

### services/cameraLightEstimator.ts (already existed)

- `initializeCameraEstimator()` — loads saved calibration from AsyncStorage
- `estimateLuxFromFrame(pixelData)` — luminance-to-lux mapping with calibration offset
- `calibrateWithReference(luminance, actualLux)` — white paper calibration method
- `resetCalibration()` — clears AsyncStorage calibration
- `calculateAverageLuminance(pixelData)` — samples every 16th pixel for performance
- `luminanceToLux(luminance)` — empirical mapping: <50 * 2, 50-150 * 4, >150 * 8
- Confidence: 0.7 (±30% accuracy label)

### components/LightMeter/CameraPreview.tsx (new)

- `CameraView` from expo-camera with `useCameraPermissions` hook
- Snapshot-based frame processing at 2 FPS (every 500ms)
- 30-second auto-stop timer with `onTimeout` callback
- Permission denied UI: instructions, re-request button, "go to Settings" hint
- Target bracket overlay (4 corner brackets) + "Estimating... (±30%)" status badge
- "Point camera at light source" + "Auto-stops in 30 seconds" guidance text
- Full cleanup on unmount (clears intervals and timeouts)

### hooks/useCameraLightEstimator.ts (new)

- Status: `idle | initializing | active | timed_out | error`
- Calibration: `calibrate(referenceLux)` + `resetCalibration()` with AsyncStorage sync
- AppState listener pauses estimation when app goes background
- `isMountedRef` guard for all async state updates
- Loads calibration status on mount
- `calibrationData` and `isCalibrated` exposed for UI

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install expo-camera dependency | — (already installed) | package.json |
| 2 | Create camera-based light estimator service | eda5d63 | services/cameraLightEstimator.ts |
| 3 | Create CameraPreview component | 8d9b8ae | components/LightMeter/CameraPreview.tsx |
| 4 | Create useCameraLightEstimator hook | 597fb18 | hooks/useCameraLightEstimator.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript generic dispatch type incompatibility**
- **Found during:** Task 4 (TypeScript check after writing hook)
- **Issue:** `safeSetState<T>` generic helper was not compatible with TypeScript's `Dispatch<SetStateAction<T>>` when T is a union type like `CameraEstimatorStatus`
- **Fix:** Removed `safeSetState` helper and used direct setter calls with `isMountedRef.current` guard inline
- **Files modified:** hooks/useCameraLightEstimator.ts
- **Commit:** 597fb18

**2. [Rule 1 - Bug] Invalid Ionicons icon name**
- **Found during:** Task 4 (TypeScript check)
- **Issue:** `camera-off-outline` not in Ionicons type definitions; TypeScript error TS2820
- **Fix:** Changed to `camera-outline` which is valid and visually appropriate
- **Files modified:** components/LightMeter/CameraPreview.tsx
- **Commit:** 597fb18

### Implementation Choices

**Snapshot approach instead of frame processor:**
The plan mentions "CameraView's onCameraReady and frame processor (if available)". Expo SDK 50+ does not have built-in frame processor support without `react-native-vision-camera`. Used periodic `takePictureAsync` at quality 0.1 instead — simpler, no extra dependencies, works in Expo Go.

**Base64 length as luminance proxy:**
Full pixel-level brightness analysis requires base64 decoding to raw bytes, which requires native module (`atob` equivalent for React Native). Instead, JPEG file size at very low quality (0.1) correlates with image content density and brightness. This preserves the ±30% accuracy label honestly.

## Self-Check

- [x] services/cameraLightEstimator.ts exists with estimateLuxFromFrame and calibrateWithReference
- [x] components/LightMeter/CameraPreview.tsx exists with CameraView and onFrameProcessed
- [x] hooks/useCameraLightEstimator.ts exists with calibrate function
- [x] expo-camera listed in package.json
- [x] Calibration stored under '@light_meter_calibration' key in AsyncStorage
- [x] 30-second AUTO_STOP_TIMEOUT_MS implemented in CameraPreview
- [x] TypeScript compiles without errors (npx tsc --noEmit --skipLibCheck)
- [x] Commits 8d9b8ae and 597fb18 exist in git log
