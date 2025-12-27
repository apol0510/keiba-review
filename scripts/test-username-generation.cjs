/**
 * ユーザー名生成のテストスクリプト
 */

// 最近使用したユーザー名を記録（重複防止）
const recentUsernames = new Set();

// より自然なユーザー名パターンを複数用意
const usernamePatterns = [
  // パターン1: 一般的な名前風（40%）
  () => {
    const firstNames = ['太郎', '次郎', '三郎', '花子', '愛', '健', '誠', '優', '拓', '翔', '陽', '凛', '葵', '蓮'];
    const lastNames = ['田中', '佐藤', '鈴木', '高橋', '伊藤', '渡辺', '山本', '中村', '小林', '加藤'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const number = Math.floor(Math.random() * 1000);
    return Math.random() > 0.5 ? `${lastName}${firstName}${number}` : `${firstName}${number}`;
  },

  // パターン2: ニックネーム風（30%）
  () => {
    const nicknames = [
      'ケイバ太郎', 'うまうま', 'ウマ好き', 'ターフの達人', 'けいば次郎',
      'うまっち', 'ケイバ男', 'ケイバ女', 'うまきち', 'うまぞう',
      'ギャンブラー', 'ベテランさん', '初心者くん', 'ラッキーボーイ',
      '週末の戦士', 'サラリーマン', 'OL', '学生', 'フリーター',
      'うまニート', 'けいば親父', 'うま子', 'けいば好き', 'ウマ太',
      'うまみ', 'けいば郎', 'ウマ彦', 'けいば介', 'うま蔵'
    ];
    const nickname = nicknames[Math.floor(Math.random() * nicknames.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${nickname}${number}`;
  },

  // パターン3: 競馬関連ワード（20%）
  () => {
    const words = ['競馬ファン', '馬券好き', '予想屋', 'ベテラン', '初心者', '本命党', '穴党'];
    const word = words[Math.floor(Math.random() * words.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${word}${number}`;
  },

  // パターン4: アルファベット混在（10%）
  () => {
    const prefixes = ['keiba', 'uma', 'turf', 'bet', 'race', 'win', 'lucky'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 10000);
    return `${prefix}${number}`;
  }
];

function generateUsername() {
  let username = '';
  let usernameAttempts = 0;
  const maxUsernameAttempts = 50;

  // 重複しないユーザー名を生成（最大50回試行）
  while (usernameAttempts < maxUsernameAttempts) {
    // パターンをランダムに選択（重み付け）
    const rand = Math.random();
    let patternIndex;
    if (rand < 0.4) patternIndex = 0;        // 40% - 一般的な名前
    else if (rand < 0.7) patternIndex = 1;   // 30% - ニックネーム
    else if (rand < 0.9) patternIndex = 2;   // 20% - 競馬関連
    else patternIndex = 3;                    // 10% - アルファベット

    const candidate = usernamePatterns[patternIndex]();

    // 最近使用していないユーザー名であれば採用
    if (!recentUsernames.has(candidate)) {
      username = candidate;
      recentUsernames.add(candidate);

      // メモリ節約: 100件を超えたら古いものを削除
      if (recentUsernames.size > 100) {
        const firstItem = recentUsernames.values().next().value;
        recentUsernames.delete(firstItem);
      }

      return { username, pattern: patternIndex + 1 };
    }

    usernameAttempts++;
  }

  // 50回試行して見つからない場合はタイムスタンプベース
  if (!username) {
    username = `ユーザー${Date.now() % 100000}`;
  }

  return { username, pattern: 'fallback' };
}

// テスト実行
console.log('🧪 ユーザー名生成テスト（50件）\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const patternCounts = { 1: 0, 2: 0, 3: 0, 4: 0, fallback: 0 };

for (let i = 0; i < 50; i++) {
  const { username, pattern } = generateUsername();
  patternCounts[pattern]++;

  // パターン名を表示
  const patternName =
    pattern === 1 ? '[一般名]' :
    pattern === 2 ? '[ニックネーム]' :
    pattern === 3 ? '[競馬関連]' :
    pattern === 4 ? '[アルファベット]' : '[フォールバック]';

  console.log(`${(i + 1).toString().padStart(2)}: ${username.padEnd(20)} ${patternName}`);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📊 パターン別の分布:');
console.log(`  [一般名]: ${patternCounts[1]}件 (期待値: 40%)`);
console.log(`  [ニックネーム]: ${patternCounts[2]}件 (期待値: 30%)`);
console.log(`  [競馬関連]: ${patternCounts[3]}件 (期待値: 20%)`);
console.log(`  [アルファベット]: ${patternCounts[4]}件 (期待値: 10%)`);
console.log(`  [フォールバック]: ${patternCounts.fallback}件\n`);

console.log('✅ テスト完了');
