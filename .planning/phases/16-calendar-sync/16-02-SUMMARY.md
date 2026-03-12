---
phase: 16-calendar-sync
plan: "02"
subsystem: calendar
tags: [care-tab, settings-ui, event-lifecycle, i18n]
dependency_graph:
  requires:
    - 16-01 (calendarService)
  provides:
    - CareTab calendar button
    - Settings calendar toggle
    - Full event lifecycle UI
  affects:
    - components/Detail/CareTab.tsx
    - app/(tabs)/settings.tsx
    - i18n/resources/en.json
    - i18n/resources/it.json

tech_stack:
  added: []
  patterns:
    - Alert-based feedback for success/error
    - Plant.calendarEventId for event tracking

key_files:
  created: []
  modified:
    - components/Detail/CareTab.tsx
    - app/(tabs)/settings.tsx
    - i18n/resources/en.json
    - i18n/resources/it.json

decisions:
  - "Calendar event ID stored in SavedPlant.calendarEventId"
  - "Full lifecycle: Add → Update → Delete supported in CareTab"
  - "Recurrence rule: DAILY for watering events"

metrics:
  duration_seconds: ~180
  completed_date: "2026-03-05"
  tasks_completed: 5
---

# Phase 16 Plan 02: UI Integration & Event Management Summary

**One-liner:** CareTab "Add to Calendar" button with full event lifecycle (Add/Update/Delete) + Settings "Connect Calendar" toggle + localization.

## What Was Built

### Task 1: Settings UI
- "Connect Calendar" button in Settings → Calendar Integration section
- Calls CalendarService.requestPermissions() + getDefaultCalendarId()
- Success/error Alert feedback

### Task 2: Plant Detail UI (CareTab)
- "Add to Calendar" button in Watering section
- Full lifecycle management:
  - **Add**: Creates new calendar event with DAILY recurrence
  - **Update**: Modifies existing event if calendarEventId exists
  - **Delete**: Removes event and clears calendarEventId
- Edge case handling: permission denied, external deletion

### Task 3: Event Management Logic
- Check if plant.calendarEventId exists → show Update/Delete options
- No event ID → show Add option
- Handle permission denied gracefully
- Handle external event deletion (event not found)

### Task 4: Localization
- Added calendar-related strings to en.json and it.json:
  - calendarPermissionDenied
  - calendarConnected
  - calendarError
  - calendarAdded
  - calendarEventExists/ExistsBody
  - calendarEventDeleted/DeleteError
  - calendarEventUpdated/UpdateError
  - addToCalendar

### Task 5: State Persistence
- SavedPlant interface updated to include optional calendarEventId
- When event created/linked → updatePlant(calendarEventId)
- When event deleted → updatePlant(calendarEventId: undefined)

## Files Created/Modified

| File | Purpose |
|------|---------|
| components/Detail/CareTab.tsx | Add to Calendar button + lifecycle |
| app/(tabs)/settings.tsx | Connect Calendar button |
| i18n/resources/en.json | Calendar strings (EN) |
| i18n/resources/it.json | Calendar strings (IT) |

## Self-Check: PASSED

- [x] "Connect Calendar" button in Settings
- [x] "Add to Calendar" button in CareTab
- [x] Add/Update/Delete lifecycle implemented
- [x] calendarEventId stored in plant data
- [x] Localization complete for both EN and IT
- [x] TypeScript compiles

---

*Phase: 16-calendar-sync*
*Plan 02 Completed: 2026-03-05*