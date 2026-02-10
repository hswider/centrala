'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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

const getTrackingUrl = (courier, tracking) => {
  if (!tracking) return null;
  const c = (courier || '').toLowerCase();
  if (c.includes('inpost')) return `https://inpost.pl/sledzenie-przesylek?number=${tracking}`;
  if (c.includes('dhl')) return `https://www.dhl.com/pl-pl/home/tracking.html?tracking-id=${tracking}`;
  if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${tracking}`;
  return null;
};

const parseDimensionsFromName = (name) => {
  if (!name) return null;
  const match = name.match(/(\d+)\s*[xX\u00d7]\s*(\d+)\s*[xX\u00d7]\s*(\d+)/);
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

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Shipping state
  const [shipments, setShipments] = useState([]);
  const [localShipments, setLocalShipments] = useState([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
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
  const [shipLoading, setShipLoading] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else {
          setOrder(data);
        }
      } catch (err) {
        setError('Nie udalo sie pobrac zamowienia');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchOrder();
      fetchShipments();
    }
  }, [params.id]);

  const fetchShipments = async () => {
    setShipmentsLoading(true);
    try {
      const res = await fetch(`/api/apilo/shipping?orderId=${params.id}`);
      const data = await res.json();
      if (data.success) {
        setShipments(data.shipments || []);
        setLocalShipments(data.localShipments || []);
      }
    } catch (err) {
      console.error('Error fetching shipments:', err);
    } finally {
      setShipmentsLoading(false);
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

  const handleOpenShipModal = () => {
    setShowShipModal(true);
    fetchCarrierAccounts();
  };

  const handleCreateShipment = async () => {
    if (!shipForm.carrierAccountId) {
      alert('Wybierz kuriera');
      return;
    }

    setShipLoading(true);
    try {
      const shipping = order.shipping || {};

      const res = await fetch('/api/apilo/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          carrierAccountId: shipForm.carrierAccountId,
          orderId: order.id,
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
        setShowShipModal(false);
        fetchShipments();
        const shipmentId = data.result?.shipments?.[0]?.shipmentId;
        alert(`Przesylka utworzona! ID: ${shipmentId || '-'}`);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price, currency = 'PLN') => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(price || 0);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      // Podstawowe statusy
      4: { label: 'Niepotwierdzone', color: 'bg-gray-100 text-gray-800' },
      1: { label: 'Nowy', color: 'bg-blue-100 text-blue-800' },
      7: { label: 'W realizacji', color: 'bg-yellow-100 text-yellow-800' },
      10: { label: 'Do wyslania', color: 'bg-purple-100 text-purple-800' },
      13: { label: 'Wyslane', color: 'bg-green-100 text-green-800' },
      // PALETY
      22: { label: 'PALETY-NOWE', color: 'bg-blue-100 text-blue-800' },
      113: { label: 'PALETY-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      166: { label: 'PILNE - PALETY', color: 'bg-orange-100 text-orange-800' },
      169: { label: 'BARDZO PILNE - PALETY', color: 'bg-red-100 text-red-800' },
      // PIKOWKI
      25: { label: 'PIKOWKI-NOWE', color: 'bg-blue-100 text-blue-800' },
      116: { label: 'PIKOWKI-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      103: { label: 'PILNE - PIKOWKI', color: 'bg-orange-100 text-orange-800' },
      106: { label: 'BARDZO PILNE - PIKOWKI', color: 'bg-red-100 text-red-800' },
      // LAWKI
      28: { label: 'LAWKI-NOWE', color: 'bg-blue-100 text-blue-800' },
      119: { label: 'LAWKI-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      172: { label: 'PILNE - LAWKI', color: 'bg-orange-100 text-orange-800' },
      175: { label: 'BARDZO PILNE - LAWKI', color: 'bg-red-100 text-red-800' },
      // LAWKI SIEDZISKA
      199: { label: 'LAWKI SIEDZISKA-NOWE', color: 'bg-blue-100 text-blue-800' },
      205: { label: 'LAWKI SIEDZISKA-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      178: { label: 'PILNE - LAWKI SIEDZISKA', color: 'bg-orange-100 text-orange-800' },
      181: { label: 'BARDZO PILNE - LAWKI SIEDZISKA', color: 'bg-red-100 text-red-800' },
      // POOM KIDS
      31: { label: 'POOM KIDS-NOWE', color: 'bg-blue-100 text-blue-800' },
      122: { label: 'POOM KIDS-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      228: { label: 'PILNE - POOM KIDS', color: 'bg-orange-100 text-orange-800' },
      225: { label: 'BARDZO PILNE - POOM KIDS', color: 'bg-red-100 text-red-800' },
      // LEGOWISKA
      46: { label: 'LEGOWISKA-NOWE', color: 'bg-blue-100 text-blue-800' },
      131: { label: 'LEGOWISKA-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      184: { label: 'PILNE - LEGOWISKA', color: 'bg-orange-100 text-orange-800' },
      187: { label: 'BARDZO PILNE - LEGOWISKA', color: 'bg-red-100 text-red-800' },
      // SARIS GARAGE
      57: { label: 'SARIS GARAGE-NOWE', color: 'bg-blue-100 text-blue-800' },
      125: { label: 'SARIS GARAGE-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      220: { label: 'SARIS GARAGE BARDZO PILNE', color: 'bg-red-100 text-red-800' },
      209: { label: 'SARIS GARAGE', color: 'bg-gray-100 text-gray-800' }
    };
    const s = statusMap[status] || { label: `Status ${status}`, color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
  };

  const renderPlatformIcon = (platform) => {
    const platformIcons = {
      'Amazon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Amazon_icon.svg/250px-Amazon_icon.svg.png',
      'Allegro': 'https://a.allegroimg.com/original/12c30c/0d4b068640de9b0daf22af9d97c5',
      'Shopify': 'https://e7.pngegg.com/pngimages/193/871/png-clipart-green-shopping-bag-illustration-shopify-logo-icons-logos-emojis-tech-companies-thumbnail.png',
      'Kaufland': 'https://upload.wikimedia.org/wikipedia/commons/6/65/Kaufland_Deutschland.png',
      'Ebay': 'https://static.vecteezy.com/system/resources/previews/020/190/417/non_2x/ebay-logo-ebay-icon-free-free-vector.jpg',
      'eBay': 'https://static.vecteezy.com/system/resources/previews/020/190/417/non_2x/ebay-logo-ebay-icon-free-free-vector.jpg',
    };

    if (platformIcons[platform]) {
      return (
        <img
          src={platformIcons[platform]}
          alt={platform}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
        {platform?.charAt(0) || '?'}
      </div>
    );
  };

  const AddressCard = ({ title, address, fallbackText }) => {
    if (!address && !fallbackText) return null;

    if (!address || (!address.name && !address.street)) {
      return (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-xs text-gray-500">{fallbackText || 'Brak danych'}</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="space-y-1 text-xs text-gray-700">
          <p className="font-medium">{address.name}</p>
          {address.companyName && <p>{address.companyName}</p>}
          {address.companyTaxNumber && <p>NIP: {address.companyTaxNumber}</p>}
          <p>{address.street} {address.streetNumber}</p>
          <p>{address.zipCode} {address.city}</p>
          {address.country && <p>{address.country}</p>}
          {address.phone && <p className="mt-1">{address.phone}</p>}
          {address.email && <p className="text-blue-600 break-all">{address.email}</p>}
        </div>
      </div>
    );
  };

  // Determine if there are existing shipments (from Apilo or local)
  const hasShipments = shipments.length > 0 || localShipments.length > 0;

  // Get best shipment data: prefer Apilo shipments, fallback to local
  const getDisplayShipments = () => {
    if (shipments.length > 0) {
      return shipments.map(s => ({
        id: s.shipmentId || s.id,
        tracking: s.tracking || s.trackingNumber || '',
        courier: s.courierName || s.carrier || '',
        status: s.status || '',
        shipmentId: s.shipmentId || s.id
      }));
    }
    if (localShipments.length > 0) {
      return localShipments.map(s => ({
        id: s.id,
        tracking: s.tracking_number || '',
        courier: s.courier || '',
        status: s.status || '',
        shipmentId: s.courier_shipment_id
      }));
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/zamowienia" className="text-blue-600 hover:underline mb-4 inline-block text-sm">
            &larr; Powrot
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const displayShipments = getDisplayShipments();

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-3xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {/* Back Link */}
        <Link href="/zamowienia" className="text-blue-600 hover:underline mb-4 inline-block text-sm">
          &larr; Powrot
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-start gap-3">
            {renderPlatformIcon(order.channel?.platform)}
            <div className="flex-grow min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                #{order.id}
              </h1>
              <p className="text-xs text-gray-600 truncate">{order.channel?.label}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(order.financials?.totalGross, order.financials?.currency)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(order.dates?.orderedAt)}
              </div>
            </div>
          </div>
          {/* Status badges */}
          <div className="mt-3 flex flex-wrap gap-2">
            {getStatusBadge(order.status?.deliveryStatus)}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              order.status?.paymentStatus === 'PAID'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {order.status?.paymentStatus === 'PAID' ? 'Oplacone' : 'Nieoplacone'}
            </span>
            {(order.dates?.sendDateMin || order.dates?.sendDateMax) && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Wys: {order.dates?.sendDateMax ? formatDate(order.dates.sendDateMax).split(',')[0] : formatDate(order.dates.sendDateMin).split(',')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow p-3">
            <p className="text-xs text-gray-500">Netto</p>
            <p className="font-semibold">{formatPrice(order.financials?.totalNet, order.financials?.currency)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3">
            <p className="text-xs text-gray-500">Zaplacono</p>
            <p className="font-semibold text-green-600">{formatPrice(order.financials?.paidAmount, order.financials?.currency)}</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Szczegoly</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nr zamowienia</span>
              <span className="font-medium">{order.id}</span>
            </div>
            {order.externalId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Nr zewnetrzny</span>
                <span className="font-medium text-xs">{order.externalId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Kanal</span>
              <span className="font-medium text-xs truncate ml-2">{order.channel?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Platforma</span>
              <span className="font-medium">{order.channel?.platform}</span>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <AddressCard title="Zamawiajacy" address={order.customer} fallbackText="Dane zaszyfrowane" />
          <AddressCard title="Wysylka" address={order.shipping} fallbackText="Dane zaszyfrowane" />
          <AddressCard title="Faktura" address={order.invoice || order.shipping} fallbackText="Brak danych" />
        </div>

        {/* Notes */}
        {order.notes && order.notes.length > 0 && (
          <div className="bg-yellow-50 rounded-lg shadow p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Uwagi</h3>
            {order.notes.map((note, idx) => (
              <div key={idx} className="text-xs text-gray-700">
                <p>{note.comment}</p>
                <p className="text-gray-500 mt-1">{formatDate(note.createdAt)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Payments */}
        {order.payments && order.payments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Historia platnosci</h3>
            {order.payments.map((payment, idx) => (
              <div key={idx} className="text-xs flex justify-between py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-600">{formatDate(payment.date)}</span>
                <span className="font-medium">{formatPrice(payment.amount, payment.currency)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Shipment Section */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Przesylka</h3>

          {shipmentsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Sprawdzanie przesylek...
            </div>
          ) : displayShipments.length > 0 ? (
            <div className="space-y-3">
              {displayShipments.map((s, idx) => {
                const logo = getCourierLogo(s.courier);
                const trackingUrl = getTrackingUrl(s.courier, s.tracking);
                return (
                  <div key={idx} className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {logo && (
                        <img src={logo} alt={s.courier} className="w-10 h-10 object-contain" />
                      )}
                      <div className="flex-grow min-w-0">
                        <div className="text-sm font-medium text-green-800">
                          {s.courier?.toUpperCase() || 'Kurier'}
                          {s.status && <span className="ml-2 text-xs font-normal text-green-600">({s.status})</span>}
                        </div>
                        {s.tracking ? (
                          trackingUrl ? (
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline font-mono"
                            >
                              {s.tracking}
                            </a>
                          ) : (
                            <span className="text-sm font-mono text-gray-700">{s.tracking}</span>
                          )
                        ) : (
                          <span className="text-xs text-gray-500">Brak numeru sledzenia</span>
                        )}
                      </div>
                      {s.shipmentId && (
                        <a
                          href={`/api/apilo/shipping/${s.shipmentId}/label`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Pobierz etykiete
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">Brak przesylek dla tego zamowienia</p>
              <button
                onClick={handleOpenShipModal}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Utworz przesylke
              </button>
            </div>
          )}

          {/* Also show create button if shipments exist (for multi-package orders) */}
          {displayShipments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={handleOpenShipModal}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Dodaj kolejna przesylke
              </button>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-sm font-semibold text-gray-900">Produkty ({order.items?.length || 0})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item, index) => (
              <div
                key={index}
                className={`p-3 ${item.isShipping ? 'bg-gray-50' : ''}`}
              >
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="w-12 h-12 flex-shrink-0">
                    {item.isShipping ? (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                    ) : item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="object-cover rounded"
                        unoptimized
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-grow min-w-0">
                    <div className="text-sm font-medium text-gray-900 line-clamp-2">
                      {item.isShipping && <span className="text-gray-500">[Wysylka] </span>}
                      {item.name}
                    </div>
                    {item.sku && <div className="text-xs text-gray-500">SKU: {item.sku}</div>}
                  </div>
                </div>

                {/* Price row */}
                <div className="mt-2 flex justify-between items-center text-sm">
                  <div className="text-gray-500">
                    {item.quantity} x {formatPrice(item.priceGross, order.financials?.currency)}
                  </div>
                  <div className="font-bold">
                    {formatPrice(item.totalGross, order.financials?.currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Razem</span>
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(order.financials?.totalGross, order.financials?.currency)}
            </span>
          </div>
        </div>
      </main>

      {/* Shipment Creation Modal */}
      {showShipModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShipModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Utworz przesylke</h3>
              <button onClick={() => setShowShipModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="p-4 space-y-4">
              {/* Order info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-900">Zamowienie #{order.id}</div>
                <div className="text-xs text-gray-500">
                  {order.items?.filter(i => !i.isShipping).length || 0} produktow &bull; {formatPrice(order.financials?.totalGross, order.financials?.currency)}
                </div>
              </div>

              {/* Carrier select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kurier (z Apilo)</label>
                {carriersLoading ? (
                  <div className="text-sm text-gray-500 py-2">Ladowanie kurierow...</div>
                ) : carrierAccounts.length === 0 ? (
                  <div className="text-sm text-yellow-600 py-2">
                    Brak skonfigurowanych kurierow w Apilo.
                  </div>
                ) : (
                  <select
                    value={shipForm.carrierAccountId || ''}
                    onChange={e => handleCarrierChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metoda wysylki</label>
                  <select
                    value={shipForm.methodUuid || ''}
                    onChange={e => setShipForm({ ...shipForm, methodUuid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  >
                    {shippingMethods.map(m => (
                      <option key={m.uuid || m.id} value={m.uuid || m.id}>{m.name || m.description || `Metoda ${m.id}`}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dimensions */}
              {shipForm.carrierAccountId && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wymiary paczki (cm)
                    <span className="ml-2 text-xs text-green-600 font-normal">(z szablonu kuriera)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Dlugosc</div>
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-gray-900">
                        {shipForm.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Szerokosc</div>
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-gray-900">
                        {shipForm.width}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Wysokosc</div>
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-gray-900">
                        {shipForm.height}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-green-600">
                    Waga zostanie pobrana z szablonu Apilo (Definicje wag)
                  </div>
                </div>
              )}

              {/* Recipient address preview */}
              {order.shipping && (order.shipping.name || order.shipping.street) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Adres odbiorcy</div>
                  <div className="text-sm text-gray-900">
                    <div className="font-medium">{order.shipping.name}</div>
                    <div>{order.shipping.street} {order.shipping.streetNumber}</div>
                    <div>{order.shipping.zipCode} {order.shipping.city}</div>
                    {order.shipping.country && <div>{order.shipping.country}</div>}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowShipModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Anuluj
              </button>
              <button
                onClick={handleCreateShipment}
                disabled={shipLoading || !shipForm.carrierAccountId}
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
