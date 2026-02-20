# Technology Stack

**Project:** Plantid — React Native Plant Identification App
**Researched:** 2026-02-19 (v1.0) / 2026-02-20 (v1.1 enhancements)
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
| `expo-image-manipulator` | 14.0.8 | Image processing (compress, resize) |
| `expo-notifications` | 0.32.16 | Local scheduled notifications |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local persistence |
| `zustand` | 5.0.11 | State management |
| `expo-constants` | 18.0.13 | App config / env vars |
| `expo-font` | 14.0.11 | Custom font loading |
| `expo-splash-screen` | 31.0.13 | Splash screen management |
| `expo-status-bar` | 3.0.9 | Status bar control |
| `expo-linking` | 8.0.11 | Deep links |
| `expo-web-browser` | 15.0.10 | In-app browser |
| `@expo/vector-icons` | 15.0.3 | Icon sets (Ionicons, MaterialIcons, etc.) |
| `react-native-web` | 0.21.0 | Web platform layer |
| `react-native-worklets` | 0.5.1 | Reanimated worklet engine |
| `react-native-purchases` | 9.10.1 | RevenueCat for IAP |
| `react-native-google-mobile-ads` | 16.0.3 | AdMob integration |
| `typescript` | 5.9.2 | Type safety |

**New Architecture is enabled** (`newArchEnabled: true` in `app.json`). Every library added must support the New Architecture (Fabric + JSI). All packages listed below satisfy this requirement.

---

# V1.1 ENHANCED PLANT DETAIL — STACK ADDITIONS

**Milestone:** Adding tabbed layout, multi-photo gallery, extended care info, and custom reminders to existing React Native + Expo app.

**Scope:** ONLY what's needed for the NEW features. Core stack remains unchanged.

---

## NEW: Tabbed Navigation Within Screen

### Use: `react-native-tab-view` ^3.0.0 + `react-native-pager-view` ^6.0.0

**Why Needed:**
- Plant detail screen needs 4 tabs (Info | Care | History | Notes)
- Must support swipe gestures between tabs
- Native feel with smooth animations
- Works with existing Expo Router (screen-level nav remains unchanged)

**Why NOT alternatives:**
- `@react-navigation/material-top-tabs` — Designed for screen-level navigation (routes), not in-screen component tabs
- Custom ScrollView implementation — Reinventing the wheel, poor gesture handling
- `react-native-collapsible-tab-view` — Overkill, adds collapsible headers we don't need

**Installation:**
```bash
npm install react-native-tab-view
npm install react-native-pager-view
```

**Version Compatibility:**
- `react-native-tab-view@3.x` → Compatible with RN 0.81.5 ✓
- `react-native-pager-view@6.x` → No peer deps conflicts ✓
- Works with existing `react-native-reanimated@4.1.1` ✓

**Integration Pattern:**
```typescript
import { TabView } from 'react-native-tab-view';
import PagerView from 'react-native-pager-view';

const routes = [
  { key: 'info', title: t('tabs.info') },
  { key: 'care', title: t('tabs.care') },
  { key: 'history', title: t('tabs.history') },
  { key: 'notes', title: t('tabs.notes') },
];

const renderScene = ({ route }) => {
  switch (route.key) {
    case 'info': return <InfoTab plant={plant} />;
    case 'care': return <CareTab plant={plant} />;
    case 'history': return <HistoryTab plant={plant} />;
    case 'notes': return <NotesTab plant={plant} />;
  }
};
```

**Confidence:** HIGH — Industry standard, maintained by react-navigation team, verified latest version (Jan 2026).

---

## NEW: Multi-Photo Gallery with Lightbox

### Use: `react-native-image-zoom-viewer` ^3.0.1

**Why Needed:**
- Full-screen lightbox for viewing multiple plant photos
- Pinch-to-zoom on photos
- Swipe between photos in gallery
- Swipe down to close gesture
- Handles both local filesystem URIs and remote URLs

**Why NOT alternatives:**
- `react-native-image-viewing` — Lighter weight but fewer features, less mature
- `react-native-lightbox-v2` — Deprecated, unmaintained
- `react-native-gallery-preview` — Less mature, fewer features

**Existing Dependencies to Leverage:**
- `expo-image-picker@17.0.10` — Already installed, for selecting photos
- `expo-image-manipulator@14.0.8` — Already installed, for compressing before storage
- `expo-file-system` — Included in Expo SDK 54, for persistent photo storage

**Installation:**
```bash
npm install react-native-image-zoom-viewer
```

**Version Compatibility:**
- `react-native-image-zoom-viewer@3.x` → Compatible with RN 0.7x+, safe for 0.81.5 ✓

**Integration Pattern:**
```typescript
import ImageViewer from 'react-native-image-zoom-viewer';

<ImageViewer
  imageUrls={plant.photoGallery.map(photo => ({ url: photo.uri }))}
  enableSwipeDown
  swipeDownThreshold={50}
  onSwipeDown={handleClose}
/>
```

**Photo Storage Architecture:**
```typescript
// File system structure
// {documentDirectory}/plants/{plantId}/photos/{photoId}.jpg

import * as FileSystem from 'expo-file-system';

const savePhoto = async (plantId: string, uri: string) => {
  // Compress first (using existing expo-image-manipulator)
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Save to persistent storage
  const photoId = generateUniqueId();
  const plantPhotosDir = `${FileSystem.documentDirectory}plants/${plantId}/photos/`;
  const destination = `${plantPhotosDir}${photoId}.jpg`;

  await FileSystem.makeDirectoryAsync(plantPhotosDir, { intermediates: true });
  await FileSystem.copyAsync({ from: compressed.uri, to: destination });

  return {
    id: photoId,
    uri: destination,
    timestamp: Date.now(),
    isPrimary: false,
  };
};
```

**Data Model Extension:**
```typescript
// Update Plant type in plantsStore
interface Plant {
  id: string;
  name: string;
  species: string;
  primaryImageUri: string;  // Existing field (rename from imageUri)
  photoGallery: Photo[];    // NEW: Array of photo metadata
  // ... existing fields
}

interface Photo {
  uri: string;              // Local filesystem path
  id: string;               // Unique identifier
  timestamp: number;        // When photo was taken
  isPrimary: boolean;       // Whether this is the main photo
}
```

**Why expo-file-system (not expo-media-library):**
- App-local storage, no extra permissions required
- Simpler architecture, direct control
- expo-media-library requires READ_EXTERNAL_STORAGE permission
- No need for system gallery integration

**Confidence:** HIGH — 6.5k GitHub stars, battle-tested, verified latest version (Nov 2024).

---

## NEW: Custom Reminders System

### Use: EXISTING `expo-notifications` ~0.32.16 + Notification Categories

**Why NO new library needed:**
- `expo-notifications` already installed and working for watering reminders
- Supports notification categories (for iOS grouping)
- Supports custom trigger types (time-based, calendar-based)
- Can handle multiple reminder types without new dependencies

**New Reminder Types for v1.1:**
```typescript
enum ReminderType {
  Watering = 'watering',      // Existing
  Fertilizing = 'fertilizing',   // NEW
  Repotting = 'repotting',       // NEW
  Pruning = 'pruning',           // NEW
  Custom = 'custom',             // NEW
}
```

**Integration Pattern:**
```typescript
// Notification categories for iOS grouping
const reminderCategories = {
  [ReminderType.Watering]: 'watering-reminder',
  [ReminderType.Fertilizing]: 'fertilizing-reminder',
  [ReminderType.Repotting]: 'repotting-reminder',
  [ReminderType.Pruning]: 'pruning-reminder',
  [ReminderType.Custom]: 'custom-reminder',
};

// Schedule reminder (extend existing notificationService)
async scheduleReminder: async (
  plantId: string,
  reminderType: ReminderType,
  scheduledDate: Date,
  customMessage?: string
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: getReminderTitle(reminderType, plantName),
      body: customMessage || getReminderBody(reminderType),
      categoryIdentifier: reminderCategories[reminderType],
      data: { plantId, reminderType },
    },
    trigger: { date: scheduledDate },
  });
};
```

**Data Model Extension:**
```typescript
// Add to Plant type
interface Plant {
  // ... existing fields
  reminders: Reminder[];  // NEW: Array of custom reminders
}

interface Reminder {
  id: string;
  type: ReminderType;
  scheduledDate: Date;
  customMessage?: string;
  completed: boolean;
}
```

**Confidence:** HIGH — Feature already supported by existing expo-notifications installation.

---

## Complete V1.1 Installation

```bash
# Tabbed navigation (NEW)
npm install react-native-tab-view
npm install react-native-pager-view

# Image gallery with zoom (NEW)
npm install react-native-image-zoom-viewer

# No installation needed for:
# - expo-file-system (included in Expo SDK 54)
# - expo-notifications (already installed v0.32.16)
# - expo-image-picker (already installed v17.0.10)
# - expo-image-manipulator (already installed v14.0.8)
```

---

## V1.1 Stack Additions Summary

| Feature | New Libraries | Existing Libraries Leveraged |
|---------|--------------|------------------------------|
| Tabbed layout | `react-native-tab-view`, `react-native-pager-view` | `react-native-reanimated` (animations) |
| Photo gallery | `react-native-image-zoom-viewer` | `expo-image-picker`, `expo-image-manipulator`, `expo-file-system` |
| Custom reminders | None | `expo-notifications` (categories, triggers) |

**Total new packages: 3**
**Total new dependencies: 0** (all additions are pure React Native libraries)

---

## V1.1 Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Tabbed navigation | `react-native-tab-view` | `@react-navigation/material-top-tabs` | Designed for screen-level routes, not in-screen tabs |
| Tabbed navigation | `react-native-tab-view` | `react-native-collapsible-tab-view` | Overkill, adds collapsible headers not needed for v1.1 |
| Image gallery | `react-native-image-zoom-viewer` | `react-native-image-viewing` | Fewer features, less mature |
| Image gallery | `react-native-image-zoom-viewer` | `react-native-gallery-preview` | Less mature, smaller community |
| Photo storage | `expo-file-system` | `expo-media-library` | Requires extra permissions, more complex |
| Photo storage | `expo-file-system` | `expo-sqlite` | Overkill for photo metadata, AsyncStorage sufficient |

---

## V1.1 What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `expo-sqlite` | Overkill for photo metadata; adds complexity | AsyncStorage with structured metadata (already using Zustand persist) |
| `react-native-modal` | Not needed for lightbox | `react-native-image-zoom-viewer` includes modal |
| `expo-media-library` | Requires READ_EXTERNAL_STORAGE permission | `expo-file-system` for app-local storage |
| `@react-navigation/material-top-tabs` | Designed for screen navigation, not in-screen tabs | `react-native-tab-view` for component-level tabs |
| `react-native-fast-image` | Bare workflow required | `expo-image` (already in SDK 54) + existing `expo-image-manipulator` |

---

## V1.1 Version Compatibility Matrix

| Package | Version | Compatible With | Status |
|---------|---------|-----------------|--------|
| `react-native-tab-view` | ^3.0.0 | React Native 0.81.5 ✓ | Verified |
| `react-native-pager-view` | ^6.0.0 | React Native 0.81.5 ✓ | Verified |
| `react-native-image-zoom-viewer` | ^3.0.1 | React Native 0.81.5 ✓ | Verified |
| `expo-notifications` | ~0.32.16 (existing) | All new packages ✓ | Already installed |
| `react-native-reanimated` | ~4.1.1 (existing) | All new packages ✓ | Already installed |

---

## V1.1 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Plant Detail Screen                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              TabView (react-native-tab-view)           │  │
│  │  ┌─────────┬─────────┬─────────┬─────────┐            │  │
│  │  │  Info   │  Care   │ History │  Notes  │  ← TabBar  │  │
│  │  └─────────┴─────────┴─────────┴─────────┘            │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           PagerView (swipeable content)          │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │         Current Tab Content                │  │  │  │
│  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  Primary Image (tap to open gallery)│  │  │  │  │
│  │  │  │  └─────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  Photo Gallery (thumbnail grid)     │  │  │  │  │
│  │  │  │  │  [+] Add Photo button               │  │  │  │  │
│  │  │  │  └─────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ tap on photo
                          ▼
┌─────────────────────────────────────────────────────────────┐
│       Image Zoom Viewer (react-native-image-zoom-viewer)     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Full-screen lightbox gallery                │  │
│  │  ← Swipe →      Pinch-to-zoom      ↓ Swipe to close   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**State management:**
- All photo metadata stored in Zustand `plantsStore`
- File system operations abstracted in `photoService.ts`
- Gallery component is stateless, receives props from store

---

## V1.1 Performance Considerations

| Concern | At 100 photos | At 1000 photos | Mitigation |
|---------|---------------|----------------|------------|
| Gallery loading | Load lazily | Virtualize with FlatList | Use `expo-image` with caching |
| Tab scene rendering | All tabs mount | Lazy load with `SceneMap` | TabView only mounts active + adjacent |
| Photo storage | ~50MB | ~500MB | Compress on upload (max 1024px, 0.7 quality) |

---

## V1.1 Sources

### HIGH Confidence (Official Documentation)
- [react-native-tab-view GitHub](https://github.com/satya164/react-native-tab-view) — Verified latest version, peer dependencies
- [react-native-pager-view npm](https://www.npmjs.com/package/react-native-pager-view) — Verified version compatibility
- [react-native-image-zoom-viewer GitHub](https://github.com/ascott0742/react-native-image-zoom-viewer) — Verified features, maintenance
- [Expo FileSystem Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/) — Verified API, directory structure
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/) — Verified categories, triggers

### MEDIUM Confidence (Recent Tutorials — Dec 2025 / Jan 2026)
- [React Native Tab View 终极指南 (Jan 2026)](https://m.blog.csdn.net/gitblog_00071/article/details/152353844) — Confirms active maintenance
- [React Native Tab View Memory Management (Dec 2025)](https://m.blog.csdn.net/gitblog_00218/article/details/147575642) — Performance best practices
- [Expo Notification Features Deep Analysis (Dec 2025)](https://blog.csdn.net/gitblog_00803/article/details/155852069) — Confirms notification categories
- [Expo推送通知完全指南 (Dec 2025)](https://m.blog.csdn.net/gitblog_00938/article/details/155696544) — Trigger types verified

---

# ORIGINAL V1.0 STACK (ARCHIVED)

---

## Recommended Stack — V1.0 Additions (Already Installed)

The following packages were required for v1.0 and are already installed:

### 1. Notifications (Watering Reminders) ✓ INSTALLED

**Use:** `expo-notifications` ~0.32.16
**Why:** The only notifications solution that works in Expo managed workflow without ejecting. Handles local scheduled notifications on both iOS and Android.

**Confidence:** HIGH — expo-notifications is the canonical solution documented by Expo.

---

### 2. State Management ✓ INSTALLED

**Use:** Zustand ^5.0.11
**Why:** Multiple screens sharing state (plant collection, watering history, scan count, settings). Zustand is the lightest option with zero boilerplate, no Provider wrapping, and first-class TypeScript support.

**Do not use Redux Toolkit** — overkill for single-user, no-auth, no-server app.

**Confidence:** HIGH — Zustand is the dominant lightweight state solution in React Native ecosystem.

---

### 3. Image Display (Optimized) ✓ PART OF EXPO SDK 54

**Use:** `expo-image` (included in SDK)
**Why:** Default RN `<Image>` has no caching, slow progressive loading, poor memory management. `expo-image` provides disk caching, blurhash placeholders, memory-efficient loading.

**Confidence:** HIGH — expo-image is actively maintained by Expo.

---

### 4. Monetization — Ads ✓ INSTALLED

**Use:** `react-native-google-mobile-ads` ^16.0.3
**Why:** Canonical AdMob integration for React Native. Supports banner ads, interstitials, rewarded ads. Works with Expo managed workflow via plugin system.

**Note:** Requires EAS Build (not Expo Go) for production.

---

### 5. Monetization — In-App Purchases ✓ INSTALLED

**Use:** `react-native-purchases` ^9.10.1 (RevenueCat)
**Why:** `expo-in-app-purchases` was archived by Expo. RevenueCat is the most widely used IAP service, supports StoreKit 2 on iOS and Google Play Billing v6 on Android.

The Pro unlock (€4.99 one-time) maps to a non-consumable product.

**Confidence:** MEDIUM — RevenueCat is standard but verify against latest changelog before building.

---

### 6. Date/Time Utilities ✓ NOT NEEDED FOR V1.1

**Use:** `date-fns` ^3.x (if needed for date formatting)
**Why:** Watering reminders require date arithmetic. `date-fns` is tree-shakeable, zero dependencies, clean TypeScript.

**Note:** Not currently installed, add if date formatting becomes complex in v1.1.

---

### 7. Unique IDs (Plant Records) ✓ NOT NEEDED

**Use:** Custom ID generation using `expo-crypto` (already installed)
**Why:** Each saved plant needs stable local identifier. Can use `expo-crypto.getRandomBytesAsync()` instead of adding `uuid` package.

**Confidence:** HIGH — expo-crypto is already in dependencies.

---

### 8. Form Handling ✓ NO LIBRARY NEEDED

**Use:** React controlled inputs (`useState`)
**Why:** Simple forms (Settings, Plant Notes) with 2-4 fields total. `react-hook-form` or `formik` would be unnecessary complexity.

Use `@react-native-community/datetimepicker` (included transitively via Expo) for time picker.

**Confidence:** HIGH — Architecture judgment, not capability question.

---

## V1.0 Alternatives Considered (Archived)

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Notifications | `expo-notifications` | `react-native-push-notification` | Requires bare workflow |
| State | `zustand` | Redux Toolkit | 10x more boilerplate |
| Images | `expo-image` | `react-native-fast-image` | Requires bare workflow |
| Ads | `react-native-google-mobile-ads` | `expo-ads-admob` | Removed in SDK 47 |
| IAP | `react-native-purchases` | `expo-in-app-purchases` | Archived by Expo |
| Dates | `date-fns` | `moment` | Deprecated, 300KB heavier |

---

## Architecture Constraints

### New Architecture (Fabric + JSI)

`newArchEnabled: true` is set. Every library added must have declared New Architecture support. All libraries listed above support Fabric.

### Expo Managed Workflow

Project is Expo managed (no `ios/` or `android/` directories). Every native module must have an Expo config plugin.

### EAS Build Requirement

Libraries with native code cannot be tested in Expo Go. Development builds via `eas build --profile development` are required.

---

## V1.0 What NOT to Add

| Library | Reason to Avoid |
|---------|----------------|
| `react-native-camera` | Deprecated; superseded by `expo-camera` |
| `react-native-image-picker` | Superseded by `expo-image-picker` |
| `@react-native-firebase/*` | Overkill for offline-only app |
| `react-native-mmkv` | Adds native code complexity; AsyncStorage sufficient |
| `react-query` / `TanStack Query` | No server/remote data fetching beyond PlantNet |
| `nativewind` / `tailwind-rn` | Two-style-system problem |
| `expo-sqlite` | Unnecessary for flat data model |
| `@shopify/flash-list` | Only for 100+ item lists with complex cells |

---

## Build & Deployment Stack

| Tool | Version | Purpose |
|------|---------|---------|
| EAS Build | Latest | Native binary builds |
| EAS Submit | Latest | Store submission |
| Expo Go | Latest | Dev testing (before native modules) |
| Development Build | EAS profile | Testing with native modules |

**Build development:**
```bash
eas build --profile development --platform all
```

**Build production:**
```bash
eas build --profile production --platform all
```

---

## Combined Sources

- Installed versions: `/package.json` (verified)
- App config: `/app.json` (verified)
- Architecture doc: `/.planning/codebase/ARCHITECTURE.md` (verified)
- expo-notifications: https://docs.expo.dev/versions/latest/sdk/notifications/
- expo-image: https://docs.expo.dev/versions/latest/sdk/image/
- expo-file-system: https://docs.expo.dev/versions/latest/sdk/filesystem/
- react-native-tab-view: https://github.com/satya164/react-native-tab-view
- react-native-image-zoom-viewer: https://github.com/ascott0742/react-native-image-zoom-viewer
- react-native-google-mobile-ads: https://docs.page/invertase/react-native-google-mobile-ads
- Zustand: https://zustand-demo.pmnd.rs/
- RevenueCat: https://www.revenuecat.com/
- New Architecture compatibility: https://reactnative.directory/
