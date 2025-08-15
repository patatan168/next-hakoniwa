'use client';

import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';

export default function Mermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      mermaid.initialize({ startOnLoad: false, theme: 'default' });
      const id = `mermaid-${crypto.randomUUID()}`;

      mermaid.render(id, code).then(({ svg }) => {
        ref.current!.innerHTML = svg;
      });
    }
  }, [code]);

  return <div ref={ref} />;
}
