import { LicenseMenu } from './LicenseMenu';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col md:grid md:grid-cols-12">
      <div className="md:col-span-2">
        <LicenseMenu />
      </div>
      <div className="p-2 md:col-span-10">{children}</div>
    </div>
  );
}
