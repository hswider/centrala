'use client';

import { useState, useEffect } from 'react';

export default function EcomPage() {
  const [deliveryTimes, setDeliveryTimes] = useState({
    DE: null,
    FR: null,
    IT: null,
    ES: null,
    BE: null,
    NL: null,
    SE: null,
  });
  const [editingMarket, setEditingMarket] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const marketplaces = [
    { code: 'DE', name: 'Niemcy', flag: '🇩🇪', domain: 'amazon.de', color: 'from-yellow-400 to-red-500' },
    { code: 'FR', name: 'Francja', flag: '🇫🇷', domain: 'amazon.fr', color: 'from-blue-500 to-red-500' },
    { code: 'IT', name: 'Wlochy', flag: '🇮🇹', domain: 'amazon.it', color: 'from-green-500 to-red-500' },
    { code: 'ES', name: 'Hiszpania', flag: '🇪🇸', domain: 'amazon.es', color: 'from-red-500 to-yellow-500' },
    { code: 'BE', name: 'Belgia', flag: '🇧🇪', domain: 'amazon.com.be', color: 'from-black to-yellow-400' },
    { code: 'NL', name: 'Holandia', flag: '🇳🇱', domain: 'amazon.nl', color: 'from-red-500 to-blue-500' },
    { code: 'SE', name: 'Szwecja', flag: '🇸🇪', domain: 'amazon.se', color: 'from-blue-500 to-yellow-400' },
  ];

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ecom_delivery_times');
    if (saved) {
      const data = JSON.parse(saved);
      setDeliveryTimes(data.times || {});
      setLastUpdated(data.lastUpdated);
    }
  }, []);

  const saveDeliveryTime = (marketCode) => {
    const newTimes = { ...deliveryTimes, [marketCode]: editValue || null };
    setDeliveryTimes(newTimes);
    const now = new Date().toISOString();
    setLastUpdated(now);
    localStorage.setItem('ecom_delivery_times', JSON.stringify({ times: newTimes, lastUpdated: now }));
    setEditingMarket(null);
    setEditValue('');
  };

  const startEditing = (marketCode) => {
    setEditingMarket(marketCode);
    setEditValue(deliveryTimes[marketCode] || '');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🖥️</span> ECOM
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Panel e-commerce</p>
        </div>

        {/* Amazon Delivery Time Module */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.42 14.58c-.51-.33-1.06-.51-1.67-.51-.74 0-1.4.26-1.97.78-.57.52-.86 1.16-.86 1.93 0 .5.12.94.36 1.32.24.38.55.66.93.84.38.18.8.27 1.24.27.59 0 1.14-.15 1.63-.44.49-.29.87-.7 1.14-1.21l-1.28-.74c-.17.31-.38.54-.63.7-.25.16-.54.24-.86.24-.41 0-.75-.12-1.02-.37-.27-.25-.4-.58-.4-.99 0-.43.14-.78.42-1.04.28-.26.64-.39 1.08-.39.28 0 .54.07.77.21.23.14.42.33.56.57l1.26-.76c-.27-.47-.64-.83-1.1-1.08-.46-.25-.97-.37-1.53-.37-.7 0-1.32.17-1.86.5-.54.33-.96.78-1.26 1.35-.3.57-.45 1.21-.45 1.93 0 .67.14 1.28.42 1.81.28.53.67.95 1.17 1.26.5.31 1.07.46 1.71.46.58 0 1.11-.12 1.59-.37.48-.25.87-.6 1.17-1.05l-1.24-.76zM13.03 18.17c-.33 0-.6-.11-.81-.32-.21-.21-.32-.48-.32-.81V6.96c0-.33.11-.6.32-.81.21-.21.48-.32.81-.32s.6.11.81.32c.21.21.32.48.32.81v10.08c0 .33-.11.6-.32.81-.21.21-.48.32-.81.32zM7.26 18.17c-.33 0-.6-.11-.81-.32-.21-.21-.32-.48-.32-.81V6.96c0-.33.11-.6.32-.81.21-.21.48-.32.81-.32s.6.11.81.32c.21.21.32.48.32.81v10.08c0 .33-.11.6-.32.81-.21.21-.48.32-.81.32z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Czas dostawy Amazon
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Czas dostawy dla klientow na roznych rynkach
                  {lastUpdated && (
                    <span className="ml-2 text-gray-400">
                      • Aktualizacja: {formatDate(lastUpdated)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Marketplace Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {marketplaces.map(market => (
              <div
                key={market.code}
                className="relative bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-600 transition-all hover:shadow-lg group"
              >
                {/* Flag background accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${market.color}`}></div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{market.flag}</span>
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white text-lg">{market.code}</span>
                        <div className="text-[10px] text-gray-400">{market.domain}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => startEditing(market.code)}
                      className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Edytuj"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{market.name}</div>

                  {editingMarket === market.code ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="np. 28.01"
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveDeliveryTime(market.code);
                          if (e.key === 'Escape') setEditingMarket(null);
                        }}
                      />
                      <button
                        onClick={() => saveDeliveryTime(market.code)}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div
                      className="text-lg font-semibold cursor-pointer hover:text-orange-500 transition-colors"
                      onClick={() => startEditing(market.code)}
                    >
                      {deliveryTimes[market.code] ? (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {deliveryTimes[market.code]}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-500">—</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <span className="text-orange-500 text-xl">💡</span>
              <div className="text-sm text-orange-800 dark:text-orange-200">
                <p className="font-medium mb-1">Jak uzywac:</p>
                <ul className="list-disc list-inside text-xs space-y-1 text-orange-700 dark:text-orange-300">
                  <li>Kliknij na kafelek rynku aby wprowadzic date dostawy</li>
                  <li>Wpisz date w formacie: "28.01" lub "Sro, 28 sty"</li>
                  <li>Dane sa zapisywane lokalnie w przegladarce</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
