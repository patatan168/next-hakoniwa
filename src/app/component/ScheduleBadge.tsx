'use client';

import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { parseCronToJapanese } from '@/global/function/utility';
import { turnStore } from '@/global/store/api/public/turn';
import { useEffect, useState } from 'react';
import { IoTimeOutline } from 'react-icons/io5';
import { MdOutlineUpdate } from 'react-icons/md';

/**
 * ターン更新スケジュールをアイコンと共におしゃれに表示するバッジコンポーネント
 */
export default function ScheduleBadge() {
  const cronString = process.env.NEXT_PUBLIC_TURN_CRON || '';
  const serverTimezone = process.env.NEXT_PUBLIC_TURN_TIMEZONE || 'Asia/Tokyo';
  const parsed = parseCronToJapanese(cronString);
  const [mounted, setMounted] = useState(false);
  const [nextHour, setNextHour] = useState<number | null>(null);
  const [currentHM, setCurrentHM] = useState<{ h: number; m: number }>({ h: 0, m: 0 });

  // ターン情報を取得
  const { data, fetch } = useClientFetch(turnStore);
  useEffect(() => {
    fetch({ method: 'GET' });
  }, [fetch]);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  // Hydrationエラーを防ぐためmounted後に計算
  const localHours =
    Array.isArray(parsed.hours) && mounted && parsed.type === 'daily'
      ? (() => {
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: serverTimezone,
            hour: 'numeric',
            hour12: false,
          });
          const parts = formatter.formatToParts(now);
          const serverHour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
          const localHourValue = now.getHours();

          let diff = localHourValue - serverHour;
          if (diff > 12) diff -= 24;
          else if (diff < -12) diff += 24;

          return parsed.hours
            .map((h) => {
              let localH = (h + diff) % 24;
              if (localH < 0) localH += 24;
              return localH;
            })
            .sort((a, b) => a - b);
        })()
      : [];

  useEffect(() => {
    if (localHours.length === 0) return;

    const calcNext = () => {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      setCurrentHM({ h: currentH, m: currentM });

      let next = localHours.find(
        (h) => h > currentH || (h === currentH && currentM < parsed.minute)
      );
      if (next === undefined) {
        next = localHours[0];
      }
      setNextHour(next);
    };

    calcNext();
    const id = setInterval(calcNext, 60000);
    return () => clearInterval(id);
  }, [localHours.join(','), parsed.minute]);

  if (!mounted) {
    return (
      <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3.5 py-1.5 text-base font-bold text-white opacity-50 shadow-md">
        <IoTimeOutline className="text-emerald-100" size={18} />
        <span>スケジュール読み込み中...</span>
      </div>
    );
  }

  const isPast = (h: number) => {
    if (h < currentHM.h) return true;
    if (h === currentHM.h && currentHM.m >= parsed.minute) return true;
    return false;
  };

  const turnNumberDisplay = data.get ? (
    <div className="flex items-baseline gap-1">
      <span className="text-xs font-semibold tracking-wide text-emerald-600 uppercase">Turn</span>
      <span className="text-3xl leading-none font-black tracking-tighter text-emerald-800 tabular-nums sm:text-4xl">
        {data.get.turn}
      </span>
    </div>
  ) : null;

  if (parsed.type === 'daily' && localHours.length > 0) {
    return (
      <div className="mt-1 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-3 shadow-sm">
        {/* ヘッダー行 */}
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MdOutlineUpdate className="shrink-0 text-emerald-600" size={20} />
            <span className="text-sm font-semibold text-emerald-700">{parsed.text}</span>
          </div>
          {turnNumberDisplay}
        </div>

        {/* 時刻グリッド */}
        <div className="flex flex-wrap gap-1.5">
          {localHours.map((h) => {
            const isNext = h === nextHour;
            const past = isPast(h);
            const timeStr = `${h}:${parsed.minute.toString().padStart(2, '0')}`;

            if (isNext) {
              return (
                <div key={h} className="relative flex flex-col items-center">
                  <div className="mb-0.5 rounded-full bg-amber-500 px-1.5 py-0 text-[9px] font-black tracking-wider text-white uppercase">
                    NEXT
                  </div>
                  <div className="animate-pulse rounded-lg border-2 border-amber-500 bg-amber-400 px-3 py-1.5 text-sm font-black text-white shadow-md shadow-amber-200 sm:text-base">
                    {timeStr}
                  </div>
                </div>
              );
            }

            if (past) {
              return (
                <div key={h} className="flex items-end pb-0.5">
                  <div className="rounded border border-gray-200 bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-400 line-through sm:text-sm">
                    {timeStr}
                  </div>
                </div>
              );
            }

            return (
              <div key={h} className="flex items-end pb-0.5">
                <div className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm sm:text-base">
                  {timeStr}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <MdOutlineUpdate className="shrink-0 text-emerald-600" size={20} />
        <span className="text-sm font-semibold text-emerald-700">{parsed.text}</span>
      </div>
      {turnNumberDisplay && <div className="ml-2">{turnNumberDisplay}</div>}
    </div>
  );
}
