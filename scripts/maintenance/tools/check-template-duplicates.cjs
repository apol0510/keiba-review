const fs = require('fs');
const path = require('path');

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
  { pattern: /評価評価/g, name: '評価評価' }
];

async function checkTemplateFiles() {
  console.log('🔍 口コミテンプレートファイルで重複パターンをチェック中...\n');

  const reviewsDir = path.join(__dirname, 'reviews-data');
  const files = [
    '⭐1（辛口／クレーム寄り）.txt',
    '⭐2（少し辛口寄り）.txt',
    '⭐3（ニュートラル）.txt',
    '⭐4（少しポジティブ寄り）.txt',
    '⭐5（premium専用・高評価）.txt'
  ];

  let totalIssues = 0;

  for (const filename of files) {
    const filePath = path.join(reviewsDir, filename);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ファイルが見つかりません: ${filename}`);
      continue;
    }

    console.log(`📄 ${filename} をチェック中...`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let fileIssues = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const { pattern, name } of duplicatePatterns) {
        const matches = line.match(pattern);
        if (matches && matches.length > 0) {
          fileIssues++;
          totalIssues++;
          console.log(`  ⚠️  行 ${i + 1}: ${name} を発見`);
          console.log(`     ${line.substring(0, 100)}...`);
        }
        // パターンのリセット
        pattern.lastIndex = 0;
      }
    }

    if (fileIssues === 0) {
      console.log(`  ✅ 問題なし`);
    } else {
      console.log(`  ❌ ${fileIssues}件の問題を発見`);
    }
    console.log('');
  }

  if (totalIssues === 0) {
    console.log('✅ すべてのテンプレートファイルで重複パターンは見つかりませんでした。');
  } else {
    console.log(`\n📊 合計 ${totalIssues} 件の問題を発見しました。`);
    console.log('\n🔧 修正するには以下のコマンドを実行してください:');
    console.log('node scripts/fix-template-duplicates.cjs');
  }
}

checkTemplateFiles().catch(console.error);
