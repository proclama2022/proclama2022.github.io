# Phase 1: Foundation and Core Loop - Research

**Researched:** 2026-02-19
**Domain:** React Native (Expo SDK 54) + PlantNet API + Zustand State Management
**Confidence:** HIGH

## Summary

Phase 1 implements the core identify-save-view loop: full-screen camera with post-capture organ selection, PlantNet API integration with proper caching, results carousel with care info, persistent plant collection, daily rate limiting, and full IT/EN localization. The existing services have critical bugs that must be fixed before any UI work: API key exposure in bundle, cache has no LRU cap and hash collision vulnerabilities, rate limiter has race conditions.

**Primary recommendation:** Use expo-camera with separate gallery button (not combined action sheet), Zustand with AsyncStorage middleware for state persistence, react-native-snap-carousel for results carousel, Cloudflare Workers proxy to hide API key, and lru-cache library to replace the broken custom cache.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Full-screen camera** experience (not embedded view)
- **Post-capture organ selector** — bottom sheet/modal appears after photo taken to select leaf/flower/fruit/bark/auto
- **Preview + confirm** before API call — user can retake if needed
- **Separate buttons** for camera and gallery (not combined in one action sheet)
- **Card carousel** layout — one match visible at a time, swipe/arrow to see alternatives
- **Compact info with expand** — photo, species name, confidence bar visible; tap to expand care details
- **Warn if low confidence** — if best match <50%, show warning message with option to retry
- **"Add to collection" button on card** — no need to open detail view to add
- **User choice: grid/list toggle** — 2-column grid or single-column list, switchable
- **Minimal card info** — photo thumbnail, common name, location nickname only
- **Sorted by date added** — most recent first
- **Badge on cards** for plants that need watering today (not separate section)
- **Quick onboarding** (2-3 screens) on first launch explaining key features
- **Friendly empty state** — illustration + "Identify your first plant!" + prominent camera FAB
- **Modal overlay** when rate limit reached — clear message, "Come back tomorrow" CTA
- **Tab bar navigation** — Home, Camera, Settings as main tabs

### Claude's Discretion
- Exact visual design of cards, badges, carousels, onboarding screens
- Animation/transition details between screens
- Error state UI patterns (network error, API error, permission denied)
- Loading state designs (skeleton, spinners)
- Onboarding copy and illustration content
- Tab bar icons and styling

### Deferred Ideas (OUT OF SCOPE)
- Watering reminder notifications — Phase 2
- Watering history per plant — Phase 2
- AdMob banner integration — Phase 3
- Pro unlock IAP — Phase 3
- Multi-photo identification (3+ photos for accuracy) — v2 backlog
- Plant growth photo timeline — v2 backlog
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ID-01..07 | Camera/gallery capture, organ selection, API call, results display, caching, confidence visualization | See Camera & Capture Flow, API & Caching sections |
| COLL-01..06 | Save to collection, view grid/list, detail screen, delete, persist across restarts | See State Management & Persistence, Collection UI sections |
| CARE-01..05 | Display care info, 100 species DB, fallback message, structured data | See Care Database section |
| RATE-01/03/04/05 | Daily limit enforcement, friendly message, persistence, midnight reset | See Rate Limiter Fixes section |
| I18N-01..04 | IT/EN translations, language selection, PlantNet lang param, fallback to EN | See i18n Setup section |
| UI-01..05 | Home grid, camera screen, results carousel, detail screen, settings | See Screen Architecture section |
| LEGAL-01..03 | PlantNet attribution, privacy notice, API rate compliance | See Legal Compliance section |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **expo-camera** | ~17.0.10 | Full-screen camera with live preview | Expo's official camera module, handles permissions, compatible with managed workflow |
| **expo-image-picker** | ~17.0.10 | Gallery photo selection | Expo's official image picker, separate from camera per user decision |
| **expo-router** | ~6.0.23 | File-based navigation (tabs, stack, modals) | Already in scaffold, standard for Expo apps, handles deep linking |
| **zustand** | ^5.0.0 | State management | Lightweight, TypeScript-first, built-in persist middleware for AsyncStorage |
| **i18next** | ^24.0.0 + react-i18next | Internationalization | Industry standard, excellent React Native integration, namespace support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **lru-cache** | ^11.0.0 | LRU cache with size cap and TTL | Replace broken custom cache implementation, hash-safe, battle-tested |
| **react-native-snap-carousel** | ^4.0.0 | Card carousel for results | Tinder-style swiping, parallax effects, React Native Reanimated integration |
| **@react-native-async-storage/async-storage** | ^2.2.0 | Persistent storage | Already installed, used by Zustand persist middleware |
| **expo-localization** | ~16.0.0 | Device language detection | Auto-detect user locale for i18n initialization |
| **expo-constants** | ~18.0.13 | Access app config for API key | Already in use, reads EXPO_PUBLIC_ env vars |

### For Cloudflare Workers Proxy (API Key Security)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **wrangler** | ^3.80.0 | Cloudflare Workers CLI | Deploy proxy, manage environment variables for API keys |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-camera | react-native-vision-camera | More advanced features but requires ejecting from managed workflow |
| react-native-snap-carousel | react-native-swiper | Simpler API but lacks Tinder-style stack effects |
| lru-cache | Custom LRU implementation | Custom is error-prone; existing code has hash collision bugs |
| Cloudflare Workers | Lambda@edge, Vercel Edge | Cloudflare has generous free tier (100k requests/day), simpler for proxy-only use |

**Installation:**
```bash
# Core dependencies (many already installed)
npm install zustand i18next react-i18next lru-cache react-native-snap-carousel

# For Cloudflare Workers deployment
npm install -g wrangler

# TypeScript types
npm install -D @types/lru-cache
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── Camera/          # CameraView, OrganSelector, PreviewConfirm
│   ├── Carousel/        # ResultCard, ResultsCarousel
│   ├── Collection/      # PlantGrid, PlantCard, GridListToggle
│   └── common/          # Button, Card, Modal, Badge, EmptyState
├── screens/             # Screen components for each route
│   ├── HomeScreen.tsx   # Grid + FAB + empty state
│   ├── CameraScreen.tsx # Full-screen camera + organ selector
│   ├── ResultsScreen.tsx# Carousel + care expand + save button
│   ├── PlantDetail.tsx  # Full care info + delete
│   └── SettingsScreen.tsx# Language + about + legal
├── stores/              # Zustand stores
│   ├── plantsStore.ts   # Saved plants collection
│   ├── onboardingStore.ts# First launch flag
│   └── settingsStore.ts # Language preference
├── services/            # Fixed business logic
│   ├── plantnet.ts      # FIXED: Cloudflare proxy, error handling
│   ├── cache.ts         # FIXED: lru-cache, collision-resistant
│   ├── rateLimiter.ts   # FIXED: mutex for race conditions
│   └── careDB.ts        # NEW: 100 species care data
├── i18n/                # Internationalization
│   ├── index.ts         # i18next config
│   └── resources/       # en/, it/ translation files
├── hooks/               # Custom React hooks
│   ├── useOnboarding.ts # First launch detection
│   ├── useRateLimit.ts  # Rate limit check + increment
│   └── useCamera.ts     # Permissions + capture logic
└── utils/
    ├── date.ts          # Timezone-safe date utils for midnight reset
    └── hash.ts          # Better image hashing for cache (SHA-256)
```

### Pattern 1: Zustand Store with AsyncStorage Persistence
**What:** Zustand store that automatically persists to AsyncStorage and rehydrates on app launch
**When to use:** For plants collection, onboarding status, settings
**Example:**
```typescript
// stores/plantsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedPlant } from '@/types';

interface PlantsState {
  plants: SavedPlant[];
  addPlant: (plant: SavedPlant) => void;
  removePlant: (id: string) => void;
  getPlant: (id: string) => SavedPlant | undefined;
}

export const usePlantsStore = create<PlantsState>()(
  persist(
    (set, get) => ({
      plants: [],
      addPlant: (plant) => set((state) => ({
        plants: [{ ...plant, id: crypto.randomUUID() }, ...state.plants]
      })),
      removePlant: (id) => set((state) => ({
        plants: state.plants.filter(p => p.id !== id)
      })),
      getPlant: (id) => get().plants.find(p => p.id === id),
    }),
    {
      name: 'plantid-plants-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**Why this works:** Zustand's persist middleware handles serialization, AsyncStorage keys, and rehydration. No manual AsyncStorage calls needed.

### Pattern 2: Fixed Cache with LRU Cap
**What:** Replace custom hash-based cache with proper LRU library that prevents unlimited growth
**When to use:** Caching PlantNet API responses to avoid duplicate calls
**Example:**
```typescript
// services/cache.ts (FIXED)
import LRU from 'lru-cache';
import { PlantNetResponse } from '@/types';
import * as Crypto from 'expo-crypto';

// Type-safe LRU cache
const identificationCache = new LRU<string, PlantNetResponse>({
  max: 100, // Maximum 100 cached results
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
});

// Use crypto-secure hash instead of simple hashString (prevents collisions)
export async function hashImage(imageUri: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    imageUri
  );
  return digest;
}

export async function getCachedResult(imageUri: string): Promise<PlantNetResponse | null> {
  const hash = await hashImage(imageUri);
  return identificationCache.get(hash) || null;
}

export async function setCachedResult(imageUri: string, result: PlantNetResponse): Promise<void> {
  const hash = await hashImage(imageUri);
  identificationCache.set(hash, result);
}
```

### Pattern 3: Rate Limiter with Mutex
**What:** Prevent race conditions when multiple API calls happen simultaneously
**When to use:** Before calling PlantNet API to enforce daily limits
**Example:**
```typescript
// services/rateLimiter.ts (FIXED)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mutex } from 'async-mutex';
import { RateLimitState } from '@/types';

const RATE_LIMIT_KEY = '@plantid_rate_limit';
const DAILY_LIMIT = 5;

// Mutex prevents race conditions
const mutex = new Mutex();

function getTodayString(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
}

export async function canIdentify(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  return await mutex.runExclusive(async () => {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_KEY);
    const state: RateLimitState = stored ? JSON.parse(stored) : { date: '', count: 0 };
    const today = getTodayString();

    // Reset if new day
    if (state.date !== today) {
      return { allowed: true, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
    }

    const remaining = Math.max(0, DAILY_LIMIT - state.count);
    return {
      allowed: state.count < DAILY_LIMIT,
      remaining,
      limit: DAILY_LIMIT,
    };
  });
}

export async function incrementIdentificationCount(): Promise<void> {
  await mutex.runExclusive(async () => {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_KEY);
    const state: RateLimitState = stored ? JSON.parse(stored) : { date: '', count: 0 };
    const today = getTodayString();

    if (state.date !== today) {
      await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ date: today, count: 1 }));
    } else {
      await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ ...state, count: state.count + 1 }));
    }
  });
}
```

**Why this fixes the bug:** The mutex ensures that even if `canIdentify()` and `incrementIdentificationCount()` are called concurrently, they execute sequentially. Without this, two simultaneous API calls could both pass the limit check.

### Pattern 4: Cloudflare Workers Proxy
**What:** Hide API key by routing requests through Cloudflare Workers
**When to use:** Before deploying to production; during development can use EXPO_PUBLIC_ env var locally
**Example:**
```javascript
// wrangler.toml (Cloudflare Workers config)
name = "plantid-api-proxy"
main = "worker.js"
compatibility_date = "2024-01-01"

[env.production.vars]
PLANTNET_API_KEY = "your_actual_api_key_here"

// worker.js
export default {
  async fetch(request, env, ctx) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Parse multipart form data from client
    const formData = await request.formData();
    formData.append('api-key', env.PLANTNET_API_KEY);

    // Forward to PlantNet API
    const plantnetUrl = 'https://my-api.plantnet.org/v2/identify/all';
    const response = await fetch(plantnetUrl + '?includeRelatedImages=true', {
      method: 'POST',
      body: formData,
    });

    return new Response(response.body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Updated plantnet.ts (client-side)
export async function identifyPlant(params: IdentifyPlantParams): Promise<IdentifyPlantResult> {
  const PROXY_URL = 'https://plantid-api-proxy.yourname.workers.dev';

  const formData = new FormData();
  // ... form data setup ...

  // Call YOUR proxy, not PlantNet directly
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    body: formData,
  });
  // ... rest same as before ...
}
```

### Anti-Patterns to Avoid
- **Storing API keys in client code:** Even with environment variables, they're exposed in the bundle. Use a proxy.
- **Custom cache implementations:** The existing code has hash collisions (simple string hash) and no size limit (unbounded memory). Use lru-cache.
- **AsyncStorage without mutex:** The rate limiter bug shows why concurrent reads/writes cause state corruption. Always use mutex for read-modify-write cycles.
- **Combining camera/gallery in one action sheet:** User decision locked separate buttons—use `launchCameraAsync()` and `launchImageLibraryAsync()` separately.
- **Direct navigation instead of expo-router:** The scaffold uses file-based routing. Don't introduce react-navigation directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LRU cache with TTL | Custom cache with arrays/objects | **lru-cache** library | Handles eviction, TTL, memory pressure; existing code has hash collision bugs |
| State persistence | Manual AsyncStorage reads/writes | **Zustand persist middleware** | Handles serialization, rehydration, race conditions automatically |
| Carousel swiping | Custom ScrollView with gestures | **react-native-snap-carousel** | Optimized performance, parallax effects, handles edge cases |
| i18n with namespaces | Custom translation object lookup | **i18next + react-i18next** | Pluralization, interpolation, context, fallbacks built-in |
| Mutex for concurrency | Custom lock with promises | **async-mutex** package | Tested solution, handles timeouts, deadlocks |
| Camera permissions | Manual PermissionsAndroid.check | **expo-camera requestCameraPermissionsAsync()** | Cross-platform (iOS/Android), handles edge cases |

**Key insight:** The existing cache.ts and rateLimiter.ts bugs demonstrate why hand-rolling infrastructure is risky. Hash collisions in cache can return wrong results, and race conditions in rate limiter can allow exceeding daily limits (breaking PlantNet API compliance).

## Common Pitfalls

### Pitfall 1: API Key Exposure in Bundle
**What goes wrong:** API keys in .env or EXPO_PUBLIC_ vars are bundled into the JavaScript. Anyone can extract them by decompiling the app.
**Why it happens:** React Native bundles are just JavaScript—environment variables are inlined at build time.
**How to avoid:** Use Cloudflare Workers (or similar edge function) to proxy API calls. Store the real key in Workers environment variables (never in client code).
**Warning signs:** Seeing `"EXPO_PUBLIC_PLANTNET_API_KEY"` in your bundled code (search with `grep -r` after build).

### Pitfall 2: Cache Hash Collisions
**What goes wrong:** Two different images produce the same hash, causing the app to return wrong plant identification.
**Why it happens:** The existing `hashString()` uses a simple 32-bit integer hash with modulo—high collision probability for large datasets.
**How to avoid:** Use crypto-secure SHA-256 via `expo-crypto`. It's slower but collision-resistant.
**Warning signs:** Same result always returned for different images during testing.

### Pitfall 3: Rate Limiter Race Conditions
**What goes wrong:** User can exceed the 5-scan daily limit because two concurrent API calls both read count=4, both increment to 5.
**Why it happens:** `getRateLimitState()` and `saveRateLimitState()` are not atomic. Between read and write, another call can modify state.
**How to avoid:** Use mutex (from `async-mutex` package) to make read-modify-write atomic operations.
**Warning signs:** Seeing API rejections from PlantNet for exceeding limits despite app-side checks.

### Pitfall 4: AsyncStorage Unbounded Growth
**What goes wrong:** App slows down or crashes after months of use because AsyncStorage fills up with old cache entries.
**Why it happens:** The existing cache has no LRU eviction—entries accumulate forever.
**How to avoid:** Use `lru-cache` with `max` parameter (e.g., 100 entries max). Automatic eviction prevents unbounded growth.
**Warning signs:** First launch takes longer after app has been used for weeks.

### Pitfall 5: Midnight Reset in Wrong Timezone
**What goes wrong:** Daily limit resets at UTC midnight instead of user's local midnight, confusing users.
**Why it happens:** Using `new Date().toISOString().split('T')[0]` gives UTC date, not local date.
**How to avoid:** Use local timezone construction: `new Date(year, month, day)` which respects user's timezone.
**Warning signs:** Users report limit resets at "weird times" (e.g., 4 PM or 7 AM instead of midnight).

### Pitfall 6: Not Persisting Onboarding Completion
**What goes wrong:** User sees onboarding every time they launch the app, even though they completed it.
**Why it happens:** Forgetting to save `hasSeenOnboarding` flag to AsyncStorage.
**How to avoid:** Use Zustand persist middleware for onboarding store—auto-saves on every state change.
**Warning signs:** Onboarding screens appear on every app launch (not just first install).

## Code Examples

Verified patterns from official sources:

### Expo Camera with Organ Selector
```typescript
// screens/CameraScreen.tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [selectedOrgan, setSelectedOrgan] = useState<OrganType>('auto');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ marginBottom: 20 }}>We need camera permission</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  // Show preview after capture
  if (capturedUri) {
    return (
      <PreviewConfirmScreen
        imageUri={capturedUri}
        onRetake={() => setCapturedUri(null)}
        onConfirm={(organ) => navigateToResults(capturedUri, organ)}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView style={{ flex: 1 }} facing={facing}>
        {/* Camera overlay controls */}
      </CameraView>
    </View>
  );
}
```

### i18next Setup with Expo
```typescript
// i18n/index.ts
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './resources/en.json';
import it from './resources/it.json';

const LANGUAGE_KEY = '@plantid_language';

const initI18n = async () => {
  // Get saved language or detect device language
  let savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (!savedLang) {
    const deviceLang = getLocales()[0]?.languageCode || 'en';
    savedLang = ['en', 'it'].includes(deviceLang) ? deviceLang : 'en';
  }

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      it: { translation: it },
    },
    lng: savedLang,
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
  });

  return i18n;
};

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

export default initI18n;
```

### Grid/List Toggle with FlatList
```typescript
// screens/HomeScreen.tsx
import { FlatList, View } from 'react-native';
import { usePlantsStore } from '@/stores/plantsStore';

export default function HomeScreen() {
  const plants = usePlantsStore((state) => state.plants);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <View style={{ flex: 1 }}>
      {/* Toggle button */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16 }}>
        <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
          <Text>{viewMode === 'grid' ? 'List' : 'Grid'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={plants}
        key={viewMode} // Force re-render when mode changes
        numColumns={viewMode === 'grid' ? 2 : 1}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlantCard plant={item} isGrid={viewMode === 'grid'} />
        )}
        ListEmptyComponent={<EmptyState />}
        columnWrapperStyle={viewMode === 'grid' ? { gap: 16 } : undefined}
      />
    </View>
  );
}
```

### Results Carousel with react-native-snap-carousel
```typescript
// screens/ResultsScreen.tsx
import Carousel from 'react-native-snap-carousel';
import { Dimensions, View, Text } from 'react-native';

const SLIDER_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = SLIDER_WIDTH - 40;

export default function ResultsScreen({ route }) {
  const { results } = route.params; // PlantNetResult[]
  const [activeIndex, setActiveIndex] = useState(0);

  const renderItem = ({ item }: { item: PlantNetResult }) => (
    <View style={{ width: ITEM_WIDTH, padding: 20 }}>
      <ResultCard result={item} />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Carousel
        data={results}
        renderItem={renderItem}
        sliderWidth={SLIDER_WIDTH}
        itemWidth={ITEM_WIDTH}
        onSnapToItem={(index) => setActiveIndex(index)}
        inactiveSlideOpacity={0.6}
        inactiveSlideScale={0.9}
      />
      {/* Pagination dots */}
      <PaginationDots count={results.length} activeIndex={activeIndex} />
    </View>
  );
}
```

### Cloudflare Workers Proxy (Complete)
```javascript
// worker.js (Cloudflare Workers)
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Use POST', { status: 405 });
    }

    try {
      const formData = await request.formData();

      // Inject API key from secure environment variable
      const apiUrl = new URL('https://my-api.plantnet.org/v2/identify/all');
      apiUrl.searchParams.append('api-key', env.PLANTNET_API_KEY);
      apiUrl.searchParams.append('includeRelatedImages', 'true');

      // Forward request to PlantNet
      const response = await fetch(apiUrl.toString(), {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // For development
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Navigation manually configured | Expo Router file-based routing | Expo Router 1.0+ | File structure IS navigation—no config drift |
| Custom i18n with simple object | i18next with namespaces | 2022+ | Handles plurals, interpolation, context |
| AsyncStorage manual persistence | Zustand persist middleware | Zustand 4.0+ | Auto-rehydration, type-safe, no boilerplate |
| Custom cache implementations | lru-cache library | Consistent | Proven eviction algorithms, memory-safe |
| API keys in .env | Edge function proxies | 2023+ | Keys never in client bundle, compliance-friendly |

**Deprecated/outdated:**
- **react-navigation v5**: Use Expo Router instead (built on v6, but file-based)
- **expo-image-picker's `showImagePicker()`**: Deprecated; use `launchImageLibraryAsync()` and `launchCameraAsync()` separately
- **AsyncStorage without mutex**: Race conditions guaranteed—always use mutex for read-modify-write
- **Custom hash functions for cache**: Use crypto-secure SHA-256 to avoid collisions

## Open Questions

1. **PlantNet API rate limit compliance across all users**
   - What we know: PlantNet free tier is 500 requests/day total (shared across all users of an API key)
   - What's unclear: Does this apply to the free project API key or only to higher tiers?
   - Recommendation: Implement client-side limit (5/day/user) to minimize risk. Monitor usage in Cloudflare Workers dashboard. If approaching 500/day total, need to either (a) upgrade PlantNet tier, (b) implement server-side aggregation, or (c) cache more aggressively.

2. **Care database format and loading strategy**
   - What we know: Need 100 common species with water frequency, sunlight, temp, soil, toxicity, tips
   - What's unclear: Should this be a static JSON file (loaded at startup) or a separate service with efficient lookups?
   - Recommendation: Start with static JSON file in `services/careDB.ts` for simplicity. If load time becomes issue (>100ms), migrate to indexed lookup by scientific name.

3. **Onboarding illustration assets**
   - What we know: Need friendly empty state + 2-3 onboarding screens with illustrations
   - What's unclear: Are we using custom illustrations, icon library, or stock assets?
   - Recommendation: Use Expo Vector Icons (FontAwesome) + simple shapes/colors initially. Commission custom illustrations for v1.1 if UX feedback suggests need.

4. **Watering badge on collection cards**
   - What we know: Badge should show for plants that need watering today
   - What's unclear: Watering logic is Phase 2—should we add placeholder badge now or omit until Phase 2?
   - Recommendation: Omit watering badge in Phase 1. Add it in Phase 2 when watering logic is implemented. Avoid placeholder features.

5. **Care database update strategy**
   - What we know: Start with 100 species, extensible to 500
   - What's unclear: How do users get updated care data when we expand the DB?
   - Recommendation: Store care DB version in AsyncStorage. On app launch, compare with bundled version. If mismatch, update persisted care DB (in-app update, not app store update).

## Sources

### Primary (HIGH confidence)
- **Expo SDK 54 Documentation** - expo-camera, expo-image-picker, expo-router, expo-localization
  - Verified: Camera API `useCameraPermissions()`, image picker separate functions, Router file structure
- **Zustand Documentation** - persist middleware, AsyncStorage integration
  - Verified: `createJSONStorage(() => AsyncStorage)`, store patterns
- **i18next + react-i18next Documentation** - React Native setup, expo-localization integration
  - Verified: Namespace support, language detection, fallback patterns
- **Cloudflare Workers Documentation** - Environment variables, fetch API proxy pattern
  - Verified: `env.PLANTNET_API_KEY` access, request forwarding

### Secondary (MEDIUM confidence)
- **Web Search 2025-2026** (Chinese technical blogs + official repos):
  - Full-screen camera patterns with `expo-camera` (style={{ flex: 1 }})
  - Separate `launchCameraAsync()` and `launchImageLibraryAsync()` for camera/gallery buttons
  - `lru-cache` usage in React Native apps (SVG optimization examples)
  - Cloudflare Workers + OpenAI proxy pattern (applies to PlantNet)
  - AsyncStorage best practices (namespace prefixes, batch operations)
  - Zustand + AsyncStorage persist examples from React Conf 2025
  - Grid/list toggle with FlatList `numColumns` and dynamic `key` prop
  - react-native-snap-carousel for Tinder-style card swiping

### Tertiary (LOW confidence)
- **PlantNet API documentation**: Limited official docs found; my.plantnet.org mentioned but no public API docs. API usage pattern inferred from existing `plantnet.ts` code + common REST conventions.
- **async-mutex React Native usage**: No specific React Native examples found; package is JS/TS-agnostic. Assume compatibility but verify during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries have official React Native/Expo documentation and active maintenance
- Architecture: HIGH - Expo Router + Zustand patterns are well-established in 2025 ecosystem
- Pitfalls: HIGH - Bugs in existing code (cache collisions, rate limiter races) are well-understood with clear fixes
- i18n: HIGH - i18next is industry standard with excellent React Native docs
- Cloudflare Workers proxy: MEDIUM - Pattern verified but PlantNet-specific integration untested

**Research date:** 2026-02-19
**Valid until:** 2026-04-19 (60 days - Expo SDK and React Native move fast; verify no major updates before Phase 1 start)

**Key assumptions verified:**
- ✅ Expo SDK 54 includes expo-camera ~17.0.10 (compatible with React Native 0.81.5)
- ✅ Zustand persist middleware supports AsyncStorage via `createJSONStorage()`
- ✅ i18next works with Expo's expo-localization for device language detection
- ✅ lru-cache has TypeScript definitions (@types/lru-cache)
- ✅ async-mutex works in React Native (pure JS, no native modules)

**Risks flagged for validation:**
- ⚠️ PlantNet API daily 500-request limit may be too restrictive for user growth
- ⚠️ async-mutex React Native compatibility: Test early in implementation
- ⚠️ react-native-snap-carousel: Verify React Native 0.81.5 + Reanimated 4.1.1 compatibility
