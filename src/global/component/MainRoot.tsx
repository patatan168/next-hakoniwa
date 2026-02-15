'use client';

import { useWindowSize } from '@/global/function/useWindowSize';
import { useEffect } from 'react';

export default function MainRoot({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { width, height, minusFooterHeight } = useWindowSize();

  useEffect(() => {
    if (width === 0 || height === 0 || minusFooterHeight === 0) return;
    document.documentElement.style.setProperty('--real-vw', `${width}px`);
    document.documentElement.style.setProperty('--real-vh', `${height}px`);
    document.documentElement.style.setProperty('--real-vh-minus-footer', `${minusFooterHeight}px`);
  }, [width, height, minusFooterHeight]);

  return (
    <main id="main-root" className="isolate">
      {children}
    </main>
  );
}
