/**
 * @module metadata
 * @description アプリケーション全体のメタデータ定数定義。
 */
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
  INIT_MONEY: Number(process.env.NEXT_PUBLIC_INIT_MONEY!),
  /** 最大資金 (億円) */
  MAX_MONEY: Number(process.env.NEXT_PUBLIC_MAX_MONEY!),
  /** 初期食料 (トン) */
  INIT_FOOD: Number(process.env.NEXT_PUBLIC_INIT_FOOD!),
  /** 最大食料 (トン) */
  MAX_FOOD: Number(process.env.NEXT_PUBLIC_MAX_FOOD!),
  /** 1人規模あたりの農場が生み出す食料 */
  FARM_PER_PEOPLE: Number(process.env.NEXT_PUBLIC_EARN_FARM_PER_PEOPLE!),
  /** 1人規模あたりの工場が生み出す資金 */
  FACTORY_PER_PEOPLE: Number(process.env.NEXT_PUBLIC_EARN_FACTORY_PER_PEOPLE!),
  /** 1人規模あたりの鉱山が生み出す資金 */
  MINING_PER_PEOPLE: Number(process.env.NEXT_PUBLIC_EARN_MINING_PER_PEOPLE!),
  /** 食料から資金への変換率 */
  FOOD_TO_MONEY_RATE: Number(process.env.NEXT_PUBLIC_FOOD_TO_MONEY_RATE!),
  /** 食料不足で施設が破壊される確率 (%) */
  LACK_FOOD_DESTROY_RATE: Number(process.env.NEXT_PUBLIC_LACK_FOOD_DESTROY_RATE!),
  /** 食料消費量 (トン/人) */
  EATEN_FOOD_PER_PEOPLE: Number(process.env.NEXT_PUBLIC_EATEN_FOOD_PER_PEOPLE!),
  /** 木の売値 (X億円/100本) */
  FOREST_VALUE: Number(process.env.NEXT_PUBLIC_FOREST_VALUE!),
  /** 地震の確率 (%) */
  EARTHQUAKE_RATE: Number(process.env.NEXT_PUBLIC_EARTHQUAKE_RATE!),
  /** 地震で全壊する確率 (%) */
  EARTHQUAKE_DESTROY_RATE: Number(process.env.NEXT_PUBLIC_EARTHQUAKE_DESTROY_RATE!),
  /** 津波の確率 (%) */
  TSUNAMI_RATE: Number(process.env.NEXT_PUBLIC_TSUNAMI_RATE!),
  /** 台風の確率 (%) */
  TYPHOON_RATE: Number(process.env.NEXT_PUBLIC_TYPHOON_RATE!),
  /** 隕石の確率 (%) */
  METEORITE_RATE: Number(process.env.NEXT_PUBLIC_METEORITE_RATE!),
  /** 隕石の連続発生確率 (%) */
  CONTINUOUS_METEORITE_RATE: Number(process.env.NEXT_PUBLIC_CONTINUOUS_METEORITE_RATE!),
  /** 巨大隕石の確率 (%) */
  HUGE_METEORITE_RATE: Number(process.env.NEXT_PUBLIC_HUGE_METEORITE_RATE!),
  /** 噴火の確率 (%) */
  ERUPTION_RATE: Number(process.env.NEXT_PUBLIC_ERUPTION_RATE!),
  /** 火災の確率 (%) */
  FIRE_RATE: Number(process.env.NEXT_PUBLIC_FIRE_RATE!),
  /** 地盤沈下の確率 */
  FALL_DOWN_RATE: Number(process.env.NEXT_PUBLIC_FALL_DOWN_RATE!),
  /** 地盤沈下のボーダー (万坪) */
  FALL_DOWN_BORDER: Number(process.env.NEXT_PUBLIC_FALL_DOWN_BORDER!),
  /** 埋蔵金の確率 (%) */
  BURIED_TREASURE_RATE: Number(process.env.NEXT_PUBLIC_BURIED_TREASURE_RATE!),
  /** 海底油田の確率 (%) */
  OIL_FIELD_RATE: Number(process.env.NEXT_PUBLIC_OIL_FIELD_RATE!),
  /** 油田の枯渇率 (%) */
  OIL_EXHAUSTION_RATE: Number(process.env.NEXT_PUBLIC_OIL_EXHAUSTION_RATE!),
  /** 油田の収入 */
  OIL_EARN: Number(process.env.NEXT_PUBLIC_OIL_EARN!),
  /** 平地に村が出現する確率 (%) */
  VILLAGE_APPEARANCE_RATE: Number(process.env.NEXT_PUBLIC_VILLAGE_APPEARANCE_RATE!),
  /** 面積あたりの怪獣出現率 ( % / 100万坪 ) */
  MONSTER_RATE: Number(process.env.NEXT_PUBLIC_MONSTER_RATE!),
  /** ターンあたりの最大人口増加量 ( 百人 / Turn ) */
  PEOPLE_GROWTH: {
    VILLAGE: Number(process.env.NEXT_PUBLIC_PEOPLE_GROWTH_VILLAGE!),
    TOWN: Number(process.env.NEXT_PUBLIC_PEOPLE_GROWTH_TOWN!),
    CITY: Number(process.env.NEXT_PUBLIC_PEOPLE_GROWTH_CITY!),
  },
  /** 誘致活動時のターンあたりの最大人口増加量 ( 百人 / Turn ) */
  PEOPLE_PROPAGANDA: {
    VILLAGE: Number(process.env.NEXT_PUBLIC_PEOPLE_PROPAGANDA_VILLAGE!),
    TOWN: Number(process.env.NEXT_PUBLIC_PEOPLE_PROPAGANDA_TOWN!),
    CITY: Number(process.env.NEXT_PUBLIC_PEOPLE_PROPAGANDA_CITY!),
  },
  /** ターンあたりの人口最大減少量 ( 百人 / Turn ) */
  PEOPLE_LOSS: {
    /** 飢饉時 */
    FAMINE: Number(process.env.NEXT_PUBLIC_PEOPLE_LOSS_FAMINE!),
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
  /** WebAuthn RPの名称 */
  RP_NAME: process.env.NEXT_PUBLIC_RP_NAME!,
  /** WebAuthn RPのID（ドメイン名） */
  RP_ID: process.env.NEXT_PUBLIC_RP_ID!,
  /** アプリケーションのオリジンURL（WebAuthn origin検証用） */
  ORIGIN_URL: process.env.NEXT_PUBLIC_ORIGIN_URL!,
  /** 1ユーザーあたりのPasskey最大登録数 */
  MAX_PASSKEYS: Number(process.env.NEXT_PUBLIC_MAX_PASSKEYS ?? 5),
  /** フィンガープリントのサーバーシークレット（二段ハッシュ用ペッパー） */
  FP_PEPPER: process.env.PASSKEY_FP_PEPPER!,
});

export default META_DATA;
