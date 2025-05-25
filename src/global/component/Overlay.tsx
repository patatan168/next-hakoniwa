import { isEqual } from 'es-toolkit';
import { HTMLAttributes, memo } from 'react';

export default memo(
  function Overlay(props: HTMLAttributes<HTMLDivElement>) {
    const overlay =
      'fixed inset-0 z-50 h-full w-full overflow-x-hidden overflow-y-auto bg-black/30';
    return <div {...props} className={`${overlay} ${props.className}`} />;
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
