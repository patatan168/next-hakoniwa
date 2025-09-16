import Link from 'next/link';

const LinkList = ({
  children,
  href,
  path,
  slug,
}: {
  children?: React.ReactNode;
  href: string;
  path: string;
  slug: string;
}) => {
  if (path === slug) {
    return <li>{children}</li>;
  }

  return (
    <li className="text-blue-600 hover:underline dark:text-blue-500">
      <Link href={{ pathname: href }}>{children}</Link>
    </li>
  );
};

export const DocsMenu = ({ slug = 'example' }: { slug?: string }) => {
  return (
    <ul className="p-4">
      <LinkList href="/docs/example" path="example" slug={slug}>
        Example
      </LinkList>
    </ul>
  );
};
