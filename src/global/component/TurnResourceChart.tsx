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
          const diff = latest[metric.key] - first[metric.key];
          const diffSign = diff >= 0 ? '+' : '';

          return (
            <div key={metric.key} className="rounded-md border border-gray-200 bg-white/70 p-2">
              <div className="mb-1 flex items-baseline justify-between">
                <p className="text-sm font-bold text-gray-700">{metric.label}</p>
                <p className="font-mono text-sm text-gray-700">{`${diffSign}${formatNumber(diff)}`}</p>
              </div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-20 w-full">
                <line x1="0" y1="100" x2="100" y2="100" stroke="#d1d5db" strokeWidth="1" />
                <polyline
                  fill="none"
                  stroke={metric.stroke}
                  strokeWidth="2"
                  points={points}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="mt-1 grid grid-cols-2 text-xs text-gray-600">
                <span>{`最小: ${formatNumber(minValue)}`}</span>
                <span className="text-right">{`最大: ${formatNumber(maxValue)}`}</span>
                <span>{`最新: ${formatNumber(latest[metric.key])}`}</span>
                <span className="text-right">{`初回: ${formatNumber(first[metric.key])}`}</span>
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
