import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { isEqual } from 'es-toolkit';
import { memo, Ref } from 'react';
import { Virtuoso } from 'react-virtuoso';
import Loading from './Loading';
import { TransformHTML } from './TransFormHTML';

function TurnLog({
  ref,
  className,
  style,
  logs,
  setLazyFlag,
}: {
  ref?: Ref<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
  logs:
    | (Omit<turnLogSchemaType, 'log' | 'secret_log'> & { log?: string; secret_log?: string })[]
    | undefined;
  setLazyFlag: (value: boolean) => void;
}) {
  const ready = logs !== undefined && logs.length > 0;

  if (!ready) return <Loading />;

  return (
    <div ref={ref} className={className} style={style}>
      <Virtuoso
        className="h-full w-full"
        data={logs}
        atBottomStateChange={(atBottom) => {
          setLazyFlag(atBottom);
        }}
        atBottomThreshold={700}
        itemContent={(index, log) => {
          const logText = log.secret_log ? log.secret_log : (log.log ?? '');
          return (
            <>
              {index > 0 && log.turn !== logs?.[index - 1].turn && (
                <hr className="my-2 border-gray-300 dark:border-gray-600" />
              )}
              <div className="flex gap-1">
                <div className="whitespace-nowrap">{`ターン ${log.turn} : `}</div>
                <div className="min-w-0 break-words">
                  <TransformHTML html={logText} />
                </div>
              </div>
            </>
          );
        }}
      />
    </div>
  );
}

export default memo(TurnLog, (oldProps, newProps) => isEqual(oldProps, newProps));
