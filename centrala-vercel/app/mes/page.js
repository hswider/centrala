'use client';

import { useState, useEffect } from 'react';

const DEPARTMENTS = [
  { key: 'wszystkie', label: 'Wszystkie', icon: '📋', desc: 'Aktywne zamowienia', textColor: 'text-blue-600', borderColor: 'border-blue-500', bgLight: 'bg-blue-50' },
  { key: 'krojownia', label: 'Krojownia', icon: '✂️', desc: 'Brak w magazynach GOT/POL/WYK', textColor: 'text-red-600', borderColor: 'border-red-500', bgLight: 'bg-red-50' },
  { key: 'szwalnia', label: 'Szwalnia', icon: '🧵', desc: 'Dostepne w wykrojach', textColor: 'text-purple-600', borderColor: 'border-purple-500', bgLight: 'bg-purple-50' },
  { key: 'polprodukty', label: 'Polprodukty', icon: '🔧', desc: 'Dostepne w polproduktach', textColor: 'text-amber-600', borderColor: 'border-amber-500', bgLight: 'bg-amber-50' },
  { key: 'gotowe', label: 'Gotowe produkty', icon: '📦', desc: 'Gotowe do wysylki', textColor: 'text-green-600', borderColor: 'border-green-500', bgLight: 'bg-green-50' },
  { key: 'wielopak', label: 'Wielopak', icon: '📑', desc: 'Wiecej niz 1 produkt', textColor: 'text-orange-600', borderColor: 'border-orange-500', bgLight: 'bg-orange-50' },
];

const DEPT_BADGE_COLORS = {
  krojownia: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  szwalnia: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  polprodukty: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  gotowe: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  wielopak: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function MESPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('wszystkie');
  const [secondaryFilter, setSecondaryFilter] = useState(null); // 'shipped', 'canceled', 'unpaid'
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [visibleCount, setVisibleCount] = useState(50);

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
    length: 30,
    width: 20,
    height: 10
  });

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

  const fetchCarrierAccounts = async () => {
    setCarriersLoading(true);
    try {
      const res = await fetch('/api/apilo/carriers?type=accounts');
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        setCarrierAccounts(data.accounts);
        if (data.accounts.length > 0 && !shipForm.carrierAccountId) {
          const firstId = data.accounts[0]?.id;
          if (firstId) {
            setShipForm(prev => ({ ...prev, carrierAccountId: firstId }));
            fetchShippingMethods(firstId);
          }
        }
      } else {
        setCarrierAccounts([]);
      }
    } catch (err) {
      console.error('Error fetching carrier accounts:', err);
      setCarrierAccounts([]);
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
        if (data.methods.length > 0) {
          const firstMethod = data.methods[0];
          setShipForm(prev => ({ ...prev, methodUuid: firstMethod?.uuid || firstMethod?.id || '' }));
        }
      } else {
        setShippingMethods([]);
      }
    } catch (err) {
      console.error('Error fetching shipping methods:', err);
      setShippingMethods([]);
    }
  };

  const parseDimensionsFromName = (name) => {
    if (!name) return null;
    const match = name.match(/(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)/);
    if (match) {
      let [, d1, d2, d3] = match.map(Number);
      if (d1 > 100 || d2 > 100 || d3 > 100) {
        d1 = Math.round(d1 / 10);
        d2 = Math.round(d2 / 10);
        d3 = Math.round(d3 / 10);
      }
      return { length: d1, width: d2, height: d3 };
    }
    return null;
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setShipForm(prev => ({
      ...prev,
      length: parseFloat(template.length_cm) || 30,
      width: parseFloat(template.width_cm) || 20,
      height: parseFloat(template.height_cm) || 10
    }));
  };

  const handleCarrierChange = (carrierAccountId) => {
    const carrier = carrierAccounts.find(c => c.id === parseInt(carrierAccountId));
    const dimensions = parseDimensionsFromName(carrier?.name);
    setShipForm(prev => ({
      ...prev,
      carrierAccountId: parseInt(carrierAccountId),
      methodUuid: '',
      ...(dimensions && {
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height
      })
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
        const errorMsg = data.details?.responseData
          ? `Blad: ${data.error}\n\nSzczegoly: ${JSON.stringify(data.details.responseData, null, 2)}`
          : `Blad: ${data.error}`;
        alert(errorMsg);
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
      const res = await fetch('/api/mes/orders?status=all&limit=500');
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
  }, []);

  // Clear selection when department/filter changes
  useEffect(() => {
    setSelectedOrders(new Set());
  }, [department, secondaryFilter]);

  const toggleSelectOrder = (id) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allIds = visibleOrders.map(o => o.id);
    const allSelected = allIds.length > 0 && allIds.every(id => selectedOrders.has(id));
    if (allSelected) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(allIds));
    }
  };

  const getSelectedOrdersData = () => {
    return filteredOrders.filter(o => selectedOrders.has(o.id));
  };

  const handleExportCSV = () => {
    const selected = getSelectedOrdersData();
    if (selected.length === 0) return;

    const headers = ['Nr zamowienia', 'Kanal sprzedazy', 'Platforma', 'Nazwa produktu', 'SKU', 'Ilosc'];
    const rows = [headers.join(';')];

    selected.forEach(order => {
      (order.items || []).forEach(item => {
        if (item.isShipping) return;
        rows.push([
          order.id,
          order.channelLabel || '',
          order.channelPlatform || '',
          (item.name || '').replace(/;/g, ','),
          item.sku || '',
          item.quantity || 1
        ].join(';'));
      });
    });

    const csvContent = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mes_zamowienia_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    const selected = getSelectedOrdersData();
    if (selected.length === 0) return;

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // Title
    doc.setFontSize(16);
    doc.text('MES - Zamowienia do produkcji', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pl-PL')} | Zamowien: ${selected.length}`, margin, y);
    y += 10;

    selected.forEach((order, orderIdx) => {
      // Check if we need a new page
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      // Order header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 5, contentWidth, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`#${order.id}  |  ${order.channelPlatform || ''} - ${order.channelLabel || ''}`, margin + 2, y);
      y += 8;

      // Items table header
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, y - 4, contentWidth, 6, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Nazwa produktu', margin + 2, y);
      doc.text('SKU', margin + 120, y);
      doc.text('Ilosc', margin + 160, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      (order.items || []).forEach(item => {
        if (item.isShipping) return;
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(8);
        const name = (item.name || '').substring(0, 70);
        doc.text(name, margin + 2, y);
        doc.text(item.sku || '-', margin + 120, y);
        doc.text(String(item.quantity || 1), margin + 160, y);
        y += 5;
      });

      y += 5;
    });

    doc.save(`mes_zamowienia_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Client-side filtering by department or secondary filter
  const filteredOrders = (() => {
    if (secondaryFilter) {
      if (secondaryFilter === 'shipped') return orders.filter(o => o.isShipped);
      if (secondaryFilter === 'canceled') return orders.filter(o => o.isCanceled);
      if (secondaryFilter === 'unpaid') return orders.filter(o => !o.isPaid && !o.isCanceled && !o.isShipped);
      return orders;
    }
    if (department === 'wszystkie') {
      return orders.filter(o => o.department !== null);
    }
    return orders.filter(o => o.department === department);
  })();

  const visibleOrders = filteredOrders.slice(0, visibleCount);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready_to_ship':
        return <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-800 rounded">GOTOWE DO WYSYLKI</span>;
      case 'shipped':
        return <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded">WYSLANE</span>;
      case 'canceled':
        return <span className="px-2 py-0.5 text-xs font-bold bg-gray-200 text-gray-600 rounded line-through">ANULOWANE</span>;
      case 'unpaid':
        return <span className="px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-800 rounded">NIEOPLACONE</span>;
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

    const labels = { gotowe: 'GOT', polprodukty: 'POL', wykroje: 'WYK', surowce: 'SUR' };

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
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const getDeptCount = (key) => {
    if (!stats?.departments) return 0;
    return stats.departments[key] || 0;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              MES - Dzialy produkcyjne
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Zamowienia posortowane wg etapu produkcji
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

        {/* Summary stat cards - like /magazyny */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
            {DEPARTMENTS.map(dept => {
              const count = getDeptCount(dept.key);
              return (
                <div
                  key={dept.key}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-3 lg:p-4 border-l-4 ${dept.borderColor} cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700`}
                  onClick={() => { setDepartment(dept.key); setSecondaryFilter(null); }}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{dept.icon} {dept.label}</p>
                  <p className={`text-xl lg:text-2xl font-bold ${dept.textColor}`}>{count}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 -mt-1">{dept.desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab bar - like /magazyny */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 mb-4">
          <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept.key}
                onClick={() => { setDepartment(dept.key); setSecondaryFilter(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors whitespace-nowrap px-4 ${
                  !secondaryFilter && department === dept.key
                    ? `${dept.textColor} border-b-2 ${dept.borderColor} ${dept.bgLight}`
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>{dept.icon}</span>
                <span className="hidden sm:inline">{dept.label}</span>
                <span className={`text-xs ${!secondaryFilter && department === dept.key ? dept.textColor : 'text-gray-400'}`}>
                  ({getDeptCount(dept.key)})
                </span>
              </button>
            ))}
          </div>
          {/* Secondary filters row inside the tab bar */}
          {stats && (
            <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-50 dark:border-gray-700/50 text-xs">
              <span className="text-gray-400 dark:text-gray-500 font-medium">Inne:</span>
              <button
                onClick={() => setSecondaryFilter(secondaryFilter === 'shipped' ? null : 'shipped')}
                className={`px-2.5 py-1 rounded transition-colors ${secondaryFilter === 'shipped' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Wyslane ({stats.shipped || 0})
              </button>
              <button
                onClick={() => setSecondaryFilter(secondaryFilter === 'canceled' ? null : 'canceled')}
                className={`px-2.5 py-1 rounded transition-colors ${secondaryFilter === 'canceled' ? 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 font-bold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Anulowane ({stats.canceled || 0})
              </button>
              <button
                onClick={() => setSecondaryFilter(secondaryFilter === 'unpaid' ? null : 'unpaid')}
                className={`px-2.5 py-1 rounded transition-colors ${secondaryFilter === 'unpaid' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-bold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Nieoplacone ({stats.unpaid || 0})
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-gray-400 dark:text-gray-500">Magazyny:</span>
              <div className="flex items-center gap-0.5">
                <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center text-white text-[7px] font-bold">GOT</div>
                <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center text-white text-[7px] font-bold">POL</div>
                <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center text-white text-[7px] font-bold">WYK</div>
                <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center text-white text-[7px] font-bold">SUR</div>
                <div className="w-4 h-4 rounded bg-gray-300 ml-0.5"></div>
              </div>
            </div>
          )}
        </div>

        {/* Lista zamowien */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={visibleOrders.length > 0 && visibleOrders.every(o => selectedOrders.has(o.id))}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                title="Zaznacz wszystkie"
              />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {secondaryFilter
                  ? secondaryFilter === 'shipped' ? 'Wyslane' : secondaryFilter === 'canceled' ? 'Anulowane' : 'Nieoplacone'
                  : DEPARTMENTS.find(d => d.key === department)?.label || 'Zamowienia'
                }
                {' '}({visibleOrders.length}{filteredOrders.length > visibleCount ? ` z ${filteredOrders.length}` : ''})
              </h2>
              <div className="flex items-center gap-1 ml-2">
                {[50, 100, 250, 500].map(n => (
                  <button
                    key={n}
                    onClick={() => setVisibleCount(n)}
                    className={`px-2 py-0.5 text-xs rounded ${visibleCount === n ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            {selectedOrders.size > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Zaznaczono: {selectedOrders.size}
                </span>
                <button
                  onClick={() => setSelectedOrders(new Set())}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 underline"
                >
                  Wyczysc
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                >
                  CSV ({selectedOrders.size})
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                >
                  PDF ({selectedOrders.size})
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              Ladowanie zamowien...
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              Brak zamowien w tym dziale
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {visibleOrders.map((order) => {
                const hasAlerts = order.items?.some(i => i.alerts && i.alerts.length > 0);
                return (
                  <div key={order.id} className={`${selectedOrders.has(order.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                    {/* Naglowek zamowienia */}
                    <div
                      className="px-4 py-3 cursor-pointer flex items-center gap-3"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
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
                          {/* Department badge */}
                          {order.department && DEPT_BADGE_COLORS[order.department] && (
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${DEPT_BADGE_COLORS[order.department]}`}>
                              {order.department === 'wielopak' ? 'WIELOPAK' : order.department.toUpperCase()}
                            </span>
                          )}
                          {/* Alert indicator */}
                          {hasAlerts && (
                            <span className="text-yellow-500 text-sm" title="Zamowienie wymaga uwagi">⚠</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatDate(order.orderedAt)} • {order.itemsCount} prod. • {order.totalGross} {order.currency}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-green-600 font-medium">{order.readyCount} ✓</span>
                        {order.needsProductionCount > 0 && (
                          <span className="text-red-600 font-medium">{order.needsProductionCount} ✗</span>
                        )}
                      </div>
                    </div>

                    {/* Rozwiniete szczegoly */}
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

                                  {/* Alerty */}
                                  {item.alerts && item.alerts.length > 0 && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                      {item.alerts.map((alert, alertIdx) => (
                                        <span
                                          key={alertIdx}
                                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                            alert.type === 'error'
                                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                          }`}
                                        >
                                          ⚠ {alert.message}
                                        </span>
                                      ))}
                                    </div>
                                  )}

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
                          ) : order.isCanceled ? (
                            <span className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-500 rounded line-through">
                              Anulowane
                            </span>
                          ) : order.isShipped ? (
                            <span className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              Wyslane (status: {order.deliveryStatus})
                            </span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowShipModal(order); }}
                              className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1 ${
                                order.orderStatus === 'ready_to_ship'
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : order.orderStatus === 'unpaid'
                                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                  : 'bg-orange-500 text-white hover:bg-orange-600'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                              {order.orderStatus === 'ready_to_ship' ? 'Wyslij z kurierem' : 'Przygotuj przesylke'}
                            </button>
                          )}
                          <a
                            href={`/zamowienia/${order.id}`}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                          >
                            Szczegoly
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
              <button onClick={() => setShowShipModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Zamowienie #{showShipModal.id}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {showShipModal.itemsCount} produktow • {showShipModal.totalGross} {showShipModal.currency}
                </div>
              </div>

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
                        <div className="text-gray-500 dark:text-gray-400">{t.length_cm}x{t.width_cm}x{t.height_cm} cm</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kurier (z Apilo)</label>
                {carriersLoading ? (
                  <div className="text-sm text-gray-500 py-2">Ladowanie kurierow...</div>
                ) : carrierAccounts.length === 0 ? (
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 py-2">
                    Brak skonfigurowanych kurierow w Apilo.
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

              {shipForm.carrierAccountId && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Wymiary paczki (cm)
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
