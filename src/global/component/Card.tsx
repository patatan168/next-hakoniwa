import { isEqual } from 'es-toolkit';
import { memo, ReactNode, Ref } from 'react';

const defaultClassName = 'card-border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export const Card = memo(
  function card(props: CardProps) {
    return (
      <div {...props} className={`${props.className ?? ''} ${defaultClassName}`}>
        {props.children}
      </div>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
