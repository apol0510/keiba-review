const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function checkSiteStatus() {
  const slug = 'apolon-keibanahibi-com';

  console.log(`🔍 サイト "${slug}" の状態を確認中...\n`);

  try {
    // 全てのサイトを取得（承認済み・未承認含む）
    const allSites = await base('Sites')
      .select({
        filterByFormula: `{Slug} = "${slug}"`,
        fields: ['Name', 'Slug', 'URL', 'IsApproved', 'Category', 'SiteQuality', 'Reviews']
      })
      .all();

    if (allSites.length === 0) {
      console.log('✅ このサイトはAirtableに存在しません。');
      console.log('   問題: キャッシュまたはビルド済みファイルが残っている可能性があります。\n');
      return { exists: false };
    }

    console.log(`📊 発見: ${allSites.length}件のレコード\n`);

    for (const site of allSites) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📄 レコードID: ${site.id}`);
      console.log(`   名前: ${site.fields.Name}`);
      console.log(`   Slug: ${site.fields.Slug}`);
      console.log(`   URL: ${site.fields.URL}`);
      console.log(`   承認済み: ${site.fields.IsApproved ? 'はい' : 'いいえ'}`);
      console.log(`   カテゴリ: ${site.fields.Category || '未設定'}`);
      console.log(`   品質: ${site.fields.SiteQuality || '未設定'}`);

      const reviewCount = site.fields.Reviews ? site.fields.Reviews.length : 0;
      console.log(`   口コミ数: ${reviewCount}件`);

      if (reviewCount > 0) {
        console.log(`   ⚠️  このサイトには${reviewCount}件の口コミがあります！`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    return { exists: true, sites: allSites };

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    return { exists: false, error: error.message };
  }
}

checkSiteStatus().catch(console.error);
