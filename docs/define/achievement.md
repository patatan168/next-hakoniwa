# Achievement Define 追加ガイド

## 対象

- 定義本体は `src/global/define/achievementType.ts`
- 付与処理は `src/db/turn.ts`
- 受賞ログは `src/global/define/logType.ts`

## 追加手順

1. `achievementType.ts` の `achievements` 配列に称号を追加する。
2. 自動付与対象にしたい場合は `threshold` を設定する。
3. 既存カテゴリー（繁栄賞・災難賞・怪獣討伐賞・記念碑賞）に含める場合は命名規則（例: `prosperity_`）に合わせる。
4. 新しい閾値カテゴリーを追加する場合は、フィルタ配列と `turn.ts` の判定処理を追加する。
5. 必要に応じて `logType.ts` に受賞ログ関数を追加する。
6. `src/global/define/__tests__/achievementType.test.ts` にテストを追加する。

## 注意点

- `type` は `prize` テーブルに保存されるキーになるため、後方互換を意識する。
- 既存 `type` の名称変更は、過去データ参照不能の原因になる。
- `turn_xxx` は `getAchievement()` で動的生成されるため、配列への追加は不要。
- 閾値判定は「そのターンの値」か「累計値」かを明確にして実装する。
- 累計値を使う称号は参照元統計（例: `missile_stats`, `plan_stats`）との整合を確認する。

## 実装チェックリスト

- [ ] `type` が既存と重複していない
- [ ] `name` / `description` / `condition` が利用者向けに明確
- [ ] `threshold` の有無が付与方式と一致している
- [ ] 必要な判定処理とログ処理を追加した
- [ ] テストを追加または更新した

## 関連箇所

- `src/global/define/achievementType.ts`
- `src/db/turn.ts`
- `src/global/define/logType.ts`
- `src/global/define/__tests__/achievementType.test.ts`
