/**
 * @module PlanStatsTable
 * @description 計画統計・ミサイル統計をテーブル表示するコンポーネント。
 */
import { MissileStatData } from '@/global/store/api/auth/missileStats';
import { PlanStatItem } from '@/global/store/api/auth/planStats';

type Props = {
  className?: string;
  data?: PlanStatItem[];
  missileStats?: MissileStatData;
};

export default function PlanStatsTable({ className, data, missileStats }: Props) {
  const hasStats = (data && data.length > 0) || missileStats;

  const hasDestroyedMapStats = (missileStats?.destroyed_maps.length ?? 0) > 0;
  const hasKilledMonsterStats = (missileStats?.killed_monsters.length ?? 0) > 0;

  if (!hasStats) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className ?? ''}`}>
        まだ計画の実行記録がありません。
      </div>
    );
  }

  return (
    <div className={`overflow-y-auto ${className ?? ''}`}>
      {missileStats && (
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-rose-50">
            <tr>
              <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                ミサイル戦績
              </th>
              <th className="border-b border-gray-300 px-3 py-2 text-right font-semibold text-gray-700">
                累計数
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 hover:bg-rose-50/50">
              <td className="px-3 py-2 text-gray-800">怪獣討伐数</td>
              <td className="px-3 py-2 text-right font-mono text-gray-800">
                {missileStats.monster_kill.toLocaleString('ja-JP')}
              </td>
            </tr>
            <tr className="border-b border-gray-100 hover:bg-rose-50/50">
              <td className="px-3 py-2 text-gray-800">都市・施設破壊数</td>
              <td className="px-3 py-2 text-right font-mono text-gray-800">
                {missileStats.city_kill.toLocaleString('ja-JP')}
              </td>
            </tr>
            {hasDestroyedMapStats && (
              <tr className="border-b border-gray-200 bg-rose-50/60">
                <td colSpan={2} className="px-3 py-2 font-semibold text-rose-900">
                  破壊したマップ内訳
                </td>
              </tr>
            )}
            {missileStats.destroyed_maps.map((item) => (
              <tr
                key={`destroyed-${item.type}`}
                className="border-b border-gray-100 hover:bg-rose-50/50"
              >
                <td className="px-3 py-2 text-gray-800">{item.name}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-800">
                  {item.count.toLocaleString('ja-JP')}
                </td>
              </tr>
            ))}
            {hasKilledMonsterStats && (
              <tr className="border-b border-gray-200 bg-rose-50/60">
                <td colSpan={2} className="px-3 py-2 font-semibold text-rose-900">
                  討伐した怪獣内訳
                </td>
              </tr>
            )}
            {missileStats.killed_monsters.map((item) => (
              <tr
                key={`monster-${item.type}`}
                className="border-b border-gray-100 hover:bg-rose-50/50"
              >
                <td className="px-3 py-2 text-gray-800">{item.name}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-800">
                  {item.count.toLocaleString('ja-JP')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data && data.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-teal-50">
            <tr>
              <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                計画名
              </th>
              <th className="border-b border-gray-300 px-3 py-2 text-right font-semibold text-gray-700">
                実行回数
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
      )}
    </div>
  );
}
