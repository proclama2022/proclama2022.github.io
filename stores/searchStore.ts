import { create } from 'zustand';
import { WateringFilter, DifficultyFilter } from '@/components/SearchFilterBar';

interface SearchState {
  wateringFilter: WateringFilter;
  difficultyFilter: DifficultyFilter;
  setWateringFilter: (filter: WateringFilter) => void;
  setDifficultyFilter: (filter: DifficultyFilter) => void;
  clearFilters: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  wateringFilter: 'all',
  difficultyFilter: 'all',
  setWateringFilter: (filter) => set({ wateringFilter: filter }),
  setDifficultyFilter: (filter) => set({ difficultyFilter: filter }),
  clearFilters: () => set({ wateringFilter: 'all', difficultyFilter: 'all' }),
}));
