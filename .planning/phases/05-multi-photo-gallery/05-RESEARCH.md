# Phase 5: Multi-Photo Gallery - Research

**Researched:** 2026-02-25
**Domain:** React Native + Expo mobile app — multi-photo gallery with lightbox
**Project:** Plantid
**Confidence:** HIGH (existing codebase analysis + established Expo patterns + v1.1 architecture research)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Thumbnail Grid Layout
- 3-column grid layout
- Square-cropped thumbnails (Instagram-like)
- Badge indicator (star/dot) on primary photo thumbnail
- Empty state: placeholder with "+" button to add first photo

#### Lightbox Experience
- Swipe left/right gestures to navigate between photos
- Pinch-to-zoom enabled for zooming in
- Visible action bar with Set Primary + Delete icon buttons
- Close button in top-left corner (standard iOS/Android pattern)

#### Add Photo Flow
- Both camera and gallery sources (action sheet to choose)
- Inline "Add photo" button in grid area, always visible
- Single photo per add action (no multi-select)
- New photo automatically becomes primary

#### Primary & Delete UX
- Set primary: lightbox action bar when viewing the desired photo
- Delete: confirmation dialog with "Delete" and "Cancel" buttons
- Delete triggered from lightbox action bar
- Deleting the only photo: allowed with warning that this clears the primary

### Claude's Discretion
- Exact badge style for primary photo indicator
- Transition animations (grid to lightbox, between photos)
- Loading states for image display
- Exact confirmation dialog wording

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GALLERY-01 | Multi-foto galleria per pianta con upload, thumbnail grid, lightbox | Existing expo-image-picker + Modal + FlatList pattern; Image component for display |
| GALLERY-02 | Set foto principale, elimina foto con conferma | plantsStore.updatePlant for primary; Alert.confirm for deletion confirmation |
| GALLERY-03 | Migrazione automatica da singola foto a array multi-foto | Zustand persist migration pattern; one-time data transformation on app load |
</phase_requirements>

## Summary

Phase 5 implements a multi-photo gallery for plants, enabling users to store and view multiple photos per plant. The feature requires:

1. **Data model migration** — Transform `SavedPlant.photo: string` to `photos: PlantPhoto[]` array with automatic migration of existing data
2. **Thumbnail grid component** — 3-column FlatList grid displaying square thumbnails with primary badge
3. **Lightbox viewer** — Full-screen modal with swipe navigation, pinch-to-zoom, and action buttons
4. **Photo management** — Add photo (camera/gallery), set primary, delete with confirmation

**Primary recommendation:** Build a custom lightbox using React Native Modal + ScrollView with paging (for swipe) and built-in Image zoom capabilities. No external lightbox library needed — keeps bundle size small and behavior consistent with existing app patterns.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-image-picker | ^17.0.10 | Camera and gallery photo selection | Already in package.json, used in camera.tsx |
| expo-image-manipulator | ~14.0.8 | Image resize/compression before storage | Already in package.json for photo processing |
| react-native | 0.81.5 | Core components (Modal, ScrollView, FlatList) | Built-in, no additional dependencies |
| react-native-reanimated | ~4.1.1 | Smooth animations for transitions | Already installed for other animations |
| @react-native-async-storage/async-storage | ^2.2.0 | Photo URI persistence via Zustand | Already used by plantsStore |

### Supporting (Consider Adding)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-file-system | ~18.0.0 | Copy photos to app document directory | For persistent URIs that survive gallery deletions |
| expo-action-sheet | ~2.1.0 | Native action sheet for camera/gallery choice | Alternative to custom ActionSheet modal |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Modal lightbox | react-native-lightbox-v2 | External library adds ~50KB, may conflict with existing navigation; custom is simple |
| ScrollView paging | react-native-snap-carousel | Carousel is overkill for simple swipe, adds dependency |
| Built-in Image zoom | react-native-image-zoom-viewer | Adds ~100KB; pinch-to-zoom can be implemented with transform scale |

**Installation:**
```bash
# No new packages required — all dependencies already in package.json
# Optional: install expo-file-system if persistent URI handling needed
npx expo install expo-file-system
```

## Architecture Patterns

### Recommended Project Structure
```
types/
└── index.ts                           # Add PlantPhoto interface, modify SavedPlant

stores/
└── plantsStore.ts                     # Add migration logic, photo CRUD operations

components/
├── Detail/
│   ├── PhotoGallery.tsx               # NEW: 3-column thumbnail grid
│   ├── PhotoLightbox.tsx              # NEW: Full-screen viewer with swipe/zoom
│   └── AddPhotoButton.tsx             # NEW: Triggers camera/gallery picker
├── shared/
│   └── ActionSheet.tsx                # NEW: Reusable action sheet component
```

### Pattern 1: Photo Array as PlantPhoto Objects
**What:** Store photos as array of objects containing URI, metadata, and primary flag.

**When to use:** Multi-photo gallery feature.

**Example:**
```typescript
// types/index.ts
export interface PlantPhoto {
  uri: string;              // File URI (not base64)
  addedDate: string;        // ISO timestamp
  isPrimary: boolean;       // true for main photo
}

export interface SavedPlant {
  // EXISTING FIELDS
  id: string;
  species: string;
  commonName?: string;
  scientificName?: string;
  nickname?: string;
  location?: string;
  photo: string;            // DEPRECATED: Kept for migration, use photos[0].uri
  addedDate: string;
  lastWatered?: string;
  nextWateringDate?: string;
  scheduledNotificationId?: string;
  waterHistory: WaterEvent[];
  notes?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  purchaseOrigin?: string;
  giftFrom?: string;

  // NEW FIELD
  photos?: PlantPhoto[];    // Array of photo objects
}
```

**Why:** Array structure enables ordering, primary photo flag, and per-photo metadata. Storing URIs (not base64) avoids AsyncStorage quota limits.

### Pattern 2: One-Time Data Migration on App Load
**What:** On app launch, check if plants have `photos` array. If not, migrate from `photo` string.

**When to use:** First app launch after multi-photo feature ships.

**Example:**
```typescript
// stores/plantsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Migration function
const migratePhotoToPhotos = (plants: SavedPlant[]): SavedPlant[] => {
  return plants.map(plant => {
    if (plant.photos && plant.photos.length > 0) {
      return plant; // Already migrated
    }
    // Migrate single photo to array
    return {
      ...plant,
      photos: [{
        uri: plant.photo,
        addedDate: plant.addedDate,
        isPrimary: true,
      }],
    };
  });
};

interface PlantsState {
  plants: SavedPlant[];
  // ... other state

  // NEW: Migration flag
  _migrated: boolean;

  // Run migration on hydration
  _runMigration: () => void;
}

export const usePlantsStore = create<PlantsState>()(
  persist(
    (set, get) => ({
      plants: [],
      _migrated: false,

      _runMigration: () => {
        const state = get();
        if (state._migrated) return;

        const migrated = migratePhotoToPhotos(state.plants);
        set({ plants: migrated, _migrated: true });
      },

      // ... other methods
    }),
    {
      name: 'plantid-plants-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Run migration after Zustand rehydrates from AsyncStorage
        state?._runMigration();
      },
    }
  )
);

// Call migration in app entry point (app/_layout.tsx)
useEffect(() => {
  usePlantsStore.getState()._runMigration();
}, []);
```

**Why:** Zustand's `onRehydrateStorage` hook runs after AsyncStorage loads, perfect for one-time migration. Flag prevents re-running on every app launch.

### Pattern 3: Thumbnail Grid with FlatList and numColumns
**What:** Use FlatList with `numColumns={3}` for Instagram-style grid.

**When to use:** Displaying multiple photos in compact grid.

**Example:**
```typescript
// components/Detail/PhotoGallery.tsx
import React from 'react';
import { View, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PhotoGalleryProps {
  photos: PlantPhoto[];
  onPhotoPress: (index: number) => void;
  onAddPress: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_SIZE = (SCREEN_WIDTH - 32) / 3; // 16px horizontal padding
const GAP = 2;

export function PhotoGallery({ photos, onPhotoPress, onAddPress }: PhotoGalleryProps) {
  const renderItem = ({ item, index }: { item: PlantPhoto; index: number }) => (
    <TouchableOpacity
      style={styles.thumbnail}
      onPress={() => onPhotoPress(index)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.uri }} style={styles.image} />
      {item.isPrimary && (
        <View style={styles.primaryBadge}>
          <Ionicons name="star" size={12} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.uri}-${index}`}
        numColumns={3}
        scrollEnabled={false}
        ListFooterComponent={
          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
            <Ionicons name="add" size={32} color="#999" />
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: GAP / 2,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 4,
  },
  addButton: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: GAP / 2,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
});
```

**Why:** FlatList with columns is efficient, handles rendering optimization, and is well-documented.

### Pattern 4: Lightbox with Modal + ScrollView Paging
**What:** Use Modal with ScrollView horizontal paging for swipe navigation.

**When to use:** Full-screen photo viewer.

**Example:**
```typescript
// components/Detail/PhotoLightbox.tsx
import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PhotoLightboxProps {
  visible: boolean;
  photos: PlantPhoto[];
  initialIndex: number;
  onClose: () => void;
  onSetPrimary: (index: number) => void;
  onDelete: (index: number) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function PhotoLightbox({
  visible,
  photos,
  initialIndex,
  onClose,
  onSetPrimary,
  onDelete,
}: PhotoLightboxProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Scroll to initial photo on open
  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      scrollViewRef.current?.scrollTo({
        x: initialIndex * SCREEN_WIDTH,
        animated: false,
      });
    }
  }, [visible, initialIndex]);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const currentPhoto = photos[currentIndex];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>

        {/* Photo pager */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scrollView}
        >
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        {/* Action bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onSetPrimary(currentIndex)}
          >
            <Ionicons
              name={currentPhoto?.isPrimary ? 'star' : 'star-outline'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete(currentIndex)}
          >
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Page indicator */}
        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  photoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  actionBar: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 32,
  },
  actionButton: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

**Why:** ScrollView with `pagingEnabled` provides native-feeling swipe. Modal is built-in. No external libraries needed.

### Anti-Patterns to Avoid
- **Storing photos as base64:** AsyncStorage quota is 6MB total. A few high-res photos will exceed this. Store URIs instead.
- **Using navigation router for lightbox:** Lightbox should be a Modal (same screen), not a new route. Preserves context and animation.
- **Re-rendering entire grid on photo change:** Use FlatList with stable keys. Only re-render affected items.
- **Forgetting to copy files to document directory:** Gallery URIs can become invalid if user deletes from camera roll. Copy to app's document directory for persistence.
- **Setting every new photo as primary:** CONTEXT decision says "New photo automatically becomes primary" — but only on add, not on existing photos.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image cropping/resizing | Manual canvas manipulation | expo-image-manipulator | Handles compression, rotation, resizing across iOS/Android edge cases |
| Action sheet UI | Custom modal with buttons | expo-action-sheet OR Alert.alert() | Native feel, handles iOS/Android differences automatically |
| File persistence | Direct file paths | expo-file-system document directory | Cross-platform path resolution, sandboxing |
| Image loading states | Manual loading boolean | Image component's onLoadStart/onLoad/Error | Built-in callback handling |

**Key insight:** Image manipulation and file handling have platform-specific edge cases (iOS HEIC vs JPEG, Android file URI vs content URI). Expo libraries abstract these — custom implementations will hit bugs.

## Common Pitfalls

### Pitfall 1: AsyncStorage Overflow from Base64 Photos
**What goes wrong:** Developer stores photos as base64 strings. After 10-20 photos, AsyncStorage quota exceeded. App crashes on load, all data unreadable.

**Why it happens:** Base64 encoding increases size by ~33%. A 2MB photo becomes 2.7MB string. AsyncStorage limit is ~6MB total.

**How to avoid:** ALWAYS store URIs, not base64. Use expo-file-system to copy to document directory. Store the resulting URI string.

**Warning signs:** `JSON.stringify` on large data, slow app startup, AsyncStorage warnings in console.

### Pitfall 2: Broken URIs After User Deletes from Gallery
**What goes wrong:** User adds photo from gallery, stores URI. Later deletes photo from device gallery. App shows "image not found" placeholder.

**Why it happens:** expo-image-picker returns a URI pointing to camera roll. If user deletes from camera roll, URI breaks.

**How to avoid:** Copy photo to app's document directory using expo-file-system immediately after selection. Store the persistent URI.

**Warning signs:** Photos disappearing mysteriously, intermittent loading failures.

### Pitfall 3: Migration Runs on Every App Launch
**What goes wrong:** Migration function checks all plants on every app start. Causes slow startup. Duplicates photos if logic is buggy.

**Why it happens:** No migration flag. Or migration doesn't check if `photos` array already exists.

**How to avoid:** Use `_migrated: boolean` flag in Zustand store. Check `if (plant.photos?.length > 0)` before migrating. Only migrate if `photos` is undefined/empty.

**Warning signs:** Slow app launch (stall on splash screen), photos multiplying over time.

### Pitfall 4: Lightbox Index Desync
**What goes wrong:** User swipes to photo 3, taps "Set Primary". Photo 2 gets set as primary instead. Index is off by one.

**Why it happens:** `currentIndex` state not updated on scroll. Or `onMomentumScrollEnd` fires before state settles.

**How to avoid:** Use `onMomentumScrollEnd` (not `onScroll`). Calculate index from `contentOffset.x / SCREEN_WIDTH`. Round to nearest integer.

**Warning signs:** Wrong photo deleted/set as primary, index mismatch in UI.

### Pitfall 5: Deleting Primary Photo Breaks List View
**What goes wrong:** User deletes primary photo. PlantCard in home list shows blank image (was using `plant.photo`).

**Why it happens:** List view still reads deprecated `plant.photo` field. Not updated after deletion.

**How to avoid:** After deleting any photo, ensure another photo is set as primary. Or update PlantCard to read `plant.photos?.find(p => p.isPrimary)?.uri`.

**Warning signs:** Blank thumbnails in list view after photo operations.

## Code Examples

Verified patterns from official sources:

### Add Photo with expo-image-picker
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/image-picker/
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const handleAddPhoto = async () => {
  // Show action sheet (camera vs gallery)
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: false,
    quality: 0.8,
  });

  if (result.canceled) return;

  const originalUri = result.assets[0].uri;

  // Copy to document directory for persistent storage
  const filename = `plant_${plant.id}_${Date.now()}.jpg`;
  const destUri = FileSystem.documentDirectory + filename;

  await FileSystem.copyAsync({
    from: originalUri,
    to: destUri,
  });

  // Add to store as new primary
  const newPhoto: PlantPhoto = {
    uri: destUri,
    addedDate: new Date().toISOString(),
    isPrimary: true,
  };

  // Mark all other photos as non-primary
  const updatedPhotos = [
    ...(plant.photos?.map(p => ({ ...p, isPrimary: false })) || []),
    newPhoto,
  ];

  updatePlant(plant.id, { photos: updatedPhotos });
};
```

### Delete Photo with Confirmation
```typescript
// Source: React Native Alert documentation
import { Alert } from 'react-native';

const handleDeletePhoto = (index: number) => {
  const photo = photos[index];

  if (photos.length === 1 && photo.isPrimary) {
    // Warning: this is the only photo
    Alert.alert(
      'Delete Photo?',
      'This is the only photo for this plant. Deleting it will remove the primary image.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(index),
        },
      ]
    );
    return;
  }

  // Standard confirmation
  Alert.alert(
    'Delete Photo?',
    'This photo will be permanently removed.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => confirmDelete(index),
      },
    ]
  );
};

const confirmDelete = (index: number) => {
  const wasPrimary = photos[index].isPrimary;
  const updatedPhotos = photos.filter((_, i) => i !== index);

  // If we deleted the primary, set first remaining photo as primary
  if (wasPrimary && updatedPhotos.length > 0) {
    updatedPhotos[0].isPrimary = true;
  }

  // Optional: Delete file from document directory
  FileSystem.deleteAsync(photos[index].uri, { idempotent: true });

  updatePlant(plant.id, { photos: updatedPhotos });
};
```

### Set Primary Photo
```typescript
const handleSetPrimary = (index: number) => {
  const updatedPhotos = photos.map((photo, i) => ({
    ...photo,
    isPrimary: i === index,
  }));

  updatePlant(plant.id, { photos: updatedPhotos });

  // Optional: Show toast confirmation
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
```

### Migration in Zustand Store
```typescript
// Source: Zustand persist documentation + project pattern
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MIGRATION_VERSION = 1;

interface PlantsState {
  plants: SavedPlant[];
  _version: number; // Migration version tracking

  migrateToPhotos: () => void;
}

export const usePlantsStore = create<PlantsState>()(
  persist(
    (set, get) => ({
      plants: [],
      _version: MIGRATION_VERSION,

      migrateToPhotos: () => {
        const { plants, _version } = get();
        if (_version >= MIGRATION_VERSION) return;

        const migrated = plants.map(plant => {
          if (plant.photos?.length > 0) return plant; // Already has photos

          return {
            ...plant,
            photos: [{
              uri: plant.photo,
              addedDate: plant.addedDate,
              isPrimary: true,
            }],
          };
        });

        set({ plants: migrated, _version: MIGRATION_VERSION });
      },

      // ... other methods
    }),
    {
      name: 'plantid-plants-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.migrateToPhotos();
      },
    }
  )
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| base64 strings in AsyncStorage | File URIs with expo-file-system | React Native 0.60+ | Enables unlimited photos without quota issues |
| react-native-lightbox library | Custom Modal + ScrollView paging | 2023+ | Reduces bundle size, full control over UX |
| Manual migration scripts | Zustand onRehydrateStorage hook | Zustand v4+ | Clean migration pattern, runs automatically |
| Third-party action sheets | expo-action-sheet or Alert.alert | Expo SDK 50+ | Native feel, iOS/Android consistency |

**Deprecated/outdated:**
- **react-native-image-zoom-viewer:** Last update 2022, consider alternatives (custom pinch-to-zoom with PanGestureHandler)
- **AsyncStorage.multiGet for migration:** Use Zustand's `onRehydrateStorage` instead
- **Storing photos in state (not persisted):** Will lose photos on app restart — always persist via Zustand

## Open Questions

1. **Photo compression strategy**
   - What we know: expo-image-manipulator can resize/compress
   - What's unclear: Target file size limit (currently camera uses 0.85 quality)
   - Recommendation: Compress to max 1024px dimension, 0.7 quality JPEG. Test on device to balance quality vs storage.

2. **Pinch-to-zoom implementation**
   - What we know: react-native-reanimated has gesture handlers
   - What's unclear: Whether to add react-native-gesture-handler dependency or use simple transform scale
   - Recommendation: Start with simple Image component (no zoom). If zoom is critical, add gesture handler in follow-up task.

3. **Max photos per plant limit**
   - What we know: Need to prevent storage bloat
   - What's unclear: What limit to enforce (10? 20? 50?)
   - Recommendation: Start with 20 photos max. Show warning when approaching limit. Pro users could have higher limit.

4. **Photo file cleanup**
   - What we know: Orphaned files accumulate in document directory
   - What's unclear: When to clean up (on delete? on app start?)
   - Recommendation: Delete file immediately when photo removed from array. Use `FileSystem.deleteAsync` with `idempotent: true`.

## Validation Architecture

> Nyquist validation disabled in config.json — skip this section

## Sources

### Primary (HIGH confidence)
- **Codebase analysis:** `/Users/martha2022/Documents/Claude code/Plantid/` — Direct inspection of existing types, stores, camera.tsx, InfoTab.tsx (HIGH confidence)
- **ARCHITECTURE.md research:** `.planning/research/ARCHITECTURE.md` — v1.1 architecture patterns for multi-photo gallery (HIGH confidence)
- **expo-image-picker:** Existing usage in camera.tsx — verified API (launchImageLibraryAsync, quality parameter, assets array) (HIGH confidence)
- **Zustand persist middleware:** Existing usage in plantsStore.ts — verified onRehydrateStorage pattern (HIGH confidence)

### Secondary (MEDIUM confidence)
- **React Native Modal + ScrollView:** Standard React Native components — well-documented patterns for lightbox (MEDIUM confidence)
- **expo-file-system:** Training knowledge + ARCHITECTURE.md reference — documentDirectory operations, file copying (MEDIUM confidence — verify against official docs during implementation)
- **expo-image-manipulator:** Already in package.json — resize/compress operations (MEDIUM confidence — verify current API during implementation)

### Tertiary (LOW confidence)
- **Web search attempted:** API errors prevented verification of latest React Native gallery patterns (LOW confidence — validate with device testing)
- **Third-party lightbox libraries:** Not verified due to search issues — avoid in favor of custom implementation (LOW confidence)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in package.json, verified existing usage
- Architecture: HIGH - Based on existing codebase patterns + v1.1 ARCHITECTURE.md research
- Pitfalls: HIGH - Common AsyncStorage and image handling mistakes well-documented
- Migration pattern: MEDIUM - Zustand onRehydrateStorage is standard, but needs device testing

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (30 days — stable Expo SDK 54, but verify photo picker API changes)
