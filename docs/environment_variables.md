# 環境変数一覧

このドキュメントでは、プロジェクト内で使用するすべての環境変数を説明します。

> [!NOTE]
> `NEXT_PUBLIC_` プレフィックスが付いた変数はクライアント（ブラウザ）でも参照できます。
> それ以外の変数はサーバーサイドでのみ利用可能です。

## 設定ファイルについて

このプロジェクトは [`dotenv-flow`](https://github.com/kerimdzhanov/dotenv-flow) を使用しています。
`NODE_ENV` の値に応じて以下の順番でファイルを読み込みます（後で読まれたものが優先）。

```
.env → .env.local → .env.{NODE_ENV} → .env.{NODE_ENV}.local
```

本番環境の機密情報は `.env.production.local` に記載し、**バージョン管理には含めないでください**。

---

## アプリケーション設定

| 変数名                   | 例                       | 説明                                                     |
| ------------------------ | ------------------------ | -------------------------------------------------------- |
| `NEXT_PUBLIC_TITLE`      | `箱庭諸島`               | サイトのタイトル                                         |
| `NEXT_PUBLIC_VERSION`    | `0.0.0`                  | アプリケーションのバージョン                             |
| `NEXT_PUBLIC_ORIGIN_URL` | `http://localhost:3000/` | サイトのオリジンURL（Passkey の RP ID 等でも参照される） |

---

## データベース設定

| 変数名                 | 例                      | 説明                                                         |
| ---------------------- | ----------------------- | ------------------------------------------------------------ |
| `DB_TYPE`              | `sqlite` / `mysql`      | 使用するDBの種別。`kysely-codegen` の `--dialect` に渡される |
| `DB_CONNECTION_STRING` | `./src/db/data/prod.db` | DB接続文字列。SQLiteはファイルパス、MySQLは接続URL           |

> [!IMPORTANT]
> `DB_TYPE=mysql` の場合、MySQL 5.7 以上が必要です。

---

## Passkey 設定

| 変数名                     | 例                   | 説明                                                                                                   |
| -------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_RP_NAME`      | `箱庭諸島`           | WebAuthn の Relying Party 名（ブラウザの認証ダイアログに表示される）                                   |
| `NEXT_PUBLIC_RP_ID`        | `localhost`          | WebAuthn の Relying Party ID。本番ではドメイン名（例: `example.com`）を設定する                        |
| `NEXT_PUBLIC_MAX_PASSKEYS` | `5`                  | ユーザーが登録できるPasskeyの最大数                                                                    |
| `PASSKEY_FP_PEPPER`        | _(ランダムな文字列)_ | フィンガープリントのハッシュ化に用いるペッパー。**変更するとすべてのフィンガープリントが無効化される** |

> [!CAUTION]
> `PASSKEY_FP_PEPPER` は環境ごとに異なるランダムな文字列を設定し、外部に漏らさないでください。

---

## ターン進行設定

| 変数名                      | 例                         | 説明                                               |
| --------------------------- | -------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_TURN_CRON`     | `"0 0,4,8,12,16,20 * * *"` | ターンを自動実行するcronスケジュール（croner形式） |
| `NEXT_PUBLIC_TURN_TIMEZONE` | `"Asia/Tokyo"`             | ターンスケジュールのタイムゾーン                   |

---

## ログインボーナス設定

| 変数名                           | 例     | 説明                                     |
| -------------------------------- | ------ | ---------------------------------------- |
| `NEXT_PUBLIC_ENABLE_LOGIN_BONUS` | `true` | ログインボーナスを有効にするか           |
| `NEXT_PUBLIC_LOGIN_BONUS_MONEY`  | `200`  | ログインボーナスで付与する資金量（億円） |
| `NEXT_PUBLIC_LOGIN_BONUS_FOOD`   | `2000` | ログインボーナスで付与する食料量（トン） |

---

## ゲームパラメータ設定

### マップ・計画

| 変数名                    | 例   | 説明                                                      |
| ------------------------- | ---- | --------------------------------------------------------- |
| `NEXT_PUBLIC_MAP_SIZE`    | `12` | マップのサイズ（マップは `MAP_SIZE × MAP_SIZE` の正方形） |
| `NEXT_PUBLIC_PLAN_LENGTH` | `20` | 計画キューの最大数                                        |

### 単位表示

| 変数名                   | 例     | 説明           |
| ------------------------ | ------ | -------------- |
| `NEXT_PUBLIC_UNIT_MONEY` | `億円` | 資金の単位表示 |
| `NEXT_PUBLIC_UNIT_FOOD`  | `トン` | 食料の単位表示 |
| `NEXT_PUBLIC_UNIT_AREA`  | `万坪` | 面積の単位表示 |

### 資金

| 変数名                                | 例       | 説明                                         |
| ------------------------------------- | -------- | -------------------------------------------- |
| `NEXT_PUBLIC_INIT_MONEY`              | `1000`   | 島の初期資金                                 |
| `NEXT_PUBLIC_MAX_MONEY`               | `9999`   | 資金の上限値                                 |
| `NEXT_PUBLIC_EARN_FACTORY_PER_PEOPLE` | `0.001`  | 工場1マスあたりの資金収入（規模1人あたり）   |
| `NEXT_PUBLIC_EARN_MINING_PER_PEOPLE`  | `0.001`  | 採掘場1マスあたりの資金収入（規模1人あたり） |
| `NEXT_PUBLIC_FOOD_TO_MONEY_RATE`      | `0.0008` | 食料を資金に変換するレート                   |

### 食料

| 変数名                               | 例       | 説明                                         |
| ------------------------------------ | -------- | -------------------------------------------- |
| `NEXT_PUBLIC_INIT_FOOD`              | `1000`   | 島の初期食料                                 |
| `NEXT_PUBLIC_MAX_FOOD`               | `999900` | 食料の上限値                                 |
| `NEXT_PUBLIC_EATEN_FOOD_PER_PEOPLE`  | `0.2`    | 人口1人あたりの食料消費量（毎ターン）        |
| `NEXT_PUBLIC_LACK_FOOD_DESTROY_RATE` | `25`     | 食料枯渇時に破壊される地形の割合（%）        |
| `NEXT_PUBLIC_EARN_FARM_PER_PEOPLE`   | `1`      | 農場1マスあたりの食料生産量（規模1人あたり） |

### 人口

| 変数名                                  | 例   | 説明                                |
| --------------------------------------- | ---- | ----------------------------------- |
| `NEXT_PUBLIC_PEOPLE_GROWTH_VILLAGE`     | `10` | 村の人口増加量（毎ターン）          |
| `NEXT_PUBLIC_PEOPLE_GROWTH_TOWN`        | `10` | 町の人口増加量（毎ターン）          |
| `NEXT_PUBLIC_PEOPLE_GROWTH_CITY`        | `0`  | 都市の人口増加量（毎ターン）        |
| `NEXT_PUBLIC_PEOPLE_PROPAGANDA_VILLAGE` | `30` | プロパガンダ時の村の人口増加量/10   |
| `NEXT_PUBLIC_PEOPLE_PROPAGANDA_TOWN`    | `30` | プロパガンダ時の町の人口増加量/10   |
| `NEXT_PUBLIC_PEOPLE_PROPAGANDA_CITY`    | `3`  | プロパガンダ時の都市の人口増加量/10 |
| `NEXT_PUBLIC_PEOPLE_LOSS_FAMINE`        | `3`  | 飢饉時の人口減少量（毎ターン）      |
| `NEXT_PUBLIC_VILLAGE_APPEARANCE_RATE`   | `20` | 平地に村が出現する確率 (%)          |

### 植林

| 変数名                     | 例  | 説明                   |
| -------------------------- | --- | ---------------------- |
| `NEXT_PUBLIC_FOREST_VALUE` | `5` | 森の売値 (X億円/100本) |

---

## 自然災害・イベント設定

各種イベントの発生確率は「毎ターンの発生確率（%）」です。

| 変数名                                  | 例       | 説明                              |
| --------------------------------------- | -------- | --------------------------------- |
| `NEXT_PUBLIC_EARTHQUAKE_RATE`           | `0.5`    | 地震の発生確率（%）               |
| `NEXT_PUBLIC_EARTHQUAKE_DESTROY_RATE`   | `25`     | 地震で破壊される地形の割合（%）   |
| `NEXT_PUBLIC_TSUNAMI_RATE`              | `1.5`    | 津波の発生確率（%）               |
| `NEXT_PUBLIC_TYPHOON_RATE`              | `2`      | 台風の発生確率（%）               |
| `NEXT_PUBLIC_METEORITE_RATE`            | `1.5`    | 隕石の発生確率（%）               |
| `NEXT_PUBLIC_CONTINUOUS_METEORITE_RATE` | `50`     | 隕石が連続して落下する確率（%）   |
| `NEXT_PUBLIC_HUGE_METEORITE_RATE`       | `0.5`    | 巨大隕石の発生確率（%）           |
| `NEXT_PUBLIC_ERUPTION_RATE`             | `1`      | 火山噴火の発生確率（%）           |
| `NEXT_PUBLIC_FIRE_RATE`                 | `1`      | 火災の発生確率（%）               |
| `NEXT_PUBLIC_FALL_DOWN_RATE`            | `3`      | 建物崩壊の発生確率（%）           |
| `NEXT_PUBLIC_FALL_DOWN_BORDER`          | `9000`   | 建物崩壊が発生する人口の閾値      |
| `NEXT_PUBLIC_BURIED_TREASURE_RATE`      | `0.1`    | 埋蔵金発見の発生確率（%）         |
| `NEXT_PUBLIC_OIL_FIELD_RATE`            | `1`      | 油田発見の発生確率（%）           |
| `NEXT_PUBLIC_OIL_EXHAUSTION_RATE`       | `40`     | 油田が枯渇する確率（%、毎ターン） |
| `NEXT_PUBLIC_OIL_EARN`                  | `1000`   | 油田からの収益                    |
| `NEXT_PUBLIC_MONSTER_RATE`              | `0.03`   | 怪獣出現の発生確率（%）           |
| `NEXT_PUBLIC_MONSTER_POP_BORDER_1`      | `100000` | 怪獣出現レベル1の人口閾値         |
| `NEXT_PUBLIC_MONSTER_POP_BORDER_2`      | `250000` | 怪獣出現レベル2の人口閾値         |
| `NEXT_PUBLIC_MONSTER_POP_BORDER_3`      | `400000` | 怪獣出現レベル3の人口閾値         |

---

## 認証設定（サーバーサイドのみ）

| 変数名                       | 例         | 説明                                          |
| ---------------------------- | ---------- | --------------------------------------------- |
| `ISSUER`                     | `JOHN_DOE` | JWTトークンの発行者識別子                     |
| `ACCESS_TOKEN_EXPIRES_HOUR`  | `1`        | アクセストークンの有効期限（時間）            |
| `REFRESH_TOKEN_EXPIRES_HOUR` | `720`      | リフレッシュトークンの有効期限（時間）        |
| `LOGIN_FAIL_LIMIT`           | `5`        | ログイン失敗の上限回数                        |
| `LOGIN_LOCK_MINUTE`          | `10`       | ログイン失敗上限超過後のロック時間（分）      |
| `MAX_SESSIONS`               | `3`        | 1ユーザーが同時に保持できるセッション数の上限 |

## 管理者認証設定（サーバーサイドのみ）

| 変数名                           | 例              | 説明                                                                 |
| -------------------------------- | --------------- | -------------------------------------------------------------------- |
| `MODERATOR_INITIAL_ID`           | `admin0001`     | 初期管理者ID。初回マイグレーション時に `moderator_auth` へ投入される |
| `MODERATOR_INITIAL_PASSWORD`     | `AdminPass1234` | 初期管理者パスワード（平文入力、DBにはハッシュで保存）               |
| `MODERATOR_INITIAL_USER_NAME`    | `Administrator` | 初期管理者ユーザー名                                                 |
| `MODERATOR_SESSION_EXPIRES_HOUR` | `12`            | 管理者セッションの有効期限（時間）                                   |

## その他 (サーバダードのみ)

| 変数名                             | 例   | 説明                                     |
| ---------------------------------- | ---- | ---------------------------------------- |
| `ISLAND_NAME_CHANGE_COOLDOWN_DAYS` | `30` | 島名を再変更できるまでのクールダウン日数 |
