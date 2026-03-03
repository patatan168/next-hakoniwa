import fs from 'fs';
import type { MDXComponents } from 'mdx/types';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { notFound } from 'next/navigation';
import path from 'path';
import styles from './terms.module.css';

export const metadata: Metadata = {
  title: '利用規約',
  description: '箱庭諸島の利用規約です。',
};

/** MDX要素をスタイル付きコンポーネントにマッピング */
const components: MDXComponents = {
  h1: (props) => <h1 className={styles.h1} {...props} />,
  h2: (props) => <h2 className={styles.h2} {...props} />,
  h3: (props) => <h3 className={styles.h3} {...props} />,
  p: (props) => <p className={styles.p} {...props} />,
  ul: (props) => <ul className={styles.ul} {...props} />,
  li: (props) => <li className={styles.li} {...props} />,
  hr: (props) => <hr className={styles.hr} {...props} />,
  strong: (props) => <strong className={styles.strong} {...props} />,
  code: (props) => <code className={styles.code} {...props} />,
  // テーブルはTailwindクラスを直接適用してPreflight競合を回避
  table: (props) => (
    <table className="my-3 w-full border-separate border-spacing-0 text-sm" {...props} />
  ),
  thead: (props) => <thead {...props} />,
  tbody: (props) => <tbody {...props} />,
  tr: (props) => <tr className="even:bg-black/[.03]" {...props} />,
  th: (props) => (
    <th
      className="border-b-2 border-black/15 px-3.5 py-2 text-left font-semibold text-gray-700"
      {...props}
    />
  ),
  td: (props) => (
    <td className="border-b border-black/[.08] px-3.5 py-2 text-left last:border-b-0" {...props} />
  ),
};

export default async function TermsPage() {
  const filePath = path.join(process.cwd(), 'src', 'app', 'terms', 'terms.mdx');
  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const raw = fs.readFileSync(filePath, 'utf8');

  return (
    <article className={styles.article}>
      {/* data-terms-body属性でglobal.cssのテーブルスタイルのスコープを限定 */}
      <div className={styles.body} data-terms-body>
        <MDXRemote source={raw} components={components} />
      </div>
    </article>
  );
}
