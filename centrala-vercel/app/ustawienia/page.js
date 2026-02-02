'use client';

import { useState, useEffect } from 'react';

export default function UstawieniaPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/login')
      .then(res => res.json())
      .then(data => { if (data.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>⚙️</span> Ustawienia
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Konfiguracja systemu Centrala POOM</p>
      </div>

      <div className="space-y-6">
        {/* Informacje o uzytkowniku */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profil uzytkownika</h2>
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Nazwa:</span>
                <span className="text-sm text-gray-900 dark:text-white">{user.username || user.name || '-'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Rola:</span>
                <span className="text-sm text-gray-900 dark:text-white">{user.role || '-'}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Ladowanie...</p>
          )}
        </div>

        {/* Informacje o systemie */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informacje o systemie</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Aplikacja:</span>
              <span className="text-sm text-gray-900 dark:text-white">Centrala POOM</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">ERP:</span>
              <span className="text-sm text-gray-900 dark:text-white">Apilo (poom.apilo.com)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Framework:</span>
              <span className="text-sm text-gray-900 dark:text-white">Next.js + Vercel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
