import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedPlant } from '@/types';
import { cancelPlantNotification, cancelAllPlantNotifications } from '@/services/notificationService';

interface PlantsState {
  plants: SavedPlant[];
  notificationTimePreference: string;
  setNotificationTimePreference: (time: string) => void;
  addPlant: (plant: SavedPlant) => void;
  removePlant: (id: string) => Promise<void>;
  getPlant: (id: string) => SavedPlant | undefined;
  updatePlant: (id: string, updates: Partial<SavedPlant>) => void;
  cancelAllNotifications: () => Promise<void>;
}

export const usePlantsStore = create<PlantsState>()(
  persist(
    (set, get) => ({
      plants: [],
      notificationTimePreference: '08:00',
      setNotificationTimePreference: (time) => set({ notificationTimePreference: time }),
      addPlant: (plant) => set((state) => ({
        plants: [{ ...plant, id: plant.id || crypto.randomUUID() }, ...state.plants]
      })),
      removePlant: async (id) => {
        const plant = get().plants.find(p => p.id === id);
        if (plant?.scheduledNotificationId) {
          await cancelPlantNotification(plant.scheduledNotificationId);
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
    }),
    {
      name: 'plantid-plants-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
