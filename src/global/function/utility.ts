/**
 * @module utility
 * @description 汎用ユーティリティ関数群。
 */
/**
 * セキュア乱数
 * @note Math.random()相当の処理だが低速
 * @returns 0 <= x < 1の乱数
 */
export const secureRandom = () => {
  // NOTE: getRandomValuesの引数が配列のため
  const randomValues = new Uint32Array(1);
  // Uint32の範囲で乱数生成
  crypto.getRandomValues(randomValues);

  // 0 以上 1 未満の値を返すために 2^32 (4294967296) で割る
  return randomValues[0] / 4294967296;
};

/**
 * 確率から成否を判定
 * @param probability 確率 (%)
 * @returns true 成功
 * @returns false 失敗
 */
export const checkProbability = (probability: number) => {
  return Math.random() >= 1 - probability / 100;
};

/**
 * 指定した最小値以上、最大値以下の整数乱数を返す
 * @param min 最小値（含む）
 * @param max 最大値（含む）
 * @returns min以上max以下のランダムな整数
 */
export const randomIntInRange = (min: number, max: number) => {
  if (min > max) return 0;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * DB用にデーターをパースする
 * @param data データー
 * @returns DB用のデーター
 */
export const parseDbData = (data: unknown) => {
  switch (typeof data) {
    case 'string':
      return `${data}`;
    case 'boolean':
      // NOTE: SQLITEにはBooleanはない
      return data ? '1' : '0';
    default:
      return `${data}`;
  }
};

/**
 * 任意の長さに重複なしの整数の乱数配列を作る
 * @param length 配列の長さ
 * @returns 0からlength-1までの整数がランダムに並んだ配列
 */
export const arrayRandomInt = (length: number) => {
  // 連番を作成する
  const array = Array.from({ length: length }, (_, i) => i);

  // シャッフルする
  for (let i = array.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [array[i], array[r]] = [array[r], array[i]];
  }

  return array;
};

/**
 * undefinedやnullの場合にNumber.MAX_SAFE_INTEGERまたはNumber.MIN_SAFE_INTEGERを返す関数
 * @param value 判定する値
 * @param mode 'max'ならMAX_SAFE_INTEGER, 'min'ならMIN_SAFE_INTEGER
 * @returns valueがnull/undefinedなら指定した極値を返す
 */
export const valueOrSafeLimit = (value: number | null | undefined, mode: 'max' | 'min'): number => {
  if (value === null || value === undefined) {
    return mode === 'max' ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
  }
  return value;
};

/**
 * メモリー使用量の取得
 * @returns メモリー使用量の文字列(process.memoryUsage)
 */
export const memoryUsage = () => {
  const used = process.memoryUsage();
  const messages = [];
  for (const [key, value] of Object.entries(used)) {
    messages.push(`${key}: ${Math.round((value / 1024 / 1024) * 100) / 100} MB`);
  }
  return { messages: messages.join(', '), values: used };
};

export type ParsedCron = {
  isValid: boolean;
  type: 'daily' | 'hourly' | 'minutely' | 'raw' | 'unset';
  text: string;
  hours: number[]; // 毎日の場合の更新時間
  minute: number; // 更新分
};

/**
 * Cron表現を詳細なデータオブジェクトに変換する
 * 典型的な箱庭諸島のスケジュール表現に特化して簡易パースを行います。
 *
 * @param cronExpression 変換元のCron文字列 (未指定時は未設定状態を返す)
 * @returns 変換後のオブジェクト
 */
export const parseCronToJapanese = (cronExpression?: string): ParsedCron => {
  const fallback = (text: string, type: ParsedCron['type'] = 'raw'): ParsedCron => ({
    isValid: type !== 'unset' && text !== 'スケジュール形式エラー',
    type,
    text,
    hours: [],
    minute: 0,
  });

  if (!cronExpression) return fallback('スケジュール未設定', 'unset');

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length < 5) return fallback('スケジュール形式エラー', 'raw');

  const [min, hr, d, m, w] = parts;

  // 全てワイルドカード
  if (min === '*' && hr === '*' && d === '*' && m === '*' && w === '*') {
    return { ...fallback('常に自動更新 (毎分)', 'minutely'), minute: 0 };
  }

  // 曜日・月・日は問わない（毎日/毎時）場合の判定
  if (d === '*' && m === '*' && w === '*') {
    return parseDailyCron(min, hr, cronExpression);
  }

  return fallback(`更新スケジュール: ${cronExpression}`, 'raw');
};

/**
 * 毎日・毎時のパターンのオブジェクトを組み立てる
 */
const parseDailyCron = (min: string, hr: string, fallbackExpr: string): ParsedCron => {
  const isSimpleVal = (v: string) => !v.includes(',') && !v.includes('/') && !v.includes('-');
  const fallback = {
    isValid: true,
    type: 'raw' as const,
    hours: [],
    minute: 0,
    text: `更新スケジュール: ${fallbackExpr}`,
  };

  const parseMin = isSimpleVal(min) && min !== '*' ? parseInt(min, 10) : 0;

  // 毎時○分
  if (hr === '*' && min !== '*' && isSimpleVal(min)) {
    return {
      isValid: true,
      type: 'hourly',
      hours: [],
      minute: parseMin,
      text: `毎時 ${min}分に更新`,
    };
  }

  // 毎日○時...
  if (hr !== '*' && !isSimpleVal(hr) && !hr.includes('/') && !hr.includes('-')) {
    const hoursNum = hr
      .split(',')
      .map((h) => parseInt(h, 10))
      .sort((a, b) => a - b);

    if (min === '0') {
      return { isValid: true, type: 'daily', hours: hoursNum, minute: parseMin, text: `毎日更新` };
    }
    if (min !== '*' && isSimpleVal(min)) {
      return {
        isValid: true,
        type: 'daily',
        hours: hoursNum,
        minute: parseMin,
        text: `毎日各時刻の${min}分に更新`,
      };
    }
  }

  return fallback;
};
