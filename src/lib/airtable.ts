import Airtable from 'airtable';

// Airtable設定
const apiKey = import.meta.env.AIRTABLE_API_KEY || '';
const baseId = import.meta.env.AIRTABLE_BASE_ID || '';

// デモモード判定
const isDemoMode = !apiKey || !baseId;

// Airtableクライアント初期化
let base: Airtable.Base | null = null;
if (!isDemoMode) {
  Airtable.configure({ apiKey });
  base = Airtable.base(baseId);
}

// 型定義
export interface Site {
  id: string;
  name: string;
  url: string;
  slug: string;
  category: 'nankan' | 'chuo' | 'chihou' | 'other';
  description: string | null;
  features: string[];
  price_info: string | null;
  screenshot_url: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteWithStats extends Site {
  review_count: number;
  average_rating: number;
  last_review_at: string | null;
}

export interface Review {
  id: string;
  site_id: string;
  user_name: string;
  user_email: string;
  rating: number;
  title: string;
  content: string;
  is_approved: boolean;
  is_spam: boolean;
  created_at: string;
  approved_at: string | null;
}

export interface ReviewWithSite extends Review {
  site_name: string;
  site_slug: string;
}

// カテゴリ表示名
export const categoryLabels: Record<string, string> = {
  nankan: 'NANKAN（南関）',
  chuo: '中央競馬',
  chihou: '地方競馬',
  other: 'その他',
};

// デモ用サンプルデータ
const demoSites: SiteWithStats[] = [
  {
    id: '1',
    name: '競馬予想サイトA',
    url: 'https://example.com/site-a',
    slug: 'site-a',
    category: 'nankan',
    description: '南関競馬専門の予想サイト。大井・川崎を中心に高い的中率を誇ります。',
    features: ['無料予想あり', '南関特化', 'LINE配信'],
    price_info: '月額3,000円〜',
    screenshot_url: null,
    is_approved: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    review_count: 15,
    average_rating: 4.2,
    last_review_at: '2024-11-20T00:00:00Z',
  },
  {
    id: '2',
    name: '中央競馬情報局',
    url: 'https://example.com/site-b',
    slug: 'site-b',
    category: 'chuo',
    description: 'JRA中央競馬の重賞レースに特化した予想サイト。',
    features: ['重賞特化', '買い目公開', '実績公開'],
    price_info: '情報料 1レース500円〜',
    screenshot_url: null,
    is_approved: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
    review_count: 23,
    average_rating: 3.8,
    last_review_at: '2024-11-18T00:00:00Z',
  },
  {
    id: '3',
    name: '地方競馬マスター',
    url: 'https://example.com/site-c',
    slug: 'site-c',
    category: 'chihou',
    description: '全国の地方競馬をカバーする総合予想サイト。',
    features: ['全地方対応', 'AI予想', 'メルマガ配信'],
    price_info: '月額5,000円',
    screenshot_url: null,
    is_approved: true,
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
    review_count: 8,
    average_rating: 4.5,
    last_review_at: '2024-11-15T00:00:00Z',
  },
];

const demoReviews: Review[] = [
  {
    id: '1',
    site_id: '1',
    user_name: '競馬ファン太郎',
    user_email: 'demo@example.com',
    rating: 5,
    title: '的中率が高い！',
    content: '南関競馬に特化しているだけあって、情報の精度が高いです。先月は3回中2回的中しました。',
    is_approved: true,
    is_spam: false,
    created_at: '2024-11-20T10:00:00Z',
    approved_at: '2024-11-20T12:00:00Z',
  },
  {
    id: '2',
    site_id: '1',
    user_name: '馬券師',
    user_email: 'demo2@example.com',
    rating: 4,
    title: 'コスパ良し',
    content: '月額3000円でこの情報量は満足。ただ、たまに外れることもあるので過信は禁物。',
    is_approved: true,
    is_spam: false,
    created_at: '2024-11-15T08:00:00Z',
    approved_at: '2024-11-15T10:00:00Z',
  },
  {
    id: '3',
    site_id: '1',
    user_name: '初心者',
    user_email: 'demo3@example.com',
    rating: 4,
    title: '初心者にもわかりやすい',
    content: '解説が丁寧で、なぜその馬を推奨するのか理由がしっかり書かれています。',
    is_approved: true,
    is_spam: false,
    created_at: '2024-11-10T14:00:00Z',
    approved_at: '2024-11-10T16:00:00Z',
  },
];

// Airtableレコードをサイトオブジェクトに変換
function recordToSite(record: Airtable.Record<any>): SiteWithStats {
  const fields = record.fields;
  return {
    id: record.id,
    name: fields.Name || '',
    url: fields.URL || '',
    slug: fields.Slug || '',
    category: fields.Category || 'other',
    description: fields.Description || null,
    features: fields.Features ? fields.Features.split(',').map((f: string) => f.trim()) : [],
    price_info: fields.PriceInfo || null,
    screenshot_url: fields.Screenshot?.[0]?.url || null,
    is_approved: fields.IsApproved || false,
    created_at: record._rawJson.createdTime,
    updated_at: record._rawJson.createdTime,
    review_count: fields.ReviewCount || 0,
    average_rating: fields.AverageRating || 0,
    last_review_at: fields.LastReviewAt || null,
  };
}

// Airtableレコードを口コミオブジェクトに変換
function recordToReview(record: Airtable.Record<any>): Review {
  const fields = record.fields;
  return {
    id: record.id,
    site_id: fields.SiteId?.[0] || '',
    user_name: fields.UserName || '',
    user_email: fields.UserEmail || '',
    rating: fields.Rating || 0,
    title: fields.Title || '',
    content: fields.Content || '',
    is_approved: fields.IsApproved || false,
    is_spam: fields.IsSpam || false,
    created_at: record._rawJson.createdTime,
    approved_at: fields.ApprovedAt || null,
  };
}

// API関数
export async function getSitesWithStats(category?: string): Promise<SiteWithStats[]> {
  if (isDemoMode) {
    if (category) {
      return demoSites.filter(s => s.category === category);
    }
    return demoSites;
  }

  try {
    const filterFormula = category
      ? `AND({IsApproved} = TRUE(), {Category} = '${category}')`
      : `{IsApproved} = TRUE()`;

    const records = await base!('Sites')
      .select({
        filterByFormula: filterFormula,
        sort: [{ field: 'ReviewCount', direction: 'desc' }],
      })
      .all();

    return records.map(recordToSite);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return [];
  }
}

export async function getSiteBySlug(slug: string): Promise<SiteWithStats | null> {
  if (isDemoMode) {
    return demoSites.find(s => s.slug === slug) || null;
  }

  try {
    const records = await base!('Sites')
      .select({
        filterByFormula: `AND({IsApproved} = TRUE(), {Slug} = '${slug}')`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) return null;
    return recordToSite(records[0]);
  } catch (error) {
    console.error('Error fetching site:', error);
    return null;
  }
}

export async function getReviewsBySiteId(siteId: string): Promise<Review[]> {
  if (isDemoMode) {
    return demoReviews.filter(r => r.site_id === siteId);
  }

  try {
    const records = await base!('Reviews')
      .select({
        filterByFormula: `AND({SiteId} = '${siteId}', {IsApproved} = TRUE(), {IsSpam} = FALSE())`,
        sort: [{ field: 'CreatedAt', direction: 'desc' }],
      })
      .all();

    return records.map(recordToReview);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function getLatestReviews(limit: number = 10): Promise<ReviewWithSite[]> {
  if (isDemoMode) {
    return demoReviews.slice(0, limit).map(r => {
      const site = demoSites.find(s => s.id === r.site_id);
      return {
        ...r,
        site_name: site?.name || '',
        site_slug: site?.slug || '',
      };
    });
  }

  try {
    const records = await base!('Reviews')
      .select({
        filterByFormula: `AND({IsApproved} = TRUE(), {IsSpam} = FALSE())`,
        sort: [{ field: 'CreatedAt', direction: 'desc' }],
        maxRecords: limit,
      })
      .all();

    // サイト情報を取得して結合
    const reviews = records.map(recordToReview);
    const siteIds = [...new Set(reviews.map(r => r.site_id))];

    const sitesMap = new Map<string, SiteWithStats>();
    for (const siteId of siteIds) {
      try {
        const siteRecord = await base!('Sites').find(siteId);
        sitesMap.set(siteId, recordToSite(siteRecord));
      } catch {
        // サイトが見つからない場合はスキップ
      }
    }

    return reviews.map(r => {
      const site = sitesMap.get(r.site_id);
      return {
        ...r,
        site_name: site?.name || '',
        site_slug: site?.slug || '',
      };
    });
  } catch (error) {
    console.error('Error fetching latest reviews:', error);
    return [];
  }
}

export async function submitReview(review: {
  site_id: string;
  user_name: string;
  user_email: string;
  rating: number;
  title: string;
  content: string;
  ip_address?: string;
  user_agent?: string;
}): Promise<Review> {
  if (isDemoMode) {
    // デモモードでは成功を返す
    return {
      id: 'demo-' + Date.now(),
      site_id: review.site_id,
      user_name: review.user_name,
      user_email: review.user_email,
      rating: review.rating,
      title: review.title,
      content: review.content,
      is_approved: false,
      is_spam: false,
      created_at: new Date().toISOString(),
      approved_at: null,
    };
  }

  try {
    const record = await base!('Reviews').create({
      SiteId: [review.site_id],
      UserName: review.user_name,
      UserEmail: review.user_email,
      Rating: review.rating,
      Title: review.title,
      Content: review.content,
      IPAddress: review.ip_address || '',
      UserAgent: review.user_agent || '',
      IsApproved: false,
      IsSpam: false,
    });

    return recordToReview(record);
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
}

// エクスポート（互換性のため）
export { isDemoMode };
