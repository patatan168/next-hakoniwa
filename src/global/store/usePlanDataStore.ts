import { planSchemaType } from '@/db/schema/planTable';
import { create } from 'zustand';

type newPlanDataStoreType = {
  initData: planSchemaType[];
  postData: planSchemaType[];
  planListData: Array<Array<planSchemaType & { id: number; edit: boolean }>>;
  items: Array<planSchemaType & { id: number; edit: boolean }>;
  historyIndex: number;
  isChange: boolean;
  setInitData: (initData?: planSchemaType[]) => void;
  addPlanListData: (planListData: Array<planSchemaType & { id: number; edit: boolean }>) => void;
  setPostData: (postData: planSchemaType[]) => void;
  setItems: (
    items: Array<planSchemaType & { id: number; edit: boolean }>,
    saveHistory?: boolean
  ) => void;
  undo: () => void;
  redo: () => void;
  deleteItem: (id: number) => void;
  reset: () => void;
};

const planLogNum = 10;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fastEqual = (a: any, b: any) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return JSON.stringify(a) === JSON.stringify(b);
};

export const usePlanDataStore = create<newPlanDataStoreType>((set, get) => ({
  initData: [],
  postData: [],
  planListData: [],
  items: [],
  historyIndex: 0,
  isChange: false,

  addPlanListData: (data) => {
    if (!data) return;
    const addData = data.map((item) => ({ ...item, edit: false }));

    const current = get().planListData[0];
    if (current && fastEqual(current, addData)) return;

    set((state) => {
      const next = [addData, ...state.planListData];
      if (next.length > planLogNum) next.length = planLogNum;
      return { planListData: next, historyIndex: 0 };
    });
  },

  setInitData: (data) => {
    if (!data) return;
    if (fastEqual(get().initData, data)) return;
    set({ initData: data });
  },

  setPostData: (data) => {
    if (!data) return;

    const { initData, postData } = get();
    if (fastEqual(postData, data)) return;

    set({
      postData: data,
      isChange: !fastEqual(initData, data),
    });
  },

  setItems: (items, saveHistory = true) => {
    set({ items });
    if (saveHistory) {
      get().addPlanListData(items);
    }
  },

  undo: () => {
    const { planListData, historyIndex } = get();
    if (planListData.length > historyIndex + 1) {
      const nextIdx = historyIndex + 1;
      const targetData = planListData[nextIdx];
      if (targetData) {
        set({ items: targetData, historyIndex: nextIdx });
      }
    }
  },

  redo: () => {
    const { planListData, historyIndex } = get();
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      const targetData = planListData[nextIdx];
      if (targetData) {
        set({ items: targetData, historyIndex: nextIdx });
      }
    }
  },
  deleteItem: (id) => {
    const { items, addPlanListData } = get();
    // 削除対象を除外
    const filtered = items.filter((item) => item.id !== id);
    // 足りない分をfinancingで埋める
    const uuid = items[0]?.from_uuid ?? '';
    const padded = [
      ...filtered,
      ...Array.from({ length: items.length - filtered.length }, (_, i) => ({
        id: Math.max(0, ...items.map((it) => it.id)) + 1 + i,
        plan_no: 0, // あとで振り直す
        edit: false,
        from_uuid: uuid,
        to_uuid: uuid,
        times: 1,
        x: 0,
        y: 0,
        plan: 'financing' as const,
      })),
    ];
    // plan_noを振り直す
    const nextItems = padded.map((item, index) => ({ ...item, plan_no: index }));
    set({ items: nextItems });
    addPlanListData(nextItems);
  },

  reset: () =>
    set({
      initData: [],
      postData: [],
      planListData: [],
      items: [],
      historyIndex: 0,
      isChange: false,
    }),
}));
