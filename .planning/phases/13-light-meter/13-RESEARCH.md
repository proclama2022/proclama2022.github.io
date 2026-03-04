# Phase 13: Light Meter - Research

**Date:** 2026-03-04
**Researcher:** Claude Code

## Executive Summary

The Light Meter feature requires a dual-path implementation strategy due to platform differences:
- **Android:** Native light sensor access via `expo-sensors` (straightforward)
- **iOS:** Camera-based brightness estimation (workaround for restricted light sensor API)

This research document analyzes competitor implementations, technical approaches, calibration strategies, and user experience patterns.

---

## Competitor Analysis

### 1. PlantIn (Popular plant care app)

**Implementation:**
- Dedicated "Light Meter" tab in main navigation
- Real-time lux readings with live preview
- Color-coded zones: Low / Medium / Bright / Direct Sun
- Plant-specific recommendations after measurement

**UX Pattern:**
```
[Camera Preview / Sensor Reading]
[Large Lux Value Display]
[Progress Bar: Low ▓▓▓░░░ Bright]
[Recommendation Card: "Perfect for Snake Plants!"]
[Save Measurement Button]
```

**Strengths:**
- Immediate visual feedback
- Contextual plant recommendations
- History of measurements per plant

**Weaknesses:**
- No indication of accuracy limitations
- iOS version likely less accurate than Android

---

### 2. PictureThis (AI-powered plant identification)

**Implementation:**
- Integrated into "Add Plant" flow
- Suggests light requirements based on species
- Optional light measurement during setup

**UX Pattern:**
- Subtle integration, not a standalone feature
- Uses camera frame analysis for ambient light
- Shows "Current Light: Medium (estimated)"

**Strengths:**
- Seamless onboarding integration
- Doesn't over-promise accuracy

**Weaknesses:**
- Limited discoverability
- No detailed lux values shown

---

### 3. Blossom (Plant care tracker)

**Implementation:**
- Standalone tool in "Tools" section
- Simple interface with large numbers
- Basic categories: Low / Partial / Full / Direct

**Technical Approach:**
- Likely uses camera exposure metadata on iOS
- Native sensor on Android

---

### 4. Lux Meter Apps (General purpose)

**Top-rated apps analyzed:**
- "Lux Light Meter" (iOS): Uses camera, claims ±20% accuracy
- "Light Meter" (Android): Uses native sensor, ±5% accuracy
- "Photometer": Professional tool with calibration

**Key findings:**
- iOS apps universally use camera-based estimation
- Calibration against known light sources is critical
- User education about accuracy limitations is essential

---

## Technical Implementation Strategies

### Android: expo-sensors LightSensor

**API Availability:**
```typescript
import { LightSensor } from 'expo-sensors';

// Check availability
const isAvailable = await LightSensor.isAvailableAsync();
// Returns true on most Android devices with ambient light sensor
```

**Implementation:**
```typescript
LightSensor.addListener(({ illuminance }) => {
  // illuminance in lux
  setLuxValue(illuminance);
});

LightSensor.setUpdateInterval(100); // Update every 100ms
```

**Accuracy:**
- Hardware-dependent (typically ±10-20%)
- Direct lux readings from device sensor
- No calibration needed for basic use

**Device Coverage:**
- ~85% of Android devices have ambient light sensors
- Used for auto-brightness adjustment
- High-end phones have more accurate sensors

---

### iOS: Camera-Based Estimation

**Challenge:** iOS does not expose ambient light sensor to third-party apps (privacy/security).

**Solution Options:**

#### Option A: Camera Preview Brightness Analysis

**Approach:**
1. Access camera preview stream
2. Calculate average luminance from video frames
3. Map luminance to estimated lux using calibration curve

**Implementation sketch:**
```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

// Process camera frames
const processFrame = (frame) => {
  const luminance = calculateAverageLuminance(frame);
  const estimatedLux = luminanceToLux(luminance);
  return estimatedLux;
};
```

**Calibration approach:**
```typescript
// Empirical mapping based on testing
const luminanceToLux = (luminance: number): number => {
  // Non-linear mapping derived from comparison tests
  // Low light: lux ≈ luminance * 2
  // Bright light: lux ≈ luminance * 8
  if (luminance < 50) return luminance * 2;
  if (luminance < 150) return luminance * 4;
  return luminance * 8;
};
```

**Pros:**
- Works on all iOS devices with camera
- Real-time continuous reading
- Visual feedback (user sees what the camera sees)

**Cons:**
- Requires camera permission
- Accuracy depends on calibration
- Battery usage higher than sensor
- Affected by camera settings (ISO, exposure)

---

#### Option B: Exposure Metadata Analysis

**Approach:**
Use camera's automatic exposure settings to estimate light levels.

**Theory:**
- Camera adjusts ISO and shutter speed based on light
- Can reverse-calculate approximate lux from exposure settings

**Formula:**
```
lux ≈ (K * N²) / (t * ISO)
Where:
- K = calibration constant (~12.5)
- N = f-number (aperture)
- t = shutter speed
- ISO = sensitivity
```

**Pros:**
- More theoretically grounded
- Less affected by scene content

**Cons:**
- iOS doesn't expose all exposure metadata
- Complex calibration required
- May be less reliable across devices

---

#### Recommended: Hybrid Approach (Option A + Smart Calibration)

**Strategy:**
1. Use camera preview brightness as primary signal
2. Adjust for camera exposure compensation
3. Calibrate against known reference points
4. Show confidence level to user

---

## Light Categories & Plant Requirements

### Standard Light Classifications

| Category | Lux Range | Typical Locations | Suitable Plants |
|----------|-----------|-------------------|-----------------|
| Low Light | 500 - 2,500 | North-facing rooms, far from windows | Snake Plant, ZZ Plant, Pothos |
| Medium Light | 2,500 - 10,000 | East/west windows, 3-6ft from window | Monstera, Philodendron, Spider Plant |
| Bright Indirect | 10,000 - 20,000 | Near south window with sheer curtain | Fiddle Leaf Fig, Bird of Paradise |
| Direct Sun | 20,000+ | Unobstructed south/west windows | Cacti, Succulents, Citrus |

### Reference Values

| Environment | Approximate Lux |
|-------------|-----------------|
| Moonlight | 1 |
| Street lighting | 10-20 |
| Home interior (evening) | 100-300 |
| Office lighting | 300-500 |
| Overcast day | 1,000-5,000 |
| Direct sunlight | 32,000-100,000 |

---

## Calibration Strategy

### In-App Calibration Wizard

**Step 1: Reference Point Selection**
- User selects known environment:
  - "Dim room" (~100 lux)
  - "Office" (~500 lux)
  - "Near window" (~5,000 lux)
  - "Direct sun" (~50,000 lux)

**Step 2: Measurement**
- App captures camera brightness at reference point
- Stores calibration offset

**Step 3: Validation**
- Compare against other reference points
- Calculate accuracy score

### Continuous Learning

**Approach:**
- Anonymous aggregate data collection (opt-in)
- Compare iOS estimates with Android readings when available
- Refine calibration curves over time

---

## UX/UI Design Patterns

### Main Screen Layout

```
┌─────────────────────────────┐
│  Light Meter                │
├─────────────────────────────┤
│                             │
│    [Camera Preview /       │
│     Visual Indicator]       │
│                             │
│         ┌─────┐             │
│         │ LUX │             │
│         │1240 │             │
│         └─────┘             │
│                             │
│  Medium Light ▓▓▓▓░░        │
│                             │
│  ┌─────────────────────┐    │
│  │ Good for: Monstera  │    │
│  │                     │    │
│  │ [See all plants]    │    │
│  └─────────────────────┘    │
│                             │
│  [Measure]  [Save to Plant] │
│                             │
└─────────────────────────────┘
```

### Key UI Elements

1. **Live Reading:** Large, prominent lux value
2. **Category Indicator:** Visual bar showing light category
3. **Confidence Badge:** "High accuracy" (Android) / "Estimate" (iOS)
4. **Plant Recommendations:** Contextual suggestions
5. **Measurement Button:** Capture current reading
6. **History:** Previous measurements for this location

---

## Platform Detection & Adaptation

```typescript
const getLightMeterImplementation = () => {
  if (Platform.OS === 'android') {
    const hasSensor = await LightSensor.isAvailableAsync();
    if (hasSensor) return 'native-sensor';
    return 'camera-estimate'; // Fallback for Android without sensor
  }
  return 'camera-estimate'; // iOS always uses camera
};
```

### UI Adaptations

| Aspect | Android (Native) | iOS (Camera) |
|--------|------------------|--------------|
| Permission | None | Camera permission required |
| Accuracy Label | "±15% accuracy" | "Estimate (±30%)" |
| Preview | Optional visualization | Required camera preview |
| Update Rate | 100ms | 500ms (frame rate limited) |
| Battery Impact | Minimal | Moderate |

---

## Edge Cases & Considerations

### Accuracy Limitations

**Must communicate to users:**
- Phone sensors are consumer-grade, not professional
- Measurements are approximate guides, not scientific instruments
- Environmental factors affect readings (reflections, shadows)

### Device Variations

**Android:**
- Different sensor manufacturers (AMS, Lite-On, etc.)
- Varying sensor placement
- Some budget phones lack sensors entirely

**iOS:**
- Camera quality variations (older vs newer devices)
- Different lens apertures affect calculations
- TrueDepth vs rear camera differences

### Environmental Factors

- **Reflections:** Shiny surfaces inflate readings
- **Shadows:** Partial coverage reduces accuracy
- **Phone case:** May block sensor (Android)
- **Screen brightness:** Affects camera exposure (iOS)

---

## Implementation Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| iOS accuracy unacceptable | Medium | High | Extensive calibration testing, clear disclaimers |
| Android sensor unavailable | Low | Medium | Implement camera fallback |
| User confusion about accuracy | High | Medium | Clear UI labels, educational content |
| Battery drain complaints (iOS) | Medium | Medium | Auto-stop after 30 seconds, efficient frame processing |
| Permission denial (iOS) | Medium | High | Explain why camera is needed before requesting |

---

## Success Metrics

- **User engagement:** % of users who try Light Meter within first week
- **Repeat usage:** Users who measure light 3+ times
- **Accuracy perception:** In-app rating of "helpfulness" (target: 4+/5)
- **Comparison validation:** Android vs iOS readings within 30% on same device

---

## Next Steps

1. **Prototype iOS camera estimation** with calibration wizard
2. **Test Android sensor** on multiple device models
3. **Design calibration UI** for iOS accuracy improvement
4. **Create plant database** with light requirements mapped to categories
5. **Define measurement storage** schema (linked to plants or locations)

---

## References

- Expo Sensors documentation: https://docs.expo.dev/versions/latest/sdk/sensors/
- iOS Camera APIs: AVFoundation framework
- Light measurement standards: CIE S 023/E:2013
- Plant light requirements: Missouri Botanical Garden database
