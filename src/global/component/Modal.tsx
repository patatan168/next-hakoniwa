import { isEqual } from 'es-toolkit';
import { memo, ReactNode, useEffect, useState } from 'react';
import { RxCross1 } from 'react-icons/rx';
import { createPortalIdHook } from '../function/createPortalIdHook';
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
      <div className="flex items-center justify-between rounded-t border-b border-gray-200 p-2 md:p-4">
        {header !== undefined &&
          (typeof header === 'string' ? (
            <h2 className="text-2xl text-gray-800 dark:text-white">{header}</h2>
          ) : (
            <>{header}</>
          ))}

        <button
          type="button"
          className="ml-2 inline-flex size-9 items-center justify-center gap-x-2 rounded-full border border-transparent bg-red-100/50 text-gray-800 hover:cursor-pointer hover:bg-red-200/50 focus:bg-red-200/50 focus:outline-hidden disabled:opacity-50"
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
    return <div className="px-2 py-4 md:px-4">{body}</div>;
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

const FooterModal = memo(
  function FooterModal({ footer }: { footer?: ReactNode }) {
    if (footer === undefined) {
      return <></>;
    } else {
      return (
        <div className="flex items-center rounded-b border-t border-gray-200 p-2 md:p-4">
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
    portal = true,
    open,
    openToggle,
  }: {
    header?: string | ReactNode;
    body: ReactNode;
    hidden?: boolean;
    preRender?: boolean;
    portal?: boolean;
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

    const modalContent = (
      <div
        className={`${portal ? 'fixed' : 'absolute'} pointer-events-none inset-0 z-999 flex items-center justify-center transition-all duration-300 ease-in-out ${open ? 'visible' : 'invisible'}`}
      >
        <div
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
          onKeyDown={modalFunction}
          className={`card-border pointer-events-auto flex max-h-screen max-w-screen flex-col overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-700 ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        >
          <IfComponent isRendered={isContentRendered}>
            <HeaderModal header={header} openToggle={openToggle} />
            <div className="flex-1 overflow-y-auto">
              <BodyModal body={body} />
            </div>
            <FooterModal footer={footer} />
          </IfComponent>
        </div>
      </div>
    );

    return (
      <>
        <Overlay
          className={`${open ? 'visible opacity-100' : 'invisible opacity-0'}`}
          onClick={() => openToggle(false)}
          onKeyDown={overlayFunction}
          role="button"
          tabIndex={0}
          portal={portal}
        />
        {portal ? <Portal>{modalContent}</Portal> : modalContent}
      </>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
