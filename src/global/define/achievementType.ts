/**
 * @module achievementType
 * @description 実績の種類と判定ロジックの定義。
 */
export type achievementType = {
  /** タイプ */
  readonly type: string;
  /** 名称 */
  readonly name: string;
  /** 説明 */
  readonly description: string;
  /** 達成条件 */
  readonly condition: string;
  /** ターン進行時に自動付与する閾値（設定がある称号のみ） */
  readonly threshold?: number;
};

export const achievements: achievementType[] = [
  // 初心者
  {
    type: 'beginner',
    name: '初心者',
    description: '新しい島を開拓した証。',
    condition: '島を開拓する',
  },
  // 繁栄賞
  {
    type: 'prosperity_1',
    name: '繁栄賞',
    description: '島の人口が一定数に達し、大きく発展した証。',
    condition: '人口100,000人達成',
    threshold: 100_000,
  },
  {
    type: 'prosperity_2',
    name: '超繁栄賞',
    description: '島の人口が非常に多くなり、驚異的な発展を遂げた証。',
    condition: '人口300,000人達成',
    threshold: 300_000,
  },
  {
    type: 'prosperity_3',
    name: '究極繁栄賞',
    description: '島の人口が極限に達し、これ以上ないほど発展した証。',
    condition: '人口500,000人達成',
    threshold: 500_000,
  },
  // 平和賞
  {
    type: 'peace_1',
    name: '平和賞',
    description: '難民を受け入れた島に贈られる賞。',
    condition: '20000人以上難民を受け入れる',
    threshold: 20_000,
  },
  {
    type: 'peace_2',
    name: '超平和賞',
    description: '多くの難民を受け入れた島に贈られる賞。',
    condition: '50000人以上難民を受け入れる',
    threshold: 50_000,
  },
  {
    type: 'peace_3',
    name: '究極平和賞',
    description: 'とてつもなく多くの難民を受け入れた島に贈られる賞。',
    condition: '100000人以上難民を受け入れる',
    threshold: 100_000,
  },
  // 災難賞
  {
    type: 'disaster_1',
    name: '災難賞',
    description: '度重なる災害に見舞われながらも生き延びた証。',
    condition: '1ターンに50000人以上の人口が死亡する',
    threshold: 50_000,
  },
  {
    type: 'disaster_2',
    name: '超災難賞',
    description: '更に度重なる災害に見舞われながらも生き延びた証。',
    condition: '1ターンに100000人以上の人口が死亡する',
    threshold: 100_000,
  },
  {
    type: 'disaster_3',
    name: '究極災難賞',
    description: '天変地異に見舞われながらも生き延びた証。',
    condition: '1ターンに200000人以上の人口が死亡する',
    threshold: 200_000,
  },
  // 怪獣討伐賞
  {
    type: 'monster_kill_1',
    name: '怪獣討伐賞',
    description: '島に上陸した怪獣を見事討伐した証。',
    condition: '怪獣を累計1体討伐',
    threshold: 1,
  },
  {
    type: 'monster_kill_2',
    name: '超怪獣討伐賞',
    description: '多数の怪獣を討伐し、島の防衛に貢献した証。',
    condition: '怪獣を累計5体討伐',
    threshold: 5,
  },
  {
    type: 'monster_kill_3',
    name: '究極怪獣討伐賞',
    description: '数え切れないほどの怪獣を屠った伝説の防衛島。',
    condition: '怪獣を累計10体討伐',
    threshold: 10,
  },
  {
    type: 'monster_kill_4',
    name: '怪獣討伐王賞',
    description: '怪獣討伐において他の追随を許さない王者の証。',
    condition: '怪獣を累計20体討伐',
    threshold: 20,
  },
  // 記念碑賞
  {
    type: 'monument_1',
    name: '記念碑賞',
    description: '島に記念碑が数多く建立された証。',
    condition: '記念碑を10基建設',
    threshold: 10,
  },
  {
    type: 'monument_2',
    name: '超記念碑賞',
    description: '島に記念碑が所狭しと建立され、称えられた証。',
    condition: '記念碑を30基建設',
    threshold: 30,
  },
  {
    type: 'monument_3',
    name: '究極記念碑賞',
    description: '島が記念碑で埋め尽くされ、後世に名を残す名島となった証。',
    condition: '記念碑を50基建設',
    threshold: 50,
  },
];

/**
 * 称号タイプから称号情報を取得する
 * ターン杯（turn_X）の場合はメモリを圧迫しないよう動的に判定・生成して返す
 * @param type 称号タイプ (例: 'turn_100', 'prosperity_1')
 * @returns 称号情報（存在しない場合は undefined）
 */
export const getAchievement = (type: string): achievementType | undefined => {
  // ターン杯の動的生成
  if (type.startsWith('turn_')) {
    const turn = parseInt(type.replace('turn_', ''), 10);
    // 100の倍数であるかチェック
    if (!isNaN(turn) && turn > 0 && turn % 100 === 0) {
      return {
        type,
        name: `${turn}ターン杯`,
        description: `${turn}ターンに人口が一番多い島に贈られる賞。`,
        condition: `${turn}ターン経過で人口が一番多い島`,
      };
    }
  }

  // それ以外の固定称号から検索
  return achievements.find((a) => a.type === type);
};

/** threshold を持つ achievementType の型 */
export type achievementTypeWithThreshold = achievementType & { threshold: number };

/** 繁栄賞一覧（閾値付き） */
export const prosperityAchievements = achievements.filter(
  (a): a is achievementTypeWithThreshold =>
    a.type.startsWith('prosperity_') && a.threshold !== undefined
);

/** 災難賞一覧（閾値付き） */
export const disasterAchievements = achievements.filter(
  (a): a is achievementTypeWithThreshold =>
    a.type.startsWith('disaster_') && a.threshold !== undefined
);

/** 平和賞一覧（閾値付き） */
export const peaceAchievements = achievements.filter(
  (a): a is achievementTypeWithThreshold => a.type.startsWith('peace_') && a.threshold !== undefined
);

/** 怪獣討伐賞一覧（閾値付き） */
export const monsterKillAchievements = achievements.filter(
  (a): a is achievementTypeWithThreshold =>
    a.type.startsWith('monster_kill_') && a.threshold !== undefined
);

/** 記念碑賞一覧（閾値付き） */
export const monumentAchievements = achievements.filter(
  (a): a is achievementTypeWithThreshold =>
    a.type.startsWith('monument_') && a.threshold !== undefined
);
