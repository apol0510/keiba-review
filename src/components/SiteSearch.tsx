import { useState, useEffect } from 'react';

interface Site {
  id: string;
  name: string;
  slug: string;
  category: string;
  average_rating: number;
  review_count: number;
  description?: string;
}

interface SiteSearchProps {
  sites: Site[];
  categoryLabels: Record<string, string>;
}

export default function SiteSearch({ sites, categoryLabels }: SiteSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [filteredSites, setFilteredSites] = useState<Site[]>(sites);

  useEffect(() => {
    let results = sites;

    // テキスト検索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(site =>
        site.name.toLowerCase().includes(query) ||
        site.description?.toLowerCase().includes(query)
      );
    }

    // カテゴリフィルター
    if (selectedCategory !== 'all') {
      results = results.filter(site => site.category === selectedCategory);
    }

    // 評価フィルター
    if (selectedRating !== 'all') {
      const rating = parseInt(selectedRating);
      results = results.filter(site => {
        const siteRating = Math.round(site.average_rating || 0);
        return siteRating >= rating;
      });
    }

    setFilteredSites(results);
  }, [searchQuery, selectedCategory, selectedRating, sites]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedRating('all');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <h2 className="text-lg font-bold text-gray-900">サイトを検索</h2>
      </div>

      {/* 検索フォーム */}
      <div className="space-y-4">
        {/* テキスト検索 */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            キーワード検索
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="サイト名を入力..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* フィルター */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* カテゴリフィルター */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">すべて</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* 評価フィルター */}
          <div>
            <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
              評価
            </label>
            <select
              id="rating"
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">すべて</option>
              <option value="4">⭐4以上</option>
              <option value="3">⭐3以上</option>
              <option value="2">⭐2以上</option>
              <option value="1">⭐1以上</option>
            </select>
          </div>
        </div>

        {/* リセットボタン */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredSites.length}件のサイトが見つかりました
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            リセット
          </button>
        </div>
      </div>

      {/* 検索結果 */}
      {filteredSites.length > 0 ? (
        <div className="mt-6 space-y-3 max-h-96 overflow-y-auto">
          {filteredSites.map((site) => (
            <a
              key={site.id}
              href={`/keiba-yosou/${site.slug}/`}
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1 truncate">
                    {site.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {categoryLabels[site.category]}
                    </span>
                    {site.average_rating > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="font-bold text-gray-900">{site.average_rating.toFixed(1)}</span>
                      </span>
                    )}
                    <span>{site.review_count}件の口コミ</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-gray-600">該当するサイトが見つかりませんでした</p>
          <button
            onClick={handleReset}
            className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            検索条件をリセット
          </button>
        </div>
      )}
    </div>
  );
}
