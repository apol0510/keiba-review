const fs = require('fs');
const path = require('path');

// サイト品質設定を読み込み
function loadSiteRatings() {
  const ratingPath = path.join(__dirname, 'config/site-ratings.json');
  const data = JSON.parse(fs.readFileSync(ratingPath, 'utf-8'));
  return {
    legitimate: data.legitimate || [],
    malicious: data.malicious || [],
    postingFrequency: data.postingFrequency || {
      legitimate: 1.0,
      normal: 0.33,
      malicious: 0.2
    }
  };
}

// サイトの評価を取得
function getSiteRating(siteName, siteRatings) {
  const isLegitimate = siteRatings.legitimate.some(legitName =>
    siteName.includes(legitName) || legitName.includes(siteName)
  );

  if (isLegitimate) {
    return { type: 'legitimate', probability: siteRatings.postingFrequency.legitimate };
  }

  const isMalicious = siteRatings.malicious.some(maliciousName =>
    siteName.includes(maliciousName) || maliciousName.includes(siteName)
  );

  if (isMalicious) {
    return { type: 'malicious', probability: siteRatings.postingFrequency.malicious };
  }

  return { type: 'normal', probability: siteRatings.postingFrequency.normal };
}

// テスト実行
const siteRatings = loadSiteRatings();

console.log('📊 投稿確率システムのテスト\n');
console.log(`✅ 優良サイト: ${siteRatings.legitimate.length}件 (投稿確率: ${(siteRatings.postingFrequency.legitimate * 100).toFixed(0)}%)`);
console.log(`⚪ 通常サイト: - (投稿確率: ${(siteRatings.postingFrequency.normal * 100).toFixed(0)}%)`);
console.log(`❌ 悪質サイト: ${siteRatings.malicious.length}件 (投稿確率: ${(siteRatings.postingFrequency.malicious * 100).toFixed(0)}%)\n`);

// シミュレーション（100回実行）
const testSites = [
  { name: '競馬新聞＆スピード指数（無料）', expected: 'legitimate' },
  { name: 'テスト通常サイト', expected: 'normal' },
  { name: 'ターフビジョン', expected: 'malicious' }
];

console.log('🧪 シミュレーション（100回実行）:\n');

testSites.forEach(testSite => {
  const rating = getSiteRating(testSite.name, siteRatings);
  let postCount = 0;

  for (let i = 0; i < 100; i++) {
    if (Math.random() < rating.probability) {
      postCount++;
    }
  }

  console.log(`${testSite.name}:`);
  console.log(`  タイプ: ${rating.type} (期待値: ${testSite.expected})`);
  console.log(`  投稿確率: ${(rating.probability * 100).toFixed(0)}%`);
  console.log(`  100回中の投稿回数: ${postCount}回 (期待値: ${(rating.probability * 100).toFixed(0)}回)\n`);
});
