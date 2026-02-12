'use client';

import { useState, useEffect } from 'react';

export default function MESSettingsPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);

  // Carrier accounts from Apilo
  const [carrierAccounts, setCarrierAccounts] = useState([]);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [carriersLoading, setCarriersLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    priority: 0,
    channel_pattern: '',
    sku_pattern: '',
    country_codes: '',
    carrier_account_id: '',
    carrier_account_name: '',
    method_uuid: ''
  });

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/shipping-rules');
      const data = await res.json();
      if (data.success) {
        setRules(data.rules || []);
      }
    } catch (err) {
      console.error('Error fetching rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarrierAccounts = async () => {
    setCarriersLoading(true);
    try {
      const res = await fetch('/api/apilo/carriers?type=accounts');
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        setCarrierAccounts(data.accounts);
      }
    } catch (err) {
      console.error('Error fetching carrier accounts:', err);
    } finally {
      setCarriersLoading(false);
    }
  };

  const fetchShippingMethods = async (carrierAccountId) => {
    if (!carrierAccountId) return;
    try {
      const res = await fetch(`/api/apilo/carriers?type=methods&carrierAccountId=${carrierAccountId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.methods)) {
        setShippingMethods(data.methods);
      } else {
        setShippingMethods([]);
      }
    } catch (err) {
      console.error('Error fetching methods:', err);
      setShippingMethods([]);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchCarrierAccounts();
  }, []);

  const openCreateModal = () => {
    setEditingRule(null);
    setForm({
      name: '',
      priority: 0,
      channel_pattern: '',
      sku_pattern: '',
      country_codes: '',
      carrier_account_id: '',
      carrier_account_name: '',
      method_uuid: ''
    });
    setShippingMethods([]);
    setShowModal(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name || '',
      priority: rule.priority || 0,
      channel_pattern: rule.channel_pattern || '',
      sku_pattern: rule.sku_pattern || '',
      country_codes: rule.country_codes ? rule.country_codes.join(', ') : '',
      carrier_account_id: rule.carrier_account_id || '',
      carrier_account_name: rule.carrier_account_name || '',
      method_uuid: rule.method_uuid || ''
    });
    if (rule.carrier_account_id) {
      fetchShippingMethods(rule.carrier_account_id);
    }
    setShowModal(true);
  };

  const handleCarrierChange = (carrierAccountId) => {
    const carrier = carrierAccounts.find(c => c.id === parseInt(carrierAccountId));
    setForm(prev => ({
      ...prev,
      carrier_account_id: parseInt(carrierAccountId),
      carrier_account_name: carrier?.name || '',
      method_uuid: ''
    }));
    setShippingMethods([]);
    fetchShippingMethods(carrierAccountId);
  };

  const handleSave = async () => {
    if (!form.name || !form.carrier_account_id) {
      alert('Nazwa i konto kuriera sa wymagane');
      return;
    }

    setSaving(true);
    try {
      const countryCodes = form.country_codes
        ? form.country_codes.split(',').map(c => c.trim()).filter(Boolean)
        : [];

      const payload = {
        ...form,
        carrier_account_id: parseInt(form.carrier_account_id),
        priority: parseInt(form.priority) || 0,
        country_codes: countryCodes,
        method_uuid: form.method_uuid || null
      };

      if (editingRule) {
        payload.id = editingRule.id;
      }

      const res = await fetch('/api/shipping-rules', {
        method: editingRule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchRules();
      } else {
        alert('Blad: ' + (data.error || 'Nieznany blad'));
      }
    } catch (err) {
      alert('Blad zapisu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId) => {
    if (!confirm('Czy na pewno chcesz usunac te regule?')) return;

    try {
      const res = await fetch(`/api/shipping-rules?id=${ruleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchRules();
      } else {
        alert('Blad usuwania: ' + (data.error || 'Nieznany blad'));
      }
    } catch (err) {
      alert('Blad usuwania: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <a href="/mes" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </a>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              MES — Reguly szybkiej wysylki
            </h1>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Dodaj regule
          </button>
        </div>

        {/* TODO notice */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4 text-sm text-amber-800 dark:text-amber-300">
          <strong>Do dopracowania:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Powiazanie szablonow wysylki klienta wzgledem SKU — obecny mechanizm dopasowania regul (regex na kanale/SKU) wymaga przemyslenia, aby lepiej odzwierciedlac rzeczywiste zaleznosci miedzy produktami a kontami kurierow.</li>
            <li>Wielopaki sa recznie przeklikiwane (szablony kurierow i kartonow z Apilo) — na ten moment nie wiemy jak to powiazac z automatycznymi regulami.</li>
          </ul>
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-sm text-blue-800 dark:text-blue-300">
          <strong>Jak to dziala:</strong> Reguly sa sprawdzane od najwyzszego priorytetu. Pierwsza pasujaca regula automatycznie tworzy przesylke na podanym koncie kuriera.
          Wzorce kanalu i SKU to wyrazenia regularne (regex) — np. <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">Allegro.*dobrelegowiska</code> lub <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">USZAK|LEGOWISKO</code>.
        </div>

        {/* Rules table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Ladowanie...</div>
          ) : rules.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Brak regul. Kliknij &quot;Dodaj regule&quot; aby utworzyc pierwsza.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Priorytet</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Nazwa</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Wzorzec kanalu</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Wzorzec SKU</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Kraje</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Konto kuriera</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rules.map(rule => (
                    <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-sm">
                          {rule.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{rule.name}</td>
                      <td className="px-4 py-3">
                        {rule.channel_pattern ? (
                          <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{rule.channel_pattern}</code>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {rule.sku_pattern ? (
                          <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{rule.sku_pattern}</code>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {rule.country_codes && rule.country_codes.length > 0 ? (
                          <span className="text-xs">{rule.country_codes.join(', ')}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={rule.carrier_account_name}>
                        {rule.carrier_account_name || `ID: ${rule.carrier_account_id}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(rule)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edytuj"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Usun"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {editingRule ? 'Edytuj regule' : 'Nowa regula wysylki'}
                </h2>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nazwa *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="np. Allegro Dobrelegowiska DHL"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priorytet</label>
                    <input
                      type="number"
                      value={form.priority}
                      onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Wyzszy priorytet = sprawdzana wczesniej</p>
                  </div>

                  {/* Channel pattern */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wzorzec kanalu (regex)</label>
                    <input
                      type="text"
                      value={form.channel_pattern}
                      onChange={e => setForm(prev => ({ ...prev, channel_pattern: e.target.value }))}
                      placeholder="np. Allegro.*dobrelegowiska"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Puste = pasuje do kazdego kanalu</p>
                  </div>

                  {/* SKU pattern */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wzorzec SKU (regex)</label>
                    <input
                      type="text"
                      value={form.sku_pattern}
                      onChange={e => setForm(prev => ({ ...prev, sku_pattern: e.target.value }))}
                      placeholder="np. USZAK|LEGOWISKO|LS-"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Puste = pasuje do kazdego SKU</p>
                  </div>

                  {/* Country codes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kody krajow (opcjonalnie)</label>
                    <input
                      type="text"
                      value={form.country_codes}
                      onChange={e => setForm(prev => ({ ...prev, country_codes: e.target.value }))}
                      placeholder="np. PL, DE, FR"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Rozdzielone przecinkami. Puste = wszystkie kraje.</p>
                  </div>

                  {/* Carrier account */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Konto kuriera *</label>
                    {carriersLoading ? (
                      <div className="text-sm text-gray-500">Ladowanie kont kurierow...</div>
                    ) : (
                      <select
                        value={form.carrier_account_id}
                        onChange={e => handleCarrierChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">-- Wybierz konto kuriera --</option>
                        {carrierAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} (ID: {acc.id})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Method UUID (optional) */}
                  {shippingMethods.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Metoda wysylki (opcjonalnie)</label>
                      <select
                        value={form.method_uuid}
                        onChange={e => setForm(prev => ({ ...prev, method_uuid: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">-- Automatycznie (pierwsza dostepna) --</option>
                        {shippingMethods.map(m => (
                          <option key={m.uuid || m.id} value={m.uuid || m.id}>{m.name || m.uuid || m.id}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Puste = automatycznie wybierz pierwsza metode</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Zapisywanie...' : (editingRule ? 'Zapisz zmiany' : 'Utworz regule')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
