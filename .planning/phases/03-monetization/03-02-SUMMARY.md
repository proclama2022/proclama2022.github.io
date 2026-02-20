---
phase: 03-monetization
plan: 02
subsystem: AdMob Integration
tags: [ads, admob, monetization, pro-gating]
dependency_graph:
  requires: ["03-01"]
  provides: ["ad-banner-component"]
  affects: ["tab-screens"]
tech_stack:
  added: ["react-native-google-mobile-ads@^15.7.0"]
  patterns: ["Pro-user gating", "Safe area insets", "Test ID fallback"]
key_files:
  created: ["app.config.js", "components/BannerAdWrapper.tsx"]
  modified: [".env", "package.json", "package-lock.json"]
decisions: []
metrics:
  duration: 3869
  completed_date: 2026-02-20
---

# Phase 03 Plan 02: AdMob Banner Integration Summary

## One-Liner
Implemented Google AdMob banner ads with Pro-user gating using react-native-google-mobile-ads SDK, featuring automatic test ad fallback in development and clean error handling.

## What Was Built

### AdMob Configuration
- Converted `app.json` to `app.config.js` to support environment variables
- Installed `react-native-google-mobile-ads@^15.7.0` package
- Configured AdMob plugin with androidAppId and iosAppId from environment
- Removed invalid RevenueCat plugin configuration (no config plugin exists)
- Added AdMob App ID placeholders to `.env` with clear documentation
- Added AdMob Banner Ad Unit ID placeholders with `EXPO_PUBLIC_` prefix for Expo compatibility

### BannerAdWrapper Component
Created `components/BannerAdWrapper.tsx` following Pattern 3 from RESEARCH.md:
- **Pro-user gating**: Returns `null` when `isPro` is true (ads hidden for paid users)
- **Safe area handling**: Uses `useSafeAreaInsets()` for bottom padding on notched devices
- **Clean error fallback**: `onAdFailedToLoad` logs error but shows no placeholder
- **Test ads in development**: Uses `TestIds.BANNER` when `__DEV__` is true
- **Privacy compliance**: Sets `requestNonPersonalizedAdsOnly: true`
- **Centered banner**: Aligns ad horizontally with `alignItems: 'center'`

### Environment Variables
Added to `.env`:
```
ADMOB_ANDROID_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
ADMOB_IOS_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ
EXPO_PUBLIC_ADMOB_IOS_BANNER_ID=ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ
EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
```

Test ad IDs (used automatically in `__DEV__` mode):
- Android: `ca-app-pub-3940256099942544/6300978111`
- iOS: `ca-app-pub-3940256099942544/2934735716`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Fixed app.json process.env syntax error**
- **Found during:** Task 1
- **Issue:** Existing `app.json` contained `process.env.REVENUECAT_API_KEY` which is invalid JSON syntax, causing `npx expo install` to fail with JSON parse error
- **Fix:** Converted `app.json` to `app.config.js` to support JavaScript environment variable syntax
- **Files modified:** `app.json` (deleted), `app.config.js` (created)
- **Commit:** `feat(03-02): install AdMob SDK and configure app.config`

**2. [Rule 2 - Missing Critical Functionality] Removed invalid RevenueCat plugin configuration**
- **Found during:** Task 1
- **Issue:** `react-native-purchases` plugin in app.json caused warning: "No app.plugin.js file found in react-native-purchases"
- **Fix:** Removed RevenueCat plugin entry from plugins array (RevenueCat doesn't have a config plugin)
- **Files modified:** `app.config.js`
- **Commit:** `feat(03-02): install AdMob SDK and configure app.config`

**3. [Task Consolidation] Production ad unit IDs added in Task 1**
- **Found during:** Task 3
- **Issue:** Task 3 required adding production ad unit ID placeholders, but these were already added in Task 1 for completeness
- **Resolution:** Task 3 marked as complete without separate commit (already completed in Task 1)
- **Impact:** None - plan efficiency improved by consolidating related configuration work

All other tasks executed exactly as planned.

## Authentication Gates
None encountered during this plan.

## Technical Details

### AdMob Integration Pattern
```typescript
// Platform-specific ad unit IDs with dev/test fallback
const AD_UNIT_ID = Platform.select({
  ios: __DEV__ ? TestIds.BANNER : process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID,
  android: __DEV__ ? TestIds.BANNER : process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID,
});

// Pro-user gating prevents ad rendering
if (isPro) return null;

// Safe area insets for device notch/home indicator
<View style={[styles.container, { paddingBottom: insets.bottom }]}>
  <BannerAd
    unitId={AD_UNIT_ID!}
    size={BannerAdSize.BANNER}
    requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    onAdFailedToLoad={(error) => console.log('Ad failed:', error.message)}
  />
</View>
```

### Configuration Architecture
- **app.config.js**: JavaScript-based config (not JSON) to support `process.env` variables
- **AdMob plugin**: Reads `ADMOB_ANDROID_APP_ID` and `ADMOB_IOS_APP_ID` from `.env`
- **EXPO_PUBLIC_ prefix**: Required for Expo to expose variables to React Native code
- **Test ID fallback**: `__DEV__` check automatically uses test ads in development

## Integration Points

The `BannerAdWrapper` component is ready to be integrated into tab screens:
- **Home screen**: `<BannerAdWrapper />` at bottom of plant collection
- **Results screen**: `<BannerAdWrapper />` below identification results
- **Settings screen**: `<BannerAdWrapper />` below settings options
- **Camera screen**: `<BannerAdWrapper />` below camera controls

Integration will be done in future plans (03-03 or later).

## Verification Results

All verification criteria from PLAN.md passed:
- [x] AdMob plugin configured in app.config.js with App IDs
- [x] BannerAdWrapper component exists and exports correctly
- [x] Component uses useProStore to check Pro status
- [x] Component returns null when isPro is true
- [x] Safe area insets used for bottom padding
- [x] Test ads used in __DEV__ mode via TestIds.BANNER
- [x] onAdFailedToLoad handler exists (no crash on ad failure)

## Success Criteria Met

- [x] AdMob SDK installed and configured
- [x] BannerAdWrapper component ready for integration into screens
- [x] Pro users will not see ads (component returns null)
- [x] Free users will see banner at bottom of screen
- [x] Clean fallback when ads fail to load (no placeholder)
- [x] Safe area handling for notched devices

## Next Steps

1. **User Action Required**: Replace placeholder AdMob App IDs with real values from AdMob console before production release
2. **Integration Plan**: Add `<BannerAdWrapper />` to tab screens in plan 03-03 or later
3. **Testing**: Test banner ads on physical device using development build (Expo Go doesn't support native modules)
4. **AdMob Console**: Create real ad units and update `.env` with production ad unit IDs

## Commits

1. `feat(03-02): install AdMob SDK and configure app.config` (5ebaf14)
   - Install react-native-google-mobile-ads package
   - Convert app.json to app.config.js
   - Add AdMob plugin configuration
   - Add environment variables for App IDs and ad unit IDs

2. `feat(03-02): create BannerAdWrapper component with Pro gating` (4d4ebbc)
   - Create BannerAdWrapper component
   - Implement Pro-user gating
   - Add safe area insets
   - Add clean error fallback

## Performance Metrics

- **Total Duration**: 3,869 seconds (64 minutes)
- **Tasks Completed**: 3 (Task 1, 2, 3)
- **Files Created**: 2 (app.config.js, components/BannerAdWrapper.tsx)
- **Files Modified**: 3 (.env, package.json, package-lock.json)
- **Commits Created**: 2
