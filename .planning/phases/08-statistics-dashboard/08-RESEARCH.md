# Phase 8: Statistics Dashboard - Research

**Researched:** 2026-03-02
**Domain:** React Native / Expo — UI enhancement of existing inline chart + stat cards
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Weekly activity chart
- Upgrade from single-series (watering only) to **grouped/side-by-side bars per day**: blue for waterings, orange for completed reminders
- Add a **legend** (two colored dots with labels) above or below the chart
- Days with zero data for both series: show **no bars** (empty day, labels only) — no placeholder bar

#### Zero state — streak card
- When streak = 0: show the number **0** with an encouraging message below (e.g. "Start watering to build your streak!")
- Do NOT hide the card or show a dash

#### Zero state — reminder completion rate
- When no reminders exist (0 total): show **—%** with text "No reminders set" instead of 0%

#### Streak milestone styling
- Streak **≥ 7 days**: card changes to a special visual state — amber/gold color and a flame icon replacing the default water-drop icon
- Threshold: **7 days**
- Below 7 days: normal styling (default tint color, water-drop icon)

### Claude's Discretion
- Exact amber/gold color value (should harmonize with existing theme colors)
- Precise bar width and gap between grouped bars
- Legend position (above vs. below chart)
- Exact wording of encouraging messages for zero states

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 8 is a targeted UX polish pass on an already-working `app/statistics.tsx`. All three deliverables are surgical edits to existing code: (1) extend the inline `BarChart` component to accept a `secondaryData` prop and render grouped bars side-by-side; (2) add zero-state branches to the streak card (show 0 + encouraging text) and reminder completion card (show —% + "No reminders set"); (3) add a conditional styling branch on the streak card that activates at `wateringStreak >= 7`.

No new libraries are required. The project already uses React Native `View`/`StyleSheet` for custom charting, Ionicons for icons, `useThemeColors` for all color tokens, and `react-i18next` for all user-facing strings. The amber/gold color for the milestone card is already present in the theme as `colors.warning` (`#f57c00` light / `#ffb74d` dark). The `flame` icon is confirmed available in Ionicons (already imported in the file via `@expo/vector-icons`).

The only data-layer change needed is adding `weeklyRemindersData` to the return value of `computeStats()` — a parallel 7-element array counting completed reminders per day, using the same day-loop pattern already used for `weeklyData` (waterings).

**Primary recommendation:** Extend existing code in-place inside `app/statistics.tsx` only — no new files, no new dependencies. Three isolated changes: `computeStats()` data, `BarChart` props/render, and two stat-card JSX branches.

---

## Standard Stack

### Core (already in project — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Native `View` + `StyleSheet` | (bundled) | Custom grouped bar chart rendering | Already used by existing `BarChart` inline component; no chart library needed |
| `@expo/vector-icons` Ionicons | (bundled with Expo) | `flame` icon for streak milestone | Already imported in `statistics.tsx` |
| `useThemeColors` | (project hook) | All color tokens — `colors.warning` for amber/gold | Established project pattern; provides `#f57c00`/`#ffb74d` per theme |
| `react-i18next` | (already installed) | New i18n keys for zero states and legend labels | All user-facing strings go through `t()` per project convention |

### No New Dependencies

This phase requires zero new `npm install` calls. Every tool is already in the project.

**Installation:**
```bash
# No installs required
```

---

## Architecture Patterns

### Recommended File Structure

All changes are confined to a single file:

```
app/
└── statistics.tsx     # Only file modified
    ├── computeStats() → add weeklyRemindersData
    ├── BarChart()     → add secondaryData, showLegend props
    └── StatisticsScreen JSX
        ├── streak card  → milestone branch (≥7 days)
        └── reminder card → zero state branch (totalReminders === 0)

i18n/resources/
├── en.json            # Add new keys under "stats"
└── it.json            # Add Italian translations
```

### Pattern 1: Extending `computeStats()` with Secondary Data

**What:** Add a `weeklyRemindersData` array alongside existing `weeklyData` using the same 7-day loop.
**When to use:** When adding any new data series to the weekly chart.
**Example:**

```typescript
// Extend the existing day-loop inside computeStats()
// Source: existing pattern in app/statistics.tsx lines 52-66

// Weekly reminder data (last 7 days — completed reminders only)
const weeklyRemindersData: number[] = [];
for (let i = 6; i >= 0; i--) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  const dateStr = d.toISOString().split('T')[0];
  let count = 0;
  plants.forEach(p => {
    if (p.reminders) {
      p.reminders.forEach(r => {
        if (r.completed && new Date(r.date).toISOString().split('T')[0] === dateStr) {
          count++;
        }
      });
    }
  });
  weeklyRemindersData.push(count);
}

// Add to return object:
return {
  ...existingFields,
  weeklyRemindersData,
};
```

**Note on Reminder.date semantics:** The `Reminder` type uses `date` as "reminder date" (ISO date string), not a completion date. There is no `completedDate` field — only `completed: boolean`. This means the grouping by completion date is not possible from the data model. The practical approach: count completed reminders whose `date` falls within each day of the last 7 days. This is the same pattern used for watering (event date = the action date).

### Pattern 2: Grouped Bar Chart — Extend Existing BarChart Component

**What:** Add `secondaryData?: number[]` and `showLegend?: boolean` props to the existing inline `BarChart` component.
**When to use:** Side-by-side bars per day column.
**Example:**

```typescript
// Source: extends existing BarChart in app/statistics.tsx

function BarChart({
  data,
  secondaryData,
  dayLabels,
  colors,
  t,
  showLegend,
}: {
  data: number[];
  secondaryData?: number[];
  dayLabels: string[];
  colors: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useTranslation>['t'];
  showLegend?: boolean;
}) {
  const maxVal = Math.max(...data, ...(secondaryData ?? []), 1);

  return (
    <View>
      {/* Optional legend — two colored dots + labels */}
      {showLegend && (
        <View style={barStyles.legend}>
          <View style={barStyles.legendItem}>
            <View style={[barStyles.legendDot, { backgroundColor: colors.tint }]} />
            <Text style={[barStyles.legendLabel, { color: colors.textSecondary }]}>
              {t('stats.legendWatering')}
            </Text>
          </View>
          <View style={barStyles.legendItem}>
            <View style={[barStyles.legendDot, { backgroundColor: '#f57c00' /* colors.warning */ }]} />
            <Text style={[barStyles.legendLabel, { color: colors.textSecondary }]}>
              {t('stats.legendReminders')}
            </Text>
          </View>
        </View>
      )}
      {/* Bar columns */}
      <View style={barStyles.container}>
        {data.map((val, i) => {
          const secVal = secondaryData?.[i] ?? 0;
          return (
            <View key={i} style={barStyles.barColumn}>
              <View style={barStyles.groupedBars}>
                {/* Primary bar — watering (tint/blue) */}
                <View style={barStyles.barTrack}>
                  {val > 0 && (
                    <View style={[barStyles.barFill, {
                      backgroundColor: colors.tint,
                      height: `${Math.round((val / maxVal) * 100)}%`,
                    }]} />
                  )}
                </View>
                {/* Secondary bar — reminders (warning/orange) */}
                <View style={barStyles.barTrack}>
                  {secVal > 0 && (
                    <View style={[barStyles.barFill, {
                      backgroundColor: colors.warning,
                      height: `${Math.round((secVal / maxVal) * 100)}%`,
                    }]} />
                  )}
                </View>
              </View>
              <Text style={[barStyles.dayLabel, { color: colors.textMuted }]}>
                {dayNames[dayLabels[i]] || ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
```

**Key insight:** When both series are 0 for a day, both `barTrack` elements render empty — producing the "empty day, labels only" appearance specified in the locked decisions. No special-casing needed.

**Grouped bar sizing:** Current `barTrack` is `width: 28`. With two bars per column and a small gap, each bar should be roughly `width: 11–12` with a `gap: 2–3` between them — fitting within the same column flex space. Use `flexDirection: 'row'` on a `groupedBars` wrapper.

### Pattern 3: Streak Card Milestone Styling

**What:** Conditional JSX branch based on `wateringStreak >= 7`.
**When to use:** Replaces icon + background color only; card structure stays identical.

```typescript
// Source: extends existing streak card in StatisticsScreen JSX

const isMilestone = stats.wateringStreak >= 7;

// In JSX:
<View style={[styles.statCard, { backgroundColor: colors.surface }]}>
  <View style={[
    styles.iconBg,
    { backgroundColor: isMilestone ? '#fff3e0' : '#e8f5e9' }
  ]}>
    <Ionicons
      name={isMilestone ? 'flame' : 'water'}
      size={24}
      color={isMilestone ? colors.warning : '#2e7d32'}
    />
  </View>
  <Text style={[styles.statValue, { color: colors.text }]}>{stats.wateringStreak}</Text>
  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('stats.wateringStreak')}</Text>
  <Text style={[styles.statUnit, { color: colors.textMuted }]}>{t('stats.days')}</Text>
  {stats.wateringStreak === 0 && (
    <Text style={[styles.encourageText, { color: colors.textMuted }]}>
      {t('stats.streakZeroMsg')}
    </Text>
  )}
</View>
```

**Amber/gold color decision:** Use `colors.warning` from `useThemeColors`. This resolves to `#f57c00` (light) and `#ffb74d` (dark) — already in the project's `Colors.ts`. Icon bg: `'#fff3e0'` (warm amber tint, light mode); for dark mode correctness consider `colors.warning` with low opacity or a hardcoded `'#3e2a00'`.

### Pattern 4: Reminder Completion Zero State

**What:** Guard on `totalReminders === 0` to show "—%" instead of "0%". Already partially present — the current code shows `t('stats.noData')` when `totalReminders === 0`. The locked decision replaces that with "—%" + "No reminders set".

```typescript
// Replace existing zero-state branch in wideCard for reminder completion

{stats.totalReminders === 0 ? (
  <View style={styles.zeroStateRow}>
    <Text style={[styles.percentText, { color: colors.textMuted }]}>—%</Text>
    <Text style={[styles.noDataText, { color: colors.textMuted }]}>
      {t('stats.noRemindersSet')}
    </Text>
  </View>
) : (
  // existing progress bar + percentage row
)}
```

### Anti-Patterns to Avoid

- **Rendering value counts ("0") above zero-height bars:** When `val === 0`, omit the value label too — otherwise "0" floats above an absent bar, which is visually noisy.
- **Sharing a single `maxVal` across primary only vs. grouped:** Compute `maxVal = Math.max(...data, ...(secondaryData ?? []), 1)` to prevent a secondary bar from overflowing the track.
- **Hardcoding colors without `colors.warning`:** The `warning` token is already theme-aware. Use it for the orange/amber reminder bar and for the milestone streak card icon color.
- **Forgetting Italian translation:** Project requires both `en.json` and `it.json` updates for every new i18n key.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grouped bar chart | A third-party charting library (Victory Native, react-native-chart-kit) | Extend existing inline `BarChart` | Existing component has zero dependencies; chart is simple enough (7 columns, 2 series, no interaction) |
| Color tokens | Hardcoded hex values throughout | `colors.warning`, `colors.tint`, `colors.textMuted` via `useThemeColors` | Theme tokens already handle light/dark automatically |
| Icon lookup | Custom icon mapping | `Ionicons name="flame"` / `name="water"` | Already imported; `flame` confirmed available in `@expo/vector-icons` Ionicons set |

**Key insight:** This phase is pure UI refinement of an already-working screen. Any library addition would be disproportionate to the change scope.

---

## Common Pitfalls

### Pitfall 1: Reminder Date vs. Completion Date Mismatch

**What goes wrong:** Trying to group completed reminders by "when they were completed" rather than by their `date` field.
**Why it happens:** The `Reminder` type has `completed: boolean` but no `completedDate` field. The only date is `date` (the intended reminder date).
**How to avoid:** Group by `reminder.date` (when the reminder was scheduled/due), filtering to `completed === true`. This is what the pattern above does.
**Warning signs:** Weekly reminders chart shows 0 for all days even when `completedReminders > 0`.

### Pitfall 2: Bar Width Overflow in Grouped Layout

**What goes wrong:** Two bars side-by-side overflow the column width causing layout clipping.
**Why it happens:** Current `barTrack` is `width: 28`. Two bars at 28px each plus gap = ~60px, far wider than the flex column.
**How to avoid:** Size each bar at `width: 11` or `width: 12` with `gap: 3` in the `groupedBars` wrapper, totaling ~25–27px per column group. The outer `barColumn` keeps `flex: 1` so spacing self-adjusts.
**Warning signs:** Bars clip on narrow screens (≤375px width).

### Pitfall 3: `maxVal` Computed From Primary Series Only

**What goes wrong:** Secondary (reminder) bars overflow bar track height because they were excluded from the max calculation.
**Why it happens:** Developer only includes `...data` in the `Math.max` call, omitting `secondaryData`.
**How to avoid:** Always `Math.max(...data, ...(secondaryData ?? []), 1)`.
**Warning signs:** Orange bar visually taller than the chart container.

### Pitfall 4: Missing i18n Keys in Italian Translation

**What goes wrong:** App renders raw key strings (e.g. `"stats.legendWatering"`) in Italian locale.
**Why it happens:** Developer updates `en.json` but forgets `it.json`.
**How to avoid:** Update both files in the same commit. New keys needed:
  - `stats.legendWatering` / `stats.legendReminders` (legend labels)
  - `stats.streakZeroMsg` (encouraging text for streak = 0)
  - `stats.noRemindersSet` (zero state for completion card)
  - `stats.weeklyActivity` (updated chart card title if chart title changes from "Weekly Watering" to cover both series)
**Warning signs:** Test by switching language to Italian (Settings > Language) before completing the phase.

### Pitfall 5: Milestone Icon Background in Dark Mode

**What goes wrong:** The amber icon background (`'#fff3e0'`) looks washed out or invisible in dark mode.
**Why it happens:** Hardcoded light-mode hex in a dark theme context.
**How to avoid:** Either (a) use a conditional `colorScheme === 'dark' ? '#3e2a00' : '#fff3e0'` or (b) consider a semi-transparent overlay: `{ backgroundColor: colors.warning + '22' }` (20% opacity). The existing green `'#e8f5e9'` iconBg also hardcodes light-mode colors — so matching that established inconsistency is acceptable for MVP.
**Warning signs:** Icon circle appears invisible/black in dark mode.

---

## Code Examples

### Current `computeStats()` return shape (as-is)

```typescript
// Source: app/statistics.tsx lines 76-84
return {
  totalIdentifications,
  wateringStreak,
  reminderCompletionRate,
  totalReminders,
  completedReminders,
  weeklyData,      // number[] — waterings per day
  dayLabels,       // string[] — day-of-week index as string
};
```

**After this phase, add:**
```typescript
weeklyRemindersData,  // number[] — completed reminders per day (by reminder.date)
```

### Current `BarChart` props (as-is)

```typescript
// Source: app/statistics.tsx line 87
function BarChart({ data, dayLabels, colors, t }: {
  data: number[];
  dayLabels: string[];
  colors: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useTranslation>['t'];
})
```

**After this phase, extend to:**
```typescript
function BarChart({ data, secondaryData, dayLabels, colors, t, showLegend }: {
  data: number[];
  secondaryData?: number[];
  dayLabels: string[];
  colors: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useTranslation>['t'];
  showLegend?: boolean;
})
```

### Current zero-state in reminder card (as-is)

```typescript
// Source: app/statistics.tsx lines 196-205
{stats.totalReminders > 0 ? (
  <View style={styles.completionRow}>...</View>
) : (
  <Text style={[styles.noDataText, { color: colors.textMuted }]}>{t('stats.noData')}</Text>
)}
```

**After this phase, replace zero branch:**
```typescript
) : (
  <>
    <Text style={[styles.percentText, { color: colors.textMuted }]}>—%</Text>
    <Text style={[styles.noDataText, { color: colors.textMuted }]}>{t('stats.noRemindersSet')}</Text>
  </>
)}
```

### New i18n keys (both `en.json` and `it.json`)

```json
// en.json — add under "stats":
"streakZeroMsg": "Start watering to build your streak!",
"noRemindersSet": "No reminders set",
"legendWatering": "Watering",
"legendReminders": "Reminders",
"weeklyActivity": "Weekly Activity"
```

```json
// it.json — add under "stats":
"streakZeroMsg": "Inizia ad annaffiare per costruire la tua streak!",
"noRemindersSet": "Nessun promemoria impostato",
"legendWatering": "Annaffiature",
"legendReminders": "Promemoria",
"weeklyActivity": "Attività Settimanale"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chart title "Weekly Watering" (single series) | "Weekly Activity" (two series) | This phase | Title should reflect both data series |
| `stats.noData` text for zero reminders | "—%" + "No reminders set" | This phase | More specific zero state per locked decision |
| `water` icon always on streak card | `flame` icon when streak ≥ 7 | This phase | Milestone feedback for engaged users |

**Deprecated/outdated:**
- `t('stats.noData')` in reminder completion card: replaced with `t('stats.noRemindersSet')` specifically. The `noData` key can remain for the chart zero state but should no longer be used in the reminder section.

---

## Open Questions

1. **Dark mode icon background for milestone streak card**
   - What we know: Current icon backgrounds (`'#e8f5e9'`, `'#e3f2fd'`) are hardcoded light-mode hex values — not theme tokens.
   - What's unclear: Whether to match this established inconsistency or introduce proper dark-mode awareness for the new amber background.
   - Recommendation: Match existing pattern for consistency — hardcode `'#fff3e0'` for the amber icon bg. This is low visual risk since the icon itself uses `colors.warning` which is theme-aware.

2. **Chart title change from "Weekly Watering" to "Weekly Activity"**
   - What we know: The chart now shows two series (waterings + reminders), so "Weekly Watering" is misleading.
   - What's unclear: Whether user wants to keep "Weekly Watering" or rename.
   - Recommendation: Rename to "Weekly Activity" using a new `t('stats.weeklyActivity')` key. Treat as Claude's discretion since the locked decisions don't address this directly.

3. **Value labels above grouped bars**
   - What we know: Current single-series chart shows value counts above each bar (`{val}`).
   - What's unclear: Whether to show value labels for grouped bars (doubles the visual density) or omit them.
   - Recommendation: Omit per-bar value labels in grouped mode — too cluttered with two bars per column. Show day label only. This is Claude's discretion.

---

## Sources

### Primary (HIGH confidence)
- `/Users/martha2022/Documents/Plantid/app/statistics.tsx` — Full existing implementation read directly
- `/Users/martha2022/Documents/Plantid/constants/Colors.ts` — Color token values verified (`colors.warning` = `#f57c00` / `#ffb74d`)
- `/Users/martha2022/Documents/Plantid/types/index.ts` — `Reminder` type verified (has `date`, `completed`, no `completedDate`)
- `/Users/martha2022/Documents/Plantid/i18n/resources/en.json` — Existing `stats.*` keys verified
- `/Users/martha2022/Documents/Plantid/i18n/resources/it.json` — Italian `stats.*` keys verified

### Secondary (MEDIUM confidence)
- Ionicons `flame` icon: confirmed in project via `@expo/vector-icons` which includes the full Ionicons set (standard with all Expo SDK versions)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all code read directly from project files
- Architecture: HIGH — patterns derived from existing code in `statistics.tsx`
- Pitfalls: HIGH — based on direct inspection of types, data model, and current JSX

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable Expo/React Native APIs, no fast-moving dependencies)
