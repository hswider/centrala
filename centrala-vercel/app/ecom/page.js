'use client';

import { useState, useEffect } from 'react';

export default function EcomPage() {
  const [deliveryTimes, setDeliveryTimes] = useState({});
  const [loading, setLoading] = useState(false);
  const [testAsin, setTestAsin] = useState('B07DCTY8DQ');
  const [testResult, setTestResult] = useState(null);

  const marketplaces = [
    { code: 'DE', name: 'Niemcy', flag: '🇩🇪', domain: 'amazon.de' },
    { code: 'FR', name: 'Francja', flag: '🇫🇷', domain: 'amazon.fr' },
    { code: 'IT', name: 'Włochy', flag: '🇮🇹', domain: 'amazon.it' },
    { code: 'ES', name: 'Hiszpania', flag: '🇪🇸', domain: 'amazon.es' },
    { code: 'BE', name: 'Belgia', flag: '🇧🇪', domain: 'amazon.com.be' },
    { code: 'NL', name: 'Holandia', flag: '🇳🇱', domain: 'amazon.nl' },
    { code: 'SE', name: 'Szwecja', flag: '🇸🇪', domain: 'amazon.se' },
  ];

  const testDeliveryTime = async () => {
    if (!testAsin) return;
    setLoading(true);
    setTestResult(null);

    try {
      const res = await fetch(`/api/ecom/delivery-time?asin=${testAsin}&marketplace=DE`);
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setLoading(false);
    }
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Czas dostawy Amazon
                <span className="text-orange-500">🛒</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sprawdz czas dostawy dla klientow na roznych rynkach</p>
            </div>
          </div>

          {/* Marketplace Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            {marketplaces.map(market => (
              <div
                key={market.code}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-600 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{market.flag}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{market.code}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{market.name}</div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {deliveryTimes[market.code] ? (
                    <span className="text-green-600 dark:text-green-400">{deliveryTimes[market.code]}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Test Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Test pobierania czasu dostawy</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ASIN produktu</label>
                <input
                  type="text"
                  value={testAsin}
                  onChange={(e) => setTestAsin(e.target.value)}
                  placeholder="np. B07DCTY8DQ"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={testDeliveryTime}
                  disabled={loading || !testAsin}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Pobieranie...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      Sprawdz (DE)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Wynik:</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-48">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
