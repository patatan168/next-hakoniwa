import { createPortal } from 'react-dom';

type PortalProps = React.PropsWithChildren<Record<string, unknown>>;

export const createPortalIdHook =
  (id: string) =>
  ({ children }: PortalProps) => {
    const element = document.getElementById(id);

    return element !== null ? createPortal(children, element) : null;
  };
