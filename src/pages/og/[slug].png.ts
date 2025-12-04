import type { APIRoute } from 'astro';
import { getSiteBySlug, getApprovedSites, getSitesWithStats, categoryLabels } from '../../lib/airtable';
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

  // ランキング順位を計算（総合ランキング）
  const allSites = await getSitesWithStats();
  const rankedSites = allSites
    .map(s => ({
      ...s,
      rankingScore: (s.average_rating || 0) * Math.log(s.review_count + 1) * 10
    }))
    .sort((a, b) => b.rankingScore - a.rankingScore);

  const overallRank = rankedSites.findIndex(s => s.slug === site.slug) + 1;

  // カテゴリ別ランキング順位を計算
  const categorySites = allSites
    .filter(s => s.category === site.category)
    .map(s => ({
      ...s,
      rankingScore: (s.average_rating || 0) * Math.log(s.review_count + 1) * 10
    }))
    .sort((a, b) => b.rankingScore - a.rankingScore);

  const categoryRank = categorySites.findIndex(s => s.slug === site.slug) + 1;

  // カテゴリ別ランキングが10位以内ならカテゴリ表示、それ以外は総合
  const useOverallRank = categoryRank > 10 && overallRank <= 30;
  const rank = useOverallRank ? overallRank : categoryRank;
  const rankLabel = useOverallRank ? '総合' : categoryLabels[site.category] || '';

  // OGP画像を生成
  const png = await generateOgImage({
    title: `${site.name}の口コミ・評判`,
    subtitle: site.description?.slice(0, 60) || undefined,
    rating: site.average_rating,
    reviewCount: site.review_count,
    category: site.category,
    rank: rank <= 30 ? rank : undefined, // 30位以内のみ表示
    rankLabel: rank <= 30 ? rankLabel : undefined,
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400', // 1日キャッシュ
    },
  });
};
