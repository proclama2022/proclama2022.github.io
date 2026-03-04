# Phase 13: Light Meter - Context

**Status:** Planning
**Phase:** 13
**Milestone:** v2.1 Smart Features
**Created:** 2026-03-04

## Goal

Implement a Light Meter feature that helps users measure ambient light levels to determine optimal plant placement. The feature requires platform-specific implementations due to iOS restrictions on light sensor access.

## User Story

> As a plant owner, I want to measure the light level in different areas of my home so that I can place each plant in a location with appropriate lighting conditions for its species.

## User Decisions (Locked)

### Implementation Strategy
- **Android:** Use `expo-sensors` LightSensor for native lux readings
- **iOS:** Camera-based brightness estimation (Apple restricts direct light sensor access)
- Both platforms show the same UI with appropriate accuracy indicators

### Light Categories
| Category | Lux Range | Description |
|----------|-----------|-------------|
| Low Light | 500 - 2,500 | North-facing rooms, far from windows |
| Medium Light | 2,500 - 10,000 | East/west windows, 3-6ft from window |
| Bright Indirect | 10,000 - 20,000 | Near south window with sheer curtain |
| Direct Sun | 20,000+ | Unobstructed south/west windows |

### UX Decisions
- Real-time live reading display
- Large prominent lux value with category indicator
- Color-coded progress bar showing light category
- Plant recommendations based on current reading
- Save measurement to specific plant or location
- History of previous measurements

### Accuracy Communication
- Android: "±15% accuracy" (native sensor)
- iOS: "Estimate (±30%)" (camera-based)
- Clear disclaimer that this is a guide, not professional equipment

## Claude's Discretion

- Exact calibration algorithm for iOS camera estimation
- Camera frame processing frequency (balance accuracy vs battery)
- Visual design of the light meter gauge/progress bar
- Whether to include a calibration wizard for iOS
- Storage schema for measurements (separate table or plant attribute)
- Integration with existing plant detail screen

## Technical Constraints

### Android
- Requires `expo-sensors` (already in project)
- ~85% of Android devices have ambient light sensors
- Must handle devices without sensors (fallback to camera)

### iOS
- No access to ambient light sensor (privacy restriction)
- Requires camera permission
- Uses camera preview brightness analysis
- Higher battery usage than sensor approach

### Permissions Required
- **Android:** None (for sensor), Camera (for fallback)
- **iOS:** Camera (required)

## Dependencies

- `expo-sensors` (already installed)
- `expo-camera` (may need installation for iOS/fallback)
- Plant database with light requirements (enhancement needed)

## Success Criteria

- [ ] Android shows accurate lux readings on devices with light sensors
- [ ] iOS provides reasonable light estimates using camera
- [ ] Users can save measurements linked to plants
- [ ] Plant recommendations appear based on light category
- [ ] Clear accuracy indicators for each platform
- [ ] Feature works offline (no API calls required)

## Open Questions

1. Should we implement a calibration wizard for iOS to improve accuracy?
2. How long should the camera stay active before auto-stopping to save battery?
3. Should measurements be stored historically or just update a plant's "current location light level"?
4. Do we need to support measuring light for locations without plants yet?

## Related Research

See [13-RESEARCH.md](./13-RESEARCH.md) for:
- Competitor analysis (PlantIn, PictureThis, Blossom)
- Technical implementation strategies
- Calibration approaches
- UX/UI design patterns
- Platform detection and adaptation
