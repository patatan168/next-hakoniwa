# Plan Define 追加ガイド

## 対象

- 主に `src/global/define/planCategory/` 配下の各ファイル
- 集約処理は `src/global/define/planType.ts`

## 追加手順

1. 追加先のカテゴリーファイルを決める（例: `planDevelopment.ts`）。
2. `planType` 型に沿って `export const` で計画定義を追加する。
3. 新しいカテゴリーファイルを作成した場合は、`planType.ts` の import と `getAllPlan()` のマージ対象に追加する。
4. 必要なら `predictLandType` を実装する（地形予測表示に使われる）。
5. `src/global/define/__tests__/planType.test.ts` に取得確認テストを追加する。

## 注意点

- `type` は一意にする。重複すると `getPlanDefine()` の結果が不正になる。
- `planNo` は表示順に使われるため、既存番号と衝突させない。
- `coordinate` と `mapType` の整合性を取る。
- 座標不要コマンドは `mapType: 'none'` を使い、実行時の分岐を意識する。
- `changeData` 内で失敗時に `plan.times` の更新方針を統一する。`plan.times` に対してのへ変更がない場合は、ターン更新後も計画が残ってしまう。
- `validCostAndLandType()` を使うと、資金不足・地形不適合の共通ログを再利用できる。
- 即時コマンド (`immediate: true`) は選択肢で強調表示されるため、意図して設定する。
- `otherIsland` を true にする場合は、他島向け実行の仕様を確認する。

## 実装チェックリスト

- [ ] `type` が既存と重複していない
- [ ] `planNo` が既存と重複していない
- [ ] `mapType` / `excludeLandType` の対象が正しい
- [ ] `cost` と `costType` が仕様通り
- [ ] `changeData` が `planResult` を正しく返す
- [ ] テストを追加または更新した

## 関連箇所

- `src/global/define/planType.ts`
- `src/global/define/planCategory/planDevelopment.ts`
- `src/global/define/__tests__/planType.test.ts`
