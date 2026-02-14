'use client';

import { useWindowSize } from '@/global/function/useWindowSize';
import { useEffect } from 'react';

export default function MainRoot({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { width, height } = useWindowSize();

  useEffect(() => {
    document.documentElement.style.setProperty('--real-vw', `${width}px`);
    document.documentElement.style.setProperty('--real-vh', `${height}px`);
  }, [width, height]);

  return (
    <main id="main-root" className="isolate">
      {children}
    </main>
  );
}
