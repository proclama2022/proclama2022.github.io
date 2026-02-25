# Phase 6: Custom Reminders - Research

**Researched:** 2026-02-25
**Domain:** React Native (Expo SDK 54) + expo-notifications extension + Bottom Sheet UI + Unified History Timeline
**Confidence:** HIGH

## Summary

Phase 6 extends Plantid's notification system beyond watering to include custom care reminders (fertilize, repot, prune, custom). Users create one-time reminders via a FAB in the History tab that opens a bottom sheet modal, choose a type and date, and receive push notifications at the globally-configured notification time. The History tab transforms from placeholder to a unified chronological timeline showing both watering events and custom reminders, with tap-to-complete and long-press edit/delete interactions. This phase leverages the existing expo-notifications infrastructure from Phase 2, following the same platform-specific trigger patterns and notification ID storage approach.

**Primary recommendation:** Extend existing `notificationService.ts` with custom reminder scheduling (same trigger patterns as watering), use React Native Modal with slide-up animation for bottom sheet UI (pattern from ProUpgradeModal), create new `Reminder` type in `types/index.ts` with plant-scoped storage, implement unified timeline in HistoryTab using FlatList with mixed data sources, and use @expo/vector-icons Ionicons for reminder type icons (leaf, flask, git-branch, create-outline).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **FAB location:** In History tab — single entry point for both reminders and watering log
- **Form pattern:** Bottom sheet modal that slides up with form fields (same as Settings time picker, ProUpgradeModal)
- **Type selection:** Chips/pills with icons for Fertilize, Repot, Prune, Custom (Custom shows text input)
- **Form fields:** Minimal — type + date only (no notes field)
- **Recurrence:** One-time only — no recurring/repeat option
- **Date picker:** Native iOS/Android date picker (expo-notifications doesn't have built-in date picker)
- **Time of day:** Uses global notification time from Settings (same as watering reminders)
- **Notification content:** "{Type} time for {Plant Name}" format (e.g., "Time to fertilize Monstera")
- **On tap:** Opens plant detail with History tab active
- **History tab mixing:** Watering events + reminders in one unified chronological list
- **Status view:** Single list with visual distinction — pending items bold/active, completed items faded
- **Mark done:** Tap reminder item to toggle complete/incomplete (checkbox-like behavior)
- **Edit/delete:** Long-press on reminder shows menu with Edit/Delete options

### Claude's Discretion
- Exact styling for pending vs completed visual distinction (opacity, color saturation, strikethrough)
- Icon choices for reminder types (Fertilize, Repot, Prune, Custom)
- Bottom sheet modal styling and animation (slide-up height, border radius, backdrop)
- Empty state when no history items exist

### Deferred Ideas (OUT OF SCOPE)
- Recurring reminders (monthly/seasonal) — could add in future update if users request
- Reminder notes field — minimal form was preferred, could add later
- In-notification quick actions (Mark Done button) — adds complexity, revisit if users want it

</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **expo-notifications** | ~0.32.16 (already installed) | Scheduling custom reminder notifications | Already installed, proven in Phase 2, handles iOS/Android differences, managed workflow compatible |
| **react-native** | 0.81.5 (already installed) | Modal component for bottom sheet UI | Built-in Modal with slide animation, no extra dependency needed |
| **@expo/vector-icons** | ^15.0.3 (already installed) | Icons for reminder types | Already used throughout app, Ionicons set has all needed icons |
| **zustand** | ^5.0.0 (already installed) | Reminder state management | Already used for plantsStore, lightweight persist middleware |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **expo-haptics** | ~15.0.8 (already installed) | Haptic feedback on create/complete | Already in project, enhances UX for tap interactions |
| **@react-native-async-storage/async-storage** | ^2.2.0 (already installed) | Persist reminder data | Already installed, integrates with Zustand persist |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Native Modal | react-native-bottom-sheet | Modal is built-in (no extra dependency), react-native-bottom-sheet has more features but adds ~50KB and requires native linking |
| Ionicons | Custom SVG icons | Ionicons consistent with app, custom SVGs require asset management and larger bundle |
| Zustand persist | AsyncStorage directly | Zustand provides hydration, type safety, and easier migrations |

**Installation:**
```bash
# No new dependencies required — all libraries already installed
# Phase 6 uses existing expo-notifications, Modal, Ionicons, Zustand, AsyncStorage
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── Detail/
│   │   ├── HistoryTab.tsx           # Rewrite: unified timeline (watering + reminders)
│   │   └── ReminderFab.tsx          # NEW: FAB component with icon
│   ├── ReminderModal.tsx            # NEW: bottom sheet form for creating reminders
│   └── TimelineItem.tsx             # NEW: unified item component (water/reminder)
├── services/
│   ├── notificationService.ts       # EXTEND: add scheduleReminder, cancelReminder
│   └── reminderService.ts           # NEW: CRUD operations, completion toggle
├── stores/
│   └── plantsStore.ts               # EXTEND: add reminders array to SavedPlant
└── types/
    └── index.ts                     # EXTEND: add Reminder type, update SavedPlant
```

### Pattern 1: Bottom Sheet Modal with Slide-Up Animation
**What:** Use React Native Modal with animationType="slide" for bottom sheet UI
**When to use:** Creating new reminders via FAB in History tab
**Example:**
```typescript
// components/ReminderModal.tsx
import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type ReminderType = 'fertilize' | 'repot' | 'prune' | 'custom';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (type: ReminderType, date: Date, customLabel?: string) => void;
  plantName: string;
}

export function ReminderModal({ visible, onClose, onCreate, plantName }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<ReminderType>('fertilize');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customLabel, setCustomLabel] = useState('');

  const types: { key: ReminderType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: 'fertilize', icon: 'flask', label: 'Fertilize' },
    { key: 'repot', icon: 'leaf-outline', label: 'Repot' },
    { key: 'prune', icon: 'git-branch-outline', label: 'Prune' },
    { key: 'custom', icon: 'create-outline', label: 'Custom' },
  ];

  const handleCreate = () => {
    onCreate(selectedType, selectedDate, selectedType === 'custom' ? customLabel : undefined);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Reminder for {plantName}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Type selection chips */}
            <Text style={styles.sectionLabel}>Type</Text>
            <View style={styles.chipsContainer}>
              {types.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.chip,
                    selectedType === type.key && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedType(type.key)}
                >
                  <Ionicons
                    name={type.icon}
                    size={20}
                    color={selectedType === type.key ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      selectedType === type.key && styles.chipTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom label input */}
            {selectedType === 'custom' && (
              <TextInput
                style={styles.input}
                placeholder="Enter reminder label..."
                value={customLabel}
                onChangeText={setCustomLabel}
              />
            )}

            {/* Date picker button */}
            <Text style={styles.sectionLabel}>Date</Text>
            <TouchableOpacity style={styles.dateButton}>
              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar" size={20} color="#2e7d32" />
            </TouchableOpacity>

            {/* Create button */}
            <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Reminder</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chipTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 8,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginTop: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
```

**Why this matters:** Modal with `animationType="slide"` provides native-feeling bottom sheet interaction without external dependencies. The SafeAreaView inset handling ensures proper layout on notched devices. Chip selection provides clear visual feedback for type selection.

### Pattern 2: Extend Notification Service for Custom Reminders
**What:** Add reminder-specific scheduling functions to existing notificationService.ts
**When to use:** Scheduling, canceling, and managing custom reminder notifications
**Example:**
```typescript
// services/notificationService.ts (EXTEND existing)
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ... existing watering notification functions ...

export interface ReminderScheduleInput {
  plantId: string;
  plantName: string;
  reminderType: 'fertilize' | 'repot' | 'prune' | 'custom';
  customLabel?: string;
  reminderDate: Date;
  notificationTime: string; // "HH:mm" format from Settings
}

/**
 * Schedule a one-time custom reminder notification
 * @param input - Reminder scheduling details
 * @returns The notification ID for cancellation/editing later
 */
export async function scheduleReminderNotification(
  input: ReminderScheduleInput
): Promise<string> {
  const { plantId, plantName, reminderType, customLabel, reminderDate, notificationTime } = input;

  // Parse notification time (e.g., "08:00")
  const [hourStr, minuteStr] = notificationTime.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Combine reminder date with notification time
  const scheduledDate = new Date(reminderDate);
  scheduledDate.setHours(hour, minute, 0, 0);

  // Don't schedule if date is in the past
  if (scheduledDate < new Date()) {
    throw new Error('Cannot schedule reminder in the past');
  }

  // Platform-specific trigger (one-time, not recurring)
  let trigger: Notifications.NotificationTriggerInput;

  if (Platform.OS === 'android') {
    // Android: Use CalendarTrigger for specific date/time
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      year: scheduledDate.getFullYear(),
      month: scheduledDate.getMonth() + 1, // JS months are 0-indexed
      day: scheduledDate.getDate(),
      hour,
      minute,
    };
  } else {
    // iOS: Use CalendarTrigger with dateComponents
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      repeats: false, // One-time only
      dateComponents: {
        year: scheduledDate.getFullYear(),
        month: scheduledDate.getMonth() + 1,
        day: scheduledDate.getDate(),
        hour,
        minute,
      },
    };
  }

  // Build notification content
  const typeLabel = customLabel || reminderType.charAt(0).toUpperCase() + reminderType.slice(1);
  const notificationContent: Notifications.NotificationContentInput = {
    title: `${typeLabel} Reminder`,
    body: `Time to ${typeLabel.toLowerCase()} ${plantName}`,
    data: {
      plantId,
      reminderType,
      reminderId: `${plantId}-${reminderType}-${Date.now()}`, // Unique ID
    },
    sound: 'default',
    categoryIdentifier: 'reminder',
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: notificationContent,
    trigger,
  });

  return notificationId;
}

/**
 * Cancel a reminder notification
 * @param notificationId - ID of the notification to cancel
 */
export async function cancelReminderNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Reschedule an existing reminder (used for edit operations)
 * @param oldNotificationId - ID of notification to cancel
 * @param newInput - New reminder details
 * @returns The new notification ID
 */
export async function rescheduleReminderNotification(
  oldNotificationId: string,
  newInput: ReminderScheduleInput
): Promise<string> {
  await cancelReminderNotification(oldNotificationId);
  return scheduleReminderNotification(newInput);
}
```

**Why this matters:** Extends proven notification patterns from Phase 2. Uses same platform-specific trigger logic (CalendarTrigger for one-time vs recurring). Stores `reminderId` in notification data for identification on tap. Rejects past dates to prevent user confusion.

### Pattern 3: Unified Timeline with Mixed Data Sources
**What:** Combine watering events and reminders into single chronological list
**When to use:** Rendering HistoryTab with unified view
**Example:**
```typescript
// components/Detail/HistoryTab.tsx
import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlantsStore } from '@/stores/plantsStore';
import { Text } from '@/components/Themed';
import { ReminderFab } from './ReminderFab';
import { ReminderModal } from '@/components/ReminderModal';

type TimelineItem = WaterEvent | Reminder;

export function HistoryTab({ plantId }: { plantId: string }) {
  const plant = usePlantsStore((state) => state.getPlant(plantId));
  const updatePlant = usePlantsStore((state) => state.updatePlant);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Merge and sort watering events + reminders by date
  const timeline: TimelineItem[] = useMemo(() => {
    if (!plant) return [];

    const items: TimelineItem[] = [
      // Watering events
      ...plant.waterHistory.map((w) => ({ ...w, itemType: 'water' as const })),
      // Reminders
      ...(plant.reminders || []).map((r) => ({ ...r, itemType: 'reminder' as const })),
    ];

    // Sort by date descending (most recent first)
    return items.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [plant]);

  const handleToggleComplete = (reminderId: string) => {
    const reminders = plant?.reminders || [];
    const updated = reminders.map((r) =>
      r.id === reminderId ? { ...r, completed: !r.completed } : r
    );
    updatePlant(plantId, { reminders: updated });
  };

  const handleCreateReminder = (type, date, customLabel) => {
    // Create reminder via service
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      type,
      customLabel,
      date: date.toISOString(),
      completed: false,
      notificationId: '', // Will be set by service
    };
    updatePlant(plantId, {
      reminders: [...(plant?.reminders || []), newReminder],
    });
  };

  const renderTimelineItem = ({ item }: { item: TimelineItem }) => {
    if (item.itemType === 'water') {
      return (
        <View style={styles.item}>
          <Ionicons name="water" size={20} color="#2e7d32" />
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Watered</Text>
            <Text style={styles.itemDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      );
    } else {
      // Reminder
      return (
        <TouchableOpacity
          style={[
            styles.item,
            item.completed && styles.itemCompleted,
          ]}
          onLongPress={() => {/* Show edit/delete menu */}}
          onPress={() => handleToggleComplete(item.id)}
        >
          <Ionicons
            name={getTypeIcon(item.type)}
            size={20}
            color={item.completed ? '#999' : '#ff9800'}
          />
          <View style={styles.itemContent}>
            <Text
              style={[
                styles.itemTitle,
                item.completed && styles.itemTitleCompleted,
              ]}
            >
              {item.customLabel || item.type}
            </Text>
            <Text style={styles.itemDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          <Ionicons
            name={item.completed ? 'checkmark-circle' : 'radio-button-off'}
            size={20}
            color={item.completed ? '#2e7d32' : '#ccc'}
          />
        </TouchableOpacity>
      );
    }
  };

  if (!plant) return null;

  return (
    <View style={styles.container}>
      {/* FAB */}
      <ReminderFab onPress={() => setShowReminderModal(true)} />

      {/* Timeline */}
      <FlatList
        data={timeline}
        renderItem={renderTimelineItem}
        keyExtractor={(item, index) => `${item.itemType}-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No history yet</Text>
          </View>
        }
      />

      {/* Reminder modal */}
      <ReminderModal
        visible={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        onCreate={handleCreateReminder}
        plantName={plant.nickname || plant.commonName || plant.species}
      />
    </View>
  );
}

function getTypeIcon(type: Reminder['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'fertilize':
      return 'flask';
    case 'repot':
      return 'leaf-outline';
    case 'prune':
      return 'git-branch-outline';
    case 'custom':
      return 'create-outline';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
  },
  itemCompleted: {
    opacity: 0.6,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});
```

**Why this matters:** Unified timeline provides single source of truth for plant care history. Sort by date ensures most recent items appear first. Visual distinction (opacity, strikethrough, icons) makes item types clear at a glance. Tap-to-complete provides immediate feedback without navigating away.

### Pattern 4: Reminder Service for CRUD Operations
**What:** Create dedicated service for reminder business logic
**When to use:** Creating, updating, deleting, toggling completion of reminders
**Example:**
```typescript
// services/reminderService.ts
import * as Notifications from 'expo-notifications';
import { scheduleReminderNotification, cancelReminderNotification } from './notificationService';
import { Reminder, SavedPlant } from '@/types';
import { usePlantsStore } from '@/stores/plantsStore';

export async function createReminder(
  plantId: string,
  type: Reminder['type'],
  date: Date,
  customLabel?: string
): Promise<Reminder> {
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) throw new Error('Plant not found');

  const notificationTime = usePlantsStore.getState().notificationTimePreference;

  // Schedule notification
  const notificationId = await scheduleReminderNotification({
    plantId,
    plantName: plant.nickname || plant.commonName || plant.species,
    reminderType: type,
    customLabel,
    reminderDate: date,
    notificationTime,
  });

  // Create reminder object
  const reminder: Reminder = {
    id: crypto.randomUUID(),
    type,
    customLabel,
    date: date.toISOString(),
    completed: false,
    notificationId,
  };

  // Update plant
  usePlantsStore.getState().updatePlant(plantId, {
    reminders: [...(plant.reminders || []), reminder],
  });

  return reminder;
}

export async function updateReminder(
  plantId: string,
  reminderId: string,
  updates: Partial<Pick<Reminder, 'type' | 'date' | 'customLabel'>>
): Promise<void> {
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) throw new Error('Plant not found');

  const reminder = plant.reminders?.find((r) => r.id === reminderId);
  if (!reminder) throw new Error('Reminder not found');

  // Cancel old notification
  if (reminder.notificationId) {
    await cancelReminderNotification(reminder.notificationId);
  }

  // Schedule new notification
  const notificationTime = usePlantsStore.getState().notificationTimePreference;
  const newNotificationId = await scheduleReminderNotification({
    plantId,
    plantName: plant.nickname || plant.commonName || plant.species,
    reminderType: updates.type || reminder.type,
    customLabel: updates.customLabel || reminder.customLabel,
    reminderDate: updates.date ? new Date(updates.date) : new Date(reminder.date),
    notificationTime,
  });

  // Update reminder
  const updatedReminders = plant.reminders?.map((r) =>
    r.id === reminderId
      ? { ...r, ...updates, notificationId: newNotificationId }
      : r
  );

  usePlantsStore.getState().updatePlant(plantId, { reminders: updatedReminders });
}

export async function deleteReminder(plantId: string, reminderId: string): Promise<void> {
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) throw new Error('Plant not found');

  const reminder = plant.reminders?.find((r) => r.id === reminderId);
  if (!reminder) throw new Error('Reminder not found');

  // Cancel notification
  if (reminder.notificationId) {
    await cancelReminderNotification(reminder.notificationId);
  }

  // Remove reminder from plant
  const updatedReminders = plant.reminders?.filter((r) => r.id !== reminderId);
  usePlantsStore.getState().updatePlant(plantId, { reminders: updatedReminders });
}

export function toggleReminderComplete(plantId: string, reminderId: string): void {
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) throw new Error('Plant not found');

  const updatedReminders = plant.reminders?.map((r) =>
    r.id === reminderId ? { ...r, completed: !r.completed } : r
  );

  usePlantsStore.getState().updatePlant(plantId, { reminders: updatedReminders });
}
```

**Why this matters:** Centralizes reminder business logic separate from UI. Handles notification lifecycle (schedule on create, cancel on delete, reschedule on edit). Ensures data consistency between reminders and scheduled notifications. Uses Zustand store for state management, maintaining React reactivity.

### Anti-Patterns to Avoid
- **Storing reminders separately from plants:** Breaks data consistency — reminders must be plant-scoped for deletion handling
- **Using recurring triggers for one-time reminders:** Confusing UX and harder to cancel — always use CalendarTrigger without repeats
- **Mixing notification IDs across plant/reminder namespaces:** Risk of canceling wrong notification — use distinct ID patterns
- **Not canceling notifications on reminder deletion:** Orphaned notifications continue firing — always cancel before removing from store
- **Using separate screens for edit vs create:** Unnecessary navigation — reuse modal with initial values for edit

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet UI | Custom gesture-based slide-up with PanResponder | **React Native Modal with slide animation** | Built-in, no extra dependency, sufficient for FAB-triggered forms |
| Date picker | Custom calendar/date wheel UI | **@react-native-community/datetimepicker** (if needed) | Native iOS/Android pickers, platform-appropriate UX, handles timezones |
| Timeline list | Manual sorting/grouping logic | **FlatList with useMemo sorting** | React-optimized rendering, handles large lists, built-in scroll perf |
| Icon system | Custom SVG asset files | **@expo/vector-icons Ionicons** | Already in app, consistent styling, tree-shakeable |

**Key insight:** React Native Modal with slide animation provides native-feeling bottom sheet without external dependencies like react-native-bottom-sheet. For date input, if native DateTimePicker is needed, it's a small drop-in addition. Ionicons already cover all reminder type icons needed.

## Common Pitfalls

### Pitfall 1: Reminder Notification Fires at Wrong Time
**What goes wrong:** User sets reminder for March 15 but notification fires March 14 or at wrong hour
**Why it happens:** Timezone confusion when combining date input with notification time from Settings
**How to avoid:**
```typescript
// WRONG: mixing date strings with time strings
const scheduledDate = new Date(`${dateInput}T${timeInput}`);

// CORRECT: use Date methods in local timezone
const scheduledDate = new Date(reminderDate);
scheduledDate.setHours(hour, minute, 0, 0); // Sets time in local timezone
```
**Warning signs:** User reports "reminder came a day early" or "notification at 3 AM instead of 8 AM"

### Pitfall 2: Completed Reminders Still Sending Notifications
**What goes wrong:** User marks reminder as done, but notification still fires on scheduled date
**Why it happens:** Toggling `completed: true` doesn't cancel scheduled notification
**How to avoid:**
```typescript
// In toggleReminderComplete
export function toggleReminderComplete(plantId: string, reminderId: string) {
  const plant = usePlantsStore.getState().getPlant(plantId);
  const reminder = plant?.reminders?.find(r => r.id === reminderId);

  const wasCompleted = reminder?.completed;
  const updatedReminders = plant?.reminders?.map(r =>
    r.id === reminderId ? { ...r, completed: !r.completed } : r
  );

  usePlantsStore.getState().updatePlant(plantId, { reminders: updatedReminders });

  // Cancel notification if marking complete, reschedule if unmarking
  if (!wasCompleted && reminder?.notificationId) {
    cancelReminderNotification(reminder.notificationId);
  }
}
```
**Warning signs:** Users report "getting notifications for things I already did"

### Pitfall 3: Timeline Shows Duplicate Events After Plant Update
**What goes wrong:** Same watering event or reminder appears multiple times in History tab
**Why it happens:** React.memo missing on timeline items, or FlatList keyExtractor not unique
**How to avoid:**
```typescript
// Use unique IDs, not array indices
keyExtractor={(item) => item.itemType === 'water' ? `water-${item.date}` : `reminder-${item.id}`}

// Memoize timeline item component
const TimelineItemMemo = React.memo(TimelineItem, (prev, next) => {
  return prev.item.id === next.item.id && prev.item.completed === next.item.completed;
});
```
**Warning signs:** Scrolling timeline causes jitter, or items duplicate after state updates

### Pitfall 4: Edit/Delete Menu Doesn't Show on Long Press
**What goes wrong:** Long-press on reminder does nothing, or shows wrong menu
**Why it happens:** TouchableOpacity `onLongPress` not wired up, or Menu component not imported
**How to avoid:**
```typescript
// Use Alert.actionSheet for simple menus (no extra dependency)
import { Alert } from 'react-native';

const handleLongPress = (reminder: Reminder) => {
  Alert.alert(
    'Reminder',
    'What would you like to do?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteReminder(plantId, reminder.id) },
      { text: 'Edit', onPress: () => openEditModal(reminder) },
    ]
  );
};
```
**Warning signs:** Long-press does nothing, or no feedback on delete/edit actions

### Pitfall 5: Past Date Reminders Get Scheduled
**What goes wrong:** User creates reminder for yesterday, notification fires immediately or never
**Why it happens:** No validation before scheduling notification
**How to avoid:**
```typescript
// In createReminder, validate date
const reminderDate = new Date(dateInput);
const today = new Date();
today.setHours(0, 0, 0, 0); // Start of today

if (reminderDate < today) {
  Alert.alert('Invalid Date', 'Reminders must be scheduled for today or future dates.');
  return;
}
```
**Warning signs:** Immediate notification after creating reminder, or scheduled notifications that never fire

### Pitfall 6: Orphaned Notifications After Plant Deletion
**What goes wrong:** User deletes plant, but reminders for that plant still fire
**Why it happens:** `removePlant` doesn't cancel reminder notifications
**How to avoid:**
```typescript
// In plantsStore.removePlant
removePlant: async (id) => {
  const plant = get().plants.find(p => p.id === id);

  // Cancel watering notification
  if (plant?.scheduledNotificationId) {
    await cancelPlantNotification(plant.scheduledNotificationId);
  }

  // Cancel all reminder notifications
  if (plant?.reminders) {
    await Promise.all(
      plant.reminders
        .filter(r => r.notificationId)
        .map(r => cancelReminderNotification(r.notificationId!))
    );
  }

  set((state) => ({
    plants: state.plants.filter(p => p.id !== id)
  }));
}
```
**Warning signs:** Notifications reference deleted plants, or notification count exceeds expected

## Code Examples

Verified patterns from official sources:

### Date Picker Integration (if native picker needed)
```typescript
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// In ReminderModal component
const [showDatePicker, setShowDatePicker] = useState(false);

const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
  setShowDatePicker(false);
  if (event.type === 'set' && selectedDate) {
    setSelectedDate(selectedDate);
  }
};

// Render
{showDatePicker && (
  <DateTimePicker
    value={selectedDate}
    mode="date"
    display="default"
    minimumDate={new Date()}
    onChange={handleDateChange}
  />
)}

// Button to trigger
<TouchableOpacity onPress={() => setShowDatePicker(true)}>
  <Text>Select Date</Text>
</TouchableOpacity>
```

### Type-Safe Icon Selection
```typescript
import { Ionicons } from '@expo/vector-icons';

function getReminderIcon(type: Reminder['type']): keyof typeof Ionicons.glyphMap {
  const iconMap = {
    fertilize: 'flask',
    repot: 'leaf-outline',
    prune: 'git-branch-outline',
    custom: 'create-outline',
  } as const;
  return iconMap[type];
}

// Usage
<Ionicons name={getReminderIcon(reminder.type)} size={20} color="#ff9800" />
```

### Long-Press Menu with Alert.actionSheet
```typescript
import { Alert } from 'react-native';

const handleReminderLongPress = (reminder: Reminder) => {
  Alert.alert(
    reminder.customLabel || reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1),
    'What would you like to do?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete Reminder',
            'Are you sure?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteReminder(plant.id, reminder.id),
              },
            ]
          );
        },
      },
      {
        text: 'Edit',
        onPress: () => {
          setSelectedReminder(reminder);
          setShowReminderModal(true);
        },
      },
    ]
  );
};
```

### FAB Component with Positioning
```typescript
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onPress: () => void;
}

export function ReminderFab({ onPress }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.fab}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recurring notifications only | One-time reminders with CalendarTrigger | iOS 10+ / Android 8+ | More flexible, matches real-world care schedules |
| Separate screens for reminders | Unified timeline in History tab | UX trends 2024+ | Single source of truth, better context visibility |
| Custom bottom sheet libraries | React Native Modal with slide animation | Expo SDK 46+ | Fewer dependencies, built-in animations |
| Manual icon assets | @expo/vector-icons Ionicons | Expo 4+ | Consistent styling, smaller bundle size |

**Deprecated/outdated:**
- **react-native-bottom-sheet:** While more feature-rich, adds complexity. For simple FAB-triggered forms, Modal with slide animation is sufficient.
- **Recurring notification patterns:** Overkill for one-time reminders. Use CalendarTrigger without repeats for simpler cancellation logic.
- **Custom icon sets:** Ionicons covers all needed reminder icons (flask, leaf-outline, git-branch-outline, create-outline).

## Open Questions

1. **Native date picker vs custom date input**
   - What we know: Context.md specifies "Native iOS/Android date picker"
   - What's unclear: Should we add @react-native-community/datetimepicker dependency or use a simpler text input?
   - Recommendation: Start with @react-native-community/datetimepicker for native UX. It's well-maintained, platform-appropriate, and only adds ~30KB. If dependency size becomes an issue, fallback to simple date input with validation.

2. **Reminder history retention after completion**
   - What we know: Completed reminders show faded/strikethrough in timeline
   - What's unclear: Should completed reminders be auto-archived or kept indefinitely?
   - Recommendation: Keep indefinitely for now. Timeline doesn't paginate, and reminder count per plant is low (<20). If performance issues arise, add archival (move to separate `completedReminders` array) in v1.3.

3. **Timezone handling for reminder scheduling**
   - What we know: Phase 2 had timezone bugs with watering notifications (resolved)
   - What's unclear: Does combining user-selected date with Settings time introduce new timezone issues?
   - Recommendation: Use same pattern as watering notifications: always set hours/minutes on Date object using local time (not UTC). Test across timezone boundaries before release.

4. **Edit flow — modal pre-population**
   - What we know: Long-press shows Edit/Delete menu
   - What's unclear: Should Edit open same modal with pre-filled values, or a separate edit screen?
   - Recommendation: Reuse ReminderModal with initial values prop. Add `initialReminder?: Reminder` prop to populate form fields. This reduces code duplication and maintains consistent UI.

## Sources

### Primary (HIGH confidence)
- **expo-notifications Documentation (v0.32.16)** - Official Expo SDK 54 docs
  - Verified: CalendarNotificationTrigger for one-time scheduling (year, month, day, hour, minute)
  - Verified: `repeats: false` for non-recurring reminders
  - Verified: Platform-specific differences (Android vs iOS dateComponents format)
  - Verified: `cancelScheduledNotificationAsync` for cleanup
- **React Native Modal Documentation** - Official React Native docs
  - Verified: `animationType="slide"` for bottom sheet behavior
  - Verified: `transparent` prop for backdrop overlay
  - Verified: SafeAreaView integration for notched devices
- **@expo/vector-icons Documentation** - Expo docs
  - Verified: Ionicons set includes flask, leaf-outline, git-branch-outline, create-outline
  - Verified: Tree-shakeable imports reduce bundle size
- **Phase 2 Research** - Project documentation
  - Verified: Notification scheduling patterns from watering reminders apply to custom reminders
  - Verified: Platform-specific trigger logic (DailyNotificationTrigger vs CalendarNotificationTrigger)
  - Verified: Notification ID storage in plant object for cleanup

### Secondary (MEDIUM confidence)
- **Existing codebase analysis** - Phase 2 implementation (notificationService.ts, wateringService.ts)
  - Verified: Current notification patterns work correctly on iOS/Android
  - Verified: plantsStore persist middleware handles AsyncStorage hydration
  - Verified: ProUpgradeModal demonstrates slide-up modal pattern
  - Verified: HistoryTab is placeholder — ready for unified timeline implementation

### Tertiary (LOW confidence)
- **@react-native-community/datetimepicker** - Community docs
  - Not yet verified in project context. If date picker UX proves insufficient with manual input, evaluate this library. Minimum API requirements (iOS 14+, Android API 21+) align with project's target SDK versions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and proven in production
- Architecture: HIGH - Builds on Phase 2 notification patterns, well-understood bottom sheet UI
- Pitfalls: HIGH - Timezone, orphaned notifications, and completed item bugs are well-documented from Phase 2
- Timeline implementation: HIGH - FlatList with mixed data sources is standard React Native pattern
- Date picker approach: MEDIUM - Native DateTimePicker not yet verified in project, but widely-used in ecosystem

**Research date:** 2026-02-25
**Valid until:** 2026-04-25 (60 days - expo-notifications stable, Modal API stable)

**Key assumptions verified:**
- ✅ expo-notifications ~0.32.16 installed (confirmed via npm list)
- ✅ Modal with slide animation provides bottom sheet UX (verified via ProUpgradeModal pattern)
- ✅ Ionicons includes all needed reminder type icons (flask, leaf-outline, git-branch-outline, create-outline)
- ✅ Zustand persist middleware can store reminders array in SavedPlant objects
- ✅ HistoryTab is placeholder — no breaking changes required
- ✅ Platform-specific CalendarTrigger works for one-time scheduling (verified in Phase 2)

**Risks flagged for validation:**
- ⚠️ Timezone handling when combining user date with Settings time — test with devices in different timezones
- ⚠️ Notification delivery on Samsung/Xiaomi devices — Phase 2 flagged battery optimization issues, may affect custom reminders
- ⚠️ Timeline performance with 100+ items — FlatList should handle, but verify on low-end Android
- ⚠️ Date picker UX — if @react-native-community/datetimepicker is added, verify native platform behavior

**Dependencies on Phase 2:**
- ✅ notificationService.ts proven with watering reminders — extend for custom reminders
- ✅ plantsStore with AsyncStorage persist — add reminders array
- ✅ Global notification time preference stored in plantsStore — reuse for reminder scheduling
- ✅ WaterEvent type and waterHistory array — merge with Reminder type in unified timeline

**Integration points:**
- HistoryTab (`components/Detail/HistoryTab.tsx`) - Rewrite from placeholder to unified timeline
- plantsStore (`stores/plantsStore.ts`) - Add reminders array to SavedPlant type
- notificationService.ts - Add scheduleReminderNotification, cancelReminderNotification functions
- types/index.ts - Add Reminder type, extend SavedPlant interface
- Plant detail screen - FAB triggers ReminderModal, notification tap routes to History tab

**Migration notes:**
- No data migration required — reminders array is new field (optional per Phase 4 decision)
- HistoryTab transformation is additive (placeholder → functional, no breaking changes)
- Reminder data stored per-plant — no global reminder table needed

---

*Phase: 06-custom-reminders*
*Research completed: 2026-02-25*
