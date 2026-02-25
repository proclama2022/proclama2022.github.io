# Architecture Research: Enhanced Plant Detail (v1.1)

**Domain:** React Native + Expo mobile app — plant detail screen enhancement
**Project:** Plantid
**Researched:** 2026-02-20
**Confidence:** HIGH (existing codebase analysis + established React Navigation/expo-notifications patterns)

---

## Executive Summary

The v1.1 enhanced plant detail screen introduces four major features that integrate cleanly with the existing Zustand-based state architecture:

1. **Tabbed layout** — Material-top-tabs navigator with 4 tabs (Info, Care, History, Notes)
2. **Multi-photo gallery** — Photo array stored in SavedPlant, gallery viewer component
3. **Extended care data** — Enriched PlantCareInfo type with seasonal temps, fertilization, pruning, pests
4. **Custom reminders** — New reminder type with notification scheduling service extension

**Key architectural insight:** All features are **additive extensions** to existing patterns. No breaking changes to existing stores or services. The architecture remains strictly layered with clear boundaries.

---

## System Overview: Enhanced Detail Screen Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER: app/plant/[id].tsx (Tabbed Detail)        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │   Info   │ │   Care   │ │ History  │ │  Notes   │          │
│  │   Tab    │ │   Tab    │ │   Tab    │ │   Tab    │          │
│  └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘          │
└────────┼────────────┼────────────┼────────────┼─────────────────┘
         │            │            │            │
         │            │            │            │
┌────────▼────────────▼────────────▼────────────▼─────────────────┐
│  COMPONENT LAYER: Feature-specific components                   │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ PhotoGallery     │  │ ReminderList     │                   │
│  │ + Lightbox       │  │ + ReminderForm   │                   │
│  └──────────────────┘  └──────────────────┘                   │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ ExtendedCareInfo │  │ AdvancedNotes    │                   │
│  │ (enriched)       │  │ (markdown)       │                   │
│  └──────────────────┘  └──────────────────┘                   │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│  STATE LAYER: Zustand Stores (persisted to AsyncStorage)       │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ plantsStore (ENHANCED)                               │     │
│  │  - photos: string[] (new)                            │     │
│  │  - customReminders: CustomReminder[] (new)           │     │
│  │  - notes: string (enriched for markdown)             │     │
│  │  - metadata: PlantMetadata (new)                     │     │
│  └──────────────────────────────────────────────────────┘     │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ settingsStore (UNCHANGED)                             │     │
│  └──────────────────────────────────────────────────────┘     │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│  SERVICES LAYER: Business logic & external integration         │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ notificationService (EXTENDED)                               │
│  │  - scheduleCustomReminder() + cancelCustomReminder()       │
│  └──────────────────┘  └──────────────────┘                   │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ careDB.ts (ENHANCED)  │ reminderService.ts (NEW)            │
│  │  - Extended care data  │  - Reminder CRUD logic             │
│  └──────────────────┘  └──────────────────┘                   │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│  PERSISTENCE LAYER: AsyncStorage + expo-notifications          │
│  - plantid-plants-storage (Zustand persist middleware)         │
│  - expo-notifications scheduled notification IDs               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries & Integration Points

### New Components

| Component | Responsibility | Communicates With | Integration Point |
|-----------|---------------|-------------------|-------------------|
| **PlantDetailTabs** | Tab navigator wrapper (Material Top Tabs) | Individual tab screens | `app/plant/[id].tsx` root |
| **InfoTab** | Species names, photos, basic metadata | plantsStore | Tab screen 1 |
| **CareTab** | Extended care info (fertilization, pruning, pests) | careDB service | Tab screen 2 |
| **HistoryTab** | Watering history + custom reminder timeline | plantsStore, reminderService | Tab screen 3 |
| **NotesTab** | Advanced markdown notes + custom metadata | plantsStore | Tab screen 4 |
| **PhotoGallery** | Horizontal scrollable photo thumbnails | plantsStore (photos array) | Within InfoTab |
| **PhotoLightbox** | Full-screen image viewer with zoom | PhotoGallery | Modal from gallery tap |
| **ExtendedCareInfo** | Enriched CareInfo component | careDB (extended data) | Within CareTab |
| **ReminderList** | Display custom reminders for this plant | reminderService, plantsStore | Within HistoryTab |
| **ReminderForm** | Add/edit custom reminder modal | reminderService, notificationService | Within HistoryTab |

### Modified Components

| Component | Changes | Breaking? |
|-----------|---------|-----------|
| `plantsStore.ts` | Add `photos: string[]`, `customReminders: CustomReminder[]`, `metadata: PlantMetadata` to SavedPlant type | **NO** — backward compatible (new fields optional) |
| `notificationService.ts` | Add `scheduleCustomReminder()`, `cancelCustomReminder()` | **NO** — additive functions |
| `careDB.ts` | Add optional fields to PlantCareInfo (fertilization, pruning, pests) | **NO** — optional fields, fallback to null |
| `app/plant/[id].tsx` | Wrap existing content in tab navigator | **NO** — existing components moved to tabs |

### Unchanged Components

- `settingsStore.ts` — No changes needed
- `proStore.ts` — No changes needed
- `wateringService.ts` — No changes needed
- `plantnet.ts` — No changes needed
- `cache.ts` — No changes needed
- `rateLimiter.ts` — No changes needed

---

## Data Flow

### Flow 1: Add Photo to Plant

```
User taps "Add Photo" (in PhotoGallery)
  → Open image picker (expo-image-picker)
  → User selects photo
  → Returns imageUri (string)
  → Call plantsStore.updatePlant(plantId, {
       photos: [...existingPhotos, imageUri]
     })
  → Zustand persist middleware writes to AsyncStorage
  → PhotoGallery re-renders with new photo
```

**Key considerations:**
- Photos stored as URI strings (not base64) to avoid AsyncStorage quota limits
- No automatic upload to cloud — fully offline-first
- Consider photo count limit (e.g., 20 photos max) to prevent storage bloat

### Flow 2: Create Custom Reminder

```
User taps "Add Reminder" (in HistoryTab)
  → Open ReminderForm modal
  → User selects:
     - Reminder type: 'repotting' | 'fertilizing' | 'inspection' | 'custom'
     - Date: ISO date string
     - Notes: optional string
  → Call reminderService.createReminder({
       plantId,
       type,
       scheduledDate,
       notes
     })
  → reminderService calls:
     1. plantsStore.updatePlant(plantId, {
          customReminders: [...existingReminders, newReminder]
        })
     2. notificationService.scheduleCustomReminder(
          plantId,
          reminderId,
          reminderType,
          scheduledDate
        )
  → notificationService calls:
     expo-notifications.scheduleNotificationAsync()
  → Returns notificationId
  → reminderService stores notificationId in reminder object
  → ReminderList re-renders with new reminder
```

**Key considerations:**
- Reminder notification IDs must be persisted to allow cancellation
- Unlike watering notifications, custom reminders are one-time (non-repeating)
- User can mark reminder as "completed" without triggering the notification action

### Flow 3: Display Extended Care Info

```
User opens CareTab
  → CareTab reads plant.scientificName
  → Calls getExtendedCareInfo(scientificName) [careDB.ts]
  → Returns ExtendedPlantCareInfo | null
  → ExtendedCareInfo component renders:
     - Existing: water, sunlight, temp, soil, humidity, difficulty, toxic, tips
     - NEW: seasonal temps, fertilization schedule, pruning guide, pests
  → Falls back to "Extended care info coming soon" if null
```

**Key considerations:**
- Extended care data is read-only static JSON (like existing careDB)
- Lazy load optional sections to avoid clutter for common plants
- i18n strings needed for new fields (fertilization, pruning, pests)

### Flow 4: Tab Navigation & State Preservation

```
User swipes from InfoTab to CareTab
  → MaterialTopTabs navigator handles swipe gesture
  → InfoTab remains mounted (default: all tabs mounted)
  → CareTab becomes focused
  → Local state within InfoTab is preserved (no remount)
  → Scroll position preserved per tab
```

**Key considerations:**
- MaterialTopTabs mounts all screens by default (smooth swipe)
- For complex tabs (like History with lists), consider `lazy` prop if performance issues
- Use `initialLayout` prop to prevent layout jitter on first render

---

## Architectural Patterns

### Pattern 1: Tab Navigator with Shared Context

**What:** Wrap existing detail screen content in a MaterialTopTabs navigator. Pass plant object as screen params or via context.

**When:** Detail screen has multiple logical sections that benefit from separate scrollable areas.

**Trade-offs:**
- ✅ Clean separation of concerns (info vs care vs history vs notes)
- ✅ Each tab has own scroll position (user doesn't lose place when switching)
- ✅ Swipe gesture feels natural on mobile
- ⚠️ All tabs mounted by default (memory overhead — acceptable for 4 simple tabs)
- ⚠️ Less visible content at once (user must tap to see everything)

**Example:**
```typescript
// app/plant/[id].tsx
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { usePlantsStore } from '@/stores/plantsStore';

const Tab = createMaterialTopTabNavigator();

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plant = usePlantsStore((s) => s.getPlant(id ?? ''));

  if (!plant) return <PlantNotFound />;

  return (
    <Tab.Navigator
      initialLayout={{ width: Dimensions.get('window').width }}
      screenOptions={{
        tabBarActiveTintColor: '#2e7d32',
        tabBarIndicatorStyle: { backgroundColor: '#2e7d32' },
      }}
    >
      <Tab.Screen name="Info">
        {() => <InfoTab plant={plant} />}
      </Tab.Screen>
      <Tab.Screen name="Care">
        {() => <CareTab scientificName={plant.scientificName} />}
      </Tab.Screen>
      <Tab.Screen name="History">
        {() => <HistoryTab plant={plant} />}
      </Tab.Screen>
      <Tab.Screen name="Notes">
        {() => <NotesTab plant={plant} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
```

### Pattern 2: Photo Array as URIs, Not Base64

**What:** Store photo array as `string[]` of file URIs (e.g., `file:///var/mobile/.../photo001.jpg`). Do NOT store base64-encoded strings.

**When:** Multi-photo gallery feature.

**Trade-offs:**
- ✅ AsyncStorage quota respected (URIs are small strings)
- ✅ Fast read/write (no base64 encoding/decoding overhead)
- ⚠️ Photo files must be copied to app's document directory (via expo-file-system)
- ⚠️ If user deletes photos from gallery, URIs break (acceptable — show placeholder)

**Example:**
```typescript
// When user adds photo from gallery
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: 'images',
  allowsEditing: true,
  quality: 0.8,
});

if (!result.canceled && result.assets[0]) {
  const originalUri = result.assets[0].uri;

  // Copy to app's document directory for persistent storage
  const fileName = `plant_${plant.id}_${Date.now()}.jpg`;
  const destUri = FileSystem.documentDirectory + fileName;

  await FileSystem.copyAsync({
    from: originalUri,
    to: destUri,
  });

  // Store the persistent URI
  updatePlant(plant.id, {
    photos: [...(plant.photos || []), destUri],
  });
}
```

### Pattern 3: Custom Reminders as Separate Notification Type

**What:** Custom reminders use `expo-notifications` with one-time triggers (not repeating). Each reminder has its own notification ID persisted alongside the reminder object.

**When:** User wants reminders beyond watering (repotting, fertilizing, inspection).

**Trade-offs:**
- ✅ Reuses existing notification infrastructure
- ✅ Per-plant reminder tracking (no global reminder list needed)
- ⚠️ Must track notification IDs for cancellation (added to reminder object)
- ⚠️ Platform limit: iOS/Android allow ~64 scheduled notifications max

**Example:**
```typescript
// services/notificationService.ts (extended)

export interface CustomReminderNotification {
  plantId: string;
  reminderId: string;
  reminderType: 'repotting' | 'fertilizing' | 'inspection' | 'custom';
  scheduledDate: Date;
}

export async function scheduleCustomReminder(
  plantId: string,
  reminderId: string,
  reminderType: CustomReminderNotification['reminderType'],
  scheduledDate: Date
): Promise<string> {
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) throw new Error('Plant not found');

  const plantName = plant.nickname || plant.commonName || plant.species;

  const content: Notifications.NotificationContentInput = {
    title: getReminderTitle(reminderType),
    body: `${plantName}: ${getReminderBody(reminderType)}`,
    sound: 'default',
    data: { plantId, reminderId, reminderType },
  };

  const trigger: Notifications.NotificationTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: scheduledDate,
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content,
    trigger,
  });

  return notificationId;
}

export async function cancelCustomReminder(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

function getReminderTitle(type: CustomReminderNotification['reminderType']): string {
  const titles = {
    repotting: 'Repotting Reminder',
    fertilizing: 'Fertilizing Reminder',
    inspection: 'Plant Check-up',
    custom: 'Plant Reminder',
  };
  return titles[type];
}
```

### Pattern 4: Extended Care Data as Optional Fields

**What:** Add optional fields to `PlantCareInfo` type. Existing care data continues to work. Plants without extended data show fallback UI.

**When:** Incrementally enriching care database without breaking existing plants.

**Trade-offs:**
- ✅ Backward compatible (old care entries still work)
- ✅ Progressive enhancement (add extended data over time)
- ⚠️ UI must check for null/undefined on all new fields

**Example:**
```typescript
// types/index.ts (extended)

export interface PlantCareInfo {
  // EXISTING FIELDS (unchanged)
  id: string;
  commonName: string;
  scientificName: string;
  waterFrequencyDays: number;
  sunlight: 'full-sun' | 'partial-sun' | 'shade' | 'low-light';
  tempMin: number;
  tempMax: number;
  soil?: string;
  humidity?: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  toxicPets: boolean;
  tips: { it: string; en: string };
  aliases?: string[];

  // NEW EXTENDED FIELDS (all optional)
  seasonalTemps?: {
    spring: { min: number; max: number };
    summer: { min: number; max: number };
    fall: { min: number; max: number };
    winter: { min: number; max: number };
  };
  fertilization?: {
    frequency: string; // e.g., "Every 4 weeks in growing season"
    type: string; // e.g., "Balanced liquid fertilizer (10-10-10)"
    timing: string; // e.g., "Spring and summer, monthly"
  };
  pruning?: {
    frequency: string; // e.g., "Annually in spring"
    technique: string; // e.g., "Remove dead or yellowing leaves at base"
    tools?: string; // e.g., "Clean, sharp pruning shears"
  };
  pests?: {
    common: string[]; // e.g., ["Spider mites", "Mealybugs"]
    symptoms: string; // e.g., "Webbing on leaves, sticky residue"
    treatment: string; // e.g., "Wipe leaves with soapy water, neem oil spray"
  };
}
```

### Pattern 5: Service Extension for Reminder CRUD

**What:** Create `services/reminderService.ts` to handle reminder business logic. It coordinates between plantsStore and notificationService.

**When:** Custom reminders feature.

**Trade-offs:**
- ✅ Separates reminder logic from UI (testable, reusable)
- ✅ Single source of truth for reminder operations
- ⚠️ Additional layer of indirection (acceptable for clarity)

**Example:**
```typescript
// services/reminderService.ts (new)

import { CustomReminder } from '@/types';
import { scheduleCustomReminder, cancelCustomReminder } from './notificationService';
import { usePlantsStore } from '@/stores/plantsStore';

export async function createReminder(
  plantId: string,
  reminder: Omit<CustomReminder, 'id' | 'notificationId'>
): Promise<CustomReminder> {
  const reminderId = `reminder_${Date.now()}`;

  // Schedule notification
  const notificationId = await scheduleCustomReminder(
    plantId,
    reminderId,
    reminder.type,
    new Date(reminder.scheduledDate)
  );

  // Create reminder with ID
  const newReminder: CustomReminder = {
    ...reminder,
    id: reminderId,
    notificationId,
  };

  // Update plant store
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) throw new Error('Plant not found');

  usePlantsStore.getState().updatePlant(plantId, {
    customReminders: [...(plant.customReminders || []), newReminder],
  });

  return newReminder;
}

export async function completeReminder(
  plantId: string,
  reminderId: string
): Promise<void> {
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) throw new Error('Plant not found');

  const reminder = plant.customReminders?.find((r) => r.id === reminderId);
  if (!reminder) throw new Error('Reminder not found');

  // Cancel notification if still scheduled
  if (reminder.notificationId && !reminder.completed) {
    await cancelCustomReminder(reminder.notificationId);
  }

  // Mark as completed
  usePlantsStore.getState().updatePlant(plantId, {
    customReminders: plant.customReminders?.map((r) =>
      r.id === reminderId ? { ...r, completed: true, completedAt: new Date().toISOString() } : r
    ) || [],
  });
}

export async function deleteReminder(
  plantId: string,
  reminderId: string
): Promise<void> {
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) throw new Error('Plant not found');

  const reminder = plant.customReminders?.find((r) => r.id === reminderId);
  if (!reminder) throw new Error('Reminder not found');

  // Cancel notification
  if (reminder.notificationId) {
    await cancelCustomReminder(reminder.notificationId);
  }

  // Remove from plant
  usePlantsStore.getState().updatePlant(plantId, {
    customReminders: plant.customReminders?.filter((r) => r.id !== reminderId) || [],
  });
}
```

---

## Recommended Project Structure

```
app/
├── plant/
│   └── [id].tsx                    ← Root: Tab navigator wrapper
├── (tabs)/
│   └── ...                        ← Unchanged

components/
├── Detail/
│   ├── PlantDetailTabs.tsx        ← NEW: Tab navigator wrapper
│   ├── InfoTab.tsx                ← NEW: Species info + photo gallery
│   ├── CareTab.tsx                ← NEW: Extended care info
│   ├── HistoryTab.tsx             ← NEW: Watering + reminders timeline
│   ├── NotesTab.tsx               ← NEW: Advanced notes + metadata
│   ├── CareInfo.tsx               ← MODIFY: Use extended care data
│   ├── WateringHistory.tsx        ← MODIFY: Move to HistoryTab
│   ├── MarkWateredButton.tsx      ← MODIFY: Move to HistoryTab
│   ├── ComplianceBar.tsx          ← MODIFY: Move to HistoryTab
│   ├── PhotoGallery.tsx           ← NEW: Horizontal photo thumbnails
│   ├── PhotoLightbox.tsx          ← NEW: Full-screen image viewer
│   ├── ReminderList.tsx           ← NEW: Custom reminders list
│   ├── ReminderForm.tsx           ← NEW: Add/edit reminder modal
│   └── AdvancedNotes.tsx          ← NEW: Markdown notes editor

stores/
├── plantsStore.ts                 ← MODIFY: Add photos, customReminders, metadata
├── settingsStore.ts               ← Unchanged
└── proStore.ts                    ← Unchanged

services/
├── notificationService.ts         ← MODIFY: Add custom reminder scheduling
├── reminderService.ts             ← NEW: Reminder CRUD business logic
├── careDB.ts                      ← MODIFY: Add extended care fields
├── plantnet.ts                    ← Unchanged
├── cache.ts                       ← Unchanged
├── rateLimiter.ts                 ← Unchanged
├── purchaseService.ts             ← Unchanged
└── wateringService.ts             ← Unchanged

types/
└── index.ts                       ← MODIFY: Add CustomReminder, PlantMetadata, extend PlantCareInfo
```

**Structure rationale:**
- `components/Detail/` groups all detail-related components
- New components avoid modifying old ones (except where extension is cleaner)
- Services layer separation maintained (reminder service for business logic, notification service for platform integration)

---

## Type Extensions

### New Types

```typescript
// types/index.ts (additions)

// Photo gallery
export interface PlantPhoto {
  uri: string;
  addedDate: string; // ISO timestamp
  notes?: string;
}

// Custom reminders
export type ReminderType = 'repotting' | 'fertilizing' | 'inspection' | 'custom';

export interface CustomReminder {
  id: string;
  plantId: string;
  type: ReminderType;
  scheduledDate: string; // ISO date
  notes?: string;
  notificationId?: string; // From expo-notifications
  completed: boolean;
  completedAt?: string; // ISO timestamp
}

// Plant metadata (optional user-provided)
export interface PlantMetadata {
  purchaseDate?: string; // ISO date
  purchasePrice?: number;
  origin?: string; // e.g., "Gift from Jane", "Local nursery"
  isGift: boolean;
  giftFrom?: string;
}

// Extended SavedPlant (backward compatible)
export interface SavedPlant {
  // EXISTING FIELDS
  id: string;
  species: string;
  commonName?: string;
  scientificName?: string;
  nickname?: string;
  location?: string;
  photo: string; // Primary photo (for list view)
  addedDate: string;
  lastWatered?: string;
  nextWateringDate?: string;
  scheduledNotificationId?: string;
  waterHistory: WaterEvent[];
  notes?: string;

  // NEW FIELDS (all optional)
  photos?: PlantPhoto[]; // Additional photos
  customReminders?: CustomReminder[]; // Custom reminders
  metadata?: PlantMetadata; // User-provided metadata
}
```

---

## Scaling Considerations

| Concern | At 50 plants | At 200 plants | At 500+ plants |
|---------|--------------|---------------|----------------|
| **Photo storage** | ~50MB (assuming 1MB/photo, 1 photo/plant) | ~200MB (4 photos/plant avg) | Consider photo count limit, compression |
| **Reminder notifications** | ~50 scheduled (well under 64 limit) | May hit 64 platform limit | Implement priority queuing (soonest reminders first) |
| **AsyncStorage size** | ~500KB (plant data + metadata) | ~2MB (acceptable) | Monitor; implement cleanup if needed |
| **Tab performance** | Fast (4 tabs, all mounted) | Fast (same) | Consider `lazy` prop if tabs become complex |
| **CareDB size** | ~100KB (100 species × extended data) | ~500KB (500 species) | Still fine — static JSON is efficient |

**Bottlenecks in order of likelihood:**
1. **Photo storage quota** — First limit users will hit. Mitigation: Limit photos per plant (e.g., 20), compress images on save.
2. **Notification platform limit** — iOS/Android limit ~64 scheduled notifications. Mitigation: Prioritize reminders, show warning if exceeded.
3. **AsyncStorage quota** — Unlikely to hit with text data. Only problematic if storing many large photos as base64 (we're not).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Photos as Base64 in SavedPlant

**What people do:** Save photos as `data:image/jpeg;base64,...` strings in AsyncStorage.

**Why it's wrong:** AsyncStorage has a 5-10MB quota total. A few high-res photos (2-3MB each) exceed this. All data becomes unreadable.

**Do this instead:** Store file URIs. Copy photos to app's document directory with expo-file-system. Store the path string only.

### Anti-Pattern 2: Scheduling Reminders Without Persisting Notification IDs

**What people do:** Call `scheduleNotificationAsync()` and discard the returned ID.

**Why it's wrong:** Cannot cancel the reminder when user marks it complete or deletes it. Orphaned notifications accumulate.

**Do this instead:** Add `notificationId` field to CustomReminder type. Persist it. Pass to `cancelScheduledNotificationAsync()` on completion/deletion.

### Anti-Pattern 3: Making CareTab Complex with Conditional Rendering

**What people do:** Single CareTab component with 20+ `if (care.extendedField)` checks scattered throughout.

**Why it's wrong:** Unmaintainable. Hard to test. UI becomes cluttered.

**Do this instead:** Separate components for extended sections (`FertilizationSection`, `PruningSection`, `PestsSection`). Render only if data exists. Each section is self-contained.

### Anti-Pattern 4: Using Navigation for Tabs Instead of MaterialTopTabs

**What people do:** Create separate routes for `app/plant/[id]/info`, `app/plant/[id]/care`, etc.

**Why it's wrong:** Loses swipe gesture. Each tab remounts on navigation (loses scroll position). Requires router configuration.

**Do this instead:** Use MaterialTopTabs. All tabs stay mounted. Native-feeling swipe. Screen params accessible to all tabs.

### Anti-Pattern 5: Global Reminder Store Instead of Per-Plant

**What people do:** Create `remindersStore` with all reminders across all plants.

**Why it's wrong:** Adds store complexity. Reminders are naturally scoped to plants. Querying becomes harder.

**Do this instead:** Store reminders within `SavedPlant.customReminders`. Reminder service filters by plantId. Keeps data locality clear.

---

## Build Order (Considering Dependencies)

The features have interdependencies that dictate build order:

### Phase 1: Foundation (Types + Store Extension)

**Rationale:** Types must be defined first. Store changes enable all other features.

1. **Extend types/index.ts**
   - Add `PlantPhoto`, `CustomReminder`, `PlantMetadata`
   - Extend `SavedPlant` with new optional fields
   - Extend `PlantCareInfo` with optional extended fields

2. **Extend plantsStore.ts**
   - Add new fields to SavedPlant interface (already covered by types)
   - Verify Zustand persist middleware handles new fields automatically
   - Test: Create plant with new fields, reload app, verify persistence

**Confidence:** HIGH — Zero risk, pure additive changes.

---

### Phase 2: Tab Layout (UI Skeleton)

**Rationale:** Tab structure is independent of extended features. Once tabs work, fill them incrementally.

3. **Install dependencies**
   ```bash
   npx expo install react-native-pager-view
   npm install @react-navigation/material-top-tabs
   ```

4. **Create PlantDetailTabs wrapper**
   - `components/Detail/PlantDetailTabs.tsx`
   - Basic tab navigator with 4 empty placeholder screens

5. **Refactor app/plant/[id].tsx**
   - Wrap existing content in PlantDetailTabs
   - Move existing content to InfoTab temporarily
   - Verify navigation still works

6. **Create tab screen stubs**
   - `components/Detail/InfoTab.tsx` (placeholder)
   - `components/Detail/CareTab.tsx` (placeholder)
   - `components/Detail/HistoryTab.tsx` (placeholder)
   - `components/Detail/NotesTab.tsx` (placeholder)

**Confidence:** HIGH — Standard React Navigation pattern. Low risk.

---

### Phase 3: Multi-Photo Gallery (Independent Feature)

**Rationale:** Photo gallery is self-contained. Doesn't depend on other new features.

7. **Create PhotoGallery component**
   - `components/Detail/PhotoGallery.tsx`
   - Horizontal FlatList with photo thumbnails
   - "Add photo" button triggers expo-image-picker
   - Use expo-file-system to copy to document directory

8. **Create PhotoLightbox component**
   - `components/Detail/PhotoLightbox.tsx`
   - Modal with full-screen image
   - Pinch-to-zoom (consider react-native-image-zoom-viewer)
   - Swipe left/right between photos

9. **Integrate with InfoTab**
   - Replace single photo view with PhotoGallery
   - Keep existing primary photo for list view compatibility

**Confidence:** MEDIUM — Image picker and file system operations require testing on device (simulator may behave differently).

---

### Phase 4: Extended Care Data (Read-Only Feature)

**Rationale:** Extended care data is read-only. Safe to add without breaking anything.

10. **Extend careDB.ts**
    - Add optional fields to PlantCareInfo entries
    - Start with 10-20 common species enriched
    - Others fallback gracefully (existing behavior)

11. **Create extended care sections**
    - `components/Detail/SeasonalTempsSection.tsx`
    - `components/Detail/FertilizationSection.tsx`
    - `components/Detail/PruningSection.tsx`
    - `components/Detail/PestsSection.tsx`

12. **Modify CareInfo component**
    - Accept extended PlantCareInfo type
    - Render new sections if data exists
    - Maintain backward compatibility (null checks)

13. **Integrate with CareTab**
    - Move existing CareInfo to CareTab
    - Display extended sections below basic care info

**Confidence:** HIGH — Pure additive, read-only. No state changes.

---

### Phase 5: Custom Reminders (Most Complex Feature)

**Rationale:** Reminders require service layer coordination (reminderService + notificationService). Build after simpler features.

14. **Extend notificationService.ts**
    - Add `scheduleCustomReminder()`
    - Add `cancelCustomReminder()`
    - Reuse existing notification ID persistence pattern

15. **Create reminderService.ts**
    - `createReminder()`
    - `completeReminder()`
    - `deleteReminder()`
    - Coordinate between plantsStore and notificationService

16. **Create ReminderList component**
    - `components/Detail/ReminderList.tsx`
    - Display pending and completed reminders
    - Sort by scheduled date
    - Complete/delete actions

17. **Create ReminderForm component**
    - `components/Detail/ReminderForm.tsx`
    - Modal with type picker, date picker, notes field
    - Form validation (required fields)
    - Calls reminderService.createReminder()

18. **Integrate with HistoryTab**
    - Move existing WateringHistory to HistoryTab
    - Add ReminderList below watering history
    - Add "Add Reminder" FAB or button

**Confidence:** MEDIUM — Notification scheduling requires device testing. Platform differences (iOS vs Android) in notification behavior.

---

### Phase 6: Advanced Notes + Metadata (Low-Priority Polish)

**Rationale:** Notes enhancement is pure UI. Metadata is optional. Can defer if needed.

19. **Create AdvancedNotes component**
    - `components/Detail/AdvancedNotes.tsx`
    - Rich text or markdown support (consider react-native-markdown-package)
    - Larger text area
    - Character count

20. **Create PlantMetadataForm component**
    - `components/Detail/PlantMetadataForm.tsx`
    - Fields: purchase date, price, origin, gift info
    - Optional modal in InfoTab

21. **Integrate with NotesTab**
    - Move existing notes field to NotesTab
    - Add metadata form link from InfoTab

**Confidence:** HIGH — Simple forms. Low risk.

---

## Integration Points Summary

### With Existing Stores

| Store | Integration | Changes |
|-------|-------------|---------|
| **plantsStore** | Photos, reminders, metadata stored in SavedPlant object | Add 3 new optional fields (backward compatible) |
| **settingsStore** | No changes needed | — |
| **proStore** | No changes needed | — |

### With Existing Services

| Service | Integration | Changes |
|---------|-------------|---------|
| **notificationService** | Schedule custom reminders (additive functions) | Add 2 new functions |
| **wateringService** | No changes needed | — |
| **plantnet** | No changes needed | — |
| **cache** | No changes needed | — |
| **rateLimiter** | No changes needed | — |
| **purchaseService** | No changes needed | — |

### New Services to Create

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| **reminderService** | Reminder CRUD business logic | plantsStore, notificationService |

---

## Sources

- **Codebase analysis:** `/Users/martha2022/Documents/Claude code/Plantid/` — Direct inspection of existing stores, services, types (HIGH confidence)
- **React Navigation Material Top Tabs:** [Official documentation](https://reactnavigation.org/docs/material-top-tab-navigator/) — Verified API for tab navigator, props, lazy loading (HIGH confidence)
- **expo-notifications:** Training knowledge + existing notificationService.ts pattern — Notification scheduling, ID persistence, platform limits (MEDIUM confidence — verify against https://docs.expo.dev/versions/latest/sdk/notifications/ during implementation)
- **expo-file-system:** Training knowledge — Document directory operations, file copying (MEDIUM confidence)
- **expo-image-picker:** Web search results (Feb 2025) — Image selection, URI handling, platform differences (MEDIUM confidence)
- **Multi-photo storage patterns:** Web search results (Feb 2025) — URI vs base64, AsyncStorage limits, gallery implementation (LOW-MEDIUM confidence — validate with device testing)

---

*Architecture research for: Plantid v1.1 Enhanced Plant Detail*
*Researched: 2026-02-20*
