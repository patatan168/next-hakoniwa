import { mapType, monsterMove } from '../mapType';

export const inora: mapType = {
  type: 'inora',
  baseLand: 'monster',
  name: '怪獣いのら',
  imgPath: '/img/monster/inora.gif',
  defVal: 1,
  maxVal: 2,
  unit: '体力',
  unitType: 'before',
  minPopPopulation: 100000,
  exp: 5,
  bounty: 400,
  maxMoveDistance: 1,
  event: function ({ x, y, turn, fromIsland }) {
    return monsterMove(x, y, turn, fromIsland);
  },
};
export const mekaInora: mapType = {
  type: 'meka_inora',
  baseLand: 'monster',
  name: '怪獣メカいのら',
  imgPath: '/img/monster/meka_inora.gif',
  defVal: 2,
  maxVal: 2,
  unit: '体力',
  unitType: 'before',
  exp: 5,
  bounty: 0,
  maxMoveDistance: 1,
  event: function ({ x, y, turn, fromIsland }) {
    return monsterMove(x, y, turn, fromIsland);
  },
};
export const inoraGhost: mapType = {
  type: 'inora_ghost',
  baseLand: 'monster',
  name: '怪獣いのらゴースト',
  imgPath: '/img/monster/inora_ghost.gif',
  defVal: 1,
  maxVal: 1,
  unit: '体力',
  unitType: 'before',
  minPopPopulation: 250000,
  exp: 10,
  bounty: 300,
  maxMoveDistance: Number.MAX_SAFE_INTEGER,
  event: function ({ x, y, turn, fromIsland }) {
    return monsterMove(x, y, turn, fromIsland);
  },
};
export const redInora: mapType = {
  type: 'red_inora',
  baseLand: 'monster',
  name: '怪獣レッドいのら',
  imgPath: '/img/monster/red_inora.gif',
  defVal: 3,
  maxVal: 4,
  unit: '体力',
  unitType: 'before',
  minPopPopulation: 250_000,
  exp: 12,
  bounty: 1000,
  maxMoveDistance: 1,
  event: function ({ x, y, turn, fromIsland }) {
    return monsterMove(x, y, turn, fromIsland);
  },
};
export const darkInora: mapType = {
  type: 'dark_inora',
  baseLand: 'monster',
  name: '怪獣ダークいのら',
  imgPath: '/img/monster/dark_inora.gif',
  defVal: 2,
  maxVal: 3,
  unit: '体力',
  unitType: 'before',
  minPopPopulation: 250_000,
  exp: 15,
  bounty: 800,
  maxMoveDistance: 2,
  event: function ({ x, y, turn, fromIsland }) {
    return monsterMove(x, y, turn, fromIsland);
  },
};
export const kingInora: mapType = {
  type: 'king_inora',
  baseLand: 'monster',
  name: '怪獣キングいのら',
  imgPath: '/img/monster/king_inora.gif',
  defVal: 5,
  maxVal: 6,
  unit: '体力',
  unitType: 'before',
  minPopPopulation: 400_000,
  exp: 30,
  bounty: 2000,
  maxMoveDistance: 1,
  event: function ({ x, y, turn, fromIsland }) {
    return monsterMove(x, y, turn, fromIsland);
  },
};
export const sanjira: mapType = {
  type: 'sanjira',
  baseLand: 'sanjira',
  name: '怪獣サンジラ',
  imgPath: '/img/monster/sanjira.gif',
  defVal: 2,
  maxVal: 3,
  unit: '体力',
  unitType: 'before',
  minPopPopulation: 100_000,
  exp: 7,
  bounty: 500,
  maxMoveDistance: 1,
  event: function ({ x, y, turn, fromIsland }) {
    return monsterMove(x, y, turn, fromIsland);
  },
};
export const kujira: mapType = {
  type: 'kujira',
  baseLand: 'kujira',
  name: '怪獣クジラ',
  imgPath: '/img/monster/kujira.gif',
  defVal: 4,
  maxVal: 5,
  unit: '体力',
  unitType: 'before',
  minPopPopulation: 400_000,
  exp: 20,
  bounty: 1500,
  maxMoveDistance: 1,
  event: function ({ x, y, turn, fromIsland }) {
    return monsterMove(x, y, turn, fromIsland);
  },
};
