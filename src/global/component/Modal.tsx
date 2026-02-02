import { isEqual } from 'es-toolkit';
import { memo, ReactNode, useEffect, useState } from 'react';
import { RxCross1 } from 'react-icons/rx';
import { createPortalIdHook } from '../function/createPortalIdHook';
import { Card } from './Card';
import IfComponent from './IfComponent';
import Overlay from './Overlay';

const Portal = createPortalIdHook('modal-root');

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
    return <div className="px-0 py-4 md:px-4">{body}</div>;
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

export default memo(
  function Modal({
    header,
    body,
    footer,
    hidden = false,
    preRender = false,
    open,
    openToggle,
  }: {
    header?: string | ReactNode;
    body: ReactNode;
    hidden?: boolean;
    preRender?: boolean;
    footer?: ReactNode;
    open: boolean;
    openToggle: ((value: boolean) => void) | (() => void);
  }) {
    const [mounted, setMounted] = useState(false);
    const [firstOpen, setFirstOpen] = useState(false);
    const overlayFunction = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.code === 'Enter' || event.key === 'Enter') {
        openToggle(false);
      }
      if (event.code === 'Escape' || event.key === 'Escape') {
        openToggle(false);
      }
    };
    const modalFunction = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.code === 'Escape' || event.key === 'Escape') {
        openToggle(false);
      }
    };
    const isContentRendered = hidden ? preRender || firstOpen : (preRender || firstOpen) && open;

    useEffect(() => {
      const timer = setTimeout(() => {
        setMounted(true);
      }, 0);
      return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
      const timer = setTimeout(() => {
        if (open && !firstOpen) {
          setFirstOpen(true);
        }
      }, 0);
      return () => clearTimeout(timer);
    }, [open]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          openToggle(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [openToggle]);

    // Prevent SSR issues
    if (!mounted || typeof document === 'undefined') return null;

    return (
      <>
        <Overlay
          className={`${open ? 'visible opacity-100' : 'invisible opacity-0'}`}
          onClick={() => openToggle(false)}
          onKeyDown={overlayFunction}
          role="button"
          tabIndex={0}
        />
        <Portal>
          <div
            aria-modal="true"
            role="dialog"
            tabIndex={-1}
            onKeyDown={modalFunction}
            className={`fixed top-1/2 left-1/2 z-999 max-w-[99vw] -translate-x-1/2 -translate-y-1/2 overflow-x-hidden overflow-y-auto rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out dark:bg-gray-700 ${open ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0'}`}
          >
            <IfComponent isRendered={isContentRendered}>
              <Card>
                <HeaderModal header={header} openToggle={openToggle} />
                <BodyModal body={body} />
                <FooterModal footer={footer} />
              </Card>
            </IfComponent>
          </div>
        </Portal>
      </>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
