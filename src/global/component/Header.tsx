'use client';
import { getCookie } from 'cookies-next/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IoBookSharp, IoHomeSharp, IoSettingsSharp } from 'react-icons/io5';
import Button from './Button';
import SignIn from './SignIn';
import SignUp from './SignUp';

export default function Header() {
  const [existsToken, setExistsToken] = useState(false);

  useEffect(() => {
    const update = () => setExistsToken(!!getCookie('refresh_token'));
    update(); // 初回
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full bg-emerald-100 text-black">
      <nav>
        <ul className="grid grid-cols-11 items-center">
          {/* 左カラム */}
          <li className="col-span-5 flex justify-start gap-1 md:gap-4">
            <Link href="/">
              <Button category="primary" color="blue" icons={<IoHomeSharp />}>
                ホーム
              </Button>
            </Link>
            <Link href="/">
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
            {existsToken ? (
              <Link href="/">
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
