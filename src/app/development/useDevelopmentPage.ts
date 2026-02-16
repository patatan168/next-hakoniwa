import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { useWindowSize } from '@/global/function/useWindowSize';
import { developmentStore } from '@/global/store/api/auth/development';
import { planStore } from '@/global/store/api/auth/plan';
import { turnLogAuthStore } from '@/global/store/api/auth/turnLog';
import { islandListStore } from '@/global/store/api/public/islandList';
import { turnStore } from '@/global/store/api/public/turn';
import { useCallback, useEffect, useState } from 'react';

export const useDevelopmentPage = () => {
  const {
    data: developData,
    fetchIfNeeded: fetchDev,
    isLoading,
  } = useClientFetch(developmentStore);
  const { data: turnData, fetchIfNeeded: fetchTurn } = useClientFetch(turnStore);
  const {
    data: fetchPlanData,
    isLoading: isPlanLoading,
    fetchIfNeeded: fetchPlan,
  } = useClientFetch(planStore);
  const { data: islandList, fetchIfNeeded: fetchIslandList } = useClientFetch(islandListStore);
  const { data: turnLog, fetchIfNeeded: fetchTurnLog } = useClientFetch(turnLogAuthStore);

  const [view, setView] = useState<'plan' | 'log'>('plan');
  const [lazyFlag, setLazyFlag] = useState(false);
  const [listHeight, setListHeight] = useState('100svh');
  const [mapSize, setMapSize] = useState('min(var(--real-vw), var(--real-vh-minus-footer))');
  const { width, minusFooterHeight } = useWindowSize();
  const [showMenu, setShowMenu] = useState(false);
  const isMobile = width < 1260;

  const mapCallback = useCallback(
    (node: HTMLDivElement) => {
      if (node !== null) {
        const { x, y } = node.getBoundingClientRect();
        setMapSize(`min(${width - x}px, ${minusFooterHeight - y}px)`);
      }
    },
    [width, minusFooterHeight]
  );

  const listCallback = useCallback(
    (node: HTMLDivElement) => {
      if (node !== null) {
        const { y } = node.getBoundingClientRect();
        setListHeight(`${minusFooterHeight - y}px`);
      }
    },
    [minusFooterHeight, isMobile]
  );

  useEffect(() => {
    fetchDev({ method: 'GET' });
    fetchTurn({ method: 'GET' });
    fetchPlan({ method: 'GET' });
    fetchIslandList({ method: 'GET' });
  }, []);

  useEffect(() => {
    if (view === 'log') {
      const lastLogUuid =
        turnLog.get && turnLog.get.length > 0
          ? turnLog.get[turnLog.get.length - 1].log_uuid
          : undefined;
      fetchTurnLog({ method: 'GET' }, { query: lastLogUuid ? `log_uuid=${lastLogUuid}` : '' });
    }
  }, [view, lazyFlag]);

  return {
    developData,
    turnData,
    fetchPlanData,
    isPlanLoading,
    islandList,
    turnLog,
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
  };
};
