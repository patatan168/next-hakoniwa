// 複数のレイアウトをexportするため
/* eslint-disable react-refresh/only-export-components */
import Header from '@/global/component/Header';
import META from '@/global/define/metadata';
import '@/global/global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  formatDetection: { address: false, email: false, telephone: false },
  title: META.TITLE,
  description: `${META.TITLE} | Version:${META.VERSION}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
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
