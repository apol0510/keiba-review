# Scripts Directory

このディレクトリには、プロジェクトの自動化スクリプトが格納されています。

## ディレクトリ構造

```
scripts/
├── production/          # 本番環境で使用中のスクリプト
├── dev/                 # 開発・テスト用スクリプト
├── maintenance/         # メンテナンス用ツール
├── archived/            # 旧バージョン（参照用）
├── config/              # 設定ファイル
└── reviews-data/        # 口コミテンプレートデータ
```

---

## 📁 production/ - 本番スクリプト

GitHub Actionsで自動実行されるスクリプト。

### 自動実行スクリプト

| スクリプト | 説明 | 実行頻度 | ワークフロー |
|----------|------|---------|------------|
| `run-daily-reviews-v4.cjs` | 口コミ自動投稿（5タイプ対応） | 毎日AM4:00 | auto-post-reviews.yml |
| `verify-daily-execution.cjs` | 投稿後のデータ整合性検証 | 毎日AM4:00 | auto-post-reviews.yml |
| `auto-capture-screenshots.cjs` | サイトスクリーンショット取得 | 毎日AM4:00/PM4:00 | auto-screenshots.yml |
| `fetch-keiba-sites.js` | 新規サイト自動検知（SerpAPI） | 毎週月曜AM3:00 | daily-automation.yml |
| `auto-categorize-sites.js` | サイトカテゴリ自動分類 | 毎週月曜AM3:00 | daily-automation.yml |

### ユーティリティ

| スクリプト | 説明 |
|----------|------|
| `upload-adjusted-reviews.cjs` | 口コミアップロード共通関数 |

---

## 🧪 dev/ - 開発・テストスクリプト

開発中のテスト・デバッグ用スクリプト。

| スクリプト | 説明 |
|----------|------|
| `check-new-reviews.cjs` | 新規口コミチェック（自動リビルド判定） |
| `test-*.cjs` | 各種機能のテストスクリプト |
| `debug-*.cjs` | デバッグ用スクリプト |

---

## 🔧 maintenance/ - メンテナンスツール

手動実行するメンテナンス用ツール。

### maintenance/tools/

| カテゴリ | スクリプト例 |
|---------|------------|
| **チェック系** | `check-all-reviews.js`, `check-airtable-schema.js` |
| **削除系** | `delete-old-reviews.js` |
| **修正系** | `fix-all-duplicates.cjs`, `fix-star5-reviews.cjs` |
| **追加系** | `add-sitequality-field.cjs`, `add-comparison-variations.cjs` |
| **管理系** | `manage-site-quality.cjs` |

---

## 📦 archived/ - アーカイブ

旧バージョンのスクリプト。参照用に保存。

| スクリプト | 説明 |
|----------|------|
| `run-daily-reviews-v3.cjs` | 口コミ自動投稿（旧バージョン） |
| `post-initial-reviews.cjs` | 初期口コミ投稿スクリプト |

---

## 使用方法

### 本番スクリプトの実行

GitHub Actionsで自動実行されますが、手動実行も可能：

```bash
# 口コミ自動投稿
AIRTABLE_API_KEY=xxx AIRTABLE_BASE_ID=xxx node scripts/production/run-daily-reviews-v4.cjs

# スクリーンショット取得
AIRTABLE_API_KEY=xxx AIRTABLE_BASE_ID=xxx \
CLOUDINARY_CLOUD_NAME=xxx CLOUDINARY_API_KEY=xxx CLOUDINARY_API_SECRET=xxx \
node scripts/production/auto-capture-screenshots.cjs
```

### メンテナンスツールの実行

```bash
# 全口コミのチェック
AIRTABLE_API_KEY=xxx AIRTABLE_BASE_ID=xxx node scripts/maintenance/tools/check-all-reviews.js

# 古い口コミの削除
AIRTABLE_API_KEY=xxx AIRTABLE_BASE_ID=xxx node scripts/maintenance/tools/delete-old-reviews.js
```

---

## 環境変数

以下の環境変数が必要です：

### 必須
- `AIRTABLE_API_KEY` - Airtable APIキー
- `AIRTABLE_BASE_ID` - AirtableベースID

### オプション（機能により必要）
- `SERPAPI_KEY` - SerpAPI APIキー（サイト検知用）
- `CLOUDINARY_CLOUD_NAME` - Cloudinary クラウド名
- `CLOUDINARY_API_KEY` - Cloudinary APIキー
- `CLOUDINARY_API_SECRET` - Cloudinary APIシークレット

---

## トラブルシューティング

### スクリプトが見つからない場合

**エラー例：**
```
Error: Cannot find module '/path/to/script.cjs'
```

**解決策：**
1. スクリプトが正しいディレクトリにあるか確認
2. ワークフローのパスが正しいか確認（`scripts/production/xxx.cjs`）

### requireパスエラー

**エラー例：**
```
Error: Cannot find module './upload-adjusted-reviews.cjs'
```

**解決策：**
- production内のスクリプトは同じディレクトリなので `./` で参照
- reviews-dataは `../reviews-data/` で参照

---

## 更新履歴

- **2025-12-22**: スクリプト整理（production/dev/maintenance/archivedに分類）
- **2025-12-15**: `excellent`タイプの評価範囲を⭐3-5に拡大
- **2025-12-10**: v4リリース（5タイプ対応）
