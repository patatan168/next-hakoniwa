'use client';

import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { parseCronToJapanese } from '@/global/function/utility';
import { turnStore } from '@/global/store/api/public/turn';
import { useEffect, useState } from 'react';
import { IoTimeOutline } from 'react-icons/io5';

/**
 * ターン更新スケジュールをアイコンと共におしゃれに表示するバッジコンポーネント
 */
export default function ScheduleBadge() {
  const cronString = process.env.NEXT_PUBLIC_TURN_CRON || '';
  const serverTimezone = process.env.NEXT_PUBLIC_TURN_TIMEZONE || 'Asia/Tokyo';
  const parsed = parseCronToJapanese(cronString);
  const [mounted, setMounted] = useState(false);
  const [nextHour, setNextHour] = useState<number | null>(null);

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
      const currentH = new Date().getHours();
      const currentM = new Date().getMinutes();

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

  const turnNumberDisplay = data.get ? (
    <div className="ml-3 flex items-baseline gap-1 text-emerald-800">
      <span className="text-sm font-semibold tracking-wide">ターン</span>
      <span className="text-2xl font-black tracking-tighter tabular-nums sm:text-3xl">
        {data.get.turn}
      </span>
    </div>
  ) : null;

  if (parsed.type === 'daily' && localHours.length > 0) {
    return (
      <div className="mt-1 flex flex-col gap-2">
        <div className="flex items-center">
          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-700 px-3.5 py-1.5 text-base font-bold text-white shadow-md">
            <IoTimeOutline className="text-emerald-100" size={18} />
            <span>{parsed.text}</span>
          </div>
          {turnNumberDisplay}
        </div>
        <div className="ml-1 grid grid-cols-6 gap-2">
          {localHours.map((h) => {
            const isNext = h === nextHour;
            return (
              <div
                key={h}
                className={`flex items-center justify-center rounded border px-2.5 py-1 text-sm font-bold shadow-sm transition-all sm:text-base ${
                  isNext
                    ? 'scale-105 border-amber-600 bg-amber-500 text-white shadow-md'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 opacity-90'
                }`}
              >
                {`${h}:` + parsed.minute.toString().padStart(2, '0')}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3.5 py-1.5 text-base font-bold text-white shadow-md">
        <IoTimeOutline className="text-emerald-100" size={18} />
        <span>{parsed.text}</span>
      </div>
      {turnNumberDisplay}
    </div>
  );
}
