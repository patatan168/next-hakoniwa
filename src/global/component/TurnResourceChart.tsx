import { TurnResourceHistory } from '@/db/kysely';

type Props = {
  className?: string;
  data?: Omit<TurnResourceHistory, 'uuid'>[];
};

type MetricConfig = {
  key: 'population' | 'food' | 'money';
  label: string;
  stroke: string;
};

const METRICS: MetricConfig[] = [
  { key: 'population', label: '人口', stroke: '#1d4ed8' },
  { key: 'food', label: '食料', stroke: '#16a34a' },
  { key: 'money', label: '資金', stroke: '#dc2626' },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat('ja-JP').format(value);
}

function escapeCsvValue(value: string | number): string {
  const raw = String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function toCsv(data: Omit<TurnResourceHistory, 'uuid'>[]): string {
  const header = ['turn', 'population', 'food', 'money'];
  const lines = data.map((row) => [row.turn, row.population, row.food, row.money]);
  return [header, ...lines]
    .map((line) => line.map((value) => escapeCsvValue(value)).join(','))
    .join('\n');
}

function downloadCsv(data: Omit<TurnResourceHistory, 'uuid'>[]) {
  const csv = toCsv(data);
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(
    2,
    '0'
  )}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

  link.href = url;
  link.download = `turn-resource-history-${ts}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildPolyline(values: number[]): string {
  if (values.length <= 1) return '0,100 100,100';

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  // 値を0-100のSVG座標へ正規化（全値同一の場合は0除算を避ける）
  const diff = Math.max(1, maxValue - minValue);

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - ((value - minValue) / diff) * 100;
      return `${x},${y}`;
    })
    .join(' ');
}

export default function TurnResourceChart({ className, data }: Props) {
  if (!data || data.length === 0) return null;

  const latest = data[data.length - 1];
  const first = data[0];

  return (
    <div className={className}>
      <div className="flex justify-end px-2 pb-1">
        <button
          type="button"
          onClick={() => downloadCsv(data)}
          className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100"
        >
          CSV出力
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 p-2">
        {METRICS.map((metric) => {
          const values = data.map((item) => item[metric.key]);
          const points = buildPolyline(values);
          const minValue = Math.min(...values);
          const maxValue = Math.max(...values);
          const latestValue = latest[metric.key];
          const diff = data.length >= 2 ? latestValue - data[data.length - 2][metric.key] : 0;
          const diffSign = diff >= 0 ? '+' : '';
          const diffPositive = diff >= 0;

          return (
            <div
              key={metric.key}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white/80 shadow-sm"
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  {metric.label}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-base font-bold text-gray-800">
                    {formatNumber(latestValue)}
                  </span>
                  <span
                    className={`rounded px-1 py-0.5 font-mono text-xs font-semibold ${
                      diffPositive ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {`${diffSign}${formatNumber(diff)}`}
                  </span>
                </div>
              </div>
              {/* グラフ */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-16 w-full">
                <polyline
                  fill="none"
                  stroke={metric.stroke}
                  strokeWidth="2.5"
                  points={points}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {/* フッター */}
              <div className="flex justify-between border-t border-gray-100 px-3 py-1.5 text-xs text-gray-400">
                <span>{`最小 ${formatNumber(minValue)}`}</span>
                <span>{`最大 ${formatNumber(maxValue)}`}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="px-2 pb-2 text-xs text-gray-600">
        {`表示範囲: ターン${first.turn}〜${latest.turn}（最新100ターン）`}
      </p>
    </div>
  );
}
