import { CSSProperties, ReactNode, Ref } from 'react';

export const Card = ({
  children,
  ref,
  style,
}: {
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  style?: CSSProperties;
}) => {
  return (
    <div
      ref={ref}
      style={style}
      className="rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800"
    >
      {children}
    </div>
  );
};
