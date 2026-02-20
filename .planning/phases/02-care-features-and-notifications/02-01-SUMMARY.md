---
phase: 02-care-features-and-notifications
plan: 01
subsystem: notifications, watering-tracking
tags: expo-notifications, react-native-calendars, react-native-progress, watering-service, compliance-tracking

# Dependency graph
requires:
  - phase: 01-foundation-and-core-loop
    provides: plantsStore, careDB, SavedPlant type, waterHistory array
provides:
  - Watering business logic service (markAsWatered, getNextWateringDate, getComplianceRate, getWateringStreak, generateMarkedDates)
  - Notification scheduling service with platform-specific triggers (Android daily, iOS calendar)
  - Extended SavedPlant type with nextWateringDate and scheduledNotificationId fields
  - Notification time preference persisted in PlantsState (default 08:00)
  - Watering translations in English and Italian
affects: [02-02-watering-history-ui, 02-03-daily-digest-notification]

# Tech tracking
tech-stack:
  added: [expo-notifications ~0.29.13, react-native-calendars ^1.1307.0, react-native-progress ^5.0.0]
  patterns: [platform-specific notification triggers, local timezone date arithmetic, rolling 7-day compliance calculation, 50% margin streak calculation]

key-files:
  created: [services/wateringService.ts, services/notificationService.ts]
  modified: [types/index.ts, stores/plantsStore.ts, i18n/resources/en.json, i18n/resources/it.json, package.json]

key-decisions:
  - "Use local timezone arithmetic (new Date(year, month, date + days)) to avoid UTC bugs in next watering calculation"
  - "Rolling 7-day compliance window instead of 30-day for more user-friendly motivation"
  - "50% margin in streak calculation allows realistic watering schedules without breaking streak"
  - "Platform-specific triggers: Android DailyNotificationTrigger, iOS CalendarNotificationTrigger with repeats"

patterns-established:
  - "Platform-specific notification triggers: Android uses hour/minute in DailyTrigger, iOS uses CalendarTrigger with repeats"
  - "Local timezone date arithmetic: Always use Date constructor with explicit year/month/date to avoid UTC issues"
  - "Compliance calculation: Math.floor(days / frequency) for expected waterings, then filter history by date range"
  - "Streak calculation with margin: Allow 1.5x frequency interval for consecutive events before breaking streak"

requirements-completed: [WATER-01, WATER-02]

# Metrics
duration: 3min
completed: 2026-02-20
---

# Phase 02 Plan 01: Mark Watered and Notification Scheduling Summary

**Watering business logic with markAsWatered, compliance calculation, streak tracking, and platform-specific notification scheduling using expo-notifications**

## Performance

- **Duration:** 3 min (212 seconds)
- **Started:** 2026-02-20T08:57:58Z
- **Completed:** 2026-02-20T09:01:10Z
- **Tasks:** 4
- **Files modified:** 7

## Accomplishments

- **Watering service** with complete business logic for marking plants as watered, calculating next watering dates, tracking compliance rates over rolling 7-day windows, calculating watering streaks with 50% margin, and generating calendar-marked dates for 30-day history visualization
- **Notification service** with platform-specific triggers (Android daily trigger at hour/minute, iOS calendar trigger with repeats), permission management, and batch cancellation for deleted plants
- **Extended types** to support watering features: nextWateringDate, scheduledNotificationId in SavedPlant; NotificationSchedule and ComplianceData interfaces; notificationTimePreference in PlantsState
- **Watering translations** in English and Italian covering all UI text for mark watered, compliance, streaks, notifications, and notes

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and extend types** - `2299447` (feat)
2. **Task 2: Fix TypeScript errors in notification service** - `53de01e` (fix)

**Plan metadata:** (to be added in final commit)

_Note: Tasks 3-4 discovered existing implementations — services and translations were already complete from prior work_

## Files Created/Modified

- `services/wateringService.ts` - Watering business logic (markAsWatered, getNextWateringDate, getComplianceRate, getWateringStreak, generateMarkedDates)
- `services/notificationService.ts` - Notification scheduling with platform-specific triggers, permission management
- `types/index.ts` - Extended SavedPlant with nextWateringDate/scheduledNotificationId, added NotificationSchedule/ComplianceData interfaces
- `stores/plantsStore.ts` - Added notificationTimePreference field with default 08:00 and setter
- `i18n/resources/en.json` - Complete watering namespace with all translation keys
- `i18n/resources/it.json` - Complete watering namespace with formal Italian translations
- `package.json` - Added expo-notifications, react-native-calendars, react-native-progress

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript errors in notification service**
- **Found during:** Task 2 (verification of notification service)
- **Issue:** Notification handler missing required properties (shouldShowBanner, shouldShowList); iOS calendar trigger using incorrect dateComponents property
- **Fix:** Added missing properties to notification handler; changed iOS trigger to use hour/minute props directly instead of dateComponents object
- **Files modified:** services/notificationService.ts
- **Verification:** TypeScript compilation passes with no errors (npx tsc --noEmit)
- **Committed in:** 53de01e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** TypeScript fix required for compilation — no scope creep, all planned features intact.

## Issues Encountered

None — all services and translations were already implemented from prior work. Only TypeScript compilation errors needed fixing.

## User Setup Required

None - no external service configuration required. Local notifications use expo-notifications with device-native scheduling.

## Next Phase Readiness

**Ready for 02-02 (Watering History UI):**
- generateMarkedDates() produces react-native-calendars formatted markedDates object
- getComplianceRate() provides rate/watered/expected/streak for progress bar display
- getWateringStreak() returns streak count for badge display
- All watering translations available for UI text

**Ready for 02-03 (Daily Digest Notification):**
- cancelAllPlantNotifications() handles batch cancellation
- schedulePlantNotification() with platform-specific triggers working
- Notification permission management (requestPermission, checkPermission) in place

**Concerns:** None — foundation is solid for next plans.

---
*Phase: 02-care-features-and-notifications*
*Completed: 2026-02-20*
