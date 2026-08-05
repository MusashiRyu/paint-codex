import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AppStore = {
  initialized: boolean;
  markInitialized: () => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      initialized: false,
      markInitialized: () => set({ initialized: true }),
    }),
    {
      name: 'paco-app-store',
    }
  )
);