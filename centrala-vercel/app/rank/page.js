'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RankPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const platformConfig = {
    'Amazon': {
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Amazon_icon.svg/250px-Amazon_icon.svg.png',
      label: 'Amazon'
    },
    'Allegro': {
      icon: 'https://a.allegroimg.com/original/12c30c/0d4b068640de9b0daf22af9d97c5',
      label: 'Allegro'
    },
    'Shopify': {
      icon: 'https://e7.pngegg.com/pngimages/193/871/png-clipart-green-shopping-bag-illustration-shopify-logo-icons-logos-emojis-tech-companies-thumbnail.png',
      label: 'Shopify'
    },
    'Kaufland': {
      icon: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Kaufland_Deutschland.png',
      label: 'Kaufland'
    },
    'Ebay': {
      icon: 'https://static.vecteezy.com/system/resources/previews/020/190/417/non_2x/ebay-logo-ebay-icon-free-free-vector.jpg',
      label: 'eBay'
    },
    'eBay': {
      icon: 'https://static.vecteezy.com/system/resources/previews/020/190/417/non_2x/ebay-logo-ebay-icon-free-free-vector.jpg',
      label: 'eBay'
    },
    'Cdiscount': {
      icon: 'https://s3-eu-west-1.amazonaws.com/tpd/logos/46e266b200006400050146b5/0x0.png',
      label: 'Cdiscount'
    },
    'ManualAccount': {
      icon: 'https://thumbs.dreamstime.com/b/ikona-zam%C3%B3wienia-zakupu-oferty-handlu-elektronicznego-czarna-grafika-wektorowa-jest-izolowany-na-bia%C5%82ym-tle-wykorzystanie-do-223270063.jpg',
      label: 'Zamowienia reczne'
    },
  };

  const getPlatformLabel = (platform) => {
    return platformConfig[platform]?.label || platform;
  };

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📈 Rankingi</h1>
          <p className="text-xs sm:text-sm text-gray-500">Ostatnie 30 dni</p>
        </div>

        <div className="space-y-4">
          {/* Top 10 Products */}
          {stats?.topProducts?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">TOP 10 produktów</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.topProducts.map((product, idx) => (
                  <div key={idx} className="px-3 py-2 flex items-center gap-2 hover:bg-gray-50">
                    <span className="text-sm sm:text-base w-5 shrink-0 text-center">
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

          {/* Top 5 Marketplaces */}
          {stats?.last30DaysByPlatform?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">TOP 5 Marketplace'ów</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.last30DaysByPlatform.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="px-3 py-2 flex items-center gap-3 hover:bg-gray-50">
                    <span className="text-sm sm:text-base w-5 shrink-0 text-center">
                      {idx === 0 ? <span>🏆</span> : idx === 1 ? <span className="grayscale brightness-110">🏆</span> : idx === 2 ? <span className="sepia brightness-75">🏆</span> : <span className="text-[10px] sm:text-xs text-gray-400 font-medium">{idx + 1}</span>}
                    </span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                      {platformConfig[item.platform]?.icon ? (
                        <img src={platformConfig[item.platform].icon} alt={item.platform} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                      ) : (
                        <span className="text-xs font-bold text-gray-500">{item.platform?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        {getPlatformLabel(item.platform)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-bold text-blue-600">{item.count}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">zamówień</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Sprzedaż dzienna (PLN)</h2>
            </div>
            <div className="p-4">
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.revenue?.last30Days || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                      width={40}
                    />
                    <Tooltip
                      formatter={(value) => [`${value.toLocaleString('pl-PL')} zł`, 'Sprzedaż']}
                      labelFormatter={(label) => label}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#3B82F6"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
