/**
 * @module development/page
 * @description 島開発画面ページ。
 */
'use client';
import IslandData from '@/global/component/IslandData';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { GrNotes } from 'react-icons/gr';
import { RxCross1 } from 'react-icons/rx';
import { LoginBonusModal } from './LoginBonusModal';
import { MenuContent } from './MenuContent';
import { useDevelopmentPage } from './useDevelopmentPage';

const HakoniwaMap = dynamic(() => import('@/global/component/HakoniwaMap'), { ssr: false });

export default function IslandList() {
  const {
    developData,
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
    isLoading,
    showLoginBonus,
    setShowLoginBonus,
    refreshDevelopData,
  } = useDevelopmentPage();

  return (
    <>
      <div className={`grid gap-1 ${isMobile ? 'grid-cols-1' : 'grid-cols-[auto_1fr]'}`}>
        <div className="grid grid-rows-[auto_1fr] items-start justify-items-center gap-1 px-1">
          <IslandData mode="development" data={developData.get} />
          <HakoniwaMap
            ref={mapCallback}
            style={{ width: mapSize, height: 'auto', maxHeight: mapSize }}
            isLoading={isLoading.get}
            islandName={developData.get?.island_name}
            data={developData.get?.island_info}
            isDevelop={true}
            uuid={developData.get?.uuid}
          />
        </div>

        {/* Desktop View: Always show menu */}
        {!isMobile && (
          <MenuContent
            isMobile={false}
            listCallback={listCallback}
            listHeight={listHeight}
            developData={developData.get}
            view={view}
            islandList={islandList.get}
            turnData={turnData.get}
            isPlanLoading={isPlanLoading.get}
            fetchPlanData={fetchPlanData.get}
            turnLog={turnLog.get}
            turnResourceHistory={turnResourceHistory.get}
            planStats={planStats.get}
            missileStats={missileStats.get}
            setLazyFlag={setLazyFlag}
            setView={setView}
            refreshDevelopData={refreshDevelopData}
          />
        )}

        {/* Mobile View: Floating Menu */}
        {isMobile && (
          <>
            {/* Toggle Button */}
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
            {/* Menu Overlay via Portal */}
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
                      developData={developData.get}
                      view={view}
                      islandList={islandList.get}
                      turnData={turnData.get}
                      isPlanLoading={isPlanLoading.get}
                      fetchPlanData={fetchPlanData.get}
                      turnLog={turnLog.get}
                      turnResourceHistory={turnResourceHistory.get}
                      planStats={planStats.get}
                      missileStats={missileStats.get}
                      setLazyFlag={setLazyFlag}
                      setView={setView}
                      refreshDevelopData={refreshDevelopData}
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
