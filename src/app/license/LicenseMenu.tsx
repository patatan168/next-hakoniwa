'use client';
import Link from 'next/link';

const LinkList = ({ children, href }: { children?: React.ReactNode; href: string }) => {
  return (
    <>
      <Link href={href}>
        <li className="text-blue-600 hover:underline dark:text-blue-500">{children}</li>
      </Link>
      <hr className="my-2" />
    </>
  );
};

export const LicenseMenu = () => {
  return (
    <ul className="p-4">
      <LinkList href="/license/hako">箱庭諸島 ver2.3</LinkList>
      <LinkList href="/license/react">React</LinkList>
      <LinkList href="/license/reactHookForm">React Hook Form</LinkList>
      <LinkList href="/license/nextJs">Next.js</LinkList>
      <LinkList href="/license/tailwindcss">Tailwind CSS</LinkList>
      <LinkList href="/license/sass">sass</LinkList>
      <LinkList href="/license/nextMdxRemoteClient">next-mdx-remote-client</LinkList>
      <LinkList href="/license/reactVirtuoso">react-virtuoso</LinkList>
      <LinkList href="/license/reactIcons">React Icons</LinkList>
      <LinkList href="/license/dndKit">dnd-kit</LinkList>
      <LinkList href="/license/jsonwebtoken">jsonwebtoken</LinkList>
      <LinkList href="/license/htmlReactPerser">html-react-parser</LinkList>
      <LinkList href="/license/esToolkit">es-toolkit</LinkList>
      <LinkList href="/license/dotenvFlow">dotenv-flow</LinkList>
      <LinkList href="/license/betterSqlite">better-sqlite3</LinkList>
      <LinkList href="/license/argon2">argon2</LinkList>
      <LinkList href="/license/uuidv7">uuidv7</LinkList>
      <LinkList href="/license/winston">winston</LinkList>
      <LinkList href="/license/zod">zod</LinkList>
      <LinkList href="/license/zustand">zustand</LinkList>
    </ul>
  );
};
