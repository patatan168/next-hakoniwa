import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import Loading from './Loading';
import { TransformHTML } from './TransFormHTML';

function TurnLog({
  style,
  logs,
}: {
  style?: React.CSSProperties;
  logs: turnLogSchemaType[] | undefined;
}) {
  console.warn(logs);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (logs !== undefined && logs.length > 0) {
      setReady(true);
    }
  }, [logs]);

  if (!ready) return <Loading />;

  return (
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
  );
}

export default TurnLog;
