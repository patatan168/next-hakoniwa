/**
 * @module Overlay
 * @description 画面全体を覆うオーバーレイコンポーネント。
 */
import { isEqual } from 'es-toolkit';
import { HTMLAttributes, memo } from 'react';
import { createPortalIdHook } from '../function/createPortalIdHook';

const Portal = createPortalIdHook('overlay-root');

export default memo(
  function Overlay({
    portal = true,
    ...props
  }: HTMLAttributes<HTMLDivElement> & { portal?: boolean }) {
    const overlay = `transition-all duration-300 ease-in-out inset-0 z-998 h-full w-full bg-black/30 ${portal ? 'fixed' : 'absolute'}`;

    if (portal) {
      return (
        <Portal>
          <div tabIndex={-1} {...props} className={`${overlay} ${props.className}`} />
        </Portal>
      );
    } else {
      return <div tabIndex={-1} {...props} className={`${overlay} ${props.className}`} />;
    }
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
