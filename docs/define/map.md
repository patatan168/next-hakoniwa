# Map Define 追加ガイド

## 対象

- 主に `src/global/define/mapCategory/` 配下の各ファイル
- 集約処理は `src/global/define/mapType.ts`

## 追加手順

1. 追加先のカテゴリーファイルを決め、`mapType` 型に沿って `export const` を追加する。
2. 新しいカテゴリーファイルを作成した場合は、`mapType.ts` の import と `allMaps` のマージ対象に追加する。
3. 画像が必要な地形は `public/img/` 配下にアセットを追加し、`imgPath` を合わせる。
4. イベント処理が必要なら `event` 関数を実装する。
5. `src/global/define/__tests__/mapType.test.ts` に `getMapDefine()` のテストを追加する。

## 注意点

- `type` は一意にする。重複時は後勝ちで上書きされる。
- `baseLand` は `landType` ユニオンに存在する値を使う。
- 新しい基本地形を増やす場合は `mapType.ts` の `landType` も更新する。
- `name` と `imgPath` を配列にする場合は、`level` と整合した長さにする。
- `defVal` と `maxVal` は値の増減ロジック（イベント・開発コマンド）と矛盾させない。
- `event` はターン処理中に多数回呼ばれるため、副作用範囲を最小化する。
- 未定義タイプは `getMapDefine()` で `dummy` にフォールバックする。誤記を見逃しやすいのでテストで検出する。

## 実装チェックリスト

- [ ] `type` が既存と重複していない
- [ ] `baseLand` が仕様通り
- [ ] `name` / `imgPath` / `level` の整合が取れている
- [ ] 必要な画像アセットを追加した
- [ ] `event` の副作用と計算量が妥当
- [ ] テストを追加または更新した

## 関連箇所

- `src/global/define/mapType.ts`
- `src/global/define/mapCategory/mapLand.ts`
- `src/global/define/__tests__/mapType.test.ts`
