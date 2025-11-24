import type { APIRoute } from 'astro';
import { generateOgImage } from '../../lib/og-image';

export const GET: APIRoute = async () => {
  // デフォルトOGP画像を生成
  const png = await generateOgImage({
    title: '競馬予想サイト口コミ',
    subtitle: 'ユーザーの生の声で信頼できるサイトを見つけよう',
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800', // 1週間キャッシュ
    },
  });
};
