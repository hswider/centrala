'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function OrderItem({ order }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price, currency = 'PLN') => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      'Allegro': 'A',
      'Amazon': 'Am',
      'Shopify': 'S',
      'WooCommerce': 'W',
      'PrestaShop': 'P'
    };
    return icons[platform] || platform?.charAt(0) || '?';
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      // Podstawowe
      4: { label: 'Niepotwierdzone', color: 'bg-gray-100 text-gray-800' },
      1: { label: 'Nowy', color: 'bg-blue-100 text-blue-800' },
      7: { label: 'W realizacji', color: 'bg-yellow-100 text-yellow-800' },
      10: { label: 'Do wysłania', color: 'bg-purple-100 text-purple-800' },
      13: { label: 'Wysłane', color: 'bg-green-100 text-green-800' },
      19: { label: 'Anulowane', color: 'bg-gray-200 text-gray-800' },
      16: { label: 'Zduplikowane', color: 'bg-gray-200 text-gray-800' },
      // PALETY
      22: { label: 'PALETY-NOWE', color: 'bg-blue-100 text-blue-800' },
      113: { label: 'PALETY-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      166: { label: 'PILNE - PALETY', color: 'bg-orange-100 text-orange-800' },
      169: { label: 'BARDZO PILNE - PALETY', color: 'bg-red-100 text-red-800' },
      // PIKÓWKI
      25: { label: 'PIKÓWKI-NOWE', color: 'bg-blue-100 text-blue-800' },
      116: { label: 'PIKÓWKI-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      103: { label: 'PILNE - PIKÓWKI', color: 'bg-orange-100 text-orange-800' },
      106: { label: 'BARDZO PILNE - PIKÓWKI', color: 'bg-red-100 text-red-800' },
      // ŁAWKI
      28: { label: 'ŁAWKI-NOWE', color: 'bg-blue-100 text-blue-800' },
      119: { label: 'ŁAWKI-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      172: { label: 'PILNE - ŁAWKI', color: 'bg-orange-100 text-orange-800' },
      175: { label: 'BARDZO PILNE - ŁAWKI', color: 'bg-red-100 text-red-800' },
      // ŁAWKI SIEDZISKA
      199: { label: 'ŁAWKI SIEDZISKA-NOWE', color: 'bg-blue-100 text-blue-800' },
      205: { label: 'ŁAWKI SIEDZISKA-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      178: { label: 'PILNE - ŁAWKI SIEDZISKA', color: 'bg-orange-100 text-orange-800' },
      181: { label: 'BARDZO PILNE - ŁAWKI SIEDZISKA', color: 'bg-red-100 text-red-800' },
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
      209: { label: 'SARIS GARAGE NIESTANDARDY - Nowe', color: 'bg-blue-100 text-blue-800' },
      212: { label: 'SARIS GARAGE NIESTANDARDY - W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      // MEBLE OGRODOWE
      82: { label: 'MEBLE OGRODOWE-NOWE', color: 'bg-blue-100 text-blue-800' },
      128: { label: 'MEBLE OGRODOWE-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      // INDYWIDUALNE
      134: { label: 'INDYWIDUALNE-NOWE', color: 'bg-blue-100 text-blue-800' },
      137: { label: 'INDYWIDUALNE-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      // HOUSE
      155: { label: 'HOUSE NOWE ZAMÓWIENIA', color: 'bg-blue-100 text-blue-800' },
      158: { label: 'HOUSE PRODUKCJA', color: 'bg-yellow-100 text-yellow-800' },
      161: { label: 'HOUSE WYPRODUKOWANE', color: 'bg-green-100 text-green-800' },
      // Dosyłki i inne
      85: { label: 'MEBLE DOSYŁKA', color: 'bg-purple-100 text-purple-800' },
      110: { label: 'Dosyłka', color: 'bg-purple-100 text-purple-800' },
      60: { label: 'ETYKIETY DO ZR', color: 'bg-gray-100 text-gray-800' },
      // Wyjaśnienia
      97: { label: 'ZAM DO WYJAŚ', color: 'bg-orange-100 text-orange-800' },
      100: { label: 'WYJAŚNIONE', color: 'bg-green-100 text-green-800' },
      214: { label: 'UPS DO WYJASNIENIA', color: 'bg-orange-100 text-orange-800' },
      217: { label: 'UPS WYJASNIONE', color: 'bg-green-100 text-green-800' },
      233: { label: 'DO WYJASNIENIA KAROLA', color: 'bg-orange-100 text-orange-800' },
      // Zwroty i problemy
      63: { label: 'ODSTĄPIENIE OD UMOWY', color: 'bg-red-100 text-red-800' },
      81: { label: 'BEZ ODBIORU', color: 'bg-red-100 text-red-800' },
      223: { label: 'ZWROT NIEMCY', color: 'bg-red-100 text-red-800' },
      69: { label: 'BARCZEWO WRÓCIŁO', color: 'bg-red-100 text-red-800' },
      78: { label: 'ZWRÓCONE ŚRODKI', color: 'bg-green-100 text-green-800' },
      231: { label: 'WRÓCIŁO POLSKA', color: 'bg-red-100 text-red-800' },
      // Amazon
      188: { label: 'AMAZON W BLu', color: 'bg-yellow-100 text-yellow-800' }
    };
    return statusMap[status] || { label: `#${status}`, color: 'bg-gray-100 text-gray-800' };
  };

  const renderPlatformIcon = (platform) => {
    const platformIcons = {
      'Amazon': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoIwGv61BBxMlFDmBHeDvMo8-5HNlM4_8Skw&s',
      'Allegro': 'https://a.allegroimg.com/original/12c30c/0d4b068640de9b0daf22af9d97c5',
      'Shopify': 'https://images.icon-icons.com/836/PNG/512/Shopify_icon-icons.com_66757.png',
      'Kaufland': 'https://logotypy.net/wp-content/uploads/2023/09/logo-kaufland.jpg'
    };

    if (platformIcons[platform]) {
      return (
        <img
          src={platformIcons[platform]}
          alt={platform}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
        {getPlatformIcon(platform)}
      </div>
    );
  };

  // Get first non-shipping item for preview
  const mainItem = order.items?.find(item => !item.isShipping) || order.items?.[0];
  const itemCount = order.items?.filter(item => !item.isShipping).length || 0;

  return (
    <Link href={`/zamowienia/${order.id}`} className="block">
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
        {/* Compact Order Row */}
        <div className="p-3 sm:p-4">
          {/* Mobile Layout */}
          <div className="flex items-start gap-3">
            {/* Platform Icon */}
            <div className="flex-shrink-0">
              {renderPlatformIcon(order.channel?.platform)}
            </div>

            {/* Main Content */}
            <div className="flex-grow min-w-0">
              {/* Top Row: Channel & Price */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {order.channel?.label || 'Nieznany'}
                  </div>
                  <div className="text-xs text-gray-500">
                    #{order.id}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-gray-900">
                    {formatPrice(order.financials?.totalGross, order.financials?.currency)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(order.dates?.orderedAt)} {formatTime(order.dates?.orderedAt)}
                  </div>
                </div>
              </div>

              {/* Product Preview */}
              {mainItem && (
                <div className="mt-2 flex items-center gap-2">
                  {mainItem.image ? (
                    <Image
                      src={mainItem.image}
                      alt={mainItem.name}
                      width={32}
                      height={32}
                      className="object-cover rounded flex-shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-grow">
                    <div className="text-xs text-gray-700 truncate">{mainItem.name}</div>
                    {itemCount > 1 && (
                      <div className="text-xs text-gray-400">+{itemCount - 1} wiecej</div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Row */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusInfo(order.status?.deliveryStatus).color}`}>
                  {getStatusInfo(order.status?.deliveryStatus).label}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  order.status?.paymentStatus === 'PAID'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {order.status?.paymentStatus === 'PAID' ? 'Zaplac.' : 'Niezapl.'}
                </span>
                {(order.dates?.sendDateMin || order.dates?.sendDateMax) && (
                  <span className="text-xs text-blue-600">
                    Wys: {order.dates?.sendDateMax ? formatDate(order.dates.sendDateMax) : formatDate(order.dates.sendDateMin)}
                  </span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 self-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
