# 競馬予想サイト口コミプラットフォーム 詳細仕様書

**プロジェクト名**: 競馬予想サイト評価プラットフォーム  
**作成日**: 2025年11月22日  
**対象**: 競馬予想サイトの客観的評価・口コミプラットフォーム

---

## 1. プロジェクト概要

### 1.1 目的
- ユーザーが投稿できる信頼性の高い競馬予想サイト口コミプラットフォーム
- 自動検知により新規サイトを網羅的にカバー
- SEO最適化により「競馬予想 口コミ」等のキーワードで上位表示
- u85.jpのような自動生成サイトに対抗する、本物の価値提供

### 1.2 ターゲットユーザー
- 競馬予想サイトを探している人
- NANKAN（南関競馬）ファン
- 地方競馬・中央競馬の予想情報を求める人

### 1.3 差別化ポイント
- ✅ ユーザー投稿による生の声
- ✅ 客観的なデータ（料金、的中率公開度など）
- ✅ スパム対策による高品質な口コミ
- ✅ 構造化データによるSEO優位性

---

## 2. 機能要件

### 2.1 ユーザー向け機能

#### トップページ
- [ ] 新着口コミ一覧（最新10件）
- [ ] 人気サイトランキング TOP20
  - 口コミ数順
  - 平均評価順
  - カテゴリ別（NANKAN/中央/地方）
- [ ] カテゴリ別サイト一覧
- [ ] 検索機能（サイト名、キーワード）

#### サイト詳細ページ（例: `/keiba-yosou/nankan-analytics/`）
- [ ] サイト基本情報
  - サイト名
  - URL（外部リンク）
  - カテゴリ（NANKAN/中央/地方）
  - 特徴・説明文
  - スクリーンショット
  - 料金情報（あれば）
- [ ] 総合評価
  - 平均星評価（5段階）
  - 口コミ件数
  - 評価分布グラフ
- [ ] 口コミ一覧
  - 最新順/評価順
  - ページネーション（10件/ページ）
- [ ] 口コミ投稿フォーム
- [ ] 関連サイト（同じカテゴリ）

#### 口コミ投稿フォーム
- [ ] ニックネーム（必須）
- [ ] メールアドレス（必須・非公開）
- [ ] 総合評価（1-5星、必須）
- [ ] 口コミタイトル（必須、50文字以内）
- [ ] 口コミ本文（必須、500文字以内）
- [ ] 詳細評価（任意）
  - 的中率満足度（1-5）
  - 料金満足度（1-5）
  - サポート満足度（1-5）
  - 情報透明性（1-5）
- [ ] reCAPTCHA v3
- [ ] 利用規約同意チェックボックス

#### サイト一覧ページ
- [ ] カテゴリフィルター
- [ ] 並び替え（新着/口コミ数/評価順）
- [ ] グリッド表示
  - サイト名
  - 平均評価
  - 口コミ件数
  - カテゴリバッジ

### 2.2 管理者機能

#### 管理ダッシュボード
- [ ] 承認待ち口コミ一覧
- [ ] 新規検知サイト一覧
- [ ] 統計情報
  - 総サイト数
  - 総口コミ数
  - 今月の新規口コミ数

#### 口コミ管理
- [ ] 承認/却下/削除
- [ ] スパム判定フラグ
- [ ] ユーザー情報確認

#### サイト管理
- [ ] サイト情報編集
- [ ] 手動追加
- [ ] カテゴリ変更
- [ ] 削除

### 2.3 自動化機能

#### 新規サイト自動検知
- [ ] 毎日3時に自動実行
- [ ] Google検索キーワード
  - "競馬 予想 サイト"
  - "南関 予想"
  - "地方競馬 予想"
  - "中央競馬 予想"
- [ ] 新規サイト発見時
  - Supabaseに自動保存
  - 管理者にメール通知
  - 基本情報を自動収集

#### サイト情報自動収集
- [ ] サイトタイトル（metaタグ）
- [ ] 説明文（meta description）
- [ ] OGP画像
- [ ] スクリーンショット自動取得

#### 通知機能
- [ ] 新規口コミ投稿時にメール通知
- [ ] 新規サイト検知時にメール通知
- [ ] 1日1回のサマリーメール（任意）

---

## 3. データベース設計（Supabase）

### 3.1 テーブル定義

#### sites（サイト情報）
```sql
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  url VARCHAR(500) NOT NULL UNIQUE,
  slug VARCHAR(200) NOT NULL UNIQUE,  -- URL用（例: nankan-analytics）
  category VARCHAR(50) NOT NULL,  -- 'nankan', 'chuo', 'chihou'
  description TEXT,
  features JSONB,  -- サイトの特徴（配列）
  price_info TEXT,  -- 料金情報
  screenshot_url VARCHAR(500),
  detected_at TIMESTAMP DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT FALSE,  -- 管理者承認済み
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_sites_category ON sites(category);
CREATE INDEX idx_sites_slug ON sites(slug);
CREATE INDEX idx_sites_approved ON sites(is_approved);
```

#### reviews（口コミ）
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  user_name VARCHAR(50) NOT NULL,
  user_email VARCHAR(200) NOT NULL,  -- 非公開
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  is_spam BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45),  -- スパム対策用
  user_agent TEXT,  -- スパム対策用
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
);

-- インデックス
CREATE INDEX idx_reviews_site_id ON reviews(site_id);
CREATE INDEX idx_reviews_approved ON reviews(is_approved);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
```

#### detailed_ratings（詳細評価）
```sql
CREATE TABLE detailed_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  price_rating INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  support_rating INTEGER CHECK (support_rating >= 1 AND support_rating <= 5),
  transparency_rating INTEGER CHECK (transparency_rating >= 1 AND transparency_rating <= 5)
);

CREATE INDEX idx_detailed_ratings_review_id ON detailed_ratings(review_id);
```

#### site_stats（サイト統計・キャッシュ用）
```sql
CREATE TABLE site_stats (
  site_id UUID PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
  review_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  last_review_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 ビュー（よく使うクエリを高速化）

```sql
-- サイト一覧用ビュー（統計情報込み）
CREATE VIEW sites_with_stats AS
SELECT 
  s.*,
  COALESCE(ss.review_count, 0) as review_count,
  COALESCE(ss.average_rating, 0) as average_rating,
  ss.last_review_at
FROM sites s
LEFT JOIN site_stats ss ON s.id = ss.site_id
WHERE s.is_approved = true;

-- 承認済み口コミビュー
CREATE VIEW approved_reviews AS
SELECT 
  r.*,
  s.name as site_name,
  s.slug as site_slug
FROM reviews r
JOIN sites s ON r.site_id = s.id
WHERE r.is_approved = true AND r.is_spam = false
ORDER BY r.created_at DESC;
```

### 3.3 Row Level Security（RLS）設定

```sql
-- 一般ユーザーは承認済みデータのみ閲覧可能
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- サイトの閲覧ポリシー
CREATE POLICY "Public can view approved sites"
  ON sites FOR SELECT
  USING (is_approved = true);

-- 口コミの閲覧ポリシー
CREATE POLICY "Public can view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true AND is_spam = false);

-- 口コミの投稿ポリシー（誰でも投稿可能）
CREATE POLICY "Anyone can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);
```

---

## 4. 画面設計・URL構造

### 4.1 URL設計

```
/ (トップページ)
/keiba-yosou/ (サイト一覧)
/keiba-yosou/nankan/ (NANKANカテゴリ)
/keiba-yosou/chuo/ (中央競馬カテゴリ)
/keiba-yosou/chihou/ (地方競馬カテゴリ)
/keiba-yosou/[slug]/ (サイト詳細、例: /keiba-yosou/nankan-analytics/)
/keiba-yosou/[slug]/kuchikomi/ (口コミ投稿完了ページ)
/admin/ (管理画面)
/admin/reviews/ (口コミ管理)
/admin/sites/ (サイト管理)
```

### 4.2 ページ構成

#### トップページ（/）

```
┌─────────────────────────────────────────┐
│ ヘッダー                                │
│ - ロゴ                                   │
│ - ナビゲーション（サイト一覧/カテゴリ）  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ メインビジュアル                         │
│ - キャッチコピー                         │
│ - 検索ボックス                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 人気サイトランキング TOP10              │
│ ┌───┬───┬───┬───┬───┐              │
│ │1位│2位│3位│4位│5位│              │
│ └───┴───┴───┴───┴───┘              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 最新口コミ                              │
│ - カード形式で10件表示                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ カテゴリ別サイト                         │
│ - NANKAN / 中央 / 地方                   │
└─────────────────────────────────────────┘
```

#### サイト詳細ページ（/keiba-yosou/[slug]/）

```
┌─────────────────────────────────────────┐
│ パンくずリスト                           │
│ トップ > サイト一覧 > NANKANアナリティクス│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ サイト情報カード                         │
│ ┌─────┐                                │
│ │ SS  │ NANKANアナリティクス            │
│ │     │ ★★★★☆ 4.2 (127件)          │
│ └─────┘ カテゴリ: NANKAN              │
│                                         │
│ [サイトを見る]ボタン                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 評価グラフ                              │
│ 的中率満足度: ★★★★☆                  │
│ 料金満足度:   ★★★☆☆                  │
│ サポート:     ★★★★☆                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 口コミ一覧（並び替え: 新着順/評価順）    │
│                                         │
│ ┌─────────────────────────────┐      │
│ │ ★★★★☆                      │      │
│ │ 「的中率が高い！」              │      │
│ │ by 匿名さん 2025/11/20         │      │
│ │ 南関の予想で何度も的中...       │      │
│ └─────────────────────────────┘      │
│                                         │
│ [もっと見る]                             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 口コミを投稿する                         │
│ [投稿フォームへ]ボタン                   │
└─────────────────────────────────────────┘
```

#### 口コミ投稿フォーム（モーダルまたは別ページ）

```
┌─────────────────────────────────────────┐
│ NANKANアナリティクスの口コミを投稿       │
└─────────────────────────────────────────┘

ニックネーム: [____________________]（必須）

メールアドレス: [____________________]（必須・非公開）

総合評価: ★☆☆☆☆（必須）

口コミタイトル: [____________________]（必須）

口コミ本文:
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
（500文字以内）

詳細評価（任意）:
的中率満足度: ★☆☆☆☆
料金満足度:   ★☆☆☆☆
サポート:     ★☆☆☆☆
情報透明性:   ★☆☆☆☆

□ 利用規約に同意する

[投稿する]ボタン
```

---

## 5. 自動化仕様（GitHub Actions）

### 5.1 新規サイト検知スクリプト

**実行タイミング**: 毎日 AM 3:00（JST）

**ファイル**: `.github/workflows/detect-new-sites.yml`

```yaml
name: Detect New Keiba Sites

on:
  schedule:
    - cron: '0 18 * * *'  # UTC 18:00 = JST 3:00
  workflow_dispatch:  # 手動実行も可能

jobs:
  detect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install playwright requests supabase-py
          playwright install chromium
      
      - name: Run detection script
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
          SENDGRID_API_KEY: ${{ secrets.SENDGRID_API_KEY }}
        run: python scripts/detect_new_sites.py
```

**スクリプト**: `scripts/detect_new_sites.py`

```python
import os
from playwright.sync_api import sync_playwright
from supabase import create_client
import hashlib
from datetime import datetime

# Supabase接続
supabase = create_client(
    os.environ['SUPABASE_URL'],
    os.environ['SUPABASE_KEY']
)

SEARCH_KEYWORDS = [
    "競馬 予想 サイト",
    "南関 予想",
    "地方競馬 予想 サイト",
    "中央競馬 予想 サイト"
]

def search_google(keyword):
    """Google検索を実行してURLリストを取得"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"https://www.google.com/search?q={keyword}")
        
        # 検索結果のリンクを取得
        links = page.locator('a[href^="http"]').all()
        urls = []
        
        for link in links[:20]:  # 上位20件
            href = link.get_attribute('href')
            if is_keiba_site(href):
                urls.append(href)
        
        browser.close()
        return urls

def is_keiba_site(url):
    """競馬予想サイトかどうか判定"""
    # 除外ドメイン
    exclude_domains = [
        'google.com', 'yahoo.co.jp', 'youtube.com',
        'twitter.com', 'facebook.com', 'wikipedia.org'
    ]
    
    for domain in exclude_domains:
        if domain in url:
            return False
    
    return True

def get_site_info(url):
    """サイトの基本情報を取得"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        try:
            page.goto(url, timeout=10000)
            
            # メタ情報取得
            title = page.title()
            description = page.locator('meta[name="description"]').get_attribute('content')
            
            # スクリーンショット
            screenshot_path = f"/tmp/{hashlib.md5(url.encode()).hexdigest()}.png"
            page.screenshot(path=screenshot_path)
            
            browser.close()
            
            return {
                'name': title,
                'description': description,
                'screenshot_path': screenshot_path
            }
        except:
            browser.close()
            return None

def save_to_supabase(url, site_info):
    """Supabaseに保存"""
    # 既存チェック
    existing = supabase.table('sites').select('id').eq('url', url).execute()
    if existing.data:
        print(f"Already exists: {url}")
        return
    
    # slug生成（URLから）
    slug = url.replace('https://', '').replace('http://', '').split('/')[0]
    slug = slug.replace('.', '-')
    
    # データ挿入
    data = {
        'url': url,
        'slug': slug,
        'name': site_info['name'],
        'description': site_info['description'],
        'category': detect_category(site_info['name'], site_info['description']),
        'is_approved': False  # 管理者承認待ち
    }
    
    result = supabase.table('sites').insert(data).execute()
    print(f"New site added: {url}")
    
    # TODO: スクリーンショットをSupabase Storageにアップロード
    # TODO: 管理者にメール通知

def detect_category(name, description):
    """カテゴリ自動判定"""
    text = (name + ' ' + (description or '')).lower()
    
    if '南関' in text or 'nankan' in text:
        return 'nankan'
    elif '中央' in text:
        return 'chuo'
    elif '地方' in text:
        return 'chihou'
    else:
        return 'other'

def main():
    all_urls = set()
    
    for keyword in SEARCH_KEYWORDS:
        print(f"Searching: {keyword}")
        urls = search_google(keyword)
        all_urls.update(urls)
    
    print(f"Found {len(all_urls)} unique URLs")
    
    for url in all_urls:
        print(f"Processing: {url}")
        site_info = get_site_info(url)
        
        if site_info:
            save_to_supabase(url, site_info)

if __name__ == '__main__':
    main()
```

### 5.2 統計更新スクリプト

**実行タイミング**: 毎時0分

```yaml
name: Update Site Statistics

on:
  schedule:
    - cron: '0 * * * *'  # 毎時0分
  workflow_dispatch:

jobs:
  update-stats:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Update statistics
        run: python scripts/update_stats.py
```

**スクリプト**: `scripts/update_stats.py`

```python
# 各サイトの口コミ統計を更新
from supabase import create_client
import os

supabase = create_client(
    os.environ['SUPABASE_URL'],
    os.environ['SUPABASE_KEY']
)

def update_all_stats():
    # 全サイトを取得
    sites = supabase.table('sites').select('id').execute()
    
    for site in sites.data:
        site_id = site['id']
        
        # 承認済み口コミの統計計算
        reviews = supabase.table('reviews')\
            .select('rating')\
            .eq('site_id', site_id)\
            .eq('is_approved', True)\
            .eq('is_spam', False)\
            .execute()
        
        if reviews.data:
            count = len(reviews.data)
            avg_rating = sum(r['rating'] for r in reviews.data) / count
            
            # 統計テーブル更新
            supabase.table('site_stats').upsert({
                'site_id': site_id,
                'review_count': count,
                'average_rating': round(avg_rating, 2),
                'updated_at': 'NOW()'
            }).execute()

if __name__ == '__main__':
    update_all_stats()
```

---

## 6. SEO施策

### 6.1 構造化データ（Schema.org）

各サイト詳細ページに埋め込み:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "NANKANアナリティクス",
  "description": "南関競馬のAI予想サイト。XGBoost、LSTM、ニューラルネットワークで分析",
  "image": "https://example.com/screenshots/nankan-analytics.png",
  "url": "https://keiba-review.com/keiba-yosou/nankan-analytics/",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "127",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "匿名さん"
      },
      "datePublished": "2025-11-20",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5"
      },
      "reviewBody": "的中率が高くて満足しています..."
    }
  ]
}
</script>
```

### 6.2 メタタグ設定

```html
<!-- サイト詳細ページ -->
<title>NANKANアナリティクスの口コミ・評判 | 競馬予想サイト評価</title>
<meta name="description" content="NANKANアナリティクスの口コミ127件を掲載。平均評価4.5★。実際の利用者による的中率、料金、サポート評価を確認できます。">
<meta name="keywords" content="NANKANアナリティクス,口コミ,評判,南関競馬,予想サイト">

<!-- OGP -->
<meta property="og:title" content="NANKANアナリティクスの口コミ・評判">
<meta property="og:description" content="127件の口コミ。平均評価4.5★">
<meta property="og:image" content="https://example.com/og-images/nankan-analytics.png">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="NANKANアナリティクスの口コミ">
<meta name="twitter:description" content="127件の口コミ。平均評価4.5★">
```

### 6.3 サイトマップ自動生成

```xml
<!-- sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://keiba-review.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://keiba-review.com/keiba-yosou/nankan-analytics/</loc>
    <lastmod>2025-11-22</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- 自動生成: 全サイトページ -->
</urlset>
```

### 6.4 内部リンク最適化

- パンくずリスト（全ページ）
- 関連サイトリンク（同カテゴリ）
- 人気サイトへのリンク（サイドバー）
- カテゴリページへのリンク

### 6.5 コンテンツSEO戦略

**狙うキーワード:**
- `[サイト名] 口コミ`
- `[サイト名] 評判`
- `[サイト名] 怪しい`
- `競馬予想 サイト おすすめ`
- `南関競馬 予想 サイト`
- `地方競馬 予想 無料`

**コンテンツ生成:**
- ユーザー投稿で自動的にコンテンツ増加
- 各サイトページが独立したランディングページ
- 定期的な更新（口コミ投稿）でGoogleに評価

---

## 7. 技術スタック

### 7.1 フロントエンド

- **フレームワーク**: Astro 4.x
- **スタイリング**: Tailwind CSS
- **コンポーネント**: React（インタラクティブ部分のみ）
- **フォーム**: React Hook Form + Zod（バリデーション）

### 7.2 バックエンド

- **データベース**: Supabase（PostgreSQL）
- **認証**: Supabase Auth（管理者ログイン用）
- **ストレージ**: Supabase Storage（スクリーンショット保存）
- **API**: Supabase REST API

### 7.3 自動化

- **CI/CD**: GitHub Actions
- **スクレイピング**: Playwright（Python）
- **スケジュール実行**: GitHub Actions Cron

### 7.4 外部サービス

- **reCAPTCHA**: Google reCAPTCHA v3
- **メール送信**: SendGrid（通知用）
- **ホスティング**: Netlify または Vercel

### 7.5 開発環境

- **エディタ**: VS Code + Claude Code
- **バージョン管理**: Git + GitHub
- **パッケージ管理**: npm

---

## 8. セキュリティ対策

### 8.1 スパム対策

1. **reCAPTCHA v3**
   - スコア0.5以下は自動却下
   
2. **レート制限**
   - 同一IPから1日3件まで
   - 同一メールアドレスから1サイトにつき1週間に1件まで

3. **NGワード検出**
```javascript
const NG_WORDS = [
  '絶対儲かる', '100%的中', 'http://', 'https://',
  '今すぐクリック', '無料登録'
];
```

4. **内容チェック**
   - 文字数: 20文字以上、500文字以内
   - 連続する同じ文字の制限
   - URLの禁止

### 8.2 データ保護

- **個人情報**: メールアドレスは非公開
- **HTTPS**: 全ページSSL化
- **RLS**: Supabase Row Level Security有効化
- **環境変数**: API KEYは全て環境変数で管理

### 8.3 XSS対策

- ユーザー入力は全てエスケープ
- Astroの自動エスケープ機能を活用
- `dangerouslySetInnerHTML`は使用禁止

---

## 9. 開発フェーズ

### Phase 1: MVP（最小機能版）2週間

**実装機能:**
- [ ] Supabaseデータベース構築
- [ ] サイト一覧ページ
- [ ] サイト詳細ページ
- [ ] 口コミ投稿フォーム（承認制）
- [ ] 基本的な管理画面
- [ ] デプロイ（Netlify）

**目標:** 手動でサイトを追加し、ユーザーが口コミ投稿できる状態

### Phase 2: 自動化実装 1週間

**実装機能:**
- [ ] GitHub Actions設定
- [ ] 新規サイト検知スクリプト
- [ ] サイト情報自動収集
- [ ] スクリーンショット自動取得
- [ ] 通知機能（SendGrid）

**目標:** 新規サイトを自動検知・追加できる状態

### Phase 3: SEO最適化 1週間

**実装機能:**
- [ ] 構造化データ実装
- [ ] メタタグ最適化
- [ ] サイトマップ自動生成
- [ ] OGP画像生成
- [ ] パフォーマンス最適化

**目標:** 検索エンジンで上位表示される状態

### Phase 4: 機能拡張 継続的

**実装機能:**
- [ ] 詳細評価機能
- [ ] ソート・フィルター強化
- [ ] ユーザー向け通知機能
- [ ] ダッシュボード強化
- [ ] A/Bテスト実装

---

## 10. KPI・成功指標

### 初期目標（3ヶ月）

- [ ] 登録サイト数: 50サイト以上
- [ ] 口コミ投稿数: 100件以上
- [ ] 月間訪問者数: 1,000人以上
- [ ] 検索順位: 「競馬予想 口コミ」で20位以内

### 中期目標（6ヶ月）

- [ ] 登録サイト数: 100サイト以上
- [ ] 口コミ投稿数: 500件以上
- [ ] 月間訪問者数: 5,000人以上
- [ ] 検索順位: 「競馬予想 口コミ」で10位以内

### 長期目標（1年）

- [ ] 登録サイト数: 200サイト以上
- [ ] 口コミ投稿数: 2,000件以上
- [ ] 月間訪問者数: 20,000人以上
- [ ] 検索順位: 主要キーワードで3位以内

---

## 11. リスクと対策

### リスク1: スパム投稿の増加

**対策:**
- reCAPTCHA強化
- 機械学習による自動検知
- コミュニティ通報機能

### リスク2: 法的問題（誹謗中傷）

**対策:**
- 利用規約の明確化
- 承認制の徹底
- 削除依頼フォーム設置

### リスク3: 競合サイトからの妨害

**対策:**
- IP制限
- 異常な投稿パターンの検知
- 管理者による定期チェック

### リスク4: SEO効果が出ない

**対策:**
- コンテンツ品質の向上
- 被リンク獲得施策
- SNS連携強化

---

## 12. 今後の拡張案

### 機能拡張

- [ ] サイト比較機能（2サイト並列表示）
- [ ] ユーザーアカウント機能
- [ ] ポイント制度（口コミ投稿で特典）
- [ ] メールマガジン登録
- [ ] API公開（外部サイトへの埋め込み）

### マネタイズ

- [ ] アフィリエイトリンク
- [ ] プレミアムサイト（詳細分析）
- [ ] 広告枠販売
- [ ] 企業向けレポート販売

---

## 付録A: 環境変数一覧

```.env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# SendGrid（通知用）
SENDGRID_API_KEY=xxx
SENDGRID_FROM_EMAIL=noreply@example.com

# reCAPTCHA
RECAPTCHA_SITE_KEY=xxx
RECAPTCHA_SECRET_KEY=xxx

# GitHub Actions用
ADMIN_EMAIL=makoto@example.com
```

---

## 付録B: ディレクトリ構造

```
keiba-review/
├── src/
│   ├── pages/
│   │   ├── index.astro                 # トップページ
│   │   ├── keiba-yosou/
│   │   │   ├── index.astro            # サイト一覧
│   │   │   ├── [category].astro       # カテゴリ別
│   │   │   └── [slug]/
│   │   │       └── index.astro        # サイト詳細
│   │   └── admin/
│   │       ├── index.astro            # 管理TOP
│   │       ├── reviews.astro          # 口コミ管理
│   │       └── sites.astro            # サイト管理
│   ├── components/
│   │   ├── SiteCard.astro
│   │   ├── ReviewCard.astro
│   │   ├── ReviewForm.tsx             # React
│   │   ├── StarRating.tsx
│   │   └── Header.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── AdminLayout.astro
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client
│   │   ├── validation.ts             # Zod schemas
│   │   └── seo.ts                    # SEO helpers
│   └── styles/
│       └── global.css
├── scripts/
│   ├── detect_new_sites.py           # 自動検知
│   ├── update_stats.py               # 統計更新
│   └── requirements.txt
├── .github/
│   └── workflows/
│       ├── detect-new-sites.yml
│       └── update-stats.yml
├── public/
│   ├── robots.txt
│   └── sitemap.xml
├── astro.config.mjs
├── tailwind.config.cjs
├── package.json
└── README.md
```

---

**この仕様書に基づいて実装を進めます。質問や変更点があればお知らせください！**
