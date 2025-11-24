# 競馬予想サイト口コミプラットフォーム

## プロジェクト概要
競馬予想サイトの口コミ・評判を収集し、SEOに最適化されたレビューサイト。
nankan-analytics プロジェクトへの動線としても機能。

## 技術スタック
- **フレームワーク**: Astro 4.x + React (インタラクティブ部分)
- **スタイリング**: Tailwind CSS 4
- **データベース**: Airtable
- **ホスティング**: Netlify (SSR)
- **自動化**: Make.com
- **メール通知**: SendGrid

## デプロイ情報
- **本番URL**: https://frabjous-taiyaki-460401.netlify.app/
- **Netlifyサイト名**: frabjous-taiyaki-460401

## 環境変数（Netlifyに設定必要）
```
AIRTABLE_API_KEY=pat...  # Airtable Personal Access Token
AIRTABLE_BASE_ID=app...  # Airtable Base ID
```

## Airtable 構成

### Sites テーブル
| フィールド | タイプ |
|-----------|--------|
| Name | Single line text |
| Slug | Single line text |
| URL | URL |
| Description | Long text |
| Category | Single select (nankan/chuo/chihou/other) |
| ScreenshotURL | URL |
| IsApproved | Checkbox |
| CreatedAt | Created time |

### Reviews テーブル
| フィールド | タイプ |
|-----------|--------|
| Title | Single line text |
| Content | Long text |
| Rating | Number (1-5) |
| UserName | Single line text |
| UserEmail | Email |
| Site | Link to Sites |
| IsApproved | Checkbox |
| IsSpam | Checkbox |
| CreatedAt | Created time |

## 次回作業 (TODO)

### 1. Airtable API設定
- [ ] https://airtable.com/create/tokens でトークン作成
  - Scopes: `data.records:read`, `data.records:write`
  - Access: 作成したbaseを選択
- [ ] Base IDを取得（URLの `appXXXXXX` 部分）
- [ ] Netlify環境変数に設定
- [ ] 再デプロイ

### 2. Make.com 自動化設定
- [ ] シナリオ作成: Airtable Watch Records → SendGrid Send Email
  - トリガー: Reviews テーブルに新規レコード追加
  - アクション: 管理者にメール通知
- [ ] スケジュール設定（15分ごと推奨）

### 3. テストデータ投入
- [ ] Airtableに2-3件のサイトを手動追加
- [ ] 本番サイトで表示確認

## コマンド
```bash
npm run dev      # 開発サーバー起動
npm run build    # ビルド
npm run preview  # ビルド結果プレビュー
```

## デモモード
環境変数が未設定の場合、`src/lib/airtable.ts` のデモデータが表示される。
本番環境では必ず環境変数を設定すること。

## カテゴリ
- `nankan` - 南関競馬
- `chuo` - 中央競馬
- `chihou` - 地方競馬
- `other` - その他

## 運用フロー
1. ユーザーが口コミ投稿 → Airtableに保存（IsApproved=false）
2. Make.comが検知 → SendGridで管理者に通知
3. 管理者がAirtableで内容確認
4. 問題なければ IsApproved にチェック → サイトに公開
