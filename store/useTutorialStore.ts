import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TutorialState {
  hasSeenTutorial: boolean;
  isRunning: boolean;
  setHasSeenTutorial: (seen: boolean) => void;
  startTutorial: () => void;
  stopTutorial: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      hasSeenTutorial: false,
      isRunning: false,

      setHasSeenTutorial: (seen) => set({ hasSeenTutorial: seen }),

      startTutorial: () => set({ isRunning: true }),

      stopTutorial: () => set({ isRunning: false, hasSeenTutorial: true }),
    }),
    {
      name: 'tutorial-storage',
    }
  )
);
