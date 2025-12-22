# Changelog

システム改善の履歴を記録します。

---

## 2025-12-22 - 午後: SEO改善

### Search Console「代替ページ」問題の修正 ✅

**問題:**
- Search Consoleで「代替ページ（適切な canonical タグあり）」として1ページ検出
- 原因: 本番環境でSITE_URLが未設定
- デフォルト値が誤ったドメイン（`keiba-review.com`）を使用
- 実際のドメイン: `keiba-review.jp`

**修正内容:**

1. **Netlify環境変数の設定**
   ```bash
   SITE_URL=https://keiba-review.jp
   ```

2. **ハードコードされたURLの修正**
   - `src/layouts/BaseLayout.astro`: canonical URL生成ロジック
   - `src/pages/index.astro`: WebSite構造化データ
   - `src/pages/sitemap.xml.ts`: サイトマップURL
   - `src/pages/keiba-yosou/[slug]/index.astro`: Product/BreadcrumbList構造化データ
   - `src/pages/faq.astro`: BreadcrumbList構造化データ

3. **環境変数ベースのURL生成**
   ```javascript
   const siteUrl = import.meta.env.SITE_URL || 'https://frabjous-taiyaki-460401.netlify.app';
   const canonicalUrl = new URL(Astro.url.pathname, siteUrl).href;
   ```

**影響:**
- 全ページのcanonical URLが `https://keiba-review.jp/` に統一
- 構造化データ（Product, BreadcrumbList, WebSite）も正しいドメインを参照
- Search Consoleのインデックス問題が解消（数日で反映予定）

**効果:**
- SEO評価の向上
- 検索結果のURL統一
- 今後のドメイン変更も環境変数で柔軟に対応可能

---

## 2025-12-22 - 午前: ユーザー名生成改善

### ユーザー名生成ロジックの改善 ✅

**問題:**
- すべてのユーザー名に末尾番号が付いて不自然
- 例: `競馬太郎853`, `馬券師472`

**修正内容:**

1. **番号なしユーザー名を追加（70%の確率で使用）**
   - 名無しさん@競馬板
   - 匿名
   - 名無しさん
   - 競馬ファン
   - 南関ファン
   - 通りすがり
   - 競馬好き
   - 馬券生活者
   - 週末の戦士
   - 予想屋
   - 競馬研究家

2. **番号付き名前は30%のみ**
   - 番号の範囲を0-999から0-99に縮小
   - より自然な見た目に

3. **重複対策**
   - 番号なし名前が重複した場合のみ番号追加
   - 最近使用した100件を記録

**効果:**
- より自然な掲示板風のユーザー名
- 不自然な3桁番号の大幅削減
- リアルな口コミ感の向上

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
