# Phase 6: Custom Reminders - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create, manage, and receive custom care reminders (fertilize, repot, prune, custom) with push notifications. The History tab displays both watering events AND these custom reminders in a unified chronological view. This phase extends the existing expo-notifications system already used for watering reminders.

</domain>

<decisions>
## Implementation Decisions

### Reminder Creation UI
- **Trigger:** FAB in History tab — single entry point for both reminders and watering log
- **Form pattern:** Bottom sheet modal that slides up with form fields
- **Type selection:** Chips/pills with icons for Fertilize, Repot, Prune, Custom (Custom shows text input)
- **Form fields:** Minimal — type + date only (no notes field)

### Scheduling Options
- **Recurrence:** One-time only — no recurring/repeat option
- **Date picker:** Native iOS/Android date picker
- **Time of day:** Uses global notification time from Settings (same as watering reminders)
- **Presets:** No quick date presets — user always picks exact date

### Notification Behavior
- **Content:** "{Type} time for {Plant Name}" format (e.g., "Time to fertilize Monstera")
- **On tap:** Opens plant detail with History tab active
- **Quick actions:** None — standard notification tap only
- **Snooze:** No snooze option

### History Tab Layout
- **Mixing:** Watering events + reminders in one unified chronological list
- **Status view:** Single list with visual distinction — pending items bold/active, completed items faded
- **Mark done:** Tap reminder item to toggle complete/incomplete (checkbox-like behavior)
- **Edit/delete:** Long-press on reminder shows menu with Edit/Delete options

### Claude's Discretion
- Exact styling for pending vs completed visual distinction
- Icon choices for reminder types (Fertilize, Repot, Prune, Custom)
- Bottom sheet modal styling and animation
- Empty state when no history items exist

</decisions>

<specifics>
## Specific Ideas

- Keep it minimal — most users just want the reminder, don't clutter with extra fields
- Follow existing watering notification patterns for consistency
- Visual distinction for completed items should feel natural (faded/muted)

</specifics>

<deferred>
## Deferred Ideas

- Recurring reminders (monthly/seasonal) — could add in future update if users request
- Reminder notes field — minimal form was preferred, could add later
- In-notification quick actions (Mark Done button) — adds complexity, revisit if users want it

</deferred>

---

*Phase: 06-custom-reminders*
*Context gathered: 2026-02-25*
