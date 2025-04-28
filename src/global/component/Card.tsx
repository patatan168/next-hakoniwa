import { isEqual } from 'es-toolkit';
import { CSSProperties, memo, ReactNode, Ref } from 'react';

export const Card = memo(
  function card({
    children,
    ref,
    style,
  }: {
    children?: ReactNode;
    ref?: Ref<HTMLDivElement>;
    style?: CSSProperties;
  }) {
    return (
      <div
        ref={ref}
        style={style}
        className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        {children}
      </div>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
