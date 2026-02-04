'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function BOLPage() {
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

  // Format recipe for display
  const formatRecipe = (item) => {
    if (!item.recipe || item.recipe.length === 0) return '-';
    return item.recipe.map(r => `${r.ingredient_sku || r.ingredient_nazwa}: ${r.quantity}`).join(', ');
  };

  // Get max number of ingredients across all items for CSV columns
  const getMaxIngredients = (items) => {
    let max = 0;
    items.forEach(item => {
      if (item.recipe && item.recipe.length > max) {
        max = item.recipe.length;
      }
    });
    return Math.max(max, 5); // Minimum 5 columns for import template
  };

  // Export to CSV
  const handleExportCSV = () => {
    const items = filteredItems;
    const maxIngredients = getMaxIngredients(items);

    // Build header
    let headers = ['Nazwa', 'SKU'];
    for (let i = 1; i <= maxIngredients; i++) {
      headers.push(`Skladnik${i}_SKU`, `Skladnik${i}_Nazwa`, `Skladnik${i}_Ilosc`);
    }

    // Build rows
    const rows = items.map(item => {
      const row = [
        `"${(item.nazwa || '').replace(/"/g, '""')}"`,
        `"${(item.sku || '').replace(/"/g, '""')}"`
      ];

      for (let i = 0; i < maxIngredients; i++) {
        if (item.recipe && item.recipe[i]) {
          const r = item.recipe[i];
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
    link.download = `BOL_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Parse CSV file
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
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

      // Create preview with matching status
      const preview = parsed.map(row => {
        const matchedItem = currentItems.find(item =>
          (row.SKU && item.sku === row.SKU) ||
          (row.Nazwa && item.nazwa === row.Nazwa)
        );
        return {
          ...row,
          matched: !!matchedItem,
          matchedItem: matchedItem,
          ingredientCount: row.ingredients?.length || 0
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
    let successCount = 0;
    let errorCount = 0;

    for (const row of importPreview) {
      if (!row.matched || !row.matchedItem || row.ingredients.length === 0) {
        continue;
      }

      try {
        // First, clear existing recipe
        const existingRecipe = row.matchedItem.recipe || [];
        for (const ing of existingRecipe) {
          await fetch('/api/inventory/recipe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: row.matchedItem.id,
              ingredientId: ing.ingredient_id
            })
          });
        }

        // Then add new ingredients
        for (const ing of row.ingredients) {
          // Find ingredient by SKU or Nazwa in all warehouses
          let ingredientItem = null;
          for (const kategoria of ['polprodukty', 'wykroje', 'surowce']) {
            const found = magazyny[kategoria]?.find(item =>
              (ing.sku && item.sku === ing.sku) ||
              (ing.nazwa && item.nazwa === ing.nazwa)
            );
            if (found) {
              ingredientItem = found;
              break;
            }
          }

          if (ingredientItem) {
            await fetch('/api/inventory/recipe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: row.matchedItem.id,
                ingredientId: ingredientItem.id,
                quantity: ing.ilosc
              })
            });
          }
        }

        successCount++;
      } catch (err) {
        console.error('Error importing recipe:', err);
        errorCount++;
      }
    }

    setImporting(false);
    setShowImportModal(false);
    setImportData([]);
    setImportPreview([]);

    alert(`Import zakonczony!\nZaktualizowano: ${successCount}\nBledy: ${errorCount}`);
    fetchInventory();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">BOL - Bill of Lading (Receptury)</h1>
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
              Export CSV
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
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

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj po nazwie lub SKU..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredItems.length} pozycji
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nazwa produktu</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Receptura</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{item.nazwa}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{item.sku || '-'}</td>
                      <td className="px-4 py-3">
                        {item.recipe && item.recipe.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.recipe.map((r, idx) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-4xl w-full p-6 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import receptur z CSV</h3>
                <button
                  onClick={() => { setShowImportModal(false); setImportData([]); setImportPreview([]); }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Podglad importu:</strong> Znaleziono {importPreview.length} wierszy,
                  z czego {importPreview.filter(r => r.matched).length} dopasowanych do produktow w magazynie.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nazwa</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Skladniki ({'>'}0)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className={row.matched ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}>
                        <td className="px-3 py-2">
                          {row.matched ? (
                            <span className="text-green-600 dark:text-green-400">✓ Dopasowano</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">✗ Nie znaleziono</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{row.Nazwa}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono text-xs">{row.SKU}</td>
                        <td className="px-3 py-2">
                          {row.ingredientCount > 0 ? (
                            <span className="text-indigo-600 dark:text-indigo-400">{row.ingredientCount} skladnikow</span>
                          ) : (
                            <span className="text-gray-400">brak</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => { setShowImportModal(false); setImportData([]); setImportPreview([]); }}
                  className="flex-1 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || importPreview.filter(r => r.matched && r.ingredientCount > 0).length === 0}
                  className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {importing ? 'Importowanie...' : `Importuj ${importPreview.filter(r => r.matched && r.ingredientCount > 0).length} receptur`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
