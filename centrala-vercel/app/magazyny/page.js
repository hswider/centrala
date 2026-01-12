'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function MagazynyPage() {
  const [activeTab, setActiveTab] = useState('gotowe');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStanId, setEditingStanId] = useState(null);
  const [editingStanValue, setEditingStanValue] = useState('');
  const fileInputRef = useRef(null);
  const stanInputRef = useRef(null);

  const tabs = [
    { key: 'gotowe', label: 'Gotowe produkty', icon: '📦' },
    { key: 'polprodukty', label: 'Polprodukty', icon: '🔧' },
    { key: 'wykroje', label: 'Wykroje', icon: '✂️' },
    { key: 'surowce', label: 'Surowce', icon: '🪵' },
  ];

  const [magazyny, setMagazyny] = useState({
    gotowe: [],
    polprodukty: [],
    wykroje: [],
    surowce: [],
  });

  const [newItem, setNewItem] = useState({ sku: '', nazwa: '', stan: '' });

  // Pobierz dane z API
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      const data = await res.json();

      if (data.success) {
        setMagazyny(data.data);
      }
    } catch (error) {
      console.error('Blad pobierania danych:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Dodaj nowa pozycje
  const handleAddItem = async () => {
    if (!newItem.sku || !newItem.nazwa || !newItem.stan) return;

    setSaving(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: newItem.sku,
          nazwa: newItem.nazwa,
          stan: parseInt(newItem.stan) || 0,
          kategoria: activeTab
        })
      });

      const data = await res.json();

      if (data.success) {
        await fetchInventory();
        setNewItem({ sku: '', nazwa: '', stan: '' });
        setShowAddModal(false);
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (error) {
      alert('Blad: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Usun pozycje
  const handleDeleteItem = async (id) => {
    if (!confirm('Czy na pewno chcesz usunac te pozycje?')) return;

    try {
      const res = await fetch(`/api/inventory?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        await fetchInventory();
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (error) {
      alert('Blad: ' + error.message);
    }
  };

  // Edytuj pozycje
  const handleEditItem = (item) => {
    setEditingItem({ ...item });
    setShowEditModal(true);
  };

  // Zapisz edycje
  const handleSaveEdit = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          sku: editingItem.sku,
          nazwa: editingItem.nazwa,
          stan: parseInt(editingItem.stan) || 0
        })
      });

      const data = await res.json();

      if (data.success) {
        await fetchInventory();
        setShowEditModal(false);
        setEditingItem(null);
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (error) {
      alert('Blad: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Szybka edycja stanu (+/-) - optimistic update
  const handleQuickStanChange = (item, delta) => {
    const oldStan = item.stan;
    const newStan = Math.max(0, oldStan + delta);

    // Natychmiastowa aktualizacja UI (optimistic)
    setMagazyny(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(i =>
        i.id === item.id ? { ...i, stan: newStan } : i
      )
    }));

    // API w tle - bez await
    fetch('/api/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, stan: newStan })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          // Cofnij zmiane jesli API nie powiodlo sie
          setMagazyny(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].map(i =>
              i.id === item.id ? { ...i, stan: oldStan } : i
            )
          }));
        }
      })
      .catch(() => {
        // Cofnij zmiane przy bledzie sieci
        setMagazyny(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].map(i =>
            i.id === item.id ? { ...i, stan: oldStan } : i
          )
        }));
      });
  };

  // Inline edycja stanu - klikniecie w liczbe
  const handleStanClick = (item) => {
    setEditingStanId(item.id);
    setEditingStanValue(String(item.stan));
    // Focus na input po renderze
    setTimeout(() => stanInputRef.current?.select(), 0);
  };

  // Zapisz inline edycje stanu
  const handleStanSubmit = (item) => {
    const newStan = Math.max(0, parseInt(editingStanValue) || 0);
    const oldStan = item.stan;

    setEditingStanId(null);

    if (newStan === oldStan) return;

    // Optimistic update
    setMagazyny(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(i =>
        i.id === item.id ? { ...i, stan: newStan } : i
      )
    }));

    // API w tle
    fetch('/api/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, stan: newStan })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          setMagazyny(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].map(i =>
              i.id === item.id ? { ...i, stan: oldStan } : i
            )
          }));
        }
      })
      .catch(() => {
        setMagazyny(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].map(i =>
            i.id === item.id ? { ...i, stan: oldStan } : i
          )
        }));
      });
  };

  // Import z pliku
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        const items = [];
        for (let i = 0; i < lines.length; i++) {
          const cols = lines[i].split(/[,;\t]/);
          if (cols.length >= 3) {
            const sku = cols[0]?.trim();
            const nazwa = cols[1]?.trim();
            const stan = parseInt(cols[2]?.trim()) || 0;

            if (sku && nazwa) {
              items.push({ sku, nazwa, stan });
            }
          }
        }

        if (items.length > 0) {
          setSaving(true);
          const res = await fetch('/api/inventory/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items,
              kategoria: activeTab
            })
          });

          const data = await res.json();

          if (data.success) {
            await fetchInventory();
            alert(`Zaimportowano ${data.imported} z ${data.total} pozycji`);
          } else {
            alert('Blad: ' + data.error);
          }
          setSaving(false);
        } else {
          alert('Nie znaleziono poprawnych danych w pliku');
        }
      } catch (error) {
        alert('Blad podczas importu: ' + error.message);
        setSaving(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowImportModal(false);
  };

  const getTabLabel = (key) => {
    return tabs.find(t => t.key === key)?.label || key;
  };

  // Filtrowanie po wyszukiwaniu
  const currentItems = (magazyny[activeTab] || []).filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.sku.toLowerCase().includes(q) || item.nazwa.toLowerCase().includes(q);
  });

  const totalItems = currentItems.reduce((sum, item) => sum + item.stan, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-5xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Magazyny</h1>
            <p className="text-xs sm:text-sm text-gray-500">Zarzadzanie stanami magazynowymi</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Import CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Dodaj
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {tabs.map(tab => {
            const items = magazyny[tab.key] || [];
            const totalStan = items.reduce((sum, i) => sum + i.stan, 0);
            return (
              <div key={tab.key} className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">{tab.label}</p>
                <p className="text-2xl font-bold text-blue-600">{items.length}</p>
                <p className="text-xs text-gray-400">{totalStan} szt. lacznie</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors whitespace-nowrap px-4 ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{getTabLabel(activeTab)}</h2>
              <p className="text-xs text-gray-500">Laczny stan: {totalItems} szt.</p>
            </div>
            <input
              type="text"
              placeholder="Szukaj SKU lub nazwy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="px-4 py-12 text-center text-gray-500">
              Ladowanie danych...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa produktu</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stan</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        {searchQuery
                          ? 'Brak wynikow dla wyszukiwania'
                          : 'Brak pozycji w magazynie. Dodaj recznie lub zaimportuj z CSV.'}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-900">{item.sku}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.nazwa}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleQuickStanChange(item, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                              title="Zmniejsz o 1"
                            >
                              -
                            </button>
                            {editingStanId === item.id ? (
                              <input
                                ref={stanInputRef}
                                type="number"
                                value={editingStanValue}
                                onChange={(e) => setEditingStanValue(e.target.value)}
                                onBlur={() => handleStanSubmit(item)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleStanSubmit(item);
                                  if (e.key === 'Escape') setEditingStanId(null);
                                }}
                                className="w-16 px-2 py-1 text-center text-sm font-bold border-2 border-blue-500 rounded focus:outline-none"
                                min="0"
                              />
                            ) : (
                              <button
                                onClick={() => handleStanClick(item)}
                                className={`px-3 py-1 rounded text-sm font-bold min-w-[50px] text-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${
                                  item.stan <= 10 ? 'bg-red-100 text-red-800' :
                                  item.stan <= 30 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}
                                title="Kliknij aby edytowac"
                              >
                                {item.stan}
                              </button>
                            )}
                            <button
                              onClick={() => handleQuickStanChange(item, 1)}
                              className="w-7 h-7 flex items-center justify-center bg-green-100 text-green-700 rounded hover:bg-green-200 font-bold"
                              title="Zwieksz o 1"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edytuj
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Usun
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Dodaj pozycje do: {getTabLabel(activeTab)}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="np. MIKI-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa produktu</label>
                  <input
                    type="text"
                    value={newItem.nazwa}
                    onChange={(e) => setNewItem({ ...newItem, nazwa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="np. Pufa Miki Rosa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stan</label>
                  <input
                    type="number"
                    value={newItem.stan}
                    onChange={(e) => setNewItem({ ...newItem, stan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="np. 25"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Zapisywanie...' : 'Dodaj'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Edytuj pozycje</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingItem.sku}
                    onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa produktu</label>
                  <input
                    type="text"
                    value={editingItem.nazwa}
                    onChange={(e) => setEditingItem({ ...editingItem, nazwa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stan</label>
                  <input
                    type="number"
                    value={editingItem.stan}
                    onChange={(e) => setEditingItem({ ...editingItem, stan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Import z CSV do: {getTabLabel(activeTab)}</h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Instrukcja importu:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Przygotuj plik Excel lub CSV</li>
                  <li><strong>Kolumna A (1):</strong> SKU produktu</li>
                  <li><strong>Kolumna B (2):</strong> Nazwa produktu</li>
                  <li><strong>Kolumna C (3):</strong> Stan magazynowy (liczba)</li>
                  <li>Zapisz jako CSV (rozdzielany przecinkami lub srednikami)</li>
                  <li>Nie dodawaj naglowkow - zacznij od danych</li>
                </ol>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Przyklad:</h4>
                <code className="text-xs text-gray-600 block">
                  MIKI-001;Pufa Miki Rosa;25<br />
                  MIKI-002;Pufa Miki Blue;18<br />
                  LAW-001;Lawka ogrodowa;12
                </code>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Uwaga:</strong> Jesli SKU juz istnieje w tej kategorii, dane zostana zaktualizowane.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  Anuluj
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Importowanie...' : 'Wybierz plik CSV'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
