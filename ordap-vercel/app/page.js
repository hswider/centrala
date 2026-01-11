'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

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

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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

  const renderPlatformIcon = (platform) => {
    const config = platformConfig[platform];
    if (config?.icon) {
      return (
        <img
          src={config.icon}
          alt={platform}
          className="w-6 h-6 rounded object-contain"
        />
      );
    }
    return (
      <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600">
        {platform?.charAt(0) || '?'}
      </div>
    );
  };

  // Colors for pie chart
  const CHART_COLORS = [
    '#FF9900', // Amazon orange
    '#FF5A00', // Allegro orange
    '#96BF48', // Shopify green
    '#E31E24', // Kaufland red
    '#0064D2', // eBay blue
    '#00C2A8', // Cdiscount teal
    '#6B7280', // Gray for others
    '#8B5CF6', // Purple
    '#EC4899', // Pink
  ];

  const getChartData = () => {
    if (!stats?.last30DaysByPlatform) return [];
    return stats.last30DaysByPlatform.map((item, idx) => ({
      name: getPlatformLabel(item.platform),
      value: item.count,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-3xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500">Przeglad zamowien</p>
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? 'Sync...' : 'Sync'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">Dzisiaj</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.summary?.ordersToday || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">Wczoraj</p>
                <p className="text-2xl font-bold text-gray-700">{stats?.summary?.ordersYesterday || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">Wyslano dzis</p>
                <p className="text-2xl font-bold text-green-600">{stats?.summary?.shippedToday || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">Wyslano wczoraj</p>
                <p className="text-2xl font-bold text-gray-700">{stats?.summary?.shippedYesterday || 0}</p>
              </div>
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-4 text-white">
                <p className="text-xs text-green-100">Obrót dzisiaj</p>
                <p className="text-2xl font-bold">{stats?.revenue?.todayPln?.toLocaleString('pl-PL') || 0} zł</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-4 text-white">
                <p className="text-xs text-blue-100">Obrót 30 dni</p>
                <p className="text-2xl font-bold">{stats?.revenue?.last30DaysPln?.toLocaleString('pl-PL') || 0} zł</p>
              </div>
            </div>

            {/* Revenue Chart - Last 30 Days */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Sprzedaż ostatnie 30 dni (PLN)</h2>
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

            {/* Orders Today by Platform */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Zamowienia dzisiaj</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {stats?.todayByPlatform?.length > 0 ? (
                  stats.todayByPlatform.map((item, idx) => (
                    <div key={idx} className="px-4 py-2.5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {renderPlatformIcon(item.platform)}
                        <span className="text-sm text-gray-700">{getPlatformLabel(item.platform)}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">Brak zamowien dzisiaj</div>
                )}
              </div>
              {stats?.todayByPlatform?.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">Razem</span>
                  <span className="font-bold text-blue-600">{stats?.summary?.ordersToday || 0}</span>
                </div>
              )}
            </div>

            {/* Orders Last 30 Days - Chart + List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Zamowienia z 30 dni</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2">
                {/* Pie Chart */}
                <div className="p-4 flex items-center justify-center">
                  <div className="w-full h-48 sm:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {getChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [value, name]}
                          contentStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* List */}
                <div className="border-t sm:border-t-0 sm:border-l border-gray-100">
                  <div className="divide-y divide-gray-50">
                    {stats?.last30DaysByPlatform?.map((item, idx) => (
                      <div key={idx} className="px-4 py-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                          <span className="text-xs text-gray-700">{getPlatformLabel(item.platform)}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                <span className="text-sm font-medium text-gray-700">Razem (30 dni)</span>
                <span className="font-bold text-gray-900">
                  {stats?.last30DaysByPlatform?.reduce((sum, item) => sum + item.count, 0) || 0}
                </span>
              </div>
            </div>

            {/* Quick Link */}
            <Link
              href="/zamowienia"
              className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 font-medium"
            >
              Zobacz wszystkie zamowienia ({stats?.summary?.totalOrders || 0})
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
