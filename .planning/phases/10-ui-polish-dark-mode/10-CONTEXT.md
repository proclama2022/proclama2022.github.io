# Phase 10: UI Polish & Dark Mode - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Improved visual design with dark mode support. Most success criteria are already met: Onboarding has Ionicons + entrance animations, Settings is already in card sections, all screens use colors.ts palette via useThemeColors. The two real gaps are: (1) dark mode user toggle in Settings, (2) loading skeletons for the plant list.

</domain>

<decisions>
## Implementation Decisions

### Dark mode toggle
- Simple on/off switch in the Settings "General" section card
- Three-state logic: `'light' | 'dark' | 'system'` stored in `settingsStore` (persisted via AsyncStorage)
- Default: `'system'` — follows device preference on first launch
- Toggle UX: a Switch component; label shows current mode ("Tema scuro" / "Dark Mode")
- When user sets light or dark manually, it overrides system permanently until changed again
- `app/_layout.tsx` reads `settingsStore.colorScheme` and passes the resolved value to `ThemeProvider`

### Loading skeletons
- Scope: plant grid on the Home screen only — the most visible loading moment
- Shown while `plantsStore` is hydrating from AsyncStorage on first mount
- Style: rectangular placeholders matching PlantCard dimensions, animated pulse (opacity 0.4 → 1.0, loop)
- Color: `colors.border` (theme-aware, works in both light/dark)
- Count: show 6 skeleton cards (2 columns × 3 rows) as placeholder grid
- Dismiss: skeletons replaced by real PlantGrid as soon as store is hydrated

### Already complete — no changes needed
- Onboarding: Ionicons + entrance animations already implemented in `components/Onboarding.tsx`
- Settings card sections: `sectionCard` with `borderRadius: 14` already in place
- Color palette consistency: all screens already use `useThemeColors` + `Colors.ts`

### Claude's Discretion
- Exact pulse animation duration (recommend ~1000ms cycle)
- Skeleton card border radius (match PlantCard)
- i18n key names for dark mode setting label
- Whether to add a sun/moon icon next to the toggle

</decisions>

<specifics>
## Specific Ideas

- No specific references — open to standard mobile dark mode patterns
- Skeleton animation should use `Animated.loop` + `Animated.sequence` (already available, no new deps)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `stores/settingsStore.ts`: Zustand + persist via AsyncStorage — add `colorScheme: 'light' | 'dark' | 'system'` here
- `app/_layout.tsx`: already imports `useColorScheme` and `ThemeProvider` — override point for user preference
- `components/useColorScheme.ts`: current hook reads system — needs to check store override first
- `components/PlantCard.tsx` or `components/PlantGrid.tsx`: skeleton placeholder should match these dimensions
- `Animated` from React Native: already used in Onboarding — reuse for skeleton pulse

### Established Patterns
- Settings toggle pattern: `Switch` component already used for notifications in `settings.tsx`
- Store + persist pattern: `settingsStore` already persists `language` and `notificationEnabled` — same pattern for `colorScheme`
- Theme-aware colors: `useThemeColors()` everywhere — skeleton uses `colors.border`

### Integration Points
- `settingsStore.colorScheme` → `app/_layout.tsx` ThemeProvider (override system)
- `app/(tabs)/settings.tsx` General section → add Switch + label for dark mode
- `app/(tabs)/index.tsx` → show skeleton grid while `plantsStore` hydrating, then PlantGrid

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-ui-polish-dark-mode*
*Context gathered: 2026-03-02*
