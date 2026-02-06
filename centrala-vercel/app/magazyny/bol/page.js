'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function BOMPage() {
  const [activeTab, setActiveTab] = useState('gotowe');
  const [loading, setLoading] = useState(true);
  const [magazyny, setMagazyny] = useState({
    gotowe: [],
    polprodukty: [],
    wykroje: [],
    surowce: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importPreview, setImportPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentName: '' });
  const [importResult, setImportResult] = useState(null); // { success, skipped, errors }
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showImportOptionsModal, setShowImportOptionsModal] = useState(false);
  const fileInputRef = useRef(null);

  const tabs = [
    { key: 'gotowe', label: 'Gotowe produkty', icon: '📦', color: '#22C55E', textColor: 'text-green-600', borderColor: 'border-green-500', bgLight: 'bg-green-50' },
    { key: 'polprodukty', label: 'Polprodukty', icon: '🔧', color: '#3B82F6', textColor: 'text-blue-600', borderColor: 'border-blue-500', bgLight: 'bg-blue-50' },
    { key: 'wykroje', label: 'Wykroje', icon: '✂️', color: '#F59E0B', textColor: 'text-amber-600', borderColor: 'border-amber-500', bgLight: 'bg-amber-50' },
    { key: 'surowce', label: 'Surowce', icon: '🧱', color: '#A16207', textColor: 'text-yellow-700', borderColor: 'border-yellow-600', bgLight: 'bg-yellow-50' },
  ];

  // Fetch all inventory data with recipes
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) {
        setMagazyny(data.data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Reset page and selection when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [activeTab]);

  // Get current tab data
  const currentTab = tabs.find(t => t.key === activeTab);
  const currentItems = magazyny[activeTab] || [];

  // Filter items by search
  const filteredItems = currentItems.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      (item.nazwa || '').toLowerCase().includes(query) ||
      (item.sku || '').toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + perPage);

  // Get recipe from item (receptura.ingredients)
  const getRecipe = (item) => {
    return item.receptura?.ingredients || [];
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedItems.map(item => item.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Get max number of ingredients across items for CSV columns
  const getMaxIngredients = (items) => {
    let max = 0;
    items.forEach(item => {
      const recipe = getRecipe(item);
      if (recipe.length > max) {
        max = recipe.length;
      }
    });
    return Math.max(max, 5); // Minimum 5 columns for import template
  };

  // Generate sample CSV for download
  const generateSampleCSV = () => {
    const headers = [
      'Nazwa', 'SKU',
      'Skladnik1_SKU', 'Skladnik1_Nazwa', 'Skladnik1_Ilosc',
      'Skladnik2_SKU', 'Skladnik2_Nazwa', 'Skladnik2_Ilosc',
      'Skladnik3_SKU', 'Skladnik3_Nazwa', 'Skladnik3_Ilosc'
    ];

    const exampleRows = [
      ['"Produkt przykladowy 1"', '"SKU-001"', '"POLPROD-001"', '"Polprodukt 1"', '2', '"SUROWIEC-001"', '"Surowiec 1"', '5', '', '', ''],
      ['"Produkt przykladowy 2"', '"SKU-002"', '"WYKROJ-001"', '"Wykroj 1"', '1', '"POLPROD-002"', '"Polprodukt 2"', '3', '"SUROWIEC-002"', '"Surowiec 2"', '10'],
      ['"Produkt tylko po nazwie"', '""', '""', '"Polprodukt po nazwie"', '4', '', '', '', '', '', ''],
      ['"Produkt tylko po SKU"', '"SKU-003"', '"POLPROD-003"', '""', '2', '', '', '', '', '', '']
    ];

    const csv = [headers.join(','), ...exampleRows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BOM_import_przyklad.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to CSV (selected items or all if none selected)
  const handleExportCSV = () => {
    const itemsToExport = selectedIds.size > 0
      ? filteredItems.filter(item => selectedIds.has(item.id))
      : filteredItems;

    if (itemsToExport.length === 0) {
      alert('Brak pozycji do eksportu');
      return;
    }

    const maxIngredients = getMaxIngredients(itemsToExport);

    // Build header
    let headers = ['Nazwa', 'SKU'];
    for (let i = 1; i <= maxIngredients; i++) {
      headers.push(`Skladnik${i}_SKU`, `Skladnik${i}_Nazwa`, `Skladnik${i}_Ilosc`);
    }

    // Build rows
    const rows = itemsToExport.map(item => {
      const recipe = getRecipe(item);
      const row = [
        `"${(item.nazwa || '').replace(/"/g, '""')}"`,
        `"${(item.sku || '').replace(/"/g, '""')}"`
      ];

      for (let i = 0; i < maxIngredients; i++) {
        if (recipe[i]) {
          const r = recipe[i];
          row.push(
            `"${(r.ingredient_sku || '').replace(/"/g, '""')}"`,
            `"${(r.ingredient_nazwa || '').replace(/"/g, '""')}"`,
            r.quantity || ''
          );
        } else {
          row.push('', '', '');
        }
      }

      return row.join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BOM_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Parse CSV file
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    // Auto-detect separator (comma or semicolon) based on first line
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const separator = semicolonCount > commaCount ? ';' : ',';

    console.log('CSV separator detected:', separator, '(commas:', commaCount, 'semicolons:', semicolonCount, ')');

    const headers = firstLine.split(separator).map(h => h.replace(/^"|"$/g, '').trim());
    console.log('CSV headers:', headers);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      // Extract recipe ingredients
      row.ingredients = [];
      let ingredientNum = 1;
      while (row[`Skladnik${ingredientNum}_SKU`] !== undefined || row[`Skladnik${ingredientNum}_Nazwa`] !== undefined) {
        const sku = row[`Skladnik${ingredientNum}_SKU`] || '';
        const nazwa = row[`Skladnik${ingredientNum}_Nazwa`] || '';
        const ilosc = parseFloat(row[`Skladnik${ingredientNum}_Ilosc`]) || 0;

        if ((sku || nazwa) && ilosc > 0) {
          row.ingredients.push({ sku, nazwa, ilosc });
        }
        ingredientNum++;
      }

      if (row.Nazwa || row.SKU) {
        data.push(row);
      }
    }

    return data;
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseCSV(text);
      setImportData(parsed);

      // Create preview with matching status - search in ALL warehouses for the product
      const allItems = [...(magazyny.gotowe || []), ...(magazyny.polprodukty || []), ...(magazyny.wykroje || [])];

      const preview = parsed.map(row => {
        // Match by SKU first, then by name
        const matchedItem = allItems.find(item =>
          (row.SKU && item.sku && item.sku === row.SKU) ||
          (row.Nazwa && item.nazwa && item.nazwa === row.Nazwa)
        );

        // Find ingredients in polprodukty, wykroje, surowce
        const ingredientMatches = row.ingredients.map(ing => {
          let found = null;
          for (const kategoria of ['polprodukty', 'wykroje', 'surowce']) {
            const match = magazyny[kategoria]?.find(item =>
              (ing.sku && item.sku && item.sku === ing.sku) ||
              (ing.nazwa && item.nazwa && item.nazwa === ing.nazwa)
            );
            if (match) {
              found = match;
              break;
            }
          }
          return { ...ing, matched: !!found, matchedItem: found };
        });

        const matchedIngredientsCount = ingredientMatches.filter(i => i.matched).length;

        return {
          ...row,
          matched: !!matchedItem,
          matchedItem: matchedItem,
          ingredientCount: row.ingredients?.length || 0,
          ingredientMatches,
          matchedIngredientsCount
        };
      });

      setImportPreview(preview);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Import recipes
  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errorDetails = [];

    // Filter only rows that will be processed
    const rowsToProcess = importPreview.filter(row =>
      row.matched && row.matchedItem && row.matchedIngredientsCount > 0
    );
    const totalToProcess = rowsToProcess.length;
    const skippedFromStart = importPreview.length - totalToProcess;
    skippedCount = skippedFromStart;

    setImportProgress({ current: 0, total: totalToProcess, currentName: 'Rozpoczynanie...' });

    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];
      const productName = row.matchedItem?.nazwa || row.Nazwa || `Produkt ${i + 1}`;

      setImportProgress({
        current: i + 1,
        total: totalToProcess,
        currentName: productName
      });

      try {
        // First, get existing recipe to delete
        const existingRes = await fetch(`/api/recipes?productId=${row.matchedItem.id}`);
        const existingData = await existingRes.json();

        if (existingData.success && existingData.data) {
          // Delete existing ingredients - batch delete in parallel
          await Promise.all(
            existingData.data.map(ing =>
              fetch(`/api/recipes?id=${ing.id}`, { method: 'DELETE' })
            )
          );
        }

        // Then add new ingredients (only matched ones) - batch add in parallel
        const addPromises = row.ingredientMatches
          .filter(ing => ing.matched && ing.matchedItem)
          .map(ing =>
            fetch('/api/recipes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: row.matchedItem.id,
                ingredientId: ing.matchedItem.id,
                quantity: ing.ilosc
              })
            })
          );

        await Promise.all(addPromises);
        successCount++;
      } catch (err) {
        console.error('Error importing recipe:', err);
        errorCount++;
        errorDetails.push(`${productName}: ${err.message}`);
      }
    }

    setImporting(false);
    setImportProgress({ current: 0, total: 0, currentName: '' });

    // Show result modal instead of alert
    setImportResult({
      success: successCount,
      skipped: skippedCount,
      errors: errorCount,
      errorDetails: errorDetails.slice(0, 10) // Show max 10 errors
    });
  };

  // Close import and show results
  const closeImportWithResults = () => {
    setShowImportModal(false);
    setImportData([]);
    setImportPreview([]);
    setImportResult(null);
    fetchInventory();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">BOM - Bill of Materials (Receptury)</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Zarzadzanie skladnikami i recepturami produktow</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/magazyny"
              className="px-2.5 py-1.5 text-xs sm:text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ← Powrot do WMS
            </Link>
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {selectedIds.size > 0 ? `Export CSV (${selectedIds.size})` : 'Export CSV'}
            </button>
            <button
              onClick={() => setShowInstructions(true)}
              className="px-2.5 py-1.5 text-xs sm:text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              ? Instrukcje
            </button>
            <button
              onClick={() => setShowImportOptionsModal(true)}
              className="px-2.5 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Import CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 mb-4">
          <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors whitespace-nowrap px-4 ${
                  activeTab === tab.key
                    ? `${tab.textColor} border-b-2 ${tab.borderColor} ${tab.bgLight}`
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Pagination Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Szukaj po nazwie lub SKU..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">Pozycji na stronie:</span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredItems.length} pozycji
              {selectedIds.size > 0 && (
                <span className="ml-2 text-indigo-600 dark:text-indigo-400">
                  ({selectedIds.size} zaznaczonych)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Ladowanie...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Brak pozycji</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-2 py-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === paginatedItems.length && paginatedItems.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nazwa produktu</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Receptura</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedItems.map((item) => {
                      const recipe = getRecipe(item);
                      return (
                        <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedIds.has(item.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                          <td className="px-2 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(item.id)}
                              onChange={() => toggleSelect(item.id)}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{item.nazwa}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{item.sku || '-'}</td>
                          <td className="px-4 py-3">
                            {recipe.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {recipe.map((r, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300"
                                  >
                                    {r.ingredient_sku || r.ingredient_nazwa}: {r.quantity}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/magazyny?tab=${activeTab}&open=${item.id}`}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs"
                            >
                              Edytuj w WMS
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Strona {currentPage} z {totalPages} ({startIndex + 1}-{Math.min(startIndex + perPage, filteredItems.length)} z {filteredItems.length})
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Poprzednia
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Nastepna
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-5xl w-full p-6 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import receptur z CSV</h3>
                <button
                  onClick={() => { setShowImportModal(false); setImportData([]); setImportPreview([]); }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Instructions */}
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Instrukcja importu:</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                  <li><strong>Tylko aktualizacja receptur</strong> - nie mozna dodawac nowych produktow, ktore nie istnieja w WMS</li>
                  <li><strong>Elastyczne dopasowanie</strong> - dla produktu i skladnikow mozesz podac <strong>tylko SKU</strong> lub <strong>tylko Nazwe</strong> - system automatycznie dopasuje brakujace dane</li>
                  <li><strong>Skladniki musza istniec w WMS</strong> - skladniki sa szukane w Polproduktach, Wykrojach i Surowcach</li>
                  <li><strong>Receptura zostanie nadpisana</strong> - istniejaca receptura produktu zostanie zastapiona nowa</li>
                  <li><strong>Format CSV</strong>: Nazwa, SKU, Skladnik1_SKU, Skladnik1_Nazwa, Skladnik1_Ilosc, ...</li>
                  <li><strong>Przyklad</strong>: Mozesz uzyc pustego SKU produktu i podac tylko Nazwe, lub pusty Skladnik1_Nazwa i podac tylko Skladnik1_SKU</li>
                </ul>
              </div>

              {/* Summary */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Podsumowanie:</strong> Znaleziono {importPreview.length} wierszy |
                  <span className="text-green-600 dark:text-green-400 ml-2">{importPreview.filter(r => r.matched).length} dopasowanych produktow</span> |
                  <span className="text-red-600 dark:text-red-400 ml-2">{importPreview.filter(r => !r.matched).length} nieznalezionych</span>
                </p>
              </div>

              <div className="flex-1 overflow-y-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nazwa (z CSV → dopasowana)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU (z CSV → dopasowany)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Skladniki</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className={row.matched ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}>
                        <td className="px-3 py-2">
                          {row.matched ? (
                            <span className="text-green-600 dark:text-green-400">✓ Znaleziono</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">✗ Brak w WMS</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {row.Nazwa ? (
                            <span className="text-gray-900 dark:text-white">{row.Nazwa}</span>
                          ) : row.matched && row.matchedItem?.nazwa ? (
                            <span className="text-blue-600 dark:text-blue-400" title="Auto-dopasowane z WMS">
                              ← {row.matchedItem.nazwa}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {row.SKU ? (
                            <span className="text-gray-600 dark:text-gray-400">{row.SKU}</span>
                          ) : row.matched && row.matchedItem?.sku ? (
                            <span className="text-blue-600 dark:text-blue-400" title="Auto-dopasowane z WMS">
                              ← {row.matchedItem.sku}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {row.ingredientMatches && row.ingredientMatches.length > 0 ? (
                            <div className="space-y-1">
                              {row.ingredientMatches.map((ing, ingIdx) => (
                                <div key={ingIdx} className={`flex items-center gap-1 ${ing.matched ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  <span>{ing.matched ? '✓' : '✗'}</span>
                                  <span className="font-mono">{ing.sku || (ing.matched && ing.matchedItem?.sku ? `← ${ing.matchedItem.sku}` : '')}</span>
                                  <span className="text-gray-500">|</span>
                                  <span>{ing.nazwa || (ing.matched && ing.matchedItem?.nazwa ? `← ${ing.matchedItem.nazwa}` : '')}</span>
                                  <span className="text-gray-500">×{ing.ilosc}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">brak skladnikow</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Progress / Results / Actions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Progress Bar during import */}
                {importing && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        Importowanie... {importProgress.current} / {importProgress.total}
                      </span>
                      <span className="text-sm text-gray-500">
                        {importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                      Aktualnie: {importProgress.currentName}
                    </p>
                  </div>
                )}

                {/* Results after import */}
                {importResult && (
                  <div className="mb-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Import zakonczony!</h4>
                    <div className="grid grid-cols-3 gap-3 text-center mb-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{importResult.success}</div>
                        <div className="text-xs text-green-700 dark:text-green-300">Sukces</div>
                      </div>
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{importResult.skipped}</div>
                        <div className="text-xs text-yellow-700 dark:text-yellow-300">Pominiete</div>
                      </div>
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{importResult.errors}</div>
                        <div className="text-xs text-red-700 dark:text-red-300">Bledy</div>
                      </div>
                    </div>
                    {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                        <p className="font-medium mb-1">Szczegoly bledow:</p>
                        <ul className="list-disc list-inside">
                          {importResult.errorDetails.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      onClick={closeImportWithResults}
                      className="w-full mt-3 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Zamknij i odswiez dane
                    </button>
                  </div>
                )}

                {/* Action buttons (only when not importing and no results) */}
                {!importing && !importResult && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowImportModal(false); setImportData([]); setImportPreview([]); }}
                      className="flex-1 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={importPreview.filter(r => r.matched && r.matchedIngredientsCount > 0).length === 0}
                      className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Importuj {importPreview.filter(r => r.matched && r.matchedIngredientsCount > 0).length} receptur
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Import Options Modal */}
        {showImportOptionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import CSV</h3>
                <button
                  onClick={() => setShowImportOptionsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Wybierz plik CSV do importu receptur lub pobierz przykladowy plik CSV jako szablon.
                </p>

                <div className="grid gap-3">
                  <button
                    onClick={() => {
                      setShowImportOptionsModal(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Wybierz plik CSV do importu
                  </button>

                  <button
                    onClick={() => {
                      generateSampleCSV();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Pobierz przykladowa CSV
                  </button>
                </div>

                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <strong>Format CSV:</strong> Nazwa, SKU, Skladnik1_SKU, Skladnik1_Nazwa, Skladnik1_Ilosc, ...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Mozesz podac tylko SKU lub tylko Nazwe - system automatycznie dopasuje brakujace dane.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowImportOptionsModal(false)}
                className="w-full mt-4 py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}

        {/* Instructions Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Instrukcja importu/eksportu CSV</h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                {/* Export */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Export CSV</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
                    <li>Zaznacz pozycje checkboxami lub eksportuj wszystkie</li>
                    <li>Plik zawiera: Nazwa, SKU, oraz kolumny dla skladnikow</li>
                    <li>Kazdy skladnik ma 3 kolumny: SKU, Nazwa, Ilosc</li>
                  </ul>
                </div>

                {/* Import */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Import CSV - Zasady</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li><strong>Tylko aktualizacja receptur</strong> - nie mozna dodawac nowych produktow</li>
                    <li><strong>Produkty musza istniec w WMS</strong> - import pominie nieznane produkty</li>
                    <li><strong>Skladniki musza istniec w WMS</strong> - szukane w Polproduktach, Wykrojach, Surowcach</li>
                    <li><strong>Receptura zostanie nadpisana</strong> - stara receptura zostanie usunieta</li>
                  </ul>
                </div>

                {/* Flexible matching */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Elastyczne dopasowanie</h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                    <li>Mozesz podac <strong>tylko SKU</strong> - system znajdzie Nazwe automatycznie</li>
                    <li>Mozesz podac <strong>tylko Nazwe</strong> - system znajdzie SKU automatycznie</li>
                    <li>Dotyczy zarowno produktow jak i skladnikow</li>
                    <li>W podgladzie importu zobaczysz auto-dopasowane dane (niebieska strzalka)</li>
                  </ul>
                </div>

                {/* Format */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Format CSV</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Kolumny w pliku:</p>
                  <code className="block text-xs bg-gray-200 dark:bg-gray-600 p-2 rounded overflow-x-auto">
                    Nazwa, SKU, Skladnik1_SKU, Skladnik1_Nazwa, Skladnik1_Ilosc, Skladnik2_SKU, Skladnik2_Nazwa, Skladnik2_Ilosc, ...
                  </code>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Tip: Najlatwiej wyeksportowac istniejace dane i uzyc ich jako szablonu.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full mt-4 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Zamknij
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
