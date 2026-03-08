export type islandInfo = {
  type: string;
  landValue: number;
  x: number;
  y: number;
  /** 怪獣の移動距離 */
  monsterDistance?: number;
};

export type islandInfoData = Array<islandInfo>;
