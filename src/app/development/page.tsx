'use client';
import IslandData from '@/global/component/IslandData';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { GrNotes } from 'react-icons/gr';
import { RxCross1 } from 'react-icons/rx';
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
  } = useDevelopmentPage();

  return (
    <>
      <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-[auto_1fr]'}`}>
        <div className="grid justify-items-center">
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
            setLazyFlag={setLazyFlag}
            setView={setView}
          />
        )}

        {/* Mobile View: Floating Menu */}
        {isMobile && (
          <>
            {/* Toggle Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="fixed right-4 bottom-20 z-[101] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              {showMenu ? <RxCross1 className="text-2xl" /> : <GrNotes className="text-2xl" />}
            </button>

            {/* Menu Overlay via Portal */}
            {showMenu &&
              createPortal(
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
                  onClick={() => setShowMenu(false)}
                >
                  <div
                    className="h-minus-footer-screen relative w-full max-w-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setShowMenu(false)}
                      className="absolute top-2 right-2 z-[102] flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-100/50 text-gray-600 shadow-md hover:bg-red-200/50"
                    >
                      <RxCross1 className="text-xl" />
                    </button>
                    <MenuContent
                      isMobile={true}
                      listCallback={listCallback}
                      listHeight={listHeight}
                      developData={developData.get}
                      view={view}
                      islandList={islandList.get}
                      turnData={turnData.get}
                      isPlanLoading={isPlanLoading.get}
                      fetchPlanData={fetchPlanData.get}
                      turnLog={turnLog.get}
                      setLazyFlag={setLazyFlag}
                      setView={setView}
                    />
                  </div>
                </div>,
                document.getElementById('overlay-root') || document.body
              )}
          </>
        )}
      </div>
    </>
  );
}
