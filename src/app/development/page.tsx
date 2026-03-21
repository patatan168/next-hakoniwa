/**
 * @module development/page
 * @description 島開発画面ページ。
 */
'use client';
import IslandData from '@/global/component/IslandData';
import { SelectRHF } from '@/global/component/SelectRHF';
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm, useWatch } from 'react-hook-form';
import { GrNotes } from 'react-icons/gr';
import { RxCross1 } from 'react-icons/rx';
import {
  isOwnIslandSelectedInSelect,
  resolveOtherIslandFallback,
  shouldSyncSelectedIslandFromSelect,
} from './islandViewToggle';
import { LoginBonusModal } from './LoginBonusModal';
import { MenuContent } from './MenuContent';
import { useDevelopmentPage } from './useDevelopmentPage';

const HakoniwaMap = dynamic(() => import('@/global/component/HakoniwaMap'), { ssr: false });

type SharedMenuProps = Omit<
  ComponentProps<typeof MenuContent>,
  'isMobile' | 'listHeight' | 'listCallback'
>;

function MobileDevelopmentMenu({
  showMenu,
  setShowMenu,
  listCallback,
  sharedMenuProps,
}: {
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  listCallback: (node: HTMLDivElement) => void;
  sharedMenuProps: SharedMenuProps;
}) {
  return (
    <>
      {!showMenu && (
        <button
          onClick={() => setShowMenu(true)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] left-1/2 z-[9999] flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full border border-white/35 bg-linear-to-r from-emerald-500 to-teal-500 px-7 py-2.5 text-[15px] font-bold tracking-wide text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:brightness-105 active:scale-95"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <GrNotes className="text-sm" />
          </span>
          計画を開く
        </button>
      )}
      {showMenu &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowMenu(false)}
          >
            <div
              className="development-menu-modal relative w-full max-w-5xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <MenuContent
                isMobile={true}
                listCallback={listCallback}
                listHeight="calc(100% - 3.5rem)"
                {...sharedMenuProps}
              />
            </div>
            <div className="pointer-events-none fixed right-0 bottom-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] left-0 z-[120] flex justify-center">
              <button
                onClick={() => setShowMenu(false)}
                className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-white/35 bg-linear-to-r from-rose-500 to-orange-500 px-7 py-2.5 text-[15px] font-bold tracking-wide text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:brightness-105 active:scale-95"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <RxCross1 className="text-sm" />
                </span>
                閉じる
              </button>
            </div>
          </div>,
          document.getElementById('overlay-root') || document.body
        )}
    </>
  );
}

export default function IslandList() {
  const {
    developData,
    displayedIslandData,
    displayedLoading,
    selectedIslandUuid,
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
    setLazyFlag,
    listHeight,
    mapSize,
    showMenu,
    setShowMenu,
    isMobile,
    mapCallback,
    listCallback,
    showLoginBonus,
    setShowLoginBonus,
    refreshDevelopData,
  } = useDevelopmentPage();
  const ownIslandUuid = developData.get?.uuid ?? '';
  const lastOtherIslandUuidRef = useRef('');
  const initializedDefaultIslandRef = useRef(false);
  const syncedTargetIslandUuidRef = useRef('');

  const { control, setValue } = useForm<{ targetIslandUuid: string }>({
    defaultValues: { targetIslandUuid: selectedIslandUuid },
  });
  const targetIslandUuid = useWatch({ control, name: 'targetIslandUuid' });

  useEffect(() => {
    if (
      !shouldSyncSelectedIslandFromSelect({
        targetIslandUuid,
        previousTargetIslandUuid: syncedTargetIslandUuidRef.current,
      })
    ) {
      return;
    }
    syncedTargetIslandUuidRef.current = targetIslandUuid;
    if (!isOwnIslandSelectedInSelect(targetIslandUuid, ownIslandUuid)) {
      lastOtherIslandUuidRef.current = targetIslandUuid;
    }
    setSelectedIslandUuid(targetIslandUuid);
  }, [targetIslandUuid, setSelectedIslandUuid, ownIslandUuid]);

  const islandSelectOptions = useMemo(
    () =>
      (islandList.get ?? []).map((island) => ({
        value: island.uuid,
        children: `${island.island_name}島`,
      })),
    [islandList.get]
  );

  const firstOtherIslandUuid = useMemo(() => {
    if (!ownIslandUuid) return '';
    const other = (islandList.get ?? []).find((island) => island.uuid !== ownIslandUuid);
    return other?.uuid ?? '';
  }, [islandList.get, ownIslandUuid]);

  const isOwnIslandDisplay = !!ownIslandUuid && selectedIslandUuid === ownIslandUuid;
  const isToggleDisabled = isOwnIslandSelectedInSelect(targetIslandUuid, ownIslandUuid);

  const sharedMenuProps: SharedMenuProps = {
    developData: developData.get,
    view,
    islandList: islandList.get,
    turnData: turnData.get,
    isPlanLoading: isPlanLoading.get,
    fetchPlanData: fetchPlanData.get,
    turnLog: turnLog.get,
    turnResourceHistory: turnResourceHistory.get,
    planStats: planStats.get,
    missileStats: missileStats.get,
    setLazyFlag,
    setView,
    refreshDevelopData,
  };

  useEffect(() => {
    if (!ownIslandUuid || initializedDefaultIslandRef.current) return;
    initializedDefaultIslandRef.current = true;
    setSelectedIslandUuid(ownIslandUuid);
    setValue('targetIslandUuid', ownIslandUuid);
  }, [ownIslandUuid, setSelectedIslandUuid, setValue]);

  return (
    <>
      <div className="my-1 px-1">
        <div className="mx-auto grid w-full max-w-md grid-cols-[auto_1fr_auto] items-center gap-2">
          <label
            htmlFor="development-target-island"
            className="text-sm font-bold whitespace-nowrap text-gray-700"
          >
            表示島
          </label>
          <SelectRHF
            name="targetIslandUuid"
            id="development-target-island"
            control={control}
            className="w-full"
            options={islandSelectOptions}
            isBottomSpace={false}
          />
          <label className="inline-flex cursor-pointer items-center justify-end gap-2 text-xs font-medium text-gray-700 disabled:cursor-not-allowed">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={isOwnIslandDisplay}
              disabled={isToggleDisabled}
              onChange={(event) => {
                if (!ownIslandUuid) return;
                if (event.currentTarget.checked) {
                  setSelectedIslandUuid(ownIslandUuid);
                  return;
                }
                const fallbackTarget = resolveOtherIslandFallback({
                  lastOtherIslandUuid: lastOtherIslandUuidRef.current,
                  firstOtherIslandUuid,
                  ownIslandUuid,
                });
                setSelectedIslandUuid(fallbackTarget);
              }}
            />
            <span className="peer-disabled:text-gray-400">自島</span>
            <span className="relative h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-emerald-500 peer-disabled:opacity-50 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-xs after:transition-transform peer-checked:after:translate-x-5" />
          </label>
        </div>
      </div>

      <div className={`grid gap-1 ${isMobile ? 'grid-cols-1' : 'grid-cols-[auto_1fr]'}`}>
        <div className="grid grid-rows-[auto_1fr] items-start justify-items-center gap-1 px-1">
          <IslandData
            mode={isOtherIslandView ? 'sight' : 'development'}
            data={displayedIslandData}
          />
          <HakoniwaMap
            ref={mapCallback}
            style={{ width: mapSize, height: 'auto', maxHeight: mapSize }}
            isLoading={displayedLoading}
            islandName={displayedIslandData?.island_name}
            data={displayedIslandData?.island_info}
            isDevelop={!!developData.get?.uuid}
            uuid={developData.get?.uuid}
            targetUuid={isOtherIslandView ? selectedIslandUuid : developData.get?.uuid}
            restrictToAttackOrAid={isOtherIslandView}
          />
        </div>

        {/* Desktop View: Always show menu */}
        {!isMobile && (
          <MenuContent
            isMobile={false}
            listCallback={listCallback}
            listHeight={listHeight}
            {...sharedMenuProps}
          />
        )}

        {isMobile && (
          <MobileDevelopmentMenu
            showMenu={showMenu}
            setShowMenu={setShowMenu}
            listCallback={listCallback}
            sharedMenuProps={sharedMenuProps}
          />
        )}
      </div>

      <LoginBonusModal
        showLoginBonus={showLoginBonus}
        setShowLoginBonus={setShowLoginBonus}
        loginBonus={developData.get?.loginBonus}
      />
    </>
  );
}
