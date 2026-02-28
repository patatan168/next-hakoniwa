import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { useClientRect } from '@/global/function/useClientRect';
import { useWindowSize } from '@/global/function/useWindowSize';
import { developmentStore } from '@/global/store/api/auth/development';
import { planStore } from '@/global/store/api/auth/plan';
import { turnLogAuthStore } from '@/global/store/api/auth/turnLog';
import { islandListStore } from '@/global/store/api/public/islandList';
import { turnStore } from '@/global/store/api/public/turn';
import { useEffect, useState } from 'react';

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
  const {
    data: turnLog,
    fetchIfNeeded: fetchTurnLogIfNeeded,
    fetch: fetchTurnLog,
  } = useClientFetch(turnLogAuthStore);

  const [view, setView] = useState<'plan' | 'log'>('plan');
  const [lazyFlag, setLazyFlag] = useState(false);
  const { width } = useWindowSize();
  const [showMenu, setShowMenu] = useState(false);
  const isMobile = width < 1280;

  const [mapRect, mapCallback] = useClientRect<HTMLDivElement>();
  const [listRect, listCallback] = useClientRect<HTMLDivElement>();

  const mapSize = mapRect
    ? `min(calc(var(--real-vw) - ${mapRect.x}px), calc(var(--real-vh-minus-footer) - ${mapRect.y}px))`
    : 'min(var(--real-vw), var(--real-vh-minus-footer))';

  const listHeight = listRect
    ? `calc(var(--real-vh-minus-footer) - ${listRect.y}px)`
    : 'var(--real-vh-minus-footer)';

  useEffect(() => {
    fetchDev({ method: 'GET' });
    fetchTurn({ method: 'GET' });
    fetchPlan({ method: 'GET' });
    fetchIslandList({ method: 'GET' });
  }, []);

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
