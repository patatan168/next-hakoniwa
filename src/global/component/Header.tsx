'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { IoBookSharp, IoHomeSharp } from 'react-icons/io5';
import { getCookie } from '../function/cookie';
import { useClientFetch } from '../function/fetch/clientFetch';
import { turnStore } from '../store/api/public/turn';
import Button from './Button';
import SignIn from './SignIn';

const AccountMenu = dynamic(() => import('./AccountMenu'), { ssr: false });
const SignUp = dynamic(() => import('./SignUp'), { ssr: false });

export default function Header() {
  const [existsToken, setExistsToken] = useState<boolean | null>(null);
  const { data, startPolling } = useClientFetch(turnStore);
  useEffect(() => {
    startPolling();
  }, []);

  useEffect(() => {
    const update = () => setExistsToken(!!getCookie('__Host-exists_refresh_token'));
    update(); // 初回
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="bg-emerald-100">
      <nav>
        <div className="grid grid-cols-3 grid-rows-none items-start gap-0">
          {/* 左カラム */}
          <div>
            <div className="flex justify-start gap-1">
              <Button
                href="/"
                size="xs"
                className="sm:text-sm"
                category="primary"
                color="blue"
                icons={<IoHomeSharp />}
              >
                ホーム
              </Button>
              <Button
                href="/"
                size="xs"
                className="hidden sm:block sm:text-sm"
                category="outline"
                color="sky"
                icons={<IoBookSharp />}
              >
                取説
              </Button>
            </div>
          </div>
          <div className="sub-title col-span-3 col-start-1 row-start-2 mx-1 min-w-[3em] text-base font-semibold text-shadow-xs/10">
            {`ターン${data.get ? data.get.turn : ''}`}
            <span className="ml-[0.5em]">{`(次回の更新まであと)`}</span>
          </div>

          {/* 中央カラム */}
          <div className="flex justify-center">
            <SignIn />
          </div>

          {/* 右カラム */}
          <div className="flex justify-end">
            {existsToken === null ? null : existsToken ? <AccountMenu /> : <SignUp />}
          </div>
        </div>
      </nav>
    </header>
  );
}
