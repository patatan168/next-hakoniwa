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
