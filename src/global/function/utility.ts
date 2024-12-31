/**
 * セキュア乱数
 * @note Math.random()相当の処理だが低速
 * @returns 0~1の乱数
 */
export const secureRandom = () => {
  // NOTE: getRandomValuesの引数が配列のため
  const randomValues = new Uint32Array(1);
  // 符号なしビットシフトでUint32の最大値を取得
  const maxUint32 = -1 >>> 0;
  // Uint32の範囲で乱数生成
  crypto.getRandomValues(randomValues);

  return randomValues[0] / maxUint32;
};
