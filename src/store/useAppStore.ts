import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CombinerResult } from '../lib/combiner';
import { AnalysisResponse } from '../services/analysisService';

interface AppState {
  hasData: boolean;
  snpData: CombinerResult | null;
  setSnpData: (data: CombinerResult) => void;
  clearData: () => void;
  // Cache module results for 14 days
  moduleCache: Record<string, { result: AnalysisResponse; timestamp: number }>;
  setModuleCache: (moduleId: string, result: AnalysisResponse) => void;
  getCachedModule: (moduleId: string) => AnalysisResponse | null;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasData: false,
      snpData: null,
      setSnpData: (data) => set({ hasData: true, snpData: data }),
      clearData: () => set({ hasData: false, snpData: null, moduleCache: {} }),
      moduleCache: {},
      setModuleCache: (moduleId, result) => 
        set((state) => ({
          moduleCache: {
            ...state.moduleCache,
            [moduleId]: { result, timestamp: Date.now() }
          }
        })),
      getCachedModule: (moduleId) => {
        const cached = get().moduleCache[moduleId];
        if (!cached) return null;
        // Check if cache is older than 14 days
        const isExpired = Date.now() - cached.timestamp > 14 * 24 * 60 * 60 * 1000;
        if (isExpired) return null;
        return cached.result;
      }
    }),
    {
      name: 'dna-app-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
