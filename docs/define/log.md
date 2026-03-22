# Log Define 追加ガイド

## 対象

- 主に `src/global/define/logType.ts`
- 表示変換は `src/global/component/TransFormHTML.tsx`
- 仕様書は `docs/turn_log_specification.md`

## 追加手順

1. `logType.ts` にログ生成関数を追加する。
2. 既存ヘルパー（`coordinate`, `islandName`, `planName`, `disaster`, `mapName`）を優先して使う。
3. 呼び出し側で `TurnLog` を組み立てる場合は `getBaseLog()` で基本情報を作る。
4. 新しいカスタムタグを導入する場合は `TransFormHTML.tsx` と `turn_log_specification.md` を同時更新する。

## 注意点

- 1ログごとに UUID を発行するため、`getBaseLog()` の使い回しに注意する。
- 公開ログ (`log`) と秘密ログ (`secret_log`) の出し分け要件を確認する。
- ログ文字列は HTML ではなく独自タグで表現する。
- 文字列結合時に島名・座標・計画名の装飾ルールを統一する。
- 既存タグの意味を変える変更は、表示崩れと互換性に影響する。

## 実装チェックリスト

- [ ] ログ関数名が目的に合っている
- [ ] `log` / `secret_log` の使い分けが正しい
- [ ] タグ仕様が既存仕様と一致している
- [ ] 新規タグ追加時にパーサと仕様書を更新した
- [ ] 受賞ログなど数値入り文面の単位が正しい

## 関連箇所

- `src/global/define/logType.ts`
- `src/global/component/TransFormHTML.tsx`
- `docs/turn_log_specification.md`
