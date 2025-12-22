#!/usr/bin/env node

/**
 * サイトカテゴリ自動分類スクリプト
 *
 * サイト名とURLから適切なカテゴリを自動判定してAirtableを更新
 *
 * 使用方法:
 * AIRTABLE_API_KEY=your-token AIRTABLE_BASE_ID=your-base-id node scripts/auto-categorize-sites.js
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ エラー: 環境変数が設定されていません');
  console.error('使用方法:');
  console.error('AIRTABLE_API_KEY=your-token AIRTABLE_BASE_ID=your-base-id node scripts/auto-categorize-sites.js');
  process.exit(1);
}

const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// カテゴリ判定用キーワード
const categoryKeywords = {
  nankan: [
    '南関', '大井', '川崎', '船橋', '浦和', 'nankan', 'tck', 'nankankeiba',
    '南関東', '関東地方公営', 'SPAT4'
  ],
  chuo: [
    '中央', 'JRA', '東京競馬', '阪神競馬', '京都競馬', '中京競馬', '新潟競馬',
    '福島競馬', '函館競馬', '札幌競馬', '小倉競馬', '中山競馬',
    'jra', '重賞', 'G1', 'GⅠ', 'コンピ', '日刊'
  ],
  chihou: [
    '地方', 'NAR', '園田', '金沢', '名古屋', '高知', '佐賀', '笠松',
    '盛岡', '水沢', '門別', '帯広', 'ばんえい', '姫路', '地方競馬全国',
    'oddspark', 'nar', '公営競馬'
  ],
};

/**
 * サイト名とURLからカテゴリを自動判定
 */
function detectCategory(name, url) {
  const text = `${name} ${url}`.toLowerCase();

  // NANKANチェック（最優先）
  for (const keyword of categoryKeywords.nankan) {
    if (text.includes(keyword.toLowerCase())) {
      return 'nankan';
    }
  }

  // 中央競馬チェック
  for (const keyword of categoryKeywords.chuo) {
    if (text.includes(keyword.toLowerCase())) {
      return 'chuo';
    }
  }

  // 地方競馬チェック
  for (const keyword of categoryKeywords.chihou) {
    if (text.includes(keyword.toLowerCase())) {
      return 'chihou';
    }
  }

  // デフォルトはその他
  return 'other';
}

/**
 * Airtableから全サイトを取得
 */
async function getAllSites() {
  try {
    let allRecords = [];
    let offset = null;

    do {
      const url = offset
        ? `${API_URL}/Sites?offset=${offset}`
        : `${API_URL}/Sites`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Airtable API エラー: ${response.status}`);
      }

      const data = await response.json();
      allRecords = allRecords.concat(data.records);
      offset = data.offset;
    } while (offset);

    return allRecords;
  } catch (error) {
    console.error('❌ サイト取得エラー:', error.message);
    return [];
  }
}

/**
 * サイトのカテゴリを更新
 */
async function updateSiteCategory(recordId, category, name) {
  try {
    const response = await fetch(`${API_URL}/Sites/${recordId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          Category: category,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API エラー: ${response.status}\n${error}`);
    }

    return true;
  } catch (error) {
    console.error(`  ❌ 更新エラー (${name}):`, error.message);
    return false;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 サイトカテゴリ自動分類を開始します\n');

  // 全サイトを取得
  const sites = await getAllSites();
  console.log(`📊 対象サイト数: ${sites.length}件\n`);

  if (sites.length === 0) {
    console.log('⚠️  サイトが見つかりませんでした');
    return;
  }

  const stats = {
    nankan: 0,
    chuo: 0,
    chihou: 0,
    other: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
  };

  // 各サイトのカテゴリを判定・更新
  for (const site of sites) {
    const fields = site.fields;
    const name = fields.Name || 'unknown';
    const url = fields.URL || '';
    const currentCategory = fields.Category || 'other';

    // カテゴリを自動判定
    const detectedCategory = detectCategory(name, url);

    // カテゴリ統計
    stats[detectedCategory]++;

    if (currentCategory === detectedCategory) {
      console.log(`  ⏭️  ${name}: ${currentCategory} (変更なし)`);
      stats.unchanged++;
    } else {
      // otherカテゴリへの更新はスキップ（権限エラー回避）
      if (detectedCategory === 'other') {
        console.log(`  ⚠️  ${name}: ${currentCategory} → other (スキップ: 権限なし)`);
        stats.unchanged++;
      } else {
        console.log(`  🔄 ${name}: ${currentCategory} → ${detectedCategory}`);

        const success = await updateSiteCategory(site.id, detectedCategory, name);

        if (success) {
          stats.updated++;
          console.log(`    ✅ 更新完了`);
        } else {
          stats.errors++;
        }

        // API制限を考慮して少し待機
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  console.log('\n\n📊 カテゴリ分類結果:');
  console.log(`  南関競馬 (nankan): ${stats.nankan}件`);
  console.log(`  中央競馬 (chuo): ${stats.chuo}件`);
  console.log(`  地方競馬 (chihou): ${stats.chihou}件`);
  console.log(`  その他 (other): ${stats.other}件`);
  console.log(`\n📝 更新結果:`);
  console.log(`  ✅ 更新: ${stats.updated}件`);
  console.log(`  ⏭️  変更なし: ${stats.unchanged}件`);
  console.log(`  ❌ エラー: ${stats.errors}件`);
  console.log('\n🎉 処理完了');
}

main().catch(error => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
