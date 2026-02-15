import { isEqual } from 'es-toolkit';
import { memo, ReactNode, useMemo } from 'react';

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
      <span
        className={`absolute ${positionStyle} z-[1001] hidden flex-col items-center whitespace-nowrap group-hover:flex`}
      >
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
    return (
      <div className="group relative inline-block h-full w-full">
        <Children>{children}</Children>
        <Tips positionStyle={positionStyle}>{tooltipComp}</Tips>
      </div>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

export default Tooltip;
