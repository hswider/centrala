'use client';

import { useState } from 'react';

export default function WMSPage() {
  const [activeTab, setActiveTab] = useState('stan');

  const tabs = [
    { key: 'stan', label: 'Stan magazynu', icon: '📦' },
    { key: 'lokalizacje', label: 'Lokalizacje', icon: '📍' },
    { key: 'przyjecia', label: 'Przyjęcia', icon: '📥' },
    { key: 'wydania', label: 'Wydania', icon: '📤' },
  ];

  // Przykładowe dane - stan magazynu
  const [produkty] = useState([
    { id: 1, sku: 'PAL-001', nazwa: 'Paleta drewniana 120x80', lokalizacja: 'A-01-01', stan: 45, min: 20, max: 100 },
    { id: 2, sku: 'PIK-002', nazwa: 'Pikówka standard', lokalizacja: 'B-02-03', stan: 12, min: 15, max: 50 },
    { id: 3, sku: 'LAW-003', nazwa: 'Ławka ogrodowa 150cm', lokalizacja: 'C-01-02', stan: 8, min: 5, max: 30 },
    { id: 4, sku: 'LEG-004', nazwa: 'Legowisko dla psa L', lokalizacja: 'D-03-01', stan: 23, min: 10, max: 40 },
    { id: 5, sku: 'KID-005', nazwa: 'Krzesełko dziecięce', lokalizacja: 'E-01-01', stan: 3, min: 10, max: 25 },
  ]);

  // Przykładowe lokalizacje
  const [lokalizacje] = useState([
    { id: 1, kod: 'A-01-01', typ: 'Palety', pojemnosc: 20, zajete: 15, produkty: 3 },
    { id: 2, kod: 'A-01-02', typ: 'Palety', pojemnosc: 20, zajete: 20, produkty: 4 },
    { id: 3, kod: 'B-02-03', typ: 'Półki', pojemnosc: 50, zajete: 32, produkty: 8 },
    { id: 4, kod: 'C-01-02', typ: 'Palety', pojemnosc: 15, zajete: 8, produkty: 2 },
    { id: 5, kod: 'D-03-01', typ: 'Półki', pojemnosc: 40, zajete: 23, produkty: 5 },
  ]);

  // Przykładowe przyjęcia
  const [przyjecia] = useState([
    { id: 1, numer: 'PZ/2025/001', data: '2025-01-11', dostawca: 'Dostawca A', pozycje: 5, status: 'Nowe' },
    { id: 2, numer: 'PZ/2025/002', data: '2025-01-10', dostawca: 'Dostawca B', pozycje: 12, status: 'W trakcie' },
    { id: 3, numer: 'PZ/2025/003', data: '2025-01-09', dostawca: 'Dostawca A', pozycje: 3, status: 'Zakończone' },
  ]);

  // Przykładowe wydania
  const [wydania] = useState([
    { id: 1, numer: 'WZ/2025/001', data: '2025-01-11', zamowienie: '#12345', pozycje: 3, status: 'Do pobrania' },
    { id: 2, numer: 'WZ/2025/002', data: '2025-01-11', zamowienie: '#12346', pozycje: 1, status: 'Do pobrania' },
    { id: 3, numer: 'WZ/2025/003', data: '2025-01-10', zamowienie: '#12340', pozycje: 5, status: 'Pobrane' },
    { id: 4, numer: 'WZ/2025/004', data: '2025-01-10', zamowienie: '#12339', pozycje: 2, status: 'Wysłane' },
  ]);

  const getStanColor = (stan, min) => {
    if (stan <= min) return 'bg-red-100 text-red-800';
    if (stan <= min * 1.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Nowe':
      case 'Do pobrania':
        return 'bg-blue-100 text-blue-800';
      case 'W trakcie':
      case 'Pobrane':
        return 'bg-yellow-100 text-yellow-800';
      case 'Zakończone':
      case 'Wysłane':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getZajecieColor = (zajete, pojemnosc) => {
    const procent = (zajete / pojemnosc) * 100;
    if (procent >= 90) return 'bg-red-500';
    if (procent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-5xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">WMS</h1>
            <p className="text-xs sm:text-sm text-gray-500">Zarządzanie magazynem</p>
          </div>
          <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Nowa operacja
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">Produktów</p>
            <p className="text-2xl font-bold text-blue-600">{produkty.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">Lokalizacji</p>
            <p className="text-2xl font-bold text-purple-600">{lokalizacje.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">Do przyjęcia</p>
            <p className="text-2xl font-bold text-green-600">{przyjecia.filter(p => p.status !== 'Zakończone').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">Do wydania</p>
            <p className="text-2xl font-bold text-orange-600">{wydania.filter(w => w.status === 'Do pobrania').length}</p>
          </div>
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
          {/* Stan magazynu */}
          {activeTab === 'stan' && (
            <div>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Stan magazynowy</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokalizacja</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stan</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Min/Max</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {produkty.map((produkt) => (
                      <tr key={produkt.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-900">{produkt.sku}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{produkt.nazwa}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                            {produkt.lokalizacja}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getStanColor(produkt.stan, produkt.min)}`}>
                            {produkt.stan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">
                          {produkt.min} / {produkt.max}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-blue-600 hover:text-blue-800 text-sm mr-2">+</button>
                          <button className="text-red-600 hover:text-red-800 text-sm">-</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lokalizacje */}
          {activeTab === 'lokalizacje' && (
            <div>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Lokalizacje magazynowe</h2>
                <button className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  + Dodaj lokalizację
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {lokalizacje.map((lok) => (
                  <div key={lok.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono font-bold text-lg text-gray-900">{lok.kod}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{lok.typ}</span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Zajętość</span>
                        <span>{lok.zajete}/{lok.pojemnosc}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getZajecieColor(lok.zajete, lok.pojemnosc)}`}
                          style={{ width: `${(lok.zajete / lok.pojemnosc) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Produktów: <span className="font-medium text-gray-700">{lok.produkty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Przyjęcia */}
          {activeTab === 'przyjecia' && (
            <div>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Przyjęcia towaru</h2>
                <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  + Nowe przyjęcie
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {przyjecia.map((pz) => (
                  <div key={pz.id} className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium text-gray-900">{pz.numer}</div>
                        <div className="text-xs text-gray-500">{pz.dostawca}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-700">{pz.pozycje} pozycji</div>
                        <div className="text-xs text-gray-500">{pz.data}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(pz.status)}`}>
                        {pz.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wydania */}
          {activeTab === 'wydania' && (
            <div>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Wydania towaru</h2>
                <button className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  + Nowe wydanie
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {wydania.map((wz) => (
                  <div key={wz.id} className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium text-gray-900">{wz.numer}</div>
                        <div className="text-xs text-gray-500">Zamówienie: {wz.zamowienie}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-700">{wz.pozycje} pozycji</div>
                        <div className="text-xs text-gray-500">{wz.data}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(wz.status)}`}>
                        {wz.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
