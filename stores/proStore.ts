import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProStatus } from '@/types';

interface ProState extends ProStatus {
  setIsPro: (status: boolean) => void;
  setLastVerified: (timestamp: string) => void;
  clear: () => void;
}

export const useProStore = create<ProState>()(
  persist(
    (set) => ({
      isPro: false,
      lastVerified: null,
      setIsPro: (status) => set({ isPro: status }),
      setLastVerified: (timestamp) => set({ lastVerified: timestamp }),
      clear: () => set({ isPro: false, lastVerified: null }),
    }),
    {
      name: 'plantid-pro-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
