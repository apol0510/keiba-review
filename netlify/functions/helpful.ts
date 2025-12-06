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
    const { reviewId } = JSON.parse(event.body || '{}');

    if (!reviewId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'reviewId is required' }),
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

    // 現在のカウントを取得
    const record = await base('Reviews').find(reviewId);
    const currentCount = (record.fields.HelpfulCount as number) || 0;

    // カウントを +1
    await base('Reviews').update(reviewId, {
      HelpfulCount: currentCount + 1,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        newCount: currentCount + 1,
      }),
    };
  } catch (error) {
    console.error('Error updating helpful count:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to update helpful count',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
