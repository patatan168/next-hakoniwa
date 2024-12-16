// 複数のレイアウトをexportするため
/* eslint-disable react-refresh/only-export-components */
import META from '@/global/define/metadata';
import '@/global/global.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

const geistSans = localFont({
  src: '../global/font/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: '../global/font/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
