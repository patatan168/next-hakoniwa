import { isEqual } from 'es-toolkit';
import { memo, ReactNode, useMemo } from 'react';
import { RxCross1 } from 'react-icons/rx';
import { Card } from './Card';
import Overlay from './Overlay';

const HeaderModal = memo(
  function HeaderModal({
    header,
    openToggle,
  }: {
    header?: string | ReactNode;
    openToggle: ((value: boolean) => void) | (() => void);
  }) {
    return (
      <div className="flex items-center justify-between rounded-t border-b border-gray-200 p-4 dark:border-gray-600">
        {header !== undefined &&
          (typeof header === 'string' ? (
            <h2 className="text-2xl text-gray-800 dark:text-white">{header}</h2>
          ) : (
            <>{header}</>
          ))}

        <button
          type="button"
          className="inline-flex size-9 items-center justify-center gap-x-2 rounded-full border border-transparent bg-red-100/50 text-gray-800 hover:cursor-pointer hover:bg-red-200/50 focus:bg-red-200/50 focus:outline-hidden disabled:opacity-50 dark:bg-red-500/50 dark:text-white dark:hover:bg-red-400/50 dark:focus:bg-red-400/50"
          aria-label="Close"
          onClick={() => openToggle(false)}
        >
          <span className="sr-only">Close</span>
          <RxCross1 />
        </button>
      </div>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

const BodyModal = memo(
  function BodyModal({ body }: { body: ReactNode }) {
    return <div className="space-y-3 p-4">{body}</div>;
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

const FooterModal = memo(
  function FooterModal({ footer }: { footer?: ReactNode }) {
    if (footer === undefined) {
      return <></>;
    } else {
      return (
        <div className="flex items-center rounded-b border-t border-gray-200 p-4 dark:border-gray-600">
          {footer}
        </div>
      );
    }
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

const HiddenStyle = ({ open, hidden }: { open: boolean; hidden: boolean }) =>
  useMemo(() => {
    if (open || !hidden) return undefined;

    return {
      display: 'none',
    };
  }, [open, hidden]);

export const Modal = memo(
  function Modal({
    header,
    body,
    footer,
    hidden = false,
    open,
    openToggle,
  }: {
    header?: string | ReactNode;
    body: ReactNode;
    hidden?: boolean;
    footer?: ReactNode;
    open: boolean;
    openToggle: ((value: boolean) => void) | (() => void);
  }) {
    if (!open && !hidden) {
      return <></>;
    }

    const enterFunction = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.code === 'Enter') {
        openToggle(false);
      }
    };

    return (
      <>
        <Overlay
          style={HiddenStyle({ open, hidden })}
          onClick={() => openToggle(false)}
          onKeyDown={enterFunction}
          role="button"
          tabIndex={0}
        />
        <div
          style={HiddenStyle({ open, hidden })}
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
          className="fixed top-1/2 left-1/2 z-51 -translate-x-1/2 -translate-y-1/2 overflow-x-hidden overflow-y-auto rounded-lg bg-white shadow-sm dark:bg-gray-700"
        >
          <Card>
            <HeaderModal header={header} openToggle={openToggle} />
            <BodyModal body={body} />
            <FooterModal footer={footer} />
          </Card>
        </div>
      </>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
