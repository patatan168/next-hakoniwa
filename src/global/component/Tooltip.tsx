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
  function Tips({
    positionStyle,
    children,
    tooltipRef,
    style,
    sizeClass,
  }: {
    positionStyle: string;
    children: ReactNode;
    tooltipRef: React.RefObject<HTMLSpanElement | null>;
    style: React.CSSProperties;
    sizeClass?: string;
  }) {
    const textClass = sizeClass ?? 'sm:text-sm md:text-md lg:text-lg xl:text-xl 2xl:text-2xl';
    return (
      <span
        ref={tooltipRef}
        style={style}
        className={`absolute ${positionStyle} flex flex-col items-center whitespace-nowrap`}
      >
        <span
          className={`whitespace-no-wrap relative z-10 rounded-md bg-gray-600/85 p-2 leading-none text-white shadow-lg ${textClass}`}
        >
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
    smallText,
  }: {
    position?: string;
    tooltipComp: ReactNode | string;
    children: ReactNode;
    smallText?: boolean;
  }) {
    const sizeClass = smallText ? 'text-sm' : undefined;
    const positionStyle = GetPosition(position);
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLSpanElement>(null);
    const [adjustedStyle, setAdjustedStyle] = useState<React.CSSProperties>({
      visibility: 'hidden',
    });

    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      }
    };

    const handleMouseEnter = () => {
      updatePosition();
      setVisible(true);
      setAdjustedStyle({ visibility: 'hidden' });
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleClick = () => {
      if (visible) {
        setVisible(false);
      } else {
        updatePosition();
        setVisible(true);
        setAdjustedStyle({ visibility: 'hidden' });
      }
    };

    useEffect(() => {
      if (!visible) return;

      const timer = requestAnimationFrame(() => {
        if (tooltipRef.current) {
          const rect = tooltipRef.current.getBoundingClientRect();
          const margin = 8;
          let translateX = 0;
          let translateY = 0;

          // 画面右端・左端の判定
          if (rect.right > window.innerWidth - margin) {
            translateX = window.innerWidth - margin - rect.right;
          } else if (rect.left < margin) {
            translateX = margin - rect.left;
          }

          // 画面下端・上端の判定
          if (rect.bottom > window.innerHeight - margin) {
            translateY = window.innerHeight - margin - rect.bottom;
          } else if (rect.top < margin) {
            translateY = margin - rect.top;
          }

          setAdjustedStyle({
            visibility: 'visible',
            transform: `translate(${translateX}px, ${translateY}px)`,
          });
        }
      });

      const handleScroll = () => {
        setVisible(false);
      };
      // 画面内のいかなるスクロールでもツールチップを消すために capture: true
      window.addEventListener('scroll', handleScroll, true);

      const handleOutsideClick = (e: MouseEvent) => {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          setVisible(false);
        }
      };
      document.addEventListener('click', handleOutsideClick);

      return () => {
        cancelAnimationFrame(timer);
        window.removeEventListener('scroll', handleScroll, true);
        document.removeEventListener('click', handleOutsideClick);
      };
    }, [visible, coords]);

    return (
      <div
        ref={triggerRef}
        className="relative inline-block h-full w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
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
              <Tips
                tooltipRef={tooltipRef}
                positionStyle={positionStyle}
                style={adjustedStyle}
                sizeClass={sizeClass}
              >
                {tooltipComp}
              </Tips>
            </div>,
            document.body
          )}
      </div>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

export default Tooltip;
