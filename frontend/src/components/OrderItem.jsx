function OrderItem({ order }) {
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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Order Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            {getPlatformIcon(order.channel?.platform)}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {order.channel?.label || 'Nieznany kanal'}
            </div>
            <div className="text-sm text-gray-500">
              ID: {order.id} {order.externalId && `| Ext: ${order.externalId}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.status?.paymentStatus === 'PAID'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {order.status?.paymentStatus === 'PAID' ? 'Oplacone' : 'Nieoplacone'}
          </span>
          <div className="text-right">
            <div className="font-bold text-lg text-gray-900">
              {formatPrice(order.financials?.totalGross, order.financials?.currency)}
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(order.dates?.orderedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="divide-y divide-gray-100">
        {order.items?.map((item, index) => (
          <div
            key={index}
            className={`px-6 py-4 flex items-center gap-4 ${
              item.isShipping ? 'bg-gray-50' : ''
            }`}
          >
            {/* Image */}
            <div className="w-16 h-16 flex-shrink-0">
              {item.isShipping ? (
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              ) : item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              {!item.isShipping && (
                <div
                  className="w-16 h-16 bg-gray-100 rounded items-center justify-center text-gray-400"
                  style={{ display: item.image ? 'none' : 'flex' }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-grow">
              <div className="font-medium text-gray-900">
                {item.isShipping && (
                  <span className="text-gray-500 mr-2">[Wysylka]</span>
                )}
                {item.name}
              </div>
              {item.sku && (
                <div className="text-sm text-gray-500">SKU: {item.sku}</div>
              )}
            </div>

            {/* Quantity */}
            <div className="text-center px-4">
              <div className="text-sm text-gray-500">Ilosc</div>
              <div className="font-medium">{item.quantity}</div>
            </div>

            {/* Price */}
            <div className="text-center px-4">
              <div className="text-sm text-gray-500">Cena</div>
              <div className="font-medium">
                {formatPrice(item.priceGross, order.financials?.currency)}
              </div>
            </div>

            {/* Total */}
            <div className="text-right px-4 min-w-[100px]">
              <div className="text-sm text-gray-500">Suma</div>
              <div className="font-bold">
                {formatPrice(item.totalGross, order.financials?.currency)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderItem;
