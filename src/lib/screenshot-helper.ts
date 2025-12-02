/**
 * スクリーンショット画像のURLを取得する
 * 優先順位:
 * 1. ローカル静的画像（/screenshots/slug.png）
 * 2. thum.io（外部API）
 * 3. フォールバック（SVGプレースホルダー）
 */
export function getScreenshotUrl(slug: string, externalUrl?: string): string {
  // ローカル画像が存在する可能性がある場合、そちらを優先
  // 本番環境ではNetlifyが自動的に最適化
  const localPath = `/screenshots/${slug}.png`;

  // ローカル画像を返す（存在しない場合はブラウザ側でフォールバック）
  return localPath;
}

/**
 * 利用可能なローカルスクリーンショット一覧
 * public/screenshots/ に配置された画像のslug
 */
export const AVAILABLE_SCREENSHOTS = [
  'funabashi-keiba',
  'jra',
  'kawasaki-keiba',
  'keiba-nar',
  'keibalab',
  'netkeiba',
  'oddspark',
  'oi-keiba',
  'rakuten-keiba',
  'spat4',
];

/**
 * ローカルスクリーンショットが存在するか確認
 */
export function hasLocalScreenshot(slug: string): boolean {
  return AVAILABLE_SCREENSHOTS.includes(slug);
}

/**
 * フォールバック画像（SVG Data URI）
 */
export function getFallbackImage(width = 600, height = 400): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23f3f4f6'/%3E%3Cpath d='M${width * 0.35} ${height * 0.4}l${width * 0.15} ${height * 0.15}-${width * 0.07} ${height * 0.07}a${width * 0.06} ${width * 0.06} 0 0 1 0-${width * 0.085} ${width * 0.06} ${width * 0.06} 0 0 1 ${width * 0.085} 0l${width * 0.15} ${height * 0.15}${width * 0.2}-${height * 0.2}a${width * 0.06} ${width * 0.06} 0 0 1 ${width * 0.085} 0 ${width * 0.06} ${width * 0.06} 0 0 1 0 ${width * 0.085}z' fill='%239ca3af'/%3E%3Ccircle cx='${width * 0.4}' cy='${height * 0.3}' r='${width * 0.05}' fill='%239ca3af'/%3E%3C/svg%3E`;
}
