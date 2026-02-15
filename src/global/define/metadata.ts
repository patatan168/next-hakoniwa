// dotenv-flow を動的インポートして環境変数を設定
if (
  typeof window === 'undefined' && // ブラウザではない
  !process.env.NEXT_RUNTIME // Next.js の SSR でもない
) {
  // Node.js の独自実行時のみ dotenv-flow を読み込む
  const { default: dotenvFlow } = await import('dotenv-flow');

  dotenvFlow.config({
    node_env: process.env.NODE_ENV ?? 'development',
    default_node_env: 'development',
    silent: true,
  });
}

const META_DATA = Object.freeze({
  TITLE: process.env.NEXT_PUBLIC_TITLE!,
  VERSION: process.env.NEXT_PUBLIC_VERSION!,
  /** 計画の最大数 */
  PLAN_LENGTH: Number(process.env.NEXT_PUBLIC_PLAN_LENGTH!),
  /** マップサイズ */
  MAP_SIZE: Number(process.env.NEXT_PUBLIC_MAP_SIZE!),
  /** 資金の単位 */
  UNIT_MONEY: process.env.NEXT_PUBLIC_UNIT_MONEY!,
  /** 食料の単位 */
  UNIT_FOOD: process.env.NEXT_PUBLIC_UNIT_FOOD!,
  /** 面積の単位 */
  UNIT_AREA: process.env.NEXT_PUBLIC_UNIT_AREA!,
  /** 初期資金 (億円) */
  INIT_MONEY: Number(process.env.INIT_MONEY!),
  /** 最大資金 (億円) */
  MAX_MONEY: Number(process.env.MAX_MONEY!),
  /** 初期食料 (トン) */
  INIT_FOOD: Number(process.env.INIT_FOOD!),
  /** 最大食料 (トン) */
  MAX_FOOD: Number(process.env.MAX_FOOD!),
  /** 食料不足で施設が破壊される確率 (%) */
  LACK_FOOD_DESTROY_RATE: Number(process.env.LACK_FOOD_DESTROY_RATE!),
  /** 食料消費量 (トン/人) */
  EATEN_FOOD_PER_PEOPLE: Number(process.env.EATEN_FOOD_PER_PEOPLE!),
  /** 木の売値 (X億円/100本) */
  FOREST_VALUE: Number(process.env.FOREST_VALUE!),
  /** 地震の確率 (%) */
  EARTHQUAKE_RATE: Number(process.env.EARTHQUAKE_RATE!),
  /** 地震で全壊する確率 (%) */
  EARTHQUAKE_DESTROY_RATE: Number(process.env.EARTHQUAKE_DESTROY_RATE!),
  /** 津波の確率 (%) */
  TSUNAMI_RATE: Number(process.env.TSUNAMI_RATE!),
  /** 台風の確率 (%) */
  TYPHOON_RATE: Number(process.env.TYPHOON_RATE!),
  /** 隕石の確率 (%) */
  METEORITE_RATE: Number(process.env.METEORITE_RATE!),
  /** 隕石の連続発生確率 (%) */
  CONTINUOUS_METEORITE_RATE: Number(process.env.CONTINUOUS_METEORITE_RATE!),
  /** 巨大隕石の確率 (%) */
  HUGE_METEORITE_RATE: Number(process.env.HUGE_METEORITE_RATE!),
  /** 噴火の確率 (%) */
  ERUPTION_RATE: Number(process.env.ERUPTION_RATE!),
  /** 火災の確率 (%) */
  FIRE_RATE: Number(process.env.FIRE_RATE!),
  /** 地盤沈下の確率 */
  FALL_DOWN_RATE: Number(process.env.FALL_DOWN_RATE!),
  /** 地盤沈下のボーダー (万坪) */
  FALL_DOWN_BORDER: Number(process.env.FALL_DOWN_BORDER!),
  /** 埋蔵金の確率 (%) */
  BURIED_TREASURE_RATE: Number(process.env.BURIED_TREASURE_RATE!),
  /** 海底油田の確率 (%) */
  OIL_FIELD_RATE: Number(process.env.OIL_FIELD_RATE!),
  /** 油田の枯渇率 (%) */
  OIL_EXHAUSTION_RATE: Number(process.env.OIL_EXHAUSTION_RATE!),
  /** 油田の収入 */
  OIL_EARN: Number(process.env.OIL_EARN!),
  /** 平地に村が出現する確率 (%) */
  VILLAGE_APPEARANCE_RATE: Number(process.env.VILLAGE_APPEARANCE_RATE!),
  /** 面積あたりの怪獣出現率 ( % / 100万坪 ) */
  MONSTER_RATE: Number(process.env.MONSTER_RATE!),
  /** ターンあたりの最大人口増加量 ( 百人 / Turn ) */
  PEOPLE_GROWTH: {
    VILLAGE: Number(process.env.PEOPLE_GROWTH_VILLAGE!),
    TOWN: Number(process.env.PEOPLE_GROWTH_TOWN!),
    CITY: Number(process.env.PEOPLE_GROWTH_CITY!),
  },
  /** 誘致活動時のターンあたりの最大人口増加量 ( 百人 / Turn ) */
  PEOPLE_PROPAGANDA: {
    VILLAGE: Number(process.env.PEOPLE_PROPAGANDA_VILLAGE!),
    TOWN: Number(process.env.PEOPLE_PROPAGANDA_TOWN!),
    CITY: Number(process.env.PEOPLE_PROPAGANDA_CITY!),
  },
  /** ターンあたりの人口最大減少量 ( 百人 / Turn ) */
  PEOPLE_LOSS: {
    /** 飢饉時 */
    FAMINE: Number(process.env.PEOPLE_LOSS_FAMINE!),
  },
  /** トークンの発行者 */
  ISSUER: process.env.ISSUER!,
  /** リフレッシュトークンの有効時間(h) */
  REFRESH_TOKEN_EXPIRES_HOUR: Number(process.env.REFRESH_TOKEN_EXPIRES_HOUR!),
  /** アクセストークンの有効時間(h) */
  ACCESS_TOKEN_EXPIRES_HOUR: Number(process.env.ACCESS_TOKEN_EXPIRES_HOUR!),
  /** ログイン失敗許容回数 */
  LOGIN_FAIL_LIMIT: Number(process.env.LOGIN_FAIL_LIMIT!),
  /** ログインロック時間(分) */
  LOGIN_LOCK_MINUTE: Number(process.env.LOGIN_LOCK_MINUTE!),
  /** 最大セッション数 */
  MAX_SESSIONS: Number(process.env.MAX_SESSIONS!),
});

export default META_DATA;
