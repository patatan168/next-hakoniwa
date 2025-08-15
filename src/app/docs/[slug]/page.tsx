import fs from 'fs';
import { serialize } from 'next-mdx-remote/serialize';
import { notFound } from 'next/navigation';
import path from 'path';
import DocPageCsr from '../DocPageCsr';
import remarkMermaidAuto from '../remarkMermaidAuto';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  const { slug } = await params;
  const filePath = path.join(process.cwd(), 'src', 'app', 'docs', 'md', `${slug}.mdx`);
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
