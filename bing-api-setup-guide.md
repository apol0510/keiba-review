# Bing Search API 取得ガイド

## 概要
Bing Web Search APIを使用すると、インターネット上の競馬予想サイトを自動検索し、Airtableに登録できます。

## 手順1: Azureアカウントの作成

1. Azure Portal にアクセス: https://portal.azure.com/
2. 「無料で始める」をクリック
3. Microsoftアカウントでサインイン（なければ新規作成）
4. クレジットカード情報を登録（無料枠があり、超過しない限り課金されません）

## 手順2: Bing Search リソースの作成

1. Azure Portalにログイン
2. 「リソースの作成」をクリック
3. 検索ボックスに「Bing Search」と入力
4. 「Bing Search v7」を選択
5. 「作成」をクリック

### リソースの設定

- **サブスクリプション**: 自分のサブスクリプションを選択
- **リソースグループ**: 新規作成（例: `keiba-resources`）
- **名前**: 任意の名前（例: `keiba-bing-search`）
- **価格レベル**: `F1 (Free)` を選択
  - 無料枠: 月1,000クエリまで
  - 課金なし
- **リージョン**: `East US` または `West US`（日本リージョンは対応していません）

6. 「確認および作成」→「作成」をクリック

## 手順3: APIキーの取得

1. デプロイが完了したら「リソースに移動」をクリック
2. 左メニューの「キーとエンドポイント」をクリック
3. **KEY 1** または **KEY 2** をコピー（どちらでも可）
4. エンドポイントURLを確認（`https://api.bing.microsoft.com/`）

## 手順4: Netlify環境変数の設定

```bash
netlify env:set BING_API_KEY "your-api-key-here"
```

または、Netlify管理画面から設定:
1. https://app.netlify.com/projects/frabjous-taiyaki-460401
2. 「Site settings」→「Environment variables」
3. 「Add a variable」をクリック
4. Key: `BING_API_KEY`
5. Value: コピーしたAPIキー
6. 「Create variable」をクリック

## 手順5: スクリプトの実行

```bash
# 環境変数を確認
netlify env:list | grep BING

# 自動取得スクリプトを実行
node scripts/fetch-keiba-sites.js
```

## 価格について

### 無料枠（F1）
- 月1,000クエリまで無料
- 1秒あたり3クエリまで
- 超過した場合は自動的に停止（追加課金なし）

### 有料プラン（S1）
- 月250,000クエリまで
- 1秒あたり10クエリまで
- $7.00 per 1,000 transactions

**推奨**: まずは無料枠（F1）で試してください。

## トラブルシューティング

### エラー: "Access denied"
- APIキーが正しいか確認
- リソースが正しくデプロイされているか確認
- エンドポイントURLが正しいか確認（`https://api.bing.microsoft.com/v7.0/search`）

### エラー: "Out of call volume quota"
- 月間1,000クエリの上限に達しています
- 翌月まで待つか、有料プランにアップグレード

### エラー: "Resource not found"
- Bing Search v7リソースを作成したか確認
- リージョンが対応しているか確認（East US または West US）

## 参考リンク

- Azure Portal: https://portal.azure.com/
- Bing Web Search API ドキュメント: https://learn.microsoft.com/ja-jp/bing/search-apis/bing-web-search/overview
- 価格: https://azure.microsoft.com/ja-jp/pricing/details/cognitive-services/search-api/

## 次のステップ

APIキーを取得したら:
1. Netlifyに環境変数を設定
2. `scripts/fetch-keiba-sites.js` を実行して新しいサイトを検索
3. Airtableで未承認サイトを確認・承認
4. GitHub Actionsで自動実行を設定（毎日AM3時）

おつかれさまでした！
