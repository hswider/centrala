'use client';

import { useState, useEffect } from 'react';

// Mapowanie uzytkownikow na custom role i opisy
const USER_PROFILES = {
  'Administrator': {
    displayName: 'Administrator',
    customRole: 'Administrator systemu',
    description: 'Pelny dostep do wszystkich modulow i zarzadzania uzytkownikami',
    icon: '👑',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  },
  'hswider': {
    displayName: 'Hubert Swider',
    customRole: 'Programista / DevOps',
    description: 'Rozwoj aplikacji, integracje API, utrzymanie infrastruktury',
    icon: '💻',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  }
};

// Domyslny profil dla niezmapowanych uzytkownikow
const DEFAULT_PROFILE = {
  displayName: null,
  customRole: 'Uzytkownik',
  description: 'Standardowy dostep do przypisanych modulow',
  icon: '👤',
  color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
};

// Mapowanie uprawnien na czytelne nazwy i kolory
const PERMISSION_MAP = {
  'dashboard': { label: 'Dashboard', icon: '📊', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  'oms': { label: 'OMS', icon: '📦', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  'wms': { label: 'WMS', icon: '🏭', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  'mes': { label: 'MES', icon: '⚙️', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  'mts': { label: 'MTS', icon: '📋', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  'dms': { label: 'DMS', icon: '📄', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  'ecom': { label: 'ECOM', icon: '🖥️', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  'crm': { label: 'CRM PL', icon: '👥', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  'crm-eu': { label: 'CRM EU', icon: '👥', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
  'rank': { label: 'RANK', icon: '📈', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  'agent': { label: 'Asystent AI', icon: '🤖', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  'admin': { label: 'Admin', icon: '🔐', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export default function UstawieniaPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const profile = user ? (USER_PROFILES[user.username] || DEFAULT_PROFILE) : null;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>⚙️</span> Ustawienia
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Konfiguracja systemu Centrala POOM</p>
      </div>

      <div className="space-y-6">
        {/* Profil uzytkownika */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profil uzytkownika</h2>
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Ladowanie...</span>
            </div>
          ) : user && profile ? (
            <div className="space-y-4">
              {/* Naglowek profilu */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
                  {profile.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {profile.displayName || user.username}
                  </h3>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.color}`}>
                    {profile.customRole}
                  </span>
                </div>
              </div>

              {/* Szczegoly */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Login:</span>
                  <span className="text-sm text-gray-900 dark:text-white font-mono">{user.username}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Rola systemowa:</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {user.role}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32 pt-0.5">Opis:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{profile.description}</span>
                </div>
              </div>

              {/* Uprawnienia */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-3">Dostep do modulow:</span>
                <div className="flex flex-wrap gap-2">
                  {(user.permissions || []).map(perm => {
                    const permInfo = PERMISSION_MAP[perm] || { label: perm, icon: '📁', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
                    return (
                      <span key={perm} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${permInfo.color}`}>
                        <span>{permInfo.icon}</span>
                        {permInfo.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nie zalogowano</p>
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
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Framework:</span>
              <span className="text-sm text-gray-900 dark:text-white">Next.js + Vercel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
