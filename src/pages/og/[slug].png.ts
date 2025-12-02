import type { APIRoute } from 'astro';
import { getSiteBySlug, getApprovedSites, categoryLabels } from '../../lib/airtable';
import { generateOgImage } from '../../lib/og-image';

// 静的パス生成（ビルド時に全OGP画像を事前生成）
export async function getStaticPaths() {
  const sites = await getApprovedSites();

  return sites.map(site => ({
    params: { slug: site.slug }
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;

  // サイト情報を取得
  const site = await getSiteBySlug(slug as string);

  if (!site) {
    return new Response('Not Found', { status: 404 });
  }

  // OGP画像を生成
  const png = await generateOgImage({
    title: `${site.name}の口コミ・評判`,
    subtitle: site.description?.slice(0, 60) || undefined,
    rating: site.average_rating,
    reviewCount: site.review_count,
    category: site.category,
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400', // 1日キャッシュ
    },
  });
};
