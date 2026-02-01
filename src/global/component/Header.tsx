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
    <header className="bg-emerald-100">
      <nav>
        <ul className="grid grid-cols-16 items-center gap-0">
          {/* 左カラム */}
          <li className="col-span-5 flex justify-start gap-1 md:gap-4">
            <Link href="/">
              <Button
                size="xs"
                className="sm:text-sm"
                category="primary"
                color="blue"
                icons={<IoHomeSharp />}
              >
                ホーム
              </Button>
            </Link>
            <Link className="hidden sm:block" href="/">
              <Button
                size="xs"
                className="sm:text-sm"
                category="outline"
                color="sky"
                icons={<IoBookSharp />}
              >
                取説
              </Button>
            </Link>
          </li>

          {/* 中央カラム */}
          <li className="col-span-5 flex justify-center">
            <SignIn />
          </li>

          {/* 右カラム */}
          <li className="col-span-6 flex justify-end">
            {existsToken ? (
              <Link href="/">
                <Button
                  size="xs"
                  className="sm:text-sm"
                  category="outline"
                  color="orange"
                  icons={<IoSettingsSharp />}
                >
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
