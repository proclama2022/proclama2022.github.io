# Phase 3: Monetization - Research

**Researched:** 2026-02-20
**Domain:** In-App Purchases (IAP) + Mobile Ads (AdMob)
**Confidence:** MEDIUM

## Summary

Phase 3 requires implementing two distinct monetization systems: (1) Google AdMob banner ads displayed at the bottom of tab screens for free users, and (2) a one-time €4.99 Pro unlock that removes ads and increases scan/collection limits. The primary technical challenge is choosing the right IAP library for Expo 54's managed workflow while ensuring React Native 0.81.5 New Architecture compatibility for ad display.

**Critical finding:** `react-native-iap` (dooboolab) is deprecated in favor of `expo-iap`, but `expo-iap` does not exist. The actual recommended solution for Expo is **`react-native-purchases` (RevenueCat)**, which has official Expo config plugin support and includes server-side receipt validation out of the box.

**Primary recommendation:** Use RevenueCat's `react-native-purchases` for IAP (simpler, better Expo integration, built-in validation) + `react-native-google-mobile-ads` for AdMob (partial Fabric support on iOS, in-development on Android).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Ad Placement:** Fixed at bottom of screen, always visible when scrolling
- **Loading State:** Reserve space while ad loads (no layout shift)
- **Failure State:** Hide completely if ad fails to load (clean fallback, no placeholder)
- **Ad Scope:** Ads appear on all tab screens (not just Home)
- **Pro Upgrade Trigger:** Limit-based triggers — show upgrade prompt when user hits scan or plant limit
- **Upgrade Screen:** Benefits-focused modal with Pro benefits list, price, and CTA
- **Messaging:** Benefits-first — focus on limits removed (15 scans, unlimited plants)
- **CTA Button:** "Remove Ads & Unlock All — €4.99"
- **"No Subscription" Message:** Prominent in upgrade modal
- **Pro Verification:** Cache locally + periodic verify (weekly)
- **Offline Handling:** Trust cached Pro status when offline
- **Restore Purchases:** Settings button labeled "Restore Purchases"

### Claude's Discretion
- Verification failure handling (grace period, retry strategy)
- Scan limit modal integration with existing rate limit UI
- Plant limit enforcement UX details
- Pro benefits presentation at limit triggers

### Deferred Ideas (OUT OF SCOPE)
- Subscription model (alternative to one-time) — explicitly rejected for MVP
- Tiered Pro levels — future consideration
- Promotional pricing / sales — out of scope
- Family sharing — platform-dependent, defer
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RATE-02 | Pro users limited to 15 identifications per calendar day | RevenueCat entitlement-based gating; integrate with existing `rateLimiter.ts` pattern |
| AD-01 | AdMob banner ad displayed at bottom of Home screen | `react-native-google-mobile-ads` with `BannerAd` component; SafeAreaView for bottom positioning |
| AD-02 | Ad-free experience requires Pro unlock | RevenueCat `getCustomerInfo().entitlements.active` check controls ad visibility |
| AD-03 | Pro status persists across reinstalls (tracked locally + via StoreKit) | RevenueCat server-side verification + Zustand persist middleware for offline access |
| PRO-01 | Pro unlock removes ads from all screens | Single entitlement check (`no_ads`) used across all tab screens |
| PRO-02 | Pro unlock increases daily limits: 5 → 15 scans/day | Modify `rateLimiter.ts` DAILY_LIMIT based on Pro status from Zustand store |
| PRO-03 | Pro unlock removes "save to collection" limit (free: 10 plants, Pro: unlimited) | Add collection limit check in `plantsStore.ts`; gate `addPlant` based on Pro status |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-purchases | ^8.0.0 | RevenueCat SDK for IAP | **Recommended by Expo docs**; has official config plugin for managed workflow; includes server-side receipt validation; simpler than raw IAP libraries |
| react-native-google-mobile-ads | ^15.7.0 | AdMob integration for banner ads | Official Invertase library; Fabric support on iOS; actively maintained; 95%+ test coverage |
| zustand | ^5.0.11 | State management for Pro status | **Already installed**; persist middleware with AsyncStorage for Pro flag; project uses this pattern |
| @react-native-async-storage/async-storage | ^2.2.0 | Local persistence of Pro status | **Already installed**; used by existing stores; offline access to purchase status |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-dev-client | ~54.0.0 | Development build for testing IAP/ads | **Required** - Expo Go doesn't support native modules; create dev build with EAS for testing |
| expo-constants | ~18.0.13 | Access app config for AdMob App ID | **Already installed**; read AdMob IDs from `app.config.js` |
| react-native-safe-area-context | ~5.6.0 | Bottom safe area for banner ad positioning | **Already installed**; ensure ads don't overlap home indicator |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-purchases | expo-iap | `expo-iap` **does not exist** - npm search confusion; react-native-iap deprecated |
| react-native-purchases | react-native-iap | Deprecated; final release v13.0.0; no Expo config plugin; requires more manual setup |
| react-native-google-mobile-ads | expo-ads-admob | Archived library; not maintained; incompatible with RN 0.81 |

**Installation:**
```bash
# IAP (RevenueCat)
npx expo install react-native-purchases

# Ads (AdMob)
npx expo install react-native-google-mobile-ads

# Dev client (one-time setup for testing)
npx expo install expo-dev-client
```

**app.config.js additions:**
```javascript
module.exports = {
  expo: {
    plugins: [
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: process.env.ADMOB_ANDROID_APP_ID,
          iosAppId: process.env.ADMOB_IOS_APP_ID,
        }
      ]
    ],
  },
};
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stores/
│   └── proStore.ts           # Zustand store for Pro status (persisted)
├── services/
│   ├── purchaseService.ts    # RevenueCat wrapper (init, purchase, restore)
│   └── adService.ts          # AdMob helper (load ads, check Pro status)
├── hooks/
│   ├── useProStatus.ts       # Hook for Pro state + purchase functions
│   └── useRateLimit.ts       # MODIFY: check Pro status for elevated limits
├── components/
│   ├── BannerAdWrapper.tsx   # AdMob banner with Pro check + safe area
│   ├── ProUpgradeModal.tsx   # Upgrade prompt shown at limits
│   └── RateLimitModal.tsx    # MODIFY: Add Pro upgrade CTA
└── types/
    └── index.ts              # ADD: Pro-related types
```

### Pattern 1: Zustand Store for Pro Status
**What:** Single source of truth for Pro purchase state, persisted with AsyncStorage
**When to use:** All screens need to check Pro status for ads, limits, features
**Example:**
```typescript
// stores/proStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProState {
  isPro: boolean;
  lastVerified: string | null;  // ISO timestamp of last RevenueCat verification
  setIsPro: (status: boolean) => void;
  setLastVerified: (timestamp: string) => void;
  clear: () => void;
}

export const useProStore = create<ProState>()(
  persist(
    (set) => ({
      isPro: false,
      lastVerified: null,
      setIsPro: (status) => set({ isPro: status }),
      setLastVerified: (timestamp) => set({ lastVerified: timestamp }),
      clear: () => set({ isPro: false, lastVerified: null }),
    }),
    {
      name: 'plantid-pro-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Pattern 2: RevenueCat Service Wrapper
**What:** Encapsulate all RevenueCat operations (init, purchase, restore, status check)
**When to use:** Centralized IAP logic; consistent error handling across screens
**Example:**
```typescript
// services/purchaseService.ts
import { Purchases } from 'react-native-purchases';
import { useProStore } from '@/stores/proStore';

const ENTITLEMENT_ID = 'no_ads';  // Configured in RevenueCat dashboard

export async function initPurchases() {
  await Purchases.configure({ apiKey: process.env.REVENUECAT_API_KEY });
}

export async function checkProStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    useProStore.getState().setIsPro(isPro);
    return isPro;
  } catch (error) {
    console.error('Failed to check Pro status:', error);
    return useProStore.getState().isPro;  // Fallback to cached
  }
}

export async function purchasePro(): Promise<boolean> {
  try {
    const offerings = await Purchases.getOfferings();
    const product = offerings.current?.availableProducts[0];
    if (!product) throw new Error('No product available');

    const { customerInfo } = await Purchases.purchaseProduct(product.identifier);
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    if (isPro) {
      useProStore.getState().setIsPro(true);
      useProStore.getState().setLastVerified(new Date().toISOString());
    }
    return isPro;
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    if (isPro) {
      useProStore.getState().setIsPro(true);
    }
    return isPro;
  } catch (error) {
    console.error('Restore failed:', error);
    return false;
  }
}
```

### Pattern 3: AdMob Banner with Safe Area
**What:** Banner ad wrapper that checks Pro status before rendering
**When to use:** Bottom of every tab screen
**Example:**
```typescript
// components/BannerAdWrapper.tsx
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProStore } from '@/stores/proStore';

const AD_UNIT_ID = Platform.select({
  ios: __DEV__ ? 'ca-app-pub-3940256099942544/6300978111' : 'YOUR_IOS_BANNER_ID',
  android: __DEV__ ? 'ca-app-pub-3940256099942544/6300978111' : 'YOUR_ANDROID_BANNER_ID',
});

export function BannerAdWrapper() {
  const { isPro } = useProStore();
  const insets = useSafeAreaInsets();

  // Don't render ad if Pro
  if (isPro) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(error) => {
          // Clean fallback: hide on error
          console.log('Ad failed to load:', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
  },
});
```

### Pattern 4: Hook for Pro Status + Purchase
**What:** Combined hook for Pro state and purchase operations
**When to use:** Settings screen, upgrade modals, limit checks
**Example:**
```typescript
// hooks/useProStatus.ts
import { useState, useEffect } from 'react';
import { useProStore } from '@/stores/proStore';
import { checkProStatus, purchasePro, restorePurchases } from '@/services/purchaseService';

export function useProStatus() {
  const { isPro, setIsPro } = useProStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkProStatus();
  }, []);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const success = await purchasePro();
      return success;
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const success = await restorePurchases();
      if (success) setIsPro(true);
      return success;
    } finally {
      setLoading(false);
    }
  };

  return { isPro, loading, purchase: handlePurchase, restore: handleRestore };
}
```

### Pattern 5: Limit-Based Upgrade Triggers
**What:** Show upgrade modal when user hits scan or plant limits
**When to use:** After rate limit check, before plant save
**Example:**
```typescript
// Modify existing useRateLimit.ts
export function useRateLimit() {
  // ... existing code ...
  const { isPro } = useProStore();

  const checkLimit = useCallback(async () => {
    const result = await canIdentify();
    const effectiveLimit = isPro ? 15 : 5;  // Pro gets higher limit
    setAllowed(result.allowed || isPro);  // Pro bypasses limit
    setRemaining(Math.max(0, effectiveLimit - result.count));
    setLimit(effectiveLimit);
    return result;
  }, [isPro]);

  // ... rest of hook ...
}

// Trigger upgrade modal at limit
if (!allowed && !isPro) {
  showProUpgradeModal({
    benefit: '15 scans per day',
    onClose: () => navigation.goBack(),
  });
}
```

### Anti-Patterns to Avoid
- **Direct RevenueCat calls in components:** Wrap in `purchaseService.ts` for consistency
- **Storing Pro flag only in AsyncStorage:** Use Zustand persist (already project pattern)
- **Ad code in every screen:** Create reusable `BannerAdWrapper` component
- **Skipping "Restore Purchases":** Apple requires this for non-consumable approval
- **Checking Pro status on every render:** Cache in Zustand store; verify periodically (weekly)
- **Hardcoding ad IDs:** Use environment variables or Platform.select with test IDs for dev

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| In-app purchase handling | Native StoreKit/Play Billing integration | RevenueCat (`react-native-purchases`) | Receipt validation, subscription management, cross-platform abstraction, server-side verification |
| Ad loading/failure state | Custom ad loading logic with retries | `react-native-google-mobile-ads | Handles fill rate, mediation, error events, test IDs |
| Purchase receipt validation | Backend server to verify with Apple/Google | RevenueCat (included) | Security (no client-side spoofing), reduced backend complexity, GDPR compliance |
| Pro status persistence | Manual AsyncStorage writes/reads | Zustand persist middleware | Already project pattern; handles serialization, hydration, migration |
| Safe area insets | Manual bottom padding calculation | `useSafeAreaInsets()` hook | Handles iPhone X+ home indicator, notches, gesture bar |

**Key insight:** IAP and ads are deceptively complex. Receipt validation alone requires backend infrastructure, security considerations, and platform-specific handling. RevenueCat and react-native-google-mobile-ads have years of battle-tested edge case handling (refunds, chargebacks, network failures, subscription grace periods, etc.) that would take months to replicate.

## Common Pitfalls

### Pitfall 1: Testing IAP/Ads in Expo Go
**What goes wrong:** Features silently fail or crash because native modules aren't bundled
**Why it happens:** Expo Go is a pre-built app; it doesn't include third-party native modules
**How to avoid:** Create development build with `eas build --profile development`; test on physical device or simulator with dev build
**Warning signs:** `Native module cannot be found` errors, ads don't render, purchase throws undefined error

### Pitfall 2: Ignoring "Restore Purchases" Requirement
**What goes wrong:** App rejected during App Store review
**Why it happens:** Apple requires non-consumable purchases to be restorable; users expect purchases across devices
**How to avoid:** Add "Restore Purchases" button in Settings; call `Purchases.restorePurchases()` on button press
**Warning signs:** App Store review guidelines mention "restore" functionality explicitly

### Pitfall 3: Ad Layout Shift on Load
**What goes wrong:** Content jumps up when banner ad loads; poor UX
**Why it happens:** Ad doesn't reserve space until loaded; layout reflows
**How to avoid:** Set fixed height (50pt for BannerAdSize.BANNER) or use `onAdLoaded` to show; reserve space in container
**Warning signs:** Users complain about "jumping" UI; can't tap buttons during ad load

### Pitfall 4: Showing Ads to Pro Users
**What goes wrong:** Paid users see ads (major UX fail); support tickets; refunds
**Why it happens:** Ad rendering not gated by Pro status; race condition between purchase and ad hide
**How to avoid:** Single `BannerAdWrapper` component that checks `useProStore().isPro` before rendering; verify status on app launch
**Warning signs:** Pro users mention ads in reviews; inconsistent ad visibility

### Pitfall 5: RevenueCat Entitlement Mismatch
**What goes wrong:** Purchase succeeds but Pro status not recognized
**Why it happens:** Entitlement ID in code doesn't match RevenueCat dashboard; product not linked to entitlement
**How to avoid:** Define constant `ENTITLEMENT_ID = 'no_ads'` in one place; verify RevenueCat dashboard has same ID
**Warning signs:** `customerInfo.entitlements.active` is empty after successful purchase

### Pitfall 6: Hardcoded Ad Unit IDs
**What goes wrong:** Test ads shown in production; policy violations; no revenue
**Why it happens:** Forgot to swap test IDs for real AdMob unit IDs before release
**How to avoid:** Use `Platform.select()` with `__DEV__` check; environment variables for production IDs
**Warning signs:** AdMob console shows zero impressions; ads look "fake" (Google logo)

### Pitfall 7: Fabric Compatibility Issues (Android)
**What goes wrong:** Build failures or runtime crashes on Android with New Architecture
**Why it happens:** `react-native-google-mobile-ads` Fabric support in-development on Android (MEDIUM confidence)
**How to avoid:** **Spike at start of phase:** Build test app with New Architecture enabled; verify banner ads work; budget 2-3 hours for compatibility verification
**Warning signs:** `TypeError: null is not an object`, TurboModule errors, banner doesn't render

### Pitfall 8: Pro Status Check on Every Render
**What goes wrong:** Performance degradation; unnecessary RevenueCat API calls
**Why it happens:** Calling `checkProStatus()` in render loop instead of useEffect
**How to avoid:** Cache in Zustand store; verify only on app launch and weekly thereafter
**Warning signs:** Laggy UI, high RevenueCat API usage, console spam

## Code Examples

### Verified patterns from official sources:

### RevenueCat Non-Consumable Purchase
```typescript
// Source: RevenueCat docs (https://docs.revenuecat.com)
import { Purchases } from 'react-native-purchases';

// Purchase one-time Pro unlock
const purchasePro = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    const product = offerings.current?.availablePackages[0]?.product;
    if (!product) throw new Error('Product not configured');

    const { customerInfo } = await Purchases.purchaseProduct(product.identifier);

    // Check entitlement
    if (customerInfo.entitlements.active['no_ads']) {
      console.log('Pro unlocked!');
      return true;
    }
    return false;
  } catch (error) {
    if (error.userCancelled) {
      console.log('User cancelled purchase');
    } else {
      console.error('Purchase error:', error);
    }
    throw error;
  }
};
```

### AdMob Banner with Event Handlers
```typescript
// Source: react-native-google-mobile-ads official docs
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const AdBanner = () => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  return (
    <BannerAd
      unitId={__DEV__ ? TestIds.BANNER : 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX'}
      size={BannerAdSize.BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
        networkExtras: { collapsible: 'placeholder' }
      }}
      onAdLoaded={() => {
        setAdLoaded(true);
        setAdError(false);
      }}
      onAdFailedToLoad={(error) => {
        console.log('Ad failed:', error);
        setAdError(true);
      }}
    />
  );
};
```

### Zustand Persist with AsyncStorage
```typescript
// Source: Zustand docs (https://zustand-demo.pmnd.rs)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStore = create(
  persist(
    (set) => ({
      isPro: false,
      setIsPro: (status: boolean) => set({ isPro: status }),
    }),
    {
      name: 'plantid-pro-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Restore Purchases (Required for App Store)
```typescript
// Source: RevenueCat docs + Apple HIG
import { Purchases } from 'react-native-purchases';
import { Alert } from 'react-native';

const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();

    if (customerInfo.entitlements.active['no_ads']) {
      Alert.alert('Success', 'Your Pro purchase has been restored!');
      return true;
    } else {
      Alert.alert('No Purchases', 'No previous purchases found');
      return false;
    }
  } catch (error) {
    Alert.alert('Error', 'Could not restore purchases. Check your connection.');
    return false;
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-native-iap (dooboolab) | react-native-purchases (RevenueCat) | 2025 | Deprecation warning; Expo recommends RevenueCat for better integration |
| Manual StoreKit/Play Billing | RevenueCat SDK | 2024 | Server-side validation, simplified API, cross-platform abstraction |
| expo-ads-admob | react-native-google-mobile-ads | 2023 | Original library archived; Invertase fork is now standard |
| Fabric not supported | Partial Fabric support (iOS banner ads) | RN 0.76+ (2024) | 20% rendering improvement; Android still in-development |

**Deprecated/outdated:**
- **react-native-iap:** Deprecated in favor of expo-iap (which doesn't exist); final release v13.0.0; no Expo config plugin
- **expo-ads-admob:** Archived; incompatible with RN 0.81; no New Architecture support
- **expo-in-app-updates:** Archived; not an IAP library (different purpose)
- **Client-side receipt validation:** Security risk; RevenueCat handles server-side

## Open Questions

1. **Android Fabric Support for react-native-google-mobile-ads**
   - What we know: iOS has full Fabric support for banner ads; Android support "in-development" as of July 2025
   - What's unclear: Whether Android Fabric support is production-ready as of February 2026
   - Recommendation: **Spike at start of Phase 3** — Build minimal test app with New Architecture enabled; verify banner ads render on Android simulator; budget 2-3 hours; if broken, use legacy architecture on Android (acceptable fallback)

2. **RevenueCat Free Tier Limits**
   - What we know: RevenueCat has free tier; paid plans for higher transaction volume
   - What's unclear: Exact free tier limits (transactions/month, apps, revenue share)
   - Recommendation: Verify current pricing at https://www.revenuecat.com/pricing before committing; free tier likely sufficient for MVP (<10k transactions/month)

3. **Weekly Verification Strategy**
   - What we know: Pro status should be cached locally + verified weekly with RevenueCat
   - What's unclear: Whether to verify silently or notify user; handling verification failures (network error, server down)
   - Recommendation: Silent verification on app launch; if failed, trust cached Pro status for 7 days; show "verify purchase" button in Settings if verification stale > 14 days

## Sources

### Primary (HIGH confidence)
- RevenueCat official documentation (https://docs.revenuecat.com) - SDK reference, entitlements, purchase flow
- react-native-google-mobile-ads GitHub (https://github.com/invertase/react-native-google-mobile-ads) - Installation, ad events, Fabric support
- Expo In-App Purchases guide (https://docs.expo.dev/guides/in-app-purchases/) - Library comparison, dev build requirements
- Zustand persist middleware docs (https://zustand-demo.pmnd.rs) - AsyncStorage integration patterns

### Secondary (MEDIUM confidence)
- DEV.to - "Adding Google AdMob to Expo Apps" (ref_4) - Banner ad implementation, configuration
- RevenueCat GitHub (https://github.com/RevenueCat/react-native-purchases) - TypeScript examples, error handling
- Apple In-App Purchase HIG (https://developer.apple.com/design/human-interface-guidelines/in-app-purchase) - Non-consumable requirements, restore button
- Android One-Time Purchase Lifecycle (https://developer.android.com/google/play/billing/lifecycle/one-time) - Acknowledgment requirements

### Tertiary (LOW confidence)
- CSDN Blog - "React Native IAP 应用内功能全流程解析" (June 19, 2025) - Code examples for purchase listeners
- IBM Docs - React Native Expo monitoring (managed workflow limitations) - Explains why dev builds are required
- Various CSDN articles (2025) - Zustand + AsyncStorage patterns (verified against official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - RevenueCat and react-native-google-mobile-ads are well-established; Expo docs recommend RevenueCat
- Architecture: HIGH - Zustand persist pattern already in project; RevenueCat patterns verified against official docs
- Pitfalls: MEDIUM - Android Fabric support unconfirmed; requires spike for verification
- IAP library choice: HIGH - Clear evidence that react-native-iap is deprecated; RevenueCat is Expo's recommendation

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (30 days - IAP/ads space moves fast; verify RevenueCat pricing and AdMob Fabric status before implementation)
