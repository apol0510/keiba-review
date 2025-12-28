#!/usr/bin/env node

/**
 * ビルド前環境変数チェックスクリプト
 *
 * ビルドに必要な環境変数が設定されているか検証します。
 * 設定されていない場合は、わかりやすいエラーメッセージを表示して終了します。
 */

const requiredEnvVars = [
  {
    name: 'AIRTABLE_API_KEY',
    description: 'Airtable Personal Access Token',
    example: 'patXXXXXXXXXXXXXXXX'
  },
  {
    name: 'AIRTABLE_BASE_ID',
    description: 'Airtable Base ID',
    example: 'appXXXXXXXXXXXXXX'
  }
];

const optionalEnvVars = [
  {
    name: 'SITE_URL',
    description: 'サイトURL（canonical URL生成用）',
    example: 'https://keiba-review.jp'
  },
  {
    name: 'PUBLIC_GA_ID',
    description: 'Google Analytics 4 測定ID',
    example: 'G-XXXXXXXXXX'
  }
];

console.log('🔍 ビルド環境変数チェック開始...\n');

let hasError = false;
const missingVars = [];
const missingOptionalVars = [];

// 必須環境変数のチェック
requiredEnvVars.forEach(({ name, description, example }) => {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    hasError = true;
    missingVars.push({ name, description, example });
    console.log(`❌ ${name} が設定されていません`);
  } else {
    console.log(`✅ ${name} 設定済み`);
  }
});

// オプション環境変数のチェック
console.log('\n📝 オプション環境変数:');
optionalEnvVars.forEach(({ name, description, example }) => {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    missingOptionalVars.push({ name, description, example });
    console.log(`⚠️  ${name} が設定されていません（任意）`);
  } else {
    console.log(`✅ ${name} 設定済み`);
  }
});

// エラーがある場合は詳細を表示して終了
if (hasError) {
  console.log('\n❌ エラー: 必須環境変数が設定されていません\n');
  console.log('以下の環境変数を設定してください:\n');

  missingVars.forEach(({ name, description, example }) => {
    console.log(`  ${name}`);
    console.log(`    説明: ${description}`);
    console.log(`    例: ${example}\n`);
  });

  console.log('設定方法:');
  console.log('  1. ローカル開発の場合: .env ファイルに追加');
  console.log('  2. Netlifyの場合: netlify env:set <変数名> "<値>"');
  console.log('  3. GitHub Actionsの場合: ワークフローファイルの env セクションに追加\n');

  console.log('詳細はCLAUDE.mdの「環境変数」セクションを参照してください。\n');

  process.exit(1);
}

// オプション環境変数の警告
if (missingOptionalVars.length > 0) {
  console.log('\n⚠️  推奨: 以下のオプション環境変数を設定することを推奨します:\n');
  missingOptionalVars.forEach(({ name, description, example }) => {
    console.log(`  ${name}: ${description}`);
    console.log(`    例: ${example}\n`);
  });
}

console.log('✅ 環境変数チェック完了！ビルドを続行します...\n');
process.exit(0);
