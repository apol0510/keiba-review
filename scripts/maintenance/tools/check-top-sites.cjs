const Airtable = require('airtable');

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('❌ AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

async function checkTopSites() {
  console.log('📊 高評価・口コミ多数のサイトを確認中...\n');

  const allSites = await base('Sites').select({
    filterByFormula: '{IsApproved} = TRUE()',
    fields: ['Name', 'Reviews']
  }).all();

  const sitesWithStats = [];

  for (const siteRecord of allSites) {
    const siteName = siteRecord.fields.Name;
    const reviewLinks = siteRecord.fields.Reviews || [];
    const reviewCount = Array.isArray(reviewLinks) ? reviewLinks.length : 0;

    if (reviewCount === 0) continue;

    // 口コミの平均評価を計算
    const reviews = await base('Reviews').select({
      filterByFormula: `AND({IsApproved} = TRUE(), FIND("${siteName}", ARRAYJOIN({Site})))`,
      fields: ['Rating']
    }).all();

    const ratings = reviews.map(r => r.fields.Rating || 0);
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    sitesWithStats.push({
      name: siteName,
      reviewCount,
      avgRating: avgRating.toFixed(2)
    });
  }

  // 評価順にソート
  sitesWithStats.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);

  console.log('🏆 TOP 20サイト（評価順）:\n');
  sitesWithStats.slice(0, 20).forEach((site, i) => {
    console.log(`${i + 1}. ${site.name}`);
    console.log(`   ⭐${site.avgRating} (${site.reviewCount}件の口コミ)`);
  });

  console.log('\n\n💡 推奨: 評価3.5以上、口コミ5件以上のサイトを優良に設定');

  const legitimateCandidates = sitesWithStats.filter(s =>
    parseFloat(s.avgRating) >= 3.5 && s.reviewCount >= 5
  );

  console.log(`\n📝 優良サイト候補: ${legitimateCandidates.length}件\n`);
  legitimateCandidates.forEach(site => {
    console.log(`- ${site.name} (⭐${site.avgRating}, ${site.reviewCount}件)`);
  });
}

checkTopSites().catch(console.error);
