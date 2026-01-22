'use client';

import { useState, useRef } from 'react';

export default function DMSPage() {
  const [activeTab, setActiveTab] = useState('generated'); // 'generated' | 'fromOrder' | 'manual'
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState([]);
  const [manualDocType, setManualDocType] = useState(null); // null | 'gutekissen-invoice' | ...
  const invoiceRef = useRef(null);

  // Invoice form state
  const [invoice, setInvoice] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentTerms: 'Vorkasse',
    // Seller (GuteKissen)
    sellerName: 'GuteKissen',
    sellerEmail: 'info@gutekissen.de',
    sellerAddress: 'Musterstraße 123, 12345 Berlin',
    sellerPhone: '',
    sellerTaxId: 'DE315827039',
    // Buyer
    buyerName: '',
    buyerEmail: '',
    buyerAddress: '',
    buyerPhone: '',
    // Items
    items: [],
    // Notes
    notes: 'Vielen Dank für Ihren Einkauf!',
    // Totals
    subtotal: 0,
    taxRate: 19,
    taxAmount: 0,
    total: 0,
    currency: 'EUR'
  });

  const resetInvoice = () => {
    const today = new Date();
    setInvoice({
      invoiceNumber: `GK-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-XXX`,
      invoiceDate: today.toISOString().split('T')[0],
      paymentTerms: 'Vorkasse',
      sellerName: 'GuteKissen',
      sellerEmail: 'info@gutekissen.de',
      sellerAddress: 'Musterstraße 123, 12345 Berlin',
      sellerPhone: '',
      sellerTaxId: 'DE315827039',
      buyerName: '',
      buyerEmail: '',
      buyerAddress: '',
      buyerPhone: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, total: 0, taxIncluded: true }],
      notes: 'Vielen Dank für Ihren Einkauf!',
      subtotal: 0,
      taxRate: 19,
      taxAmount: 0,
      total: 0,
      currency: 'EUR'
    });
    setSelectedOrder(null);
  };

  const searchOrders = async () => {
    if (!search.trim()) return;

    try {
      setLoading(true);
      setSearched(true);
      const res = await fetch(`/api/orders?search=${encodeURIComponent(search)}&perPage=50`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Blad wyszukiwania:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchOrders();
    }
  };

  const selectOrderForInvoice = (order) => {
    setSelectedOrder(order);

    // Calculate totals
    const items = (order.items || [])
      .filter(item => !item.isShipping)
      .map(item => ({
        description: item.name || '',
        quantity: item.quantity || 1,
        unitPrice: item.priceGross || 0,
        total: (item.quantity || 1) * (item.priceGross || 0),
        taxIncluded: true
      }));

    const subtotal = order.financials?.totalNet || 0;
    const total = order.financials?.totalGross || 0;
    const taxAmount = total - subtotal;

    // Generate invoice number
    const today = new Date();
    const invoiceNumber = `GK-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${order.id}`;

    // Get customer/shipping address
    const customer = order.shipping || order.customer || {};
    const addressParts = [
      customer.street,
      `${customer.zipCode || ''} ${customer.city || ''}`.trim(),
      customer.country
    ].filter(Boolean);

    setInvoice(prev => ({
      ...prev,
      invoiceNumber,
      buyerName: customer.name || customer.companyName || '',
      buyerEmail: customer.email || '',
      buyerAddress: addressParts.join(', '),
      buyerPhone: customer.phone || '',
      items,
      subtotal,
      taxAmount,
      total,
      currency: order.financials?.currency || 'EUR'
    }));
  };

  const updateInvoiceField = (field, value) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const updateItem = (index, field, value) => {
    setInvoice(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // Recalculate item total
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
      }

      // Recalculate totals
      const subtotal = newItems.reduce((sum, item) => sum + (item.total / (1 + prev.taxRate / 100)), 0);
      const total = newItems.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = total - subtotal;

      return { ...prev, items: newItems, subtotal, taxAmount, total };
    });
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0, taxIncluded: true }]
    }));
  };

  const removeItem = (index) => {
    setInvoice(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const subtotal = newItems.reduce((sum, item) => sum + (item.total / (1 + prev.taxRate / 100)), 0);
      const total = newItems.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = total - subtotal;
      return { ...prev, items: newItems, subtotal, taxAmount, total };
    });
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  const formatDateDE = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDatePL = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const generatePDF = () => {
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rechnung ${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; font-size: 12px; }
          .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .logo { font-size: 24px; font-weight: bold; color: #2d5a27; }
          .invoice-title { font-size: 28px; font-weight: 300; color: #333; margin-bottom: 20px; }
          .parties { display: flex; gap: 60px; margin-bottom: 30px; }
          .party { flex: 1; }
          .party-title { font-weight: 600; margin-bottom: 10px; color: #555; font-size: 11px; text-transform: uppercase; }
          .party-name { font-weight: 600; font-size: 14px; margin-bottom: 5px; }
          .party-detail { color: #666; margin-bottom: 3px; }
          .invoice-meta { display: flex; gap: 30px; margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
          .meta-item { }
          .meta-label { font-size: 10px; color: #666; text-transform: uppercase; }
          .meta-value { font-weight: 600; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; font-size: 10px; text-transform: uppercase; color: #666; }
          .items-table td { padding: 12px 10px; border-bottom: 1px solid #eee; }
          .items-table .amount { text-align: right; }
          .totals { margin-left: auto; width: 250px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .total-row.final { font-weight: bold; font-size: 16px; border-top: 2px solid #333; margin-top: 10px; padding-top: 15px; }
          .notes { margin-top: 40px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
          .notes-title { font-weight: 600; margin-bottom: 8px; }
          .footer { margin-top: 60px; text-align: center; color: #999; font-size: 10px; }
          @media print { body { padding: 20px; } @page { margin: 1cm; } }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="invoice-title">Rechnung</div>
          <div><div class="logo">gutekissen</div></div>
        </div>
        <div class="parties">
          <div class="party">
            <div class="party-title">Von</div>
            <div class="party-name">${invoice.sellerName}</div>
            <div class="party-detail">${invoice.sellerEmail}</div>
            <div class="party-detail">${invoice.sellerAddress}</div>
            ${invoice.sellerPhone ? `<div class="party-detail">Tel: ${invoice.sellerPhone}</div>` : ''}
            <div class="party-detail">USt-IdNr: ${invoice.sellerTaxId}</div>
          </div>
          <div class="party">
            <div class="party-title">Rechnungsempfänger</div>
            <div class="party-name">${invoice.buyerName}</div>
            ${invoice.buyerEmail ? `<div class="party-detail">${invoice.buyerEmail}</div>` : ''}
            <div class="party-detail">${invoice.buyerAddress}</div>
            ${invoice.buyerPhone ? `<div class="party-detail">Tel: ${invoice.buyerPhone}</div>` : ''}
          </div>
        </div>
        <div class="invoice-meta">
          <div class="meta-item"><div class="meta-label">Rechnungsnr.</div><div class="meta-value">${invoice.invoiceNumber}</div></div>
          <div class="meta-item"><div class="meta-label">Datum</div><div class="meta-value">${formatDateDE(invoice.invoiceDate)}</div></div>
          <div class="meta-item"><div class="meta-label">Zahlungsbedingungen</div><div class="meta-value">${invoice.paymentTerms}</div></div>
        </div>
        <table class="items-table">
          <thead><tr><th style="width: 50%">Beschreibung</th><th class="amount">Einzelpreis</th><th class="amount">Menge</th><th class="amount">Betrag</th></tr></thead>
          <tbody>${invoice.items.map(item => `<tr><td>${item.description}</td><td class="amount">${formatCurrency(item.unitPrice, invoice.currency)}</td><td class="amount">${item.quantity}</td><td class="amount">${formatCurrency(item.total, invoice.currency)}</td></tr>`).join('')}</tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>Zwischensumme</span><span>${formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
          <div class="total-row"><span>MwSt. (${invoice.taxRate}%)</span><span>inkl. ${formatCurrency(invoice.taxAmount, invoice.currency)}</span></div>
          <div class="total-row final"><span>Gesamtbetrag</span><span>${formatCurrency(invoice.total, invoice.currency)}</span></div>
        </div>
        ${invoice.notes ? `<div class="notes"><div class="notes-title">Anmerkungen</div><div>${invoice.notes}</div></div>` : ''}
        <div class="footer">GuteKissen • ${invoice.sellerAddress} • ${invoice.sellerEmail}</div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);

    // Add to generated docs
    const newDoc = {
      id: Date.now(),
      type: 'Rechnung',
      number: invoice.invoiceNumber,
      date: invoice.invoiceDate,
      customer: invoice.buyerName,
      total: invoice.total,
      currency: invoice.currency,
      orderId: selectedOrder?.id || null
    };
    setGeneratedDocs(prev => [newDoc, ...prev]);
  };

  const getStatusBadge = (order) => {
    if (order.status?.isCanceled) {
      return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">Anulowane</span>;
    }
    if (order.status?.paymentStatus === 'PAID') {
      return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Oplacone</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">Nieoplacone</span>;
  };

  // Invoice Form JSX (rendered inline to prevent focus loss)
  const invoiceFormJSX = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Invoice Form */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/icons/gutekissen.png" alt="GuteKissen" className="w-10 h-10 rounded-full" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rechnung</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">GuteKissen Faktura VAT</p>
            </div>
          </div>
          <button
            onClick={generatePDF}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <span>📥</span> PDF herunterladen
          </button>
        </div>

        <div ref={invoiceRef}>
          {/* Seller & Buyer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Von (Seller) */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Von</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Name</label>
                  <input type="text" value={invoice.sellerName} onChange={(e) => updateInvoiceField('sellerName', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email</label>
                  <input type="email" value={invoice.sellerEmail} onChange={(e) => updateInvoiceField('sellerEmail', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Die Anschrift</label>
                  <input type="text" value={invoice.sellerAddress} onChange={(e) => updateInvoiceField('sellerAddress', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">USt-IdNr.</label>
                  <input type="text" value={invoice.sellerTaxId} onChange={(e) => updateInvoiceField('sellerTaxId', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
            </div>

            {/* Rechnungsempfänger (Buyer) */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Rechnungsempfänger</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Name</label>
                  <input type="text" value={invoice.buyerName} onChange={(e) => updateInvoiceField('buyerName', e.target.value)} placeholder="Kundenname" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email</label>
                  <input type="email" value={invoice.buyerEmail} onChange={(e) => updateInvoiceField('buyerEmail', e.target.value)} placeholder="name@kunde.com" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Die Anschrift</label>
                  <input type="text" value={invoice.buyerAddress} onChange={(e) => updateInvoiceField('buyerAddress', e.target.value)} placeholder="Straße, PLZ Stadt, Land" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Telefon</label>
                  <input type="text" value={invoice.buyerPhone} onChange={(e) => updateInvoiceField('buyerPhone', e.target.value)} placeholder="(123) 456 789" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rechnungsnr.</label>
              <input type="text" value={invoice.invoiceNumber} onChange={(e) => updateInvoiceField('invoiceNumber', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Datum</label>
              <input type="date" value={invoice.invoiceDate} onChange={(e) => updateInvoiceField('invoiceDate', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Zahlungsbedingungen</label>
              <select value={invoice.paymentTerms} onChange={(e) => updateInvoiceField('paymentTerms', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="Vorkasse">Vorkasse</option>
                <option value="Sofort fällig">Sofort fällig</option>
                <option value="14 Tage netto">14 Tage netto</option>
                <option value="30 Tage netto">30 Tage netto</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Positionen</h3>
              <button onClick={addItem} className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50">
                + Hinzufügen
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-2 w-8"></th>
                    <th className="text-left py-2 px-2">Beschreibung</th>
                    <th className="text-right py-2 px-2 w-24">Einzelpreis</th>
                    <th className="text-right py-2 px-2 w-20">Menge</th>
                    <th className="text-right py-2 px-2 w-24">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 px-2">
                        <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 text-lg">×</button>
                      </td>
                      <td className="py-2 px-2">
                        <input type="text" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="Artikelbeschreibung" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </td>
                      <td className="py-2 px-2">
                        <input type="number" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} step="0.01" className="w-full px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </td>
                      <td className="py-2 px-2">
                        <input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} min="1" className="w-full px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </td>
                      <td className="py-2 px-2 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.total, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invoice.items.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                Keine Positionen. Fügen Sie Positionen hinzu.
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Zwischensumme</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">MwSt. ({invoice.taxRate}%)</span>
                <span className="text-gray-900 dark:text-white">inkl. {formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
                <span className="text-gray-900 dark:text-white">Gesamtbetrag</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Anmerkungen</label>
            <textarea value={invoice.notes} onChange={(e) => updateInvoiceField('notes', e.target.value)} rows={3} placeholder="Hinweise" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Selected Order Info */}
        {selectedOrder && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Wybrane zamowienie</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Nr zamowienia</span>
                <span className="font-medium text-gray-900 dark:text-white">#{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Kanal</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.channel?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Data</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatDatePL(selectedOrder.dates?.orderedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Wartosc</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedOrder.financials?.totalGross, selectedOrder.financials?.currency)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tax Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Podatek (MwSt.)</h3>
          <div className="flex items-center gap-2">
            <input type="number" value={invoice.taxRate} onChange={(e) => updateInvoiceField('taxRate', parseFloat(e.target.value) || 0)} className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
          </div>
        </div>

        {/* Currency */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Waluta</h3>
          <select value={invoice.currency} onChange={(e) => updateInvoiceField('currency', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="EUR">EUR</option>
            <option value="PLN">PLN</option>
          </select>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Akcje</h3>
          <div className="space-y-2">
            <button onClick={generatePDF} className="w-full px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700">
              Generuj PDF
            </button>
            <button onClick={resetInvoice} className="w-full px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              Wyczysc formularz
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              DMS - Document Management System
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Generowanie dokumentow dla zamowien
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <button
            onClick={() => setActiveTab('generated')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'generated'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span>📋</span> Wygenerowane dokumenty
          </button>
          <button
            onClick={() => setActiveTab('fromOrder')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'fromOrder'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span>📦</span> Wygeneruj z zamowienia
          </button>
          <button
            onClick={() => { setActiveTab('manual'); setManualDocType(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span>✏️</span> Wygeneruj recznie
          </button>
        </div>

        {/* Tab: Generated Documents */}
        {activeTab === 'generated' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Wygenerowane dokumenty ({generatedDocs.length})
              </h3>
            </div>
            {generatedDocs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">📄</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Brak wygenerowanych dokumentow
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                  Wygenerowane dokumenty pojawia sie tutaj. Zacznij od wygenerowania faktury z zamowienia lub recznie.
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setActiveTab('fromOrder')}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Wygeneruj z zamowienia
                  </button>
                  <button
                    onClick={() => { setActiveTab('manual'); resetInvoice(); }}
                    className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Wygeneruj recznie
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {generatedDocs.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400">📄</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.type} {doc.number}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {doc.customer} • {formatDatePL(doc.date)}
                            {doc.orderId && ` • Zam. #${doc.orderId}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(doc.total, doc.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Generate from Order */}
        {activeTab === 'fromOrder' && (
          <>
            {!selectedOrder ? (
              <>
                {/* Search Box */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 mb-4">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Wyszukaj zamowienia</h2>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Numer zamowienia, nazwa klienta, SKU..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={searchOrders}
                      disabled={loading || !search.trim()}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Szukam...' : 'Szukaj'}
                    </button>
                  </div>
                </div>

                {/* Results */}
                {searched && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Wyniki wyszukiwania ({orders.length})
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Kliknij zamowienie aby wygenerowac fakture</p>
                    </div>

                    {loading ? (
                      <div className="p-8 text-center">
                        <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Wyszukiwanie zamowien...</p>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Brak wynikow dla podanego zapytania</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {orders.map((order) => (
                          <div
                            key={order.id}
                            onClick={() => selectOrderForInvoice(order)}
                            className="p-4 cursor-pointer transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">#{order.id}</span>
                                  {order.externalId && <span className="text-xs text-gray-500 dark:text-gray-400">({order.externalId})</span>}
                                  {getStatusBadge(order)}
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                    {order.channel?.label || order.channel?.platform || 'Nieznane'}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span><strong>Klient:</strong> {order.customer?.name || order.shipping?.name || '-'}</span>
                                  <span><strong>Data:</strong> {formatDatePL(order.dates?.orderedAt)}</span>
                                  <span><strong>Wartosc:</strong> {formatCurrency(order.financials?.totalGross, order.financials?.currency)}</span>
                                </div>
                                {order.items && order.items.length > 0 && (
                                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    <strong>Produkty:</strong>{' '}
                                    {order.items.filter(i => !i.isShipping).slice(0, 2).map(i => i.name).join(', ')}
                                    {order.items.filter(i => !i.isShipping).length > 2 && ` (+${order.items.filter(i => !i.isShipping).length - 2} wiecej)`}
                                  </div>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                                  Wybierz →
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!searched && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-8 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      Wyszukaj zamowienie
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      Wpisz numer zamowienia, nazwe klienta lub SKU produktu aby znalezc zamowienie i wygenerowac fakture.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-4">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    ← Wróć do wyszukiwania
                  </button>
                </div>
                {invoiceFormJSX}
              </>
            )}
          </>
        )}

        {/* Tab: Manual */}
        {activeTab === 'manual' && (
          <>
            {!manualDocType ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Wybierz typ dokumentu</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Wybierz szablon dokumentu do wygenerowania ręcznie</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* GuteKissen Invoice */}
                  <button
                    onClick={() => { setManualDocType('gutekissen-invoice'); resetInvoice(); }}
                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img src="/icons/gutekissen.png" alt="GuteKissen" className="w-10 h-10 rounded-full" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400">Faktura VAT</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">GuteKissen</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Rechnung - faktura w języku niemieckim dla sklepu GuteKissen
                    </p>
                  </button>

                  {/* Placeholder for future document types */}
                  <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg opacity-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400">📄</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-400">List przewozowy</h3>
                        <p className="text-xs text-gray-400">Wkrótce</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Dokument przewozowy dla przesyłek
                    </p>
                  </div>

                  <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg opacity-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400">🏷️</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-400">Etykieta wysyłkowa</h3>
                        <p className="text-xs text-gray-400">Wkrótce</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Etykieta adresowa na przesyłkę
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <button
                    onClick={() => setManualDocType(null)}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    ← Wróć do wyboru dokumentu
                  </button>
                </div>
                {manualDocType === 'gutekissen-invoice' && invoiceFormJSX}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
