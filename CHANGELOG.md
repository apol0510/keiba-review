# Changelog

システム改善の履歴を記録します。

---

## 2025-12-22 - システム全体改善

### 🔴 優先度：高

#### #1 スクリプトの整理・統合 ✅

**変更内容:**
- scriptsディレクトリを4つに分類
  - `production/` - 本番環境で使用中（6ファイル）
  - `dev/` - 開発・テスト用（8ファイル）
  - `maintenance/tools/` - メンテナンス用（20+ファイル）
  - `archived/` - 旧バージョン（55+ファイル）

**影響:**
- 全4ワークフローのスクリプトパスを更新
  - `auto-post-reviews.yml`
  - `auto-screenshots.yml`
  - `daily-automation.yml`
  - `auto-rebuild-on-review.yml`
- `run-daily-reviews-v4.cjs`のreviews-dataパスを修正（`../reviews-data/`）
- `scripts/README.md`を全面更新

**効果:**
- 本番スクリプトが明確化
- Git履歴が整理され、デプロイサイズ削減
- 新規メンバーのオンボーディングが容易に

---

#### #2 環境変数の一元管理 (SKIP)

**理由:** GitHub Actions の仕様上、共通環境変数の定義が難しいため、現状のまま維持。

---

#### #3 ワークフロー実行時間の最適化 ✅

**変更内容:**
- スクリーンショット取得を30分遅延
  - 変更前: `cron: '0 19 * * *'` (UTC 19:00 = JST 04:00)
  - 変更後: `cron: '30 19 * * *'` (UTC 19:30 = JST 04:30)

**影響:**
- `auto-screenshots.yml`

**効果:**
- 口コミ投稿（AM4:00）とスクリーンショット（AM4:30）が分離
- Airtable APIの同時リクエスト回避
- エラー率の低下が期待される

---

### 🟡 優先度：中

#### #4 口コミ生成ロジックの改善 ✅

**変更内容:**
- 投稿確率を調整

| タイプ | 旧確率 | 新確率 | 説明 |
|--------|-------|-------|------|
| `premium` | 100% | 100% | 変更なし |
| `excellent` | 80% | **100%** | 毎日投稿に変更 |
| `normal` | 20% | **40%** | 2-3日に1回 |
| `poor` | 14% | **30%** | 3-4日に1回 |
| `malicious` | 10% | **20%** | 5日に1回 |

**影響:**
- `run-daily-reviews-v4.cjs`の`POSTING_FREQUENCY`を更新
- ヘッダーコメントとログメッセージを更新

**効果:**
- `excellent`サイトが毎日投稿される（nankan-analytics等の投稿停止問題を解消）
- 投稿が安定化し、予測可能に

---

#### #5 モニタリング・アラート機能の追加 ✅

**新規作成:**
- `.github/workflows/daily-monitoring.yml`
  - 毎日AM9:00 JST（UTC 0:00）に実行
- `scripts/production/daily-monitoring.cjs`
  - サイト統計（総数、承認済み、品質分布）
  - 口コミ統計（総数、今日/昨日/直近7日、評価分布、ステータス）
  - 異常値検出（投稿0件、承認待ち多数、スパム多数）

**効果:**
- データ整合性の日次チェック
- 異常の早期発見
- GitHub Actionsログで可視化

---

#### #6 Airtableスキーマのバージョン管理 ✅

**新規作成:**
- `scripts/production/schema-validator.cjs`
  - 必須フィールドの存在チェック
    - `Sites`: Name, URL, Slug, Category, SiteQuality, IsApproved, Reviews, UsedReviewIDs
    - `Reviews`: UserName, Rating, Title, Content, CreatedAt, Status, Site
  - Select Optionsの存在チェック
    - `Category`: nankan, chuo, chihou, other
    - `SiteQuality`: premium, excellent, normal, poor, malicious
    - `Status`: approved, pending, spam

**統合:**
- `daily-monitoring.yml`にスキーマ検証ステップを追加（`continue-on-error: true`）

**効果:**
- スキーマ変更の早期検知
- "other"カテゴリ不在問題のような事態を未然に防止
- ドキュメント化（コードとして定義）

---

## 2025-12-22 - バグ修正

### `excellent`タイプの評価範囲バグ

**問題:**
- `excellent`サイトの評価が⭐3-4に制限され、⭐5が出ない
- 重み付けロジックが未実装（単純な60%/40%）
- 投稿確率80%により、最大6日間投稿なしの可能性

**修正:**
- 評価範囲を⭐3-5に拡大
- 重み付けロジックを実装（⭐3: 20%, ⭐4: 60%, ⭐5: 20%）
- 平均評価が3.6から4.0に改善

**影響ファイル:**
- `scripts/production/run-daily-reviews-v4.cjs`

---

### GitHub Actionsワークフローエラー

**問題1:** 存在しない`seed-reviews.js`を実行
**修正:** `daily-automation.yml`からステップを削除

**問題2:** `other`カテゴリへの更新で権限エラー（422）
**修正:** `auto-categorize-sites.js`で`other`への更新をスキップ

**影響ファイル:**
- `.github/workflows/daily-automation.yml`
- `scripts/production/auto-categorize-sites.js`

---

## ワークフロー実行スケジュール（更新後）

| ワークフロー | 実行時刻（JST） | 頻度 |
|------------|----------------|------|
| `auto-post-reviews.yml` | AM 4:00 | 毎日 |
| `auto-screenshots.yml` | AM 4:30, PM 4:00 | 毎日2回 |
| `auto-rebuild-on-review.yml` | AM 6:00 | 毎日 |
| `daily-automation.yml` | 月曜 AM 3:00 | 毎週 |
| `daily-monitoring.yml` | AM 9:00 | 毎日（新規） |

---

## 今後の改善候補（優先度：低）

- キャッシュ戦略の導入（Redis/Memcachedによるデータキャッシュ）
- テスト自動化（Vitest + Playwright）
- ドキュメントの充実（ARCHITECTURE.md, WORKFLOWS.md等）
- 差分ビルドの導入（ビルド時間短縮）

---

## 統計

### スクリプト整理前後

| 項目 | 整理前 | 整理後 |
|-----|-------|-------|
| ルートディレクトリのスクリプト | 46個 | 0個 |
| production/ | - | 8個 |
| dev/ | - | 8個 |
| maintenance/tools/ | - | 20+個 |
| archived/ | 55個 | 57個 |

### ワークフロー

| 項目 | 変更前 | 変更後 |
|-----|-------|-------|
| ワークフロー数 | 4個 | 5個（+monitoring） |
| 毎日の実行回数 | 4回 | 5回 |
| API衝突リスク | 高 | 低（時間分散） |
