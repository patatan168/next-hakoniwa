'use client';
import Button from '@/global/component/Button';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { signOutStore } from '@/global/store/api/sign-out';
import Link from 'next/link';
import { useEffect } from 'react';
import { IoHomeSharp } from 'react-icons/io5';

const DELETE_HEADER = {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  },
};

export default function Page() {
  const { fetch } = useClientFetch(signOutStore);

  useEffect(() => {
    fetch({ ...DELETE_HEADER });
  }, []);

  return (
    <>
      <div className="text-center">
        <h1 className="rounded-md bg-blue-100 py-6 text-xl font-bold text-gray-800">
          サインアウトしました
        </h1>
        <Link href="/">
          <Button category="primary" className="my-2" color="blue" icons={<IoHomeSharp />}>
            ホーム
          </Button>
        </Link>
      </div>
    </>
  );
}
