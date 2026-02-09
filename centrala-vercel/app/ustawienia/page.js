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

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    courier: 'dhl_parcel',
    service_type: '',
    length_cm: 30,
    width_cm: 20,
    height_cm: 10,
    weight_kg: 1,
    content_description: '',
    is_default: false
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchCouriers();
    fetchTemplates();
  }, []);

  const fetchCouriers = async () => {
    try {
      // Fetch carrier accounts from Apilo
      const res = await fetch('/api/apilo/carriers?type=accounts');
      const data = await res.json();
      if (data.success) {
        setCouriers(data.accounts || []);
      }
    } catch (err) {
      console.error('Error fetching couriers from Apilo:', err);
    } finally {
      setCourierLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/couriers/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      courier: 'dhl_parcel',
      service_type: '',
      length_cm: 30,
      width_cm: 20,
      height_cm: 10,
      weight_kg: 1,
      content_description: '',
      is_default: false
    });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      courier: template.courier,
      service_type: template.service_type || '',
      length_cm: parseFloat(template.length_cm) || 30,
      width_cm: parseFloat(template.width_cm) || 20,
      height_cm: parseFloat(template.height_cm) || 10,
      weight_kg: parseFloat(template.weight_kg) || 1,
      content_description: template.content_description || '',
      is_default: template.is_default || false
    });
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      const method = editingTemplate ? 'PUT' : 'POST';
      const body = editingTemplate ? { id: editingTemplate.id, ...templateForm } : templateForm;

      const res = await fetch('/api/couriers/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setShowTemplateModal(false);
        fetchTemplates();
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (err) {
      alert('Blad zapisu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Czy na pewno chcesz usunac ten szablon?')) return;
    try {
      const res = await fetch(`/api/couriers/templates?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTemplates();
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (err) {
      alert('Blad usuwania: ' + err.message);
    }
  };

  // Courier-specific form fields configuration
  const COURIER_FIELDS = {
    dhl_parcel: {
      fields: [
        { key: 'login', label: 'Login (WebAPI v2)', type: 'text', required: true, help: 'Login otrzymany w emailu od DHL po złożeniu wniosku' },
        { key: 'password', label: 'Haslo (WebAPI v2)', type: 'password', required: true, help: 'Hasło do WebAPI v2' },
        { key: 'sap_number', label: 'Numer klienta SAP', type: 'text', required: true, help: 'Numer klienta SAP z konta DHL24' },
        { key: 'label_type', label: 'Typ etykiety', type: 'select', options: [
          { value: 'BLP', label: 'Etykieta BLP' },
          { value: 'ZBLP', label: 'Etykieta ZBLP' },
          { value: 'LP', label: 'Etykieta LP' }
        ], default: 'BLP' },
        { key: 'permanent_pickup', label: 'Staly odbior', type: 'checkbox', help: 'Czy firma ma umowę na stały odbiór z DHL?' },
        { key: 'auto_insurance', label: 'Auto ubezpieczenie', type: 'checkbox', help: 'Automatyczne uzupełnienie wartości ubezpieczenia' },
        { key: 'multi_package', label: 'Obsługa multi-paczek', type: 'checkbox', help: 'Wysyłka wielu przesyłek jednocześnie' }
      ]
    },
    dhl_express: {
      fields: [
        { key: 'api_key', label: 'API Key', type: 'password', required: true },
        { key: 'api_secret', label: 'API Secret', type: 'password', required: true },
        { key: 'account_number', label: 'Numer konta DHL Express', type: 'text', required: true }
      ]
    },
    inpost: {
      fields: [
        { key: 'api_token', label: 'Token API (Bearer)', type: 'password', required: true, help: 'Token z panelu ShipX' },
        { key: 'organization_id', label: 'ID organizacji', type: 'text', help: 'Opcjonalne - ID organizacji w ShipX' }
      ]
    },
    ups: {
      fields: [
        { key: 'client_id', label: 'Client ID', type: 'password', required: true, help: 'OAuth2 Client ID' },
        { key: 'client_secret', label: 'Client Secret', type: 'password', required: true, help: 'OAuth2 Client Secret' },
        { key: 'account_number', label: 'Numer konta UPS', type: 'text', required: true }
      ]
    }
  };

  const handleEditCourier = (courier) => {
    setEditingCourier(courier.courier);
    const extraConfig = courier.extra_config || {};
    const courierFields = COURIER_FIELDS[courier.courier]?.fields || [];

    // Initialize form with existing values or defaults
    const initialForm = {
      environment: courier.environment || 'sandbox'
    };

    courierFields.forEach(field => {
      if (field.type === 'checkbox') {
        initialForm[field.key] = extraConfig[field.key] || false;
      } else if (field.type === 'select') {
        initialForm[field.key] = extraConfig[field.key] || field.default || '';
      } else {
        initialForm[field.key] = ''; // Don't show existing secrets
      }
    });

    // For display purposes, show masked values
    initialForm._existing = {};
    courierFields.forEach(field => {
      if (extraConfig[field.key]) {
        if (field.type === 'password' || field.type === 'text') {
          initialForm._existing[field.key] = true;
        }
      }
    });

    setCourierForm(initialForm);
    setTestResult(null);
  };

  const handleSaveCourier = async () => {
    setSaving(true);
    try {
      // Build extra_config from courier-specific fields
      const courierFields = COURIER_FIELDS[editingCourier]?.fields || [];
      const extra_config = {};

      courierFields.forEach(field => {
        const value = courierForm[field.key];
        // Only include if value is set (for passwords, only if user entered something new)
        if (field.type === 'checkbox') {
          extra_config[field.key] = value;
        } else if (field.type === 'select') {
          extra_config[field.key] = value;
        } else if (value && value.trim()) {
          extra_config[field.key] = value.trim();
        }
      });

      const res = await fetch('/api/couriers/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier: editingCourier,
          environment: courierForm.environment,
          extra_config
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

        {/* Integracje kurierskie - przez Apilo */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🚚</span> Integracje kurierskie
            </h2>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 text-xl">ℹ️</span>
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Integracja przez Apilo</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Kurierzy sa konfigurowani w panelu Apilo. Wszystkie przesylki tworzone w Centrali beda automatycznie
                    synchronizowane z Apilo i wykorzystywac skonfigurowane tam integracje kurierskie.
                  </p>
                  <a
                    href="https://poom.apilo.com/admin/courier"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    Otworz panel Apilo
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {courierLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Ladowanie kurierow z Apilo...</span>
              </div>
            ) : couriers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Brak skonfigurowanych kurierow. Dodaj integracje w panelu Apilo.
              </p>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Skonfigurowane integracje:</h3>
                {couriers.map(courier => {
                  const info = COURIER_INFO[courier.courier] || { name: courier.courier || courier.name, logo: null, color: 'bg-gray-100' };

                  return (
                    <div key={courier.courier || courier.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      {info.logo ? (
                        <img src={info.logo} alt={info.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-xs">📦</div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{courier.name || info.name}</div>
                        {courier.environment && (
                          <span className={`text-xs ${courier.environment === 'production' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {courier.environment === 'production' ? 'Produkcja' : 'Sandbox'}
                          </span>
                        )}
                      </div>
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">
                        Aktywny
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Szablony paczek - tylko dla adminow */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📐</span> Szablony paczek
              </h2>
              <button
                onClick={handleNewTemplate}
                className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Nowy szablon
              </button>
            </div>

            {templatesLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Ladowanie...</span>
              </div>
            ) : templates.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Brak szablonow. Kliknij "Nowy szablon" aby dodac.</p>
            ) : (
              <div className="space-y-2">
                {templates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img src={COURIER_INFO[template.courier]?.logo} alt="" className="w-8 h-8 object-contain" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {template.name}
                          {template.is_default && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">Domyslny</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {template.length_cm}×{template.width_cm}×{template.height_cm} cm • {template.weight_kg} kg
                          {template.content_description && ` • ${template.content_description}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        Usun
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTemplate ? 'Edytuj szablon' : 'Nowy szablon'}
              </h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nazwa szablonu *</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="np. DHL 30x40x5 foliopak"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kurier *</label>
                <select
                  value={templateForm.courier}
                  onChange={e => setTemplateForm({ ...templateForm, courier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="dhl_parcel">DHL Parcel</option>
                  <option value="dhl_express">DHL Express</option>
                  <option value="inpost">InPost</option>
                  <option value="ups">UPS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wymiary (cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={templateForm.length_cm}
                    onChange={e => setTemplateForm({ ...templateForm, length_cm: e.target.value })}
                    placeholder="Dlugosc"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={templateForm.width_cm}
                    onChange={e => setTemplateForm({ ...templateForm, width_cm: e.target.value })}
                    placeholder="Szerokosc"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={templateForm.height_cm}
                    onChange={e => setTemplateForm({ ...templateForm, height_cm: e.target.value })}
                    placeholder="Wysokosc"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1 text-center">dlugosc × szerokosc × wysokosc</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Waga (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={templateForm.weight_kg}
                  onChange={e => setTemplateForm({ ...templateForm, weight_kg: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zawartosc (opis)</label>
                <input
                  type="text"
                  value={templateForm.content_description}
                  onChange={e => setTemplateForm({ ...templateForm, content_description: e.target.value })}
                  placeholder="np. pillows, toys, clothes"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={templateForm.is_default}
                  onChange={e => setTemplateForm({ ...templateForm, is_default: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_default" className="text-sm text-gray-700 dark:text-gray-300">
                  Domyslny szablon dla tego kuriera
                </label>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving || !templateForm.name}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
