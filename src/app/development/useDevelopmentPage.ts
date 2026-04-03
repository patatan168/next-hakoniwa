/**
 * @module useDevelopmentPage
 * @description 開発画面のデータ取得・状態管理フック。
 */
import { Plan } from '@/db/kysely';
import META_DATA from '@/global/define/metadata';
import { uuid25Regex } from '@/global/define/regex';
import { isEqual, sortBy, uniqBy } from '@/global/function/collection';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { useClientRect } from '@/global/function/useClientRect';
import { useWindowSize } from '@/global/function/useWindowSize';
import { developmentStore } from '@/global/store/api/auth/development';
import { missileStatsStore } from '@/global/store/api/auth/missileStats';
import { planStore } from '@/global/store/api/auth/plan';
import { planStatsStore } from '@/global/store/api/auth/planStats';
import { turnLogAuthStore } from '@/global/store/api/auth/turnLog';
import { turnResourceHistoryStore } from '@/global/store/api/auth/turnResourceHistory';
import { islandListStore } from '@/global/store/api/public/islandList';
import { islandSightStore } from '@/global/store/api/public/islandSight';
import { turnStore } from '@/global/store/api/public/turn';
import { usePlanDataStore } from '@/global/store/usePlanDataStore';
import { useEffect, useState } from 'react';

const normalizePlanItems = (initPlans: Plan[], uuid: string) => {
  const defaultPlans = Array.from({ length: META_DATA.PLAN_LENGTH }, (_, i) => ({
    id: i,
    plan_no: i,
    edit: false,
    from_uuid: uuid,
    to_uuid: uuid,
    times: 1,
    x: 0,
    y: 0,
    plan: 'financing' as const,
  }));

  const baseItems = sortBy(
    uniqBy([...(initPlans ?? []), ...defaultPlans], (item) => item.plan_no),
    ['plan_no']
  );

  const lengthAdjusted = baseItems.slice(0, META_DATA.PLAN_LENGTH);
  if (lengthAdjusted.length < META_DATA.PLAN_LENGTH) {
    const padding = defaultPlans.slice(lengthAdjusted.length);
    lengthAdjusted.push(...padding);
  }

  return lengthAdjusted.map((item, index) => ({
    ...item,
    id: index,
    plan_no: index,
    edit: false,
  }));
};

export const useDevelopmentPage = () => {
  const {
    data: developData,
    fetch: fetchDevelop,
    fetchIfNeeded: fetchDev,
    isLoading,
  } = useClientFetch(developmentStore);
  const {
    data: sightData,
    fetch: fetchSightData,
    isLoading: isSightLoading,
  } = useClientFetch(islandSightStore);
  const { data: turnData, fetch: fetchTurn } = useClientFetch(turnStore);
  const {
    data: fetchPlanData,
    isLoading: isPlanLoading,
    fetchIfNeeded: fetchPlan,
  } = useClientFetch(planStore);
  const { data: islandList, fetchIfNeeded: fetchIslandList } = useClientFetch(islandListStore);
  const {
    data: turnLog,
    fetchIfNeeded: fetchTurnLogIfNeeded,
    fetch: fetchTurnLog,
  } = useClientFetch(turnLogAuthStore);
  const { data: turnResourceHistory, fetchIfNeeded: fetchTurnResourceHistoryIfNeeded } =
    useClientFetch(turnResourceHistoryStore);
  const { data: planStats, fetchIfNeeded: fetchPlanStatsIfNeeded } = useClientFetch(planStatsStore);
  const { data: missileStats, fetchIfNeeded: fetchMissileStatsIfNeeded } =
    useClientFetch(missileStatsStore);

  const [view, setView] = useState<'plan' | 'log' | 'history' | 'stats' | 'settings'>('plan');
  const [selectedIslandUuid, setSelectedIslandUuid] = useState('');
  const [lazyFlag, setLazyFlag] = useState(false);
  const { width } = useWindowSize();
  const [showMenu, setShowMenu] = useState(false);
  const isMobile = width < 1280;

  const [mapRect, mapCallback] = useClientRect<HTMLDivElement>();
  const [listRect, listCallback] = useClientRect<HTMLDivElement>();

  const [isLoginBonusClosed, setIsLoginBonusClosed] = useState(false);
  const showLoginBonus = !!developData.get?.loginBonus && !isLoginBonusClosed;
  const ownIslandUuid = developData.get?.uuid;
  const currentSelectedIslandUuid = selectedIslandUuid || ownIslandUuid || '';
  const isOtherIslandView =
    currentSelectedIslandUuid !== '' &&
    ownIslandUuid !== undefined &&
    currentSelectedIslandUuid !== ownIslandUuid;
  const displayedIslandData = isOtherIslandView ? sightData.get : developData.get;
  const displayedLoading = isOtherIslandView ? isSightLoading.get : isLoading.get;

  const setShowLoginBonus = (show: boolean) => {
    if (!show) {
      setIsLoginBonusClosed(true);
    }
  };

  const mapSize = mapRect
    ? `min(calc(var(--real-vw) - ${mapRect.x}px - 0.25rem), calc(var(--real-vh-minus-footer) - ${mapRect.y}px))`
    : 'min(var(--real-vw), var(--real-vh-minus-footer))';

  const listHeight = listRect
    ? `calc(var(--real-vh-minus-footer) - ${listRect.y}px)`
    : 'var(--real-vh-minus-footer)';

  useEffect(() => {
    fetchDevelop({ method: 'GET' });
    fetchTurn({ method: 'GET', cache: 'no-store' }, { refresh: true });
    fetchPlan({ method: 'GET' });
    fetchIslandList({ method: 'GET' });
  }, [fetchDevelop, fetchTurn, fetchPlan, fetchIslandList]);

  useEffect(() => {
    if (!currentSelectedIslandUuid || !ownIslandUuid) return;
    if (currentSelectedIslandUuid === ownIslandUuid) {
      fetchDevelop({ method: 'GET' });
      return;
    }
    if (!uuid25Regex.test(currentSelectedIslandUuid)) {
      return;
    }
    fetchSightData({ method: 'GET' }, { query: `uuid=${currentSelectedIslandUuid}` });
  }, [currentSelectedIslandUuid, ownIslandUuid, fetchDevelop, fetchSightData]);

  useEffect(() => {
    const uuid = developData.get?.uuid;
    if (isPlanLoading.get || !uuid) return;

    const initPlans = fetchPlanData.get ?? [];
    const computedItems = normalizePlanItems(initPlans, uuid);
    const store = usePlanDataStore.getState();
    const isInitDataChanged = !isEqual(store.initData, initPlans);

    if (store.currentUuid !== uuid) {
      store.reset();
    }

    if (store.currentUuid !== uuid || isInitDataChanged) {
      store.setInitData(initPlans, uuid);
      store.setItems(computedItems, false);
    }
  }, [developData.get?.uuid, fetchPlanData.get, isPlanLoading.get]);

  useEffect(() => {
    if (view === 'log') {
      if (turnLog.get === undefined) {
        fetchTurnLogIfNeeded({ method: 'GET' });
      } else if (lazyFlag) {
        const lastLogUuid =
          turnLog.get.length > 0 ? turnLog.get[turnLog.get.length - 1].log_uuid : undefined;
        if (lastLogUuid) {
          fetchTurnLog({ method: 'GET' }, { query: `log_uuid=${lastLogUuid}` });
        }
      }
    } else if (view === 'history') {
      fetchTurnResourceHistoryIfNeeded({ method: 'GET' });
    } else if (view === 'stats') {
      fetchPlanStatsIfNeeded({ method: 'GET' });
      fetchMissileStatsIfNeeded({ method: 'GET' });
    }
  }, [
    view,
    lazyFlag,
    turnLog.get,
    fetchTurnLogIfNeeded,
    fetchTurnLog,
    fetchTurnResourceHistoryIfNeeded,
    fetchPlanStatsIfNeeded,
    fetchMissileStatsIfNeeded,
  ]);

  const refreshDevelopData = () => {
    fetchDevelop({ method: 'GET' });
    fetchDev({ method: 'GET' });
  };

  return {
    developData,
    displayedIslandData,
    displayedLoading,
    selectedIslandUuid: currentSelectedIslandUuid,
    setSelectedIslandUuid,
    isOtherIslandView,
    turnData,
    fetchPlanData,
    isPlanLoading,
    islandList,
    turnLog,
    turnResourceHistory,
    planStats,
    missileStats,
    view,
    setView,
    lazyFlag,
    setLazyFlag,
    listHeight,
    mapSize,
    showMenu,
    setShowMenu,
    isMobile,
    mapCallback,
    listCallback,
    isLoading,
    showLoginBonus,
    setShowLoginBonus,
    refreshDevelopData,
  };
};
