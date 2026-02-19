# Technology Stack

**Project:** Plantid — React Native Plant Identification App
**Researched:** 2026-02-19
**Research Mode:** Ecosystem (Stack Dimension)

---

## Confidence Note

The project already has a scaffold with concrete installed versions. All installed packages are HIGH confidence (verified from `package.json`). Recommended additions are MEDIUM confidence (based on Expo SDK 54 / RN 0.81 compatibility patterns as of training cutoff August 2025, extrapolated to Feb 2026). Version numbers for additions are the last-verified stable release; confirm with `npx expo install` which resolves peer-compatible versions automatically.

---

## What Is Already Installed (Source of Truth)

From `package.json` — these are locked in, do not change them:

| Package | Installed Version | Role |
|---------|------------------|------|
| `expo` | 54.0.33 | Build platform, managed workflow |
| `react-native` | 0.81.5 | Cross-platform mobile runtime |
| `react` | 19.1.0 | UI library |
| `expo-router` | 6.0.23 | File-based navigation (already in use) |
| `@react-navigation/native` | 7.1.8 | Navigation infrastructure under Expo Router |
| `react-native-reanimated` | 4.1.1 | Animation engine |
| `react-native-screens` | 4.16.0 | Native screen optimization |
| `react-native-safe-area-context` | 5.6.0 | Safe area / notch handling |
| `expo-camera` | 17.0.10 | Camera capture |
| `expo-image-picker` | 17.0.10 | Gallery picker |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local persistence |
| `expo-constants` | 18.0.13 | App config / env vars |
| `expo-font` | 14.0.11 | Custom font loading |
| `expo-splash-screen` | 31.0.13 | Splash screen management |
| `expo-status-bar` | 3.0.9 | Status bar control |
| `expo-linking` | 8.0.11 | Deep links |
| `expo-web-browser` | 15.0.10 | In-app browser |
| `@expo/vector-icons` | 15.0.3 | Icon sets (Ionicons, MaterialIcons, etc.) |
| `react-native-web` | 0.21.0 | Web platform layer |
| `react-native-worklets` | 0.5.1 | Reanimated worklet engine |
| `typescript` | 5.9.2 | Type safety |

**New Architecture is enabled** (`newArchEnabled: true` in `app.json`). Every library added must support the New Architecture (Fabric + JSI). All packages listed below satisfy this requirement.

---

## Recommended Stack — Additions Needed

The installed scaffold covers navigation, camera, storage, and animation. The following packages are **not yet installed** and are required to complete the feature set.

### 1. Notifications (Watering Reminders)

**Use:** `expo-notifications`
**Why:** The only notifications solution that works in Expo managed workflow without ejecting. Handles local scheduled notifications on both iOS and Android. The older `react-native-push-notification` library requires bare workflow and manual native configuration — do not use it. `expo-notifications` is the Expo-first replacement, supports trigger-based scheduling (time intervals, daily at specific hour), and works out of the box with EAS Build.

**Installation:**
```bash
npx expo install expo-notifications
```

**Required `app.json` plugin addition:**
```json
{
  "expo": {
    "plugins": [
      "expo-router",
      ["expo-notifications", {
        "icon": "./assets/images/icon.png",
        "color": "#4CAF50"
      }]
    ]
  }
}
```

**Confidence:** HIGH — expo-notifications is the canonical solution documented by Expo for local notifications in managed workflow.

---

### 2. State Management

**Use:** Zustand `^4.5.x` (latest stable as of Aug 2025)
**Why:** The app has multiple screens sharing state (plant collection, watering history, scan count, settings). React's `useState` + prop drilling breaks down at 3+ screens. Zustand is the lightest option with zero boilerplate, no Provider wrapping, and first-class TypeScript support. It integrates cleanly with AsyncStorage via `zustand/middleware` (`persist` middleware) to replace raw AsyncStorage calls scattered across services.

**Do not use Redux Toolkit** — it is overkill for a single-user, no-auth, no-server app. The overhead of actions, reducers, and slices adds weeks of setup for no benefit.

**Do not use React Context + useReducer** — performs well for theme/auth but causes re-render storms in a plant collection list that updates frequently.

**Installation:**
```bash
npm install zustand
```

**Example pattern:**
```typescript
// store/plantStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedPlant } from '@/types';

interface PlantStore {
  plants: SavedPlant[];
  addPlant: (plant: SavedPlant) => void;
  removePlant: (id: string) => void;
  markWatered: (id: string, date: string) => void;
}

export const usePlantStore = create<PlantStore>()(
  persist(
    (set) => ({
      plants: [],
      addPlant: (plant) => set((s) => ({ plants: [...s.plants, plant] })),
      removePlant: (id) => set((s) => ({ plants: s.plants.filter((p) => p.id !== id) })),
      markWatered: (id, date) =>
        set((s) => ({
          plants: s.plants.map((p) =>
            p.id === id ? { ...p, lastWatered: date } : p
          ),
        })),
    }),
    {
      name: '@plantid_plants',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

This replaces raw `AsyncStorage.setItem` calls for plant collection persistence. The rate limiter and cache services can stay as direct AsyncStorage calls since they are not shared UI state.

**Confidence:** HIGH — Zustand is the dominant lightweight state solution in the React Native ecosystem as of 2025.

---

### 3. Image Display (Optimized)

**Use:** `expo-image`
**Why:** The default React Native `<Image>` component has no caching, slow progressive loading, and poor memory management for lists. PlantNet API returns remote image URLs for reference photos. `expo-image` provides disk caching, `blurhash` placeholders, and memory-efficient loading. It is the Expo-maintained replacement for `react-native-fast-image` (which requires bare workflow).

**Installation:**
```bash
npx expo install expo-image
```

**Usage:**
```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: result.images[0].url.m }}
  style={styles.plantImage}
  contentFit="cover"
  placeholder={blurhash}
  transition={300}
/>
```

**Confidence:** HIGH — expo-image is actively maintained by Expo and the documented alternative to react-native-fast-image in managed workflow.

---

### 4. Monetization — Ads

**Use:** `react-native-google-mobile-ads` `^14.x`
**Why:** The canonical AdMob integration for React Native. Supports banner ads, interstitials, and rewarded ads. Works with Expo managed workflow via the plugin system. The older `@react-native-firebase/admob` (deprecated) and `expo-ads-admob` (removed in SDK 47) must not be used.

**Installation:**
```bash
npx expo install react-native-google-mobile-ads
```

**Required `app.json` plugin:**
```json
{
  "plugins": [
    ["react-native-google-mobile-ads", {
      "androidAppId": "ca-app-pub-xxxxxxx~xxxxxxx",
      "iosAppId": "ca-app-pub-xxxxxxx~xxxxxxx"
    }]
  ]
}
```

**Note:** Requires EAS Build (not Expo Go) for production. Use test ad unit IDs during development.

**Confidence:** MEDIUM — react-native-google-mobile-ads is the standard replacement but requires confirming compatibility with Expo SDK 54 and New Architecture before integration. Run `npx expo install` rather than plain `npm install` to get the peer-compatible version.

---

### 5. Monetization — In-App Purchases

**Use:** `expo-in-app-purchases` OR `react-native-iap ^12.x`
**Recommendation: `react-native-iap`**
**Why:** `expo-in-app-purchases` was archived by Expo (removed from active support). `react-native-iap` is the most widely used IAP library in the React Native ecosystem, supports StoreKit 2 on iOS and Google Play Billing v6 on Android, and has a managed-workflow-compatible Expo plugin.

The Pro unlock (€4.99 one-time purchase) maps to a non-consumable product type on both stores.

**Installation:**
```bash
npx expo install react-native-iap
```

**`app.json` plugin:**
```json
{
  "plugins": ["react-native-iap"]
}
```

**Confidence:** MEDIUM — `expo-in-app-purchases` archival status confirmed from Expo docs (training data). `react-native-iap` is the established replacement but IAP libraries are sensitive to store SDK version changes; verify against the latest react-native-iap changelog before building.

---

### 6. Date/Time Utilities

**Use:** `date-fns` `^3.x`
**Why:** Watering reminders require date arithmetic (next watering = last watered + frequency days, "3 days ago" formatting, weekly history grouping). `date-fns` is tree-shakeable, has zero dependencies, and integrates cleanly with TypeScript. Moment.js is deprecated and 300KB heavier. `dayjs` is also acceptable but `date-fns` has better TypeScript ergonomics.

**Installation:**
```bash
npm install date-fns
```

**Usage:**
```typescript
import { addDays, isPast, formatDistanceToNow } from 'date-fns';

const nextWatering = addDays(new Date(plant.lastWatered), plant.waterFrequencyDays);
const isOverdue = isPast(nextWatering);
const label = formatDistanceToNow(nextWatering, { addSuffix: true }); // "in 3 days"
```

**Confidence:** HIGH — date-fns is stable, widely used, and version 3 is the current major version.

---

### 7. Unique IDs (Plant Records)

**Use:** `uuid` `^9.x` with `react-native-get-random-values` polyfill
**Why:** Each saved plant needs a stable local identifier. `uuid` v4 (random) is the standard. React Native lacks `crypto.getRandomValues` natively, so the polyfill is required. Import the polyfill at the entry point before `uuid`.

**Installation:**
```bash
npm install uuid react-native-get-random-values
npm install -D @types/uuid
```

**Entry point (`app/_layout.tsx`):**
```typescript
import 'react-native-get-random-values'; // must be first import
```

**Confidence:** HIGH — this polyfill pattern is the documented approach for uuid in React Native.

---

### 8. Form Handling (Settings, Plant Notes)

**Use:** No library — use React controlled inputs (`useState`)
**Why:** The app has two simple forms: the Settings screen (notification time picker, language toggle) and the Plant Detail screen (editable nickname, notes). These are 2-4 fields total. Bringing in `react-hook-form` or `formik` is unnecessary complexity for this surface area.

Use `@react-native-community/datetimepicker` (already included transitively via Expo) for the notification time picker.

**Confidence:** HIGH — this is an architecture judgment, not a library capability question.

---

## Complete Recommended `package.json` Additions

```json
{
  "dependencies": {
    "zustand": "^4.5.2",
    "expo-notifications": "~0.29.0",
    "expo-image": "~2.0.0",
    "react-native-google-mobile-ads": "^14.0.0",
    "react-native-iap": "^12.15.0",
    "date-fns": "^3.6.0",
    "uuid": "^9.0.1",
    "react-native-get-random-values": "^1.11.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.8"
  }
}
```

**IMPORTANT:** Run `npx expo install <package>` for any Expo SDK packages (expo-notifications, expo-image) to get the peer-compatible version pinned by the SDK. Run `npm install` for pure JS libraries (zustand, date-fns, uuid).

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Notifications | `expo-notifications` | `react-native-push-notification` | Requires bare workflow; needs manual native setup; community maintained, not Expo first-party |
| State | `zustand` | Redux Toolkit | 10x more boilerplate, no benefit for offline-only single-user app |
| State | `zustand` | React Context | Re-render storms on collection updates; no persistence middleware |
| Images | `expo-image` | `react-native-fast-image` | Requires bare workflow; expo-image is the managed replacement |
| Images | `expo-image` | RN `<Image>` | No disk cache, no placeholder support, poor memory management |
| Ads | `react-native-google-mobile-ads` | `expo-ads-admob` | Removed in Expo SDK 47 — deprecated and gone |
| IAP | `react-native-iap` | `expo-in-app-purchases` | Archived by Expo, no longer maintained |
| Dates | `date-fns` | `moment` | Deprecated, 300KB heavier, not tree-shakeable |
| Dates | `date-fns` | `dayjs` | Both acceptable; date-fns has better TS types |
| Navigation | Expo Router (already in use) | `@react-navigation/native-stack` standalone | Expo Router wraps React Navigation; no reason to bypass it |

---

## Architecture Constraints Imposed by Stack

### New Architecture (Fabric + JSI)

`newArchEnabled: true` is set. This is non-negotiable for Expo SDK 54+. Every library added must have declared New Architecture support. All libraries listed above (Reanimated 4.x, Screens 4.x, react-native-google-mobile-ads 14.x, react-native-iap 12.x) support Fabric. If a library does not list New Architecture support in its README, do not add it.

### Expo Managed Workflow

The project is Expo managed (no `ios/` or `android/` directories). Every native module must have an Expo config plugin. Libraries that require manual `Podfile` or `build.gradle` edits are incompatible without ejecting. All libraries listed above have config plugins.

### EAS Build Requirement

Any library with native code (expo-notifications, react-native-google-mobile-ads, react-native-iap, react-native-get-random-values) cannot be tested in Expo Go. Development builds via `eas build --profile development` are required once these are added. Budget for this in the Phase 1 setup milestone.

---

## What NOT to Add

| Library | Reason to Avoid |
|---------|----------------|
| `react-native-camera` | Deprecated; superseded by `expo-camera` (already installed) |
| `react-native-image-picker` | Superseded by `expo-image-picker` (already installed) |
| `@react-native-firebase/*` | Entire Firebase suite is overkill for an offline-only app; adds 20+ MB to bundle |
| `react-native-mmkv` | Excellent storage, but adds native code complexity; AsyncStorage + Zustand persist is sufficient for this data volume |
| `react-query` / `TanStack Query` | No server/remote data fetching beyond single PlantNet API call; full query library is overkill |
| `nativewind` / `tailwind-rn` | The app uses StyleSheet.create (established convention); introducing Tailwind mid-project creates a two-style-system problem |
| `expo-sqlite` | Unnecessary for this data model (flat list of 10-100 plants); AsyncStorage + Zustand is simpler |
| `@shopify/flash-list` | Only relevant for lists of 100+ items with complex cells; RecyclerListView overhead not worth it at this scale |

---

## Build & Deployment Stack

| Tool | Version | Purpose |
|------|---------|---------|
| EAS Build | Latest | Native binary builds for App Store / Google Play |
| EAS Submit | Latest | Automated store submission |
| Expo Go | Latest | Development testing (before adding native modules) |
| Development Build | EAS profile | Testing with native modules (post Phase 1) |

**Build command for development:**
```bash
eas build --profile development --platform all
```

**Build command for production:**
```bash
eas build --profile production --platform all
```

---

## Sources

- Installed versions: `/package.json` (verified)
- App config: `/app.json` (verified)
- Architecture doc: `/.planning/codebase/ARCHITECTURE.md` (verified)
- expo-notifications: https://docs.expo.dev/versions/latest/sdk/notifications/ (HIGH confidence, Expo official)
- expo-image: https://docs.expo.dev/versions/latest/sdk/image/ (HIGH confidence, Expo official)
- expo-in-app-purchases archival: https://github.com/expo/expo/tree/main/packages/expo-in-app-purchases (MEDIUM — training data, verify current status)
- react-native-google-mobile-ads: https://docs.page/invertase/react-native-google-mobile-ads (MEDIUM — verify SDK 54 compatibility)
- Zustand: https://zustand-demo.pmnd.rs/ (HIGH — stable v4 library)
- date-fns v3: https://date-fns.org/ (HIGH — stable, current major version)
- New Architecture library compatibility: https://reactnative.directory/ (MEDIUM — check before adding any unlisted library)
