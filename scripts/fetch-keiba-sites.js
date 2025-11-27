#!/usr/bin/env node

/**
 * 競馬予想サイト自動取得スクリプト
 *
 * Bing Search APIで競馬予想サイトを検索し、Airtableに自動登録します
 *
 * 使用方法:
 * BING_API_KEY=your-key AIRTABLE_API_KEY=your-token AIRTABLE_BASE_ID=your-base-id node scripts/fetch-keiba-sites.js
 */

const BING_API_KEY = process.env.BING_API_KEY;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!BING_API_KEY || !AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ エラー: 環境変数が設定されていません');
  console.error('必要な環境変数: BING_API_KEY, AIRTABLE_API_KEY, AIRTABLE_BASE_ID');
  process.exit(1);
}

const BING_API_URL = 'https://api.bing.microsoft.com/v7.0/search';
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// 検索キーワード
const SEARCH_QUERIES = [
  '南関競馬 予想サイト',
  '地方競馬 予想',
  '中央競馬 予想サイト',
  '競馬予想 口コミ',
];

// カテゴリ判定キーワード
const CATEGORY_KEYWORDS = {
  nankan: ['南関', '大井', '川崎', '船橋', '浦和', 'NANKAN'],
  chuo: ['中央競馬', 'JRA', '東京競馬', '阪神競馬', '中京競馬', '京都競馬'],
  chihou: ['地方競馬', 'NAR', '園田', '金沢', '名古屋', '高知'],
};

/**
 * Bing Search APIで検索
 */
async function searchWithBing(query) {
  console.log(`🔍 検索中: "${query}"`);

  const url = new URL(BING_API_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('count', '10');
  url.searchParams.set('mkt', 'ja-JP');

  try {
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': BING_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Bing API エラー: ${response.status}`);
    }

    const data = await response.json();
    return data.webPages?.value || [];
  } catch (error) {
    console.error(`❌ 検索エラー (${query}):`, error.message);
    return [];
  }
}

/**
 * URLからサイト情報を抽出
 */
function extractSiteInfo(result) {
  const url = new URL(result.url);
  const domain = url.hostname.replace(/^www\./, '');
  const name = result.name;
  const description = result.snippet || '';

  // スラッグを生成（ドメイン名から）
  const slug = domain.replace(/\./g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase();

  // カテゴリ判定
  let category = 'other';
  const textToCheck = `${name} ${description} ${url}`.toLowerCase();

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => textToCheck.includes(keyword.toLowerCase()))) {
      category = cat;
      break;
    }
  }

  return {
    Name: name.substring(0, 100), // Airtableの制限に合わせる
    Slug: slug,
    URL: result.url,
    Category: category,
    Description: description.substring(0, 500),
    Features: '', // 後で手動で追加
    PriceInfo: '', // 後で手動で追加
    IsApproved: false, // デフォルトは未承認
    ReviewCount: 0,
    AverageRating: 0,
  };
}

/**
 * Airtableに既存サイトがあるかチェック
 */
async function checkExistingSite(url) {
  try {
    const response = await fetch(
      `${AIRTABLE_API_URL}/Sites?filterByFormula={URL}='${encodeURIComponent(url)}'`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) return false;

    const data = await response.json();
    return data.records.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Airtableにサイトを追加
 */
async function addSiteToAirtable(siteInfo) {
  try {
    const response = await fetch(`${AIRTABLE_API_URL}/Sites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{ fields: siteInfo }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API エラー: ${response.status}\n${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Airtable登録エラー:`, error.message);
    return null;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 競馬予想サイト自動取得を開始します\n');

  const allSites = [];
  const seenUrls = new Set();

  // 各検索クエリで検索
  for (const query of SEARCH_QUERIES) {
    const results = await searchWithBing(query);

    for (const result of results) {
      // 重複チェック
      if (seenUrls.has(result.url)) continue;
      seenUrls.add(result.url);

      // サイト情報を抽出
      const siteInfo = extractSiteInfo(result);

      // Airtableに既に存在するかチェック
      const exists = await checkExistingSite(result.url);
      if (exists) {
        console.log(`⏭️  スキップ (既存): ${siteInfo.Name}`);
        continue;
      }

      allSites.push(siteInfo);
    }

    // API制限を考慮して少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 検索結果: ${allSites.length}件の新規サイトを発見\n`);

  // Airtableに登録
  let added = 0;
  for (const site of allSites) {
    console.log(`📝 登録中: ${site.Name} (${site.Category})`);

    const result = await addSiteToAirtable(site);
    if (result) {
      added++;
      console.log(`✅ 登録完了: ${site.URL}`);
    }

    // API制限を考慮して少し待機
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n🎉 完了: ${added}件のサイトを登録しました`);
  console.log('\n次のステップ:');
  console.log('1. Airtable Baseで確認: https://airtable.com/' + AIRTABLE_BASE_ID);
  console.log('2. IsApprovedフィールドにチェックを入れて承認');
  console.log('3. Features, PriceInfoなど詳細情報を追加');
  console.log('4. サイトで確認: https://frabjous-taiyaki-460401.netlify.app/');
}

main().catch(error => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
