import { CSSProperties, memo } from 'react';

export type TabType = {
  value: unknown;
  label: string;
  disabled?: boolean;
};

type BaseTabsProps = {
  style?: CSSProperties;
  tabContents: Array<TabType>;
  value: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
};

const baseStyle =
  'inline-block pt-2.5 pb-1 w-40 lg:w-48 text-base lg:text-lg border border-gray-200 disabled:text-gray-400 disabled:rounded-t-lg';
const disabledStyle = 'disabled:cursor-not-allowed disabled:hover:bg-white/30';
const defStyle = `${baseStyle} ${disabledStyle} text-gray-500 bg-white/30 rounded-t-lg hover:bg-green-300/50 hover:text-gray-600`;
const selected = `${baseStyle} text-red-700 bg-green-300/25 rounded-t-lg active cursor-default`;

export default memo(function BaseTabs({ style, tabContents, value, onChange }: BaseTabsProps) {
  return (
    <ul
      style={style}
      className="flex flex-wrap border-b border-gray-200 text-center font-semibold text-gray-500"
    >
      {tabContents.map(({ value: tabVal, label, disabled }) => {
        const tabStyle = tabVal === value ? selected : defStyle;
        return (
          <li key={`${label}-${tabVal}`}>
            <button disabled={disabled} onClick={() => onChange(tabVal)} className={tabStyle}>
              {label}
            </button>
          </li>
        );
      })}
    </ul>
  );
});
