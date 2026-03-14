import { create } from 'zustand';
import { CombinerResult } from '../lib/combiner';

interface AppState {
  hasData: boolean;
  snpData: CombinerResult | null;
  setSnpData: (data: CombinerResult) => void;
  clearData: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  hasData: false,
  snpData: null,
  setSnpData: (data) => set({ hasData: true, snpData: data }),
  clearData: () => set({ hasData: false, snpData: null }),
}));
