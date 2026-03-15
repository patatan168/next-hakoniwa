'use client';

import { useWindowSize } from '@/global/function/useWindowSize';
import { useEffect } from 'react';

export default function MainRoot({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { width, height, minusFooterHeight, addressBarHeight } = useWindowSize();

  useEffect(() => {
    if (width === 0 || height === 0 || minusFooterHeight === 0) return;
    document.documentElement.style.setProperty('--real-vw', `${width}px`);
    document.documentElement.style.setProperty('--real-vh', `${height}px`);
    document.documentElement.style.setProperty('--real-vh-minus-footer', `${minusFooterHeight}px`);
    document.documentElement.style.setProperty(
      '--browser-address-bar-height',
      `${addressBarHeight}px`
    );
  }, [width, height, minusFooterHeight, addressBarHeight]);

  return (
    <main id="main-root" className="isolate">
      {children}
    </main>
  );
}
