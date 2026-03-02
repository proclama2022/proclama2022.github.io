# Phase 9: Care Calendar - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view upcoming care tasks on a monthly calendar. The full calendar is already implemented in `app/calendar.tsx`: monthly grid, colored dot indicators, tap-to-see-tasks, task completion, month navigation, legend, Settings link. This phase corrects one color inconsistency: watering dots are currently hardcoded green (#2e7d32) while the rest of the app (statistics chart) uses `colors.tint` for watering.

</domain>

<decisions>
## Implementation Decisions

### Watering dot color
- Use `colors.tint` (theme blue/teal) for watering dots — consistent with the statistics bar chart
- Replace hardcoded `#2e7d32` with `colors.tint` in all relevant places in `calendar.tsx`:
  - Calendar grid dot (`styles.dot` background)
  - Task list row icon background (currently `#e8f5e9`) → use tint-tinted background
  - Task list row icon color (currently `#2e7d32`) → use `colors.tint`
  - Legend dot (currently `#2e7d32`) → use `colors.tint`

### Everything else
- All other calendar functionality is already correct and complete — no changes needed
- Reminder color (#f57c00 orange) stays as-is — already consistent with statistics

### Claude's Discretion
- Icon background for watering task rows: derive a light tint-tinted background (e.g. `colors.tint + '20'` alpha, or a fixed light blue) — keep visually soft like the current #e8f5e9

</decisions>

<specifics>
## Specific Ideas

- No specific references — straightforward color token substitution

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/calendar.tsx`: Full implementation — `buildTasksForMonth()`, calendar grid, task list, completion handler
- `useThemeColors`: Provides `colors.tint` — the correct replacement value
- Ionicons `water` icon already used for watering task rows

### Established Patterns
- `colors.tint` is used for watering in: statistics bar chart (colors.tint), search filter active chips, FAB button — consistent usage throughout the app
- Task icon backgrounds use a light pastel version of the icon color (e.g. `#e8f5e9` for green) — same pattern should apply with tint

### Integration Points
- `app/calendar.tsx` lines with hardcoded `#2e7d32`: dot color, legend dot, task icon background, task icon color
- No other files reference the calendar watering color

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-care-calendar*
*Context gathered: 2026-03-02*
