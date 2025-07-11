import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="p-6 text-center text-red-600">
      <h1 className="text-xl font-bold">アクセスが拒否されました</h1>
      <p>ログインが必要です。</p>
      <Link href="/" className="text-blue-500 underline">
        トップページへ
      </Link>
    </div>
  );
}
