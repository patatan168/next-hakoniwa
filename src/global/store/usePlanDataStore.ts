import { planSchemaType } from '@/db/schema/planTable';
import { create } from 'zustand';

type newPlanDataStoreType = {
  initData: planSchemaType[];
  postData: planSchemaType[];
  planListData: Array<Array<planSchemaType & { id: number; edit: boolean }>>;
  isChange: boolean;
  setInitData: (initData?: planSchemaType[]) => void;
  addPlanListData: (planListData: Array<planSchemaType & { id: number; edit: boolean }>) => void;
  setPostData: (postData: planSchemaType[]) => void;
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
  isChange: false,

  addPlanListData: (data) => {
    if (!data) return;
    const addData = data.map((item) => ({ ...item, data: false }));

    const current = get().planListData[0];
    if (current && fastEqual(current, addData)) return;

    set((state) => {
      const next = [addData, ...state.planListData];
      if (next.length > planLogNum) next.length = planLogNum;
      return { planListData: next };
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
  reset: () =>
    set({
      initData: [],
      postData: [],
      planListData: [],
      isChange: false,
    }),
}));
