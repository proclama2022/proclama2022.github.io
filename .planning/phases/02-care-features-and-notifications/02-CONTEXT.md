# Phase 2: Care Features and Notifications - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can mark plants as watered, receive daily notifications listing plants due for watering, view 30-day watering history, and see compliance stats. This phase delivers the retention engine: watering reminders, history tracking, and care engagement features.

</domain>

<decisions>
## Implementation Decisions

### Notification Experience
- **Format:** Compact list — single line per plant: "Monstera, Ficus, Pothos need water today"
- **On tap:** Opens history view (not plant detail, not Home)
- **Permission request:** Manual only — user explicitly opts in from Settings or plant detail (not auto-prompted on first plant save)
- **Time:** 08:00 default, configurable in Settings

### Mark Watered Interaction
- **Button location:** Above care info on plant detail screen (prominent, immediate)
- **Feedback:** Toast message with green checkmark: "Marked as watered!"
- **Undo:** Short undo window via toast (5 seconds), then disappears
- **Quick action:** No "Mark Watered" button on Home screen cards — must open detail screen to mark

### History Visualization
- **Display style:** Calendar dots view — row of days with scrollable weeks
- **Day indicators:** Color-coded dots — green = watered, red = missed, gray = future/skipped
- **Streaks:** Highlight streaks prominently ("7-day watering streak!")
- **Notes:** Allow optional notes per watering entry (e.g., "Used fertilizer")

### Compliance Display
- **Visual style:** Horizontal progress bar with % label
- **Scope:** Per-plant only (on detail screen) — no overall stats on Home
- **Period:** Rolling 7 days (not 30 days, not calendar month)
- **Tone:** Only show positive progress — don't highlight missed/overdue days

### Claude's Discretion
- Exact calendar dots layout (weeks per row, navigation)
- Streak badge/styling details
- Note input UI (modal, inline, etc.)
- Progress bar color gradient

</decisions>

<specifics>
## Specific Ideas

- Positive, encouraging tone throughout — celebrate consistency, don't shame misses
- History view should feel like a habit tracker (streak-focused, rewarding)

</specifics>

<deferred>
## Deferred Ideas

- Overall compliance stats on Home screen — could add in future update
- Push notification customization (sound, vibration) — out of scope
- Multiple watering reminders per day — future consideration

</deferred>

---

*Phase: 02-care-features-and-notifications*
*Context gathered: 2026-02-20*
