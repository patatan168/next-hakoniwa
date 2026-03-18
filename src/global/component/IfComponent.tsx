/**
 * @module IfComponent
 * @description 条件付きレンダリングコンポーネント。
 */
/**
 * レンダリング制御コンポーネント
 * @note 条件に応じて子要素のDOMそのものをレンダリング／非レンダリングする
 */
export default function IfComponent({
  isRendered,
  children,
}: {
  isRendered: boolean;
  children: React.ReactNode;
}) {
  if (!isRendered) return null;
  return <>{children}</>;
}
