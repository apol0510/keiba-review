import type { APIRoute } from 'astro';
import Airtable from 'airtable';

const AIRTABLE_API_KEY = import.meta.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.AIRTABLE_BASE_ID;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return new Response(
        JSON.stringify({ message: 'サイトIDが指定されていません' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return new Response(
        JSON.stringify({ message: 'サーバー設定エラー' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    Airtable.configure({ apiKey: AIRTABLE_API_KEY });
    const base = Airtable.base(AIRTABLE_BASE_ID);

    // サイトを削除
    await base('Sites').destroy(siteId);

    return new Response(
      JSON.stringify({ message: 'サイトを却下しました' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error rejecting site:', error);
    return new Response(
      JSON.stringify({ message: 'サイト却下に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
