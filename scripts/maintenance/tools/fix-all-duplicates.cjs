const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// 修正する重複パターン（シンプルな2回連続のみ）
const duplicatePatterns = [
  { pattern: /競馬競馬/g, replacement: '競馬', name: '競馬競馬' },
  { pattern: /予想予想/g, replacement: '予想', name: '予想予想' },
  { pattern: /買い目買い目/g, replacement: '買い目', name: '買い目買い目' },
  { pattern: /的中的中/g, replacement: '的中', name: '的中的中' },
  { pattern: /南関南関/g, replacement: '南関', name: '南関南関' },
  { pattern: /地方地方/g, replacement: '地方', name: '地方地方' },
  { pattern: /中央中央/g, replacement: '中央', name: '中央中央' },
  { pattern: /サイトサイト/g, replacement: 'サイト', name: 'サイトサイト' },
  { pattern: /口コミ口コミ/g, replacement: '口コミ', name: '口コミ口コミ' },
  { pattern: /情報情報/g, replacement: '情報', name: '情報情報' },
  { pattern: /無料無料/g, replacement: '無料', name: '無料無料' },
  { pattern: /有料有料/g, replacement: '有料', name: '有料有料' },
  { pattern: /レースレース/g, replacement: 'レース', name: 'レースレース' },
  { pattern: /利用利用/g, replacement: '利用', name: '利用利用' },
  { pattern: /評価評価/g, replacement: '評価', name: '評価評価' }
];

async function fixAllDuplicates() {
  console.log('🔧 Airtableの口コミで重複パターンを修正中...\n');

  const reviews = await base('Reviews')
    .select({ filterByFormula: '{IsApproved} = TRUE()' })
    .all();

  console.log(`📊 合計 ${reviews.length} 件の口コミをチェックします\n`);

  let totalFixed = 0;

  for (const review of reviews) {
    const originalContent = review.fields.Content || '';
    const originalTitle = review.fields.Title || '';
    let fixedContent = originalContent;
    let fixedTitle = originalTitle;
    let hasChanges = false;
    const appliedFixes = [];

    // Contentをチェックして修正
    for (const { pattern, replacement, name } of duplicatePatterns) {
      if (pattern.test(fixedContent)) {
        fixedContent = fixedContent.replace(pattern, replacement);
        hasChanges = true;
        appliedFixes.push(name);
      }
      // パターンはグローバルフラグ付きなので、lastIndexをリセット
      pattern.lastIndex = 0;
    }

    // Titleもチェックして修正
    for (const { pattern, replacement, name } of duplicatePatterns) {
      if (pattern.test(fixedTitle)) {
        fixedTitle = fixedTitle.replace(pattern, replacement);
        hasChanges = true;
        if (!appliedFixes.includes(name)) {
          appliedFixes.push(name);
        }
      }
      pattern.lastIndex = 0;
    }

    if (hasChanges) {
      totalFixed++;
      console.log(`📝 ID: ${review.id}`);
      console.log(`   修正パターン: ${appliedFixes.join(', ')}`);

      if (originalTitle !== fixedTitle) {
        console.log(`   タイトル修正前: ${originalTitle}`);
        console.log(`   タイトル修正後: ${fixedTitle}`);
      }

      if (originalContent !== fixedContent) {
        console.log(`   内容修正前: ${originalContent.substring(0, 80)}...`);
        console.log(`   内容修正後: ${fixedContent.substring(0, 80)}...`);
      }

      await base('Reviews').update(review.id, {
        Title: fixedTitle,
        Content: fixedContent
      });

      console.log('   ✅ 修正完了\n');
    }
  }

  if (totalFixed === 0) {
    console.log('✅ 重複パターンは見つかりませんでした。すべて正常です。');
  } else {
    console.log(`\n🎉 ${totalFixed} 件の口コミを修正しました！`);
  }
}

fixAllDuplicates().catch(console.error);
