# 競馬予想サイト口コミ

競馬予想サイトの口コミ・評判を集約するプラットフォーム。

> 最終更新: 2025-12-27

## 技術スタック

- **フロントエンド**: Astro + React + Tailwind CSS
- **データベース**: Airtable
- **ホスティング**: Netlify
- **通知**: SendGrid + Zapier

## 特徴

- **Airtable管理**: 口コミの承認・サイト管理をAirtable上で直接操作
- **Zapier連携**: 新規口コミ投稿時の自動通知
- **Netlifyデプロイ**: 高速・無料ホスティング

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Airtableセットアップ

1. [Airtable](https://airtable.com) でベースを作成

2. **Sites** テーブルを作成（フィールド）:
   | フィールド名 | タイプ | 説明 |
   |:--|:--|:--|
   | Name | Single line text | サイト名 |
   | URL | URL | サイトURL |
   | Slug | Single line text | URLスラッグ |
   | Category | Single select | nankan/chuo/chihou/other |
   | Description | Long text | サイト説明 |
   | Features | Long text | 特徴（カンマ区切り） |
   | PriceInfo | Single line text | 料金情報 |
   | Screenshot | Attachment | スクリーンショット |
   | IsApproved | Checkbox | 承認済み |
   | ReviewCount | Number | 口コミ数（計算用） |
   | AverageRating | Number | 平均評価（計算用） |

3. **Reviews** テーブルを作成（フィールド）:
   | フィールド名 | タイプ | 説明 |
   |:--|:--|:--|
   | SiteId | Link to Sites | サイトへのリンク |
   | UserName | Single line text | 投稿者名 |
   | UserEmail | Email | 投稿者メール |
   | Rating | Number (1-5) | 評価 |
   | Title | Single line text | タイトル |
   | Content | Long text | 口コミ本文 |
   | IsApproved | Checkbox | 承認済み |
   | IsSpam | Checkbox | スパムフラグ |
   | IPAddress | Single line text | IPアドレス |
   | ApprovedAt | Date | 承認日時 |

4. APIキーを取得:
   - https://airtable.com/create/tokens でPersonal Access Tokenを作成
   - Base IDはAirtableのURL `https://airtable.com/BASE_ID/...` から取得

### 3. 環境変数の設定

`.env` ファイルを作成：

```env
# Airtable
AIRTABLE_API_KEY=your_api_key
AIRTABLE_BASE_ID=your_base_id

# サイト情報
SITE_URL=https://your-site.netlify.app

# SendGrid（オプション）
SENDGRID_API_KEY=your_sendgrid_key
ADMIN_EMAIL=your@email.com
```

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:4321 でアクセス可能。

## Netlifyデプロイ

1. GitHubリポジトリを作成してプッシュ
2. [Netlify](https://netlify.com) でサイト作成
3. 環境変数を設定（Site settings → Environment variables）
4. デプロイ完了！

## Zapier連携（推奨）

新規口コミ投稿時にメール通知を受け取る設定：

1. Zapierで新規Zapを作成
2. **Trigger**: Airtable → New Record in Reviews
3. **Filter**: IsApproved = false
4. **Action**: SendGrid → Send Email

これで新規口コミ投稿があると自動でメールが届きます。

## 運用フロー

1. ユーザーが口コミを投稿
2. Airtableに新規レコードが作成（IsApproved = false）
3. Zapierがメール通知を送信
4. 管理者がAirtableで内容を確認
5. 問題なければ IsApproved をチェック
6. サイトに口コミが表示される

## コマンド

| コマンド | 説明 |
|:--|:--|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run preview` | ビルドプレビュー |

## ライセンス

MIT
