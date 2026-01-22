'use client';

import { useState } from 'react';

export default function DMSPage() {
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchOrders = async () => {
    if (!search.trim()) return;

    try {
      setLoading(true);
      setSearched(true);
      const res = await fetch(`/api/orders?search=${encodeURIComponent(search)}&perPage=50`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        setSelectedOrders([]);
      }
    } catch (error) {
      console.error('Blad wyszukiwania:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchOrders();
    }
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  const getStatusBadge = (order) => {
    if (order.status?.isCanceled) {
      return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">Anulowane</span>;
    }
    if (order.status?.paymentStatus === 'PAID') {
      return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Oplacone</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">Nieoplacone</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'PLN') => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              DMS - Document Management System
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Generowanie dokumentow dla zamowien
            </p>
          </div>
        </div>

        {/* Search Box */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Wyszukaj zamowienia</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Numer zamowienia, nazwa klienta, SKU..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={searchOrders}
              disabled={loading || !search.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Szukam...' : 'Szukaj'}
            </button>
          </div>
        </div>

        {/* Document Generation Panel - shown when orders selected */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Wybrano {selectedOrders.length} {selectedOrders.length === 1 ? 'zamowienie' : selectedOrders.length < 5 ? 'zamowienia' : 'zamowien'}
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400">Wybierz typ dokumentu do wygenerowania</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Faktura VAT
                </button>
                <button className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  List przewozowy
                </button>
                <button className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Etykieta wysylkowa
                </button>
                <button className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Potwierdzenie zamowienia
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {searched && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Wyniki wyszukiwania ({orders.length})
              </h3>
              {orders.length > 0 && (
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {selectedOrders.length === orders.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Wyszukiwanie zamowien...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Brak wynikow dla podanego zapytania</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => toggleOrderSelection(order.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedOrders.includes(order.id)
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            #{order.id}
                          </span>
                          {order.externalId && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({order.externalId})
                            </span>
                          )}
                          {getStatusBadge(order)}
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                            {order.channel?.platform || 'Nieznane'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            <strong>Klient:</strong> {order.customer?.name || '-'}
                          </span>
                          <span>
                            <strong>Data:</strong> {formatDate(order.dates?.orderedAt)}
                          </span>
                          <span>
                            <strong>Wartosc:</strong> {formatCurrency(order.financials?.totalGross, order.financials?.currency)}
                          </span>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <strong>Produkty:</strong>{' '}
                            {order.items.filter(i => !i.isShipping).slice(0, 3).map(i => i.name).join(', ')}
                            {order.items.filter(i => !i.isShipping).length > 3 && ` (+${order.items.filter(i => !i.isShipping).length - 3} wiecej)`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searched && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-8 text-center">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              System generowania dokumentow
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Wyszukaj zamowienia z modulu OMS, zaznacz wybrane i wygeneruj dokumenty takie jak faktury, listy przewozowe czy etykiety wysylkowe.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
