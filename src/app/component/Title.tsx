'use client';
import META from '@/global/define/metadata';

export default function Title() {
  return (
    <>
      <h1 className="title ml-1 text-5xl">{META.TITLE}</h1>
      <p className="title ml-5">{`Version: ${META.VERSION}`}</p>
    </>
  );
}
