import { ReactNode } from 'react';

const getPosition = (position?: string) => {
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
};

export const Tooltip = ({
  position,
  tooltipComp,
  children,
}: {
  position?: string;
  tooltipComp: ReactNode | string;
  children: ReactNode;
}) => {
  const positionStyle = getPosition(position);
  return (
    <div className="group relative flex flex-col items-center [&>span]:hidden [&>span]:hover:block">
      <div className="flex justify-center">{children}</div>
      <span
        className={`absolute ${positionStyle} flex flex-col items-center whitespace-nowrap group-hover:flex`}
      >
        <span className="whitespace-no-wrap relative z-10 rounded-md bg-gray-600/85 p-2 text-sm leading-none text-white shadow-lg">
          {tooltipComp}
        </span>
      </span>
    </div>
  );
};

export default Tooltip;
