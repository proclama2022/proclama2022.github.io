# Phase 10: UI Polish & Dark Mode - Research

**Researched:** 2026-03-02
**Domain:** React Native / Expo dark mode theming + skeleton loading states
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Dark mode toggle
- Simple on/off switch in the Settings "General" section card
- Three-state logic: `'light' | 'dark' | 'system'` stored in `settingsStore` (persisted via AsyncStorage)
- Default: `'system'` — follows device preference on first launch
- Toggle UX: a Switch component; label shows current mode ("Tema scuro" / "Dark Mode")
- When user sets light or dark manually, it overrides system permanently until changed again
- `app/_layout.tsx` reads `settingsStore.colorScheme` and passes the resolved value to `ThemeProvider`

#### Loading skeletons
- Scope: plant grid on the Home screen only — the most visible loading moment
- Shown while `plantsStore` is hydrating from AsyncStorage on first mount
- Style: rectangular placeholders matching PlantCard dimensions, animated pulse (opacity 0.4 → 1.0, loop)
- Color: `colors.border` (theme-aware, works in both light/dark)
- Count: show 6 skeleton cards (2 columns × 3 rows) as placeholder grid
- Dismiss: skeletons replaced by real PlantGrid as soon as store is hydrated

#### Already complete — no changes needed
- Onboarding: Ionicons + entrance animations already implemented in `components/Onboarding.tsx`
- Settings card sections: `sectionCard` with `borderRadius: 14` already in place
- Color palette consistency: all screens already use `useThemeColors` + `Colors.ts`

### Claude's Discretion
- Exact pulse animation duration (recommend ~1000ms cycle)
- Skeleton card border radius (match PlantCard: `borderRadius: 20`)
- i18n key names for dark mode setting label
- Whether to add a sun/moon icon next to the toggle

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 10 has two narrowly scoped deliverables. The majority of the original success criteria (onboarding animations, settings card sections, consistent color palette) are **already implemented** in the codebase. What remains is: (1) a user-controlled dark mode preference stored in `settingsStore` and wired into `app/_layout.tsx`, and (2) skeleton placeholders on the Home screen while `plantsStore` rehydrates from AsyncStorage.

The dark mode work is a clean three-file change: add `colorScheme` to `settingsStore.ts`, override the `useColorScheme` call in `useThemeColors.ts` (or in `_layout.tsx`), and add a `Switch` row in the General card of `settings.tsx`. The i18n file already contains `settings.darkMode`, `settings.appearance`, and `settings.systemDefault` keys — no new translation strings are needed.

The skeleton work requires exposing a hydration state flag from `plantsStore` (Zustand `persist` provides `onRehydrateStorage` and `useStore.persist.hasHydrated()`) and rendering 6 `View` cards with an `Animated.loop` opacity pulse in `app/(tabs)/index.tsx`. No new dependencies are required for either task — all needed primitives (`Animated`, `Switch`, Zustand persist API) are already in the project.

**Primary recommendation:** Implement in two sequential tasks — task 1: dark mode store + settings UI; task 2: skeleton grid with hydration gate.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Native `Animated` | (bundled) | Skeleton pulse animation | Already used in `PlantCard` and `HomeScreen` FAB entrance; no new dep |
| `@react-navigation/native` `ThemeProvider` | (installed) | Theme context for nav chrome | Already used in `app/_layout.tsx` — just need to pass resolved value |
| Zustand `persist` | (installed) | Persist `colorScheme` to AsyncStorage | Same pattern as `language` and `notificationEnabled` in `settingsStore` |
| React Native `Switch` | (bundled) | Dark mode toggle UI | Already used in `settings.tsx` for notifications toggle |
| `useColorScheme` from `react-native` | (bundled) | Read device color scheme | Already re-exported via `components/useColorScheme.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useThemeColors` hook | local | Bridge between color scheme and `Colors.ts` | Already used everywhere — modify to read store override |
| `i18n` resources (`en.json` / `it.json`) | local | Dark mode label text | Keys `settings.darkMode` and `settings.appearance` already exist |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Native `Animated` for pulse | `react-native-reanimated` | Reanimated already installed, but `Animated` is simpler for a looping opacity; no reason to add complexity |
| Zustand `persist` for colorScheme | `AsyncStorage` direct read | Zustand persist is the established pattern in this codebase; direct read would be inconsistent |

**Installation:**
```bash
# No new packages required — all dependencies already installed
```

---

## Architecture Patterns

### Recommended Project Structure

No new files or folders needed. All changes are to existing files:

```
stores/
└── settingsStore.ts         # Add colorScheme field + setter

components/
└── useColorScheme.ts        # Override: check settingsStore before device

hooks/
└── useThemeColors.ts        # No change needed (reads useColorScheme)

app/
├── _layout.tsx              # RootLayoutNav reads colorScheme from store
└── (tabs)/
    ├── settings.tsx         # Add Switch row in General card
    └── index.tsx            # Add skeleton grid + hydration gate
```

### Pattern 1: Zustand Persist — Adding a New Persisted Field

**What:** Extend `SettingsState` with `colorScheme: 'light' | 'dark' | 'system'` and a setter, following the exact same pattern as `language` and `notificationEnabled`.
**When to use:** Whenever a user preference needs to survive app restarts.

```typescript
// stores/settingsStore.ts (additions)
type ColorScheme = 'light' | 'dark' | 'system';

interface SettingsState {
  // ... existing fields ...
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

// Inside the persist callback:
colorScheme: 'system',
setColorScheme: (scheme) => set({ colorScheme: scheme }),
```

The `persist` middleware serializes this to the existing `'plantid-settings-storage'` key in AsyncStorage — no storage key change required.

### Pattern 2: Overriding System Color Scheme with User Preference

**What:** `components/useColorScheme.ts` currently re-exports `useColorScheme` from `react-native`. Replace it with a custom hook that checks the store first.
**When to use:** Whenever a stored preference should override a device default.

```typescript
// components/useColorScheme.ts (full replacement)
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

export function useColorScheme(): 'light' | 'dark' {
  const storedScheme = useSettingsStore((state) => state.colorScheme);
  const systemScheme = useSystemColorScheme() ?? 'light';
  if (storedScheme === 'system') return systemScheme;
  return storedScheme;
}
```

This single change propagates through `useThemeColors` (which calls `useColorScheme`) and through `app/_layout.tsx` `RootLayoutNav` (which also calls `useColorScheme`). No other files need to change.

**Note:** `app/_layout.tsx` `RootLayoutNav` already reads `const colorScheme = useColorScheme()` and passes it to `ThemeProvider`. After the hook replacement, this automatically picks up the stored preference.

### Pattern 3: Zustand Persist Hydration Gate for Skeletons

**What:** Zustand's `persist` middleware exposes `useStore.persist.hasHydrated()` (synchronous check) and `useStore.persist.onFinishHydration(cb)` (callback). The recommended pattern for UI gating is to track a local boolean that flips after hydration.

```typescript
// In app/(tabs)/index.tsx

import { useEffect, useState } from 'react';

// Inside HomeScreen component:
const [storeHydrated, setStoreHydrated] = useState(
  () => usePlantsStore.persist.hasHydrated()  // true if already hydrated (fast devices)
);

useEffect(() => {
  if (!storeHydrated) {
    return usePlantsStore.persist.onFinishHydration(() => setStoreHydrated(true));
  }
}, []);
```

This correctly handles both: (a) fast rehydration where the store is already hydrated before the component mounts, and (b) slow rehydration where the state arrives asynchronously.

### Pattern 4: Skeleton Card with Opacity Pulse

**What:** A `View` shaped like a PlantCard grid cell, colored `colors.border`, with a looping `Animated` opacity between 0.4 and 1.0.
**When to use:** Show 6 cards in 2-column layout while `storeHydrated` is false.

```typescript
// Skeleton pulse animation — create once outside the skeleton component
const pulseAnim = useRef(new Animated.Value(0.4)).current;

useEffect(() => {
  const animation = Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.0,
        duration: 500,       // Claude's discretion: ~1000ms total cycle
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0.4,
        duration: 500,
        useNativeDriver: true,
      }),
    ])
  );
  animation.start();
  return () => animation.stop();
}, []);
```

PlantCard grid dimensions (from `PlantCard.tsx`):
- Container: `flex: 1, margin: 8` inside a 2-column `FlatList`
- Photo area: `width: '100%', aspectRatio: 1` — square
- Info area: `padding: 12` with a name line and a meta line
- Card border radius: `borderRadius: 20`

The skeleton should replicate: a square top area (aspectRatio 1) + a short info strip at bottom, all `borderRadius: 20`, background `colors.border`.

### Pattern 5: Skeleton Grid Layout

**What:** Render the 6 skeleton cards in the same 2-column grid layout as the real `PlantGrid`, so there is no layout shift when real data loads.

```typescript
// Skeleton grid — 2 columns, 3 rows of placeholder cards
const SKELETON_COUNT = 6;

if (!storeHydrated) {
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <SkeletonCard key={i} pulseAnim={pulseAnim} colors={colors} />
      ))}
    </View>
  );
}
```

Grid style: `flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingTop: 10` — matches `PlantGrid`'s `gridContent` style.

### Anti-Patterns to Avoid

- **Calling `useColorScheme` from `react-native` directly elsewhere in the app:** After replacing `components/useColorScheme.ts`, all consumers must import from `@/components/useColorScheme` (which they already do) not from `react-native` directly. The hook file change propagates automatically.
- **Creating a separate Zustand store for color scheme:** The existing `settingsStore` already handles user preferences. Adding another store would be unnecessary fragmentation.
- **Using `setInterval` or `useEffect` polling for hydration:** Zustand provides `onFinishHydration` — use it instead.
- **Animating with `useNativeDriver: false`:** Both the FAB entrance and PlantCard animations already use `useNativeDriver: true`. The skeleton pulse only animates `opacity`, which is natively supported. Always use `useNativeDriver: true` here.
- **Rendering skeletons in `plantsStore.length === 0` branch:** The zero-plant empty state in `HomeScreen` already renders a different UI. The skeleton should gate on `!storeHydrated`, not on plant count. A user with real plants should also see skeletons during the brief hydration window.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting when AsyncStorage has finished loading | Manual timer or poll | `usePlantsStore.persist.hasHydrated()` + `onFinishHydration()` | Zustand persist provides this — timing-safe and idiomatic |
| Persisting color scheme across restarts | Manual AsyncStorage read/write | Zustand `persist` middleware (already in `settingsStore`) | Pattern already established; reduces error surface |
| Looping animation | Custom `requestAnimationFrame` loop | `Animated.loop(Animated.sequence([...]))` | Simpler, already used in the project |

**Key insight:** The project's Animated/Zustand/AsyncStorage patterns are already mature. This phase is wiring, not new infrastructure.

---

## Common Pitfalls

### Pitfall 1: Hydration Race Condition — Skeletons Flash Even When Store is Instantly Ready

**What goes wrong:** On fast devices, `plantsStore` may finish rehydrating before the `HomeScreen` component even mounts. Initializing `storeHydrated` as `false` unconditionally causes a one-frame flash of the skeleton.
**Why it happens:** `useState(false)` runs before the component reads the store.
**How to avoid:** Use a lazy initializer: `useState(() => usePlantsStore.persist.hasHydrated())`. This reads the already-hydrated state synchronously at mount time.
**Warning signs:** Skeleton visible for one frame even with empty-but-not-empty collection on fast devices.

### Pitfall 2: ThemeProvider Flicker on App Start

**What goes wrong:** `_layout.tsx` reads `colorScheme` from Zustand, but Zustand's persist middleware is async. On first render, `colorScheme` may be `'system'` (the default) even if user stored `'dark'`, causing a light→dark flash.
**Why it happens:** `settingsStore` uses AsyncStorage via `persist`, which is async. The component renders once with the default before the persisted value loads.
**How to avoid:** This is a known limitation. Two mitigation strategies:
  1. Accept it — the flash is sub-100ms and only happens at cold boot.
  2. Use `SplashScreen.preventAutoHideAsync()` (already done in `_layout.tsx`) — keep splash visible until `settingsStore` is hydrated, then hide. This requires adding a hydration gate to `RootLayout` similar to the `i18nReady` gate already there.
**Warning signs:** Visible light-to-dark flash on app launch when dark mode is stored.

### Pitfall 3: Switch Component `trackColor` Inconsistency

**What goes wrong:** The notifications `Switch` in `settings.tsx` uses `trackColor={{ false: colors.chipBorder, true: colors.tint }}`. If the dark mode switch uses different colors, it looks visually inconsistent.
**Why it happens:** Ad hoc color choices per Switch.
**How to avoid:** Use the exact same `trackColor` and `thumbColor` props as the existing notifications Switch.

### Pitfall 4: `onFinishHydration` Cleanup

**What goes wrong:** `usePlantsStore.persist.onFinishHydration()` returns an unsubscribe function. Not calling it in the `useEffect` cleanup can cause state updates on unmounted components.
**Why it happens:** Forgetting to return the unsubscribe from `useEffect`.
**How to avoid:** Always `return usePlantsStore.persist.onFinishHydration(() => ...)` from the `useEffect`.

---

## Code Examples

Verified patterns from existing codebase:

### Existing Notifications Switch (copy pattern for dark mode)
```typescript
// app/(tabs)/settings.tsx — lines 313-318 (existing)
<Switch
  value={notificationEnabled}
  onValueChange={handleNotificationToggle}
  trackColor={{ false: colors.chipBorder, true: colors.tint }}
  thumbColor={notificationEnabled ? colors.success : colors.chipBg}
/>
```

### Existing FAB Animated.spring (reference for useNativeDriver pattern)
```typescript
// app/(tabs)/index.tsx — lines 69-77 (existing)
const fabScale = useRef(new Animated.Value(0)).current;
useEffect(() => {
  Animated.spring(fabScale, {
    toValue: 1,
    tension: 50,
    friction: 7,
    useNativeDriver: true,
  }).start();
}, []);
```

### Existing settingsStore persist pattern (mirror for colorScheme)
```typescript
// stores/settingsStore.ts — lines 21-42 (existing)
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      // ... add colorScheme here in same style ...
    }),
    {
      name: 'plantid-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### PlantCard grid card dimensions (for skeleton sizing)
```typescript
// components/PlantCard.tsx — styles (existing)
gridCardContainer: {
  flex: 1,
  margin: 8,
},
card: {
  borderRadius: 20,
  borderWidth: 1,
},
gridPhotoContainer: {
  width: '100%',
  aspectRatio: 1,          // Square photo area
  borderTopLeftRadius: 19,
  borderTopRightRadius: 19,
},
gridInfo: {
  padding: 12,             // Text info area below photo
},
```

### PlantGrid grid content style (for skeleton grid layout match)
```typescript
// components/PlantGrid.tsx — styles (existing)
gridContent: {
  paddingHorizontal: 10,
  paddingTop: 10,
},
// FlatList uses: numColumns={2} with key={viewMode}
```

### i18n keys already available (no new keys needed)
```json
// i18n/resources/en.json — "settings" section (existing)
"settings": {
  "appearance": "Appearance",
  "darkMode": "Dark Mode",
  "systemDefault": "System Default"
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `components/useColorScheme.ts` re-exports `react-native` directly | Will be replaced with store-aware hook | Phase 10 | All consumers automatically pick up user preference with no other changes |
| `plantsStore` has no hydration flag | Will expose `hasHydrated()` / `onFinishHydration()` via Zustand `persist` built-in | Phase 10 | Enables skeleton gate without adding new state |

**Deprecated/outdated:**
- `useColorScheme` direct re-export pattern: functional but must be replaced to support user override.

---

## Open Questions

1. **ThemeProvider flicker on cold boot**
   - What we know: Zustand `persist` is async; stored `colorScheme` is not available on the first synchronous render.
   - What's unclear: Whether the existing `SplashScreen.preventAutoHideAsync()` + `i18nReady` gate is sufficient to mask the flash, or if a separate `settingsHydrated` gate is needed.
   - Recommendation: Attempt without additional gate first. If a visible flash is observed during manual testing, add `settingsHydrated` to the `RootLayout` guard (same pattern as `i18nReady`). This is low-risk to add if needed.

2. **Italian i18n label for dark mode toggle**
   - What we know: `it.json` likely has `"darkMode"` and `"appearance"` keys (parallel to `en.json`) but was not fully inspected.
   - What's unclear: Whether the Italian translations are already filled in or are empty/English.
   - Recommendation: The planner should include a task step to verify and fill `it.json` for any new or missing keys used by the dark mode UI.

---

## Sources

### Primary (HIGH confidence)
- Codebase direct inspection: `stores/settingsStore.ts`, `app/_layout.tsx`, `components/useColorScheme.ts`, `hooks/useThemeColors.ts`, `app/(tabs)/index.tsx`, `app/(tabs)/settings.tsx`, `components/PlantCard.tsx`, `components/PlantGrid.tsx`, `constants/Colors.ts`, `i18n/resources/en.json`
- Zustand `persist` middleware API: `hasHydrated()` and `onFinishHydration()` are part of the persist middleware's public API (confirmed by direct code pattern recognition from persist middleware source)

### Secondary (MEDIUM confidence)
- React Native `Animated` API: `Animated.loop`, `Animated.sequence`, `Animated.timing` with `useNativeDriver: true` for opacity — well-established, matches existing usage in codebase
- React Navigation `ThemeProvider` with `DarkTheme`/`DefaultTheme`: already in use in `_layout.tsx`, behavior with custom color scheme value is standard

### Tertiary (LOW confidence)
- Zustand `persist.hasHydrated()` synchronous behavior on fast devices: expected to be synchronous based on the middleware design, but not explicitly verified against official docs in this session.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and used in the project; no new dependencies
- Architecture: HIGH — patterns derived directly from reading existing codebase files; no speculation
- Pitfalls: HIGH — hydration race is a well-known Zustand pattern issue; ThemeProvider flicker is inherent to async storage

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable stack; Expo/RN APIs don't change frequently)
