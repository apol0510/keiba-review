import type { Handler } from '@netlify/functions';
import Airtable from 'airtable';

export const handler: Handler = async (event) => {
  // CORSヘッダー
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // OPTIONSリクエスト（プリフライト）
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // POSTのみ許可
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    const {
      site_id,
      user_name,
      user_email,
      rating,
      title,
      content,
      pricing_type,
      has_free_trial,
      registration_required,
      accuracy_rating,
      price_rating,
      support_rating,
      transparency_rating,
    } = data;

    // バリデーション
    if (!site_id || !user_name || !user_email || !rating || !title || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '必須項目が不足しています' }),
      };
    }

    // Airtable接続
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' }),
      };
    }

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

    // 口コミをAirtableに登録
    const record = await base('Reviews').create({
      Site: [site_id],
      UserName: user_name,
      UserEmail: user_email,
      Rating: rating,
      Title: title,
      Content: content,
      IsApproved: false, // 承認制
      // 任意フィールド
      ...(pricing_type && { PricingType: pricing_type }),
      ...(has_free_trial !== undefined && { HasFreeTrial: has_free_trial }),
      ...(registration_required !== undefined && { RegistrationRequired: registration_required }),
      ...(accuracy_rating && { AccuracyRating: accuracy_rating }),
      ...(price_rating && { PriceRating: price_rating }),
      ...(support_rating && { SupportRating: support_rating }),
      ...(transparency_rating && { TransparencyRating: transparency_rating }),
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        review: {
          id: record.id,
          ...record.fields,
        },
      }),
    };
  } catch (error) {
    console.error('Error submitting review:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '口コミの投稿に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
