/**
 * @module layout
 * @description アプリ全体のルートレイアウト。
 */
// 複数のレイアウトをexportするため
/* eslint-disable react-refresh/only-export-components */
import Footer from '@/global/component/Footer';
import GlobalLoadingOverlay from '@/global/component/GlobalLoadingOverlay';
import Header from '@/global/component/Header';
import MainRoot from '@/global/component/MainRoot';
import META from '@/global/define/metadata';
import '@/global/global.css';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  formatDetection: { address: false, email: false, telephone: false },
  title: META.TITLE,
  description: `${META.TITLE} | Version:${META.VERSION}`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
  },
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
        <MainRoot>{children}</MainRoot>
        <GlobalLoadingOverlay />
        <div id="overlay-root"></div>
        <div id="modal-root"></div>
        <Footer />
      </body>
    </html>
  );
}
