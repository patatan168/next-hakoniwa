import { islandInfoTurnProgress } from '@/db/schema/islandTable';
import { createStore } from 'zustand/vanilla';

type refreshTokenStoreType = {
  data: islandInfoTurnProgress[];
  indexMap: Record<string, number>;
  change: (data: islandInfoTurnProgress, uuid: string) => void;
  reset: () => void;
};

export const refreshTokenStore = createStore<refreshTokenStoreType>((set, get) => ({
  data: [],
  indexMap: {},
  change: (data, uuid) => {
    const index = get().indexMap[uuid];
    if (index === undefined) return;
    const updated = [...get().data];
    updated[index] = data;
    set({ data: updated });
  },
  reset: () => set({ data: [], indexMap: {} }),
}));
