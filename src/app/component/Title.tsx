'use client';
import META from '@/global/define/metadata';

export default function Title() {
  return (
    <>
      <h1 className="title text-5xl">{META.TITLE}</h1>
      <p className="title ml-4">{`Version: ${META.VERSION}`}</p>
      <h2 className="sub-title text-4xl">{'ターン'}</h2>
    </>
  );
}
