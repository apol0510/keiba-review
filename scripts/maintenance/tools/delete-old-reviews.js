#!/usr/bin/env node
const Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function deleteOldReviews() {
  try {
    console.log('🔍 12月2日以前のレビューを検索中...\n');

    // December 2, 2025 00:00:00 UTC
    const cutoffDate = new Date('2025-12-02T00:00:00Z');
    console.log(`📅 基準日時: ${cutoffDate.toISOString()}\n`);

    const reviewsToDelete = [];

    await base('Reviews').select({
      view: 'Grid view'
    }).eachPage((records, fetchNextPage) => {
      records.forEach(record => {
        const createdTime = new Date(record.get('CreatedAt'));
        if (createdTime < cutoffDate) {
          reviewsToDelete.push({
            id: record.id,
            username: record.get('UserName'),
            site: record.get('Site'),
            created: record.get('CreatedAt')
          });
        }
      });
      fetchNextPage();
    });

    console.log(`📊 削除対象: ${reviewsToDelete.length}件のレビュー\n`);

    if (reviewsToDelete.length === 0) {
      console.log('✅ 削除対象のレビューはありません');
      return;
    }

    // 最初の10件を表示
    console.log('削除対象レビュー（最初の10件）:');
    reviewsToDelete.slice(0, 10).forEach((review, index) => {
      console.log(`${index + 1}. ${review.username} - Created: ${review.created}`);
    });

    if (reviewsToDelete.length > 10) {
      console.log(`... 他 ${reviewsToDelete.length - 10}件\n`);
    } else {
      console.log('');
    }

    // 削除実行
    console.log('🗑️  削除を開始します...\n');

    let deletedCount = 0;

    // Airtableのレート制限対策: 10件ずつ削除
    for (let i = 0; i < reviewsToDelete.length; i += 10) {
      const batch = reviewsToDelete.slice(i, i + 10);
      const deleteIds = batch.map(r => r.id);

      await base('Reviews').destroy(deleteIds);
      deletedCount += deleteIds.length;

      console.log(`  ✅ ${deletedCount}/${reviewsToDelete.length}件削除完了`);

      // レート制限対策: 200ms待機
      if (i + 10 < reviewsToDelete.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`\n🎉 完了: ${deletedCount}件のレビューを削除しました`);

  } catch (error) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

deleteOldReviews().catch(error => {
  console.error('致命的エラー:', error);
  process.exit(1);
});
