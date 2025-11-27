import type { APIRoute } from 'astro';
import Airtable from 'airtable';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const AIRTABLE_API_KEY = import.meta.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.AIRTABLE_BASE_ID;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { siteId, siteUrl } = await request.json();

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

    // サイトを承認状態に更新
    await base('Sites').update(siteId, {
      IsApproved: true,
    });

    // スクリーンショットを取得（バックグラウンドで実行）
    if (siteUrl) {
      captureScreenshotAsync(siteId, siteUrl).catch(err => {
        console.error('Screenshot capture failed:', err);
      });
    }

    return new Response(
      JSON.stringify({ message: 'サイトを承認しました' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error approving site:', error);
    return new Response(
      JSON.stringify({ message: 'サイト承認に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// スクリーンショット取得（非同期）
async function captureScreenshotAsync(siteId: string, siteUrl: string) {
  let browser;

  try {
    // サイト情報を取得してSlugを取得
    Airtable.configure({ apiKey: AIRTABLE_API_KEY! });
    const base = Airtable.base(AIRTABLE_BASE_ID!);
    const record = await base('Sites').find(siteId);
    const slug = record.fields.Slug as string;

    if (!slug) {
      console.error('Slug not found for site:', siteId);
      return;
    }

    console.log(`Capturing screenshot for ${slug}...`);

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await page.goto(siteUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // スクリーンショットを保存
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const outputPath = path.join(screenshotsDir, `${slug}.png`);
    await page.screenshot({ path: outputPath, fullPage: false, type: 'png' });

    // AirtableにスクリーンショットURLを設定
    const screenshotUrl = `https://frabjous-taiyaki-460401.netlify.app/screenshots/${slug}.png`;
    await base('Sites').update(siteId, {
      ScreenshotURL: screenshotUrl,
    });

    console.log(`Screenshot captured and uploaded: ${slug}`);
  } catch (error) {
    console.error('Screenshot capture error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
