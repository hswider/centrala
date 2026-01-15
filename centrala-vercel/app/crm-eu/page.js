'use client';

import { useState } from 'react';

export default function CRMEUPage() {
  const [activeTab, setActiveTab] = useState('wiadomosci');

  const tabs = [
    // Tu beda dodane kanaly sprzedazy EU
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">CRM EU</h1>
            <p className="text-xs sm:text-sm text-gray-500">Zarzadzanie klientami i wiadomosciami - rynki europejskie</p>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="mb-4">
            <span className="text-6xl">🇪🇺</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">CRM dla rynkow europejskich</h3>
          <p className="text-gray-500">
            Tu beda dodane kanaly sprzedazy dla rynkow EU (Amazon DE, Kaufland, eBay, etc.)
          </p>
        </div>
      </main>
    </div>
  );
}
