import { getBaseLog } from '@/global/function/turnProgress';
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
  changeData: function ({ turn, info }: changeDataArgs) {
    const { toIsland } = info;
    const baseLog = getBaseLog(turn, toIsland);
    toIsland.money -= this.cost;
    const log = `${toIsland.island_name}島で資金繰りが行われました。`;
    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
