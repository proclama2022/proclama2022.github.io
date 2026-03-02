# Phase 8: Statistics Dashboard - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view their plant care statistics and streaks. The core dashboard is already implemented in `app/statistics.tsx` with streak, total identifications, reminder completion rate, and a weekly bar chart (watering only). This phase adds: (1) reminders data to the weekly chart (grouped bar), (2) zero state handling for each stat card, (3) milestone styling for streaks ≥ 7 days.

</domain>

<decisions>
## Implementation Decisions

### Weekly activity chart
- Upgrade from single-series (watering only) to **grouped/side-by-side bars per day**: blue for waterings, orange for completed reminders
- Add a **legend** (two colored dots with labels) above or below the chart
- Days with zero data for both series: show **no bars** (empty day, labels only) — no placeholder bar

### Zero state — streak card
- When streak = 0: show the number **0** with an encouraging message below (e.g. "Start watering to build your streak!")
- Do NOT hide the card or show a dash

### Zero state — reminder completion rate
- When no reminders exist (0 total): show **—%** with text "No reminders set" instead of 0%

### Streak milestone styling
- Streak **≥ 7 days**: card changes to a special visual state — amber/gold color and a flame icon 🔥 replacing the default water-drop icon
- Threshold: **7 days**
- Below 7 days: normal styling (default tint color, water-drop icon)

### Claude's Discretion
- Exact amber/gold color value (should harmonize with existing theme colors)
- Precise bar width and gap between grouped bars
- Legend position (above vs. below chart)
- Exact wording of encouraging messages for zero states

</decisions>

<specifics>
## Specific Ideas

- Flame icon for streak milestone: `flame` from Ionicons (already available in the project)
- Grouped bar chart should reuse the existing inline `BarChart` component in `statistics.tsx` — extend it rather than replace

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/statistics.tsx`: Full dashboard already exists — `computeStats()` function, `BarChart` inline component, stat cards, reminder progress bar
- `useThemeColors`: Theme-aware colors — `colors.tint`, `colors.warning` (likely amber candidate), `colors.surface`
- Ionicons: `flame`, `water`, `leaf`, `bar-chart`, `trophy` all available

### Established Patterns
- Stat cards: `View` with `backgroundColor: colors.surface`, centered content, icon in colored circle background
- Bar chart: purely custom inline component in `statistics.tsx` — no third-party charting library
- `computeStats()` already returns `weeklyData` (watering per day) — needs a parallel `weeklyRemindersData` array added

### Integration Points
- `computeStats()` in `statistics.tsx`: add `weeklyRemindersData` array (count of completed reminders per day, last 7 days)
- `BarChart` component props: extend to accept `secondaryData` and `showLegend`
- Streak card JSX: add conditional styling branch for `wateringStreak >= 7`
- Reminder completion card JSX: add `totalReminders === 0` guard for —% display

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-statistics-dashboard*
*Context gathered: 2026-03-02*
