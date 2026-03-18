/**
 * @module Footer
 * @description フッターコンポーネント。
 */
'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="text-gray-700">
      <div className="mx-1 grid grid-cols-4 grid-rows-none items-center gap-0 text-xs">
        {/* 左カラム */}
        <div className="col-span-2">Original Developer 徳岡宏樹</div>

        {/* 中カラム */}
        <div>&copy; 2024 Patatan</div>

        {/* 右カラム */}
        <div className="col-span-1 flex justify-end">
          <Link href="/license" className="underline">
            Other License
          </Link>
        </div>
      </div>
    </footer>
  );
}
