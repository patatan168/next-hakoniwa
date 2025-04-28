import { isEqual } from 'es-toolkit';
import { ButtonHTMLAttributes, memo, useMemo } from 'react';

const defaultStyle =
  'rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white cursor-pointer';
const focus = 'focus:outline-hidden focus:ring-4 focus:ring-blue-300';
const disabled = 'disabled:cursor-not-allowed disabled:bg-blue-300';
const hover = 'hover:bg-blue-800';
const ButtonClassName = (className: string | undefined) =>
  useMemo(() => {
    if (className !== undefined && className !== '') {
      return `${defaultStyle} ${hover} ${focus} ${disabled} ${className}`;
    } else {
      return `${defaultStyle} ${hover} ${focus} ${disabled}`;
    }
  }, [className]);

export default memo(
  function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={ButtonClassName(props.className)} />;
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
