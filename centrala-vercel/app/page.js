'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState([]);
  const [forecast, setForecast] = useState([]);

  // Permission labels mapping
  const permissionLabels = {
    dashboard: { label: 'Dashboard', icon: '📊' },
    oms: { label: 'OMS (Zamówienia)', icon: '📦' },
    wms: { label: 'WMS (Magazyny)', icon: '🏭' },
    mes: { label: 'MES (Produkcja)', icon: '⚙️' },
    mts: { label: 'MTS (Make to Stock)', icon: '📋' },
    crm: { label: 'CRM PL', icon: '👥' },
    'crm-eu': { label: 'CRM EU', icon: '🇪🇺' },
    rank: { label: 'RANK', icon: '📈' },
    agent: { label: 'Asystent AI', icon: '🤖' },
    admin: { label: 'Administracja', icon: '🔐' }
  };

  const allPermissions = ['dashboard', 'oms', 'wms', 'mes', 'mts', 'crm', 'crm-eu', 'rank', 'agent'];

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const fetchWeather = async () => {
    try {
      const res = await fetch('/api/weather');
      const data = await res.json();
      if (data.success) {
        setWeather(data.weather);
        setForecast(data.forecast || []);
      }
    } catch (err) {
      console.error(err);
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
    fetchUser();
    fetchStats();
    fetchWeather();
  }, []);

  const platformConfig = {
    'Amazon': {
      icon: '/icons/amazon.png',
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
    'shop': {
      icon: '/icons/gutekissen.png',
      label: 'Gutekissen'
    },
    'OTTO': {
      icon: '/icons/otto.png',
      label: 'OTTO'
    },
    'otto': {
      icon: '/icons/otto.png',
      label: 'OTTO'
    },
    'Kaufland': {
      icon: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Kaufland_Deutschland.png',
      label: 'Kaufland'
    },
    'Ebay': {
      icon: '/icons/ebay.png',
      label: 'eBay'
    },
    'eBay': {
      icon: '/icons/ebay.png',
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Welcome Banner */}
        {user && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 rounded-lg shadow-lg p-4 sm:p-6 mb-6 text-white">
            <h1 className="text-xl sm:text-2xl font-bold mb-2">
              Witaj {user.username} w Centrali POOM
            </h1>
            <p className="text-blue-100 text-sm mb-3">
              Rola: <span className="font-medium text-white">{user.role === 'admin' ? 'Administrator' : 'Uzytkownik'}</span>
            </p>
            <div className="text-sm">
              <p className="text-blue-200 mb-2">Dostęp do zakładek:</p>
              <div className="flex flex-wrap gap-2">
                {allPermissions.map(permission => {
                  const hasAccess = user.role === 'admin' || user.permissions?.includes(permission);
                  const config = permissionLabels[permission];
                  return (
                    <span
                      key={permission}
                      className={`px-2 py-1 rounded text-xs font-medium ${hasAccess ? 'bg-green-500 text-white' : 'bg-red-500/80 text-white/80'}`}
                    >
                      {config?.icon} {config?.label || permission}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Przeglad zamowien</p>
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? <span className="animate-spin">🔄</span> : '🔄'}
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Dzisiaj</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.summary?.ordersToday || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Wczoraj</p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats?.summary?.ordersYesterday || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Wyslano dzis</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.summary?.shippedToday || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Wyslano wczoraj</p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats?.summary?.shippedYesterday || 0}</p>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">Sprzedaż ostatnie 30 dni (PLN)</h2>
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

            {/* Orders Count Chart - Last 14 Days */}
            {stats?.dailyOrders?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Ilosc zamowien (ostatnie 30 dni)</h2>
                </div>
                <div className="p-4">
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.dailyOrders}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          width={35}
                        />
                        <Tooltip
                          formatter={(value) => [`${value} zamówień`, 'Ilość']}
                          labelFormatter={(label) => label}
                          contentStyle={{ fontSize: '12px' }}
                        />
                        <Bar
                          dataKey="orders"
                          fill="#8B5CF6"
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Top 10 Products */}
            {stats?.topProducts?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-white">TOP 10 produktów (ostatnie 30 dni)</h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {stats.topProducts.slice(0, 10).map((product, idx) => (
                    <div key={idx} className="px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <span className="text-sm sm:text-base w-5 shrink-0 text-center">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium">{idx + 1}</span>}
                      </span>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-[10px]">brak</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] sm:text-xs font-medium text-gray-900 dark:text-white line-clamp-2" title={product.name}>
                          {product.name}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] sm:text-sm font-semibold text-gray-900 dark:text-white">{product.quantity} szt.</div>
                        <div className="text-[10px] sm:text-xs font-medium text-green-600 dark:text-green-400">{product.revenue.toLocaleString('pl-PL')} zł</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top 5 Marketplaces */}
            {stats?.last30DaysByPlatform?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-white">TOP 5 Marketplace'ów (ostatnie 30 dni)</h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {stats.last30DaysByPlatform.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <span className="text-sm sm:text-base w-5 shrink-0 text-center">
                        {idx === 0 ? <span>🏆</span> : idx === 1 ? <span className="grayscale brightness-110">🏆</span> : idx === 2 ? <span className="sepia brightness-75">🏆</span> : <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium">{idx + 1}</span>}
                      </span>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {platformConfig[item.platform]?.icon ? (
                          <img src={platformConfig[item.platform].icon} alt={item.platform} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                        ) : (
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{item.platform?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          {getPlatformLabel(item.platform)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">{item.count}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">zamówień</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Today by Platform */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">Zamowienia dzisiaj</h2>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {stats?.todayByPlatform?.length > 0 ? (
                  stats.todayByPlatform.map((item, idx) => (
                    <div key={idx} className="px-4 py-2.5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {renderPlatformIcon(item.platform)}
                        <span className="text-sm text-gray-700 dark:text-gray-300">{getPlatformLabel(item.platform)}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Brak zamowien dzisiaj</div>
                )}
              </div>
              {stats?.todayByPlatform?.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Razem</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{stats?.summary?.ordersToday || 0}</span>
                </div>
              )}
            </div>

            {/* Orders Last 30 Days - Chart + List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">Zamowienia z 30 dni</h2>
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
                <div className="border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-700">
                  <div className="divide-y divide-gray-50 dark:divide-gray-700">
                    {stats?.last30DaysByPlatform?.map((item, idx) => (
                      <div key={idx} className="px-4 py-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300">{getPlatformLabel(item.platform)}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Razem (30 dni)</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats?.last30DaysByPlatform?.reduce((sum, item) => sum + item.count, 0) || 0}
                </span>
              </div>
            </div>

            {/* Weather Module */}
            {weather.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-white">🌡️ Pogoda w Europie dzisiaj</h2>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 p-2">
                  {weather.map((w) => (
                    <div key={w.country_code} className="flex flex-col items-center p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                      <img
                        src={`/flags/${w.country_code}.png`}
                        alt={w.country_code}
                        className="w-6 h-4 sm:w-8 sm:h-5 object-cover rounded-sm shadow-sm"
                      />
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">{w.city}</span>
                      <span className={`text-sm sm:text-base font-bold ${parseFloat(w.temperature) < 0 ? 'text-blue-600 dark:text-blue-400' : parseFloat(w.temperature) > 25 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {Math.round(parseFloat(w.temperature))}°C
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weather Forecast */}
            {forecast.length > 0 && (() => {
              // Transform forecast data for chart
              const dates = [...new Set(forecast.map(f => f.forecast_date))].slice(0, 14);
              const chartData = dates.map(date => {
                const d = new Date(date);
                const row = { date: d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }) };
                forecast.filter(f => f.forecast_date === date).forEach(f => {
                  row[f.country_code] = Math.round((parseFloat(f.temp_max) + parseFloat(f.temp_min)) / 2);
                });
                return row;
              });

              const countryColors = {
                PL: '#DC2626', // red
                DE: '#000000', // black
                FR: '#2563EB', // blue
                IT: '#16A34A', // green
                ES: '#F59E0B', // amber
                BE: '#FBBF24', // yellow
                NL: '#F97316', // orange
                SE: '#0EA5E9', // sky
              };

              return (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-900 dark:text-white">📅 Prognoza pogody 14 dni</h2>
                  </div>
                  <div className="p-2 sm:p-4">
                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mb-3 justify-center">
                      {weather.map((w) => (
                        <div key={w.country_code} className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: countryColors[w.country_code] }}></div>
                          <span className="text-[9px] sm:text-xs text-gray-600 dark:text-gray-400">{w.city}</span>
                        </div>
                      ))}
                    </div>
                    {/* Chart */}
                    <div className="h-48 sm:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" height={40} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}°`} width={35} />
                          <Tooltip formatter={(value, name) => [`${value}°C`, weather.find(w => w.country_code === name)?.city || name]} contentStyle={{ fontSize: '11px' }} />
                          {weather.map((w) => (
                            <Bar key={w.country_code} dataKey={w.country_code} fill={countryColors[w.country_code]} radius={[2, 2, 0, 0]} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              );
            })()}

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
