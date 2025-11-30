# Airtable サイト品質管理フィールド設定手順

## 新規フィールドの追加

### 1. SiteQuality フィールド

**タイプ**: Single select（単一選択）

**選択肢**:
- `excellent` - 優良サイト（緑色）
- `normal` - 通常サイト（グレー）
- `malicious` - 悪質サイト（赤色）

**デフォルト値**: `normal`

**設定手順**:
1. Airtable の Sites テーブルを開く
2. 右側の「+」ボタンをクリック
3. フィールドタイプで「Single select」を選択
4. フィールド名: `SiteQuality`
5. 選択肢を追加:
   - `excellent` (色: 緑)
   - `normal` (色: グレー)
   - `malicious` (色: 赤)
6. デフォルト値を `normal` に設定
7. 保存

### 2. DisplayPriority フィールド

**タイプ**: Number（数値）

**説明**: 表示優先度（大きいほど上位表示）

**推奨値**:
- 優良サイト: 100 〜 200
- 通常サイト: 50
- 悪質サイト: 0 〜 10

**デフォルト値**: 50

**設定手順**:
1. Airtable の Sites テーブルを開く
2. 右側の「+」ボタンをクリック
3. フィールドタイプで「Number」を選択
4. フィールド名: `DisplayPriority`
5. Format: Integer（整数）
6. Precision: 0（小数点なし）
7. デフォルト値: 50
8. 保存

## 既存データの初期設定

### malicious-sites.json の excellent サイトを SiteQuality = 'malicious' に設定

`scripts/config/malicious-sites.json` に記載されている35件のサイトを悪質サイトとして設定します。

### 設定用スクリプト

`scripts/init-site-quality.js` を実行して、既存サイトに品質データを一括設定します。

```bash
AIRTABLE_API_KEY=xxx AIRTABLE_BASE_ID=xxx node scripts/init-site-quality.js
```

## 完了後の確認

1. Airtable の Sites テーブルで新しいフィールドが追加されているか確認
2. 既存サイトの SiteQuality と DisplayPriority が正しく設定されているか確認
3. 管理画面（/admin/site-quality）でサイト品質管理ができることを確認
