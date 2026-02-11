import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { isEqual } from 'es-toolkit';
import { memo, Ref } from 'react';
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
  const ready = logs !== undefined && logs.length > 0;

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
            <div className="flex gap-1">
              <div className="whitespace-nowrap">{`ターン ${log.turn} : `}</div>
              <div className="min-w-0 break-words">
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
