#!/usr/bin/env node

/**
 * スクリーンショット自動取得スクリプト
 *
 * Airtableの全サイトのスクリーンショットを自動取得し、Airtableにアップロード
 *
 * 使用方法:
 * AIRTABLE_API_KEY=your-token AIRTABLE_BASE_ID=your-base-id node scripts/capture-screenshots.js
 */

import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ エラー: 環境変数が設定されていません');
  console.error('必要な環境変数: AIRTABLE_API_KEY, AIRTABLE_BASE_ID');
  process.exit(1);
}

const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
const SCREENSHOTS_DIR = path.join(__dirname, '../public/screenshots');

// スクリーンショット保存ディレクトリを作成
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Airtableから全サイトを取得
 */
async function getAllSites() {
  try {
    const response = await fetch(`${API_URL}/Sites`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API エラー: ${response.status}`);
    }

    const data = await response.json();
    return data.records;
  } catch (error) {
    console.error('❌ サイト取得エラー:', error.message);
    return [];
  }
}

/**
 * スクリーンショットを撮影
 */
async function captureScreenshot(url, outputPath) {
  let browser;

  try {
    console.log(`  📸 スクリーンショット撮影中: ${url}`);

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // ビューポートを設定（デスクトップサイズ）
    await page.setViewport({
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
    });

    // ユーザーエージェントを設定
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // タイムアウトを30秒に設定
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // 少し待機（広告やポップアップの読み込みを待つ）
    await new Promise(resolve => setTimeout(resolve, 2000));

    // スクリーンショットを撮影
    await page.screenshot({
      path: outputPath,
      fullPage: false, // ファーストビューのみ
      type: 'png',
    });

    console.log(`  ✅ 保存完了: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`  ❌ スクリーンショット取得失敗: ${error.message}`);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Airtableにスクリーンショットをアップロード
 */
async function uploadToAirtable(recordId, imagePath, siteName) {
  try {
    console.log(`  📤 Airtableにアップロード中: ${siteName}`);

    // 画像をBase64エンコード
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const fileName = path.basename(imagePath);

    // Airtableの Attachment フィールドに直接URLを設定するのではなく、
    // 一旦ローカルにホストする必要があるため、URLを生成
    const screenshotUrl = `https://frabjous-taiyaki-460401.netlify.app/screenshots/${fileName}`;

    // レコードを更新
    const response = await fetch(`${API_URL}/Sites/${recordId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          ScreenshotURL: screenshotUrl,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable更新エラー: ${response.status}\n${error}`);
    }

    console.log(`  ✅ Airtable更新完了: ${siteName}`);
    return true;
  } catch (error) {
    console.error(`  ❌ アップロードエラー: ${error.message}`);
    return false;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 スクリーンショット自動取得を開始します\n');

  // 全サイトを取得
  const sites = await getAllSites();
  console.log(`📊 取得したサイト数: ${sites.length}件\n`);

  if (sites.length === 0) {
    console.log('⚠️  サイトが見つかりませんでした');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  // 各サイトのスクリーンショットを取得
  for (const site of sites) {
    const fields = site.fields;
    const siteName = fields.Name || 'unknown';
    const siteUrl = fields.URL;
    const recordId = site.id;
    const slug = fields.Slug || siteName.toLowerCase().replace(/\s+/g, '-');

    console.log(`\n🌐 処理中: ${siteName}`);
    console.log(`  URL: ${siteUrl}`);

    if (!siteUrl) {
      console.log(`  ⏭️  スキップ: URLが設定されていません`);
      failCount++;
      continue;
    }

    // スクリーンショットファイル名
    const fileName = `${slug}.png`;
    const outputPath = path.join(SCREENSHOTS_DIR, fileName);

    // スクリーンショットを撮影
    const captured = await captureScreenshot(siteUrl, outputPath);

    if (!captured) {
      failCount++;
      continue;
    }

    // Airtableに画像URLを設定
    const uploaded = await uploadToAirtable(recordId, outputPath, siteName);

    if (uploaded) {
      successCount++;
    } else {
      failCount++;
    }

    // API制限を考慮して少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n🎉 処理完了');
  console.log(`✅ 成功: ${successCount}件`);
  console.log(`❌ 失敗: ${failCount}件`);
  console.log(`\nスクリーンショット保存先: ${SCREENSHOTS_DIR}`);
  console.log('\n次のステップ:');
  console.log('1. public/screenshots/ ディレクトリをGitにコミット');
  console.log('2. Netlifyにデプロイ');
  console.log('3. サイトで画像が表示されるか確認');
}

main().catch(error => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
