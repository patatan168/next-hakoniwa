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
