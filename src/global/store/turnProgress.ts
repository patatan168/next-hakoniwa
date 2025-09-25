import { islandInfoTurnProgress } from "@/db/schema/islandTable";
import { differenceWith, isEqual } from "es-toolkit";
import { createStore } from "zustand/vanilla";
import { getMapAround } from "../function/island";

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
    return structuredClone(get().data[index]);
  },
  change: (data, uuid) => {
    const index = get().indexMap[uuid];
    if (index === undefined) return;
    const updated = [...get().data];
    updated[index] = data;
    set({ data: updated });
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
  const initIslandData = structuredClone(islandData);
  return {
    islandData,
    [Symbol.dispose]: () => {
      if (!isEqual(islandData, initIslandData) && islandData) {
        islandDataStore.getState().change(islandData, uuid);
      }
    },
  };
}