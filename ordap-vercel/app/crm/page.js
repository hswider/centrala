'use client';

import { useState } from 'react';

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState('klienci');

  const tabs = [
    { key: 'klienci', label: 'Klienci', icon: '👥' },
    { key: 'kontakty', label: 'Kontakty', icon: '📞' },
    { key: 'notatki', label: 'Notatki', icon: '📝' },
  ];

  // Przykładowe dane klientów
  const [klienci] = useState([
    { id: 1, nazwa: 'Jan Kowalski', email: 'jan@example.com', telefon: '+48 123 456 789', zamowienia: 12, wartosc: 4520 },
    { id: 2, nazwa: 'Anna Nowak', email: 'anna@example.com', telefon: '+48 987 654 321', zamowienia: 8, wartosc: 2890 },
    { id: 3, nazwa: 'Firma ABC Sp. z o.o.', email: 'kontakt@abc.pl', telefon: '+48 111 222 333', zamowienia: 24, wartosc: 15600 },
  ]);

  // Przykładowe kontakty
  const [kontakty] = useState([
    { id: 1, klient: 'Jan Kowalski', typ: 'Telefon', data: '2025-01-10', notatka: 'Pytanie o status zamówienia' },
    { id: 2, klient: 'Firma ABC Sp. z o.o.', typ: 'Email', data: '2025-01-09', notatka: 'Reklamacja - uszkodzona przesyłka' },
    { id: 3, klient: 'Anna Nowak', typ: 'Telefon', data: '2025-01-08', notatka: 'Zamówienie indywidualne' },
  ]);

  // Przykładowe notatki
  const [notatki] = useState([
    { id: 1, klient: 'Jan Kowalski', data: '2025-01-10', tresc: 'Stały klient, preferuje płatność przy odbiorze' },
    { id: 2, klient: 'Firma ABC Sp. z o.o.', data: '2025-01-05', tresc: 'Duży klient B2B, wymaga faktury VAT' },
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-5xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">CRM</h1>
            <p className="text-xs sm:text-sm text-gray-500">Zarządzanie klientami</p>
          </div>
          <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Dodaj klienta
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Klienci */}
          {activeTab === 'klienci' && (
            <div>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Lista klientów</h2>
                <input
                  type="text"
                  placeholder="Szukaj..."
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Zamówienia</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Wartość</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {klienci.map((klient) => (
                      <tr key={klient.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{klient.nazwa}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{klient.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{klient.telefon}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {klient.zamowienia}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {klient.wartosc.toLocaleString('pl-PL')} zł
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">Szczegóły</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Kontakty */}
          {activeTab === 'kontakty' && (
            <div>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Historia kontaktów</h2>
                <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  + Nowy kontakt
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {kontakty.map((kontakt) => (
                  <div key={kontakt.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            kontakt.typ === 'Telefon'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {kontakt.typ}
                          </span>
                          <span className="font-medium text-gray-900">{kontakt.klient}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{kontakt.notatka}</p>
                      </div>
                      <span className="text-xs text-gray-500">{kontakt.data}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notatki */}
          {activeTab === 'notatki' && (
            <div>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Notatki</h2>
                <button className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                  + Nowa notatka
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {notatki.map((notatka) => (
                  <div key={notatka.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{notatka.klient}</div>
                        <p className="mt-1 text-sm text-gray-600">{notatka.tresc}</p>
                      </div>
                      <span className="text-xs text-gray-500">{notatka.data}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{klienci.length}</p>
            <p className="text-xs text-gray-500">Klientów</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{kontakty.length}</p>
            <p className="text-xs text-gray-500">Kontaktów</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{notatki.length}</p>
            <p className="text-xs text-gray-500">Notatek</p>
          </div>
        </div>
      </main>
    </div>
  );
}
