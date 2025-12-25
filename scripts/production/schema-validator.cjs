/**
 * Airtableスキーマバリデーター
 *
 * 必須フィールドとSelect Options の存在チェック
 */

const Airtable = require('airtable');

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('❌ AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

/**
 * 必須フィールド定義
 */
const REQUIRED_FIELDS = {
  Sites: [
    'Name',
    'URL',
    'Slug',
    'Category',
    'SiteQuality',
    'Description',
    'CreatedAt',
    'DisplayPriority'
  ],
  Reviews: [
    'UserName',
    'Rating',
    'Title',
    'Content',
    'CreatedAt',
    'IsApproved',
    'Site',
    'UserEmail'
  ]
};

/**
 * 必須Select Options定義
 */
const REQUIRED_SELECT_OPTIONS = {
  Sites: {
    Category: ['nankan', 'chuo', 'chihou', 'other'],
    SiteQuality: ['premium', 'excellent', 'normal', 'poor', 'malicious']
  }
  // Reviews.IsApproved は boolean なので Select Options 検証不要
};

/**
 * フィールドの存在チェック
 */
async function validateFields(tableName, requiredFields) {
  const errors = [];

  try {
    // サンプルレコードを1件取得してフィールドを確認
    const records = await base(tableName).select({
      maxRecords: 1
    }).all();

    if (records.length === 0) {
      console.log(`  ⚠️  ${tableName}: レコードが0件（フィールド検証スキップ）`);
      return errors;
    }

    const record = records[0];
    const fields = Object.keys(record.fields);

    for (const requiredField of requiredFields) {
      if (!fields.includes(requiredField)) {
        errors.push(`  ❌ ${tableName}: フィールド "${requiredField}" が見つかりません`);
      }
    }

    if (errors.length === 0) {
      console.log(`  ✅ ${tableName}: 全ての必須フィールドが存在します`);
    }
  } catch (error) {
    errors.push(`  ❌ ${tableName}: テーブルが見つかりません (${error.message})`);
  }

  return errors;
}

/**
 * Select Optionsのチェック（警告のみ）
 */
async function validateSelectOptions(tableName, fieldOptions) {
  const warnings = [];

  try {
    const records = await base(tableName).select().all();

    for (const [fieldName, requiredOptions] of Object.entries(fieldOptions)) {
      const foundOptions = new Set();

      for (const record of records) {
        const value = record.fields[fieldName];
        if (value) foundOptions.add(value);
      }

      for (const requiredOption of requiredOptions) {
        if (!foundOptions.has(requiredOption)) {
          warnings.push(`  ⚠️  ${tableName}.${fieldName}: 選択肢 "${requiredOption}" がデータに存在しません`);
        }
      }

      if (warnings.length === 0) {
        console.log(`  ✅ ${tableName}.${fieldName}: 全ての選択肢が存在します`);
      }
    }
  } catch (error) {
    warnings.push(`  ⚠️  ${tableName}: Select Optionsの検証に失敗 (${error.message})`);
  }

  return warnings;
}

/**
 * メイン処理
 */
(async () => {
  console.log('🔍 Airtableスキーマバリデーション開始\n');

  const errors = [];
  const warnings = [];

  // フィールド検証（エラー）
  console.log('📋 フィールド検証:');
  for (const [tableName, fields] of Object.entries(REQUIRED_FIELDS)) {
    const fieldErrors = await validateFields(tableName, fields);
    errors.push(...fieldErrors);
  }
  console.log('');

  // Select Options検証（警告）
  console.log('🔘 Select Options検証:');
  for (const [tableName, fieldOptions] of Object.entries(REQUIRED_SELECT_OPTIONS)) {
    const selectWarnings = await validateSelectOptions(tableName, fieldOptions);
    warnings.push(...selectWarnings);
  }
  console.log('');

  // 結果サマリー
  if (errors.length > 0) {
    console.log('❌ エラー:');
    errors.forEach(error => console.log(error));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  警告（データに選択肢が存在しない）:');
    warnings.forEach(warning => console.log(warning));
    console.log('');
  }

  if (errors.length > 0) {
    console.log('❌ スキーマバリデーション失敗\n');
    process.exit(1); // エラーがある場合のみ失敗
  } else if (warnings.length > 0) {
    console.log('⚠️  スキーマバリデーション完了（警告あり）\n');
    process.exit(0); // 警告のみなら成功
  } else {
    console.log('✅ スキーマバリデーション完了: 問題なし\n');
    process.exit(0);
  }
})();
