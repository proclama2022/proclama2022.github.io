# Phase 7: Search & Filter - Research

**Researched:** 2026-03-02
**Domain:** React Native UX polish — empty states, results count, filter persistence
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Empty / No-Results State
- Show a friendly plant-themed illustration + message when search/filter returns zero results
- Message: "No plants match your search"
- Include a visible "Clear filters" button below the message (one-tap reset)
- Message is context-aware: different text depending on cause
  - Search caused it: e.g., "No plants match 'cact'"
  - Filter caused it: e.g., "No plants need watering"

#### Results Count Display
- Show count only when search or filters are active (not always)
- Position: below the search bar, above the plant grid — small muted text
- Format: "3 of 12 plants"

#### Filter Persistence
- Filter chips (watering status, difficulty) persist within the session — survive tab switches
- Search text always clears when navigating away (treated as transient)
- Nothing persists across app restarts — always clean on launch

### Claude's Discretion
- Exact illustration asset or icon to use in empty state
- Precise spacing and typography for the results count line
- Animation/transition for empty state appearance

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 7's core search and filter logic is already fully implemented. `SearchFilterBar.tsx` provides the full UI (search input + collapsible filter chips for watering status and difficulty), and `app/(tabs)/index.tsx` has the fuzzy-match algorithm, filter functions, `filteredPlants` memoisation, and a basic no-results state. The two roadmap plans (07-01 and 07-02) are marked complete.

This phase adds three UX polish items on top of that foundation: (1) an upgraded empty/no-results state with a context-aware message and accessible "Clear filters" button, (2) a results count line ("3 of 12 plants") visible only when filters are active, and (3) session-level persistence of filter chips across tab switches while search text remains transient.

The implementation is React Native / Expo with Zustand state management and react-i18next for translations. All three features wire directly into values already computed in `index.tsx` (`filteredPlants`, `hasActiveFilters`, `plants.length`). The biggest architectural decision is how to lift filter state so it survives tab switches — moving `wateringFilter` and `difficultyFilter` from `useState` in `index.tsx` into a small Zustand slice is the idiomatic project pattern.

**Primary recommendation:** Lift `wateringFilter` and `difficultyFilter` into a new lightweight Zustand store (`searchStore`). Keep `searchQuery` in `useState` so it remains transient. Wire the empty-state upgrade and results count line directly to the already-computed `filteredPlants` and `hasActiveFilters` values.

---

## Standard Stack

### Core (already in project — no new installs)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Native | SDK 52 (Expo) | UI primitives | Project baseline |
| Zustand | existing | Client state | Already used for plants, onboarding, auth, pro, settings stores |
| react-i18next | existing | Translation strings | All user-facing text goes through `t()` |
| Ionicons (`@expo/vector-icons`) | existing | Icon set including plant-themed icons | Already used for empty state leaf icon, search icon, clear icon |
| `useThemeColors` hook | project | Theme-aware colors | Used in every UI component in the project |
| `LayoutAnimation` (React Native) | existing | Smooth filter panel animation | Already used in `SearchFilterBar.tsx` |

### No New Dependencies Required
All libraries needed for this phase are already installed. No `npm install` commands needed.

---

## Architecture Patterns

### Recommended Project Structure

No new files needed for filter persistence beyond a new store file:

```
stores/
└── searchStore.ts          # NEW — wateringFilter + difficultyFilter session state

components/
└── SearchFilterBar.tsx     # MODIFIED — receives onClearAll prop for empty-state button wiring

app/(tabs)/
└── index.tsx               # MODIFIED — results count + upgraded empty state + lifted filter state
```

### Pattern 1: Lifting Filter State to Zustand (Session Persistence)

**What:** Move `wateringFilter` and `difficultyFilter` from component `useState` in `index.tsx` to a Zustand store (no `persist` middleware — session only). Keep `searchQuery` in `useState` in `index.tsx`.

**When to use:** When state must survive React component unmount/remount (tab switch causes the tab's component tree to unmount in Expo Router).

**Why Zustand (not Context or prop drilling):** Consistent with all other stores in this project. Lightweight — no boilerplate reducer. Tab switching in Expo Router unmounts the tab screen component, so `useState` values are lost. Zustand store survives.

**Example:**
```typescript
// stores/searchStore.ts
import { create } from 'zustand';
import { WateringFilter, DifficultyFilter } from '@/components/SearchFilterBar';

interface SearchState {
  wateringFilter: WateringFilter;
  difficultyFilter: DifficultyFilter;
  setWateringFilter: (filter: WateringFilter) => void;
  setDifficultyFilter: (filter: DifficultyFilter) => void;
  clearFilters: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  wateringFilter: 'all',
  difficultyFilter: 'all',
  setWateringFilter: (filter) => set({ wateringFilter: filter }),
  setDifficultyFilter: (filter) => set({ difficultyFilter: filter }),
  clearFilters: () => set({ wateringFilter: 'all', difficultyFilter: 'all' }),
}));
```

Note: NO `persist` middleware — this is intentional. Zustand without persist gives session-level survival (survives tab switch, not app restart). This matches the locked decision.

### Pattern 2: Context-Aware Empty State Message

**What:** Derive the empty state message from which filter type caused it (search query vs chip filter).

**When to use:** When `filteredPlants.length === 0 && hasActiveFilters`.

**Logic:**
```typescript
// In index.tsx — derive from existing state values
const emptyStateMessage = (() => {
  if (searchQuery.trim()) {
    return t('search.noResultsQuery', { query: searchQuery.trim() });
  }
  if (wateringFilter === 'needsWater') return t('search.noResultsNeedsWater');
  if (wateringFilter === 'waterOk') return t('search.noResultsWaterOk');
  if (difficultyFilter !== 'all') return t('search.noResultsDifficulty', { level: t(`search.${difficultyFilter}`) });
  return t('search.noResults');
})();
```

### Pattern 3: Results Count Display

**What:** Render a small muted text line below `SearchFilterBar` showing "X of Y plants" when filters are active.

**When to use:** `hasActiveFilters === true`

**Example:**
```typescript
// In index.tsx, between <SearchFilterBar /> and plant grid/empty state
{hasActiveFilters && (
  <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
    {t('search.resultsCount', { count: filteredPlants.length, total: plants.length })}
  </Text>
)}
```

Translation key to add to `en.json` and `it.json`:
```json
"search": {
  "resultsCount": "{{count}} of {{total}} plants",
  "noResultsQuery": "No plants match '{{query}}'",
  "noResultsNeedsWater": "No plants need watering",
  "noResultsWaterOk": "All plants are watered",
  "noResultsDifficulty": "No {{level}} plants in collection"
}
```

### Pattern 4: Empty State Icon Choice (Claude's Discretion)

**Recommendation:** Use `Ionicons name="leaf-outline"` (size 48, `colors.textMuted`) — consistent with the existing "empty collection" empty state which uses `name="leaf"`. For search no-results, `leaf-outline` with muted color signals "no match" (less prominent than the filled leaf used for true empty collection). This avoids needing an external image asset.

**Alternative considered:** Using a custom SVG illustration — rejected because the project has no SVG asset infrastructure and Ionicons is already consistent project-wide.

### Anti-Patterns to Avoid

- **Persisting search query to Zustand:** User explicitly decided search text is transient. Keep it in `useState`.
- **Using AsyncStorage with persist middleware for filter state:** Would cause filters to persist across app restarts, violating the locked decision.
- **Adding a new "Clear filters" button only in the empty state:** The `SearchFilterBar` already has a "Clear" button in the filter panel. The empty state clear button should call the same `handleClearFilters` function — no duplication.
- **Showing results count when no filters are active:** Only show when `hasActiveFilters === true`, per locked decision.
- **Separate clear-search and clear-filters actions in the empty state:** One "Clear all" button is simpler — clears both search text and filter chips from the empty state context.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session-persistent state | Custom context + ref persistence | Zustand store without persist | Project standard; React context causes unnecessary re-renders; Zustand already set up |
| Smooth empty state appearance | Custom animation logic | `LayoutAnimation.easeInEaseOut` | Already used in SearchFilterBar for filter panel; consistent, no additional libraries |
| Translation interpolation | String concatenation | `t('key', { query })` with i18next interpolation | Already used for `{{date}}`, `{{count}}`, etc. across the project |

---

## Common Pitfalls

### Pitfall 1: Tab Switch Unmounts Component — useState Lost
**What goes wrong:** `wateringFilter` and `difficultyFilter` set in `useState` inside `index.tsx` are reset to `'all'` every time the user switches to another tab and back, because Expo Router unmounts the screen.
**Why it happens:** Expo Router's tab navigator unmounts non-active tabs by default (unless `unmountOnBlur: false` is set in tab options, which it is not in this project).
**How to avoid:** Move filter state to Zustand store (no persist). Keep search query in `useState` — transient by design.
**Warning signs:** Filters appear to reset whenever the user taps another tab.

### Pitfall 2: Results Count Shows When No Filters Active
**What goes wrong:** Results count line is always visible, cluttering the UI when the user has no search/filters applied.
**Why it happens:** Forgetting to gate on `hasActiveFilters`.
**How to avoid:** Wrap the results count in `{hasActiveFilters && ...}`.
**Warning signs:** "12 of 12 plants" visible at all times.

### Pitfall 3: Context-Aware Message Falls Back to Generic
**What goes wrong:** Empty state always shows generic "No plants match your search" even when a chip filter caused it.
**Why it happens:** Only checking `searchQuery` for message, not the watering/difficulty filter state.
**How to avoid:** Implement the derived message logic (Pattern 2 above) checking all three state values.
**Warning signs:** After tapping "Needs water" chip with no matching plants, message says "No plants match your search" instead of "No plants need watering".

### Pitfall 4: Missing i18n Keys Cause Runtime Errors or Silent Fallbacks
**What goes wrong:** New translation keys added to `en.json` but forgotten in `it.json` — Italian users see the key string or English fallback.
**Why it happens:** Two-language project (`en.json` and `it.json` both require updates).
**How to avoid:** Add all new `search.*` keys to both `/i18n/resources/en.json` and `/i18n/resources/it.json` in the same task.
**Warning signs:** Italian app shows raw key strings like `search.noResultsQuery`.

### Pitfall 5: `handleClearFilters` in index.tsx Only Clears Local State
**What goes wrong:** After moving filter state to Zustand, `handleClearFilters` in `index.tsx` still calls `setWateringFilter('all')` on the old local `useState` setter, not the store action.
**Why it happens:** Refactor partially applied — local setters removed but `handleClearFilters` not updated.
**How to avoid:** During the Zustand lift, update `handleClearFilters` to call `searchStore.clearFilters()` AND `setSearchQuery('')`.
**Warning signs:** Tapping "Clear filters" in empty state does nothing visible.

---

## Code Examples

### Existing "Clear" Button in SearchFilterBar (reference — do not duplicate)
```typescript
// Source: components/SearchFilterBar.tsx lines 44-48, 129-134
const handleClearFilters = useCallback(() => {
  onWateringFilterChange('all');
  onDifficultyFilterChange('all');
  onSearchChange('');
}, [onWateringFilterChange, onDifficultyFilterChange, onSearchChange]);

{hasActiveFilters && (
  <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
    <Ionicons name="trash-outline" size={14} color={colors.danger} />
    <Text style={[styles.clearText, { color: colors.danger }]}>{t('search.clearFilters')}</Text>
  </TouchableOpacity>
)}
```
The empty state "Clear filters" button should call the same `handleClearFilters` function wired from `index.tsx` — not a separate implementation.

### Existing No-Results State (to be upgraded)
```typescript
// Source: app/(tabs)/index.tsx lines 150-160
{filteredPlants.length === 0 && hasActiveFilters ? (
  <View style={styles.noResultsContainer}>
    <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface, borderColor: colors.border, width: 80, height: 80 }]}>
      <Ionicons name="search" size={32} color={colors.textMuted} />
    </View>
    <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>{t('search.noResults')}</Text>
    <TouchableOpacity onPress={handleClearFilters}>
      <Text style={{ color: colors.tint, fontWeight: '600', marginTop: 8 }}>{t('search.clearFilters')}</Text>
    </TouchableOpacity>
  </View>
) : (
  <PlantGrid plants={filteredPlants} />
)}
```
This upgrades to: (a) swap `name="search"` for `name="leaf-outline"`, (b) use context-aware message, (c) style the clear button more prominently (pill button styled like existing `cameraButton` in empty collection state).

### Existing Zustand Store Pattern (reference for new searchStore)
```typescript
// Source: stores/settingsStore.ts — minimal store pattern used in project
import { create } from 'zustand';

export const useSettingsStore = create<SettingsState>((set) => ({
  // state and actions
}));
```
The new `searchStore` follows this same minimal pattern — no persist middleware.

### hasActiveFilters Already Computed (do not recompute)
```typescript
// Source: app/(tabs)/index.tsx line 96
const hasActiveFilters = searchQuery.trim() !== '' || wateringFilter !== 'all' || difficultyFilter !== 'all';
```
After Zustand lift: reads `wateringFilter` and `difficultyFilter` from store, `searchQuery` from `useState`. Same logic, same variable name.

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Filter state in component useState | Lift to Zustand store (no persist) | Required for tab-switch survival in Expo Router |
| Generic "no results" message | Context-aware message per filter cause | User-decided locked requirement |
| Basic touchable text for clear | Styled pill button in empty state | Better discoverability |

---

## Open Questions

1. **LayoutAnimation for empty state transition**
   - What we know: `LayoutAnimation.easeInEaseOut` is already enabled for Android in `SearchFilterBar.tsx` (the `UIManager.setLayoutAnimationEnabledExperimental(true)` call)
   - What's unclear: Whether wrapping the empty state / results count in `LayoutAnimation.configureNext` adds meaningful UX or just flickers
   - Recommendation: Claude's discretion — apply `LayoutAnimation.easeInEaseOut` when toggling between grid and empty state (same pattern as filter panel). Low implementation cost, matches existing style.

2. **Italian translations for new keys**
   - What we know: `it.json` exists at `/i18n/resources/it.json` and must be updated in parallel with `en.json`
   - What's unclear: Whether the Italian copy was pre-decided or needs translation work
   - Recommendation: Implement Italian strings in the same task as English strings. Keep them as faithful translations of the English copy.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `components/SearchFilterBar.tsx` (full file)
- Direct codebase inspection — `app/(tabs)/index.tsx` (full file)
- Direct codebase inspection — `stores/plantsStore.ts`, `stores/settingsStore.ts` (Zustand patterns)
- Direct codebase inspection — `i18n/resources/en.json` (existing translation key inventory)
- Direct codebase inspection — `.planning/phases/07-search-filter/07-CONTEXT.md` (locked decisions)

### Secondary (MEDIUM confidence)
- Expo Router tab navigation behavior: tab screens unmount on tab switch by default (consistent with React Navigation stack behavior, well-documented)
- Zustand without persist middleware = session-only state: documented Zustand behavior

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; verified by direct file inspection
- Architecture patterns: HIGH — derived from direct reading of existing code and locked user decisions
- Pitfalls: HIGH — pitfalls derived from reading actual existing code paths and understanding where the refactor touches live code

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable — no new library dependencies; only internal code changes)
