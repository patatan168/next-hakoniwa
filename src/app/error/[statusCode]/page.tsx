import Link from 'next/link';

export default async function ErrorPage({
  params,
  searchParams,
}: {
  params: { statusCode: string };
  searchParams: { message?: string };
}) {
  const { statusCode } = await params;
  const { message } = await searchParams;
  return (
    <div className="p-6 text-center">
      <h1 className="text-blue text-2xl font-bold text-blue-900">Status Code : {statusCode}</h1>
      <ErrorMessage statusCode={statusCode} message={message} />
      <Link href="/" className="text-blue-500 underline">
        トップページへ
      </Link>
    </div>
  );
}

function ErrorMessage({ statusCode, message }: { statusCode: string; message?: string }) {
  switch (statusCode) {
    case '400':
      return <h2 className="text-xl font-bold text-red-600">不正なアクセスです</h2>;
    case '401':
    case '403':
      return (
        <>
          <h2 className="text-xl font-bold text-red-600">アクセスが拒否されました</h2>
          <p className="text-red-600">ログインが必要です。</p>
        </>
      );
    case '500':
      return (
        <>
          <h2 className="text-xl font-bold text-red-600">
            サーバー側のエラーです。管理者にお問い合わせください。
          </h2>
          {message && <p className="text-red-600">{message}</p>}
        </>
      );
    default:
      return (
        <>
          <h2 className="text-xl font-bold text-red-600">
            不明なエラーです。管理者にお問い合わせください。
          </h2>
          {message && <p className="text-red-600">{message}</p>}
        </>
      );
  }
}
