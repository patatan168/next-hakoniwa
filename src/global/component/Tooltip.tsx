import { ReactNode } from 'react';

export const Tooltip = ({
  tooltipComp,
  children,
}: {
  tooltipComp: ReactNode | string;
  children: ReactNode;
}) => {
  return (
    <div className="group relative flex flex-col items-center [&>span]:hidden hover:[&>span]:block">
      <div className="flex justify-center">{children}</div>
      <span
        className={`absolute bottom-full mb-1 flex flex-col items-center whitespace-nowrap group-hover:flex`}
      >
        <span className="whitespace-no-wrap relative z-10 rounded-md bg-gray-600/85 p-2 text-sm leading-none text-white shadow-lg">
          {tooltipComp}
        </span>
        <div className="-mt-2 size-3 rotate-45 bg-gray-600" />
      </span>
    </div>
  );
};

export default Tooltip;
