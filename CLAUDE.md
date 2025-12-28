# 競馬予想サイト口コミプラットフォーム

## プロジェクト概要

競馬予想サイトの口コミ・評価を集約するプラットフォーム。ユーザー投稿による信頼性の高い口コミを提供し、SEO最適化により検索上位表示を目指す。

## 技術スタック

- **フロントエンド**: Astro 4.x + React（インタラクティブ部分）
- **スタイリング**: Tailwind CSS 4
- **バックエンド**: Supabase（PostgreSQL + Auth + Storage）
- **フォーム**: React Hook Form + Zod
- **自動化**: GitHub Actions + Python
- **ホスティング**: Node.js（standalone mode）
- **外部サービス**: Bing Web Search API（サイト検知）, SendGrid（通知）, reCAPTCHA v3

## ディレクトリ構造

```
keiba-review/
├── src/
│   ├── pages/              # Astroページ
│   │   ├── index.astro     # トップページ
│   │   ├── keiba-yosou/    # サイト関連ページ
│   │   ├── admin/          # 管理画面
│   │   └── api/admin/      # 管理API
│   ├── components/         # UIコンポーネント
│   │   ├── *.astro         # 静的コンポーネント
│   │   └── *.tsx           # Reactコンポーネント（インタラクティブ）
│   ├── layouts/            # レイアウト
│   │   ├── BaseLayout.astro
│   │   └── AdminLayout.astro
│   ├── lib/                # ユーティリティ
│   │   ├── supabase.ts     # DB接続・型定義・API関数
│   │   └── validation.ts   # Zodスキーマ・NGワード検出
│   └── styles/
│       └── global.css      # Tailwind + カスタムスタイル
├── supabase/
│   └── schema.sql          # DBスキーマ（Supabase SQL Editorで実行）
├── scripts/
│   ├── production/         # 本番スクリプト（6個）
│   │   ├── run-daily-reviews-v4.cjs      # 口コミ自動投稿
│   │   ├── auto-capture-screenshots.cjs  # スクリーンショット取得
│   │   ├── fetch-keiba-sites.js          # サイト自動検知
│   │   ├── auto-categorize-sites.js      # カテゴリ自動分類
│   │   ├── daily-monitoring.cjs          # 日次モニタリング
│   │   └── schema-validator.cjs          # スキーマ検証
│   ├── dev/                # 開発・テスト用（8個）
│   ├── maintenance/        # メンテナンス用（20+個）
│   ├── archived/           # 旧バージョン（55+個）
│   ├── config/             # 設定ファイル
│   └── reviews-data/       # 口コミテンプレート（534件、6種類）
├── .github/workflows/
│   ├── auto-post-reviews.yml       # 毎日AM4:00
│   ├── auto-screenshots.yml        # 毎週月曜AM5:00
│   ├── daily-automation.yml        # 毎週月曜AM3:00
│   └── daily-monitoring.yml        # 毎週月曜AM9:00
├── public/                 # 静的ファイル
├── .env.example            # 環境変数テンプレート
├── CHANGELOG.md            # 改善履歴
└── astro.config.mjs        # Astro設定
```

## 主要コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー（本番環境テスト）
npm run preview

# サイト自動検知（SerpAPI使用）
node scripts/production/fetch-keiba-sites.js

# 日次モニタリング
node scripts/production/daily-monitoring.cjs

# スキーマ検証
node scripts/production/schema-validator.cjs
```

## 環境変数

```bash
# 必須 - サイト設定
SITE_URL=https://keiba-review.jp  # 本番ドメイン（canonical URL生成に使用）

# 推奨 - Google Analytics 4（トラフィック分析）
PUBLIC_GA_ID=G-XXXXXXXXXX  # GA4測定ID

# 必須 - Airtable（データベース）
AIRTABLE_API_KEY=patXXXXXXXXXXXXXXXX  # Personal Access Token
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX     # ベースID

# 推奨 - SerpAPI（サイト自動検知）
SERPAPI_KEY=your-serpapi-key-here  # 無料枠: 月5,000クエリ

# オプション - Netlify（自動デプロイ）
NETLIFY_AUTH_TOKEN=your-netlify-token
NETLIFY_SITE_ID=your-site-id

# オプション - SendGrid（メール通知・未実装）
SENDGRID_API_KEY=xxx
SENDGRID_FROM_EMAIL=support@keiba-review.jp
ADMIN_EMAIL=your-email@example.com

# オプション - reCAPTCHA v3（スパム対策・未実装）
PUBLIC_RECAPTCHA_SITE_KEY=xxx
RECAPTCHA_SECRET_KEY=xxx
```

## データベース（Supabase）

### セットアップ手順

1. Supabaseプロジェクトを作成
2. SQL Editor で `supabase/schema.sql` を実行
3. `.env` ファイルを作成し環境変数を設定

### テーブル

| テーブル | 説明 |
|---------|------|
| `sites` | 競馬予想サイト情報 |
| `reviews` | 口コミ（承認制） |
| `detailed_ratings` | 詳細評価（的中率、料金、サポート、透明性） |
| `site_stats` | サイト統計キャッシュ（トリガーで自動更新） |

### ビュー

- `sites_with_stats` - サイト一覧用（統計情報込み）
- `approved_reviews` - 承認済み口コミ一覧

### カテゴリ

- `nankan` - NANKAN（南関競馬）
- `chuo` - 中央競馬
- `chihou` - 地方競馬
- `other` - その他

## 口コミテンプレート

自動投稿用の口コミテンプレートを6種類、合計534件用意しています。

| テンプレート | 件数 | 用途 |
|------------|------|------|
| ⭐1（辛口／クレーム寄り） | 70件 | maliciousサイト用 |
| ⭐2（少し辛口寄り） | 130件 | poor/maliciousサイト用 |
| ⭐3（ニュートラル） | 70件 | normal/poor用（可もなく不可もなく） |
| ⭐3（ややポジティブ） | 90件 | excellent/premium用（期待値を少し下回るが悪くない） |
| ⭐4（少しポジティブ寄り） | 74件 | normal/excellent用 |
| ⭐5（premium専用・高評価） | 100件 | premium/excellent用 |
| **合計** | **534件** | |

### サイト品質別の評価分布

**🌟 premium（南関アナリティクス専用）:**
- ⭐3-5、毎日100%投稿
- 重み付け: ⭐3(20%), ⭐4(60%), ⭐5(20%)
- 平均評価: 4.0

**✅ excellent（優良サイト）:**
- ⭐3-5、毎日100%投稿
- 重み付け: ⭐3(15%), ⭐4(60%), ⭐5(25%)
- 平均評価: 4.1
- ⭐3は「ややポジティブ」版を使用

**⚪ normal（通常サイト）:**
- ⭐2-4、2-3日に1回40%投稿
- 平均評価: 約3.0

**⚠️ poor（低品質サイト）:**
- ⭐1-3、3-4日に1回30%投稿
- 平均評価: 約2.0

**❌ malicious（悪質サイト）:**
- ⭐1-2、5日に1回20%投稿
- 平均評価: 約1.5

## URL構造

| URL | ページ |
|-----|--------|
| `/` | トップページ |
| `/keiba-yosou/` | サイト一覧 |
| `/keiba-yosou/nankan/` | NANKANカテゴリ |
| `/keiba-yosou/chuo/` | 中央競馬カテゴリ |
| `/keiba-yosou/chihou/` | 地方競馬カテゴリ |
| `/keiba-yosou/[slug]/` | サイト詳細・口コミ投稿 |
| `/admin/` | 管理ダッシュボード |
| `/admin/reviews/` | 口コミ管理（承認/却下） |
| `/admin/sites/` | サイト管理（追加/編集） |

## 管理API

| エンドポイント | 機能 |
|---------------|------|
| `POST /api/admin/reviews/approve` | 口コミ承認 |
| `POST /api/admin/reviews/spam` | スパム報告 |
| `POST /api/admin/reviews/delete` | 口コミ削除 |
| `POST /api/admin/sites/add` | サイト追加 |
| `POST /api/admin/sites/approve` | サイト承認 |
| `POST /api/admin/sites/delete` | サイト削除 |

## 自動化

### GitHub Actions

1. **auto-post-reviews.yml** - 毎日AM4:00（JST）
   - サイト品質に応じた口コミ自動投稿
   - premium/excellent: 毎日100%投稿
   - normal: 40%投稿、poor: 30%投稿、malicious: 20%投稿
   - 534件のテンプレートからランダム選択
   - 投稿後のデータ整合性検証

2. **daily-automation.yml** - 毎週月曜AM3:00（JST）
   - SerpAPIで競馬予想サイトを検索（Google検索結果）
   - 新規サイトをAirtableに登録（Status: pending）
   - カテゴリ自動判定（nankan/chuo/chihou/other）
   - 重複チェック（URL完全一致 + ドメイン類似度）
   - Netlifyに自動デプロイ

   **検索キーワード:**
   - 南関競馬 予想サイト
   - 地方競馬 予想
   - 中央競馬 予想サイト
   - 競馬予想 的中

3. **auto-screenshots.yml** - 毎週月曜AM5:00（JST）
   - 全サイトのスクリーンショット自動取得
   - Cloudinaryに自動アップロード
   - API衝突回避のため口コミ投稿の1時間後に実行

4. **daily-monitoring.yml** - 毎週月曜AM9:00（JST）
   - Airtableスキーマ検証
   - サイト統計・口コミ統計の確認
   - 異常値検出とアラート

### GitHub Secrets設定

**必須シークレット:**
```
SERPAPI_KEY              # SerpAPI APIキー
AIRTABLE_API_KEY         # Airtable Personal Access Token
AIRTABLE_BASE_ID         # AirtableベースID
```

**オプションシークレット:**
```
NETLIFY_AUTH_TOKEN       # Netlify自動デプロイ用
NETLIFY_SITE_ID          # Netlify自動デプロイ用
SENDGRID_API_KEY         # メール通知用
SENDGRID_FROM_EMAIL      # メール通知用
ADMIN_EMAIL              # メール通知用
```

設定場所: https://github.com/apol0510/keiba-review/settings/secrets/actions

## 開発ガイドライン

### コンポーネント

- 静的表示: `.astro` ファイル
- インタラクティブ（フォーム等）: `.tsx` ファイル + `client:load`

### 口コミ投稿ルール

- 承認制（管理者が目視確認後に公開）
- NGワード検出あり（URLリンク禁止）
- 20〜500文字
- Zodでバリデーション
- reCAPTCHA v3でスパム対策（任意）

### セキュリティ

- Supabase RLSで一般ユーザーは承認済みデータのみ閲覧可能
- 管理APIはサービスキーでRLSをバイパス
- ユーザー入力はAstro/Reactで自動エスケープ

## 現在の進捗

### Phase 1 (MVP) - 完了
- [x] Astroプロジェクト初期化
- [x] Supabase SQLスキーマ作成
- [x] 基本レイアウト・コンポーネント
- [x] トップページ
- [x] サイト一覧・カテゴリページ
- [x] サイト詳細ページ（構造化データ対応）
- [x] 口コミ投稿フォーム（React）
- [x] 管理画面（ダッシュボード、口コミ管理、サイト管理）

### Phase 2 - 完了 ✅
- [x] ~~Bing Web Search API~~によるサイト自動検知 → **SerpAPIに移行**
- [x] SerpAPI統合（Google検索結果から自動検知）
- [x] SendGrid通知機能
- [x] reCAPTCHA v3実装

### Phase 3 - 完了 ✅
- [x] サイトマップ自動生成（`/sitemap.xml`）
  - 全静的ページを含む（トップ、サイト一覧、カテゴリ、about、terms、privacy、contact）
  - 承認済みサイト詳細ページを動的に生成
  - 優先度とchangefreq設定済み
- [x] OGP画像動的生成
  - サイト別OGP画像（`/og/[slug].png`）
  - デフォルトOGP画像（`/og/default.png`）
  - Satori + Resvgで日本語フォント対応
  - カテゴリカラー、評価、口コミ数を表示
- [x] パフォーマンス最適化
  - アセットのインライン化（4KB以下）
  - チャンク最適化（react-vendor、form-vendor分離）
  - HTML圧縮有効化
  - プリフェッチ設定（hoverストラテジー）
  - キャッシュヘッダー設定（Netlify）
  - DNS Prefetch + Preconnect設定
  - 構造化データ追加（WebSite、Product、Review）

### Phase 4 - 完了 ✅
- [x] エラーページ実装
  - カスタム404ページ（`/404.astro`）
    - モダンなデザイン
    - 人気カテゴリへのクイックリンク
    - お問い合わせへの誘導
  - カスタム500ページ（`/500.astro`）
    - エラー詳細表示
    - ページ再読み込みボタン
    - トラブルシューティングガイド
- [x] UXコンポーネント
  - ErrorBoundary（`ErrorBoundary.tsx`）
    - Reactエラーバウンダリー
    - 開発環境でのエラー詳細表示
  - LoadingSpinner（`LoadingSpinner.astro`）
    - サイズ可変のスピナー
    - メッセージ表示機能
  - SkeletonCard（`SkeletonCard.astro`）
    - ローディング中のプレースホルダー
    - アニメーション付き
  - EmptyState（`EmptyState.astro`）
    - 空状態の統一UI
    - アイコン、タイトル、説明、アクション
  - Toast（`Toast.tsx`）
    - 通知コンポーネント
    - 4種類のタイプ（success、error、warning、info）
    - 自動非表示機能

### Phase 7 - 完了 ✅ (SerpAPI統合)
- [x] SerpAPIパッケージのインストール
- [x] `scripts/fetch-keiba-sites.js` の更新
  - Bing Search APIからSerpAPIに移行
  - Google検索結果を利用
  - カテゴリ自動判定機能
  - 重複チェック機能
- [x] 環境変数の設定（SERPAPI_KEY）
- [x] ドキュメント更新

### Phase 8 - 完了 ✅ (Airtable統合 + GitHub Actions自動化)
- [x] Airtableベース作成・設定
  - `Sites`テーブル（競馬予想サイト情報）
  - `Reviews`テーブル（口コミデータ）
  - カテゴリ自動判定フィールド
  - 自動リンクフィールド設定
- [x] GitHub Actionsワークフロー実装
  - `daily-automation.yml`（毎週月曜AM3:00 JST実行）
  - SerpAPIで新規サイト検索
  - Airtableへの自動登録
  - Netlify自動デプロイ
- [x] GitHub Secrets設定完了
  - `SERPAPI_KEY`
  - `AIRTABLE_API_KEY`
  - `AIRTABLE_BASE_ID`
  - `NETLIFY_AUTH_TOKEN`（オプション）
  - `NETLIFY_SITE_ID`（オプション）
- [x] 手動ワークフロー実行テスト成功

### Phase 9 - 完了 ✅ (品質向上・モニタリング強化)
- [x] Google Analytics 4統合
  - BaseLayout.astroにGA4トラッキング実装
  - 外部リンククリックイベント測定
  - PUBLIC_GA_ID環境変数対応
- [x] Weekly Monitoringワークフロー実装
  - `daily-monitoring.cjs` - サイト統計・口コミ統計・異常値検出
  - `schema-validator.cjs` - Airtableスキーマ検証
  - 毎週月曜AM9:00 JST実行
- [x] 口コミテンプレート品質向上
  - ⭐3（ややポジティブ）テンプレート追加（90件）
  - excellent/premiumサイト用のポジティブな⭐3評価
  - テンプレート合計534件（6種類）
- [x] excellentサイト評価分布最適化
  - ⭐3: 20% → 15%
  - ⭐4: 60% → 60%（変更なし）
  - ⭐5: 20% → 25%
  - 平均評価: 4.0 → 4.1に向上
- [x] Canonical URL問題修正
  - SITE_URL環境変数の導入
  - 全ページで統一されたcanonical URL生成
  - Search Console対応
- [x] ユーザー名生成ロジック改善
  - 重複防止機能の強化
  - よりリアルな命名パターン

## Google Analytics 4統合ガイド

### GA4とは
- Googleの最新アクセス解析ツール
- 無料で利用可能（月間1,000万イベントまで）
- リアルタイム分析、ユーザー行動追跡、コンバージョン測定

### セットアップ手順

1. **Google Analytics 4アカウント作成**
   - https://analytics.google.com/ にアクセス
   - 「管理」→「プロパティを作成」
   - プロパティ名: 「競馬予想サイト口コミ」
   - レポートのタイムゾーン: 日本
   - 通貨: 日本円（JPY）

2. **測定IDの取得**
   - 「管理」→「データストリーム」→「ウェブ」
   - ウェブサイトURL: `https://keiba-review.jp`
   - ストリーム名: 「keiba-review.jp」
   - 測定ID（`G-XXXXXXXXXX`）をコピー

3. **環境変数の設定**
   ```bash
   # Netlifyの場合
   netlify env:set PUBLIC_GA_ID "G-XXXXXXXXXX"

   # ローカル開発の場合 (.env)
   PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

4. **デプロイ**
   - コードは既に実装済み（BaseLayout.astro）
   - 環境変数設定後、デプロイすれば自動的に有効化

### 測定される主要イベント

**自動で測定されるイベント:**
- `page_view` - ページ閲覧
- `first_visit` - 初回訪問
- `session_start` - セッション開始

**カスタムイベント（実装済み）:**
- `click` - 外部リンククリック
  - `event_category: 'outbound'`
  - `event_label: リンクURL`
  - `link_text: リンクテキスト`

### 推奨する追加設定

**1. Search Consoleとの連携**
- GA4管理画面 → 「Search Consoleのリンク」
- 検索キーワード、クリック率、表示回数を確認可能

**2. コンバージョン設定**
- 外部リンククリック（nankan-analyticsへの遷移）をコンバージョンとして登録
- 「管理」→「イベント」→「click」→「コンバージョンとしてマークを付ける」

**3. カスタムレポート作成**
- サイト別の外部リンククリック率
- カテゴリ別のページビュー
- デバイス別のコンバージョン率

### トラブルシューティング

**データが表示されない場合:**
1. 環境変数が正しく設定されているか確認（`PUBLIC_GA_ID`）
2. 測定IDが正しいか確認（`G-`で始まる）
3. デプロイが完了しているか確認
4. GA4は最大24時間遅延する場合がある（リアルタイムレポートで即座に確認可能）

**リアルタイムで確認する方法:**
1. GA4管理画面 → 「レポート」→「リアルタイム」
2. 自分でサイトにアクセスして、カウントが増えるか確認

## SerpAPI統合ガイド

### SerpAPIとは
- Google検索結果をAPIで取得できるサービス
- 無料枠: 月5,000クエリ（Bingの月1,000クエリより多い）
- 日本語検索に対応
- 安定した動作

### セットアップ手順

1. **SerpAPIアカウント作成**
   ```bash
   # https://serpapi.com/ でアカウント作成
   # 無料枠: 月5,000クエリ
   ```

2. **APIキーの取得**
   - ダッシュボードから「API Key」をコピー

3. **環境変数の設定**
   ```bash
   # Netlifyの場合
   netlify env:set SERPAPI_KEY "your-serpapi-key-here"

   # ローカル開発の場合 (.env)
   SERPAPI_KEY=your-serpapi-key-here
   ```

4. **スクリプトの実行**
   ```bash
   # 新しい競馬予想サイトを自動検知
   node scripts/fetch-keiba-sites.js
   ```

### 検索キーワード

スクリプトは以下のキーワードで検索します：
- 南関競馬 予想サイト
- 地方競馬 予想
- 中央競馬 予想サイト
- 競馬予想 的中

### カテゴリ自動判定

検出されたサイトは、以下のキーワードでカテゴリが自動判定されます：

- **南関競馬（nankan）**: 南関、大井、川崎、船橋、浦和
- **中央競馬（chuo）**: 中央競馬、JRA、東京競馬、阪神競馬、中京競馬、京都競馬
- **地方競馬（chihou）**: 地方競馬、NAR、園田、金沢、名古屋、高知
- **その他（other）**: 上記以外

### 使用例

```bash
# 環境変数を設定して実行
export SERPAPI_KEY="your-key"
export AIRTABLE_API_KEY="your-airtable-key"
export AIRTABLE_BASE_ID="your-base-id"

node scripts/fetch-keiba-sites.js
```

出力例：
```
🚀 競馬予想サイト自動取得を開始します (SerpAPI版)

📝 SerpAPI: Google検索結果を取得します
📝 無料枠: 月5,000クエリ

🔍 検索中: "南関競馬 予想サイト"
  ✅ 10件の結果を取得

📊 検索結果: 5件の新規サイトを発見

📝 登録中: 競馬予想サイトA (nankan)
  ✅ 登録完了: https://example.com

🎉 完了: 5件のサイトを登録しました
```

### 次のステップ

1. 管理画面で確認: https://frabjous-taiyaki-460401.netlify.app/admin/pending-sites
2. サイトを承認して公開
3. フロントエンドで確認: https://frabjous-taiyaki-460401.netlify.app/

## Airtable統合ガイド

### Airtableとは
- クラウドベースのスプレッドシートデータベース
- リレーショナルデータの管理が簡単
- APIアクセスが標準で利用可能
- 無料枠: 月1,000レコード

### Airtableベース構造

**Sitesテーブル:**
| フィールド | タイプ | 説明 |
|----------|--------|------|
| Name | Single line text | サイト名 |
| URL | URL | サイトURL |
| Category | Single select | カテゴリ（nankan/chuo/chihou/other） |
| Description | Long text | サイト説明 |
| Status | Single select | ステータス（active/pending/rejected） |
| Reviews | Link to Reviews | 関連する口コミ（自動リンク） |
| Review Count | Count | 口コミ数（自動計算） |
| Average Rating | Rollup | 平均評価（自動計算） |
| Created | Created time | 作成日時 |

**Reviewsテーブル:**
| フィールド | タイプ | 説明 |
|----------|--------|------|
| Site | Link to Sites | 対象サイト |
| Username | Single line text | ユーザー名 |
| Rating | Number | 評価（1-5） |
| Title | Single line text | タイトル |
| Content | Long text | 口コミ本文 |
| Status | Single select | ステータス（approved/pending/spam） |
| Created | Created time | 作成日時 |

### GitHub Actionsワークフロー

**daily-automation.yml の動作:**
1. 毎週月曜AM3:00（JST）に自動実行
2. SerpAPIで競馬予想サイトを検索
3. 新規サイトをAirtableに登録（Status: pending）
4. カテゴリ自動判定（nankan/chuo/chihou/other）
5. Netlifyに自動デプロイ

**手動実行方法:**
```bash
# GitHub CLIを使用
gh workflow run daily-automation.yml

# 実行状況の確認
gh run list --limit 3

# ログの確認
gh run view <run-id> --log
```

**Webから手動実行:**
1. https://github.com/apol0510/keiba-review/actions
2. 「Daily Site Discovery & Data Maintenance」を選択
3. 「Run workflow」をクリック
4. 「Run workflow」を再度クリック

### トラブルシューティング

**ワークフローがエラーになる場合:**
1. GitHub Secretsが正しく設定されているか確認
2. Airtable APIキーの権限を確認（`data.records:read`, `data.records:write`）
3. SerpAPIの利用上限を確認（無料枠: 月5,000クエリ）
4. GitHub Actionsのログを確認

**Airtableにデータが登録されない場合:**
1. Airtableベース構造が正しいか確認
2. APIキーの権限を確認
3. ベースIDが正しいか確認（URLの`app...`部分）

**Netlifyデプロイが失敗する場合:**
1. `NETLIFY_AUTH_TOKEN`と`NETLIFY_SITE_ID`が設定されているか確認
2. Netlify CLIがインストールされているか確認（ワークフロー内で自動インストール）
3. デプロイ権限があるか確認

**Netlifyデプロイが失敗する場合（NOT_AUTHORIZEDエラー）:**
- **症状**: ビルド時に `{"error":"NOT_AUTHORIZED","message":"You are not authorized to perform this operation","statusCode":403}` が発生
- **原因**: Netlifyの環境変数に設定されているAirtable APIキーが古い、または無効になっている
- **解決方法**:
  ```bash
  # Netlifyの環境変数を最新のAPIキーに更新
  netlify env:set AIRTABLE_API_KEY "your-latest-api-key"
  netlify env:set AIRTABLE_BASE_ID "your-base-id"

  # デプロイをトリガー（GitHubにpushするか、手動デプロイ）
  git commit --allow-empty -m "Trigger deploy"
  git push
  ```
- **確認方法**: ローカルで `npm run build` を実行してエラーが出ないか確認
- **修正日**: 2025-12-27

## 参照

詳細仕様: `keiba-review-spec.md`
