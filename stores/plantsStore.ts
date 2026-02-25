import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedPlant, PlantPhoto } from '@/types';
import { cancelPlantNotification, cancelAllPlantNotifications } from '@/services/notificationService';
import { useProStore } from '@/stores/proStore';

const MAX_PLANTS_FREE = 10;
const MIGRATION_VERSION = 1;

interface PlantsState {
  plants: SavedPlant[];
  notificationTimePreference: string;
  _version: number;
  setNotificationTimePreference: (time: string) => void;
  addPlant: (plant: SavedPlant) => boolean;
  removePlant: (id: string) => Promise<void>;
  getPlant: (id: string) => SavedPlant | undefined;
  updatePlant: (id: string, updates: Partial<SavedPlant>) => void;
  cancelAllNotifications: () => Promise<void>;
  migrateToPhotos: () => void;
}

export const usePlantsStore = create<PlantsState>()(
  persist(
    (set, get) => ({
      plants: [],
      notificationTimePreference: '08:00',
      _version: MIGRATION_VERSION,
      setNotificationTimePreference: (time) => set({ notificationTimePreference: time }),
      /**
       * Add plant to collection. Returns false if free user has reached limit (10 plants).
       * Pro users have unlimited collection size.
       */
      addPlant: (plant) => {
        const { isPro } = useProStore.getState();
        const plants = get().plants;
        if (!isPro && plants.length >= MAX_PLANTS_FREE) {
          return false; // Collection full
        }
        set((state) => ({
          plants: [{ ...plant, id: plant.id || crypto.randomUUID() }, ...state.plants]
        }));
        return true; // Success
      },
      removePlant: async (id) => {
        const plant = get().plants.find(p => p.id === id);

        // Cancel watering notification
        if (plant?.scheduledNotificationId) {
          await cancelPlantNotification(plant.scheduledNotificationId);
        }

        // NEW: Cancel all reminder notifications
        if (plant?.reminders) {
          const { cancelReminderNotification } = await import('@/services/notificationService');
          await Promise.all(
            plant.reminders
              .filter(r => r.notificationId)
              .map(r => cancelReminderNotification(r.notificationId!))
          );
        }

        set((state) => ({
          plants: state.plants.filter(p => p.id !== id)
        }));
      },
      getPlant: (id) => get().plants.find(p => p.id === id),
      updatePlant: (id, updates) => set((state) => ({
        plants: state.plants.map(p =>
          p.id === id ? { ...p, ...updates } : p
        )
      })),
      cancelAllNotifications: async () => {
        const plants = get().plants;
        const notificationIds = plants
          .map(p => p.scheduledNotificationId)
          .filter((id): id is string => id !== undefined);
        await cancelAllPlantNotifications(notificationIds);
      },
      migrateToPhotos: () => {
        const state = get();
        // Already migrated
        if (state._version >= MIGRATION_VERSION) {
          return;
        }

        // Migrate plants from photo string to photos array
        const migratedPlants = state.plants.map(plant => {
          // Skip if already migrated
          if (plant.photos && plant.photos.length > 0) {
            return plant;
          }

          // Transform photo string to photos array
          const photos: PlantPhoto[] = [{
            uri: plant.photo,
            addedDate: plant.addedDate,
            isPrimary: true
          }];

          return { ...plant, photos };
        });

        set({
          plants: migratedPlants,
          _version: MIGRATION_VERSION
        });
      },
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
