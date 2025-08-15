// src/app/docs/DocPageWrapper.tsx
'use client';

import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import dynamic from 'next/dynamic';

const DocPage = dynamic(() => import('./DocPage'), {
  ssr: false,
});

export default function DocPageCsr(props: MDXRemoteSerializeResult) {
  return <DocPage {...props} />;
}
