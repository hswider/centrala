'use client';

import { useState, useEffect } from 'react';

export default function RankPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const fetchStats = async (days = 30) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/stats?days=${days}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (days) => {
    setSelectedPeriod(days);
    fetchStats(days);
  };

  useEffect(() => {
    fetchStats(30);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">📈 Ranking produktów</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">TOP 100 produktów z ostatnich {selectedPeriod} dni</p>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => handlePeriodChange(days)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedPeriod === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {days} dni
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Produktów w rankingu</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.topProducts?.length || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Łączna sprzedaż (szt.)</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.topProducts?.reduce((sum, p) => sum + p.quantity, 0)?.toLocaleString('pl-PL') || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Łączny przychód</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.topProducts?.reduce((sum, p) => sum + p.revenue, 0)?.toLocaleString('pl-PL') || 0} zł
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Śr. cena za szt.</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats?.topProducts?.length > 0
                    ? Math.round(stats.topProducts.reduce((sum, p) => sum + p.revenue, 0) / stats.topProducts.reduce((sum, p) => sum + p.quantity, 0)).toLocaleString('pl-PL')
                    : 0} zł
                </p>
              </div>
            </div>

            {/* Top 100 Products */}
            {stats?.topProducts?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 dark:text-white">TOP {stats.topProducts.length} produktów (ostatnie {selectedPeriod} dni)</h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {stats.topProducts.map((product, idx) => (
                    <div key={idx} className="px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <span className="text-sm sm:text-base w-8 shrink-0 text-center">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{idx + 1}</span>}
                      </span>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-[10px]">brak</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white line-clamp-2" title={product.name}>
                          {product.name}
                        </div>
                        {product.sku && (
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">SKU: {product.sku}</div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{product.quantity} szt.</div>
                        <div className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">{product.revenue.toLocaleString('pl-PL')} zł</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!stats?.topProducts || stats.topProducts.length === 0) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Brak danych o produktach dla wybranego okresu</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
