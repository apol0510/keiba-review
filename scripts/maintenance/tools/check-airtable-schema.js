#!/usr/bin/env node
const Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function checkSchema() {
  try {
    console.log('🔍 Reviewsテーブルのスキーマを確認中...\n');

    const records = await base('Reviews').select({
      maxRecords: 1
    }).firstPage();

    if (records.length > 0) {
      const record = records[0];
      console.log('📋 利用可能なフィールド:');
      console.log(JSON.stringify(record.fields, null, 2));
      console.log('\n📝 Record ID:', record.id);
      console.log('📝 Created Time:', record._rawJson.createdTime);
    } else {
      console.log('⚠️ レビューが見つかりませんでした');
    }

  } catch (error) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

checkSchema().catch(error => {
  console.error('致命的エラー:', error);
  process.exit(1);
});
