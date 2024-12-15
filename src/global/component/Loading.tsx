export default function Loading() {
  return (
    <div className="mt-3 flex justify-center pb-3" aria-label="読み込み中">
      <div className="size-2 animate-ping rounded-full bg-green-600"></div>
      <div className="mx-4 size-2 animate-ping rounded-full bg-green-600"></div>
      <div className="size-2 animate-ping rounded-full bg-green-600"></div>
    </div>
  );
}
