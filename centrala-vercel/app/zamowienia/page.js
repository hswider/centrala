'use client';

import { useState, useEffect, useCallback } from 'react';
import OrderList from '@/components/OrderList';
import Pagination from '@/components/Pagination';
import SearchBox from '@/components/SearchBox';

const statusMap = {
  // Podstawowe
  4: { label: 'Niepotwierdzone', color: 'bg-gray-100 text-gray-800' },
  1: { label: 'Nowy', color: 'bg-blue-100 text-blue-800' },
  7: { label: 'W realizacji', color: 'bg-yellow-100 text-yellow-800' },
  10: { label: 'Do wysłania', color: 'bg-purple-100 text-purple-800' },
  13: { label: 'Wysłane', color: 'bg-green-100 text-green-800' },
  19: { label: 'Anulowane', color: 'bg-gray-200 text-gray-800' },
  16: { label: 'Zduplikowane', color: 'bg-gray-200 text-gray-800' },
  // PALETY
  22: { label: 'PALETY-NOWE', color: 'bg-blue-100 text-blue-800' },
  113: { label: 'PALETY-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
  166: { label: 'PILNE - PALETY', color: 'bg-orange-100 text-orange-800' },
  169: { label: 'BARDZO PILNE - PALETY', color: 'bg-red-100 text-red-800' },
  // PIKÓWKI
  25: { label: 'PIKÓWKI-NOWE', color: 'bg-blue-100 text-blue-800' },
  116: { label: 'PIKÓWKI-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
  103: { label: 'PILNE - PIKÓWKI', color: 'bg-orange-100 text-orange-800' },
  106: { label: 'BARDZO PILNE - PIKÓWKI', color: 'bg-red-100 text-red-800' },
  // ŁAWKI
  28: { label: 'ŁAWKI-NOWE', color: 'bg-blue-100 text-blue-800' },
  119: { label: 'ŁAWKI-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
  172: { label: 'PILNE - ŁAWKI', color: 'bg-orange-100 text-orange-800' },
  175: { label: 'BARDZO PILNE - ŁAWKI', color: 'bg-red-100 text-red-800' },
  // ŁAWKI SIEDZISKA
  199: { label: 'ŁAWKI SIEDZISKA-NOWE', color: 'bg-blue-100 text-blue-800' },
  205: { label: 'ŁAWKI SIEDZISKA-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
  178: { label: 'PILNE - ŁAWKI SIEDZISKA', color: 'bg-orange-100 text-orange-800' },
  181: { label: 'BARDZO PILNE - ŁAWKI SIEDZISKA', color: 'bg-red-100 text-red-800' },
  // POOM KIDS
  31: { label: 'POOM KIDS-NOWE', color: 'bg-blue-100 text-blue-800' },
  122: { label: 'POOM KIDS-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
  228: { label: 'PILNE - POOM KIDS', color: 'bg-orange-100 text-orange-800' },
  225: { label: 'BARDZO PILNE - POOM KIDS', color: 'bg-red-100 text-red-800' },
  // LEGOWISKA
  46: { label: 'LEGOWISKA-NOWE', color: 'bg-blue-100 text-blue-800' },
  131: { label: 'LEGOWISKA-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
  184: { label: 'PILNE - LEGOWISKA', color: 'bg-orange-100 text-orange-800' },
  187: { label: 'BARDZO PILNE - LEGOWISKA', color: 'bg-red-100 text-red-800' },
  // SARIS GARAGE
  57: { label: 'SARIS GARAGE-NOWE', color: 'bg-blue-100 text-blue-800' },
  125: { label: 'SARIS GARAGE-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
  220: { label: 'SARIS GARAGE BARDZO PILNE', color: 'bg-red-100 text-red-800' },
  209: { label: 'SARIS GARAGE NIESTANDARDY - Nowe', color: 'bg-blue-100 text-blue-800' },
  212: { label: 'SARIS GARAGE NIESTANDARDY - W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
  // MEBLE OGRODOWE
  82: { label: 'MEBLE OGRODOWE-NOWE', color: 'bg-blue-100 text-blue-800' },
  128: { label: 'MEBLE OGRODOWE-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
  // INDYWIDUALNE
  134: { label: 'INDYWIDUALNE-NOWE', color: 'bg-blue-100 text-blue-800' },
  137: { label: 'INDYWIDUALNE-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
  // HOUSE
  155: { label: 'HOUSE NOWE ZAMÓWIENIA', color: 'bg-blue-100 text-blue-800' },
  158: { label: 'HOUSE PRODUKCJA', color: 'bg-yellow-100 text-yellow-800' },
  161: { label: 'HOUSE WYPRODUKOWANE', color: 'bg-green-100 text-green-800' },
  // Dosyłki i inne
  85: { label: 'MEBLE DOSYŁKA', color: 'bg-purple-100 text-purple-800' },
  110: { label: 'Dosyłka', color: 'bg-purple-100 text-purple-800' },
  60: { label: 'ETYKIETY DO ZR', color: 'bg-gray-100 text-gray-800' },
  // Wyjaśnienia
  97: { label: 'ZAM DO WYJAŚ', color: 'bg-orange-100 text-orange-800' },
  100: { label: 'WYJAŚNIONE', color: 'bg-green-100 text-green-800' },
  214: { label: 'UPS DO WYJASNIENIA', color: 'bg-orange-100 text-orange-800' },
  217: { label: 'UPS WYJASNIONE', color: 'bg-green-100 text-green-800' },
  233: { label: 'DO WYJASNIENIA KAROLA', color: 'bg-orange-100 text-orange-800' },
  // Zwroty i problemy
  63: { label: 'ODSTĄPIENIE OD UMOWY', color: 'bg-red-100 text-red-800' },
  81: { label: 'BEZ ODBIORU', color: 'bg-red-100 text-red-800' },
  223: { label: 'ZWROT NIEMCY', color: 'bg-red-100 text-red-800' },
  69: { label: 'BARCZEWO WRÓCIŁO', color: 'bg-red-100 text-red-800' },
  78: { label: 'ZWRÓCONE ŚRODKI', color: 'bg-green-100 text-green-800' },
  231: { label: 'WRÓCIŁO POLSKA', color: 'bg-red-100 text-red-800' },
  // Amazon
  188: { label: 'AMAZON W BLu', color: 'bg-yellow-100 text-yellow-800' }
};

export default function ZamowieniaPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [perPage, setPerPage] = useState(20);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Fetch available channels and statuses
  useEffect(() => {
    async function loadFilters() {
      try {
        const [channelsRes, statusesRes] = await Promise.all([
          fetch('/api/channels'),
          fetch('/api/statuses')
        ]);
        const channelsData = await channelsRes.json();
        const statusesData = await statusesRes.json();
        if (channelsData.channels) {
          setChannels(channelsData.channels);
        }
        if (statusesData.statuses) {
          setStatuses(statusesData.statuses);
        }
      } catch (err) {
        console.error('Failed to load filters:', err);
      }
    }
    loadFilters();
  }, []);

  const fetchOrders = useCallback(async (page = 1, search = '', itemsPerPage = 20, channel = '', status = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: itemsPerPage.toString()
      });

      if (search) {
        params.append('search', search);
      }

      if (channel) {
        params.append('channel', channel);
      }

      if (status !== null) {
        params.append('status', status.toString());
      }

      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setOrders(data.orders || []);
        setPagination(data.pagination);
        setError(null);
      }
    } catch (err) {
      setError('Nie udalo sie pobrac zamowien');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchOrders(1, query, perPage, selectedChannel, selectedStatus);
  };

  const handlePageChange = (newPage) => {
    fetchOrders(newPage, searchQuery, perPage, selectedChannel, selectedStatus);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    fetchOrders(1, searchQuery, newPerPage, selectedChannel, selectedStatus);
  };

  const handleChannelChange = (channel) => {
    setSelectedChannel(channel);
    fetchOrders(1, searchQuery, perPage, channel, selectedStatus);
  };

  const handleStatusChange = (status) => {
    const newStatus = status === selectedStatus ? null : status;
    setSelectedStatus(newStatus);
    fetchOrders(1, searchQuery, perPage, selectedChannel, newStatus);
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        await fetchOrders(1, searchQuery, perPage, selectedChannel, selectedStatus);
      }
    } catch (err) {
      setError('Synchronizacja nie powiodla sie');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, '', 20, '', null);
  }, [fetchOrders]);

  const getStatusLabel = (status) => {
    return statusMap[status]?.label || `#${status}`;
  };

  const getStatusColor = (status) => {
    return statusMap[status]?.color || 'bg-gray-100 text-gray-800';
  };

  // Statusy należące do kategorii "Inne"
  const inneStatuses = [63, 231, 69, 78, 161, 217, 100, 4, 110, 85, 19, 16, 60, 188, 13, 10];

  // Grupowanie statusów po kategoriach
  const getStatusCategory = (status, color) => {
    if (inneStatuses.includes(status)) return 'inne';
    if (color.includes('blue')) return 'nowe';
    if (color.includes('yellow')) return 'realizacja';
    if (color.includes('orange')) return 'pilne';
    if (color.includes('red')) return 'bardzo_pilne';
    return 'inne';
  };

  const groupedStatuses = statuses.reduce((acc, s) => {
    const color = getStatusColor(s.status);
    const category = getStatusCategory(s.status, color);
    if (!acc[category]) acc[category] = [];
    acc[category].push(s);
    return acc;
  }, {});

  // Sortuj każdą grupę po liczbie zamówień
  Object.keys(groupedStatuses).forEach(key => {
    groupedStatuses[key].sort((a, b) => b.count - a.count);
  });

  const categories = [
    { key: 'nowe', label: 'Nowe', color: 'bg-blue-100 text-blue-800' },
    { key: 'realizacja', label: 'W realizacji', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'pilne', label: 'Pilne', color: 'bg-orange-100 text-orange-800' },
    { key: 'bardzo_pilne', label: 'Bardzo Pilne', color: 'bg-red-100 text-red-800' },
    { key: 'inne', label: 'Inne', color: 'bg-gray-100 text-gray-800' },
  ];

  const toggleCategory = (key) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getCategoryCount = (key) => {
    return groupedStatuses[key]?.reduce((sum, s) => sum + s.count, 0) || 0;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-3xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {/* Header */}
        <div className="flex justify-between items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Zamowienia</h1>
            {pagination && (
              <p className="text-xs sm:text-sm text-gray-500">
                {selectedChannel ? `${selectedChannel}: ` : ''}
                {pagination.totalCount} zam.
              </p>
            )}
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {syncing ? 'Sync...' : 'Sync'}
          </button>
        </div>

        {/* Status Filter */}
        {statuses.length > 0 && (
          <div className="mb-4 bg-white rounded-lg shadow p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500">Status</div>
              {selectedStatus !== null && (
                <button
                  onClick={() => handleStatusChange(selectedStatus)}
                  className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600 hover:bg-gray-300"
                >
                  Wyczysc filtr
                </button>
              )}
            </div>
            <div className="space-y-2">
              {categories.map((cat) => {
                const categoryStatuses = groupedStatuses[cat.key] || [];
                if (categoryStatuses.length === 0) return null;
                const isExpanded = expandedCategories[cat.key];
                const totalCount = getCategoryCount(cat.key);
                return (
                  <div key={cat.key}>
                    <button
                      onClick={() => toggleCategory(cat.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${cat.color} hover:opacity-80 transition-opacity`}
                    >
                      <span className="flex items-center gap-2">
                        <svg
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {cat.label}
                      </span>
                      <span className="font-bold">{totalCount}</span>
                    </button>
                    {isExpanded && (
                      <div className="mt-2 ml-6 flex flex-wrap gap-2">
                        {categoryStatuses.map((s) => (
                          <button
                            key={s.status}
                            onClick={() => handleStatusChange(s.status)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                              selectedStatus === s.status
                                ? 'ring-2 ring-blue-500 ring-offset-1'
                                : ''
                            } ${getStatusColor(s.status)}`}
                          >
                            {getStatusLabel(s.status)} <span className="font-bold">{s.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3">
          {/* Search and Channel Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow">
              <SearchBox onSearch={handleSearch} initialValue={searchQuery} />
            </div>
            <select
              value={selectedChannel}
              onChange={(e) => handleChannelChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Wszystkie kanaly</option>
              {channels.map((ch, idx) => (
                <option key={idx} value={ch.label}>
                  {ch.label}
                </option>
              ))}
            </select>
          </div>
          {/* Per Page Selector */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Pokazuj:</span>
            <select
              value={perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-600">na stronie</span>
            {(selectedChannel || selectedStatus !== null) && (
              <button
                onClick={() => {
                  setSelectedChannel('');
                  setSelectedStatus(null);
                  fetchOrders(1, searchQuery, perPage, '', null);
                }}
                className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
              >
                Wyczysc filtry
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
            {searchQuery
              ? `Nie znaleziono zamowien dla "${searchQuery}"`
              : 'Brak zamowien. Kliknij "Synchronizuj" aby pobrac dane z Apilo.'}
          </div>
        ) : (
          <>
            <OrderList orders={orders} />
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
