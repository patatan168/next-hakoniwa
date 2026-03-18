/**
 * @module Title
 * @description トップページのタイトル表示コンポーネント。
 */
'use client';
import META from '@/global/define/metadata';
import ScheduleBadge from './ScheduleBadge';

export default function Title() {
  return (
    <div className="flex flex-col items-start gap-1 p-2">
      <h1 className="title ml-1 text-5xl">{META.TITLE}</h1>
      <p className="title ml-5">{`Version: ${META.VERSION}`}</p>
      <div className="w-full px-1 sm:w-auto">
        <ScheduleBadge />
      </div>
    </div>
  );
}
