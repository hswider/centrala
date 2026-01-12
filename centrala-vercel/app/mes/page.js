'use client';

export default function MESPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">MES - System Produkcyjny</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manufacturing Execution System</p>
        </div>

        {/* Placeholder */}
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">W przygotowaniu</h2>
          <p className="text-gray-500">
            Modul MES jest w trakcie rozwoju. Wkrotce pojawia sie tutaj funkcje zarzadzania produkcja.
          </p>
        </div>
      </main>
    </div>
  );
}
