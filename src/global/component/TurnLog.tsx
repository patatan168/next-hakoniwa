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
  setLazyFlag,
}: {
  ref?: Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  logs: turnLogSchemaType[] | undefined;
  setLazyFlag: (value: boolean) => void;
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
        style={style}
        data={logs}
        atBottomStateChange={(atBottom) => {
          setLazyFlag(atBottom);
        }}
        atBottomThreshold={700}
        itemContent={(index, log) => (
          <>
            {index > 0 && log.turn !== logs?.[index - 1].turn && (
              <hr className="my-2 border-gray-300 dark:border-gray-600" />
            )}
            <div className="grid auto-cols-max grid-flow-col gap-0">
              <div>{`ターン ${log.turn} : `}</div>
              <div>
                <TransformHTML html={log.log} />
              </div>
            </div>
          </>
        )}
      />
    </div>
  );
}

export default memo(TurnLog, (oldProps, newProps) => isEqual(oldProps, newProps));
