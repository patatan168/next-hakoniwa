/**
 * セキュア乱数
 * @note Math.random()相当の処理だが低速
 * @returns 0 <= x < 1の乱数
 */
export const secureRandom = () => {
  // NOTE: getRandomValuesの引数が配列のため
  const randomValues = new Uint32Array(1);
  // 符号なしビットシフトでUint32の最大値を取得
  const maxUint32 = -1 >>> 0;
  // Uint32の範囲で乱数生成
  crypto.getRandomValues(randomValues);

  return randomValues[0] / (maxUint32 + 1 / 100000);
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
 * DB用にデーターをパースする
 * @param data データー
 * @returns DB用のデーター
 */
export const parseDbData = (data: unknown) => {
  switch (typeof data) {
    case 'string':
      return `'${data}'`;
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
