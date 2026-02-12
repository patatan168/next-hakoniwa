import fs from 'fs';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { notFound } from 'next/navigation';
import path from 'path';
import remarkMermaidAuto from '../remarkMermaidAuto';

export default async function Page({ params }: PageProps<'/docs/[slug]'>) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  const { slug } = await params;
  const filePath = path.join(process.cwd(), 'src', 'app', 'docs', 'md', `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const raw = fs.readFileSync(filePath, 'utf8');

  return (
    <MDXRemote
      source={raw}
      options={{
        mdxOptions: { remarkPlugins: [remarkMermaidAuto] },
      }}
    />
  );
}
