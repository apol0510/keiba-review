const Airtable = require('airtable');
const fs = require('fs');

// Airtable設定
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('❌ AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

/**
 * サイト名からAirtable Site IDを取得
 */
async function getSiteIdByName(siteName) {
  try {
    const records = await base('Sites').select({
      filterByFormula: `SEARCH("${siteName}", {Name})`,
      maxRecords: 1
    }).all();

    if (records.length === 0) {
      console.warn(`  ⚠️  サイトが見つかりません: ${siteName}`);
      return null;
    }

    return records[0].id;
  } catch (error) {
    console.error(`  ❌ エラー: ${error.message}`);
    return null;
  }
}

/**
 * URLからサイトIDを取得
 */
async function getSiteIdByUrl(siteUrl) {
  // u85.jpのURLからサイト名を推測
  const match = siteUrl.match(/u85\.jp\/([^\/]+)/);
  if (!match) return null;

  const slug = match[1];

  try {
    const records = await base('Sites').select({
      filterByFormula: `SEARCH("${slug}", {Slug})`,
      maxRecords: 1
    }).all();

    if (records.length === 0) {
      console.warn(`  ⚠️  Slugが見つかりません: ${slug}`);
      return null;
    }

    return records[0].id;
  } catch (error) {
    console.error(`  ❌ エラー: ${error.message}`);
    return null;
  }
}

/**
 * 口コミをAirtableに登録
 */
async function uploadReview(review, siteId, autoApprove = false) {
  try {
    const record = await base('Reviews').create({
      Site: [siteId],
      UserName: review.username, // Airtableフィールド名: UserName
      UserEmail: `${review.username}@example.com`, // 必須フィールド
      Rating: review.rating,
      Title: review.title,
      Content: review.content,
      IsApproved: autoApprove // 自動承認するかどうか
      // IsApprovedフィールドを省略した場合、デフォルト値（未承認）が使用される
    });

    return record.id;
  } catch (error) {
    console.error(`  ❌ 登録エラー: ${error.message}`);
    return null;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('📤 調整済み口コミをAirtableに登録開始\n');

  // 調整済み口コミデータを読み込み
  const inputPath = '/tmp/adjusted-reviews.json';

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ ${inputPath} が見つかりません`);
    console.log('💡 まず adjust-reviews.js を実行してください');
    process.exit(1);
  }

  const adjustedReviews = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  console.log(`📁 ${adjustedReviews.length}件の口コミを読み込みました\n`);

  // 自動承認するかどうか（コマンドライン引数で指定）
  const autoApprove = process.argv.includes('--auto-approve');

  if (autoApprove) {
    console.log('⚡ 自動承認モード: 口コミは即座に公開されます\n');
  } else {
    console.log('🔒 手動承認モード: 口コミは承認待ちになります\n');
  }

  let successCount = 0;
  let failedCount = 0;
  const failedReviews = [];

  for (const [index, review] of adjustedReviews.entries()) {
    console.log(`${index + 1}/${adjustedReviews.length}: ${review.siteName}`);

    // サイトIDを取得
    let siteId = await getSiteIdByUrl(review.siteUrl);

    if (!siteId) {
      // URLで見つからない場合、サイト名で検索
      siteId = await getSiteIdByName(review.siteName);
    }

    if (!siteId) {
      console.warn(`  ⚠️  スキップ: サイトが見つかりません\n`);
      failedCount++;
      failedReviews.push({ review, reason: 'Site not found' });
      continue;
    }

    // 口コミを登録
    const reviewId = await uploadReview(review, siteId, autoApprove);

    if (reviewId) {
      console.log(`  ✅ 登録成功: ${review.title} [${review.rating}★]\n`);
      successCount++;
    } else {
      console.log(`  ❌ 登録失敗\n`);
      failedCount++;
      failedReviews.push({ review, reason: 'Upload failed' });
    }

    // レート制限を避けるため待機
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ 登録完了\n');
  console.log('📊 結果サマリー:');
  console.log(`  成功: ${successCount}件`);
  console.log(`  失敗: ${failedCount}件`);

  if (failedReviews.length > 0) {
    console.log('\n❌ 失敗した口コミ:');
    failedReviews.forEach(({ review, reason }) => {
      console.log(`  - ${review.siteName}: ${reason}`);
    });
  }

  // 失敗した口コミを保存
  if (failedReviews.length > 0) {
    const failedPath = '/tmp/failed-reviews.json';
    fs.writeFileSync(failedPath, JSON.stringify(failedReviews, null, 2));
    console.log(`\n📁 失敗した口コミを保存: ${failedPath}`);
  }
}

// 実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadReview, getSiteIdByName, getSiteIdByUrl };
