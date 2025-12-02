#!/usr/bin/env node
/**
 * ⭐5の口コミを修正するスクリプト
 *
 * 既存のAirtableデータから⭐5の口コミを検索し、⭐4に変更します
 */

const Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

/**
 * ⭐5の口コミを検索
 */
async function findStar5Reviews() {
  console.log('🔍 ⭐5の口コミを検索中...\n');

  const reviews = await base('Reviews').select({
    filterByFormula: '{Rating} = 5'
  }).all();

  console.log(`📊 見つかった⭐5の口コミ: ${reviews.length}件\n`);

  if (reviews.length === 0) {
    console.log('✅ ⭐5の口コミは見つかりませんでした\n');
    return [];
  }

  // 詳細を表示
  reviews.forEach((record, i) => {
    const fields = record.fields;
    const siteName = Array.isArray(fields.Site) ? fields.Site[0] : fields.Site || '不明';

    console.log(`${i + 1}. ID: ${record.id}`);
    console.log(`   サイト: ${siteName}`);
    console.log(`   評価: ⭐${fields.Rating}`);
    console.log(`   タイトル: ${fields.Title || '(なし)'}`);
    console.log(`   投稿日: ${fields.CreatedAt || '不明'}`);
    console.log('');
  });

  return reviews;
}

/**
 * ⭐5を⭐4に変更
 */
async function updateToStar4(reviews) {
  if (reviews.length === 0) {
    return;
  }

  console.log(`\n🔧 ${reviews.length}件の口コミを⭐4に変更します...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const review of reviews) {
    try {
      await base('Reviews').update(review.id, {
        Rating: 4
      });

      console.log(`✅ ${review.id} を⭐4に変更しました`);
      successCount++;

      // レート制限を避ける
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ ${review.id} の変更に失敗: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n━'.repeat(40));
  console.log(`\n📊 結果:`);
  console.log(`  成功: ${successCount}件`);
  console.log(`  失敗: ${failCount}件`);
  console.log('');
}

/**
 * 削除オプション（オプション）
 */
async function deleteReviews(reviews) {
  if (reviews.length === 0) {
    return;
  }

  console.log(`\n🗑️  ${reviews.length}件の口コミを削除します...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const review of reviews) {
    try {
      await base('Reviews').destroy(review.id);

      console.log(`✅ ${review.id} を削除しました`);
      successCount++;

      // レート制限を避ける
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ ${review.id} の削除に失敗: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n━'.repeat(40));
  console.log(`\n📊 結果:`);
  console.log(`  成功: ${successCount}件`);
  console.log(`  失敗: ${failCount}件`);
  console.log('');
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'check';

  console.log('⭐5 口コミ修正ツール\n');
  console.log('━'.repeat(80) + '\n');

  const reviews = await findStar5Reviews();

  if (reviews.length === 0) {
    return;
  }

  if (mode === 'check') {
    console.log('💡 実行モード:');
    console.log('  node scripts/fix-star5-reviews.cjs check   - 検索のみ（現在）');
    console.log('  node scripts/fix-star5-reviews.cjs update  - ⭐4に変更');
    console.log('  node scripts/fix-star5-reviews.cjs delete  - 削除');
    console.log('');
  } else if (mode === 'update') {
    await updateToStar4(reviews);
    console.log('✅ 完了しました！');
  } else if (mode === 'delete') {
    console.log('⚠️  本当に削除しますか？ (y/N): ');

    // 確認なしで実行（自動化用）
    await deleteReviews(reviews);
    console.log('✅ 完了しました！');
  } else {
    console.error(`❌ 不明なモード: ${mode}`);
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findStar5Reviews, updateToStar4, deleteReviews };
