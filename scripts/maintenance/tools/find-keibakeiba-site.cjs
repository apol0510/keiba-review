const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function findKeibakeibaSite() {
  console.log('🔍 「競馬競馬」という名前のサイトを検索中...\n');

  try {
    // パターン1: 完全一致
    const exactMatch = await base('Sites')
      .select({
        filterByFormula: `{Name} = "競馬競馬"`
      })
      .all();

    // パターン2: 部分一致
    const partialMatch = await base('Sites')
      .select({
        filterByFormula: `FIND("競馬競馬", {Name}) > 0`
      })
      .all();

    // パターン3: すべてのサイト名をチェック
    const allSites = await base('Sites')
      .select({
        fields: ['Name', 'Slug', 'URL', 'IsApproved', 'Category']
      })
      .all();

    const duplicateNameSites = allSites.filter(site => {
      const name = site.fields.Name || '';
      return name.includes('競馬競馬');
    });

    console.log('📊 検索結果:\n');
    console.log(`完全一致: ${exactMatch.length}件`);
    console.log(`部分一致: ${partialMatch.length}件`);
    console.log(`全サイト検索: ${duplicateNameSites.length}件\n`);

    if (duplicateNameSites.length === 0) {
      console.log('✅ 「競馬競馬」という名前のサイトは見つかりませんでした。');
      console.log('   問題: おそらくキャッシュまたはビルド済みファイルの問題です。\n');
      return { found: false };
    }

    console.log('⚠️  以下のサイトが見つかりました:\n');

    for (const site of duplicateNameSites) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📄 レコードID: ${site.id}`);
      console.log(`   名前: ${site.fields.Name}`);
      console.log(`   Slug: ${site.fields.Slug}`);
      console.log(`   URL: ${site.fields.URL}`);
      console.log(`   承認済み: ${site.fields.IsApproved ? 'はい' : 'いいえ'}`);
      console.log(`   カテゴリ: ${site.fields.Category || '未設定'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    return { found: true, sites: duplicateNameSites };

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    return { found: false, error: error.message };
  }
}

findKeibakeibaSite().catch(console.error);
