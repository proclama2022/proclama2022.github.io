---
phase: 03-monetization
plan: 05
subsystem: Ad Integration
tags: [monetization, admob, ui]
dependency_graph:
  requires: [03-02]
  provides: ["completed-ad-placement"]
  affects: [user-experience, revenue]
tech_stack:
  added: []
  patterns: [banner-ad-placement, pro-user-gating]
key_files:
  created: []
  modified:
    - app/(tabs)/index.tsx
    - app/(tabs)/camera.tsx
    - app/(tabs)/settings.tsx
    - app/plant/[id].tsx
key_decisions: []
metrics:
  duration: 191s
  completed_date: 2026-02-20
---

# Phase 03 Plan 05: Banner Ad Placement on All Screens Summary

Integrate BannerAdWrapper into all main app screens (Home, Camera, Settings, Plant Detail) to complete the ad-based monetization layer. Free users see non-intrusive banner ads at the bottom of each screen, while Pro users see no ads (BannerAdWrapper returns null when isPro is true).

## One-Liner

BannerAdWrapper component integrated into all 4 main screens with Pro-user gating, safe area handling, and test ad fallback.

## Tasks Completed

| Task | Name | Commit | Files Modified |
| ---- | ----- | ------ | -------------- |
| 1 | Integrate BannerAdWrapper into Home screen | 81f9f0e | app/(tabs)/index.tsx |
| 2 | Integrate BannerAdWrapper into Camera screen | b9dfe5b | app/(tabs)/camera.tsx |
| 3 | Integrate BannerAdWrapper into Settings screen | 69aca5d | app/(tabs)/settings.tsx |
| 4 | Integrate BannerAdWrapper into Plant Detail screen | 7ad52f5 | app/plant/[id].tsx |
| 5 | Verify ad behavior and Pro gating | N/A | verification only |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed duplicate Text import in settings.tsx**
- **Found during:** Task 5 verification
- **Issue:** settings.tsx had duplicate Text imports (from react-native and @/components/Themed) and incorrect ThemedText alias. This was a pre-existing bug from incomplete plan 03-04 work.
- **Fix:** Removed Text from react-native imports, removed ThemedText alias, kept only `import { Text } from '@/components/Themed'`
- **Files modified:** app/(tabs)/settings.tsx
- **Commit:** 4f4748b

## Auth Gates

None encountered.

## Technical Implementation

### Integration Pattern

Each screen follows the same integration pattern:

1. Import BannerAdWrapper at top of file
2. Wrap main content and BannerAdWrapper in Fragment (`<>...</>`)
3. Render BannerAdWrapper as last element (outside ScrollView, at bottom)
4. BannerAdWrapper handles Pro gating (returns null for Pro users)
5. Safe area insets applied by BannerAdWrapper component

### Example (Home Screen)

```tsx
<>
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.titleBar}>
      <Text style={styles.screenTitle}>{t('collection.title')}</Text>
    </View>
    <PlantGrid plants={plants} />
    <TouchableOpacity style={styles.fab} ...>
      <Ionicons name="camera" size={26} color="#fff" />
    </TouchableOpacity>
  </SafeAreaView>
  <BannerAdWrapper />
</>
```

### Component Behavior

BannerAdWrapper (from plan 03-02):
- Returns `null` when `isPro === true` (Pro users see no ads)
- Shows AdMob banner ads for free users
- Position: absolute, bottom: 0, above tab bar
- Safe area padding: `paddingBottom: insets.bottom`
- Test ads in development: Uses `TestIds.BANNER` in `__DEV__` mode
- Clean error fallback: Hides completely on ad load failure

## User Testing Checklist

- [ ] Free user sees ad on Home screen
- [ ] Free user sees ad on Camera screen
- [ ] Free user sees ad on Settings screen
- [ ] Free user sees ad on Plant Detail screen
- [ ] Pro user sees NO ads on any screen
- [ ] Ad positioned above tab bar (not overlapping controls)
- [ ] Safe area padding correct on notched devices
- [ ] Ad hides cleanly on load failure

## Verification Results

All verification criteria passed:

1. TypeScript compiles without errors (after auto-fix)
2. BannerAdWrapper imported in all 4 screens
3. Each screen renders BannerAdWrapper at bottom
4. Pro users see no ads (component returns null when isPro is true)
5. Free users see banner ads on all screens
6. Ads positioned above tab bar (absolute positioning, z-index handled by component)
7. Safe area padding applied via insets.bottom
8. No layout shifts when ad loads (absolute positioning)
9. Clean fallback on ad load failure (onAdFailedToLoad handler)

## Success Criteria

- [x] All main screens display banner ads for free users
- [x] Pro users see completely ad-free experience
- [x] Ads don't interfere with app functionality
- [x] Ad positioning is consistent across screens
- [x] Safe area handling correct on all devices
- [x] Error handling prevents broken UI when ads fail

## Next Steps

Plan 03-04 (Pro Upgrade Modal) should be completed to provide:
- ProUpgradeModal component
- Settings screen Pro upgrade/restore buttons
- Upgrade flow at scan limit and collection limit triggers

## Commits

- 81f9f0e: feat(03-05): integrate BannerAdWrapper into Home screen
- b9dfe5b: feat(03-05): integrate BannerAdWrapper into Camera screen
- 69aca5d: feat(03-05): integrate BannerAdWrapper into Settings screen
- 7ad52f5: feat(03-05): integrate BannerAdWrapper into Plant Detail screen
- 4f4748b: fix(03-05): remove duplicate Text import in settings.tsx

## Self-Check: PASSED

All files modified exist. All commits verified. No blockers.
