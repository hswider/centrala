'use client';

import { useState, useRef } from 'react';

export default function MagazynyPage() {
  const [activeTab, setActiveTab] = useState('gotowe');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef(null);

  const tabs = [
    { key: 'gotowe', label: 'Gotowe produkty', icon: '📦' },
    { key: 'polprodukty', label: 'Polprodukty', icon: '🔧' },
    { key: 'wykroje', label: 'Wykroje', icon: '✂️' },
    { key: 'surowce', label: 'Surowce', icon: '🪵' },
  ];

  // Sample data - will be replaced with API data
  const [magazyny, setMagazyny] = useState({
    gotowe: [
      { id: 1, sku: 'MIKI-001', nazwa: 'Pufa Miki Rosa', stan: 25 },
      { id: 2, sku: 'MIKI-002', nazwa: 'Pufa Miki Blue', stan: 18 },
      { id: 3, sku: 'LAW-001', nazwa: 'Lawka ogrodowa 150cm', stan: 12 },
    ],
    polprodukty: [
      { id: 1, sku: 'PP-001', nazwa: 'Szkielet pufy Miki', stan: 45 },
      { id: 2, sku: 'PP-002', nazwa: 'Nogi lawki drewniane', stan: 30 },
    ],
    wykroje: [
      { id: 1, sku: 'WK-001', nazwa: 'Wykroj pufa Miki uszy', stan: 100 },
      { id: 2, sku: 'WK-002', nazwa: 'Wykroj pufa Miki korpus', stan: 85 },
    ],
    surowce: [
      { id: 1, sku: 'SR-001', nazwa: 'Tkanina welurowa Rosa', stan: 150 },
      { id: 2, sku: 'SR-002', nazwa: 'Tkanina welurowa Blue', stan: 120 },
      { id: 3, sku: 'SR-003', nazwa: 'Drewno sosnowe', stan: 500 },
      { id: 4, sku: 'SR-004', nazwa: 'Granulat styropianowy', stan: 200 },
    ],
  });

  const [newItem, setNewItem] = useState({ sku: '', nazwa: '', stan: '' });

  const handleAddItem = () => {
    if (!newItem.sku || !newItem.nazwa || !newItem.stan) return;

    const item = {
      id: Date.now(),
      sku: newItem.sku,
      nazwa: newItem.nazwa,
      stan: parseInt(newItem.stan) || 0,
    };

    setMagazyny(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], item]
    }));

    setNewItem({ sku: '', nazwa: '', stan: '' });
    setShowAddModal(false);
  };

  const handleDeleteItem = (id) => {
    setMagazyny(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(item => item.id !== id)
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // Simple CSV parsing (Excel saved as CSV)
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        const newItems = [];
        for (let i = 0; i < lines.length; i++) {
          const cols = lines[i].split(/[,;\t]/);
          if (cols.length >= 3) {
            const sku = cols[0]?.trim();
            const nazwa = cols[1]?.trim();
            const stan = parseInt(cols[2]?.trim()) || 0;

            if (sku && nazwa) {
              newItems.push({
                id: Date.now() + i,
                sku,
                nazwa,
                stan
              });
            }
          }
        }

        if (newItems.length > 0) {
          setMagazyny(prev => ({
            ...prev,
            [activeTab]: [...prev[activeTab], ...newItems]
          }));
          alert(`Zaimportowano ${newItems.length} pozycji`);
        } else {
          alert('Nie znaleziono poprawnych danych w pliku');
        }
      } catch (error) {
        alert('Blad podczas importu: ' + error.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowImportModal(false);
  };

  const getTabLabel = (key) => {
    return tabs.find(t => t.key === key)?.label || key;
  };

  const currentItems = magazyny[activeTab] || [];
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
              Import Excel
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
          {tabs.map(tab => (
            <div key={tab.key} className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-500">{tab.label}</p>
              <p className="text-2xl font-bold text-blue-600">
                {magazyny[tab.key]?.length || 0}
              </p>
              <p className="text-xs text-gray-400">pozycji</p>
            </div>
          ))}
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
              placeholder="Szukaj SKU..."
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
                      Brak pozycji w magazynie. Dodaj recznie lub zaimportuj z Excel.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-900">{item.sku}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.nazwa}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          item.stan <= 10 ? 'bg-red-100 text-red-800' :
                          item.stan <= 30 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.stan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Usun
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Dodaj
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Import z Excel do: {getTabLabel(activeTab)}</h3>

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
                >
                  Anuluj
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Wybierz plik CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
