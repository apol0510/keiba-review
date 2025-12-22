/**
 * Airtable Reviews の「買い目」→「予想」一括置換スクリプト
 *
 * 環境変数:
 * - AIRTABLE_API_KEY: Airtable APIキー
 * - AIRTABLE_BASE_ID: AirtableベースID
 */

const Airtable = require('airtable');

// 環境変数
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ 環境変数が設定されていません');
  console.log('必要な環境変数:');
  console.log('  - AIRTABLE_API_KEY');
  console.log('  - AIRTABLE_BASE_ID');
  process.exit(1);
}

// Airtable接続
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function main() {
  console.log('🚀 Airtable Reviews「買い目」→「予想」一括置換を開始\n');

  // 全口コミを取得
  console.log('📊 口コミを取得中...');
  const reviews = await base('Reviews').select({
    fields: ['Title', 'Content', 'IsApproved']
  }).all();

  console.log(`✅ ${reviews.length}件の口コミを取得\n`);

  // 「買い目」を含む口コミをフィルター
  const reviewsToUpdate = reviews.filter(r => {
    const title = r.fields.Title || '';
    const content = r.fields.Content || '';
    return title.includes('買い目') || content.includes('買い目');
  });

  console.log(`🔍 「買い目」を含む口コミ: ${reviewsToUpdate.length}件\n`);

  if (reviewsToUpdate.length === 0) {
    console.log('✅ 置換対象の口コミはありません');
    return;
  }

  // 確認プロンプト
  console.log('【置換内容】');
  console.log('  変更前: 買い目');
  console.log('  変更後: 予想');
  console.log(`  対象件数: ${reviewsToUpdate.length}件\n`);

  // サンプル表示
  console.log('【サンプル（最初の3件）】');
  reviewsToUpdate.slice(0, 3).forEach((r, i) => {
    const title = r.fields.Title || '';
    const content = r.fields.Content || '';
    console.log(`\n${i + 1}. タイトル: ${title}`);
    console.log(`   本文: ${content.substring(0, 80)}...`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('⚠️  このまま置換を実行しますか？');
  console.log('='.repeat(60));
  console.log('実行する場合: node scripts/replace-kaime-in-airtable.cjs --execute');
  console.log('中止する場合: Ctrl+C\n');

  // --execute フラグがない場合はドライラン
  if (!process.argv.includes('--execute')) {
    console.log('💡 ドライランモード（実際の更新は行いません）');
    console.log('   実行するには --execute フラグを付けてください\n');
    return;
  }

  // 一括置換を実行
  console.log('\n🔄 置換を実行中...\n');

  let updated = 0;
  let failed = 0;

  // 10件ずつバッチ処理
  for (let i = 0; i < reviewsToUpdate.length; i += 10) {
    const batch = reviewsToUpdate.slice(i, i + 10);

    const updates = batch.map(r => ({
      id: r.id,
      fields: {
        Title: (r.fields.Title || '').replace(/買い目/g, '予想'),
        Content: (r.fields.Content || '').replace(/買い目/g, '予想')
      }
    }));

    try {
      await base('Reviews').update(updates);
      updated += batch.length;
      console.log(`  ✅ ${i + 1}〜${Math.min(i + 10, reviewsToUpdate.length)}件目 完了`);
    } catch (error) {
      console.error(`  ❌ エラー: ${error.message}`);
      failed += batch.length;
    }

    // レート制限対策（5リクエスト/秒）
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 実行結果');
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${updated}件`);
  console.log(`❌ 失敗: ${failed}件`);
  console.log('\n✨ 完了');
}

main().catch(error => {
  console.error('❌ 致命的なエラー:', error);
  process.exit(1);
});
