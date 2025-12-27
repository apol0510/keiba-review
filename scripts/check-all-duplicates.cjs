const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// チェックする重複パターン
const duplicatePatterns = [
  { pattern: /競馬競馬/g, name: '競馬競馬' },
  { pattern: /予想予想/g, name: '予想予想' },
  { pattern: /買い目買い目/g, name: '買い目買い目' },
  { pattern: /的中的中/g, name: '的中的中' },
  { pattern: /南関南関/g, name: '南関南関' },
  { pattern: /地方地方/g, name: '地方地方' },
  { pattern: /中央中央/g, name: '中央中央' },
  { pattern: /サイトサイト/g, name: 'サイトサイト' },
  { pattern: /口コミ口コミ/g, name: '口コミ口コミ' },
  { pattern: /情報情報/g, name: '情報情報' },
  { pattern: /無料無料/g, name: '無料無料' },
  { pattern: /有料有料/g, name: '有料有料' },
  { pattern: /レースレース/g, name: 'レースレース' },
  { pattern: /利用利用/g, name: '利用利用' },
  { pattern: /評価評価/g, name: '評価評価' },
  // 同じ単語が3回以上連続
  { pattern: /(\p{Script=Hiragana}+)\1\1+/gu, name: 'ひらがな3回以上連続' },
  { pattern: /(\p{Script=Katakana}+)\1\1+/gu, name: 'カタカナ3回以上連続' },
  { pattern: /([\u4e00-\u9faf]+)\1\1+/gu, name: '漢字3回以上連続' }
];

async function checkAllDuplicates() {
  console.log('🔍 Airtableの口コミで重複パターンをチェック中...\n');

  const reviews = await base('Reviews')
    .select({ filterByFormula: '{IsApproved} = TRUE()' })
    .all();

  console.log(`📊 合計 ${reviews.length} 件の口コミをチェックします\n`);

  const foundIssues = {};

  for (const pattern of duplicatePatterns) {
    foundIssues[pattern.name] = [];
  }

  for (const review of reviews) {
    const content = review.fields.Content || '';
    const title = review.fields.Title || '';
    const fullText = `${title} ${content}`;

    for (const { pattern, name } of duplicatePatterns) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        foundIssues[name].push({
          id: review.id,
          title: title.substring(0, 30),
          content: content.substring(0, 80),
          matches: matches
        });
      }
    }
  }

  let totalIssues = 0;
  for (const [patternName, issues] of Object.entries(foundIssues)) {
    if (issues.length > 0) {
      totalIssues += issues.length;
      console.log(`⚠️  【${patternName}】 ${issues.length}件発見:`);
      issues.forEach(issue => {
        console.log(`  ID: ${issue.id}`);
        console.log(`  タイトル: ${issue.title}`);
        console.log(`  内容: ${issue.content}...`);
        console.log(`  一致: ${issue.matches.join(', ')}`);
        console.log('');
      });
    }
  }

  if (totalIssues === 0) {
    console.log('✅ 重複パターンは見つかりませんでした。すべて正常です。');
  } else {
    console.log(`\n📊 合計 ${totalIssues} 件の問題を発見しました。`);
    console.log('\n🔧 修正するには以下のコマンドを実行してください:');
    console.log('AIRTABLE_API_KEY=xxx AIRTABLE_BASE_ID=xxx node scripts/fix-all-duplicates.cjs');
  }
}

checkAllDuplicates().catch(console.error);
