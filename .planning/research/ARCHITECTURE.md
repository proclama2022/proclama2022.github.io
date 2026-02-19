# Architecture Patterns

**Domain:** Plant identification mobile app (on-device, no backend)
**Project:** Plantid
**Researched:** 2026-02-19
**Confidence:** HIGH (based on existing codebase + established Expo/React Native patterns)

---

## Recommended Architecture

A strict layered architecture, data flowing top-down through the layers, with no layer skipping. The app is fully on-device: there is no backend, no auth, no server state. All persistence is AsyncStorage.

```
┌─────────────────────────────────────────────────────────────┐
│  ROUTING LAYER  (Expo Router file-based, app/)              │
│  Owns: screen lifecycle, navigation state                   │
└───────────────────────┬─────────────────────────────────────┘
                        │ uses
┌───────────────────────▼─────────────────────────────────────┐
│  SCREEN LAYER  (app/(tabs)/, app/*.tsx)                     │
│  Owns: local UI state, user events, loading/error display   │
└──────────┬────────────────────┬────────────────────────────-┘
           │ calls              │ calls
┌──────────▼──────────┐  ┌──────▼──────────────────────────── ┐
│  SERVICES LAYER     │  │  DATA LAYER                         │
│  services/*.ts      │  │  data/plantCareDB.ts (static JSON)  │
│  plantnet.ts        │  │  services/savedPlants.ts (CRUD)     │
│  cache.ts           │  │  services/notifications.ts (sched.) │
│  rateLimiter.ts     │  └────────────────────────────────────-┘
└──────────┬──────────┘
           │ calls
┌──────────▼──────────────────────────────────────────────────┐
│  PERSISTENCE LAYER  (AsyncStorage, expo-notifications)      │
│  Owns: raw read/write, key namespacing                      │
└─────────────────────────────────────────────────────────────┘
           │
           └── [outbound only] PlantNet REST API (HTTPS)
```

---

## Component Boundaries

| Component | Responsibility | Communicates With | Key Files |
|-----------|---------------|-------------------|-----------|
| Camera capture | Acquire image URI from device camera or gallery | Screen layer only — passes URI up | `expo-camera`, `expo-image-picker` |
| PlantNet API client | POST multipart image to API, return typed result | Cache, rate limiter, then screen | `services/plantnet.ts` |
| Cache service | Hash-keyed AsyncStorage read/write with 7-day TTL | AsyncStorage only | `services/cache.ts` |
| Rate limiter | Track daily scan count per device, enforce daily cap | AsyncStorage only | `services/rateLimiter.ts` |
| Plant care DB | Static lookup table: scientificName → care data | Read-only; queried by screen | `data/plantCareDB.ts` (to be created) |
| Saved plants store | CRUD for user's plant collection, watering history | AsyncStorage only | `services/savedPlants.ts` (to be created) |
| Notification scheduler | Schedule/cancel/reschedule local notifications per plant | expo-notifications, savedPlants | `services/notifications.ts` (to be created) |
| i18n provider | Locale resolution, string lookup | All screens | `services/i18n.ts` or context (to be created) |
| UI components | Themed, reusable presentational building blocks | None (dumb components) | `components/` |
| Screens | Compose components, call services, manage local state | Services + data layer | `app/(tabs)/*.tsx` |

**Rule:** Services never import from screens. Screens never touch AsyncStorage directly. Notifications service never imports PlantNet service.

---

## Data Flow

### Primary Flow: Plant Identification

```
User taps "Identify"
  → Screen calls canIdentify() [rateLimiter.ts]
      ↓ blocked → show "daily limit reached" UI
      ↓ allowed
  → User points camera, taps capture
      → expo-camera or expo-image-picker returns imageUri (string)
  → Screen passes imageUri + organType to a coordinator function
  → coordinator calls getCachedResult(imageUri) [cache.ts]
      ↓ cache hit → return cached PlantNetResponse to screen
      ↓ cache miss
  → coordinator calls identifyPlant({ imageUri, organ, lang }) [plantnet.ts]
      → POST multipart/form-data to https://my-api.plantnet.org/v2/identify/all
      ← PlantNetResponse (bestMatch, results[], remainingIdentificationRequests)
  → coordinator calls setCachedResult(imageUri, response) [cache.ts]
  → coordinator calls incrementIdentificationCount() [rateLimiter.ts]
  → Screen receives PlantNetResponse, renders top result
  → Screen calls lookupCare(species.scientificNameWithoutAuthor) [plantCareDB.ts]
      ↓ found → display care info (water, light, temp)
      ↓ not found → display "care info coming soon" fallback
```

### Secondary Flow: Save Plant

```
User taps "Add to my plants"
  → Screen calls savePlant(savedPlant) [savedPlants.ts]
      → AsyncStorage.setItem(@plantid_plants_{id}, JSON)
      → AsyncStorage.setItem(@plantid_plants_index, [...ids])
  → savedPlants.ts calls scheduleWateringNotification(plant) [notifications.ts]
      → expo-notifications.scheduleNotificationAsync({
           trigger: { seconds: waterFrequencyDays * 86400, repeats: true }
        })
  → Screen navigates to plant detail or back to home
```

### Secondary Flow: Mark Plant as Watered

```
User taps "Watered today"
  → Screen calls recordWatering(plantId) [savedPlants.ts]
      → reads existing SavedPlant from AsyncStorage
      → appends WaterEvent to waterHistory[]
      → updates lastWatered
      → writes back to AsyncStorage
  → savedPlants.ts calls rescheduleWateringNotification(plant) [notifications.ts]
      → cancels existing notification for plant
      → schedules next one from today + waterFrequencyDays
```

### Secondary Flow: App Start Notification Check

```
App launches (app/_layout.tsx)
  → Request notification permissions [notifications.ts]
  → Register background fetch handler (iOS: background app refresh)
  → On each morning notification delivery:
      expo-notifications fires onNotificationReceived
      → screen re-renders watering list if app is foregrounded
```

---

## Patterns to Follow

### Pattern 1: Service Functions, Not Classes
**What:** Export plain async functions from service modules. No classes, no singletons.
**When:** All service layer code.
**Why:** Easier to test (pure function injection), matches existing codebase pattern (`identifyPlant()`, `getCachedResult()`), avoids lifecycle confusion in React Native.

```typescript
// Good — services/savedPlants.ts
export async function savePlant(plant: SavedPlant): Promise<void> { ... }
export async function getPlants(): Promise<SavedPlant[]> { ... }
export async function deletePlant(id: string): Promise<void> { ... }
```

### Pattern 2: Result Objects Over Thrown Errors
**What:** Service functions return `{ success: boolean; data?: T; error?: string }`.
**When:** Any function that can fail (API calls, storage operations).
**Why:** Already established in `services/plantnet.ts` (`IdentifyPlantResult`). Callers check `result.success` rather than try/catch.

```typescript
// Already in use — extend this to savedPlants and notifications
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Pattern 3: AsyncStorage Key Namespacing
**What:** All keys prefixed `@plantid_{domain}_{id}`. Keep a separate index key per domain.
**When:** Every new AsyncStorage write.
**Why:** Prevents key collisions. Enables `clearAllUserData()`, cache-vs-plant separation, and future migration. Already used: `@plantid_cache_*`, `@plantid_rate_limit`.

```
@plantid_cache_{hash}       ← API result cache
@plantid_rate_limit         ← daily scan counter
@plantid_plants_{uuid}      ← individual saved plant
@plantid_plants_index       ← array of all plant IDs (for listing)
@plantid_settings           ← user preferences (lang, notification time)
@plantid_watering_notif_{plantId}  ← notification ID per plant
```

### Pattern 4: Plant Care DB as Static Import
**What:** `data/plantCareDB.ts` exports a typed Record keyed by lowercased scientific name.
**When:** Care lookup at result display time.
**Why:** No async overhead, no storage quota used, fully offline. Falls back gracefully if key missing.

```typescript
// data/plantCareDB.ts
import type { PlantCareInfo } from '@/types';
const plantCareDB: Record<string, PlantCareInfo> = { ... };
export function lookupCare(scientificName: string): PlantCareInfo | null {
  return plantCareDB[scientificName.toLowerCase()] ?? null;
}
```

### Pattern 5: Notification IDs Persisted Alongside Plants
**What:** When scheduling a notification, persist the returned `notificationId` in AsyncStorage keyed to the plant.
**When:** `scheduleWateringNotification` and `rescheduleWateringNotification`.
**Why:** expo-notifications requires the `notificationId` string to cancel a scheduled notification. Without persisting it, you cannot cancel old notifications when the user marks a plant as watered or deletes it. This is a common source of notification leaks.

```typescript
// Persist notification ID
await AsyncStorage.setItem(`@plantid_watering_notif_${plant.id}`, notificationId);

// Cancel on re-schedule or delete
const existingId = await AsyncStorage.getItem(`@plantid_watering_notif_${plant.id}`);
if (existingId) await Notifications.cancelScheduledNotificationAsync(existingId);
```

### Pattern 6: Locale as Context, Not Per-Component Prop
**What:** Wrap the app in a single `I18nProvider` at root layout level. Screens read the current locale via `useI18n()` hook.
**When:** Any string displayed to the user.
**Why:** Avoids prop-drilling locale through every component. Allows runtime locale switching without remount of entire tree.

```typescript
// app/_layout.tsx
<I18nProvider>
  <ThemeProvider ...>
    <Stack>...</Stack>
  </ThemeProvider>
</I18nProvider>
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calling AsyncStorage Directly from Screens
**What:** Screen component calls `AsyncStorage.getItem()` inline.
**Why bad:** Business logic bleeds into UI. Hard to test. Breaks the service abstraction boundary. If storage key format changes, you hunt through screen files.
**Instead:** All AsyncStorage calls live in `services/`. Screens call service functions only.

### Anti-Pattern 2: Image Content Cache Key (URI Hashing)
**What:** The current `hashString(imageUri)` hashes the URI string, not the image content.
**Why bad:** The same physical image saved to different URIs (e.g., re-imported from gallery vs camera) will generate different cache keys and hit the API twice. Conversely, if the device reuses a temp URI path for a different image, you get a false cache hit.
**Instead:** For MVP, URI hashing is acceptable. Mark it as known limitation. For Phase 2, use `expo-crypto` or `expo-file-system` to hash file content (MD5/SHA1 of first 64KB). Do not block MVP on this.

### Anti-Pattern 3: Storing Full Image Bytes in AsyncStorage
**What:** Saving base64-encoded image data inside a SavedPlant AsyncStorage entry.
**Why bad:** AsyncStorage typical limit is 5-10MB total. A few hi-res plant photos exceed that. You will hit storage quota silently and lose data.
**Instead:** Store only the image URI. On iOS/Android the file persists in the app's document directory if you copy it there via `expo-file-system`. Store the local file path in `SavedPlant.photo`.

### Anti-Pattern 4: Scheduling Notifications Without Persisting IDs
**What:** Call `Notifications.scheduleNotificationAsync()` and discard the returned ID.
**Why bad:** You cannot cancel the notification when the user waters the plant, changes the schedule, or deletes the plant. Orphaned notifications accumulate.
**Instead:** See Pattern 5. Always persist the notification ID.

### Anti-Pattern 5: Single AsyncStorage Key for All Plants
**What:** Storing the entire plant collection as one JSON array under a single key like `@plantid_all_plants`.
**Why bad:** Every read/write requires deserializing and re-serializing the full array. With 50+ plants this becomes a noticeable pause. One plant with a large notes field causes all plant reads to be slow.
**Instead:** Index pattern (Pattern 3): one small key per plant + one index key listing IDs. Load the full list by reading the index then fetching individual entries in parallel.

### Anti-Pattern 6: Hardcoded Language Strings in Components
**What:** `<Text>Aggiungi alle mie piante</Text>` inline in a component.
**Why bad:** Cannot switch language at runtime. Cannot scale to more languages in Phase 4.
**Instead:** All user-visible strings go through i18n lookup from day one. Use a flat key/value JSON structure per locale. This does not require a heavy i18n library — a simple context + hook is sufficient for IT/EN.

---

## Routing Structure (Expo Router File-Based)

```
app/
├── _layout.tsx             ← Root: ThemeProvider + I18nProvider + SplashScreen
├── (tabs)/
│   ├── _layout.tsx         ← TabBar: icons, labels, active colors
│   ├── index.tsx           ← Home: plant list, watering today, FAB
│   ├── identify.tsx        ← Camera: preview, organ selector, capture
│   └── settings.tsx        ← Settings: lang, notif time, stats, Pro, credits
├── result.tsx              ← Identification result (stack, not tab)
├── plant/
│   └── [id].tsx            ← Plant detail: care, watering history, notes
└── modal.tsx               ← Reusable modal overlay
```

**Navigation model:** Tab bar for the 3 persistent destinations (Home, Identify, Settings). Identify result and plant detail are stack-pushed from Home or Identify tabs — they are NOT tabs themselves, because you don't want a "Results" tab sitting there empty.

---

## State Architecture

| State Type | Where It Lives | Why |
|------------|---------------|-----|
| Current identification result | Screen-local `useState` | Ephemeral — gone when user navigates away, no need to persist |
| Camera organ selection | Screen-local `useState` | UI preference per-session only |
| User's plant collection | AsyncStorage via savedPlants service | Persistent, survives app restart |
| Watering history per plant | AsyncStorage inside SavedPlant object | Coupled to the plant record |
| Daily scan count | AsyncStorage via rateLimiter service | Persistent across restarts |
| API result cache | AsyncStorage via cache service | 7-day persistence, hash-keyed |
| User settings (lang, notif time) | AsyncStorage via settings service | User preference, survives restart |
| Active locale + strings | React context (I18nProvider) | In-memory, set on startup from settings |
| Theme (light/dark) | React context (existing useColorScheme) | From system, already in codebase |

**No global state library needed.** React context for cross-cutting concerns (theme, i18n). Everything else is local state + service calls. Do not add Redux or Zustand — the app is not complex enough to justify the overhead.

---

## Scalability Considerations

| Concern | At MVP (1-100 daily users) | At 500+ daily users | At 10K+ daily users |
|---------|---------------------------|---------------------|---------------------|
| PlantNet API quota | Free tier (500/day total), 5/user/day limit handles this | Upgrade to commercial PlantNet plan (~€1K/year) | Commercial plan + aggressive cache |
| AsyncStorage capacity | Fine for ~50 plants + cache | Still fine; implement LRU eviction on cache | Same — device storage is per-user |
| Notification scale | iOS/Android handle 64 pending notifications max | Need to prioritize soonest-due plants if >64 | Same — per-device limit |
| Cache collision | Low risk with URI hash | Acceptable risk — document as known limitation | Switch to content-hash (expo-crypto) |
| i18n strings | 2 locales, ~100 strings each | Fine | Fine — static files |

**The app's architecture does not change at scale.** It is fully per-device. The only scaling pressure is the PlantNet API shared quota, which is handled via the client-side rate limiter and the API's `remainingIdentificationRequests` field in every response.

---

## Build Order Implications

The architecture has hard dependencies that dictate build order:

1. **Types first** (`types/index.ts`) — Every other layer depends on these. Already exists and is complete. Do not build screens before types are stable.

2. **Services before screens** — Services are already partially built (`plantnet.ts`, `cache.ts`, `rateLimiter.ts`). Add `savedPlants.ts`, `notifications.ts`, `settings.ts` before building screens that depend on them.

3. **Plant care DB before result screen** — The result screen must fall back gracefully when a species is not in the DB. Build the DB (even with only 50 species) before the result screen so the lookup path exists.

4. **Home screen last among core screens** — Home composes the saved plant list + watering summary. It depends on `savedPlants.ts` working. Build Camera and Result screens first (they are input-only); Home requires saved plant data to display anything meaningful.

5. **Notifications after save flow** — Scheduling notifications requires a working `savedPlants.ts` first. Build save/retrieve plants, verify it works, then wire up notifications.

6. **i18n wrapper early, strings deferred** — Create the `I18nProvider` and `useI18n()` hook in Phase 1. You can start with a thin set of strings (just what MVP screens need). Expanding locale files is cheap later. Retrofitting i18n into an app that hardcoded strings is expensive.

7. **Ads and IAP last** — AdMob and in-app purchase require app store provisioning, test accounts, and additional build config. Build the entire app first, verify the core loop works, then integrate monetization as the final phase before submission.

**Dependency graph summary:**
```
types/index.ts
  → services/plantnet.ts + cache.ts + rateLimiter.ts  (already built)
    → services/savedPlants.ts
      → services/notifications.ts
  → data/plantCareDB.ts
  → services/settings.ts + i18n context
    → app/(tabs)/identify.tsx (camera screen)
      → app/result.tsx (identification result)
        → app/plant/[id].tsx (plant detail)
          → app/(tabs)/index.tsx (home, lists saved plants)
            → app/(tabs)/settings.tsx
              → AdMob + IAP integration
```

---

## Missing Services to Build

The following services are defined in `types/index.ts` but not yet implemented:

| Service | File to Create | What It Manages |
|---------|---------------|-----------------|
| Saved plants store | `services/savedPlants.ts` | CRUD for SavedPlant[], WaterEvent history |
| Plant care DB lookup | `data/plantCareDB.ts` | Static lookup by scientific name |
| Notification scheduler | `services/notifications.ts` | Schedule/cancel/reschedule per-plant notifications |
| Settings store | `services/settings.ts` | Read/write user preferences (lang, notif time, Pro status) |
| i18n provider | `services/i18n.ts` + context | Locale resolution, string lookup |

---

## Sources

- Codebase analysis: `services/plantnet.ts`, `services/cache.ts`, `services/rateLimiter.ts`, `types/index.ts` (HIGH confidence — direct inspection)
- Project plan: `plan.md`, `.planning/PROJECT.md` (HIGH confidence — direct inspection)
- Existing architecture docs: `.planning/codebase/ARCHITECTURE.md` (HIGH confidence — direct inspection)
- expo-notifications notification ID persistence pattern: training knowledge (MEDIUM confidence — validate against https://docs.expo.dev/versions/latest/sdk/notifications/ before implementation)
- AsyncStorage index pattern for collections: established React Native community pattern (MEDIUM confidence)
- Expo Router file-based routing: training knowledge validated against `package.json` expo-router v6 + `app.json` typedRoutes config (HIGH confidence for project-specific details)

---

*Architecture research: 2026-02-19*
