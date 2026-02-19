import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  setOnboardingComplete: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      setOnboardingComplete: () => set({ hasSeenOnboarding: true }),
      resetOnboarding: () => set({ hasSeenOnboarding: false }),
    }),
    {
      name: 'plantid-onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
