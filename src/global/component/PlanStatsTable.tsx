import { PlanStatItem } from '@/global/store/api/auth/planStats';

type Props = {
  className?: string;
  data?: PlanStatItem[];
};

export default function PlanStatsTable({ className, data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className ?? ''}`}>
        まだ計画の実行記録がありません。
      </div>
    );
  }

  return (
    <div className={`overflow-y-auto ${className ?? ''}`}>
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-teal-50">
          <tr>
            <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
              計画名
            </th>
            <th className="border-b border-gray-300 px-3 py-2 text-right font-semibold text-gray-700">
              成功回数
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ plan, name, count }) => (
            <tr key={plan} className="border-b border-gray-100 hover:bg-teal-50/50">
              <td className="px-3 py-2 text-gray-800">{name}</td>
              <td className="px-3 py-2 text-right font-mono text-gray-800">
                {count.toLocaleString('ja-JP')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
