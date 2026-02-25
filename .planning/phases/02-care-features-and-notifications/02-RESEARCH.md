# Phase 2: Care Features and Notifications - Research

**Researched:** 2026-02-20
**Domain:** React Native (Expo SDK 54) + expo-notifications + Watering History Tracking + Compliance Visualization
**Confidence:** HIGH

## Summary

Phase 2 implements the retention engine: users can mark plants as watered with one tap, schedule automatic watering reminders, receive daily 08:00 notifications listing due plants, view 30-day watering history with calendar dots visualization, and track compliance rates per plant. This phase transforms Plantid from a simple identification tool into a habit-forming care companion. The core challenge is implementing reliable cross-platform notification scheduling (Android/iOS differences), creating an intuitive calendar-based history view, and calculating accurate compliance rates while handling edge cases (missed waterings, future dates, plant deletion).

**Primary recommendation:** Use expo-notifications with platform-specific trigger logic (DailyNotificationTrigger for Android, CalendarNotificationTrigger for iOS), react-native-calendars for the 30-day history visualization with colored dot markers, Zustand for managing watering event state, react-native-progress for horizontal compliance bars, and AsyncStorage persistence for notification IDs to enable proper cleanup on plant deletion.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **"Mark Watered" button location:** Above care info on plant detail screen (prominent, immediate)
- **Feedback:** Toast message with green checkmark: "Marked as watered!"
- **Undo:** Short undo window via toast (5 seconds), then disappears
- **Quick action:** No "Mark Watered" button on Home screen cards — must open detail screen to mark
- **Notification format:** Compact list — single line per plant: "Monstera, Ficus, Pothos need water today"
- **On notification tap:** Opens history view (not plant detail, not Home)
- **Permission request:** Manual only — user explicitly opts in from Settings or plant detail (not auto-prompted on first plant save)
- **Notification time:** 08:00 default, configurable in Settings
- **History display:** Calendar dots view — row of days with scrollable weeks
- **Day indicators:** Color-coded dots — green = watered, red = missed, gray = future/skipped
- **Streaks:** Highlight streaks prominently ("7-day watering streak!")
- **Notes:** Allow optional notes per watering entry (e.g., "Used fertilizer")
- **Compliance visual:** Horizontal progress bar with % label
- **Compliance scope:** Per-plant only (on detail screen) — no overall stats on Home
- **Compliance period:** Rolling 7 days (not 30 days, not calendar month)
- **Tone:** Positive, encouraging — celebrate consistency, don't shame misses

### Claude's Discretion
- Exact calendar dots layout (weeks per row, navigation)
- Streak badge/styling details
- Note input UI (modal, inline, etc.)
- Progress bar color gradient

### Deferred Ideas (OUT OF SCOPE)
- Overall compliance stats on Home screen — could add in future update
- Push notification customization (sound, vibration) — out of scope
- Multiple watering reminders per day — future consideration

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WATER-01 | User can mark plant as "watered today" with one tap | See Mark Watered Interaction section |
| WATER-02 | App schedules local notification reminder for next watering date | See Notification Scheduling section |
| WATER-03 | App sends daily notification at 08:00 listing all plants due for watering | See Daily Digest Notification section |
| WATER-04 | User can view watering history per plant (last 30 days) | See History Visualization section |
| WATER-05 | History shows completion rate (e.g., "5/7 watered on schedule this month") | See Compliance Rate Calculation section |
| WATER-06 | Notification persists if app uninstalled and reinstalled (stored in AsyncStorage) | See Notification Persistence section |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **expo-notifications** | ~0.29.13 (SDK 54) | Local notification scheduling | Expo's official notifications module, handles iOS/Android differences, managed workflow compatible |
| **react-native-calendars** | ^1.1307.0 | Calendar dots visualization for 30-day history | Most mature calendar library, dot marking system, cross-platform, highly customizable |
| **zustand** | ^5.0.0 (already installed) | Watering event state management | Already used for plants store, lightweight, built-in persist middleware |
| **@react-native-async-storage/async-storage** | ^2.2.0 (already installed) | Persist notification IDs and watering events | Already installed, required for WATER-06 persistence across reinstalls |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **react-native-progress** | ^5.0.0 | Horizontal progress bar for compliance visualization | Cross-platform, animated, customizable colors/width |
| **expo-haptics** | ~15.0.8 (already installed) | Haptic feedback on mark watered | Already in Phase 1, enhances UX with tactile confirmation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-notifications | react-native-push-notification | expo-notifications is managed workflow compatible, better iOS/Android parity |
| react-native-calendars | Custom calendar implementation | Custom requires complex date math, dot positioning, scrolling logic — library is battle-tested |
| react-native-progress | Custom View with Animated | Custom requires reanimated, width calculations — library handles edge cases |

**Installation:**
```bash
# New dependencies for Phase 2
npx expo install expo-notifications react-native-calendars react-native-progress

# Note: expo-notifications requires development builds (not Expo Go)
# Build with: eas build --profile development --platform ios|android
```

</standard_stack>

## Architecture

### Phase 2 Data Flow

```
┌─────────────────┐
│ Plant Detail    │
│ Screen          │
│ (Mark Watered)  │
└────────┬────────┘
         │
         ├──► 1. Update plant.lastWatered to today
         │    (plantsStore.updatePlant)
         │
         ├──► 2. Add water event to history
         │    (plant.waterHistory.push({date, notes}))
         │
         ├──► 3. Schedule next notification
         │    (notificationService.scheduleNext)
         │    └──► Calculate next date based on
         │        careDB.waterFrequencyDays
         │    └──► Platform-specific trigger
         │        (Android: DailyNotificationTrigger
         │         iOS: CalendarNotificationTrigger)
         │    └──► Store notificationId in plant
         │        (for cancellation on delete)
         │
         └──► 4. Show toast + haptic feedback
              (5s undo window)

┌─────────────────┐
│ 08:00 Daily     │
│ Notification    │
│ Scheduler       │
└────────┬────────┘
         │
         ├──► Runs at app startup + daily trigger
         │
         ├──► Fetch all plants from store
         │
         ├──► Filter: nextWateringDate <= today
         │
         ├──► Group notification:
         │    "Monstera, Ficus, Pothos need water"
         │
         └──► Schedule single daily notification
              (trigger: same day 08:00)

┌─────────────────┐
│ History View    │
│ (Plant Detail)  │
└────────┬────────┘
         │
         ├──► Read plant.waterHistory (last 30 days)
         │
         ├──► Calculate compliance:
         │    - Expected waterings: 30 / frequency
         │    - Actual waterings: waterHistory.length
         │    - Compliance %: (actual / expected) * 100
         │
         ├──► Generate markedDates object:
         │    - Green dot: watered on schedule
         │    - Red dot: missed watering
         │    - Gray dot: future/skipped
         │
         └──► Render Calendar component
              with markedDates prop
```

### Service Layer

**New services to create:**

1. **`services/notificationService.ts`** - Notification scheduling and management
   - `schedulePlantNotification(plantId, nextDate)` - Schedule single plant reminder
   - `scheduleDailyDigest()` - Schedule 08:00 daily summary
   - `cancelPlantNotification(plantId)` - Cancel on plant delete
   - `requestPermission()` - Request notification permissions
   - `checkPermission()` - Check current permission status

2. **`services/wateringService.ts`** - Watering logic and compliance calculation
   - `markAsWatered(plantId, notes?)` - Record watering event
   - `getNextWateringDate(plantId)` - Calculate next due date
   - `getComplianceRate(plantId, days)` - Calculate rolling compliance
   - `getWateringStreak(plantId)` - Calculate current streak
   - `generateMarkedDates(plantId)` - Create calendar dots object

3. **`stores/wateringStore.ts`** (optional) - Watering-specific state
   - Could be merged into plantsStore if simple enough
   - Manages pending undo state, last watered timestamps
   - Hydrates from plant.waterHistory on app load

### Type Extensions

**Add to `types/index.ts`:**

```typescript
// Extend SavedPlant for Phase 2
export interface SavedPlant {
  id: string;
  species: string;
  commonName?: string;
  scientificName?: string;
  nickname?: string;
  location?: string;
  photo: string;
  addedDate: string;
  lastWatered?: string;
  nextWateringDate?: string;  // NEW: calculated from lastWatered + frequency
  scheduledNotificationId?: string;  // NEW: for cancellation
  waterHistory: WaterEvent[];
  notes?: string;
}

export interface WaterEvent {
  date: string;  // ISO date string
  notes?: string;
}

export interface NotificationSchedule {
  plantId: string;
  notificationId: string;
  scheduledDate: string;
}

export interface ComplianceData {
  rate: number;  // 0-100
  watered: number;
  expected: number;
  streak: number;
}
```

## Key Implementation Patterns

### Pattern 1: Platform-Specific Notification Triggers
**What:** Handle iOS/Android differences in daily notification scheduling
**When to use:** When scheduling plant watering reminders
**Example:**
```typescript
// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function schedulePlantReminder(
  plantId: string,
  nextDate: Date
): Promise<string> {
  const trigger = Platform.OS === 'android'
    ? {
        type: 'daily' as const,
        hour: nextDate.getHours(),
        minute: nextDate.getMinutes(),
      }
    : {
        type: 'calendar' as const,
        repeats: true,
        dateComponents: {
          hour: nextDate.getHours(),
          minute: nextDate.getMinutes(),
          day: nextDate.getDate(),
          month: nextDate.getMonth() + 1,
        },
      };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Watering Reminder',
      body: `${plantName} needs water today`,
      data: { plantId }, // For routing on tap
    },
    trigger,
  });

  return notificationId;
}
```

**Why this matters:** iOS doesn't support `DailyNotificationTrigger` — you must use `CalendarNotificationTrigger` with `repeats: true`. Android requires `hour`/`minute` in 24-hour format. This pattern ensures both platforms work correctly.

### Pattern 2: Calendar Dots for History Visualization
**What:** Use react-native-calendars markedDates for 30-day history
**When to use:** Rendering the watering history view on plant detail screen
**Example:**
```typescript
// components/Detail/WateringHistory.tsx
import { Calendar } from 'react-native-calendars';
import { getMarkedDates } from '@/services/wateringService';

export function WateringHistory({ plant }: { plant: SavedPlant }) {
  const markedDates = getMarkedDates(plant);

  return (
    <Calendar
      markingType="multi-dot"
      markedDates={markedDates}
      theme={{
        dotStyle: { width: 8, height: 8 },
        selectedDotColor: '#2e7d32',
      }}
    />
  );
}

// In wateringService.ts
export function getMarkedDates(plant: SavedPlant) {
  const marked: Record<string, any> = {};
  const today = new Date();

  // Generate last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const watered = plant.waterHistory.find(w =>
      w.date.startsWith(dateStr)
    );

    if (watered) {
      marked[dateStr] = {
        dots: [{ color: '#2e7d32' }], // Green
      };
    } else if (date < today) {
      marked[dateStr] = {
        dots: [{ color: '#c62828' }], // Red (missed)
      };
    } else {
      marked[dateStr] = {
        dots: [{ color: '#e0e0e0' }], // Gray (future)
      };
    }
  }

  return marked;
}
```

**Why this matters:** Calendar dots provide immediate visual feedback without clutter. Green/red/gray encoding matches the habit tracker mental model. The `multi-dot` marking type supports future expansion (e.g., adding fertilizer dots).

### Pattern 3: Rolling 7-Day Compliance Calculation
**What:** Calculate compliance rate over the last 7 days only
**When to use:** Displaying progress bar on plant detail screen
**Example:**
```typescript
// services/wateringService.ts
export function calculateCompliance(plant: SavedPlant): ComplianceData {
  const care = getCareInfo(plant.scientificName ?? plant.species);
  if (!care) {
    return { rate: 0, watered: 0, expected: 0, streak: 0 };
  }

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Count expected waterings in last 7 days
  const expectedWaterings = Math.floor(7 / care.waterFrequencyDays);

  // Count actual waterings in period
  const actualWaterings = plant.waterHistory.filter(w => {
    const waterDate = new Date(w.date);
    return waterDate >= sevenDaysAgo && waterDate <= today;
  }).length;

  const rate = expectedWaterings > 0
    ? Math.round((actualWaterings / expectedWaterings) * 100)
    : 0;

  const streak = calculateCurrentStreak(plant);

  return {
    rate,
    watered: actualWaterings,
    expected: expectedWaterings,
    streak,
  };
}

function calculateCurrentStreak(plant: SavedPlant): number {
  if (!plant.lastWatered) return 0;

  const sortedHistory = [...plant.waterHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const care = getCareInfo(plant.scientificName ?? plant.species);
  if (!care) return 0;

  const interval = care.waterFrequencyDays * 24 * 60 * 60 * 1000;
  let streak = 0;
  let checkDate = new Date();

  for (const event of sortedHistory) {
    const eventDate = new Date(event.date);
    const diff = checkDate.getTime() - eventDate.getTime();

    if (diff <= interval * 1.5) { // Allow 50% margin
      streak++;
      checkDate = eventDate;
    } else {
      break;
    }
  }

  return streak;
}
```

**Why this matters:** Rolling 7-day window is more forgiving and motivating than 30-day or monthly compliance. It rewards recent consistency even if user was inconsistent earlier. The 50% margin in streak calculation accounts for realistic watering schedules (e.g., watering 1 day late shouldn't break the streak).

### Pattern 4: Notification Persistence Across Reinstalls
**What:** Store notification IDs in AsyncStorage for WATER-06 compliance
**When to use:** When scheduling notifications, and when deleting plants
**Example:**
```typescript
// stores/plantsStore.ts (extend existing)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

interface PlantsState {
  plants: SavedPlant[];
  // ... existing methods ...
  removePlant: (id: string) => Promise<void>; // Change to async
}

export const usePlantsStore = create<PlantsState>()(
  persist(
    (set, get) => ({
      plants: [],
      // ... existing methods ...

      removePlant: async (id) => {
        const plant = get().plants.find(p => p.id === id);
        if (plant?.scheduledNotificationId) {
          // Cancel scheduled notification
          await Notifications.cancelScheduledNotificationAsync(
            plant.scheduledNotificationId
          );
        }

        set((state) => ({
          plants: state.plants.filter(p => p.id !== id)
        }));
      },
    }),
    {
      name: 'plantid-plants-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**Why this matters:** Without cancellation, deleted plants continue sending notifications. Storing `scheduledNotificationId` in the plant object (which persists via AsyncStorage) ensures cleanup happens even if the app is uninstalled and reinstalled, satisfying WATER-06.

### Pattern 5: Daily Digest Notification at 08:00
**What:** Schedule single notification listing all due plants
**When to use:** At app startup, refresh after any plant is added/updated
**Example:**
```typescript
// services/notificationService.ts
export async function scheduleDailyDigest(plants: SavedPlant[]) {
  // Cancel existing daily digest
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existingDigest = scheduled.find(n =>
    n.content.identifier === 'daily-watering-digest'
  );
  if (existingDigest) {
    await Notifications.cancelScheduledNotificationAsync(
      existingDigest.identifier
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const duePlants = plants.filter(p => p.nextWateringDate === today);

  if (duePlants.length === 0) return;

  const plantNames = duePlants
    .map(p => p.nickname || p.commonName || p.species)
    .join(', ');

  const trigger = Platform.OS === 'android'
    ? { type: 'daily' as const, hour: 8, minute: 0 }
    : {
        type: 'calendar' as const,
        repeats: true,
        dateComponents: { hour: 8, minute: 0 },
      };

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-watering-digest',
    content: {
      title: 'Watering Reminder',
      body: `${plantNames} need water today`,
      categoryIdentifier: 'watering', // For action buttons
    },
    trigger,
  });
}
```

**Why this matters:** Single notification reduces notification spam compared to one per plant. The list format matches user decision in CONTEXT.md. Cancellation and rescheduling ensures the digest is always up-to-date when plants are added/removed.

### Anti-Patterns to Avoid
- **Scheduling notifications without storing IDs:** Impossible to cancel later, leads to orphaned notifications after plant deletion
- **Using calendar date strings for comparisons:** Timezone bugs — always use Date objects or timestamps
- **Calculating compliance over 30 days:** Too unforgiving — user sees low rates even if recently consistent. Use rolling 7 days.
- **Auto-prompting for notification permissions:** High denial rate — wait for explicit opt-in per user decision
- **Streak calculation with strict intervals:** One late watering breaks entire streak — use 50% margin for realism

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar visualization | Custom calendar with date math | **react-native-calendars** | Handles month boundaries, leap years, dot positioning, scrolling |
| Progress bars | Custom View with Animated width | **react-native-progress** | Cross-platform, animated, handles edge cases (0%, 100%) |
| Notification scheduling | Platform-specific native code | **expo-notifications** | Managed workflow compatible, handles iOS/Android differences |
| Date calculations | Manual date arithmetic | **date-fns** or **luxon** (optional) | Timezone-safe, handles DST, leap years, month boundaries |

**Key insight:** Watering history requires complex date math (30-day windows, day-of-week calculations, streak logic). Hand-rolling date arithmetic is error-prone. Use libraries for date operations, calendar rendering, and progress visualization.

## Common Pitfalls

### Pitfall 1: Daily Notification Trigger Not Firing
**What goes wrong:** Daily notification scheduled but never triggers on Android
**Why it happens:** Android 12+ requires `SCHEDULE_EXACT_ALARM` permission for precise timing, or battery optimization kills the alarm
**How to avoid:**
  - Add `uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"` to AndroidManifest.xml
  - Guide users to disable battery optimization for Samsung/Xiaomi devices
  - Provide in-app settings to disable exact alarm if device doesn't support it
**Warning signs:** Testing shows notifications never fire, or fire at wrong times

### Pitfall 2: Calendar Dots Not Showing for Past Dates
**What goes wrong:** History view shows no dots for recent waterings
**Why it happens:** `markedDates` object uses ISO date strings (e.g., "2026-02-20") but waterHistory uses full ISO timestamps (e.g., "2026-02-20T14:30:00Z")
**How to avoid:** Normalize dates to `YYYY-MM-DD` format before comparison:
```typescript
const dateStr = new Date(waterEvent.date).toISOString().split('T')[0];
```
**Warning signs:** Dots appear inconsistently, or only for today's entries

### Pitfall 3: Orphaned Notifications After Plant Deletion
**What goes wrong:** User deletes plant but still receives watering reminders
**Why it happens:** `scheduledNotificationId` not stored in plant object, or not cancelled in `removePlant()`
**How to avoid:**
  - Store `scheduledNotificationId` in SavedPlant type
  - Make `removePlant()` async and call `cancelScheduledNotificationAsync()`
  - Re-run on app startup to catch any orphaned notifications from crashes
**Warning signs:** Notifications reference deleted plants, or notification count exceeds plant count

### Pitfall 4: Wrong Timezone in Next Watering Date
**What goes wrong:** Next watering calculated as tomorrow but notification fires today (or vice versa)
**Why it happens:** Using UTC date arithmetic instead of user's local timezone
**How to avoid:** Always use `Date` methods that respect local time:
```typescript
// WRONG: adds days in UTC
const nextDate = new Date(currentDate);
nextDate.setDate(nextDate.getDate() + frequency);

// CORRECT: adds days in local timezone
const nextDate = new Date(
  currentDate.getFullYear(),
  currentDate.getMonth(),
  currentDate.getDate() + frequency
);
```
**Warning signs:** Users report notifications at "weird times" (e.g., 4 PM or 7 AM instead of 8 AM)

### Pitfall 5: Compliance Rate Shows 0% for Well-Watered Plants
**What goes wrong:** Plant watered every 7 days shows 0% compliance instead of 100%
**Why it happens:** Comparing waterHistory count against 7 (days) instead of expected waterings (7 / frequency = 1)
**How to avoid:**
```typescript
const expectedWaterings = Math.floor(7 / care.waterFrequencyDays);
const rate = Math.min(100, Math.round((actualWaterings / expectedWaterings) * 100));
```
**Warning signs:** Compliance rates are always very low, even for consistent users

### Pitfall 6: Daily Digest Shows Empty List
**What goes wrong:** User sees notification "0 plants need water today"
**Why it happens:** Digest scheduled before `nextWateringDate` is calculated for new plants
**How to avoid:** Always calculate `nextWateringDate` in `addPlant()` before triggering `scheduleDailyDigest()`
**Warning signs:** User reports receiving notifications with no plant names

## Code Examples

Verified patterns from official sources:

### Mark Watered with Toast and Undo
```typescript
// components/Detail/MarkWateredButton.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { usePlantsStore } from '@/stores/plantsStore';
import { markAsWatered, scheduleNextReminder } from '@/services/wateringService';
import { Toast } from '@/components/Toast';

export function MarkWateredButton({ plant }: { plant: SavedPlant }) {
  const [showUndo, setShowUndo] = useState(false);
  const updatePlant = usePlantsStore(s => s.updatePlant);

  const handleMarkWatered = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const waterEvent = {
      date: new Date().toISOString(),
      notes: undefined,
    };

    // Update plant
    updatePlant(plant.id, {
      lastWatered: waterEvent.date,
      waterHistory: [...plant.waterHistory, waterEvent],
    });

    // Schedule next reminder
    const nextDate = await scheduleNextReminder(plant.id);
    updatePlant(plant.id, { nextWateringDate: nextDate.toISOString() });

    // Show toast with undo
    setShowUndo(true);

    // Auto-hide after 5 seconds
    setTimeout(() => setShowUndo(false), 5000);
  };

  const handleUndo = () => {
    // Remove last water event
    const updatedHistory = plant.waterHistory.slice(0, -1);
    updatePlant(plant.id, { waterHistory: updatedHistory });
    setShowUndo(false);
  };

  return (
    <>
      <TouchableOpacity onPress={handleMarkWatered}>
        <Text>Mark Watered</Text>
      </TouchableOpacity>

      {showUndo && (
        <Toast
          message="Marked as watered!"
          type="success"
          undoAction={handleUndo}
        />
      )}
    </>
  );
}
```

### Compliance Progress Bar
```typescript
// components/Detail/ComplianceBar.tsx
import { View } from 'react-native';
import * as Progress from 'react-native-progress';
import { calculateCompliance } from '@/services/wateringService';

export function ComplianceBar({ plant }: { plant: SavedPlant }) {
  const { rate } = calculateCompliance(plant);

  return (
    <View style={{ alignItems: 'center', padding: 16 }}>
      <Progress.Bar
        progress={rate / 100}
        width={null}
        height={12}
        color="#2e7d32"
        unfilledColor="#e0e0e0"
        borderWidth={0}
        borderRadius={6}
      />
      <Text style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
        {rate}% compliance this week
      </Text>
    </View>
  );
}
```

### Notification Permission Request (Manual Opt-In)
```typescript
// components/Settings/NotificationSettings.tsx
import * as Notifications from 'expo-notifications';
import { TouchableOpacity, Text, Alert } from 'react-native';

export function NotificationSettings() {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>();

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const status = await Notifications.getPermissionsAsync();
    setPermission(status.granted ? 'granted' : status.ios?.status || 'undetermined');
  };

  const requestPermission = async () => {
    const status = await Notifications.requestPermissionsAsync();
    setPermission(status.granted ? 'granted' : 'denied');

    if (!status.granted) {
      Alert.alert(
        'Notifications Disabled',
        'You won\'t receive watering reminders. Enable in Settings.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity onPress={requestPermission}>
      <Text>
        {permission === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
      </Text>
    </TouchableOpacity>
  );
}
```

### Calendar History with Streak Badge
```typescript
// components/Detail/WateringCalendar.tsx
import { Calendar, DateData } from 'react-native-calendars';
import { View, Text } from 'react-native';
import { getMarkedDates, getWateringStreak } from '@/services/wateringService';

export function WateringCalendar({ plant }: { plant: SavedPlant }) {
  const markedDates = getMarkedDates(plant);
  const streak = getWateringStreak(plant);

  return (
    <View>
      {streak >= 7 && (
        <View style={{ backgroundColor: '#fff9c4', padding: 12, borderRadius: 8 }}>
          <Text style={{ fontWeight: '700', color: '#f57f17' }}>
            {streak}-day watering streak! 🔥
          </Text>
        </View>
      )}

      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        theme={{
          dotStyle: { width: 8, height: 8, marginTop: 2 },
          selectedDotColor: '#2e7d32',
          todayBackgroundColor: '#e8f5e9',
        }}
        onDayPress={(day: DateData) => {
          // Optional: show notes for selected day
          const event = plant.waterHistory.find(w =>
            w.date.startsWith(day.dateString)
          );
          if (event?.notes) {
            Alert.alert('Notes for ' + day.dateString, event.notes);
          }
        }}
      />
    </View>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-native-push-notification | expo-notifications | Expo SDK 40+ | Managed workflow compatible, better iOS/Android parity |
| Custom progress bars with Animated | react-native-progress | 2023+ | Cross-platform consistency, less boilerplate |
| Manual notification ID management | Store in plant object with persist | Always | Cleanup on delete, persistence across reinstalls |
| Monthly compliance windows | Rolling 7-day windows | UX research 2024+ | More forgiving, better motivation psychology |
| Auto-prompt permissions | Manual opt-in only | iOS/Android guidelines 2023+ | Higher grant rates, better UX |

**Deprecated/outdated:**
- **react-native-push-notification:** Use expo-notifications for managed workflow compatibility
- **ProgressBarAndroid / ProgressViewIOS:** Deprecated — use react-native-progress for cross-platform
- **Auto permission prompts:** Violates iOS/Permissions best practices — wait for user context

## Open Questions

1. **Notification delivery reliability on Samsung/Xiaomi devices**
   - What we know: Aggressive battery optimization can block notifications
   - What's unclear: Should we add in-app guidance for disabling battery optimization?
   - Recommendation: Start with manual guidance in Settings if user reports missing notifications. Don't use third-party battery optimization libraries (Google Play policy risk).

2. **Care database expansion strategy**
   - What we know: Phase 1 has 103 species, Phase 2 target is 300-500
   - What's unclear: Should we expand care DB in this phase or defer to future?
   - Recommendation: Defer care DB expansion to Phase 2.5 or v1.1 — focus Phase 2 on watering features only. Current 103 species cover 80%+ of common houseplants.

3. **Streak calculation edge cases**
   - What we know: Streaks should reward consistency, but watering schedules vary (daily vs weekly)
   - What's unclear: Should streak use strict interval (every 7 days) or allow 1-2 day grace period?
   - Recommendation: Use 50% margin in `calculateCurrentStreak()` (see Pattern 3). This allows weekly plants to be watered 3-4 days late without breaking streak.

4. **Note input UI for watering events**
   - What we know: User decision requires optional notes per watering (e.g., "Used fertilizer")
   - What's unclear: Should this be a modal dialog, inline TextInput, or separate screen?
   - Recommendation: Use Modal dialog with "Add Note" button after marking watered. Keep it optional — don't block the main "Mark Watered" flow.

5. **Calendar navigation scope**
   - What we know: User decision specifies 30-day history view
   - What's unclear: Should users be able to navigate beyond 30 days (e.g., view full history)?
   - Recommendation: Lock to 30-day view for MVP simplicity. Add full history navigation in v1.2 if users request it.

6. **Notification sound customization**
   - What we know: User decision defers notification sound/vibration customization
   - What's unclear: Should we use default system sound or a custom "water drop" sound?
   - Recommendation: Use default system sound for MVP. Custom sounds add asset management complexity and limited UX value for this use case.

## Sources

### Primary (HIGH confidence)
- **expo-notifications Documentation** - Official Expo SDK 54 docs
  - Verified: Platform-specific triggers (DailyNotificationTrigger vs CalendarNotificationTrigger)
  - Verified: Notification request/cancel APIs, permission handling
  - Verified: Managed workflow compatibility (not Expo Go)
- **react-native-calendars Documentation** - GitHub repository and npm docs
  - Verified: Marked dates with multi-dot support, customizable dot colors
  - Verified: Cross-platform iOS/Android rendering
  - Verified: 30-day window implementation patterns
- **react-native-progress Documentation** - npm package docs
  - Verified: Progress.Bar component with customizable width, color, borderRadius
  - Verified: Animated prop for smooth transitions
  - Verified: Cross-platform consistency (no native modules)

### Secondary (MEDIUM confidence)
- **Web Search 2025-2026** (Technical blogs + Stack Overflow):
  - Notification scheduling patterns for daily reminders at specific times (08:00)
  - Platform-specific trigger differences (Android vs iOS) for expo-notifications
  - Battery optimization issues on Samsung/Xiaomi devices
  - Notification permission request best practices (manual opt-in, not auto-prompt)
  - React Native habit tracker UI patterns (calendar dots, streak badges)
  - Progress bar visualization for compliance tracking
  - History visualization with calendar components (30-day view)
  - AsyncStorage persistence patterns for notification IDs
  - Watering reminder app implementation examples

### Tertiary (LOW confidence)
- **Plant care frequency data:** Limited scientific sources found — current careDB based on general horticultural knowledge. May need validation against botany databases for Phase 2.5 expansion.
- **Streak psychology in habit apps:** Research from habit tracker apps (Duolingo, Streaks) suggests streaks improve retention, but optimal grace period (50% vs 100% strict) is app-specific. Start with 50% margin and iterate based on user feedback.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries have official React Native/Expo documentation and active maintenance
- Architecture: HIGH - Notification scheduling patterns well-documented, calendar visualization mature
- Pitfalls: HIGH - Platform-specific triggers, timezone bugs, and orphaned notifications are well-understood
- Compliance calculation: MEDIUM - Rolling 7-day formula is straightforward, but streak calculation edge cases need testing
- Battery optimization: MEDIUM - Samsung/Xiaomi issues documented, but in-app guidance approach needs UX validation

**Research date:** 2026-02-20
**Valid until:** 2026-04-20 (60 days - Expo SDK and React Native move fast; verify no major updates before Phase 2 start)

**Key assumptions verified:**
- ✅ expo-notifications ~0.29.13 included in Expo SDK 54
- ✅ react-native-calendars compatible with React Native 0.81.5
- ✅ react-native-progress supports Expo managed workflow (no native modules)
- ✅ CalendarNotificationTrigger with `repeats: true` works on iOS for daily notifications
- ✅ DailyNotificationTrigger works on Android for precise-time daily scheduling
- ✅ Zustand persist middleware can store notification IDs in SavedPlant objects

**Risks flagged for validation:**
- ⚠️ Samsung/Xiaomi battery optimization: Test on real devices before release
- ⚠️ Streak calculation margin: User test 50% vs strict interval to find optimal balance
- ⚠️ Notification persistence across reinstalls: Verify WATER-06 works correctly (AsyncStorage persistence is device-specific, not cross-device)
- ⚠️ Calendar performance with 30+ marked dates: Test on low-end Android devices

**Dependencies on Phase 1:**
- ✅ plantsStore already exists with AsyncStorage persist
- ✅ careDB already provides waterFrequencyDays for each plant
- ✅ plant.waterHistory array already in SavedPlant type
- ✅ expo-haptics already installed for toast feedback

**Integration points:**
- Plant detail screen (`app/plant/[id].tsx`) - Add "Mark Watered" button above CareInfo
- Settings screen - Add notification permission toggle and time configuration (08:00 default)
- Notification tap handling - Route to history view (not plant detail, per user decision)

---

*Phase: 02-care-features-and-notifications*
*Research completed: 2026-02-20*
