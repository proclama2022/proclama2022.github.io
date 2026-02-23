# Phase 4: Tabbed Layout and Content Reorganization - Research

**Researched:** 2026-02-23
**Domain:** React Native / Expo tab navigation, content reorganization, auto-save notes, extended care data
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tab bar design**
- Underline indicator style — active tab has a colored underline, not a pill or segmented control
- Tab bar sits sticky below the plant header (photo + name stay at top, tabs stick as content scrolls)
- Default to Info tab on open — always, not context-dependent or remembered
- Horizontal swipe between tabs enabled alongside tap navigation

**Info tab content**
- Info tab shows: species name, confidence %, identification photo, common name, brief description — identification-focused only
- Extended care info moves entirely to the Care tab
- Header (photo + name + confidence) is compact — small thumbnail photo, not a hero image (~80-100px tall)
- Action buttons (save to collection, share) stay in the header above the tabs, visible regardless of active tab
- History tab is a placeholder in Phase 4 — empty state or "coming soon" message; no actual history feature yet

**Care tab gaps**
- When PlantNet returns no data for a field: show the section heading with muted "Not available for this species" text — don't hide sections
- Pest entries: expandable list items — pest name + brief description visible, tap to expand remedy details
- Seasonal temperature: simple list, one row per season (Spring: 15–20°C, Summer: 20–28°C, etc.)
- Care section order: Watering → Light → Temperature → Fertilization → Pruning → Pests

**Notes tab UX**
- Character counter: hidden until ~800 chars used, then shows "N remaining" in muted text
- Custom metadata fields (purchase date, price, origin, gift from): inline form below the notes textarea — all 4 fields visible, not collapsible
- Auto-save confirmation: subtle "Saved ✓" flash for ~1.5s near the textarea after blur save — not silent, not a persistent timestamp
- Empty state: just the textarea with placeholder text "Add notes about this plant..." — no illustration needed

### Claude's Discretion
- Exact spacing and typography within tabs
- Error state handling for Care tab data fetch failures
- Tab library/component choice (react-native-tab-view or similar)
- Exact animation/transition style for tab switching
- How to handle keyboard avoidance in the Notes tab on iOS/Android

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TAB-01 | User sees tabbed navigation at top of plant detail screen with 4 tabs (Info \| Care \| History \| Notes) | @react-navigation/material-top-tabs with underline indicator style — matches locked decisions exactly |
| TAB-02 | User can swipe horizontally to switch between tabs | `swipeEnabled` prop on MaterialTopTabNavigator (default true), powered by react-native-pager-view |
| TAB-03 | User can tap tab labels to switch between tabs | Default MaterialTopTabNavigator behavior — pressing tab label navigates to that tab |
| TAB-04 | Tab state persists while viewing same plant (returns to last active tab) | Use `initialRouteName` from local component state; MaterialTopTabs keeps screens mounted by default |
| TAB-05 | Only active tab content is rendered (lazy loading for performance) | `lazy={true}` prop on MaterialTopTabNavigator screens, combined with `lazyPlaceholder` component |
| CARE-01 | User sees seasonal temperature range (min/max per season) in Care tab | New `seasonalTemps` field on extended PlantCareInfo type; rendered as simple list rows in CareTab |
| CARE-02 | User sees fertilization schedule (when, type, frequency) in Care tab | New `fertilization` field on extended PlantCareInfo; "Not available" fallback per locked decisions |
| CARE-03 | User sees pruning instructions (when, how) in Care tab | New `pruning` field on extended PlantCareInfo; "Not available" fallback per locked decisions |
| CARE-04 | User sees common pests and remedies in Care tab | New `pests` array field; expandable list items with pest name + tap-to-reveal remedy |
| CARE-05 | User sees "Info not available" fallback when extended care data missing | Show section heading + muted "Not available for this species" text — never hide the section |
| CARE-06 | Extended care data displays in bilingual IT/EN | Extend existing bilingual pattern from CareInfo.tsx; new fields follow same `{ it: string; en: string }` shape |
| NOTE-01 | User can write expanded notes (multi-line textarea, 1000 char limit) | `maxLength={1000}` on TextInput; existing `notesInput` style already has `multiline` and min-height |
| NOTE-02 | User sees notes field in dedicated Notes tab | Notes textarea moves from existing [id].tsx card into new NotesTab component |
| NOTE-03 | Notes auto-save on blur (no explicit save button) | Existing `onBlur={saveNotes}` pattern from [id].tsx replicated in NotesTab; add "Saved ✓" flash |
| NOTE-04 | User can add custom metadata: purchase date (optional) | New `purchaseDate?: string` field on SavedPlant; DatePicker or plain TextInput |
| NOTE-05 | User can add custom metadata: purchase price (optional) | New `purchasePrice?: string` field on SavedPlant |
| NOTE-06 | User can add custom metadata: origin/location purchased (optional) | New `purchaseOrigin?: string` field on SavedPlant |
| NOTE-07 | User can add custom metadata: gift from (optional text field) | New `giftFrom?: string` field on SavedPlant |
</phase_requirements>

---

## Summary

Phase 4 reorganizes the existing `app/plant/[id].tsx` single-scroll screen into a 4-tab layout using `@react-navigation/material-top-tabs`. The screen already contains all the data that needs to be redistributed — this is a restructuring phase, not a data-fetching phase. No new API calls, no new services, and no backend work is required.

The two genuinely new capabilities are: (1) extended care fields (seasonal temps, fertilization, pruning, pests) added to `careDB.ts` as optional typed fields, and (2) advanced notes with 1000-char limit, auto-save confirmation flash, and 4 custom metadata fields persisted in `plantsStore`. The existing blur-based auto-save pattern from `[id].tsx` is the right model to follow for notes; it just needs a "Saved ✓" feedback overlay added.

The tab library choice (Claude's discretion) is `@react-navigation/material-top-tabs@7.4.13` with `react-native-pager-view` as the pager backend. This integrates directly with the project's existing `@react-navigation/native@7.x` dependency, requires no gesture-handler (a library not in the project), and produces the underline-indicator style the user specified. Two new npm installs are required: `@react-navigation/material-top-tabs` and `react-native-pager-view`.

**Primary recommendation:** Use `@react-navigation/material-top-tabs` as a standalone component (NOT nested inside expo-router) rendered from within `app/plant/[id].tsx`. This avoids expo-router layout conflicts and keeps the tab state local to the plant detail screen.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-navigation/material-top-tabs | 7.4.13 | Tab navigator with underline indicator, swipe + tap | Peer-compatible with existing @react-navigation/native@7.1.28; produces exact UX specified |
| react-native-pager-view | 8.0.0 | Horizontal pager powering tab swipe | Required peer dep of material-top-tabs; replaces old gesture-handler approach |
| @react-navigation/native | 7.1.28 | Already installed | No change needed |
| zustand | 5.0.11 | Already installed | SavedPlant type extended with metadata fields; no migration needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-haptics | ~15.0.8 | Already installed | Haptic feedback on notes save (matches existing pattern) |
| react-native-safe-area-context | ~5.6.0 | Already installed | Peer dep already satisfied for material-top-tabs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @react-navigation/material-top-tabs | Custom tab bar + ScrollView | Saves a dep install but requires re-implementing swipe, indicator animation, lazy loading — too much custom code |
| @react-navigation/material-top-tabs | react-native-tab-view (standalone) | Same underlying library, but requires more manual wiring; material-top-tabs is the navigator wrapper we actually want |
| react-native-pager-view | Animated.ScrollView pager | react-native-pager-view is the official peer dep; custom pager adds complexity with no benefit |

**Installation (new dependencies only):**
```bash
npx expo install @react-navigation/material-top-tabs react-native-pager-view
```

---

## Architecture Patterns

### Recommended Project Structure
```
app/plant/
└── [id].tsx              # Existing file — refactored to be tab host

components/Detail/
├── CareInfo.tsx          # Existing — extended with new fields
├── ComplianceBar.tsx     # Existing — moved to HistoryTab
├── MarkWateredButton.tsx # Existing — moved to HistoryTab or header
├── WateringHistory.tsx   # Existing — moved to HistoryTab
├── InfoTab.tsx           # NEW — species name, confidence, photo, brief desc
├── CareTab.tsx           # NEW — extended care sections with fallbacks
├── HistoryTab.tsx        # NEW — placeholder "coming soon" for Phase 4
└── NotesTab.tsx          # NEW — textarea + metadata fields + auto-save flash

types/index.ts            # Extended SavedPlant + extended PlantCareInfo types
services/careDB.ts        # Extended with optional seasonal/fertilization/pruning/pests fields
i18n/resources/en.json    # New translation keys for tab labels and care fields
i18n/resources/it.json    # Italian translations for same
```

### Pattern 1: MaterialTopTabNavigator as Inline Component

**What:** Use `createMaterialTopTabNavigator()` rendered directly inside `app/plant/[id].tsx`, NOT as an expo-router screen. The plant detail screen manages its own tab navigation internally.

**When to use:** When tabs are part of a screen's internal layout, not top-level route structure. This avoids expo-router conflicts and keeps tab state scoped to the plant.

**Example:**
```typescript
// Source: https://reactnavigation.org/docs/material-top-tab-navigator/
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator();

// In [id].tsx render:
<NavigationIndependentTree>
  <NavigationContainer>
    <Tab.Navigator
      initialRouteName="Info"
      screenOptions={{
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: '#888',
        tabBarIndicatorStyle: { backgroundColor: '#2e7d32' },
        tabBarStyle: { backgroundColor: '#fff', elevation: 0 },
        lazy: true,
        lazyPreloadDistance: 1,
      }}
    >
      <Tab.Screen name="Info" component={InfoTab} />
      <Tab.Screen name="Care" component={CareTab} />
      <Tab.Screen name="History" component={HistoryTab} />
      <Tab.Screen name="Notes" component={NotesTab} />
    </Tab.Navigator>
  </NavigationContainer>
</NavigationIndependentTree>
```

**IMPORTANT:** Because `[id].tsx` lives inside expo-router, you MUST wrap the `NavigationContainer` in `NavigationIndependentTree` to avoid the "Another navigator is already registered" error from React Navigation. This is the official pattern for nesting navigation inside expo-router.

### Pattern 2: Extended PlantCareInfo Type (Additive, Backward Compatible)

**What:** Add optional fields to `PlantCareInfo` in `types/index.ts`. Existing CARE_DATA entries gain no new fields — they fall back gracefully. New entries can add the extended data.

**When to use:** When extending a static data type without breaking existing consumers.

**Example:**
```typescript
// Source: types/index.ts (project pattern, extended)
export interface SeasonalTemp {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  minTemp: number;
  maxTemp: number;
}

export interface FertilizationInfo {
  schedule: { it: string; en: string };  // e.g. "Every 2 weeks in spring/summer"
  type: { it: string; en: string };       // e.g. "Balanced liquid fertilizer"
}

export interface PruningInfo {
  when: { it: string; en: string };
  how: { it: string; en: string };
}

export interface PestEntry {
  name: { it: string; en: string };
  description: { it: string; en: string };
  remedy: { it: string; en: string };    // Hidden until expanded
}

// Add to PlantCareInfo (all optional — no breaking change):
export interface PlantCareInfo {
  // ... existing fields unchanged ...
  seasonalTemps?: SeasonalTemp[];
  fertilization?: FertilizationInfo;
  pruning?: PruningInfo;
  pests?: PestEntry[];
}
```

### Pattern 3: SavedPlant Metadata Extension (Additive, No Migration)

**What:** Add 4 optional fields to `SavedPlant`. Zustand's persist middleware reads existing storage and simply leaves missing keys as `undefined` — no migration script needed.

**Example:**
```typescript
// Source: types/index.ts (project pattern, extended)
export interface SavedPlant {
  // ... existing fields unchanged ...
  purchaseDate?: string;   // ISO date string or free text, user-entered
  purchasePrice?: string;  // Free text (e.g. "€12.50")
  purchaseOrigin?: string; // Free text (e.g. "IKEA Milano")
  giftFrom?: string;       // Free text (e.g. "Grandma")
}
```

### Pattern 4: Auto-Save with Visual Confirmation

**What:** Notes and metadata fields save on `onBlur`. A "Saved ✓" flash appears for 1.5s then disappears. This uses local component state + setTimeout.

**Example:**
```typescript
// Source: Derived from existing [id].tsx saveNotes pattern
const [savedVisible, setSavedVisible] = useState(false);
const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleNotesBlur = useCallback(() => {
  if (notes !== (plant.notes ?? '')) {
    updatePlant(plant.id, { notes });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSavedVisible(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSavedVisible(false), 1500);
  }
}, [notes, plant, updatePlant]);

// In render:
{savedVisible && (
  <Text style={styles.savedConfirm}>Saved ✓</Text>
)}
```

### Pattern 5: Character Counter (Conditional Display)

**What:** Character counter only appears when notes exceed 800 chars. Shows "N remaining" in muted text.

**Example:**
```typescript
const NOTES_MAX = 1000;
const COUNTER_THRESHOLD = 800;
const remaining = NOTES_MAX - notes.length;
const showCounter = notes.length >= COUNTER_THRESHOLD;

// In render, below TextInput:
{showCounter && (
  <Text style={styles.charCounter}>{remaining} remaining</Text>
)}
```

### Pattern 6: Expandable Pest Entries

**What:** Each pest row shows name + brief description. Tap toggles expanded state to reveal remedy.

**Example:**
```typescript
// Source: React Native pattern
const [expandedPest, setExpandedPest] = useState<number | null>(null);

function PestRow({ pest, index, isItalian }: PestRowProps) {
  const isExpanded = expandedPest === index;
  return (
    <TouchableOpacity onPress={() => setExpandedPest(isExpanded ? null : index)}>
      <View>
        <Text>{isItalian ? pest.name.it : pest.name.en}</Text>
        <Text>{isItalian ? pest.description.it : pest.description.en}</Text>
        {isExpanded && (
          <Text style={styles.remedy}>
            {isItalian ? pest.remedy.it : pest.remedy.en}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
```

### Pattern 7: Keyboard Avoidance in Notes Tab (Claude's Discretion)

**What:** The Notes tab has a TextInput that needs the keyboard not to cover it. The existing `[id].tsx` already uses `KeyboardAvoidingView` with `behavior='padding'` on iOS and `'height'` on Android. The same pattern is correct for NotesTab.

**Recommendation:** Wrap NotesTab content in `KeyboardAvoidingView` with `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`. Use `keyboardShouldPersistTaps="handled"` on any ScrollView wrapping the tab content.

### Anti-Patterns to Avoid
- **Embedding tabs inside expo-router Stack:** Do NOT add tab screens as child routes of `app/plant/` in expo-router. The tabs are a UI component internal to the detail screen, not navigation routes. Use `NavigationIndependentTree`.
- **Hiding care sections when data is missing:** The user explicitly said to always show the section heading even when data is missing. Never conditionally hide sections.
- **Remembering the last active tab:** TAB-04 says state persists while viewing same plant, but user said default to Info tab on open (always). This means persist active tab in component state only, not in the store.
- **Eager-loading all 4 tabs:** Use `lazy={true}` to satisfy TAB-05. Without lazy, all 4 tab contents render on first open regardless of which tab is visible.
- **Using `maxLength` without truncation guard:** When loading existing notes from store that were saved before the 1000-char limit existed, don't truncate on load — just enforce on new input.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab navigation with swipe + underline indicator | Custom ScrollView pager + manual indicator animation | @react-navigation/material-top-tabs | Handles gesture conflicts, indicator animation, lazy loading, accessibility — dozens of edge cases |
| Horizontal page swiping | Animated.ScrollView with onScroll tracking | react-native-pager-view | Native-side paging, correct deceleration, proper velocity handling on Android |
| Tab indicator position animation | Animated.Value tracking | Built into MaterialTopTabNavigator via tabBarIndicatorStyle | The library already handles this correctly |

**Key insight:** The tab + swipe UX has many subtle edge cases (gesture competition with vertical scroll, animated indicator sync, lazy mount lifecycle). Using the navigator library is the correct choice over any DIY solution.

---

## Common Pitfalls

### Pitfall 1: NavigationContainer Conflict in expo-router
**What goes wrong:** Rendering `<NavigationContainer>` inside an expo-router screen throws "Another navigator is already registered for this NavigationContainer" or similar React Navigation errors.
**Why it happens:** expo-router itself wraps the entire app in a NavigationContainer. Nesting another one causes the router to conflict.
**How to avoid:** Wrap the inner `NavigationContainer` with `NavigationIndependentTree` from `@react-navigation/native`. This tells React Navigation the inner tree is independent.
**Warning signs:** Red error screen mentioning "NavigationContainer" or "Another navigator" on first render of `[id].tsx`.

```typescript
import { NavigationIndependentTree } from '@react-navigation/native';

// In [id].tsx:
<NavigationIndependentTree>
  <NavigationContainer>
    <Tab.Navigator>...</Tab.Navigator>
  </NavigationContainer>
</NavigationIndependentTree>
```

### Pitfall 2: Tab Screen Props / Plant Data Access
**What goes wrong:** Tab screen components (InfoTab, CareTab, etc.) receive `navigation` and `route` props from the tab navigator, but the plant data isn't automatically available.
**Why it happens:** Tab screens are mounted as navigator children and don't have direct access to the parent screen's plant state.
**How to avoid:** Pass plant data via `screenOptions` or use a pattern where each tab reads directly from `usePlantsStore` with the plant ID. Since Zustand store is global, each tab can call `usePlantsStore(s => s.getPlant(id))` directly. The `id` should be passed via navigation params or React Context.
**Warning signs:** `undefined` plant data inside tab screens.

### Pitfall 3: Lazy Loading and Mount Lifecycle
**What goes wrong:** With `lazy={true}`, a tab screen is not rendered until first focused. If a tab screen has a `useEffect` for initialization, it won't fire until the user navigates to that tab.
**Why it happens:** lazy loading defers the component mount.
**How to avoid:** This is expected behavior. Don't rely on side effects from unvisited tabs firing on screen open. Use `lazyPlaceholder` to show a spinner while lazy tabs load.
**Warning signs:** Data not initialized when navigating to a tab for the first time.

### Pitfall 4: KeyboardAvoidingView Inside Tab Navigator
**What goes wrong:** On iOS, the keyboard covers the Notes TextInput. On Android, the layout shifts unexpectedly.
**Why it happens:** The tab navigator manages its own layout; `KeyboardAvoidingView` needs to be inside the specific tab screen, not wrapping the entire navigator.
**How to avoid:** Put `KeyboardAvoidingView` inside `NotesTab.tsx` only, wrapping the `ScrollView`. Use `behavior="padding"` on iOS, `behavior="height"` on Android. Set `keyboardVerticalOffset` as needed.
**Warning signs:** Keyboard overlaps the TextInput on iOS when tapping the notes field.

### Pitfall 5: Auto-Save setTimeout Leak
**What goes wrong:** If the user navigates away from the Notes tab while a 1.5s save-flash timeout is pending, the setTimeout fires on an unmounted component.
**Why it happens:** setTimeout callback captures stale closure.
**How to avoid:** Use `useRef` for the timeout ID and clear in `useEffect` cleanup (return function). The example in Pattern 4 shows the correct approach with `clearTimeout`.
**Warning signs:** React warning "Can't perform a state update on an unmounted component".

### Pitfall 6: Care Data Type Extension Without i18n Keys
**What goes wrong:** New care fields (fertilization, pruning, pests) render section headings but translation keys are missing, causing `i18next` to display raw key strings like `detail.fertilization`.
**Why it happens:** New sections need corresponding translation keys in `en.json` and `it.json`.
**How to avoid:** Add all new translation keys to both `en.json` and `it.json` before or alongside the component work.
**Warning signs:** Section labels show raw translation key strings in the UI.

---

## Code Examples

Verified patterns from official sources and project codebase:

### MaterialTopTabNavigator Setup (with NavigationIndependentTree)
```typescript
// Source: https://reactnavigation.org/docs/material-top-tab-navigator/ + expo-router pattern
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator();

// In [id].tsx render (inside SafeAreaView, below compact header):
<NavigationIndependentTree>
  <NavigationContainer>
    <Tab.Navigator
      initialRouteName="Info"
      screenOptions={{
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: '#888',
        tabBarIndicatorStyle: { backgroundColor: '#2e7d32', height: 2 },
        tabBarStyle: {
          backgroundColor: '#fff',
          shadowOpacity: 0,
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
        },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600', textTransform: 'none' },
        lazy: true,
        swipeEnabled: true,
      }}
    >
      <Tab.Screen name="Info" component={InfoTab} />
      <Tab.Screen name="Care" component={CareTab} />
      <Tab.Screen name="History" component={HistoryTab} />
      <Tab.Screen name="Notes" component={NotesTab} />
    </Tab.Navigator>
  </NavigationContainer>
</NavigationIndependentTree>
```

### Extended Care Section with "Not Available" Fallback
```typescript
// Source: Derived from existing CareInfo.tsx pattern + locked decisions
interface CareSection {
  label: string;
  children: React.ReactNode;
  hasData: boolean;
}

function CareSection({ label, children, hasData }: CareSection) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {hasData ? children : (
        <Text style={styles.notAvailable}>Not available for this species</Text>
      )}
    </View>
  );
}
```

### Notes Auto-Save with Confirmation Flash
```typescript
// Source: Extends existing saveNotes pattern from app/plant/[id].tsx
const [savedVisible, setSavedVisible] = useState(false);
const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  return () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  };
}, []);

const handleBlur = useCallback(() => {
  if (notes !== (plant.notes ?? '')) {
    updatePlant(plant.id, { notes });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSavedVisible(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSavedVisible(false), 1500);
  }
}, [notes, plant, updatePlant]);
```

### Passing Plant ID to Tab Screens via Zustand
```typescript
// Source: Project pattern — Zustand store is global
// In each tab screen (InfoTab, CareTab, etc.):
import { useLocalSearchParams } from 'expo-router';
import { usePlantsStore } from '@/stores/plantsStore';

export function CareTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plant = usePlantsStore((s) => s.getPlant(id ?? ''));
  // ... render care data
}
```

**Note:** `useLocalSearchParams` from expo-router is accessible even inside tab screens that are inside `NavigationIndependentTree`, because expo-router's params are accessed via its own context, not React Navigation params.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-native-tab-view v3 with react-native-gesture-handler | react-native-pager-view (no gesture-handler) | Tab-view v4 (2022), now stable | Cleaner dep tree; gesture-handler not in this project |
| `MaterialTopTabNavigator` needing gesture-handler | react-native-pager-view as pager backend | @react-navigation/material-top-tabs v7 | Direct install without gesture-handler |
| Single-scroll plant detail | Tabbed detail screen | Phase 4 | Content reorganization, better UX |

**Deprecated/outdated:**
- `react-native-gesture-handler` for tab swiping: Not needed for material-top-tabs v7 with pager-view backend. Do NOT install gesture-handler for this phase.
- `lazy={false}` (eager loading all tabs): Was default in older versions. Default behavior may render all screens now — explicitly set `lazy={true}` to satisfy TAB-05.

---

## Open Questions

1. **`NavigationIndependentTree` availability in @react-navigation/native@7**
   - What we know: `NavigationIndependentTree` was introduced to solve exactly the expo-router nesting conflict.
   - What's unclear: Whether it's available in v7.1.28 (confirmed installed version) or only in newer minor releases.
   - Recommendation: Verify import at implementation time. Alternative if unavailable: render the tab navigator using a custom approach with `TabView` from `react-native-tab-view` directly (no NavigationContainer needed). This is fully viable since react-native-tab-view v4 is a standalone pager view wrapper.

2. **`useLocalSearchParams` access inside `NavigationIndependentTree`**
   - What we know: expo-router params use their own context separate from React Navigation.
   - What's unclear: Whether `useLocalSearchParams` correctly resolves inside a `NavigationIndependentTree` subtree.
   - Recommendation: If it doesn't work, pass `plantId` as a prop through the `Tab.Screen initialParams` or use a dedicated React Context wrapping the tab navigator.

3. **Seasonal temperature data availability in PlantNet API**
   - What we know: The current `plantnet.ts` does not return extended care data — it only identifies the species. All care data is local in `careDB.ts` as static entries.
   - What's unclear: Whether CARE-01/02/03/04 data should be added to existing `careDB.ts` entries or sourced from an additional API.
   - Recommendation: Based on CONTEXT.md, the Care tab reads from the local `careDB.ts` static data (same as existing care). Extend `PlantCareInfo` with optional fields. Phase 4 scope is display of this data when available — the data for each species will need to be authored/added to the static dataset.

---

## Sources

### Primary (HIGH confidence)
- npm registry: `@react-navigation/material-top-tabs@7.4.13` — version and peer dependencies confirmed
- npm registry: `react-native-pager-view@8.0.0` — latest version confirmed
- https://reactnavigation.org/docs/material-top-tab-navigator/ — API docs for lazy, swipeEnabled, tabBarIndicatorStyle
- Project codebase (`app/plant/[id].tsx`, `services/careDB.ts`, `stores/plantsStore.ts`, `types/index.ts`) — existing patterns verified by code inspection

### Secondary (MEDIUM confidence)
- https://docs.expo.dev/versions/latest/sdk/view-pager/ — Expo-managed pager-view install command
- Expo SDK 54 upgrade notes: `react-native-pager-view@6.9.1` confirmed for SDK 54 (latest is 8.0.0)
- https://reactnavigation.org/docs/tab-view/ — Tab view standalone documentation

### Tertiary (LOW confidence)
- Community pattern for `NavigationIndependentTree` with expo-router — not officially documented as a recommended pattern; verify at implementation time

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed via npm registry
- Architecture: HIGH — existing codebase patterns well understood; tab library is standard
- Pitfalls: HIGH for NavigationContainer conflict (documented issue); MEDIUM for lazy loading lifecycle; LOW for NavigationIndependentTree availability (needs verification)

**Research date:** 2026-02-23
**Valid until:** 2026-03-25 (30 days — react-navigation is relatively stable; expo-router patterns evolve faster)
