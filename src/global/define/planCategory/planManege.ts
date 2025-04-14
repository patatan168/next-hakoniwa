import { changeDataArgs, planType } from '../planType';

export const financing: planType = {
  type: 'financing',
  category: '運営',
  name: '資金繰り',
  otherIsland: false,
  immediate: false,
  mapType: 'none',
  cost: 0,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ turn, info }: changeDataArgs) {
    const { toIsland } = info;
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    toIsland.money += 100;
    const log = `${toIsland.island_name}島で資金繰りが行われました。`;
    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
