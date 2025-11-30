import type { APIRoute } from 'astro';

const AIRTABLE_API_KEY = import.meta.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.AIRTABLE_BASE_ID;

interface UpdateRequest {
  id: string;
  siteQuality: 'excellent' | 'normal' | 'malicious';
  displayPriority: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // 環境変数チェック
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Airtable credentials not configured',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // リクエストボディを取得
    const body = await request.json();
    const updates: UpdateRequest[] = body.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '更新データが不正です',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // バリデーション
    for (const update of updates) {
      if (!update.id || !update.siteQuality || typeof update.displayPriority !== 'number') {
        return new Response(
          JSON.stringify({
            success: false,
            message: '更新データが不正です（id, siteQuality, displayPriority が必要）',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (!['excellent', 'normal', 'malicious'].includes(update.siteQuality)) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'siteQuality は excellent/normal/malicious のいずれかである必要があります',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

    // Airtableは一度に最大10件まで更新可能
    const batches = [];
    for (let i = 0; i < updates.length; i += 10) {
      batches.push(updates.slice(i, i + 10));
    }

    let updatedCount = 0;
    const errors: string[] = [];

    for (const batch of batches) {
      try {
        const response = await fetch(`${API_URL}/Sites`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: batch.map(update => ({
              id: update.id,
              fields: {
                SiteQuality: update.siteQuality,
                DisplayPriority: update.displayPriority,
              },
            })),
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          errors.push(`Batch ${updatedCount / 10 + 1}: ${response.status} - ${errorText}`);
          continue;
        }

        updatedCount += batch.length;

        // API制限を考慮して待機
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        errors.push(
          `Batch ${updatedCount / 10 + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // レスポンス
    if (errors.length > 0 && updatedCount === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '更新に失敗しました',
          errors,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${updatedCount}件のサイトを更新しました`,
        updatedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Site quality update error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'サーバーエラーが発生しました',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
