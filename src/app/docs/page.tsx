import fs from 'fs';
import { serialize } from 'next-mdx-remote/serialize';
import { notFound } from 'next/navigation';
import path from 'path';
import DocPageCsr from './DocPageCsr';
import remarkMermaidAuto from './remarkMermaidAuto';

export default async function Page() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const filePath = path.join(process.cwd(), 'src', 'app', 'docs', 'md', `example.mdx`);
  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const mdxSource = await serialize(raw, {
    mdxOptions: {
      remarkPlugins: [remarkMermaidAuto],
    },
  });

  return <DocPageCsr {...mdxSource} />;
}
