/**
 * @module AccountMenu
 * @description アカウントメニューコンポーネント。サインイン・サインアップ・アカウント管理を提供する。
 */
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { IoSettingsSharp } from 'react-icons/io5';
import Button from './Button';

/**
 * アカウント用のボタンとフロートメニュー
 */
export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.target instanceof Node) {
        if (ref.current && !ref.current.contains(e.target)) {
          setOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <Button
        size="xs"
        className="sm:text-sm"
        category="outline"
        color="orange"
        icons={<IoSettingsSharp />}
        onClick={() => setOpen((v) => !v)}
      >
        アカウント
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-md border bg-white shadow-lg">
          <ul className="py-1">
            <Link href="/account">
              <li className="cursor-pointer px-4 py-2 hover:bg-gray-100">アカウント設定</li>
            </Link>
            <Link href="/sign-out">
              <li className="cursor-pointer bg-sky-100 px-4 py-2 hover:bg-sky-200">サインアウト</li>
            </Link>
          </ul>
        </div>
      )}
    </div>
  );
}
