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
  const { data, fetch } = useClientFetch(turnStore);
  useEffect(() => {
    fetch({ method: 'GET' }, { refresh: true });
  }, [fetch]);

  useEffect(() => {
    const update = () => setExistsToken(!!getCookie('__Host-exists_refresh_token'));
    update(); // 初回
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const [nextUpdateStr, setNextUpdateStr] = useState<string>('');

  useEffect(() => {
    // 毎秒更新時刻を計算して表示を更新する
    const updateNextTime = () => {
      const turnState = data.get;
      if (!turnState || !turnState.next_updated_at) {
        setNextUpdateStr('(自動更新は無効です)');
        return;
      }

      const remainMs = turnState.next_updated_at - Date.now();

      // 次の更新時刻の10秒前から更新予定時刻まで、毎秒チェック
      if (remainMs > 0 && remainMs <= 10000) {
        fetch({ method: 'GET' }, { refresh: true });
      }

      // 更新予定時刻を過ぎた（ラグ発生）場合
      if (remainMs <= 0) {
        const elapsedSec = Math.floor(Math.abs(remainMs) / 1000);
        if (elapsedSec <= 10) {
          // 最初の10秒間は毎秒更新を確認
          fetch({ method: 'GET' }, { refresh: true });
        } else if (elapsedSec <= 60) {
          // その後の50秒間（計60秒まで）は5秒ごとに更新を確認
          if (elapsedSec % 5 === 0) {
            fetch({ method: 'GET' }, { refresh: true });
          }
        } else {
          // 60秒を超えた場合、一度だけfetchして終了
          // data.get が更新されれば remainMs がリセットされるためループはしない
          fetch({ method: 'GET' }, { refresh: true });
        }
      }

      if (remainMs <= 0) {
        setNextUpdateStr('(更新処理中...)');
        return;
      }

      const h = Math.floor(remainMs / 3600000);
      const m = Math.floor((remainMs % 3600000) / 60000);
      const s = Math.floor((remainMs % 60000) / 1000);
      if (h > 0) {
        setNextUpdateStr(
          `(次回の更新まであと ${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')})`
        );
      } else {
        setNextUpdateStr(
          `(次回の更新まであと ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')})`
        );
      }
    };

    updateNextTime();
    const id = setInterval(updateNextTime, 1000);
    return () => clearInterval(id);
  }, [data.get]);

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
                href="/manual"
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
            <span className="ml-[0.5em]">{nextUpdateStr || '(次回の更新まであと)'}</span>
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
