/**
 * 日次モニタリングスクリプト
 *
 * データ整合性チェック・統計レポート生成
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
 * サイト統計を取得
 */
async function getSiteStats() {
  const sites = await base('Sites').select({
    fields: ['Name', 'SiteQuality', 'Reviews', 'IsApproved']
  }).all();

  const stats = {
    total: sites.length,
    approved: 0,
    byQuality: {
      premium: 0,
      excellent: 0,
      normal: 0,
      poor: 0,
      malicious: 0
    }
  };

  for (const site of sites) {
    if (site.fields.IsApproved) stats.approved++;
    const quality = site.fields.SiteQuality || 'normal';
    stats.byQuality[quality]++;
  }

  return stats;
}

/**
 * 口コミ統計を取得
 */
async function getReviewStats() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const allReviews = await base('Reviews').select({
    fields: ['CreatedAt', 'Rating', 'Status']
  }).all();

  const stats = {
    total: allReviews.length,
    today: 0,
    yesterday: 0,
    lastWeek: 0,
    byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    byStatus: { approved: 0, pending: 0, spam: 0 }
  };

  for (const review of allReviews) {
    const createdAt = new Date(review.fields.CreatedAt);
    const rating = review.fields.Rating || 3;
    const status = review.fields.Status || 'pending';

    // 日付別
    if (createdAt.toDateString() === today.toDateString()) stats.today++;
    if (createdAt.toDateString() === yesterday.toDateString()) stats.yesterday++;
    if (createdAt >= lastWeek) stats.lastWeek++;

    // 評価別
    stats.byRating[rating]++;

    // ステータス別
    stats.byStatus[status]++;
  }

  return stats;
}

/**
 * 異常値検出
 */
function detectAnomalies(siteStats, reviewStats) {
  const issues = [];

  // 今日の投稿が0件
  if (reviewStats.today === 0) {
    issues.push('⚠️ 今日の口コミ投稿が0件です');
  }

  // 昨日の投稿が極端に少ない
  if (reviewStats.yesterday < 3) {
    issues.push(`⚠️ 昨日の口コミ投稿が少ない（${reviewStats.yesterday}件）`);
  }

  // 承認待ちが多い
  if (reviewStats.byStatus.pending > 10) {
    issues.push(`⚠️ 承認待ち口コミが多い（${reviewStats.byStatus.pending}件）`);
  }

  // スパムが多い
  if (reviewStats.byStatus.spam > 5) {
    issues.push(`⚠️ スパム口コミが多い（${reviewStats.byStatus.spam}件）`);
  }

  return issues;
}

/**
 * メイン処理
 */
(async () => {
  console.log('🔍 日次モニタリング開始\n');
  console.log(`📅 実行日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n`);

  // サイト統計
  const siteStats = await getSiteStats();
  console.log('📊 サイト統計:');
  console.log(`  総数: ${siteStats.total}件`);
  console.log(`  承認済み: ${siteStats.approved}件`);
  console.log(`  品質分布:`);
  console.log(`    🌟 premium: ${siteStats.byQuality.premium}件`);
  console.log(`    ✅ excellent: ${siteStats.byQuality.excellent}件`);
  console.log(`    ⚪ normal: ${siteStats.byQuality.normal}件`);
  console.log(`    ⚠️  poor: ${siteStats.byQuality.poor}件`);
  console.log(`    ❌ malicious: ${siteStats.byQuality.malicious}件`);
  console.log('');

  // 口コミ統計
  const reviewStats = await getReviewStats();
  console.log('💬 口コミ統計:');
  console.log(`  総数: ${reviewStats.total}件`);
  console.log(`  今日: ${reviewStats.today}件`);
  console.log(`  昨日: ${reviewStats.yesterday}件`);
  console.log(`  直近7日: ${reviewStats.lastWeek}件`);
  console.log(`  評価分布:`);
  console.log(`    ⭐1: ${reviewStats.byRating[1]}件`);
  console.log(`    ⭐2: ${reviewStats.byRating[2]}件`);
  console.log(`    ⭐3: ${reviewStats.byRating[3]}件`);
  console.log(`    ⭐4: ${reviewStats.byRating[4]}件`);
  console.log(`    ⭐5: ${reviewStats.byRating[5]}件`);
  console.log(`  ステータス:`);
  console.log(`    承認済み: ${reviewStats.byStatus.approved}件`);
  console.log(`    承認待ち: ${reviewStats.byStatus.pending}件`);
  console.log(`    スパム: ${reviewStats.byStatus.spam}件`);
  console.log('');

  // 異常値検出
  const issues = detectAnomalies(siteStats, reviewStats);
  if (issues.length > 0) {
    console.log('⚠️  警告:');
    issues.forEach(issue => console.log(`  ${issue}`));
    console.log('');
  } else {
    console.log('✅ 異常は検出されませんでした\n');
  }

  console.log('🎉 モニタリング完了');
})();
