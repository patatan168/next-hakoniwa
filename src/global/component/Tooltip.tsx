import { isEqual } from 'es-toolkit';
import { memo, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const GetPosition = (position?: string) =>
  useMemo(() => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2';
      case 'left':
        return 'right-full -bottom-1/4 mr-2';
      case 'right':
        return 'left-full -bottom-1/4 ml-2';
      case 'top-left':
        return 'right-full bottom-1/2 mr-2';
      case 'top-right':
        return 'left-full bottom-1/2 ml-2';
      case 'bottom-left':
        return 'right-full top-1/2 mr-2';
      case 'bottom-right':
        return 'left-full top-1/2 ml-2';
      default:
        return 'bottom-full mb-2';
    }
  }, [position]);

const Children = memo(
  function Children({ children }: { children: ReactNode }) {
    return <>{children}</>;
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

const Tips = memo(
  function Tips({ positionStyle, children }: { positionStyle: string; children: ReactNode }) {
    return (
      <span className={`absolute ${positionStyle} flex flex-col items-center whitespace-nowrap`}>
        <span className="whitespace-no-wrap md:text-md relative z-10 rounded-md bg-gray-600/85 p-2 leading-none text-white shadow-lg sm:text-sm lg:text-lg xl:text-xl 2xl:text-2xl">
          {children}
        </span>
      </span>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

export const Tooltip = memo(
  function ToolTip({
    position,
    tooltipComp,
    children,
  }: {
    position?: string;
    tooltipComp: ReactNode | string;
    children: ReactNode;
  }) {
    const positionStyle = GetPosition(position);
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      }
    };

    const handleMouseEnter = () => {
      updatePosition();
      setVisible(true);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    useEffect(() => {
      if (!visible) return;
      const handleScroll = () => {
        setVisible(false);
      };
      // 画面内のいかなるスクロールでもツールチップを消すために capture: true
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
      };
    }, [visible]);

    return (
      <div
        ref={triggerRef}
        className="relative inline-block h-full w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Children>{children}</Children>
        {visible &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className="pointer-events-none fixed z-[1001]"
              style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
                height: coords.height,
              }}
            >
              <Tips positionStyle={positionStyle}>{tooltipComp}</Tips>
            </div>,
            document.body
          )}
      </div>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

export default Tooltip;
