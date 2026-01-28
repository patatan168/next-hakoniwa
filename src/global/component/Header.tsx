'use client';
import SignIn from '@/app/component/SignIn';
import SignUp from '@/app/component/SignUp';
import { getCookie } from 'cookies-next/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IoBookSharp, IoHomeSharp, IoSettingsSharp } from 'react-icons/io5';
import Button from './Button';

export default function Header() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const existsToken = isClient ? !!getCookie('refresh_token') : false;

  return (
    <header className="fixed top-0 left-0 w-full bg-emerald-100 text-black">
      <nav>
        <ul className="grid grid-cols-11 items-center">
          {/* 左カラム */}
          <li className="col-span-5 flex justify-start gap-1 md:gap-4">
            <Link href="/" className="hover:text-gray-300">
              <Button category="primary" color="blue" icons={<IoHomeSharp />}>
                ホーム
              </Button>
            </Link>
            <Link href="/" className="hover:text-gray-300">
              <Button category="outline" color="sky" icons={<IoBookSharp />}>
                取説
              </Button>
            </Link>
          </li>

          {/* 中央カラム */}
          <li className="col-span-3 flex justify-start">
            <SignIn />
          </li>

          {/* 右カラム */}
          <li className="col-span-3 flex justify-end">
            {!isClient ? (
              <div className="h-10 w-32" />
            ) : existsToken ? (
              <Link href="/" className="hover:text-gray-300">
                <Button category="outline" color="orange" icons={<IoSettingsSharp />}>
                  アカウント
                </Button>
              </Link>
            ) : (
              <SignUp />
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
