import Link from 'next/link';

export default async function ErrorPage({
  params,
  searchParams,
}: PageProps<'/error/[statusCode]'>) {
  const { statusCode } = await params;
  const { message } = (await searchParams) ?? {};
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

function ErrorMessage({
  statusCode,
  message,
}: {
  statusCode: string;
  message?: string | string[];
}) {
  switch (statusCode) {
    case '400':
      return (
        <>
          <h2 className="text-xl font-bold text-red-600">不正なアクセスです</h2>
          <Message message={message} />
        </>
      );
    case '401':
    case '403':
      return (
        <>
          <h2 className="text-xl font-bold text-red-600">アクセスが拒否されました</h2>
          <p className="text-red-600">ログインが必要です。</p>
          <Message message={message} />
        </>
      );
    case '404':
      return (
        <>
          <h2 className="text-xl font-bold text-red-600">お探しのページは見つかりません。</h2>
          <Message message={message} />
        </>
      );
    case '500':
      return (
        <>
          <h2 className="text-xl font-bold text-red-600">
            サーバー側のエラーです。管理者にお問い合わせください。
          </h2>
          <Message message={message} />
        </>
      );
    default:
      return (
        <>
          <h2 className="text-xl font-bold text-red-600">
            不明なエラーです。管理者にお問い合わせください。
          </h2>
          <Message message={message} />
        </>
      );
  }
}

function Message({ message }: { message?: string | string[] }) {
  if (!message) return null;
  if (Array.isArray(message)) {
    return (
      <ul className="text-red-600">
        {message.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    );
  }
  return <p className="text-red-600">{message}</p>;
}
