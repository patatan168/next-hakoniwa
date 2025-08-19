import { DocsMenu } from './DocsMenu';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid grid-cols-12">
      <div>
        <DocsMenu />
      </div>
      <div className="col-span-10 p-2">{children}</div>
    </div>
  );
}
