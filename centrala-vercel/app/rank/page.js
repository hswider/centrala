'use client';

import { useState, useEffect } from 'react';

export default function RankPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📈 Ranking produktów</h1>
          <p className="text-xs sm:text-sm text-gray-500">TOP 100 produktów z ostatnich 30 dni</p>
        </div>

        <div className="space-y-4">
          {/* Top 100 Products */}
          {stats?.topProducts?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">TOP {stats.topProducts.length} produktów</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.topProducts.map((product, idx) => (
                  <div key={idx} className="px-3 py-2 flex items-center gap-2 hover:bg-gray-50">
                    <span className="text-sm sm:text-base w-6 shrink-0 text-center">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="text-[10px] sm:text-xs text-gray-400 font-medium">{idx + 1}</span>}
                    </span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-gray-100 rounded overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">brak</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs font-medium text-gray-900 line-clamp-2" title={product.name}>
                        {product.name}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] sm:text-sm font-semibold text-gray-900">{product.quantity} szt.</div>
                      <div className="text-[10px] sm:text-xs font-medium text-green-600">{product.revenue.toLocaleString('pl-PL')} zł</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
