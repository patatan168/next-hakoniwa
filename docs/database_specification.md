# データベース仕様書

本ドキュメントは、箱庭諸島アプリケーションで使用されるデータベースのテーブル定義およびリレーションシップをまとめたものです。

## 全体概要

- **DBエンジン**: SQLite (開発用) / MySQL (本番想定)
- **マイグレーション**: `src/db/migrations/schema.ts` にて宣言的に管理
- **クエリビルダー**: Kysely

---

## テーブル一覧

### 1. `user` (ユーザー・島基本情報)

ユーザーのアイデンティティと島の生存状態を管理します。

| カラム名      | データ型      | 制約                | 説明                                      |
| :------------ | :------------ | :------------------ | :---------------------------------------- |
| `uuid`        | `varchar(25)` | PRIMARY KEY, UNIQUE | 内部管理用のユニークID                    |
| `user_name`   | `varchar(64)` | NOT NULL            | ユーザー名                                |
| `island_name` | `varchar(64)` | NOT NULL            | 島の名前                                  |
| `inhabited`   | `integer`     | DEFAULT 1           | 論理削除フラグ（1: 生存, 0: 無人/削除済） |

### 2. `auth` (認証情報)

ログインおよびセキュリティに関する情報を管理します。

| カラム名           | データ型       | 制約                       | 説明                       |
| :----------------- | :------------- | :------------------------- | :------------------------- |
| `uuid`             | `varchar(25)`  | PRIMARY KEY, FK(user.uuid) | ユーザーID                 |
| `id`               | `varchar(64)`  | UNIQUE, NOT NULL           | ログインID                 |
| `password`         | `varchar(511)` | NOT NULL                   | ハッシュ化されたパスワード |
| `created_at`       | `bigint`       | DEFAULT (now)              | アカウント作成日時         |
| `login_fail_count` | `integer`      | DEFAULT 0                  | 連続ログイン失敗回数       |
| `locked_until`     | `datetime`     | -                          | アカウントロック期限       |
| `fp_hash`          | `varchar(255)` | DEFAULT ''                 | ブラウザ指紋（不正検知用） |

### 3. `island` (島のステータス)

島の資源や主要な属性を管理します。

| カラム名      | データ型      | 制約                       | 説明                   |
| :------------ | :------------ | :------------------------- | :--------------------- |
| `uuid`        | `varchar(25)` | PRIMARY KEY, FK(user.uuid) | ユーザーID             |
| `money`       | `integer`     | NOT NULL                   | 資金                   |
| `area`        | `integer`     | NOT NULL                   | 面積                   |
| `population`  | `integer`     | NOT NULL                   | 人口                   |
| `food`        | `integer`     | NOT NULL                   | 食料                   |
| `farm`        | `integer`     | NOT NULL                   | 農場規模               |
| `factory`     | `integer`     | NOT NULL                   | 工場規模               |
| `mining`      | `integer`     | NOT NULL                   | 採掘規模               |
| `missile`     | `integer`     | NOT NULL                   | ミサイル保有数         |
| `prize`       | `varchar(63)` | NOT NULL                   | 現在表示中の称号       |
| `island_info` | `json`        | NOT NULL                   | 地形データ等の詳細情報 |

### 4. `prize` (称号リスト)

ユーザーが所持している全ての称号を管理します。

| カラム名    | データ型      | 制約                          | 説明       |
| :---------- | :------------ | :---------------------------- | :--------- |
| **`uuid`**  | `varchar(25)` | PRIMARY KEY[1], FK(user.uuid) | ユーザーID |
| **`prize`** | `varchar(63)` | PRIMARY KEY[2]                | 称号文字列 |

> [!NOTE]
> `(uuid, prize)` の複合主キーにより、1つの島が同じ称号を重複して持つことを防いでいます。
> 論理削除に対応するため、`ON DELETE CASCADE` は設定されておらず、コード側で削除を制御します。

### 5. `turn_log` (履歴ログ)

ゲーム内で発生した出来事の記録です。

| カラム名     | データ型        | 制約          | 説明                       |
| :----------- | :-------------- | :------------ | :------------------------- |
| `log_uuid`   | `varchar(25)`   | PRIMARY KEY   | ログID                     |
| `from_uuid`  | `varchar(25)`   | FK(user.uuid) | 発生元ユーザー             |
| `to_uuid`    | `varchar(25)`   | FK(user.uuid) | 対象ユーザー (任意)        |
| `turn`       | `integer`       | NOT NULL      | 発生ターン                 |
| `secret_log` | `varchar(2000)` | NOT NULL      | 本人のみ閲覧可能な詳細ログ |
| `log`        | `varchar(2000)` | -             | 公開ログ                   |

### 6. `turn_resource_history` (資源推移履歴)

島ごとのターン単位の人口・食料・資金スナップショットを管理します。

| カラム名     | データ型      | 制約          | 説明       |
| :----------- | :------------ | :------------ | :--------- |
| `uuid`       | `varchar(25)` | FK(user.uuid) | ユーザーID |
| `turn`       | `integer`     | NOT NULL      | 記録ターン |
| `population` | `integer`     | NOT NULL      | 人口       |
| `food`       | `integer`     | NOT NULL      | 食料       |
| `money`      | `integer`     | NOT NULL      | 資金       |

> [!NOTE]
> `(uuid, turn)` にユニークインデックスを設定し、同一ユーザー・同一ターンの重複記録を防止します。
> また `uuid` 単体インデックスにより、履歴取得APIの検索効率を確保します。

### 7. `plan` (開発計画)

ユーザーが設定した各ターンのコマンドです。

| カラム名    | データ型       | 制約          | 説明             |
| :---------- | :------------- | :------------ | :--------------- |
| `from_uuid` | `varchar(25)`  | FK(user.uuid) | 実行ユーザー     |
| `to_uuid`   | `varchar(25)`  | FK(user.uuid) | 実行対象ユーザー |
| `plan_no`   | `integer`      | NOT NULL      | 計画の順番 (0〜) |
| `times`     | `integer`      | NOT NULL      | 繰り返し回数     |
| `x`         | `integer`      | NOT NULL      | 座標 X           |
| `y`         | `integer`      | NOT NULL      | 座標 Y           |
| `plan`      | `varchar(511)` | NOT NULL      | 実行コマンド内容 |

### 8. `plan_stats` (計画成功統計)

各ユーザーの計画タイプごとの成功実行回数を累積管理します。

| カラム名   | データ型       | 制約                          | 説明                                     |
| :--------- | :------------- | :---------------------------- | :--------------------------------------- |
| **`uuid`** | `varchar(25)`  | PRIMARY KEY[1], FK(user.uuid) | ユーザーID                               |
| **`plan`** | `varchar(511)` | PRIMARY KEY[2]                | 計画タイプ識別子（例: `farm_dev`）       |
| `count`    | `integer`      | DEFAULT 0, NOT NULL           | 地形不適合・資金不足以外で実行された回数 |

> [!NOTE]
> `(uuid, plan)` の複合主キーにより、同一ユーザー・同一計画タイプのレコードが重複して作成されることを防ぎます。
> ターン進行時に成功した計画のみをカウントし、upsert で累積加算します。

### 9. `missile_stats` (ミサイル戦績サマリー)

各ユーザーのミサイルによる総合戦績を累積管理します。

| カラム名       | データ型      | 制約                       | 説明                            |
| :------------- | :------------ | :------------------------- | :------------------------------ |
| `uuid`         | `varchar(25)` | PRIMARY KEY, FK(user.uuid) | ユーザーID                      |
| `monster_kill` | `integer`     | DEFAULT 0, NOT NULL        | ミサイルで討伐した怪獣総数      |
| `city_kill`    | `integer`     | DEFAULT 0, NOT NULL        | ミサイルで破壊した都市/施設総数 |

> [!NOTE]
> `uuid` を主キーとし、ターン進行時に upsert で加算更新します。

### 10. `missile_destroy_map_stats` (ミサイル地形破壊統計)

ミサイルで破壊した地形タイプごとの件数をユーザー単位で累積管理します。

| カラム名       | データ型       | 制約                          | 説明                                  |
| :------------- | :------------- | :---------------------------- | :------------------------------------ |
| **`uuid`**     | `varchar(25)`  | PRIMARY KEY[1], FK(user.uuid) | ユーザーID                            |
| **`map_type`** | `varchar(511)` | PRIMARY KEY[2]                | 破壊対象の地形タイプ（例: `factory`） |
| `count`        | `integer`      | DEFAULT 0, NOT NULL           | 累積破壊数                            |

> [!NOTE]
> `(uuid, map_type)` の複合主キーにより、同一ユーザー・同一地形タイプの重複レコード作成を防止します。

### 11. `missile_kill_monster_stats` (ミサイル怪獣討伐統計)

ミサイルで討伐した怪獣タイプごとの件数をユーザー単位で累積管理します。

| カラム名           | データ型       | 制約                          | 説明                                |
| :----------------- | :------------- | :---------------------------- | :---------------------------------- |
| **`uuid`**         | `varchar(25)`  | PRIMARY KEY[1], FK(user.uuid) | ユーザーID                          |
| **`monster_type`** | `varchar(511)` | PRIMARY KEY[2]                | 討伐した怪獣タイプ（例: `sanjira`） |
| `count`            | `integer`      | DEFAULT 0, NOT NULL           | 累積討伐数                          |

> [!NOTE]
> `(uuid, monster_type)` の複合主キーにより、同一ユーザー・同一怪獣タイプの重複レコード作成を防止します。

### 12. その他

- **`moderator_auth`**: 管理者認証(`uuid`, `id`, `password`, `user_name`, `role`, `must_change_credentials`, `login_fail_count`, `locked_until`)
- **`moderator_session`**: 管理者セッション(`session_id`, `uuid`, `public_key`, `expires`)
- **`last_login`**: ログイン統計(`uuid`, `last_login_at`, `consecutive_login_days`, etc.)
- **`event_rate`**: 各種災害発生確率の個人設定
- **認証系**: `access_token`, `refresh_token`, `passkey` (セッション維持およびWebAuthn用)
- **`turn_state`**: システム全体の現在ターンと更新状態管理

---

## 特記事項

1. **論理削除の運用**:
   ユーザーが島を破棄、あるいは人口0により無人化した際、`user.inhabited` を `0` に設定します。この際、`island`, `prize`, `plan` などの関連レコードはアプリケーションコード（`abandonIsland` 関数）によって明示的に削除されます。
