import { ButtonHTMLAttributes, CSSProperties, memo } from 'react';

export type TabType = {
  value: unknown;
  label: string;
  disabled?: boolean;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  style?: CSSProperties;
};

const focus = 'focus:outline-none focus:ring-4 focus:ring-blue-300';
const disabled = 'disabled:cursor-not-allowed disabled:bg-blue-300';
const hover = 'hover:bg-blue-800';

export default memo(function BaseTabs(props: ButtonProps) {
  return (
    <button
      {...props}
      className={`rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white ${hover} ${focus} ${disabled}`}
    />
  );
});
