/**
 * @module turnProgress
 * @description ターン進行状況を保持するZustandバニラストア。
 */
import { islandInfoTurnProgress } from '@/db/kysely';
import { createStore } from 'zustand/vanilla';

type islandProgressStore = {
  data: islandInfoTurnProgress[];
  indexMap: Record<string, number>;
  islandGet: (uuid: string) => islandInfoTurnProgress | undefined;
  change: (data: islandInfoTurnProgress, uuid: string) => void;
  reset: () => void;
};

export const islandDataStore = createStore<islandProgressStore>((set, get) => ({
  data: [],
  indexMap: {},
  islandGet: (uuid) => {
    const index = get().indexMap[uuid];
    if (index === undefined) return;
    return get().data[index];
  },
  change: (data, uuid) => {
    const index = get().indexMap[uuid];
    if (index === undefined) return;
    const currentData = get().data;
    if (currentData[index] !== data) {
      currentData[index] = data;
    }
  },
  reset: () => set({ data: [], indexMap: {} }),
}));

export function buildIndexMap(data: islandInfoTurnProgress[]): Record<string, number> {
  const map: Record<string, number> = {};
  data.forEach((item, index) => {
    map[item.uuid] = index;
  });
  return map;
}

export function islandDataGetSet(uuid: string) {
  let islandData = islandDataStore.getState().islandGet(uuid);
  return {
    islandData,
    [Symbol.dispose]: () => {
      if (islandData) islandDataStore.getState().change(islandData, uuid);
    },
  };
}
