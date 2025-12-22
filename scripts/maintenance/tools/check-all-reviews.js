#!/usr/bin/env node
const Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function checkAllReviews() {
  try {
    console.log('🔍 全レビューを確認中...\n');

    const allReviews = [];
    const cutoffDate = new Date('2025-12-02T00:00:00Z');

    await base('Reviews').select({
      view: 'Grid view',
      sort: [{ field: 'CreatedAt', direction: 'desc' }]
    }).eachPage((records, fetchNextPage) => {
      records.forEach(record => {
        allReviews.push({
          id: record.id,
          username: record.get('UserName'),
          created: record.get('CreatedAt'),
          isOld: new Date(record.get('CreatedAt')) < cutoffDate
        });
      });
      fetchNextPage();
    });

    console.log(`📊 合計レビュー数: ${allReviews.length}件\n`);

    const oldReviews = allReviews.filter(r => r.isOld);
    const newReviews = allReviews.filter(r => !r.isOld);

    console.log(`📅 12月2日以前: ${oldReviews.length}件`);
    console.log(`📅 12月2日以降: ${newReviews.length}件\n`);

    if (allReviews.length > 0) {
      console.log('最新のレビュー（最初の10件）:');
      allReviews.slice(0, 10).forEach((review, index) => {
        const date = new Date(review.created).toLocaleString('ja-JP');
        const marker = review.isOld ? '⚠️ OLD' : '✅ NEW';
        console.log(`${index + 1}. ${marker} ${review.username} - ${date}`);
      });
    }

    console.log('\n✅ 確認完了');

  } catch (error) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

checkAllReviews().catch(error => {
  console.error('致命的エラー:', error);
  process.exit(1);
});
