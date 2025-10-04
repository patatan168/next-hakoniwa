import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { isEqual } from 'es-toolkit';
import { memo, Ref, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import Loading from './Loading';
import { TransformHTML } from './TransFormHTML';

function TurnLog({
  ref,
  style,
  logs,
}: {
  ref?: Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  logs: turnLogSchemaType[] | undefined;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (logs !== undefined && logs.length > 0) {
      setReady(true);
    }
  }, [logs]);

  if (!ready) return <Loading />;

  return (
    <div ref={ref}>
      <Virtuoso
        key={logs?.length ?? 0}
        style={style}
        data={logs}
        itemContent={(_, log) => (
          <div className="grid auto-cols-max grid-flow-col gap-0">
            <div>{`ターン ${log.turn} : `}</div>
            <div>
              <TransformHTML html={log.log} />
            </div>
          </div>
        )}
      />
    </div>
  );
}

export default memo(TurnLog, (oldProps, newProps) => isEqual(oldProps, newProps));
