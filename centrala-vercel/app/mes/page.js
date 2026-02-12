'use client';

import { useState, useEffect } from 'react';

const TABS_GENERAL = [
  { key: 'wszystkie', label: 'Wszystkie', icon: '📋', desc: 'Wszystkie zamowienia', textColor: 'text-blue-600', borderColor: 'border-blue-500', bgLight: 'bg-blue-50' },
  { key: 'poczekalnia', label: 'Poczekalnia', icon: '⏳', desc: 'Anulowane / Nieoplacone', textColor: 'text-gray-600', borderColor: 'border-gray-400', bgLight: 'bg-gray-50' },
];

const TABS_PRODUCTION = [
  { key: 'krojownia', label: 'Krojownia', icon: '✂️', desc: 'Brak w magazynach GOT/POL/WYK', textColor: 'text-red-600', borderColor: 'border-red-500', bgLight: 'bg-red-50' },
  { key: 'szwalnia', label: 'Szwalnia', icon: '🧵', desc: 'Dostepne w wykrojach', textColor: 'text-purple-600', borderColor: 'border-purple-500', bgLight: 'bg-purple-50' },
  { key: 'polprodukty', label: 'Polprodukty', icon: '🔧', desc: 'Dostepne w polproduktach', textColor: 'text-amber-600', borderColor: 'border-amber-500', bgLight: 'bg-amber-50' },
  { key: 'gotowe', label: 'Gotowe produkty', icon: '📦', desc: 'Gotowe do wysylki', textColor: 'text-green-600', borderColor: 'border-green-500', bgLight: 'bg-green-50' },
  { key: 'wielopak', label: 'Weryfikacja wielopakow', icon: '📑', desc: 'Wiecej niz 1 produkt', textColor: 'text-orange-600', borderColor: 'border-orange-500', bgLight: 'bg-orange-50' },
];

const DEPARTMENTS = [...TABS_GENERAL, ...TABS_PRODUCTION];

const DEPT_BADGE_COLORS = {
  krojownia: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  szwalnia: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  polprodukty: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  gotowe: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  wielopak: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const CHANNEL_FLAGS = {
  'dobrelegowiska': 'pl',
  'poomkids': 'pl',
  'poom kids': 'pl',
  'poom-furniture': 'pl',
  'somilo': 'pl',
  'allegro': 'pl',
  'amazon de': 'de',
  'gutekissen': 'de',
  'amazon fr': 'fr',
  'amazon es': 'es',
  'amazon be': 'be',
  'amazon it': 'it',
  'amazon se': 'se',
  'amazon nl': 'nl',
};

function getChannelFlagCode(channelLabel) {
  if (!channelLabel) return null;
  const lower = channelLabel.toLowerCase();
  for (const [key, code] of Object.entries(CHANNEL_FLAGS)) {
    if (lower.includes(key)) return code;
  }
  return null;
}

function getChannelIcon(platform, channelLabel) {
  const label = (channelLabel || '').toLowerCase();
  if (platform === 'Allegro') return 'https://a.allegroimg.com/original/12c30c/0d4b068640de9b0daf22af9d97c5';
  if (platform === 'Amazon') return '/icons/amazon.png';
  if (platform === 'eBay' || platform === 'Ebay') return '/icons/ebay.png';
  if (platform === 'Kaufland') return 'https://upload.wikimedia.org/wikipedia/commons/6/65/Kaufland_Deutschland.png';
  if (label.includes('otto')) return '/icons/otto.png';
  if (label.includes('poom business')) return '/icons/poom-business.png';
  if (platform === 'Shopify' || platform === 'shopify' || platform === 'shop') {
    if (label.includes('poom kids') || label.includes('poomkids')) return '/icons/poomkids.png';
    if (label.includes('dobrelegowiska') || label.includes('dobre legowiska')) return '/icons/dobrelegowiska.png';
    if (label.includes('allepoduszki')) return '/icons/allepoduszki.png';
    if (label.includes('poom-furniture') || label.includes('poom furniture')) return '/icons/poom-furniture.png';
    return '/icons/gutekissen.png';
  }
  return null;
}

function getChannelKey(platform, channelLabel) {
  const label = (channelLabel || '').toLowerCase();
  if (platform === 'Allegro') return 'Allegro';
  if (platform === 'Amazon') {
    if (label.includes(' de')) return 'Amazon DE';
    if (label.includes(' fr')) return 'Amazon FR';
    if (label.includes(' es')) return 'Amazon ES';
    if (label.includes(' it')) return 'Amazon IT';
    if (label.includes(' be')) return 'Amazon BE';
    if (label.includes(' se')) return 'Amazon SE';
    if (label.includes(' nl')) return 'Amazon NL';
    return 'Amazon';
  }
  if (platform === 'eBay' || platform === 'Ebay') return 'eBay';
  if (platform === 'Kaufland') return 'Kaufland';
  if (label.includes('otto')) return 'OTTO';
  if (label.includes('poom business')) return 'POOM Business';
  if (platform === 'Shopify' || platform === 'shopify' || platform === 'shop') {
    if (label.includes('poom kids') || label.includes('poomkids')) return 'POOM Kids';
    if (label.includes('dobrelegowiska') || label.includes('dobre legowiska')) return 'Dobrelegowiska';
    if (label.includes('allepoduszki')) return 'Allepoduszki';
    if (label.includes('poom-furniture') || label.includes('poom furniture')) return 'POOM Furniture';
    return 'Gutekissen';
  }
  return channelLabel || platform || 'Inne';
}

// Multilingual color map → Polish name
const COLOR_MAP = {
  // Czarny
  'czarny': 'Czarny', 'czarna': 'Czarny', 'czarne': 'Czarny', 'black': 'Czarny',
  'schwarz': 'Czarny', 'černá': 'Czarny', 'nero': 'Czarny', 'negro': 'Czarny', 'noir': 'Czarny', 'zwart': 'Czarny',
  // Bialy
  'biały': 'Bialy', 'biała': 'Bialy', 'białe': 'Bialy', 'white': 'Bialy',
  'weiß': 'Bialy', 'weiss': 'Bialy', 'bílá': 'Bialy', 'bianco': 'Bialy', 'blanco': 'Bialy', 'blanc': 'Bialy', 'wit': 'Bialy',
  // Kremowy
  'kremowy': 'Kremowy', 'kremowa': 'Kremowy', 'krem': 'Kremowy', 'cream': 'Kremowy', 'creme': 'Kremowy', 'crème': 'Kremowy', 'ecru': 'Kremowy', 'krämfärgad': 'Kremowy',
  // Szary - odcienie
  'jasnoszary': 'Jasnoszary', 'j.szary': 'Jasnoszary', 'j.sz': 'Jasnoszary', 'light grey': 'Jasnoszary', 'light gray': 'Jasnoszary', 'hellgrau': 'Jasnoszary',
  'antracyt': 'Antracyt', 'anthrazit': 'Antracyt', 'antracit': 'Antracyt', 'anthracite': 'Antracyt',
  'ciemnoszary': 'Ciemnoszary', 'c.szary': 'Ciemnoszary', 'c.sz': 'Ciemnoszary', 'c. szary': 'Ciemnoszary', 'dark grey': 'Ciemnoszary', 'dark gray': 'Ciemnoszary', 'dunkelgrau': 'Ciemnoszary', 'pepper': 'Ciemnoszary',
  'szary': 'Szary', 'szara': 'Szary', 'szare': 'Szary', 'grey': 'Szary', 'gray': 'Szary',
  'grau': 'Szary', 'šedá': 'Szary', 'grigio': 'Szary', 'gris': 'Szary', 'grijs': 'Szary',
  'silver': 'Srebrny', 'srebro': 'Srebrny', 'srebrny': 'Srebrny', 'silber': 'Srebrny',
  'platyna': 'Platynowy', 'platynowy': 'Platynowy', 'platine': 'Platynowy', 'platin': 'Platynowy',
  'blue-grey': 'Szary',
  // Bezowy
  'beżowy': 'Bezowy', 'beżowa': 'Bezowy', 'beż': 'Bezowy', 'beige': 'Bezowy', 'sand': 'Bezowy',
  // Brazowy - odcienie
  'ciemnobrązowy': 'Ciemnobrazowy', 'ciemny brązowy': 'Ciemnobrazowy', 'dark brown': 'Ciemnobrazowy', 'dunkelbraun': 'Ciemnobrazowy',
  'chocolate': 'Ciemnobrazowy', 'czekoladowy': 'Ciemnobrazowy', 'czekolada': 'Ciemnobrazowy',
  'jasnobrązowy': 'Jasnobrazowy', 'jasny brązowy': 'Jasnobrazowy', 'light brown': 'Jasnobrazowy', 'hellbraun': 'Jasnobrazowy',
  'camel': 'Jasnobrazowy', 'cynamon': 'Jasnobrazowy', 'cinnamon': 'Jasnobrazowy',
  'brązowy': 'Brazowy', 'brązowa': 'Brazowy', 'brąz': 'Brazowy', 'brown': 'Brazowy',
  'braun': 'Brazowy', 'hnědá': 'Brazowy', 'marrone': 'Brazowy', 'marrón': 'Brazowy', 'brun': 'Brazowy', 'bruin': 'Brazowy',
  // Czerwony
  'czerwony': 'Czerwony', 'czerwona': 'Czerwony', 'czerwone': 'Czerwony', 'red': 'Czerwony',
  'rot': 'Czerwony', 'červená': 'Czerwony', 'rosso': 'Czerwony', 'rojo': 'Czerwony', 'rouge': 'Czerwony', 'rood': 'Czerwony',
  'bordo': 'Bordowy', 'bordowy': 'Bordowy', 'burgundy': 'Bordowy', 'bordeaux': 'Bordowy',
  // Niebieski - odcienie
  'jasnoniebieski': 'Jasnoniebieski', 'jasny niebieski': 'Jasnoniebieski', 'light blue': 'Jasnoniebieski', 'hellblau': 'Jasnoniebieski', 'baby blue': 'Jasnoniebieski',
  'niebieski': 'Niebieski', 'niebieska': 'Niebieski', 'blue': 'Niebieski',
  'blau': 'Niebieski', 'modrá': 'Niebieski', 'blu': 'Niebieski', 'azul': 'Niebieski', 'bleu': 'Niebieski', 'blauw': 'Niebieski',
  'cobalt': 'Niebieski', 'kobalt': 'Niebieski',
  // Turkusowy
  'turkusowy': 'Turkusowy', 'turkusowa': 'Turkusowy', 'turkusowe': 'Turkusowy', 'turquoise': 'Turkusowy', 'türkis': 'Turkusowy',
  // Granatowy
  'granatowy': 'Granatowy', 'granat': 'Granatowy', 'navy': 'Granatowy', 'dark blue': 'Granatowy', 'morski': 'Granatowy',
  'dunkelblau': 'Granatowy', 'marine': 'Granatowy',
  // Zielony - odcienie
  'ciemnozielony': 'Ciemnozielony', 'ciemny zielony': 'Ciemnozielony', 'dark green': 'Ciemnozielony', 'dunkelgrün': 'Ciemnozielony',
  'butelka': 'Ciemnozielony', 'butelkowy': 'Ciemnozielony', 'szmaragd': 'Ciemnozielony', 'szmaragdowy': 'Ciemnozielony',
  'jasnozielony': 'Jasnozielony', 'jasny zielony': 'Jasnozielony', 'light green': 'Jasnozielony', 'hellgrün': 'Jasnozielony', 'lime': 'Jasnozielony',
  'oliwkowy': 'Oliwkowy', 'olive': 'Oliwkowy', 'oliv': 'Oliwkowy', 'khaki': 'Oliwkowy',
  'zielony': 'Zielony', 'zielona': 'Zielony', 'green': 'Zielony',
  'grün': 'Zielony', 'zelená': 'Zielony', 'verde': 'Zielony', 'vert': 'Zielony', 'groen': 'Zielony',
  // Rozowy - odcienie
  'pudrowy': 'Pudrowy roz', 'pudrowy róż': 'Pudrowy roz', 'powder pink': 'Pudrowy roz',
  'brzoskwiniowy': 'Brzoskwiniowy', 'peach': 'Brzoskwiniowy', 'pfirsich': 'Brzoskwiniowy',
  'różowy': 'Rozowy', 'różowa': 'Rozowy', 'pink': 'Rozowy', 'rosa': 'Rozowy', 'flamingo': 'Rozowy',
  // Zolty - odcienie
  'musztardowy': 'Musztardowy', 'mustard': 'Musztardowy', 'senf': 'Musztardowy',
  'żółty': 'Zolty', 'żółta': 'Zolty', 'yellow': 'Zolty', 'gelb': 'Zolty', 'giallo': 'Zolty', 'amarillo': 'Zolty', 'jaune': 'Zolty', 'geel': 'Zolty',
  // Pomaranczowy
  'pomarańczowy': 'Pomaranczowy', 'orange': 'Pomaranczowy', 'arancione': 'Pomaranczowy',
  // Fioletowy - odcienie
  'lawendowy': 'Lawendowy', 'lavender': 'Lawendowy', 'lavendel': 'Lawendowy',
  'fioletowy': 'Fioletowy', 'fioletowa': 'Fioletowy', 'purple': 'Fioletowy', 'violet': 'Fioletowy', 'viola': 'Fioletowy', 'lila': 'Fioletowy',
};

const COLOR_SORTED_KEYS = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);

const COLOR_DOT = {
  'Czarny': 'bg-gray-900', 'Bialy': 'bg-white border border-gray-300', 'Kremowy': 'bg-amber-50 border border-amber-200',
  'Szary': 'bg-gray-400', 'Jasnoszary': 'bg-gray-300', 'Ciemnoszary': 'bg-gray-600', 'Antracyt': 'bg-gray-700', 'Srebrny': 'bg-gray-350 border border-gray-300', 'Platynowy': 'bg-gray-300 border border-gray-400',
  'Bezowy': 'bg-amber-200',
  'Brazowy': 'bg-amber-800', 'Ciemnobrazowy': 'bg-amber-950', 'Jasnobrazowy': 'bg-amber-500',
  'Czerwony': 'bg-red-500', 'Bordowy': 'bg-red-900',
  'Niebieski': 'bg-blue-500', 'Jasnoniebieski': 'bg-blue-300', 'Turkusowy': 'bg-teal-400', 'Granatowy': 'bg-blue-900',
  'Zielony': 'bg-green-500', 'Ciemnozielony': 'bg-green-800', 'Jasnozielony': 'bg-green-300', 'Oliwkowy': 'bg-yellow-700',
  'Rozowy': 'bg-pink-400', 'Pudrowy roz': 'bg-pink-200', 'Brzoskwiniowy': 'bg-orange-300',
  'Zolty': 'bg-yellow-400', 'Musztardowy': 'bg-yellow-600',
  'Pomaranczowy': 'bg-orange-500',
  'Fioletowy': 'bg-purple-500', 'Lawendowy': 'bg-purple-300',
};

function extractColor(productName) {
  if (!productName) return null;
  const lower = productName.toLowerCase();
  for (const key of COLOR_SORTED_KEYS) {
    if (lower.includes(key)) return COLOR_MAP[key];
  }
  return null;
}

function getOrderColor(order) {
  // Check item names first
  if (order.items) {
    for (const item of order.items) {
      const color = extractColor(item.name);
      if (color) return color;
    }
  }
  // Then check notes/uwagi
  if (order.notes) {
    for (const note of order.notes) {
      if (note.comment) {
        const color = extractColor(note.comment);
        if (color) return color;
      }
    }
  }
  return null;
}

export default function MESPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('wszystkie');
  const [secondaryFilter, setSecondaryFilter] = useState(null);
  const [channelFilter, setChannelFilter] = useState(null);
  const [colorFilter, setColorFilter] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [doneOrders, setDoneOrders] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState('');

  // Shipping state
  const [shipments, setShipments] = useState({});
  const [templates, setTemplates] = useState([]);
  const [showShipModal, setShowShipModal] = useState(null);
  const [shipLoading, setShipLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Inline order details (notes, customer, etc.)
  const [orderDetails, setOrderDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState({});

  const fetchOrderDetails = async (orderId) => {
    if (orderDetails[orderId]) {
      // Toggle off if already loaded
      setOrderDetails(prev => { const next = { ...prev }; delete next[orderId]; return next; });
      return;
    }
    setDetailsLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      setOrderDetails(prev => ({ ...prev, [orderId]: data }));
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setDetailsLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

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
          carrierName: carrierAccounts.find(c => c.id === shipForm.carrierAccountId)?.name || '',
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
    const c = courier?.toLowerCase() || '';
    if (c.includes('inpost')) return `https://inpost.pl/sledzenie-przesylek?number=${tracking}`;
    if (c.includes('dhl')) return `https://www.dhl.com/pl-pl/home/tracking.html?tracking-id=${tracking}`;
    if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${tracking}`;
    if (c.includes('dpd')) return `https://tracktrace.dpd.com.pl/parcelDetails?p1=${tracking}`;
    if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
    return null;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ status: 'all', limit: '500', dateFrom });
      if (dateTo) params.set('dateTo', dateTo);
      const res = await fetch(`/api/mes/orders?${params}`);
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
    fetchShipments();
    // Carriers & templates deferred until shipment modal opens
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [dateFrom, dateTo]);

  // Clear selection and reset page when department/filter changes
  useEffect(() => {
    setSelectedOrders(new Set());
    setCurrentPage(1);
  }, [department, secondaryFilter, channelFilter, colorFilter]);

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
    const JsBarcode = (await import('jsbarcode')).default;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const totalPages = Math.ceil(selected.length / 1); // calculated after
    let y = margin;
    let pageNum = 1;

    // Helper: generate barcode as data URL
    const generateBarcode = (text) => {
      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, String(text), {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: false,
          margin: 0
        });
        return canvas.toDataURL('image/png');
      } catch (e) {
        return null;
      }
    };

    // Helper: wrap text and return lines
    const wrapText = (text, maxWidth, fontSize) => {
      doc.setFontSize(fontSize);
      return doc.splitTextToSize(text, maxWidth);
    };

    // Helper: format date
    const fmtDate = (d) => {
      if (!d) return '-';
      const dt = new Date(d);
      return dt.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
             dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    };

    const fmtDateShort = (d) => {
      if (!d) return '-';
      return new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Helper: check space and add page if needed
    const ensureSpace = (needed) => {
      if (y + needed > 287) {
        // Footer
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128);
        doc.text('Druk: centrala-poom.vercel.app', margin, 293);
        doc.text(`Strona ${pageNum}`, pageWidth - margin, 293, { align: 'right' });
        doc.setTextColor(0);
        doc.addPage();
        y = margin;
        pageNum++;
      }
    };

    selected.forEach((order, orderIdx) => {
      // Estimate space needed for this order
      if (orderIdx > 0) ensureSpace(60);

      const startY = y;
      const barcodeWidth = 45;
      const barcodeHeight = 15;
      const headerTextWidth = contentWidth - barcodeWidth - 5;

      // === ORDER HEADER (numbered box) ===
      // Number badge
      doc.setFillColor(0, 0, 0);
      doc.rect(margin, y, 8, 7, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${orderIdx + 1}.`, margin + 1.5, y + 5);
      doc.setTextColor(0, 0, 0);

      // Order ID bold
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${order.id}`, margin + 10, y + 5);

      // Channel info on same line
      const idWidth = doc.getTextWidth(`${order.id}`);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const channelText = ` | ${order.channelLabel || order.channelPlatform || ''} | ${order.externalId || ''}`;
      doc.text(channelText, margin + 10 + idWidth + 1, y + 5);

      // Barcode on the right
      const barcodeImg = generateBarcode(order.id);
      if (barcodeImg) {
        doc.addImage(barcodeImg, 'PNG', pageWidth - margin - barcodeWidth, y, barcodeWidth, barcodeHeight);
      }

      y += 8;

      // Second line: payment, dates, invoice
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const paymentText = order.isPaid ? 'rozliczone' : 'nierozliczone';
      const invoiceText = order.isCanceled ? 'Anulowane' : 'Klient chce fakture: Nie';
      const metaLine = `Sposob platnosci: ${paymentText} | Data zamowienia: ${fmtDate(order.orderedAt)} | Data wysylki: ${fmtDateShort(order.shippingDate)} | ${invoiceText}`;
      const metaLines = wrapText(metaLine, headerTextWidth, 7);
      metaLines.forEach(line => {
        doc.text(line, margin + 1, y);
        y += 3.2;
      });

      y += 1;

      // === SHIPPING DATA ===
      const ship = order.shipping || order.customer || {};
      if (ship.name || ship.street || ship.city) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Dane wysylki: ', margin + 1, y);
        const labelW = doc.getTextWidth('Dane wysylki: ');
        doc.setFont('helvetica', 'normal');
        const addrParts = [
          ship.name,
          ship.companyName,
          [ship.street, ship.streetNumber].filter(Boolean).join(' '),
          [ship.zipCode, ship.city].filter(Boolean).join(' '),
          ship.country,
          ship.phone,
          ship.email
        ].filter(Boolean).join(' | ');
        const addrLines = wrapText(addrParts, contentWidth - labelW - 2, 7.5);
        if (addrLines.length > 0) {
          doc.text(addrLines[0], margin + 1 + labelW, y);
          for (let i = 1; i < addrLines.length; i++) {
            y += 3.5;
            doc.text(addrLines[i], margin + 1, y);
          }
        }
        y += 5;
      }

      // === NOTES (if any) ===
      const notesWithComments = (order.notes || []).filter(n => n.comment && n.comment.trim());
      if (notesWithComments.length > 0) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Uwagi: ', margin + 1, y);
        const uwLabelW = doc.getTextWidth('Uwagi: ');
        doc.setFont('helvetica', 'normal');
        const notesText = notesWithComments.map(n => n.comment.trim()).join(' | ');
        const notesLines = wrapText(notesText, contentWidth - uwLabelW - 2, 7.5);
        if (notesLines.length > 0) {
          doc.text(notesLines[0], margin + 1 + uwLabelW, y);
          for (let i = 1; i < notesLines.length; i++) {
            y += 3.5;
            doc.text(notesLines[i], margin + 1, y);
          }
        }
        y += 5;
      }

      // === ITEMS TABLE ===
      const colLp = margin + 1;
      const colName = margin + 10;
      const colSku = margin + 120;
      const colEan = margin + 148;
      const colQty = margin + contentWidth - 5;

      // Table header
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(margin, y - 1, margin + contentWidth, y - 1);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Lp.', colLp, y + 2.5);
      doc.text('Nazwa', colName, y + 2.5);
      doc.text('SKU', colSku, y + 2.5);
      doc.text('EAN', colEan, y + 2.5);
      doc.text('Ilosc', colQty, y + 2.5, { align: 'right' });
      y += 4;
      doc.line(margin, y, margin + contentWidth, y);
      y += 1;

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const items = (order.items || []);
      items.forEach((item, idx) => {
        ensureSpace(8);

        const nameText = `(${item.name || '-'})`;
        const nameLines = wrapText(nameText, colSku - colName - 2, 7);
        const rowHeight = Math.max(nameLines.length * 3.2, 4);

        doc.text(`${idx + 1}.`, colLp, y + 3);

        // Name (multi-line)
        nameLines.forEach((line, li) => {
          doc.text(line, colName, y + 3 + li * 3.2);
        });

        // SKU
        const skuText = item.sku || '-';
        const skuLines = wrapText(skuText, colEan - colSku - 2, 7);
        skuLines.forEach((line, li) => {
          doc.text(line, colSku, y + 3 + li * 3.2);
        });

        // EAN
        doc.text(item.ean || '-', colEan, y + 3);

        // Quantity
        doc.text(String(item.quantity || 1), colQty, y + 3, { align: 'right' });

        y += rowHeight + 1.5;
        doc.setDrawColor(200);
        doc.setLineWidth(0.1);
        doc.line(margin, y, margin + contentWidth, y);
        y += 0.5;
      });

      y += 3;

      // Border around entire order block
      doc.setDrawColor(0);
      doc.setLineWidth(0.4);
      doc.rect(margin, startY - 1, contentWidth, y - startY + 1);

      y += 4;
    });

    // Final page footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text('Druk: centrala-poom.vercel.app', margin, 293);
    doc.text(`Strona ${pageNum}`, pageWidth - margin, 293, { align: 'right' });

    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');
  };

  // Client-side filtering: department first, then secondary filter on top
  const departmentOrders = department === 'wszystkie' ? orders : department === 'poczekalnia' ? orders.filter(o => o.department === null) : orders.filter(o => o.department === department);

  // Channel counts scoped to department
  const channelCounts = (() => {
    const counts = {};
    for (const o of departmentOrders) {
      const key = getChannelKey(o.channelPlatform, o.channelLabel);
      if (!counts[key]) {
        counts[key] = { key, icon: getChannelIcon(o.channelPlatform, o.channelLabel), count: 0 };
      }
      counts[key].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count);
  })();

  const afterChannelFilter = channelFilter
    ? departmentOrders.filter(o => getChannelKey(o.channelPlatform, o.channelLabel) === channelFilter)
    : departmentOrders;

  const afterColorFilter = colorFilter
    ? afterChannelFilter.filter(o => {
        const c = getOrderColor(o);
        return colorFilter === 'Nieznany' ? c === null : c === colorFilter;
      })
    : afterChannelFilter;

  // Color counts (only for krojownia)
  const colorCounts = (() => {
    if (department !== 'krojownia') return [];
    const counts = {};
    for (const o of afterChannelFilter) {
      const color = getOrderColor(o);
      const key = color || 'Nieznany';
      if (!counts[key]) counts[key] = { key, count: 0 };
      counts[key].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count);
  })();

  const afterSecondaryFilter = (() => {
    if (!secondaryFilter) return afterColorFilter;
    if (['shipped', 'canceled', 'unpaid', 'needs_production', 'partial', 'ready_to_ship'].includes(secondaryFilter)) {
      return afterColorFilter.filter(o => o.orderStatus === secondaryFilter);
    }
    if (typeof secondaryFilter === 'number') return afterColorFilter.filter(o => o.deliveryStatus === secondaryFilter);
    return afterColorFilter;
  })();

  const filteredOrders = (() => {
    if (!searchQuery.trim()) return afterSecondaryFilter;
    const words = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return afterSecondaryFilter.filter(o => {
      // Build searchable text from all relevant fields
      const text = [
        String(o.id),
        o.externalId || '',
        o.channelLabel || '',
        ...(o.items || []).flatMap(item => [item.name || '', item.sku || ''])
      ].join(' ').toLowerCase();
      // All words must match (any order)
      return words.every(w => text.includes(w));
    });
  })();

  // Status counts scoped to current department tab
  const deptStatusCounts = {
    needsProduction: departmentOrders.filter(o => o.orderStatus === 'needs_production').length,
    partial: departmentOrders.filter(o => o.orderStatus === 'partial').length,
    readyToShip: departmentOrders.filter(o => o.orderStatus === 'ready_to_ship').length,
    shipped: departmentOrders.filter(o => o.orderStatus === 'shipped').length,
    canceled: departmentOrders.filter(o => o.orderStatus === 'canceled').length,
  };

  // OMS status counts scoped to current department tab
  const deptOmsStatuses = (() => {
    const counts = {};
    for (const o of departmentOrders) {
      if (o.deliveryStatus != null) {
        const key = o.deliveryStatus;
        if (!counts[key]) {
          counts[key] = { status: key, label: o.omsStatus || `#${key}`, color: o.omsStatusColor || 'gray', count: 0 };
        }
        counts[key].count++;
      }
    }
    return Object.values(counts).sort((a, b) => b.count - a.count);
  })();

  const totalPages = Math.ceil(filteredOrders.length / perPage);
  const safePage = Math.min(currentPage, totalPages || 1);
  const visibleOrders = filteredOrders.slice((safePage - 1) * perPage, safePage * perPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'shipped':
      case 'unpaid':
        return <span className="px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-800 rounded">NIEOPLACONE</span>;
      case 'ready':
      case 'ready_to_ship':
      case 'partial':
        return <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-800 rounded">📦 Gotowe produkty</span>;
      case 'from_polprodukty':
        return <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded">🔧 Polprodukty</span>;
      case 'from_wykroje':
        return <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded">🧵 Szwalnia</span>;
      case 'from_surowce':
      case 'needs_production':
        return <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-800 rounded">✂️ Krojownia</span>;
      case 'canceled':
      default:
        return null;
    }
  };

  const getMagazynBadge = (kategoria, available, needed) => {
    const isAvailable = available && available.stan >= needed;
    const isPartial = available && available.stan > 0 && available.stan < needed;

    const styles = {
      gotowe: { bg: isAvailable ? 'bg-green-100 text-green-700 border-green-300' : isPartial ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-gray-100 text-gray-400 border-gray-200', icon: '📦', label: 'Gotowe produkty' },
      polprodukty: { bg: isAvailable ? 'bg-blue-100 text-blue-700 border-blue-300' : isPartial ? 'bg-blue-50 text-blue-400 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200', icon: '🔧', label: 'Polprodukty' },
      wykroje: { bg: isAvailable ? 'bg-amber-100 text-amber-700 border-amber-300' : isPartial ? 'bg-amber-50 text-amber-400 border-amber-200' : 'bg-gray-100 text-gray-400 border-gray-200', icon: '✂️', label: 'Wykroje' },
      surowce: { bg: isAvailable ? 'bg-orange-100 text-orange-700 border-orange-300' : isPartial ? 'bg-orange-50 text-orange-400 border-orange-200' : 'bg-gray-100 text-gray-400 border-gray-200', icon: '🧱', label: 'Surowce' }
    };

    const s = styles[kategoria];
    const stan = available ? available.stan : 0;

    return (
      <div
        className={`px-1.5 sm:px-2 py-1 rounded border text-[10px] font-semibold flex items-center gap-0.5 sm:gap-1 ${s.bg}`}
        title={`${s.label}: ${stan} szt. (potrzeba: ${needed})`}
      >
        <span>{s.icon}</span>
        <span className="hidden sm:inline">{s.label}</span>
        <span className="opacity-60">({stan})</span>
      </div>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return '';
    const code = countryCode.toUpperCase();
    const flags = {
      DE: '\u{1F1E9}\u{1F1EA}', FR: '\u{1F1EB}\u{1F1F7}', PL: '\u{1F1F5}\u{1F1F1}',
      IT: '\u{1F1EE}\u{1F1F9}', ES: '\u{1F1EA}\u{1F1F8}', NL: '\u{1F1F3}\u{1F1F1}',
      BE: '\u{1F1E7}\u{1F1EA}', AT: '\u{1F1E6}\u{1F1F9}', GB: '\u{1F1EC}\u{1F1E7}',
      US: '\u{1F1FA}\u{1F1F8}', CZ: '\u{1F1E8}\u{1F1FF}', SK: '\u{1F1F8}\u{1F1F0}',
      SE: '\u{1F1F8}\u{1F1EA}', DK: '\u{1F1E9}\u{1F1F0}', FI: '\u{1F1EB}\u{1F1EE}',
      PT: '\u{1F1F5}\u{1F1F9}', IE: '\u{1F1EE}\u{1F1EA}', LU: '\u{1F1F1}\u{1F1FA}',
      HU: '\u{1F1ED}\u{1F1FA}', RO: '\u{1F1F7}\u{1F1F4}', BG: '\u{1F1E7}\u{1F1EC}',
      HR: '\u{1F1ED}\u{1F1F7}', SI: '\u{1F1F8}\u{1F1EE}', LT: '\u{1F1F1}\u{1F1F9}',
      LV: '\u{1F1F1}\u{1F1FB}', EE: '\u{1F1EA}\u{1F1EA}', GR: '\u{1F1EC}\u{1F1F7}',
      CH: '\u{1F1E8}\u{1F1ED}', NO: '\u{1F1F3}\u{1F1F4}',
    };
    return flags[code] || '';
  };

  const getDeptCount = (key) => {
    if (!stats?.departments) return 0;
    return stats.departments[key] || 0;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            <img src="/poom-wood-logo.png" alt="Poom Wood" className="h-8 sm:h-10 w-auto" />
            MES
          </h1>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow dark:shadow-gray-900 border border-gray-200 dark:border-gray-700 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 dark:text-gray-400">Od:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-1.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white max-w-[140px]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 dark:text-gray-400">Do:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-1.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white max-w-[140px]"
              />
            </div>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Odswiez'}
            </button>
          </div>
        </div>

        {/* General tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 mb-3">
          <div className="grid grid-cols-2">
            {TABS_GENERAL.map(dept => {
              const isActive = department === dept.key;
              const count = getDeptCount(dept.key);
              return (
                <button
                  key={dept.key}
                  onClick={() => { setDepartment(dept.key); setSecondaryFilter(null); setColorFilter(null); }}
                  className={`flex flex-col items-start p-3 lg:p-4 transition-colors border-b-2 text-left ${
                    isActive
                      ? `${dept.borderColor} ${dept.bgLight}`
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`text-xs truncate ${isActive ? dept.textColor : 'text-gray-500 dark:text-gray-400'}`}>
                    {dept.icon} {dept.label}
                  </span>
                  <span className={`text-xl lg:text-2xl font-bold ${isActive ? dept.textColor : 'text-gray-400 dark:text-gray-500'}`}>
                    {count}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 -mt-1 truncate w-full">
                    {dept.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Production cells tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 mb-3">
          <div className="px-4 pt-2 pb-0">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gniazda produkcyjne</span>
          </div>
          <div className="flex overflow-x-auto">
            {TABS_PRODUCTION.map(dept => {
              const isActive = department === dept.key;
              const count = getDeptCount(dept.key);
              return (
                <button
                  key={dept.key}
                  onClick={() => { setDepartment(dept.key); setSecondaryFilter(null); setColorFilter(null); }}
                  className={`flex-1 min-w-[100px] flex flex-col items-start p-2.5 sm:p-3 lg:p-4 transition-colors border-b-2 text-left flex-shrink-0 sm:flex-shrink ${
                    isActive
                      ? `${dept.borderColor} ${dept.bgLight}`
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`text-[10px] sm:text-xs truncate w-full ${isActive ? dept.textColor : 'text-gray-500 dark:text-gray-400'}`}>
                    {dept.icon} {dept.label}
                  </span>
                  <span className={`text-lg sm:text-xl lg:text-2xl font-bold ${isActive ? dept.textColor : 'text-gray-400 dark:text-gray-500'}`}>
                    {count}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 -mt-1 truncate w-full hidden sm:block">
                    {dept.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter bars */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 overflow-hidden mb-3">
          {/* Combined filter bar - scrollable carousel */}
          <div className="overflow-x-auto border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1.5 px-4 py-2 text-xs whitespace-nowrap min-w-0">
              {/* Statusy */}
              <span className="text-gray-400 dark:text-gray-500 font-medium flex-shrink-0">Statusy:</span>
              <button
                onClick={() => setSecondaryFilter(secondaryFilter === 'needs_production' ? null : 'needs_production')}
                className={`px-2 py-1 rounded transition-colors flex-shrink-0 ${secondaryFilter === 'needs_production' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Do produkcji ({deptStatusCounts.needsProduction})
              </button>
              <button
                onClick={() => setSecondaryFilter(secondaryFilter === 'partial' ? null : 'partial')}
                className={`px-2 py-1 rounded transition-colors flex-shrink-0 ${secondaryFilter === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-bold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Czesciowo ({deptStatusCounts.partial})
              </button>
              <button
                onClick={() => setSecondaryFilter(secondaryFilter === 'ready_to_ship' ? null : 'ready_to_ship')}
                className={`px-2 py-1 rounded transition-colors flex-shrink-0 ${secondaryFilter === 'ready_to_ship' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Gotowe do wysylki ({deptStatusCounts.readyToShip})
              </button>
              <button
                onClick={() => setSecondaryFilter(secondaryFilter === 'shipped' ? null : 'shipped')}
                className={`px-2 py-1 rounded transition-colors flex-shrink-0 ${secondaryFilter === 'shipped' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Zrealizowane ({deptStatusCounts.shipped})
              </button>
              <button
                onClick={() => setSecondaryFilter(secondaryFilter === 'canceled' ? null : 'canceled')}
                className={`px-2 py-1 rounded transition-colors flex-shrink-0 ${secondaryFilter === 'canceled' ? 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 font-bold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Anulowane ({deptStatusCounts.canceled})
              </button>

              {/* Apilo/BL */}
              {deptOmsStatuses.length > 0 && (
                <>
                  <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">|</span>
                  <span className="text-gray-400 dark:text-gray-500 font-medium flex-shrink-0">Apilo/BL:</span>
                  {deptOmsStatuses.map(s => {
                    const colorMap = {
                      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                      yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                      gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
                    };
                    const isActive = secondaryFilter === s.status;
                    return (
                      <button
                        key={s.status}
                        onClick={() => setSecondaryFilter(isActive ? null : s.status)}
                        className={`px-1.5 py-0.5 rounded transition-colors flex-shrink-0 ${
                          isActive
                            ? `${colorMap[s.color] || colorMap.gray} font-bold ring-1 ring-current`
                            : `${colorMap[s.color] || colorMap.gray} opacity-70 hover:opacity-100`
                        }`}
                      >
                        {s.label} ({s.count})
                      </button>
                    );
                  })}
                </>
              )}


            </div>
          </div>
          {/* Channel filter bar - separate */}
          {channelCounts.length > 1 && (
            <div className="overflow-x-auto border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1.5 px-4 py-2 text-xs whitespace-nowrap min-w-0">
                <span className="text-gray-400 dark:text-gray-500 font-medium flex-shrink-0">Kanal:</span>
                <button
                  onClick={() => setChannelFilter(null)}
                  className={`px-2 py-1 rounded transition-colors flex items-center gap-1 flex-shrink-0 ${!channelFilter ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Wszystkie ({departmentOrders.length})
                </button>
                {channelCounts.map(ch => (
                  <button
                    key={ch.key}
                    onClick={() => setChannelFilter(channelFilter === ch.key ? null : ch.key)}
                    className={`px-2 py-1 rounded transition-colors flex items-center gap-1 flex-shrink-0 ${channelFilter === ch.key ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    {ch.icon ? (
                      <img src={ch.icon} alt={ch.key} className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <span className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center text-white text-[8px] font-bold">{ch.key.charAt(0)}</span>
                    )}
                    {ch.key} ({ch.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Color filter bar - only for krojownia - separate card */}
        {department === 'krojownia' && colorCounts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 overflow-hidden mb-3">
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap min-w-0">
                <span className="text-gray-500 dark:text-gray-400 font-semibold flex-shrink-0">Kolor:</span>
                <button
                  onClick={() => setColorFilter(null)}
                  className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 flex-shrink-0 ${!colorFilter ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Wszystkie
                </button>
                {colorCounts.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setColorFilter(colorFilter === c.key ? null : c.key)}
                    className={`px-3 py-1.5 rounded transition-colors flex items-center gap-2 flex-shrink-0 ${colorFilter === c.key ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <span className={`w-4 h-4 rounded-full flex-shrink-0 ${COLOR_DOT[c.key] || 'bg-gray-400'}`}></span>
                    {c.key} ({c.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Order list */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b border-gray-100 dark:border-gray-700 space-y-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <input
                type="checkbox"
                checked={visibleOrders.length > 0 && visibleOrders.every(o => selectedOrders.has(o.id))}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                title="Zaznacz wszystkie"
              />
              <h2 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                {secondaryFilter
                  ? secondaryFilter === 'shipped' ? 'Zrealizowane' :
                    secondaryFilter === 'canceled' ? 'Anulowane' :
                    secondaryFilter === 'unpaid' ? 'Nieoplacone' :
                    secondaryFilter === 'needs_production' ? 'Do produkcji' :
                    secondaryFilter === 'partial' ? 'Czesciowo' :
                    secondaryFilter === 'ready_to_ship' ? 'Gotowe do wysylki' :
                    stats?.omsStatuses?.find(s => s.status === secondaryFilter)?.label || `Status #${secondaryFilter}`
                  : DEPARTMENTS.find(d => d.key === department)?.label || 'Zamowienia'
                }
                {' '}({filteredOrders.length})
              </h2>
              <div className="flex items-center gap-1">
                {[50, 100, 250].map(n => (
                  <button
                    key={n}
                    onClick={() => { setPerPage(n); setCurrentPage(1); }}
                    className={`px-2 py-0.5 text-xs rounded ${perPage === n ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[150px] max-w-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Szukaj: nr, SKU, nazwa..."
                  className="pl-7 pr-6 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
                )}
              </div>
              {selectedOrders.size > 0 && (
                <>
                  <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    {selectedOrders.size} zazn.
                  </span>
                  <button
                    onClick={() => setSelectedOrders(new Set())}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 underline"
                  >
                    Wyczysc
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-2 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    PDF
                  </button>
                </>
              )}
            </div>
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
            <div className="divide-y-2 divide-gray-200 dark:divide-gray-600">
              {visibleOrders.map((order, orderIdx) => {
                const hasAlerts = order.items?.some(i => i.alerts && i.alerts.length > 0);
                const isDone = doneOrders.has(order.id);
                const stripeBg = isDone ? 'bg-green-50 dark:bg-green-900/20' : orderIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750';
                return (
                  <div key={order.id} className={stripeBg}>
                    {/* Naglowek zamowienia */}
                    <div
                      className="px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer flex items-center gap-2 sm:gap-3"
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
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          {(() => {
                            const flagCode = getChannelFlagCode(order.channelLabel) || (order.shipping?.country?.toLowerCase());
                            return flagCode ? (
                              <img
                                src={`https://flagcdn.com/20x15/${flagCode}.png`}
                                alt={flagCode}
                                title={order.shipping?.country?.toUpperCase() || flagCode.toUpperCase()}
                                className="w-5 h-3.5 object-cover rounded-sm"
                              />
                            ) : null;
                          })()}
                          <span className="font-mono text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                            #{order.id}
                          </span>
                          {order.externalId && (
                            <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                              ({order.externalId})
                            </span>
                          )}
                          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">
                            {order.channelLabel || order.channelPlatform}
                          </span>
                          {order.omsStatus && (
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                              order.omsStatusColor === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              order.omsStatusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              order.omsStatusColor === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              order.omsStatusColor === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              order.omsStatusColor === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                              order.omsStatusColor === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                              'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {order.omsStatus}
                            </span>
                          )}
                          {getStatusBadge(order.orderStatus)}
                          {/* Alert indicator */}
                          {hasAlerts && (
                            <span className="text-yellow-500 text-sm" title="Zamowienie wymaga uwagi">⚠</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatDate(order.orderedAt)} • {order.totalGross} {order.currency}
                          {order.shippingDate && (
                            <span className="text-blue-500 dark:text-blue-400"> • Wys: {new Date(order.shippingDate).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                          )}
                        </div>
                        {order.notes && order.notes.filter(n => n.comment && n.comment.trim()).length > 0 && (
                          <div className="mt-1 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-800">
                            <span className="font-bold">Uwagi: </span>
                            {order.notes.filter(n => n.comment && n.comment.trim()).map((n, i) => <span key={i}>{i > 0 && ' | '}{n.comment}</span>)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Szczegoly produktow */}
                    {(
                      <div className={`px-3 sm:px-4 pb-3 sm:pb-4 ${isDone ? 'bg-green-50 dark:bg-green-900/20' : orderIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}`}>
                        {!doneOrders.has(order.id) && (
                          <>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg p-3"
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
                                      <div className="text-sm text-gray-900 dark:text-white line-clamp-1">
                                        <span className="font-bold">{item.quantity} szt.</span> {item.name}
                                      </div>
                                      <div className="text-xs text-gray-400 dark:text-gray-500">
                                        SKU: {item.sku || '-'}
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
                                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                                        {expandedItem === `${order.id}-${idx}` ? 'Ukryj recepture' : 'Pokaz recepture'}
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
                          </>
                        )}

                        {/* Akcje */}
                        <div className={`${doneOrders.has(order.id) ? '' : 'mt-3'} flex items-center gap-1.5 sm:gap-2 flex-wrap`}>
                          {shipments[order.id] && (
                            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                              <img src={getCourierLogo(shipments[order.id].courier)} alt="" className="w-8 h-8 object-contain" />
                              <div className="text-xs">
                                <div className="font-medium text-green-700 dark:text-green-300">
                                  {shipments[order.id].courier} • {shipments[order.id].status}
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
                          )}
                          {order.isCanceled ? (
                            <span className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-500 rounded line-through">
                              Anulowane
                            </span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowShipModal(order); if (carrierAccounts.length === 0) { fetchCarrierAccounts(); fetchTemplates(); } }}
                              className="px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1 bg-gray-600 text-white hover:bg-gray-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                              {shipments[order.id] ? 'Nowa przesylka' : 'Przygotuj przesylke'}
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); fetchOrderDetails(order.id); }}
                            className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1 ${orderDetails[order.id] ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                          >
                            {detailsLoading[order.id] ? (
                              <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full"></span>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                            Szczegoly
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const wasDone = doneOrders.has(order.id);
                              setDoneOrders(prev => {
                                const next = new Set(prev);
                                if (wasDone) next.delete(order.id);
                                else next.add(order.id);
                                return next;
                              });
                              if (!wasDone) {
                                setExpandedOrder(null);
                              } else {
                                setExpandedOrder(order.id);
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1 ${doneOrders.has(order.id) ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'}`}
                          >
                            {doneOrders.has(order.id) ? '✓ Wykonane' : 'Oznacz jako wykonane'}
                          </button>
                        </div>

                        {/* Inline order details panel */}
                        {orderDetails[order.id] && (
                          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs space-y-3" onClick={e => e.stopPropagation()}>
                            {/* Uwagi */}
                            {orderDetails[order.id].notes && orderDetails[order.id].notes.length > 0 ? (
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <div className="font-bold text-yellow-800 dark:text-yellow-300 mb-1">Uwagi</div>
                                {orderDetails[order.id].notes.filter(n => n.comment && n.comment.trim()).map((n, i) => (
                                  <div key={i} className="text-yellow-700 dark:text-yellow-400 mb-1">
                                    <div>{n.comment}</div>
                                    {n.createdAt && <div className="text-yellow-500 dark:text-yellow-600 text-[10px] mt-0.5">{new Date(n.createdAt).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-400 dark:text-gray-500 italic">Brak uwag</div>
                            )}

                            {/* Adres dostawy */}
                            {orderDetails[order.id].shipping && (
                              <div>
                                <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Adres dostawy</div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  <div>{orderDetails[order.id].shipping.name}</div>
                                  {orderDetails[order.id].shipping.companyName && <div>{orderDetails[order.id].shipping.companyName}</div>}
                                  <div>{orderDetails[order.id].shipping.street} {orderDetails[order.id].shipping.streetNumber}</div>
                                  <div>{orderDetails[order.id].shipping.zipCode} {orderDetails[order.id].shipping.city}, {orderDetails[order.id].shipping.country}</div>
                                  {orderDetails[order.id].shipping.phone && <div className="text-gray-500">{orderDetails[order.id].shipping.phone}</div>}
                                </div>
                              </div>
                            )}

                            {/* Platnosci */}
                            {orderDetails[order.id].payments && orderDetails[order.id].payments.length > 0 && (
                              <div>
                                <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Platnosci</div>
                                {orderDetails[order.id].payments.map((p, i) => (
                                  <div key={i} className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>{p.date ? new Date(p.date).toLocaleDateString('pl-PL') : '-'}</span>
                                    <span className="font-medium">{p.amount} {p.currency}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filteredOrders.length)} z {filteredOrders.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage === 1}
                  className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  &laquo;
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  &lsaquo; Poprzednia
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`dot-${i}`} className="px-1 text-xs text-gray-400">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-2.5 py-1 text-xs rounded ${safePage === p ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Nastepna &rsaquo;
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  &raquo;
                </button>
              </div>
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
                <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">{showShipModal.shipping?.country && <img src={`https://flagcdn.com/20x15/${showShipModal.shipping.country.toLowerCase()}.png`} alt={showShipModal.shipping.country} className="w-5 h-3.5 object-cover rounded-sm" />}Zamowienie #{showShipModal.id}</div>
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
