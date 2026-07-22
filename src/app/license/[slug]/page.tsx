/* eslint-disable react-refresh/only-export-components */
/**
 * @module license/[slug]/page
 * @description 個別ライセンス表示ページ。
 */
import fs from 'fs';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { notFound } from 'next/navigation';
import path from 'path';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  const mdDir = path.join(process.cwd(), 'src', 'app', 'license', 'md');
  const fileNames = fs.readdirSync(mdDir).filter((name) => name.endsWith('.mdx'));

  return fileNames.map((fileName) => ({ slug: fileName.replace(/\.mdx$/i, '') }));
}

export default async function Page({ params }: PageProps<'/license/[slug]'>) {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), 'src', 'app', 'license', 'md', `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const raw = fs.readFileSync(filePath, 'utf8');

  return <MDXRemote source={raw} />;
}
