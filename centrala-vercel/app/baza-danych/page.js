'use client';

import { useState, useEffect, useRef } from 'react';

const MONTHS = [
  { key: 1, label: 'Styczen', short: 'Sty' },
  { key: 2, label: 'Luty', short: 'Lut' },
  { key: 3, label: 'Marzec', short: 'Mar' },
  { key: 4, label: 'Kwiecien', short: 'Kwi' },
  { key: 5, label: 'Maj', short: 'Maj' },
  { key: 6, label: 'Czerwiec', short: 'Cze' },
  { key: 7, label: 'Lipiec', short: 'Lip' },
  { key: 8, label: 'Sierpien', short: 'Sie' },
  { key: 9, label: 'Wrzesien', short: 'Wrz' },
  { key: 10, label: 'Pazdziernik', short: 'Paz' },
  { key: 11, label: 'Listopad', short: 'Lis' },
  { key: 12, label: 'Grudzien', short: 'Gru' },
];

export default function BazaDanychPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState('');
  const [hasAccess, setHasAccess] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef(null);

  // Example CSV content for download
  const exampleCSV = `SKU;Sprzedaz
PPI-SKU-109;100
PPI-SKU-110;50
PUFAPOKROWIEC-SKU-001;75
LEGOWISKO-60-SZARY;120`;

  const downloadExampleCSV = () => {
    const blob = new Blob([exampleCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'przyklad_import_sprzedazy.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Check access on mount
  useEffect(() => {
    checkAccess();
  }, []);

  // Fetch data when year/month changes
  useEffect(() => {
    if (hasAccess) {
      fetchData();
    }
  }, [selectedYear, selectedMonth, hasAccess]);

  const checkAccess = async () => {
    try {
      // Try to fetch data - if 403, no access
      const res = await fetch(`/api/historical-sales?year=${selectedYear}&month=${selectedMonth}`);
      if (res.status === 403) {
        setHasAccess(false);
      } else {
        setHasAccess(true);
      }
    } catch (err) {
      setHasAccess(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/historical-sales?year=${selectedYear}&month=${selectedMonth}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Blad pobierania danych');
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    // Detect separator
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;

    let separator = ',';
    if (semicolonCount > commaCount && semicolonCount > tabCount) separator = ';';
    else if (tabCount > commaCount && tabCount > semicolonCount) separator = '\t';

    // Parse header
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const skuIndex = headers.findIndex(h => h === 'sku' || h.includes('sku'));
    const qtyIndex = headers.findIndex(h =>
      h === 'sprzedaz' || h === 'sprzedaż' || h === 'quantity' || h === 'ilosc' || h === 'ilość' || h === 'qty'
    );

    if (skuIndex === -1) {
      // Try second column as SKU if first is not found
      return lines.slice(1).map(line => {
        const cols = line.split(separator).map(c => c.trim().replace(/"/g, ''));
        return {
          sku: cols[0] || '',
          quantity: parseInt(cols[1]) || 0
        };
      }).filter(r => r.sku);
    }

    return lines.slice(1).map(line => {
      const cols = line.split(separator).map(c => c.trim().replace(/"/g, ''));
      return {
        sku: cols[skuIndex] || '',
        quantity: parseInt(cols[qtyIndex !== -1 ? qtyIndex : 1]) || 0
      };
    }).filter(r => r.sku);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);
      setSuccess(null);
      setImportProgress({ current: 0, total: 0, percent: 0 });

      const text = await file.text();
      const parsedData = parseCSV(text);

      if (parsedData.length === 0) {
        setError('Nie znaleziono danych w pliku CSV');
        setImporting(false);
        return;
      }

      // Split into batches for progress tracking
      const BATCH_SIZE = 100;
      const batches = [];
      for (let i = 0; i < parsedData.length; i += BATCH_SIZE) {
        batches.push(parsedData.slice(i, i + BATCH_SIZE));
      }

      const total = parsedData.length;
      let imported = 0;
      let skipped = 0;
      let errors = [];

      setImportProgress({ current: 0, total, percent: 0 });

      // Process batches sequentially
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        const res = await fetch('/api/historical-sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: selectedYear,
            month: selectedMonth,
            data: batch
          })
        });

        const result = await res.json();
        if (result.success) {
          imported += result.imported || 0;
          skipped += result.skipped || 0;
          if (result.errors) errors.push(...result.errors);
        } else {
          errors.push(result.error);
        }

        // Update progress
        const processed = Math.min((i + 1) * BATCH_SIZE, total);
        const percent = Math.round((processed / total) * 100);
        setImportProgress({ current: processed, total, percent });
      }

      // Final result
      const message = `Zaimportowano ${imported} rekordow, pominieto ${skipped}${errors.length > 0 ? `, bledy: ${errors.length}` : ''}`;
      setSuccess(message);
      setShowImportModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      setError('Blad importu: ' + err.message);
    } finally {
      setImporting(false);
      setImportProgress({ current: 0, total: 0, percent: 0 });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetMonth = async () => {
    if (!confirm(`Czy na pewno chcesz zresetowac dane dla ${MONTHS[selectedMonth - 1].label} ${selectedYear}?`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/historical-sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_month',
          year: selectedYear,
          month: selectedMonth
        })
      });

      const result = await res.json();
      if (result.success) {
        setSuccess(result.message);
        fetchData();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Blad resetowania danych');
    } finally {
      setLoading(false);
    }
  };

  // Filter data by search
  const filteredData = data.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.sku?.toLowerCase().includes(s) ||
      item.nazwa?.toLowerCase().includes(s)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage, selectedMonth, selectedYear]);

  // Calculate totals
  const totalQuantity = filteredData.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const productsWithSales = filteredData.filter(item => item.quantity > 0).length;

  // No access screen
  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Brak dostepu</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ta strona jest dostepna tylko dla IT Administratora.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Baza danych - Sprzedaz historyczna
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Import danych sprzedazy z poprzedniego roku (Amazon)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4 overflow-x-auto">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {MONTHS.map((month) => (
              <button
                key={month.key}
                onClick={() => setSelectedMonth(month.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedMonth === month.key
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className="hidden sm:inline">{month.label}</span>
                <span className="sm:hidden">{month.short}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Import CSV */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
              >
                <span>📥</span>
                <span>Import CSV</span>
              </button>
              {importing && <span className="text-sm text-gray-500">Importowanie...</span>}
            </div>

            {/* Reset Month */}
            <button
              onClick={handleResetMonth}
              className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium"
            >
              Resetuj miesiac
            </button>

            <div className="flex-1" />

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Widok:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={150}>150</option>
                <option value={250}>250</option>
              </select>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Szukaj SKU lub nazwy..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm w-full sm:w-64"
            />
          </div>

          {/* Messages */}
          {error && (
            <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
              {success}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredData.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Produktow</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{productsWithSales}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Ze sprzedaza</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{totalQuantity.toLocaleString('pl-PL')}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Laczna sprzedaz</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{(totalQuantity / 30).toFixed(1)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Sr/dzien</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nazwa produktu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sprzedaz ({MONTHS[selectedMonth - 1].short} {selectedYear})
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sr/dzien
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Ladowanie...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Brak produktow{search ? ' pasujacych do wyszukiwania' : ' w bazie WMS'}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, idx) => (
                    <tr key={idx} className={item.quantity > 0 ? 'bg-green-50 dark:bg-green-900/10' : ''}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {item.nazwa || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        <span className={item.quantity > 0 ? 'text-green-600' : 'text-gray-400'}>
                          {item.quantity || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                        {((item.quantity || 0) / 30).toFixed(1)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Pokazuje {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} z {filteredData.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ««
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  «
                </button>
                <span className="px-3 py-1 text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  »
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  »»
                </button>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !importing && setShowImportModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import danych sprzedazy</h3>
              <button
                onClick={() => setShowImportModal(false)}
                disabled={importing}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Target month info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Importujesz dane do: <strong>{MONTHS[selectedMonth - 1].label} {selectedYear}</strong>
                </p>
              </div>

              {/* Instructions */}
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <strong className="text-gray-800 dark:text-gray-200">Format pliku CSV:</strong>
                  <p className="mt-1">Plik musi zawierac dwie kolumny: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">SKU</code> i <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">Sprzedaz</code></p>
                </div>

                <div>
                  <strong className="text-gray-800 dark:text-gray-200">Przykladowy format:</strong>
                  <pre className="mt-1 bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-x-auto">
{`SKU;Sprzedaz
PPI-SKU-109;100
PPI-SKU-110;50
PUFAPOKROWIEC-SKU-001;75`}
                  </pre>
                </div>

                <button
                  onClick={downloadExampleCSV}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <span>📄</span>
                  Pobierz przykladowy plik CSV
                </button>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Uwaga:</strong> Import <strong>dodaje</strong> wartosci do istniejacych (nie nadpisuje).
              </div>

              {/* File input / Progress */}
              {importing ? (
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-4xl animate-pulse">⏳</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Importowanie... {importProgress.current} / {importProgress.total}
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-green-600 h-4 rounded-full transition-all duration-300 flex items-center justify-center"
                        style={{ width: `${importProgress.percent}%` }}
                      >
                        {importProgress.percent > 10 && (
                          <span className="text-xs text-white font-medium">{importProgress.percent}%</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Prosze nie zamykac okna podczas importu
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-file-input"
                    disabled={importing}
                  />
                  <label
                    htmlFor="csv-file-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <span className="text-4xl">📁</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Kliknij aby wybrac plik CSV
                    </span>
                    <span className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                      Wybierz plik
                    </span>
                  </label>
                </div>
              )}

              {/* Error in modal */}
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowImportModal(false)}
                disabled={importing}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importowanie...' : 'Anuluj'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
