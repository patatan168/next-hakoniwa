import fs from 'fs';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { notFound } from 'next/navigation';
import path from 'path';

export default async function Page({ params }: PageProps<'/license/[slug]'>) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  const { slug } = await params;
  const filePath = path.join(process.cwd(), 'src', 'app', 'license', 'md', `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const raw = fs.readFileSync(filePath, 'utf8');

  return <MDXRemote source={raw} />;
}
