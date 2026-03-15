import { isEqual } from 'es-toolkit';
import { CSSProperties, memo } from 'react';

export type TabType = {
  value: unknown;
  label: string;
  icons?: React.ReactNode;
  disabled?: boolean;
};

type BaseTabsProps = {
  style?: CSSProperties;
  tabContents: Array<TabType>;
  value: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
  orientation?: 'horizontal' | 'vertical-left' | 'vertical-right';
  size?: 'sm' | 'md';
};

const baseCommon =
  'inline-block border border-gray-200 cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-white/30 font-semibold text-base lg:text-lg';

const getTabStyle = (
  isSelected: boolean,
  isDisabled: boolean,
  orientation: 'horizontal' | 'vertical-left' | 'vertical-right' = 'horizontal',
  size: 'sm' | 'md' = 'md'
) => {
  const verticalH = size === 'sm' ? 'h-24 lg:h-28' : 'h-40 lg:h-48';
  let orientationStyle = '';
  if (orientation === 'horizontal') {
    orientationStyle = 'pt-2.5 pb-1 w-40 lg:w-48 rounded-t-lg';
  } else if (orientation === 'vertical-left') {
    orientationStyle = `px-1 w-10 lg:w-12 ${verticalH} rounded-l-lg`;
  } else if (orientation === 'vertical-right') {
    orientationStyle = `px-1 w-10 lg:w-12 ${verticalH} rounded-r-lg`;
  }

  const stateStyle = isSelected
    ? 'text-red-700 bg-green-300/25 active cursor-default'
    : 'text-gray-500 bg-white/30 hover:bg-green-300/50 hover:text-gray-600';

  let disabledRounded = '';
  if (isDisabled) {
    if (orientation === 'horizontal') disabledRounded = 'disabled:rounded-t-lg';
    else if (orientation === 'vertical-left') disabledRounded = 'disabled:rounded-l-lg';
    else if (orientation === 'vertical-right') disabledRounded = 'disabled:rounded-r-lg';
  }

  return `${baseCommon} ${orientationStyle} ${stateStyle} ${disabledRounded}`;
};

export default memo(
  function BaseTabs({
    style,
    tabContents,
    value,
    onChange,
    orientation = 'horizontal',
    size = 'md',
  }: BaseTabsProps) {
    const isVertical = orientation.startsWith('vertical');
    let listClassName = `flex border-gray-200 text-center font-semibold text-gray-500 `;

    if (orientation === 'horizontal') {
      listClassName += 'flex-wrap border-b';
    } else if (orientation === 'vertical-left') {
      listClassName += 'flex-col border-r';
    } else if (orientation === 'vertical-right') {
      listClassName += 'flex-col border-l';
    }

    return (
      <ul style={style} className={listClassName}>
        {tabContents.map((tab: TabType) => {
          const { value: tabVal, label, disabled, icons } = tab;
          const isSelected = tabVal === value;
          const tabStyle = getTabStyle(isSelected, !!disabled, orientation, size);

          let rotationClass = '';
          if (orientation === 'vertical-left') {
            rotationClass = '-rotate-90 whitespace-nowrap';
          } else if (orientation === 'vertical-right') {
            rotationClass = 'rotate-90 whitespace-nowrap';
          }

          return (
            <li key={`${label}-${tabVal}`}>
              <button disabled={disabled} onClick={() => onChange(tabVal)} className={tabStyle}>
                <div className={`flex items-center justify-center ${isVertical ? 'h-full' : ''}`}>
                  <div
                    className={`${isVertical ? rotationClass : 'flex items-center justify-center'}`}
                  >
                    {icons && <div className={isVertical ? 'mb-2' : 'mr-2'}>{icons}</div>}
                    <div>{label}</div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
