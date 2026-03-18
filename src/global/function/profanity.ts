/**
 * @module profanity
 * @description 不適切な文字列のフィルタリング処理。
 */
import profanityList from '@/global/define/profanity/profanity_ja.json';

/**
 * 卑猥語/差別用語チェック
 * @param text チェックするテキスト
 * @returns 卑猥語/差別用語が含まれている場合はtrue
 */
export function profanityCheck(text: string): boolean {
  if (!text) return false;

  // NFKC正規化 (半角・全角の統一)
  const normalized = text.normalize('NFKC');
  // 空白の除去
  const noSpace = normalized.replace(/\s+/g, '');
  // 回避文字の除去 (記号など)
  const cleaned = noSpace.replace(/[@.\-_*+/\\!?~、。,"'#$%=^&]/g, '');

  // 辞書との照合
  return profanityList.some((word) => cleaned.includes(word));
}
