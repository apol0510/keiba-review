import { useState, useMemo } from 'react';

interface Site {
  id: string;
  name: string;
  slug: string;
  category: string;
  siteQuality: 'excellent' | 'normal' | 'malicious';
  displayPriority: number;
  url: string;
}

interface Props {
  sites: Site[];
}

type QualityFilter = 'all' | 'excellent' | 'normal' | 'malicious';

export default function SiteQualityManager({ sites }: Props) {
  const [filter, setFilter] = useState<QualityFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'priority'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editedSites, setEditedSites] = useState<Map<string, Partial<Site>>>(new Map());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // フィルター・ソート・検索を適用
  const filteredSites = useMemo(() => {
    let result = sites;

    // 品質フィルター
    if (filter !== 'all') {
      result = result.filter(site => site.siteQuality === filter);
    }

    // 検索フィルター
    if (searchTerm) {
      result = result.filter(site =>
        site.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ソート
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name, 'ja')
          : b.name.localeCompare(a.name, 'ja');
      } else {
        const aValue = editedSites.get(a.id)?.displayPriority ?? a.displayPriority;
        const bValue = editedSites.get(b.id)?.displayPriority ?? b.displayPriority;
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return result;
  }, [sites, filter, searchTerm, sortBy, sortOrder, editedSites]);

  // サイト品質を変更
  const handleQualityChange = (siteId: string, quality: 'excellent' | 'normal' | 'malicious') => {
    setEditedSites(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(siteId) || {};

      // 品質に応じたデフォルト優先度を設定
      let defaultPriority = existing.displayPriority;
      if (!defaultPriority) {
        const site = sites.find(s => s.id === siteId);
        if (quality === 'excellent' && site?.siteQuality !== 'excellent') {
          defaultPriority = 150;
        } else if (quality === 'malicious' && site?.siteQuality !== 'malicious') {
          defaultPriority = 5;
        } else if (quality === 'normal' && site?.siteQuality !== 'normal') {
          defaultPriority = 50;
        } else {
          defaultPriority = site?.displayPriority;
        }
      }

      newMap.set(siteId, {
        ...existing,
        siteQuality: quality,
        displayPriority: defaultPriority,
      });
      return newMap;
    });
  };

  // 優先度を変更
  const handlePriorityChange = (siteId: string, priority: number) => {
    setEditedSites(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(siteId) || {};
      newMap.set(siteId, {
        ...existing,
        displayPriority: priority,
      });
      return newMap;
    });
  };

  // 変更を保存
  const handleSave = async () => {
    if (editedSites.size === 0) {
      setMessage({ type: 'error', text: '変更がありません' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const updates = Array.from(editedSites.entries()).map(([id, changes]) => {
        const site = sites.find(s => s.id === id);
        return {
          id,
          siteQuality: changes.siteQuality ?? site?.siteQuality,
          displayPriority: changes.displayPriority ?? site?.displayPriority,
        };
      });

      const response = await fetch('/api/admin/update-site-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '保存に失敗しました');
      }

      setMessage({ type: 'success', text: `${editedSites.size}件のサイトを更新しました` });
      setEditedSites(new Map());

      // ページをリロードして最新データを取得
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '保存中にエラーが発生しました',
      });
    } finally {
      setSaving(false);
    }
  };

  // 変更をリセット
  const handleReset = () => {
    setEditedSites(new Map());
    setMessage(null);
  };

  // 品質バッジの色
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'malicious':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // 品質ラベル
  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return '優良';
      case 'malicious':
        return '悪質';
      default:
        return '通常';
    }
  };

  return (
    <div className="space-y-6">
      {/* フィルター・検索バー */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 品質フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              品質フィルター
            </label>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as QualityFilter)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">すべて</option>
              <option value="excellent">優良サイト</option>
              <option value="normal">通常サイト</option>
              <option value="malicious">悪質サイト</option>
            </select>
          </div>

          {/* 検索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              サイト名検索
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="サイト名で検索..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* ソート項目 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ソート項目
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'name' | 'priority')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="priority">優先度</option>
              <option value="name">サイト名</option>
            </select>
          </div>

          {/* ソート順 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ソート順
            </label>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">降順（高→低）</option>
              <option value="asc">昇順（低→高）</option>
            </select>
          </div>
        </div>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 変更があれば保存ボタンを表示 */}
      {editedSites.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="text-blue-800">
            <strong>{editedSites.size}件</strong>のサイトに変更があります
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              リセット
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  保存中...
                </>
              ) : (
                '変更を保存'
              )}
            </button>
          </div>
        </div>
      )}

      {/* サイト一覧テーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  サイト名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  カテゴリ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  品質
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  表示優先度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  リンク
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSites.map(site => {
                const edited = editedSites.get(site.id);
                const currentQuality = edited?.siteQuality ?? site.siteQuality;
                const currentPriority = edited?.displayPriority ?? site.displayPriority;
                const hasChanges = editedSites.has(site.id);

                return (
                  <tr
                    key={site.id}
                    className={hasChanges ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {site.name}
                      </div>
                      <div className="text-xs text-gray-500">{site.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {site.category === 'nankan' && 'NANKAN'}
                        {site.category === 'chuo' && '中央競馬'}
                        {site.category === 'chihou' && '地方競馬'}
                        {site.category === 'other' && 'その他'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={currentQuality}
                        onChange={e =>
                          handleQualityChange(
                            site.id,
                            e.target.value as 'excellent' | 'normal' | 'malicious'
                          )
                        }
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getQualityColor(
                          currentQuality
                        )}`}
                      >
                        <option value="excellent">優良</option>
                        <option value="normal">通常</option>
                        <option value="malicious">悪質</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={currentPriority}
                        onChange={e =>
                          handlePriorityChange(site.id, parseInt(e.target.value) || 0)
                        }
                        min="0"
                        max="999"
                        className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a
                        href={`/keiba-yosou/${site.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        詳細ページ
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 検索結果がない場合 */}
        {filteredSites.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">該当するサイトが見つかりませんでした</p>
          </div>
        )}
      </div>

      {/* 表示件数 */}
      <div className="text-sm text-gray-600 text-center">
        {filteredSites.length}件のサイトを表示中（全{sites.length}件）
      </div>
    </div>
  );
}
