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
    'IsApproved',
    'Reviews',
    'UsedReviewIDs'
  ],
  Reviews: [
    'UserName',
    'Rating',
    'Title',
    'Content',
    'CreatedAt',
    'Status',
    'Site'
  ]
};

/**
 * 必須Select Options定義
 */
const REQUIRED_SELECT_OPTIONS = {
  Sites: {
    Category: ['nankan', 'chuo', 'chihou', 'other'],
    SiteQuality: ['premium', 'excellent', 'normal', 'poor', 'malicious']
  },
  Reviews: {
    Status: ['approved', 'pending', 'spam']
  }
};

/**
 * フィールドの存在チェック
 */
async function validateFields(tableName, requiredFields) {
  const issues = [];

  try {
    // サンプルレコードを1件取得してフィールドを確認
    const records = await base(tableName).select({
      maxRecords: 1
    }).all();

    if (records.length === 0) {
      console.log(`  ⚠️  ${tableName}: レコードが0件（フィールド検証スキップ）`);
      return issues;
    }

    const record = records[0];
    const fields = Object.keys(record.fields);

    for (const requiredField of requiredFields) {
      if (!fields.includes(requiredField)) {
        issues.push(`  ❌ ${tableName}: フィールド "${requiredField}" が見つかりません`);
      }
    }

    if (issues.length === 0) {
      console.log(`  ✅ ${tableName}: 全ての必須フィールドが存在します`);
    }
  } catch (error) {
    issues.push(`  ❌ ${tableName}: テーブルが見つかりません (${error.message})`);
  }

  return issues;
}

/**
 * Select Optionsのチェック
 */
async function validateSelectOptions(tableName, fieldOptions) {
  const issues = [];

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
          issues.push(`  ⚠️  ${tableName}.${fieldName}: 選択肢 "${requiredOption}" がデータに存在しません`);
        }
      }

      if (issues.length === 0) {
        console.log(`  ✅ ${tableName}.${fieldName}: 全ての選択肢が存在します`);
      }
    }
  } catch (error) {
    issues.push(`  ❌ ${tableName}: Select Optionsの検証に失敗 (${error.message})`);
  }

  return issues;
}

/**
 * メイン処理
 */
(async () => {
  console.log('🔍 Airtableスキーマバリデーション開始\n');

  const allIssues = [];

  // フィールド検証
  console.log('📋 フィールド検証:');
  for (const [tableName, fields] of Object.entries(REQUIRED_FIELDS)) {
    const issues = await validateFields(tableName, fields);
    allIssues.push(...issues);
  }
  console.log('');

  // Select Options検証
  console.log('🔘 Select Options検証:');
  for (const [tableName, fieldOptions] of Object.entries(REQUIRED_SELECT_OPTIONS)) {
    const issues = await validateSelectOptions(tableName, fieldOptions);
    allIssues.push(...issues);
  }
  console.log('');

  // 結果サマリー
  if (allIssues.length > 0) {
    console.log('⚠️  検出された問題:');
    allIssues.forEach(issue => console.log(issue));
    console.log('');
    process.exit(1); // エラーコードで終了
  } else {
    console.log('✅ スキーマバリデーション完了: 問題なし\n');
  }
})();
