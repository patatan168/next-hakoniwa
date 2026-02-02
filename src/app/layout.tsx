// 複数のレイアウトをexportするため
/* eslint-disable react-refresh/only-export-components */
import Header from '@/global/component/Header';
import META from '@/global/define/metadata';
import '@/global/global.css';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  formatDetection: { address: false, email: false, telephone: false },
  title: META.TITLE,
  description: `${META.TITLE} | Version:${META.VERSION}`,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') || '';
  return (
    <html lang="ja">
      <head>
        {/* Next.jsの自動注入スクリプトにnonceを付与 */}
        <meta property="csp-nonce" content={nonce} />
      </head>
      <body>
        <Header />
        <main id="main-root" className="isolate">
          {children}
        </main>
        <div id="overlay-root"></div>
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
