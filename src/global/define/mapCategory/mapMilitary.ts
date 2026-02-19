import { mapArrayConverter, wideDamage } from '@/global/function/island';
import { getBaseLog } from '@/global/function/turnProgress';
import { logSelfCrash } from '../logType';
import { mapType } from '../mapType';

export const missile: mapType = {
  type: 'missile',
  fakeType: 'fake_forest',
  baseLand: 'plains',
  name: 'ミサイル基地',
  imgPath: '/img/military/missile.gif',
  defVal: 0,
  maxVal: 200,
  level: [0, 20, 60, 120, 200],
  showLevel: true,
};
export const submarineMissile: mapType = {
  type: 'submarine_missile',
  fakeType: 'sea',
  baseLand: 'submarine_missile',
  name: '海底基地',
  imgPath: '/img/military/submarine_missile.gif',
  defVal: 0,
  maxVal: 200,
  level: [0, 50, 200],
  coefficient: 1,
  showLevel: true,
};
export const defenseBase: mapType = {
  type: 'defense_base',
  fakeType: 'fake_forest',
  baseLand: 'plains',
  name: '防衛施設',
  imgPath: '/img/military/defense_base.gif',
  defVal: 0,
  maxVal: 0,
  event: function ({ x, y, turn, fromUuid, island }) {
    const mapInfo = island.island_info[mapArrayConverter(x, y)];
    if (mapInfo.landValue < this.maxVal) {
      const baseLog = getBaseLog(turn, island);
      const selfCrash = logSelfCrash(island, x, y);
      const selfCrashLog = { ...baseLog, log: selfCrash, secret_log: selfCrash };
      const damageLog = wideDamage(fromUuid, x, y, turn);
      return [selfCrashLog, ...damageLog];
    }
  },
};
export const fakeDefenseBase: mapType = {
  type: 'fake_defense_base',
  fakeType: 'fake_forest',
  baseLand: 'plains',
  name: 'ハリボテ',
  imgPath: '/img/military/defense_base.gif',
  defVal: 0,
  maxVal: 0,
};
