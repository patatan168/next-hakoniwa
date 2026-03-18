/**
 * @module license/page
 * @description ライセンス一覧ページ。
 */
import fs from 'fs';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { notFound } from 'next/navigation';
import path from 'path';

export default async function Page() {
  const filePath = path.join(process.cwd(), 'src', 'app', 'license', 'md', 'hako.mdx');
  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const raw = fs.readFileSync(filePath, 'utf8');

  return <MDXRemote source={raw} />;
}
