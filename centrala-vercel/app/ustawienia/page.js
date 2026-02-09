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
  const [couriers, setCouriers] = useState([]);
  const [courierLoading, setCourierLoading] = useState(true);
  const [editingCourier, setEditingCourier] = useState(null);
  const [courierForm, setCourierForm] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    try {
      const res = await fetch('/api/couriers/credentials');
      const data = await res.json();
      if (data.success) {
        setCouriers(data.credentials || []);
      }
    } catch (err) {
      console.error('Error fetching couriers:', err);
    } finally {
      setCourierLoading(false);
    }
  };

  const handleEditCourier = (courier) => {
    setEditingCourier(courier.courier);
    setCourierForm({
      api_key: '',
      api_secret: '',
      account_number: courier.account_number || '',
      environment: courier.environment || 'sandbox'
    });
    setTestResult(null);
  };

  const handleSaveCourier = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/couriers/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier: editingCourier,
          ...courierForm
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingCourier(null);
        fetchCouriers();
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (err) {
      alert('Blad zapisu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestCourier = async (courier) => {
    setTestResult({ courier, loading: true });
    try {
      const res = await fetch('/api/couriers/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courier })
      });
      const data = await res.json();
      setTestResult({ courier, ...data, loading: false });
    } catch (err) {
      setTestResult({ courier, success: false, error: err.message, loading: false });
    }
  };

  const COURIER_INFO = {
    inpost: { name: 'InPost', logo: 'https://inpost.pl/sites/default/files/logo_inpost.svg', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    dhl_parcel: { name: 'DHL Parcel', logo: 'https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    dhl_express: { name: 'DHL Express', logo: 'https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    ups: { name: 'UPS', logo: 'https://www.ups.com/assets/resources/webcontent/images/ups-logo.svg', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' }
  };

  const isAdmin = user && ['it_admin', 'it_administrator', 'admin'].includes(user.role);

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

        {/* Integracje kurierskie - tylko dla adminow */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🚚</span> Integracje kurierskie
            </h2>

            {courierLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Ladowanie...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {couriers.map(courier => {
                  const info = COURIER_INFO[courier.courier] || { name: courier.courier, icon: '📦', color: 'bg-gray-100' };
                  const isEditing = editingCourier === courier.courier;

                  return (
                    <div key={courier.courier} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img src={info.logo} alt={info.name} className="w-10 h-10 object-contain" />
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{info.name}</h3>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${courier.has_credentials ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                              {courier.has_credentials ? 'Skonfigurowany' : 'Nieskonfigurowany'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {courier.has_credentials && (
                            <button
                              onClick={() => handleTestCourier(courier.courier)}
                              disabled={testResult?.courier === courier.courier && testResult?.loading}
                              className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-50"
                            >
                              {testResult?.courier === courier.courier && testResult?.loading ? 'Testowanie...' : 'Test'}
                            </button>
                          )}
                          <button
                            onClick={() => isEditing ? setEditingCourier(null) : handleEditCourier(courier)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            {isEditing ? 'Anuluj' : 'Edytuj'}
                          </button>
                        </div>
                      </div>

                      {/* Test result */}
                      {testResult?.courier === courier.courier && !testResult.loading && (
                        <div className={`mb-3 p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                          {testResult.success ? testResult.message : testResult.error}
                        </div>
                      )}

                      {/* Edit form */}
                      {isEditing && (
                        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">API Key</label>
                              <input
                                type="password"
                                value={courierForm.api_key}
                                onChange={e => setCourierForm({ ...courierForm, api_key: e.target.value })}
                                placeholder={courier.api_key || 'Wprowadz API Key'}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">API Secret</label>
                              <input
                                type="password"
                                value={courierForm.api_secret}
                                onChange={e => setCourierForm({ ...courierForm, api_secret: e.target.value })}
                                placeholder={courier.api_secret || 'Wprowadz API Secret'}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Numer konta</label>
                              <input
                                type="text"
                                value={courierForm.account_number}
                                onChange={e => setCourierForm({ ...courierForm, account_number: e.target.value })}
                                placeholder="Numer konta kuriera"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Srodowisko</label>
                              <select
                                value={courierForm.environment}
                                onChange={e => setCourierForm({ ...courierForm, environment: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="sandbox">Sandbox (testowe)</option>
                                <option value="production">Produkcja</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={handleSaveCourier}
                              disabled={saving}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                            >
                              {saving ? 'Zapisywanie...' : 'Zapisz'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Info */}
                      {!isEditing && courier.has_credentials && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <div>Srodowisko: <span className={courier.environment === 'production' ? 'text-green-600 font-medium' : 'text-yellow-600'}>{courier.environment === 'production' ? 'Produkcja' : 'Sandbox'}</span></div>
                          {courier.account_number && <div>Konto: {courier.account_number}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
