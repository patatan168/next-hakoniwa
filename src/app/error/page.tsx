/**
 * @module error/page
 * @description 汎用エラーページ。
 */
import Link from 'next/link';

export default function ErrorPage() {
  return (
    <div className="p-6 text-center text-red-600">
      <h1 className="text-xl font-bold">不明なエラーです。</h1>
      <Link href="/" className="text-blue-500 underline">
        トップページへ
      </Link>
    </div>
  );
}
