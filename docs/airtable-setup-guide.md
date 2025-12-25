# Airtable設定ガイド

## 手順1: Personal Access Token（PAT）の作成

1. Airtableにログイン: https://airtable.com/
2. トークン作成ページに移動: https://airtable.com/create/tokens
3. 「Create new token」をクリック
4. トークン名を入力（例: `keiba-review-production`）
5. Scopesを設定:
   - `data.records:read` ✓
   - `data.records:write` ✓
   - `schema.bases:read` ✓
6. Accessセクションで、対象のBaseを選択
7. 「Create token」をクリック
8. 表示されたトークンをコピー（再表示できないので注意！）

## 手順2: Base IDの取得

### 方法1: APIドキュメントから取得（推奨）
1. Airtable APIページにアクセス: https://airtable.com/api
2. 使用するBaseを選択
3. URLを確認: `https://airtable.com/[BASE_ID]/api/docs`
4. `[BASE_ID]`部分（`app`で始まる文字列）をコピー

### 方法2: Base URLから取得
1. Airtableで対象のBaseを開く
2. ブラウザのURLを確認: `https://airtable.com/[BASE_ID]/...`
3. `app`で始まる部分がBase ID

例: `https://airtable.com/appABCDEF12345/tblXYZ123` → Base ID は `appABCDEF12345`

## 手順3: Airtable Baseの構造確認

必要なテーブルとフィールド:

### Sitesテーブル
- Name (Single line text)
- Slug (Single line text)
- URL (URL)
- Category (Single select: nankan/chuo/chihou/other)
- Description (Long text)
- Features (Long text, カンマ区切り)
- PriceInfo (Single line text)
- Screenshot (Attachment, 任意)
- IsApproved (Checkbox)
- ReviewCount (Number, 計算フィールド推奨)
- AverageRating (Number, 計算フィールド推奨)

### Reviewsテーブル
- SiteId (Link to Sites)
- UserName (Single line text)
- UserEmail (Email)
- Rating (Number, 1-5)
- Title (Single line text)
- Content (Long text)
- IsApproved (Checkbox)
- IsSpam (Checkbox)
- CreatedAt (Created time)

## 次のステップ

トークンとBase IDを取得したら、以下のコマンドで環境変数を設定します:

```bash
# 環境変数を設定
netlify env:set AIRTABLE_API_KEY "your-token-here"
netlify env:set AIRTABLE_BASE_ID "appXXXXXXXXXXXXXX"
netlify env:set SITE_URL "https://frabjous-taiyaki-460401.netlify.app"
```

設定後、自動的に再デプロイされます。
