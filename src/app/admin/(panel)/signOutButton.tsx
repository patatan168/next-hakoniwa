/**
 * @module admin/sign-out-button
 * @description 管理者ログアウトボタン。
 */
'use client';

import Button from '@/global/component/Button';
import { fetcher } from '@/global/function/fetch/fetch';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      type="button"
      color="gray"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetcher('/api/admin/sign-out', { method: 'DELETE' });
          router.replace('/admin');
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      ログアウト
    </Button>
  );
}
