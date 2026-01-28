import { isEqual } from 'es-toolkit';
import { HTMLAttributes, memo } from 'react';
import { createPortalIdHook } from '../function/createPortalIdHook';

const Portal = createPortalIdHook('overlay-root');

export default memo(
  function Overlay(props: HTMLAttributes<HTMLDivElement>) {
    const overlay =
      'transition-all duration-300 ease-in-out fixed inset-0 z-998 h-full w-full bg-black/30';
    return (
      <Portal>
        <div tabIndex={-1} {...props} className={`${overlay} ${props.className}`} />
      </Portal>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
