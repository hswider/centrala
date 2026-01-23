'use client';

import { useState, useEffect } from 'react';

export default function MTSPage() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(14);
  const [planningDays, setPlanningDays] = useState(7);
  const [safetyFactor, setSafetyFactor] = useState(1.2);
  const [filterPriority, setFilterPriority] = useState('all');

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mts/analysis?days=${selectedPeriod}&planningDays=${planningDays}&safetyFactor=${safetyFactor}`);
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Blad pobierania analizy:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [selectedPeriod, planningDays, safetyFactor]);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-800 rounded">KRYTYCZNY</span>;
      case 'warning':
        return <span className="px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-800 rounded">OSTRZEZENIE</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">OK</span>;
    }
  };

  const getDeficitColor = (deficit) => {
    if (deficit < -20) return 'text-red-600 font-bold';
    if (deficit < 0) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
  };

  const filteredProducts = analysis?.products?.filter(p => {
    if (filterPriority === 'all') return true;
    return p.priority === filterPriority;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              MTS - Make to Stock
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Planowanie produkcji na podstawie trendow sprzedazy
            </p>
          </div>
          <button
            onClick={fetchAnalysis}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Ladowanie...' : 'Odswiez analize'}
          </button>
        </div>

        {/* Parametry */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Parametry analizy</h2>
          <div className="flex flex-wrap items-center gap-4">
            {/* Okres analizy */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Okres:</span>
              <div className="flex gap-1">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setSelectedPeriod(days)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      selectedPeriod === days
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            {/* Horyzont planowania */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Horyzont:</span>
              <select
                value={planningDays}
                onChange={(e) => setPlanningDays(parseInt(e.target.value))}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={7}>7 dni</option>
                <option value={14}>14 dni</option>
                <option value={21}>21 dni</option>
                <option value={30}>30 dni</option>
              </select>
            </div>

            {/* Wspolczynnik bezpieczenstwa */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Zapas:</span>
              <select
                value={safetyFactor}
                onChange={(e) => setSafetyFactor(parseFloat(e.target.value))}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={1.0}>0%</option>
                <option value={1.1}>10%</option>
                <option value={1.2}>20%</option>
                <option value={1.3}>30%</option>
                <option value={1.5}>50%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Podsumowanie */}
        {analysis && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Produktow</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{analysis.summary.totalProducts}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-3 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => setFilterPriority(filterPriority === 'critical' ? 'all' : 'critical')}>
              <p className="text-xs text-red-600 dark:text-red-400">Krytyczne</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">{analysis.summary.criticalCount}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-3 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30" onClick={() => setFilterPriority(filterPriority === 'warning' ? 'all' : 'warning')}>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Ostrzezenia</p>
              <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{analysis.summary.warningCount}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-3 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30" onClick={() => setFilterPriority(filterPriority === 'ok' ? 'all' : 'ok')}>
              <p className="text-xs text-green-600 dark:text-green-400">OK</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{analysis.summary.okCount}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow p-3">
              <p className="text-xs text-blue-600 dark:text-blue-400">Do produkcji</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{analysis.summary.totalToProduce} szt.</p>
            </div>
          </div>
        )}

        {/* Filtr aktywny */}
        {filterPriority !== 'all' && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Filtr:</span>
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              filterPriority === 'critical' ? 'bg-red-100 text-red-800' :
              filterPriority === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {filterPriority === 'critical' ? 'Krytyczne' : filterPriority === 'warning' ? 'Ostrzezenia' : 'OK'}
            </span>
            <button
              onClick={() => setFilterPriority('all')}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Wyczysc
            </button>
          </div>
        )}

        {/* Tabela analizy */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Analiza zapotrzebowania
              {filterPriority !== 'all' && ` (${filteredProducts.length})`}
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Dane z ostatnich {selectedPeriod} dni, horyzont {planningDays} dni
            </span>
          </div>

          {loading ? (
            <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              Ladowanie analizy...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Produkt</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stan</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sprzedaz</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sr/dzien</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Potrzeba/{planningDays}d</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Deficyt</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Do produkcji</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Brak produktow do wyswietlenia
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product, idx) => (
                      <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        product.priority === 'critical' ? 'bg-red-50/50 dark:bg-red-900/10' :
                        product.priority === 'warning' ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                      }`}>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900 dark:text-white line-clamp-1" title={product.nazwa}>
                            {product.nazwa}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {product.sku}
                            {!product.inInventory && (
                              <span className="ml-1 text-orange-500" title="Brak w magazynie gotowych produktow">⚠️</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-medium ${product.currentStock === 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                            {product.currentStock}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                          {product.totalSold}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                          {product.avgDaily.toFixed(1)}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                          {product.weeklyDemand}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={getDeficitColor(product.deficit)}>
                            {product.deficit > 0 ? '+' : ''}{product.deficit}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {product.toProduce > 0 ? (
                            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded">
                              {product.toProduce} szt.
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {getPriorityBadge(product.priority)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        {analysis?.summary?.notInInventory > 0 && (
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <span className="font-medium">Uwaga:</span> {analysis.summary.notInInventory} produktow ze sprzedazy nie ma w magazynie gotowych produktow (oznaczone ⚠️).
              Rozważ dodanie ich do inventory.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
