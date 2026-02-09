'use client';

import { useState, useEffect } from 'react';

export default function MESPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);

  // Shipping state
  const [shipments, setShipments] = useState({});
  const [templates, setTemplates] = useState([]);
  const [showShipModal, setShowShipModal] = useState(null);
  const [shipLoading, setShipLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Apilo carriers state
  const [carrierAccounts, setCarrierAccounts] = useState([]);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [carriersLoading, setCarriersLoading] = useState(false);

  const [shipForm, setShipForm] = useState({
    carrierAccountId: null,
    methodUuid: '',
    weight: 1,
    length: 30,
    width: 20,
    height: 10
  });

  // Courier logo mapping
  const COURIER_LOGOS = {
    'inpost': 'https://inpost.pl/sites/default/files/logo_inpost.svg',
    'dhl': 'https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg',
    'ups': 'https://www.ups.com/assets/resources/webcontent/images/ups-logo.svg',
    'dpd': 'https://www.dpd.com/group/wp-content/uploads/sites/77/2019/07/DPD-Logo.png',
    'fedex': 'https://www.fedex.com/content/dam/fedex-com/logos/logo.png',
    'gls': 'https://gls-group.eu/EU/media/images/logos/gls-logo.svg'
  };

  const getCourierLogo = (courierName) => {
    if (!courierName) return null;
    const name = courierName.toLowerCase();
    for (const [key, logo] of Object.entries(COURIER_LOGOS)) {
      if (name.includes(key)) return logo;
    }
    return null;
  };

  const fetchShipments = async () => {
    try {
      const res = await fetch('/api/couriers/shipments?limit=500');
      const data = await res.json();
      if (data.success && data.shipments) {
        const byOrder = {};
        data.shipments.forEach(s => {
          if (s.order_id) byOrder[s.order_id] = s;
        });
        setShipments(byOrder);
      }
    } catch (err) {
      console.error('Error fetching shipments:', err);
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
    }
  };

  // Fetch carrier accounts from Apilo
  const fetchCarrierAccounts = async () => {
    setCarriersLoading(true);
    try {
      const res = await fetch('/api/apilo/carriers?type=accounts');
      const data = await res.json();
      console.log('Carrier accounts response:', data);
      if (data.success && Array.isArray(data.accounts)) {
        setCarrierAccounts(data.accounts);
        // Auto-select first carrier if available
        if (data.accounts.length > 0 && !shipForm.carrierAccountId) {
          const firstId = data.accounts[0]?.id;
          if (firstId) {
            setShipForm(prev => ({ ...prev, carrierAccountId: firstId }));
            fetchShippingMethods(firstId);
          }
        }
      } else {
        console.warn('No carrier accounts found or invalid response:', data);
        setCarrierAccounts([]);
      }
    } catch (err) {
      console.error('Error fetching carrier accounts:', err);
      setCarrierAccounts([]);
    } finally {
      setCarriersLoading(false);
    }
  };

  // Fetch shipping methods for selected carrier
  const fetchShippingMethods = async (carrierAccountId) => {
    if (!carrierAccountId) return;
    try {
      const res = await fetch(`/api/apilo/carriers?type=methods&carrierAccountId=${carrierAccountId}`);
      const data = await res.json();
      console.log('Shipping methods response:', data);
      if (data.success && Array.isArray(data.methods)) {
        setShippingMethods(data.methods);
        // Auto-select first method if available
        if (data.methods.length > 0) {
          const firstMethod = data.methods[0];
          setShipForm(prev => ({ ...prev, methodUuid: firstMethod?.uuid || firstMethod?.id || '' }));
        }
      } else {
        console.warn('No shipping methods found:', data);
        setShippingMethods([]);
      }
    } catch (err) {
      console.error('Error fetching shipping methods:', err);
      setShippingMethods([]);
    }
  };

  // Parse dimensions from carrier account name (e.g. "DHL 600x400x400" -> {length: 60, width: 40, height: 40})
  const parseDimensionsFromName = (name) => {
    if (!name) return null;
    // Match patterns like "600x400x400", "60x40x40", "30x40x5"
    const match = name.match(/(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)/);
    if (match) {
      let [, d1, d2, d3] = match.map(Number);
      // If dimensions are > 100, they're probably in mm, convert to cm
      // If dimensions look like mm (e.g. 600x400x400), divide by 10
      if (d1 > 100 || d2 > 100 || d3 > 100) {
        d1 = Math.round(d1 / 10);
        d2 = Math.round(d2 / 10);
        d3 = Math.round(d3 / 10);
      }
      return { length: d1, width: d2, height: d3 };
    }
    return null;
  };

  // Parse weight from carrier account name (e.g. "5kg" or "waga 2.5")
  const parseWeightFromName = (name) => {
    if (!name) return null;
    const match = name.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    return null;
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setShipForm(prev => ({
      ...prev,
      weight: parseFloat(template.weight_kg) || 1,
      length: parseFloat(template.length_cm) || 30,
      width: parseFloat(template.width_cm) || 20,
      height: parseFloat(template.height_cm) || 10
    }));
  };

  const handleCarrierChange = (carrierAccountId) => {
    const carrier = carrierAccounts.find(c => c.id === parseInt(carrierAccountId));
    const dimensions = parseDimensionsFromName(carrier?.name);
    const weight = parseWeightFromName(carrier?.name);

    setShipForm(prev => ({
      ...prev,
      carrierAccountId: parseInt(carrierAccountId),
      methodUuid: '',
      // Auto-fill dimensions from carrier name if available
      ...(dimensions && {
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height
      }),
      // Auto-fill weight if found in name
      ...(weight && { weight })
    }));
    setShippingMethods([]);
    fetchShippingMethods(carrierAccountId);
  };

  const handleCreateShipment = async () => {
    if (!showShipModal) return;
    if (!shipForm.carrierAccountId) {
      alert('Wybierz kuriera');
      return;
    }

    setShipLoading(true);
    try {
      // Get order shipping address
      const orderRes = await fetch(`/api/orders/${showShipModal.id}`);
      const orderData = await orderRes.json();
      const shipping = orderData.order?.shipping || {};

      const res = await fetch('/api/apilo/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          carrierAccountId: shipForm.carrierAccountId,
          orderId: showShipModal.id,
          method: shipForm.methodUuid,
          addressReceiver: {
            type: 'house',
            name: shipping.name || '',
            streetName: shipping.street || '',
            streetNumber: shipping.streetNumber || '',
            zipCode: shipping.zipCode || '',
            city: shipping.city || '',
            country: shipping.country || 'PL',
            phone: shipping.phone || '',
            email: shipping.email || ''
          },
          parcels: [{
            weight: parseFloat(shipForm.weight) || 1,
            dimensions: {
              length: parseFloat(shipForm.length) || 30,
              width: parseFloat(shipForm.width) || 20,
              height: parseFloat(shipForm.height) || 10
            }
          }]
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowShipModal(null);
        fetchShipments();
        const shipmentId = data.result?.shipments?.[0]?.shipmentId;
        alert(`Przesylka utworzona w Apilo! ID: ${shipmentId || '-'}`);
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (err) {
      alert('Blad tworzenia przesylki: ' + err.message);
    } finally {
      setShipLoading(false);
    }
  };

  const getTrackingUrl = (courier, tracking) => {
    if (!tracking) return null;
    if (courier === 'inpost') return `https://inpost.pl/sledzenie-przesylek?number=${tracking}`;
    if (courier?.startsWith('dhl')) return `https://www.dhl.com/pl-pl/home/tracking.html?tracking-id=${tracking}`;
    if (courier === 'ups') return `https://www.ups.com/track?tracknum=${tracking}`;
    return null;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mes/orders?status=${filter}&limit=100`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Blad pobierania zamowien:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchShipments();
    fetchTemplates();
    fetchCarrierAccounts();
  }, [filter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready_to_ship':
        return <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-800 rounded">GOTOWE DO WYSYLKI</span>;
      case 'ready':
        return <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-800 rounded">DOSTEPNE</span>;
      case 'partial':
        return <span className="px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-800 rounded">CZESCIOWO</span>;
      case 'needs_production':
        return <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-800 rounded">DO PRODUKCJI</span>;
      case 'from_polprodukty':
        return <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded">Z POLPRODUKTOW</span>;
      case 'from_wykroje':
        return <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded">Z WYKROJOW</span>;
      case 'from_surowce':
        return <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded">Z SUROWCOW</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded">{status}</span>;
    }
  };

  const getMagazynBadge = (kategoria, available, needed) => {
    const isAvailable = available && available.stan >= needed;
    const isPartial = available && available.stan > 0 && available.stan < needed;

    const colors = {
      gotowe: isAvailable ? 'bg-green-500' : isPartial ? 'bg-yellow-500' : 'bg-gray-300',
      polprodukty: isAvailable ? 'bg-blue-500' : isPartial ? 'bg-blue-300' : 'bg-gray-300',
      wykroje: isAvailable ? 'bg-purple-500' : isPartial ? 'bg-purple-300' : 'bg-gray-300',
      surowce: isAvailable ? 'bg-orange-500' : isPartial ? 'bg-orange-300' : 'bg-gray-300'
    };

    const labels = {
      gotowe: 'GOT',
      polprodukty: 'POL',
      wykroje: 'WYK',
      surowce: 'SUR'
    };

    return (
      <div
        className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold text-white ${colors[kategoria]}`}
        title={`${labels[kategoria]}: ${available ? available.stan : 0} szt. (potrzeba: ${needed})`}
      >
        {labels[kategoria]}
      </div>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              MES - Manufacturing Execution System
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Zarzadzanie produkcja i realizacja zamowien
            </p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Ladowanie...' : 'Odswiez'}
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div
              className={`rounded-lg shadow p-3 cursor-pointer transition-colors ${filter === 'all' ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setFilter('all')}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">Wszystkie</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div
              className={`rounded-lg shadow p-3 cursor-pointer transition-colors ${filter === 'pending' ? 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setFilter('pending')}
            >
              <p className="text-xs text-red-600 dark:text-red-400">Do produkcji</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">{stats.needsProduction + stats.partial}</p>
            </div>
            <div
              className={`rounded-lg shadow p-3 cursor-pointer transition-colors ${filter === 'ready' ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setFilter('ready')}
            >
              <p className="text-xs text-green-600 dark:text-green-400">Gotowe do wysylki</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{stats.readyToShip}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Czesciowe</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.partial}</p>
            </div>
          </div>
        )}

        {/* Legenda magazynow */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-3 mb-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Magazyny:</span>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-white text-[8px] font-bold">GOT</div>
              <span className="text-gray-600 dark:text-gray-300">Gotowe</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-[8px] font-bold">POL</div>
              <span className="text-gray-600 dark:text-gray-300">Polprodukty</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center text-white text-[8px] font-bold">WYK</div>
              <span className="text-gray-600 dark:text-gray-300">Wykroje</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-white text-[8px] font-bold">SUR</div>
              <span className="text-gray-600 dark:text-gray-300">Surowce</span>
            </div>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-gray-300"></div>
              <span className="text-gray-500 dark:text-gray-400">Brak</span>
            </div>
          </div>
        </div>

        {/* Lista zamowien */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Zamowienia ({orders.length})
            </h2>
          </div>

          {loading ? (
            <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              Ladowanie zamowien...
            </div>
          ) : orders.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              Brak zamowien do wyswietlenia
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {orders.map((order) => (
                <div key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {/* Naglowek zamowienia */}
                  <div
                    className="px-4 py-3 cursor-pointer flex items-center gap-3"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <div className="flex-shrink-0">
                      <span className={`text-lg ${expandedOrder === order.id ? 'rotate-90' : ''} transition-transform inline-block`}>
                        ▶
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                          #{order.id}
                        </span>
                        {order.externalId && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            ({order.externalId})
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {order.channelPlatform}
                        </span>
                        {getStatusBadge(order.orderStatus)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatDate(order.orderedAt)} • {order.itemsCount} produktow • {order.totalGross} {order.currency}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-green-600 font-medium">{order.readyCount} ✓</span>
                      {order.needsProductionCount > 0 && (
                        <span className="text-red-600 font-medium">{order.needsProductionCount} ✗</span>
                      )}
                    </div>
                  </div>

                  {/* Rozwinięte szczegoly */}
                  {expandedOrder === order.id && (
                    <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-700/30">
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className={`bg-white dark:bg-gray-800 rounded-lg p-3 border ${
                              item.productionStatus === 'ready' ? 'border-green-200 dark:border-green-800' :
                              item.productionStatus === 'partial' ? 'border-yellow-200 dark:border-yellow-800' :
                              'border-red-200 dark:border-red-800'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Obrazek */}
                              <div className="w-12 h-12 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                                {item.image ? (
                                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px]">brak</div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                      SKU: {item.sku || '-'} • {item.quantity} szt.
                                    </div>
                                  </div>
                                  {getStatusBadge(item.productionStatus)}
                                </div>

                                {/* Dostepnosc magazynowa */}
                                <div className="mt-2 flex items-center gap-1">
                                  {getMagazynBadge('gotowe', item.availability.gotowe, item.quantity)}
                                  {getMagazynBadge('polprodukty', item.availability.polprodukty, item.quantity)}
                                  {getMagazynBadge('wykroje', item.availability.wykroje, item.quantity)}
                                  {getMagazynBadge('surowce', item.availability.surowce, item.quantity)}

                                  {item.missingQty > 0 && (
                                    <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-medium">
                                      Brakuje: {item.missingQty} szt.
                                    </span>
                                  )}
                                </div>

                                {/* Receptura */}
                                {item.recipe && item.recipe.length > 0 && (
                                  <div className="mt-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedItem(expandedItem === `${order.id}-${idx}` ? null : `${order.id}-${idx}`);
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                      {expandedItem === `${order.id}-${idx}` ? '▼ Ukryj recepture' : '▶ Pokaz recepture'}
                                    </button>

                                    {expandedItem === `${order.id}-${idx}` && (
                                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs space-y-1">
                                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Skladniki:</div>
                                        {item.recipe.map((ing, ingIdx) => (
                                          <div key={ingIdx} className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">
                                              {ing.nazwa}
                                              <span className="text-gray-400 dark:text-gray-500 ml-1">({ing.kategoria})</span>
                                            </span>
                                            <span className={`font-medium ${ing.stan >= ing.quantity * item.quantity ? 'text-green-600' : 'text-red-600'}`}>
                                              {ing.quantity * item.quantity} szt. (stan: {ing.stan})
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Akcje */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {shipments[order.id] ? (
                          // Show shipment info
                          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                            <img src={getCourierLogo(shipments[order.id].courier)} alt="" className="w-8 h-8 object-contain" />
                            <div className="text-xs">
                              <div className="font-medium text-green-700 dark:text-green-300">
                                {shipments[order.id].courier?.toUpperCase()} • {shipments[order.id].status}
                              </div>
                              <a
                                href={getTrackingUrl(shipments[order.id].courier, shipments[order.id].tracking_number)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-mono"
                              >
                                {shipments[order.id].tracking_number}
                              </a>
                            </div>
                          </div>
                        ) : order.orderStatus === 'ready_to_ship' ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowShipModal(order); }}
                            className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            Wyslij z kurierem
                          </button>
                        ) : (
                          <button className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">
                            Rozpocznij produkcje
                          </button>
                        )}
                        <a
                          href={`/zamowienia/${order.id}`}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          Szczegoly zamowienia
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Shipment Modal */}
      {showShipModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShipModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Utworz przesylke</h3>
              <button onClick={() => setShowShipModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-4 space-y-4">
              {/* Order info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Zamowienie #{showShipModal.id}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {showShipModal.itemsCount} produktow • {showShipModal.totalGross} {showShipModal.currency}
                </div>
              </div>

              {/* Templates */}
              {templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Wybierz szablon</label>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTemplate(t)}
                        className={`p-2 text-left border rounded-lg text-xs ${selectedTemplate?.id === t.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white truncate">{t.name}</div>
                        <div className="text-gray-500 dark:text-gray-400">{t.length_cm}×{t.width_cm}×{t.height_cm} cm</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Carrier select from Apilo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kurier (z Apilo)</label>
                {carriersLoading ? (
                  <div className="text-sm text-gray-500 py-2">Ladowanie kurierow...</div>
                ) : carrierAccounts.length === 0 ? (
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 py-2">
                    Brak skonfigurowanych kurierow w Apilo. Skonfiguruj integracje w panelu Apilo.
                  </div>
                ) : (
                  <select
                    value={shipForm.carrierAccountId || ''}
                    onChange={e => handleCarrierChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Wybierz kuriera --</option>
                    {carrierAccounts.map(c => (
                      <option key={c.id} value={c.id}>{c.name || c.carrierName || `Kurier #${c.id}`}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Shipping method select */}
              {shipForm.carrierAccountId && shippingMethods.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Metoda wysylki</label>
                  <select
                    value={shipForm.methodUuid || ''}
                    onChange={e => setShipForm({ ...shipForm, methodUuid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {shippingMethods.map(m => (
                      <option key={m.uuid || m.id} value={m.uuid || m.id}>{m.name || m.description || `Metoda ${m.id}`}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dimensions - auto-filled from carrier name */}
              {shipForm.carrierAccountId && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Wymiary paczki (cm)
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
                      (z szablonu kuriera)
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dlugosc</div>
                      <div className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg font-medium text-gray-900 dark:text-white">
                        {shipForm.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Szerokosc</div>
                      <div className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg font-medium text-gray-900 dark:text-white">
                        {shipForm.width}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Wysokosc</div>
                      <div className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg font-medium text-gray-900 dark:text-white">
                        {shipForm.height}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Waga: <span className="font-medium text-gray-900 dark:text-white">{shipForm.weight} kg</span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setShowShipModal(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800"
              >
                Anuluj
              </button>
              <button
                onClick={handleCreateShipment}
                disabled={shipLoading}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {shipLoading ? 'Tworzenie...' : 'Utworz przesylke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
