import { getBaseLog } from '@/global/function/turnProgress';
import { islandDataGetSet } from '@/global/store/turnProgress';
import { logNoCoordinateCommonDev } from '../logType';
import { changeDataArgs, planType } from '../planType';

export const financing: planType = {
  planNo: 998,
  type: 'financing',
  coordinate: false,
  category: '運営',
  name: '資金繰り',
  otherIsland: false,
  immediate: false,
  mapType: 'none',
  cost: -100,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    const baseLog = getBaseLog(turn, toIsland);
    toIsland.money -= this.cost;
    const log = logNoCoordinateCommonDev(toIsland, this);
    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
