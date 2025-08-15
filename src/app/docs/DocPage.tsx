'use client';

import { MDXProvider } from '@mdx-js/react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import Mermaid from './Mermaid';

const mdxComponents = {
  Mermaid,
};

export default function DocPage(props: MDXRemoteSerializeResult) {
  return (
    <MDXProvider components={mdxComponents}>
      <article className="prose prose-lg max-w-none leading-snug">
        <MDXRemote {...props} />
      </article>
    </MDXProvider>
  );
}
