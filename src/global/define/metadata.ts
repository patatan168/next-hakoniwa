const META_DATA = Object.freeze({
  TITLE: '箱庭諸島',
  VERSION: '0.1.0',
  /** マップサイズ */
  MAP_SIZE: 12,
  /** 資金の単位 */
  UNIT_MONEY: '億円',
  /** 食料の単位 */
  UNIT_FOOD: 'トン',
  /** 面積の単位 */
  UNIT_AREA: '万坪',
  /** 初期資金 (億円) */
  INIT_MONEY: 1000,
  /** 最大資金 (億円) */
  MAX_MONEY: 9999,
  /** 初期食料 (トン) */
  INIT_FOOD: 1000,
  /** 最大食料 (トン) */
  MAX_FOOD: 999_900,
  /** 食料不足で施設が破壊される確率 (%) */
  LACK_FOOD_DESTROY_RATE: 25,
  /** 食料消費量 (トン/人) */
  EATEN_FOOD_PER_PEOPLE: 0.2,
  /** 木の売値 (X億円/100本) */
  FOREST_VALUE: 5,
  /** 地震の確率 (%) */
  EARTHQUAKE_RATE: 0.5,
  /** 地震で全壊する確率 (%) */
  EARTHQUAKE_DESTROY_RATE: 25,
  /** 津波の確率 (%) */
  TSUNAMI_RATE: 1.5,
  /** 台風の確率 (%) */
  TYPHOON_RATE: 2,
  /** 隕石の確率 (%) */
  METEORITE_RATE: 1.5,
  /** 隕石の連続発生確率 (%) */
  CONTINUOUS_METEORITE_RATE: 50,
  /** 巨大隕石の確率 (%) */
  HUGE_METEORITE_RATE: 0.5,
  /** 噴火の確率 (%) */
  ERUPTION_RATE: 1,
  /** 火災の確率 (%) */
  FIRE_RATE: 1,
  /** 地盤沈下の確率 */
  FALL_DOWN_RATE: 3,
  /** 地盤沈下のボーダー (万坪) */
  FALL_DOWN_BORDER: 9000,
  /** 埋蔵金の確率 (%) */
  BURIED_TREASURE_RATE: 0.1,
  /** 海底油田の確率 (%) */
  OIL_FIELD_RATE: 1,
  /** 油田の枯渇率 (%) */
  OIL_EXHAUSTION_RATE: 40,
  /** 油田の収入 */
  OIL_EARN: 1000,
  /** 平地に村が出現する確率 (%) */
  VILLAGE_APPEARANCE_RATE: 20,
  /** 面積あたりの怪獣出現率 ( % / 100万坪 ) */
  MONSTER_RATE: 0.03,
  /** ターンあたりの最大人口増加量 ( 百人 / Turn ) */
  PEOPLE_GROWTH: {
    VILLAGE: 10,
    TOWN: 10,
    CITY: 0,
  },
  /** 誘致活動時のターンあたりの最大人口増加量 ( 百人 / Turn ) */
  PEOPLE_PROPAGANDA: {
    VILLAGE: 30,
    TOWN: 30,
    CITY: 3,
  },
  /** ターンあたりの人口最大減少量 ( 百人 / Turn ) */
  PEOPLE_LOSS: {
    /** 飢饉時 */
    FAMINE: 3,
  },
  /** トークンの発行者 */
  ISSUER: 'Patatan',
  /** リフレッシュトークンの有効時間(h) */
  REFRESH_TOKEN_EXPIRES_HOUR: 720,
  /** アクセストークンの有効時間(h) */
  ACCESS_TOKEN_EXPIRES_HOUR: 1,
  /** ログイン失敗許容回数 */
  LOGIN_FAIL_LIMIT: 5,
  /** ログインロック時間(分) */
  LOGIN_LOCK_MINUTE: 10,
  /** 最大セッション数 */
  MAX_SESSIONS: 3,
});

export default META_DATA;
