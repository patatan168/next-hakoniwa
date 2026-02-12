import { LicenseMenu } from './LicenseMenu';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid grid-cols-12">
      <div className="col-span-2">
        <LicenseMenu />
      </div>
      <div className="col-span-10 p-2">{children}</div>
    </div>
  );
}
