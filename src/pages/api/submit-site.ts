import type { APIRoute } from 'astro';
import Airtable from 'airtable';

const AIRTABLE_API_KEY = import.meta.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.AIRTABLE_BASE_ID;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // バリデーション
    if (!data.name || !data.url || !data.category || !data.description) {
      return new Response(
        JSON.stringify({ message: '必須項目が入力されていません' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.submitter_name || !data.submitter_email) {
      return new Response(
        JSON.stringify({ message: '投稿者情報が入力されていません' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 説明文の最低文字数チェック
    if (data.description.length < 50) {
      return new Response(
        JSON.stringify({ message: 'サイト説明は50文字以上入力してください' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // URLのフォーマットチェック
    try {
      new URL(data.url);
    } catch {
      return new Response(
        JSON.stringify({ message: '正しいURLを入力してください' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Airtableに保存
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.error('Airtable credentials not configured');
      return new Response(
        JSON.stringify({ message: 'サーバーエラーが発生しました' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    Airtable.configure({ apiKey: AIRTABLE_API_KEY });
    const base = Airtable.base(AIRTABLE_BASE_ID);

    // Slugを生成（URLのドメイン部分から）
    const urlObj = new URL(data.url);
    const slug = urlObj.hostname.replace(/^www\./, '').replace(/\./g, '-');

    // 重複チェック
    const existingRecords = await base('Sites')
      .select({
        filterByFormula: `OR({URL} = '${data.url}', {Slug} = '${slug}')`,
        maxRecords: 1,
      })
      .all();

    if (existingRecords.length > 0) {
      return new Response(
        JSON.stringify({ message: 'このサイトは既に登録されています' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Airtableに新規サイトを作成
    await base('Sites').create({
      Name: data.name,
      Slug: slug,
      URL: data.url,
      Category: data.category,
      Description: data.description,
      IsApproved: false, // 未承認状態で登録
      SubmitterName: data.submitter_name,
      SubmitterEmail: data.submitter_email,
    });

    return new Response(
      JSON.stringify({
        message: 'サイトを登録しました。管理者の承認をお待ちください。'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error submitting site:', error);
    return new Response(
      JSON.stringify({
        message: 'サーバーエラーが発生しました。しばらく経ってから再度お試しください。'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
