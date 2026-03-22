# Define ドキュメント一覧

`src/global/define/` 配下の定義を追加・更新するときのガイドです。

## 一覧

| ドキュメント                                      | 説明                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| [Plan Define 追加ガイド](./plan.md)               | 計画コマンド定義（`planType` / `planCategory`）の追加手順と注意点               |
| [Map Define 追加ガイド](./map.md)                 | 地形・施設・怪獣などのマップ定義（`mapType` / `mapCategory`）の追加手順と注意点 |
| [Log Define 追加ガイド](./log.md)                 | ログ文面とタグ仕様（`logType`）の追加手順と注意点                               |
| [Achievement Define 追加ガイド](./achievement.md) | 称号定義と付与処理（`achievementType`）の追加手順と注意点                       |

## 補足

- 新しい define 系ガイドを増やした場合は、この README に必ず追記してください。
- 実装仕様側の変更を伴う場合は、関連する仕様書（例: `docs/turn_log_specification.md`）もあわせて更新してください。
