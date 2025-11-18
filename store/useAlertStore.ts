import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AlertStore = {
  resolvedAlertIds: string[];
  resolveAlert: (id: string) => void;
  unresolveAlert: (id: string) => void;
};

export const useAlertStore = create<AlertStore>()(
  persist(
    (set) => ({
      resolvedAlertIds: [],
      resolveAlert: (id) =>
        set((state) => ({
          resolvedAlertIds: [...state.resolvedAlertIds, id],
        })),
      unresolveAlert: (id) =>
        set((state) => ({
          resolvedAlertIds: state.resolvedAlertIds.filter((resolvedId) => resolvedId !== id),
        })),
    }),
    {
      name: 'alert-storage', // name of the item in the storage (must be unique)
    }
  )
);
