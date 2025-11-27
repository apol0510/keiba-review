# SerpAPI セットアップガイド

## 概要

SerpAPIを使用すると、Google検索結果から競馬予想サイトを自動検索し、Airtableに登録できます。

**Bing Search APIとの比較:**

| 項目 | Azure Bing API | SerpAPI |
|------|---------------|---------|
| 日本からの利用 | ❌ 制限頻出 | ✅ 常時安定 |
| APIキー取得 | 手順多い | 2分で完了 |
| 無料枠 | 1,000/月 | 5,000/月 |
| 実装難度 | 中 | 簡単 |

## セットアップ手順

### ① SerpAPI アカウント作成（2分）

1. https://serpapi.com/ にアクセス
2. 「Sign up」をクリック
3. メールアドレスで登録
4. ダッシュボードの「API Key」をコピー

**無料枠:**
- 月5,000クエリまで無料
- クレジットカード不要
- 超過した場合は自動停止（課金なし）

### ② Netlifyに環境変数を設定

```bash
# ターミナルで実行
netlify env:set SERPAPI_KEY "your-api-key-here"

# 確認
netlify env:list | grep SERP
```

または、Netlify管理画面から設定:
1. https://app.netlify.com/projects/frabjous-taiyaki-460401
2. 「Site settings」→「Environment variables」
3. 「Add a variable」をクリック
4. Key: `SERPAPI_KEY`
5. Value: コピーしたAPIキー
6. 「Create variable」をクリック

### ③ スクリプトを実行

```bash
# 環境変数を確認
netlify env:list | grep SERP

# 自動検索スクリプトを実行
node scripts/fetch-keiba-sites-serpapi.js
```

## 使い方

### 検索クエリのカスタマイズ

`scripts/fetch-keiba-sites-serpapi.js` の検索クエリを編集:

```javascript
const searchQueries = [
  { query: '南関競馬 予想サイト', category: 'nankan' },
  { query: '地方競馬 予想サイト', category: 'chihou' },
  { query: '中央競馬 予想サイト JRA', category: 'chuo' },
  { query: '競馬予想 的中', category: 'other' },
];
```

### 処理の流れ

1. SerpAPIでGoogle検索を実行
2. 検索結果（上位10件）を取得
3. URLから重複チェック
4. 新規サイトをAirtableに登録（未承認状態）
5. `/admin/pending-sites` で管理者が確認
6. 承認すると自動でスクリーンショット取得
7. サイトに公開

### 定期実行（オプション）

#### GitHub Actions

`.github/workflows/serpapi-fetch.yml` を作成:

```yaml
name: Fetch Keiba Sites with SerpAPI

on:
  schedule:
    - cron: '0 3 * * *' # 毎日午前3時 (JST)
  workflow_dispatch: # 手動実行も可能

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Fetch new sites
        env:
          SERPAPI_KEY: ${{ secrets.SERPAPI_KEY }}
          AIRTABLE_API_KEY: ${{ secrets.AIRTABLE_API_KEY }}
          AIRTABLE_BASE_ID: ${{ secrets.AIRTABLE_BASE_ID }}
        run: node scripts/fetch-keiba-sites-serpapi.js
```

**GitHub Secrets設定:**
1. GitHubリポジトリ → Settings → Secrets → Actions
2. `SERPAPI_KEY` を追加
3. `AIRTABLE_API_KEY` と `AIRTABLE_BASE_ID` も追加

## トラブルシューティング

### エラー: "Access denied"
- APIキーが正しいか確認
- https://serpapi.com/dashboard でクエリ数を確認

### エラー: "Out of quota"
- 月間5,000クエリの上限に達しています
- 翌月まで待つか、有料プランにアップグレード

### 検索結果が少ない
- 検索クエリを変更してみる
- 複数のクエリで検索を実行

## 参考リンク

- SerpAPI公式サイト: https://serpapi.com/
- API ドキュメント: https://serpapi.com/search-api
- 価格: https://serpapi.com/pricing

## 次のステップ

APIキーを設定したら:
1. `node scripts/fetch-keiba-sites-serpapi.js` で初回実行
2. `/admin/pending-sites` で結果を確認
3. 承認して公開
4. 定期実行の設定（GitHub Actions）

おつかれさまでした！
