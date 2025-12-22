/**
 * 最新のテスト口コミを削除するスクリプト
 */

const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function deleteLatestTestReviews() {
  console.log('🗑️  テスト口コミを検索中...\n');

  try {
    // テスト口コミを検索
    const records = await base('Reviews').select({
      filterByFormula: 'AND({Title} = "テスト投稿", {UserName} = "テストユーザー")',
      sort: [{ field: 'CreatedAt', direction: 'desc' }],
      maxRecords: 10
    }).all();

    if (records.length === 0) {
      console.log('✅ テスト口コミは見つかりませんでした\n');
      return;
    }

    console.log(`📊 ${records.length}件のテスト口コミを発見:\n`);

    for (const record of records) {
      console.log(`   ID: ${record.id}`);
      console.log(`   タイトル: ${record.fields.Title}`);
      console.log(`   投稿者: ${record.fields.UserName}`);
      console.log(`   作成日時: ${record.fields.CreatedAt}`);
      console.log('');
    }

    // 削除実行
    console.log('🗑️  削除を実行中...\n');

    for (const record of records) {
      await base('Reviews').destroy(record.id);
      console.log(`   ✅ 削除完了: ${record.id}`);
    }

    console.log(`\n✅ ${records.length}件のテスト口コミを削除しました\n`);

  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

deleteLatestTestReviews();
