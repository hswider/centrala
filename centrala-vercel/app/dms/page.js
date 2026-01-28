'use client';

import { useState, useRef, useEffect } from 'react';

export default function DMSPage() {
  const [activeTab, setActiveTab] = useState('generated'); // 'generated' | 'fromOrder' | 'manual' | 'history'
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsSearch, setDocsSearch] = useState('');
  const [docsSort, setDocsSort] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'type' | 'customer'
  const [manualDocType, setManualDocType] = useState(null); // null | 'gutekissen-invoice' | 'cmr'
  const [selectedDocType, setSelectedDocType] = useState(null); // for fromOrder tab
  const [editingDoc, setEditingDoc] = useState(null); // document being edited
  const [user, setUser] = useState(null); // current user
  const [history, setHistory] = useState([]); // document history
  const [historyLoading, setHistoryLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null); // document preview modal for WZ/RW
  const invoiceRef = useRef(null);

  // Load user and documents on mount
  useEffect(() => {
    fetchUser();
    loadDocuments();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/dms/history?limit=100');
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setDocsLoading(true);
      const res = await fetch('/api/dms/documents');
      const data = await res.json();
      if (data.success) {
        // Map API response to local format
        const docs = data.documents.map(doc => ({
          id: doc.id,
          docType: doc.doc_type,
          type: doc.doc_type === 'invoice' ? 'Faktura GuteKissen' :
                doc.doc_type === 'WZ' ? 'Dokument WZ' :
                doc.doc_type === 'RW' ? 'Dokument RW' : 'CMR',
          number: doc.doc_number,
          customer: doc.customer_name,
          date: doc.created_at,
          orderId: doc.order_id,
          total: doc.data?.total || null,
          currency: doc.data?.currency || 'EUR',
          data: doc.data,
          status: doc.status || 'draft'
        }));
        setGeneratedDocs(docs);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setDocsLoading(false);
    }
  };

  const saveDocument = async (doc) => {
    try {
      const res = await fetch('/api/dms/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: doc.docType,
          docNumber: doc.number,
          orderId: doc.orderId,
          customerName: doc.customer,
          data: doc.data,
          status: 'draft',
          userName: user?.username || 'Unknown',
          userId: user?.id || null
        })
      });
      const data = await res.json();
      if (data.success) {
        // Reload documents to get the saved one with ID
        await loadDocuments();
      }
      return data;
    } catch (error) {
      console.error('Error saving document:', error);
      return { success: false, error: error.message };
    }
  };

  const updateDocumentStatus = async (docId, newStatus) => {
    try {
      const res = await fetch(`/api/dms/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          userName: user?.username || 'Unknown',
          userId: user?.id || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedDocs(prev => prev.map(doc =>
          doc.id === docId ? { ...doc, status: newStatus } : doc
        ));
      }
      return data;
    } catch (error) {
      console.error('Error updating document:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteDocument = async (docId) => {
    if (!confirm('Czy na pewno chcesz usunąć ten dokument?')) return;
    try {
      const params = new URLSearchParams();
      if (user?.username) params.append('userName', user.username);
      if (user?.id) params.append('userId', user.id);

      const res = await fetch(`/api/dms/documents/${docId}?${params.toString()}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedDocs(prev => prev.filter(doc => doc.id !== docId));
      }
      return data;
    } catch (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: error.message };
    }
  };

  // CMR form state - Nadawca is constant
  const SENDER_CONSTANT = {
    name: 'POOM TOMASZ MALEWSKI',
    address: 'ul. Wojska Polskiego 62, 11-010 Barczewo',
    country: 'Polska'
  };

  const [cmr, setCmr] = useState({
    // 1. Nadawca (Sender) - CONSTANT
    senderName: SENDER_CONSTANT.name,
    senderAddress: SENDER_CONSTANT.address,
    senderCountry: SENDER_CONSTANT.country,
    // 2. Odbiorca (Consignee)
    consigneeName: '',
    consigneeAddress: '',
    consigneeCountry: '',
    // 3. Miejsce przeznaczenia (Place of delivery)
    deliveryPlace: '',
    deliveryCountry: '',
    // 4. Miejsce i data załadowania (Place and date of loading)
    loadingPlace: '',
    loadingDate: '',
    // 5. Załączone dokumenty (Documents attached)
    documents: 'PACKING LIST',
    // 6. Cechy i numery (Marks and numbers)
    marksAndNos: '',
    // 7. Ilość sztuk (Number of packages)
    numberOfPackages: '',
    // 8. Sposób opakowania (Method of packing)
    methodOfPacking: '',
    // 9. Rodzaj towaru (Nature of goods) - domyślnie Gartenmöbel
    natureOfGoods: 'Gartenmöbel',
    // 10. Numer statystyczny (Statistical number)
    statisticalNumber: '',
    // 11. Waga brutto w kg (Gross weight)
    grossWeight: '',
    // 12. Objętość w m3 (Volume)
    volume: '',
    // 13. Instrukcje nadawcy (Sender's instructions)
    senderInstructions: '',
    // 14. Postanowienia odnośnie przewoźnego
    paymentInstructions: '',
    // 15. Zapłata / Cash on delivery
    cashOnDelivery: '',
    // 16. Przewoźnik (Carrier)
    carrierName: '',
    carrierAddress: '',
    carrierCountry: '',
    // 17. Kolejni przewoźnicy (Successive carriers)
    successiveCarriers: '',
    // 18. Zastrzeżenia przewoźnika (Carrier's reservations)
    carrierReservations: '',
    // 19. Postanowienia specjalne (Special agreements)
    specialAgreements: '',
    // 20. Do zapłacenia
    carriageCharges: '',
    deductions: '',
    balance: '',
    supplements: '',
    otherCharges: '',
    totalToPay: '',
    // 21. Wystawiono w (Established in)
    establishedIn: '',
    establishedDate: new Date().toISOString().split('T')[0],
    // NR REJ (Registration number)
    registrationNumber: '',
  });

  const resetCmr = () => {
    setCmr({
      senderName: SENDER_CONSTANT.name,
      senderAddress: SENDER_CONSTANT.address,
      senderCountry: SENDER_CONSTANT.country,
      consigneeName: '',
      consigneeAddress: '',
      consigneeCountry: '',
      deliveryPlace: '',
      deliveryCountry: '',
      loadingPlace: '',
      loadingDate: '',
      documents: 'PACKING LIST',
      marksAndNos: '',
      numberOfPackages: '',
      methodOfPacking: '',
      natureOfGoods: 'Gartenmöbel',
      statisticalNumber: '',
      grossWeight: '',
      volume: '',
      senderInstructions: '',
      paymentInstructions: '',
      cashOnDelivery: '',
      carrierName: '',
      carrierAddress: '',
      carrierCountry: '',
      successiveCarriers: '',
      carrierReservations: '',
      specialAgreements: '',
      carriageCharges: '',
      deductions: '',
      balance: '',
      supplements: '',
      otherCharges: '',
      totalToPay: '',
      establishedIn: '',
      establishedDate: new Date().toISOString().split('T')[0],
      registrationNumber: '',
    });
  };

  const updateCmrField = (field, value) => {
    setCmr(prev => ({ ...prev, [field]: value }));
  };

  const fillCmrFromOrder = (order) => {
    const shipping = order.shipping || order.customer || {};
    const items = (order.items || []).filter(i => !i.isShipping);
    const productNames = items.map(i => `${i.name} (${i.quantity} szt.)`).join(', ');
    const totalQty = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

    // Build consignee name - just the name, no "Kom:" prefix
    // Remove any "Kom:" prefix if present in the name
    let consigneeName = shipping.name || shipping.companyName || '';
    if (consigneeName.toLowerCase().startsWith('kom:') || consigneeName.toLowerCase().startsWith('komm.')) {
      consigneeName = consigneeName.replace(/^(kom:|komm\.)\s*/i, '').trim();
    }
    // Build address: street, zipCode city
    const consigneeAddress = `${shipping.street || ''}, ${shipping.zipCode || ''} ${shipping.city || ''}`.trim().replace(/^,\s*/, '');
    // KOM number from extraField1 (Pole dodatkowe 1 in BaseLinker)
    const komNumber = order.extraField1 ? `${order.extraField1}` : '';

    setCmr(prev => ({
      ...prev,
      // Sender - CONSTANT (nie zmieniaj)
      senderName: SENDER_CONSTANT.name,
      senderAddress: SENDER_CONSTANT.address,
      senderCountry: SENDER_CONSTANT.country,
      // Consignee from shipping data (bez "Kom:")
      consigneeName: consigneeName,
      consigneeAddress: consigneeAddress,
      consigneeCountry: shipping.country || '',
      // Delivery place with KOM number from extraField1
      deliveryPlace: komNumber ? `${komNumber}\n${shipping.city || ''}, ${shipping.country || ''}` : `${shipping.city || ''}, ${shipping.country || ''}`,
      deliveryCountry: shipping.country || '',
      // Loading - Barczewo
      loadingPlace: 'Barczewo, Polska',
      loadingDate: new Date().toISOString().split('T')[0],
      // Goods - NIE nadpisuj natureOfGoods, ma być zawsze "Gartenmöbel"
      // natureOfGoods pozostaje domyślne "Gartenmöbel"
      numberOfPackages: String(totalQty),
      methodOfPacking: 'Kartony',
      // Established in
      establishedIn: 'Barczewo',
      establishedDate: new Date().toISOString().split('T')[0],
    }));
  };

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
      type: 'Faktura VAT',
      docType: 'invoice',
      number: invoice.invoiceNumber,
      date: invoice.invoiceDate,
      customer: invoice.buyerName,
      total: invoice.total,
      currency: invoice.currency,
      orderId: selectedOrder?.id || null,
      data: { ...invoice } // Store full invoice data for re-download
    };
    saveDocument(newDoc);
  };

  const generateCmrPDF = () => {
    // 4 egzemplarze CMR z kolorami jak na oficjalnym formularzu
    const copies = [
      { num: 1, title: 'Egzemplarz dla nadawcy', titleDe: 'Exemplar für den Absender', titleEn: 'Copy for sender', color: '#c00000' },
      { num: 2, title: 'Egzemplarz dla odbiorcy', titleDe: 'Exemplar für den Empfänger', titleEn: 'Copy for consignee', color: '#0066cc' },
      { num: 3, title: 'Egzemplarz dla przewoźnika', titleDe: 'Exemplar für den Frachtführer', titleEn: 'Copy for carrier', color: '#008844' },
      { num: 4, title: 'Egzemplarz dodatkowy', titleDe: 'Zusätzliches Exemplar', titleEn: 'Additional copy', color: '#000000' }
    ];

    // Stała wartość dla pola 9
    const natureOfGoodsValue = cmr.natureOfGoods || 'Gartenmöbel';

    const generateCmrPage = (copy) => `
      <div class="cmr-page" style="color: ${copy.color};">
        <!-- Copy header -->
        <div class="copy-title">
          <span class="copy-num">${copy.num}</span>
          <span class="copy-text">${copy.title}<br/>${copy.titleDe}<br/>${copy.titleEn}</span>
        </div>

        <div class="cmr-main">
          <div class="cmr-content">
            <!-- Header row -->
            <div class="header-row">
              <div class="header-left">
                <div class="field field-1">
                  <div class="field-label"><span class="field-num">1</span> Nadawca (nazwisko lub nazwa, adres, kraj)<br/>Absender (Name, Anschrift, Land)<br/>Sender (name, address, country)</div>
                  <div class="field-value">${cmr.senderName || ''}<br/>${cmr.senderAddress || ''}<br/>${cmr.senderCountry || ''}</div>
                </div>
              </div>
              <div class="header-right">
                <div class="cmr-title">
                  <div>MIĘDZYNARODOWY SAMOCHODOWY LIST PRZEWOZOWY NR</div>
                  <div>INTERNATIONALER FRACHTBRIEF No</div>
                  <div>INTERNATIONAL CONSIGNMENT NOTE</div>
                </div>
                <div class="cmr-box">CMR</div>
                <div class="cmr-legal">
                  Niniejszy przewóz podlega postanowieniom konwencji o umowie międzynarodowej przewozu drogowego towarów (CMR) bez względu na jakąkolwiek przeciwną klauzulę.<br/>
                  This carriage is subject notwithstanding any clause to the contrary, to the Convention on the Contract for the International Carriage of goods by road (CMR).<br/>
                  Diese Beförderung unterliegt trotz einer gegenteiligen Abmachung den Bestimmungen des Übereinkommens über den Beförderungsvertrag im internationalen Strassengüterverkehr (CMR).
                </div>
              </div>
            </div>

            <!-- Rows 2-4 / 16-18 (carrier section has thick outer border) -->
            <div class="two-col-carrier">
              <div class="col-left-stack">
                <div class="field">
                  <div class="field-label"><span class="field-num">2</span> Odbiorca (nazwisko lub nazwa, adres, kraj)<br/>Empfänger (Name, Anschrift, Land)<br/>Consignee (name, address, country)</div>
                  <div class="field-value">${cmr.consigneeName || ''}<br/>${cmr.consigneeAddress || ''}<br/>${cmr.consigneeCountry || ''}</div>
                </div>
                <div class="field">
                  <div class="field-label"><span class="field-num">3</span> Miejsce przeznaczenia (miejscowość, kraj)<br/>Auslieferungsort des Gutes (Ort, Land)<br/>Place of delivery of the goods (place, country)</div>
                  <div class="field-value">${cmr.deliveryPlace || ''}${cmr.deliveryCountry ? ', ' + cmr.deliveryCountry : ''}</div>
                </div>
                <div class="field">
                  <div class="field-label"><span class="field-num">4</span> Miejsce i data załadowania (miejscowość, kraj, data)<br/>Ort und Tag der Übernahme des Gutes (Ort, Land, Datum)<br/>Place and date of taking over the goods (place, country, date)</div>
                  <div class="field-value">${cmr.loadingPlace || ''}<br/>${cmr.loadingDate || ''}</div>
                </div>
              </div>
              <div class="col-right-thick">
                <div class="field">
                  <div class="field-label"><span class="field-num">16</span> Przewoźnik (nazwisko lub nazwa, adres, kraj)<br/>Frachtführer (Name, Anschrift, Land)<br/>Carrier (name, address, country)</div>
                  <div class="field-value">${cmr.carrierName || ''}<br/>${cmr.carrierAddress || ''}<br/>${cmr.carrierCountry || ''}</div>
                </div>
                <div class="field">
                  <div class="field-label"><span class="field-num">17</span> Kolejni przewoźnicy (nazwisko lub nazwa, adres, kraj)<br/>Nachfolgende Frachtführer (Name, Anschrift, Land)<br/>Successive carriers (name, address, country)</div>
                  <div class="field-value">${cmr.successiveCarriers || ''}</div>
                </div>
                <div class="field field-18">
                  <div class="field-label"><span class="field-num">18</span> Zastrzeżenia i uwagi przewoźnika<br/>Vorbehalte und Bemerkungen der Frachtführer<br/>Carrier's reservations and observations</div>
                  <div class="field-value">${cmr.carrierReservations || ''}</div>
                </div>
              </div>
            </div>

            <!-- Row 5 -->
            <div class="field-5-row">
              <div class="field-5-left">
                <div class="field-label"><span class="field-num">5</span> Załączone dokumenty<br/>Beigefügte Dokumente<br/>Documents attached</div>
              </div>
              <div class="field-5-right">
                <div class="field-value">${cmr.documents || ''}</div>
              </div>
            </div>

            <!-- Goods Row 6-12 -->
            <div class="goods-row">
              <div class="goods-cell gc-6">
                <div class="field-label"><span class="field-num">6</span> Cechy i numer<br/>Kennzeichen und Nummern<br/>Marks and Nos</div>
                <div class="field-value">${cmr.marksAndNos || ''}</div>
              </div>
              <div class="goods-cell gc-7">
                <div class="field-label"><span class="field-num">7</span> Ilość sztuk<br/>Anzahl der Packstücke<br/>Number of packages</div>
                <div class="field-value">${cmr.numberOfPackages || ''}</div>
              </div>
              <div class="goods-cell gc-8">
                <div class="field-label"><span class="field-num">8</span> Sposób opakowania<br/>Art der Verpackung<br/>Method of packing</div>
                <div class="field-value">${cmr.methodOfPacking || ''}</div>
              </div>
              <div class="goods-cell gc-9">
                <div class="field-label"><span class="field-num">9</span> Rodzaj towaru<br/>Bezeichnung des Gutes<br/>Nature of the goods</div>
                <div class="field-value">${natureOfGoodsValue}</div>
              </div>
              <div class="goods-cell gc-10">
                <div class="field-label"><span class="field-num">10</span> Nr statystyczny<br/>Statistiknummer<br/>Statistical number</div>
                <div class="field-value">${cmr.statisticalNumber || ''}</div>
              </div>
              <div class="goods-cell gc-11">
                <div class="field-label"><span class="field-num">11</span> Waga brutto w kg<br/>Bruttogewicht in kg<br/>Gross weight in kg</div>
                <div class="field-value">${cmr.grossWeight || ''}</div>
              </div>
              <div class="goods-cell gc-12">
                <div class="field-label"><span class="field-num">12</span> Objętość w m³<br/>Umfang m³<br/>Volume in m³</div>
                <div class="field-value">${cmr.volume || ''}</div>
              </div>
            </div>

            <!-- ADR Row -->
            <div class="adr-row">
              <div class="adr-cell">
                <div class="field-label">Klasa<br/>Klasse<br/>Class</div>
                <div class="field-value"></div>
              </div>
              <div class="adr-cell">
                <div class="field-label">Liczba<br/>Ziffer<br/>Number</div>
                <div class="field-value"></div>
              </div>
              <div class="adr-cell">
                <div class="field-label">Litera<br/>Buchstabe<br/>Letter</div>
                <div class="field-value"></div>
              </div>
              <div class="adr-cell adr-label">
                <div>(ADR*)</div>
              </div>
            </div>

            <!-- Row 13 / 19 -->
            <div class="two-col">
              <div class="col-left">
                <div class="field">
                  <div class="field-label"><span class="field-num">13</span> Instrukcje nadawcy<br/>Anweisungen des Absenders<br/>Sender's instructions</div>
                  <div class="field-value">${cmr.senderInstructions || ''}</div>
                </div>
              </div>
              <div class="col-right">
                <div class="field">
                  <div class="field-label"><span class="field-num">19</span> Postanowienia specjalne<br/>Besondere Vereinbarungen<br/>Special agreements</div>
                  <div class="field-value">${cmr.specialAgreements || ''}</div>
                </div>
              </div>
            </div>

            <!-- Row 14 / 20 (field 20 has thick outer border) -->
            <div class="two-col">
              <div class="col-left">
                <div class="field field-14">
                  <div class="field-label"><span class="field-num">14</span> Postanowienia odnośnie przewoźnego<br/>Frachtzahlungsanweisungen<br/>Instruction as to payment for carriage</div>
                  <div class="field-value">
                    <div class="checkbox-row">☐ Przewoźne zapłacone / Frei / Carriage paid</div>
                    <div class="checkbox-row">☐ Przewoźne nie opłacone / Unfrei / Carriage forward</div>
                  </div>
                </div>
              </div>
              <div class="col-right-20">
                <div class="field-20-wrapper">
                  <div class="field field-20">
                    <div class="field-label"><span class="field-num">20</span> Do zapłacenia<br/>Zu zahlen vom:<br/>To be paid by</div>
                    <table class="payment-table">
                      <tr><th></th><th>Nadawca<br/>Absender<br/>Sender</th><th>Waluta<br/>Währung<br/>Currency</th><th>Odbiorca<br/>Empfänger<br/>Consignee</th></tr>
                      <tr><td>Przewoźne / Fracht / Carriage charges</td><td>${cmr.carriageCharges || ''}</td><td></td><td></td></tr>
                      <tr><td>Bonifikaty / Ermässigungen / Reductions</td><td></td><td></td><td></td></tr>
                      <tr><td>Saldo / Zuschläge / Balance</td><td></td><td></td><td></td></tr>
                      <tr><td>Dopłaty / Nebengebühren / Supplem. / charges</td><td></td><td></td><td></td></tr>
                      <tr><td>Koszty dodatkowe / Son-stiges / Miscellaneous +</td><td></td><td></td><td></td></tr>
                      <tr class="total-row"><td>Razem / Gesamtsumme / Total to be paid</td><td>${cmr.totalToPay || ''}</td><td></td><td></td></tr>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 21 / 15 -->
            <div class="two-col">
              <div class="col-left">
                <div class="field field-21">
                  <div class="field-label"><span class="field-num">21</span> Wystawiono w<br/>Ausgefertigt in<br/>Established in</div>
                  <div class="field-value-inline">
                    <span>${cmr.establishedIn || ''}</span>
                    <span class="date-label">dnia<br/>am<br/>on</span>
                    <span class="date-value">20${(cmr.establishedDate || '').substring(2) || '___'}</span>
                  </div>
                </div>
              </div>
              <div class="col-right">
                <div class="field">
                  <div class="field-label"><span class="field-num">15</span> Zapłata / Rückerstattung / Cash on delivery</div>
                  <div class="field-value">${cmr.cashOnDelivery || ''}</div>
                </div>
              </div>
            </div>

            <!-- Signatures Row 22, 23, 24 -->
            <div class="signatures-row">
              <div class="sig-cell sig-22">
                <div class="sig-num">22</div>
                <div class="sig-content"></div>
                <div class="sig-label">Podpis i stempel nadawcy<br/>Unterschrift und Stempel des Absenders<br/>Signature and stamp of the sender</div>
              </div>
              <div class="sig-cell sig-23">
                <div class="sig-num">23</div>
                <div class="sig-content"></div>
                <div class="sig-label">Podpis i stempel przewoźnika<br/>Unterschrift und Stempel des Frachtführers<br/>Signature and stamp of the carrier</div>
              </div>
              <div class="sig-cell sig-24">
                <div class="sig-num">24</div>
                <div class="sig-header">Przesyłkę otrzymano / Gut empfangen / Goods received</div>
                <div class="sig-place">
                  <span>Miejscowość<br/>Ort<br/>Place</span>
                  <span class="sig-date">dnia<br/>am<br/>on</span>
                  <span>20__</span>
                </div>
                <div class="sig-content"></div>
                <div class="sig-label">Podpis i stempel odbiorcy<br/>Unterschrift und Stempel des Empfängers<br/>Signature and stamp of the consignee</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CMR - List Przewozowy (4 egzemplarze)</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4; margin: 0; }
          @media print { .cmr-page { page-break-after: always; } .cmr-page:last-child { page-break-after: avoid; } }
          html, body { font-family: Arial, sans-serif; font-size: 6px; }

          .cmr-page { width: 210mm; height: 297mm; padding: 8mm 10mm 5mm 10mm; box-sizing: border-box; overflow: hidden; }
          .copy-title { display: flex; align-items: flex-start; margin-bottom: 1mm; }
          .copy-num { font-size: 24px; font-weight: bold; margin-right: 3mm; }
          .copy-text { font-size: 7px; line-height: 1.3; }

          .cmr-main { display: flex; border: 1px solid currentColor; }
          .cmr-content { flex: 1; position: relative; }
          .cmr-content::before { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; border-left: 1px solid currentColor; z-index: 1; }

          .header-row { display: flex; border-bottom: 1px solid currentColor; }
          .header-left { width: 50%; border-right: 1px solid currentColor; }
          .header-right { width: 50%; padding: 2mm; }
          .cmr-title { font-size: 8px; font-weight: bold; line-height: 1.3; margin-bottom: 2mm; }
          .cmr-box { display: inline-block; border: 2px solid currentColor; border-radius: 8px; padding: 1mm 6mm; font-size: 16px; font-weight: bold; margin: 2mm 0; }
          .cmr-legal { font-size: 5px; line-height: 1.2; }

          .two-col { display: flex; border-bottom: 1px solid currentColor; }
          .col-left { width: 50%; border-right: 1px solid currentColor; }
          .col-right { width: 50%; }

          /* Carrier section 16-18 with thick outer border, no internal borders */
          .two-col-carrier { display: flex; border-bottom: 1px solid currentColor; }
          .col-left-stack { width: 50%; border-right: 1px solid currentColor; }
          .col-left-stack .field { border-bottom: 1px solid currentColor; }
          .col-left-stack .field:last-child { border-bottom: none; }
          .col-right-thick { width: 50%; border: 2px solid currentColor; }
          .col-right-thick .field { border-bottom: 1px solid currentColor; min-height: 22mm; }
          .col-right-thick .field:last-child { border-bottom: none; }
          .col-right-thick .field-18 { min-height: 28mm; }

          .field { padding: 1.5mm; min-height: 18mm; }
          .field-1 { min-height: 22mm; }
          .field-5-row { display: flex; border-bottom: 1px solid currentColor; min-height: 14mm; }
          .field-5-left { width: 25%; padding: 1.5mm; }
          .field-5-right { width: 75%; background: white; position: relative; z-index: 2; padding: 1.5mm; }
          .field-label { font-size: 6px; line-height: 1.2; margin-bottom: 1mm; }
          .field-num { font-weight: bold; font-size: 8px; }
          .field-value { font-size: 15px; line-height: 1.3; margin-top: 1mm; color: black !important; }

          .goods-row { display: flex; border-bottom: 1px solid currentColor; min-height: 32mm; }
          .goods-cell { border-right: 1px solid currentColor; padding: 1.5mm; background: white; position: relative; z-index: 2; }
          .goods-cell:last-child { border-right: none; }
          .gc-6 { width: 10%; }
          .gc-7 { width: 8%; }
          .gc-8 { width: 10%; }
          .gc-9 { width: 24%; }
          .gc-10 { width: 10%; }
          .gc-11 { width: 14%; }
          .gc-12 { width: 14%; }

          .adr-row { display: flex; border-bottom: 1px solid currentColor; min-height: 14mm; }
          .adr-cell { flex: 1; border-right: 1px solid currentColor; padding: 1.5mm; background: white; position: relative; z-index: 2; }
          .adr-cell:last-child { border-right: none; }
          .adr-label { display: flex; align-items: center; justify-content: center; font-size: 8px; }

          .field-14 .checkbox-row { font-size: 7px; margin: 1mm 0; }

          /* Field 20 with thick outer border */
          .col-right-20 { width: 50%; }
          .field-20-wrapper { border: 2px solid currentColor; height: 100%; }
          .field-20 { padding: 0; }
          .field-20 .field-label { padding: 1.5mm; border-bottom: 1px solid currentColor; }
          .payment-table { width: 100%; border-collapse: collapse; font-size: 5px; }
          .payment-table th, .payment-table td { border: 1px solid currentColor; padding: 0.5mm 1mm; text-align: left; }
          .payment-table th { font-weight: normal; }
          .payment-table .total-row { font-weight: bold; }

          .field-21 .field-value-inline { display: flex; align-items: flex-end; gap: 3mm; margin-top: 2mm; font-size: 9px; }
          .field-21 .date-label { font-size: 6px; line-height: 1.2; }
          .field-21 .date-value { border-bottom: 1px solid currentColor; min-width: 15mm; }

          .signatures-row { display: flex; min-height: 28mm; }
          .sig-cell { flex: 1; border-right: 1px solid currentColor; padding: 1.5mm; display: flex; flex-direction: column; background: white; position: relative; z-index: 2; }
          .sig-cell:last-child { border-right: none; }
          .sig-num { font-size: 12px; font-weight: bold; }
          .sig-header { font-size: 6px; margin-bottom: 2mm; }
          .sig-place { display: flex; gap: 2mm; font-size: 6px; margin-bottom: 3mm; }
          .sig-content { flex: 1; }
          .sig-label { font-size: 6px; line-height: 1.2; margin-top: auto; border-top: 1px solid currentColor; padding-top: 1mm; }
        </style>
      </head>
      <body>
        ${copies.map(copy => generateCmrPage(copy)).join('')}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);

    // Add to generated docs
    const newDoc = {
      type: 'CMR',
      docType: 'cmr',
      number: cmr.registrationNumber || 'CMR-' + Date.now(),
      date: cmr.establishedDate,
      customer: cmr.consigneeName,
      total: null,
      currency: null,
      orderId: selectedOrder?.id || null,
      data: { ...cmr } // Store full CMR data for re-download
    };
    saveDocument(newDoc);
  };

  // Re-download a previously generated document
  const redownloadDocument = (doc) => {
    if (doc.docType === 'invoice') {
      // Temporarily set invoice state and generate PDF
      const savedInvoice = invoice;
      setInvoice(doc.data);
      setTimeout(() => {
        generatePDFFromData(doc.data);
        setInvoice(savedInvoice);
      }, 100);
    } else if (doc.docType === 'cmr') {
      generateCmrPDFFromData(doc.data);
    }
  };

  // Generate invoice PDF from stored data
  const generatePDFFromData = (invoiceData) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rechnung ${invoiceData.invoiceNumber}</title>
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
            <div class="party-name">${invoiceData.sellerName}</div>
            <div class="party-detail">${invoiceData.sellerEmail}</div>
            <div class="party-detail">${invoiceData.sellerAddress}</div>
            ${invoiceData.sellerPhone ? `<div class="party-detail">Tel: ${invoiceData.sellerPhone}</div>` : ''}
            <div class="party-detail">USt-IdNr: ${invoiceData.sellerTaxId}</div>
          </div>
          <div class="party">
            <div class="party-title">Rechnungsempfänger</div>
            <div class="party-name">${invoiceData.buyerName}</div>
            ${invoiceData.buyerEmail ? `<div class="party-detail">${invoiceData.buyerEmail}</div>` : ''}
            <div class="party-detail">${invoiceData.buyerAddress}</div>
            ${invoiceData.buyerPhone ? `<div class="party-detail">Tel: ${invoiceData.buyerPhone}</div>` : ''}
          </div>
        </div>
        <div class="invoice-meta">
          <div class="meta-item"><div class="meta-label">Rechnungsnr.</div><div class="meta-value">${invoiceData.invoiceNumber}</div></div>
          <div class="meta-item"><div class="meta-label">Datum</div><div class="meta-value">${formatDateDE(invoiceData.invoiceDate)}</div></div>
          <div class="meta-item"><div class="meta-label">Zahlungsbedingungen</div><div class="meta-value">${invoiceData.paymentTerms}</div></div>
        </div>
        <table class="items-table">
          <thead><tr><th style="width: 50%">Beschreibung</th><th class="amount">Einzelpreis</th><th class="amount">Menge</th><th class="amount">Betrag</th></tr></thead>
          <tbody>${invoiceData.items.map(item => `<tr><td>${item.description}</td><td class="amount">${formatCurrency(item.unitPrice, invoiceData.currency)}</td><td class="amount">${item.quantity}</td><td class="amount">${formatCurrency(item.total, invoiceData.currency)}</td></tr>`).join('')}</tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>Zwischensumme</span><span>${formatCurrency(invoiceData.subtotal, invoiceData.currency)}</span></div>
          <div class="total-row"><span>MwSt. (${invoiceData.taxRate}%)</span><span>inkl. ${formatCurrency(invoiceData.taxAmount, invoiceData.currency)}</span></div>
          <div class="total-row final"><span>Gesamtbetrag</span><span>${formatCurrency(invoiceData.total, invoiceData.currency)}</span></div>
        </div>
        ${invoiceData.notes ? `<div class="notes"><div class="notes-title">Anmerkungen</div><div>${invoiceData.notes}</div></div>` : ''}
        <div class="footer">GuteKissen • ${invoiceData.sellerAddress} • ${invoiceData.sellerEmail}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  // Generate CMR PDF from stored data (4 egzemplarze) - używa tego samego układu co generateCmrPDF
  const generateCmrPDFFromData = (cmrData) => {
    const copies = [
      { num: 1, title: 'Egzemplarz dla nadawcy', titleDe: 'Exemplar für den Absender', titleEn: 'Copy for sender', color: '#c00000' },
      { num: 2, title: 'Egzemplarz dla odbiorcy', titleDe: 'Exemplar für den Empfänger', titleEn: 'Copy for consignee', color: '#0066cc' },
      { num: 3, title: 'Egzemplarz dla przewoźnika', titleDe: 'Exemplar für den Frachtführer', titleEn: 'Copy for carrier', color: '#008844' },
      { num: 4, title: 'Egzemplarz dodatkowy', titleDe: 'Zusätzliches Exemplar', titleEn: 'Additional copy', color: '#000000' }
    ];

    const natureOfGoodsValue = cmrData.natureOfGoods || 'Gartenmöbel';

    const generatePage = (copy) => `
      <div class="cmr-page" style="color: ${copy.color};">
        <div class="copy-title">
          <span class="copy-num">${copy.num}</span>
          <span class="copy-text">${copy.title}<br/>${copy.titleDe}<br/>${copy.titleEn}</span>
        </div>
        <div class="cmr-main">
                    <div class="cmr-content">
            <div class="header-row">
              <div class="header-left">
                <div class="field field-1">
                  <div class="field-label"><span class="field-num">1</span> Nadawca (nazwisko lub nazwa, adres, kraj)<br/>Absender (Name, Anschrift, Land)<br/>Sender (name, address, country)</div>
                  <div class="field-value">${cmrData.senderName || ''}<br/>${cmrData.senderAddress || ''}<br/>${cmrData.senderCountry || ''}</div>
                </div>
              </div>
              <div class="header-right">
                <div class="cmr-title"><div>MIĘDZYNARODOWY SAMOCHODOWY LIST PRZEWOZOWY NR</div><div>INTERNATIONALER FRACHTBRIEF No</div><div>INTERNATIONAL CONSIGNMENT NOTE</div></div>
                <div class="cmr-box">CMR</div>
                <div class="cmr-legal">Niniejszy przewóz podlega postanowieniom konwencji o umowie międzynarodowej przewozu drogowego towarów (CMR).<br/>This carriage is subject to the Convention on the Contract for the International Carriage of goods by road (CMR).<br/>Diese Beförderung unterliegt den Bestimmungen des Übereinkommens über den Beförderungsvertrag im internationalen Strassengüterverkehr (CMR).</div>
              </div>
            </div>
            <div class="two-col-carrier"><div class="col-left-stack"><div class="field"><div class="field-label"><span class="field-num">2</span> Odbiorca<br/>Empfänger<br/>Consignee</div><div class="field-value">${cmrData.consigneeName || ''}<br/>${cmrData.consigneeAddress || ''}<br/>${cmrData.consigneeCountry || ''}</div></div><div class="field"><div class="field-label"><span class="field-num">3</span> Miejsce przeznaczenia<br/>Auslieferungsort<br/>Place of delivery</div><div class="field-value">${cmrData.deliveryPlace || ''}${cmrData.deliveryCountry ? ', ' + cmrData.deliveryCountry : ''}</div></div><div class="field"><div class="field-label"><span class="field-num">4</span> Miejsce i data załadowania<br/>Ort und Tag der Übernahme<br/>Place and date of taking over</div><div class="field-value">${cmrData.loadingPlace || ''}<br/>${cmrData.loadingDate || ''}</div></div></div><div class="col-right-thick"><div class="field"><div class="field-label"><span class="field-num">16</span> Przewoźnik<br/>Frachtführer<br/>Carrier</div><div class="field-value">${cmrData.carrierName || ''}<br/>${cmrData.carrierAddress || ''}<br/>${cmrData.carrierCountry || ''}</div></div><div class="field"><div class="field-label"><span class="field-num">17</span> Kolejni przewoźnicy<br/>Nachfolgende Frachtführer<br/>Successive carriers</div><div class="field-value">${cmrData.successiveCarriers || ''}</div></div><div class="field field-18"><div class="field-label"><span class="field-num">18</span> Zastrzeżenia przewoźnika<br/>Vorbehalte des Frachtführers<br/>Carrier's reservations</div><div class="field-value">${cmrData.carrierReservations || ''}</div></div></div></div>
            <div class="field-5-row"><div class="field-5-left"><div class="field-label"><span class="field-num">5</span> Załączone dokumenty / Beigefügte Dokumente / Documents attached</div></div><div class="field-5-right"><div class="field-value">${cmrData.documents || ''}</div></div></div>
            <div class="goods-row">
              <div class="goods-cell gc-6"><div class="field-label"><span class="field-num">6</span> Cechy<br/>Kennzeichen<br/>Marks</div><div class="field-value">${cmrData.marksAndNos || ''}</div></div>
              <div class="goods-cell gc-7"><div class="field-label"><span class="field-num">7</span> Ilość<br/>Anzahl<br/>Number</div><div class="field-value">${cmrData.numberOfPackages || ''}</div></div>
              <div class="goods-cell gc-8"><div class="field-label"><span class="field-num">8</span> Opakowanie<br/>Verpackung<br/>Packing</div><div class="field-value">${cmrData.methodOfPacking || ''}</div></div>
              <div class="goods-cell gc-9"><div class="field-label"><span class="field-num">9</span> Rodzaj towaru<br/>Bezeichnung<br/>Nature of goods</div><div class="field-value">${natureOfGoodsValue}</div></div>
              <div class="goods-cell gc-10"><div class="field-label"><span class="field-num">10</span> Nr stat.<br/>Stat.Nr<br/>Stat.no</div><div class="field-value">${cmrData.statisticalNumber || ''}</div></div>
              <div class="goods-cell gc-11"><div class="field-label"><span class="field-num">11</span> Waga kg<br/>Gewicht kg<br/>Weight kg</div><div class="field-value">${cmrData.grossWeight || ''}</div></div>
              <div class="goods-cell gc-12"><div class="field-label"><span class="field-num">12</span> m³<br/>m³<br/>m³</div><div class="field-value">${cmrData.volume || ''}</div></div>
            </div>
            <div class="adr-row"><div class="adr-cell"><div class="field-label">Klasa/Klasse/Class</div></div><div class="adr-cell"><div class="field-label">Liczba/Ziffer/Number</div></div><div class="adr-cell"><div class="field-label">Litera/Buchstabe/Letter</div></div><div class="adr-cell adr-label">(ADR*)</div></div>
            <div class="two-col"><div class="col-left"><div class="field"><div class="field-label"><span class="field-num">13</span> Instrukcje nadawcy / Anweisungen des Absenders / Sender's instructions</div><div class="field-value">${cmrData.senderInstructions || ''}</div></div></div><div class="col-right"><div class="field"><div class="field-label"><span class="field-num">19</span> Postanowienia specjalne / Besondere Vereinbarungen / Special agreements</div><div class="field-value">${cmrData.specialAgreements || ''}</div></div></div></div>
            <div class="two-col"><div class="col-left"><div class="field field-14"><div class="field-label"><span class="field-num">14</span> Postanowienia odnośnie przewoźnego</div><div class="field-value"><div class="checkbox-row">☐ Przewoźne zapłacone / Frei / Carriage paid</div><div class="checkbox-row">☐ Przewoźne nie opłacone / Unfrei / Carriage forward</div></div></div></div><div class="col-right-20"><div class="field-20-wrapper"><div class="field field-20"><div class="field-label"><span class="field-num">20</span> Do zapłacenia / Zu zahlen / To be paid</div><table class="payment-table"><tr><th></th><th>Nadawca</th><th>Waluta</th><th>Odbiorca</th></tr><tr><td>Przewoźne</td><td>${cmrData.carriageCharges || ''}</td><td></td><td></td></tr><tr><td>Bonifikaty</td><td></td><td></td><td></td></tr><tr><td>Dopłaty</td><td></td><td></td><td></td></tr><tr class="total-row"><td>Razem</td><td>${cmrData.totalToPay || ''}</td><td></td><td></td></tr></table></div></div></div></div>
            <div class="two-col"><div class="col-left"><div class="field field-21"><div class="field-label"><span class="field-num">21</span> Wystawiono w / Ausgefertigt in / Established in</div><div class="field-value-inline"><span>${cmrData.establishedIn || ''}</span><span class="date-label">dnia/am/on</span><span>20${(cmrData.establishedDate || '').substring(2) || '___'}</span></div></div></div><div class="col-right"><div class="field"><div class="field-label"><span class="field-num">15</span> Zapłata / Rückerstattung / Cash on delivery</div><div class="field-value">${cmrData.cashOnDelivery || ''}</div></div></div></div>
            <div class="signatures-row">
              <div class="sig-cell"><div class="sig-num">22</div><div class="sig-content"></div><div class="sig-label">Podpis i stempel nadawcy<br/>Unterschrift und Stempel des Absenders<br/>Signature and stamp of the sender</div></div>
              <div class="sig-cell"><div class="sig-num">23</div><div class="sig-content"></div><div class="sig-label">Podpis i stempel przewoźnika<br/>Unterschrift und Stempel des Frachtführers<br/>Signature and stamp of the carrier</div></div>
              <div class="sig-cell"><div class="sig-num">24</div><div class="sig-header">Przesyłkę otrzymano / Gut empfangen / Goods received</div><div class="sig-place"><span>Miejscowość/Ort/Place</span><span>dnia/am/on</span><span>20__</span></div><div class="sig-content"></div><div class="sig-label">Podpis i stempel odbiorcy<br/>Unterschrift und Stempel des Empfängers<br/>Signature and stamp of the consignee</div></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>CMR (4 egzemplarze)</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { size: A4; margin: 0; }
      @media print { .cmr-page { page-break-after: always; } .cmr-page:last-child { page-break-after: avoid; } }
      html, body { font-family: Arial, sans-serif; font-size: 6px; }
      .cmr-page { width: 210mm; height: 297mm; padding: 8mm 10mm 5mm 10mm; box-sizing: border-box; overflow: hidden; }
      .copy-title { display: flex; align-items: flex-start; margin-bottom: 1mm; }
      .copy-num { font-size: 24px; font-weight: bold; margin-right: 3mm; }
      .copy-text { font-size: 7px; line-height: 1.3; }
      .cmr-main { display: flex; border: 1px solid currentColor; }
      .cmr-content { flex: 1; position: relative; }
      .cmr-content::before { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; border-left: 1px solid currentColor; z-index: 1; }
      .header-row { display: flex; border-bottom: 1px solid currentColor; }
      .header-left { width: 50%; border-right: 1px solid currentColor; }
      .header-right { width: 50%; padding: 2mm; }
      .cmr-title { font-size: 8px; font-weight: bold; line-height: 1.3; margin-bottom: 2mm; }
      .cmr-box { display: inline-block; border: 2px solid currentColor; border-radius: 8px; padding: 1mm 6mm; font-size: 16px; font-weight: bold; margin: 2mm 0; }
      .cmr-legal { font-size: 5px; line-height: 1.2; }
      .two-col { display: flex; border-bottom: 1px solid currentColor; }
      .col-left { width: 50%; border-right: 1px solid currentColor; }
      .col-right { width: 50%; }
      .two-col-carrier { display: flex; border-bottom: 1px solid currentColor; }
      .col-left-stack { width: 50%; border-right: 1px solid currentColor; }
      .col-left-stack .field { border-bottom: 1px solid currentColor; }
      .col-left-stack .field:last-child { border-bottom: none; }
      .col-right-thick { width: 50%; border: 2px solid currentColor; }
      .col-right-thick .field { border-bottom: 1px solid currentColor; min-height: 22mm; }
      .col-right-thick .field:last-child { border-bottom: none; }
      .col-right-thick .field-18 { min-height: 28mm; }
      .field { padding: 1.5mm; min-height: 16mm; }
      .field-1 { min-height: 20mm; }
      .field-5-row { display: flex; border-bottom: 1px solid currentColor; min-height: 14mm; }
      .field-5-left { width: 25%; padding: 1.5mm; }
      .field-5-right { width: 75%; background: white; position: relative; z-index: 2; padding: 1.5mm; }
      .field-label { font-size: 6px; line-height: 1.2; margin-bottom: 1mm; }
      .field-num { font-weight: bold; font-size: 8px; }
      .field-value { font-size: 15px; line-height: 1.3; margin-top: 1mm; color: black !important; }
      .goods-row { display: flex; border-bottom: 1px solid currentColor; min-height: 28mm; }
      .goods-cell { border-right: 1px solid currentColor; padding: 1.5mm; background: white; position: relative; z-index: 2; }
      .goods-cell:last-child { border-right: none; }
      .gc-6 { width: 10%; } .gc-7 { width: 8%; } .gc-8 { width: 10%; } .gc-9 { width: 24%; } .gc-10 { width: 10%; } .gc-11 { width: 14%; } .gc-12 { width: 14%; }
      .adr-row { display: flex; border-bottom: 1px solid currentColor; min-height: 12mm; }
      .adr-cell { flex: 1; border-right: 1px solid currentColor; padding: 1.5mm; background: white; position: relative; z-index: 2; }
      .adr-cell:last-child { border-right: none; }
      .adr-label { display: flex; align-items: center; justify-content: center; font-size: 8px; }
      .field-14 .checkbox-row { font-size: 7px; margin: 1mm 0; }
      .col-right-20 { width: 50%; }
      .field-20-wrapper { border: 2px solid currentColor; height: 100%; }
      .field-20 { padding: 0; }
      .field-20 .field-label { padding: 1.5mm; border-bottom: 1px solid currentColor; }
      .payment-table { width: 100%; border-collapse: collapse; font-size: 5px; }
      .payment-table th, .payment-table td { border: 1px solid currentColor; padding: 0.5mm 1mm; text-align: left; }
      .payment-table .total-row { font-weight: bold; }
      .field-21 .field-value-inline { display: flex; align-items: flex-end; gap: 3mm; margin-top: 2mm; font-size: 9px; }
      .field-21 .date-label { font-size: 6px; }
      .signatures-row { display: flex; min-height: 26mm; }
      .sig-cell { flex: 1; border-right: 1px solid currentColor; padding: 1.5mm; display: flex; flex-direction: column; background: white; position: relative; z-index: 2; }
      .sig-cell:last-child { border-right: none; }
      .sig-num { font-size: 12px; font-weight: bold; }
      .sig-header { font-size: 6px; margin-bottom: 2mm; }
      .sig-place { display: flex; gap: 2mm; font-size: 6px; margin-bottom: 3mm; }
      .sig-content { flex: 1; }
      .sig-label { font-size: 6px; line-height: 1.2; margin-top: auto; border-top: 1px solid currentColor; padding-top: 1mm; }
    </style></head><body>${copies.map(copy => generatePage(copy)).join('')}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
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

  // CMR Form JSX
  const cmrFormJSX = (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400 font-bold text-sm">CMR</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">List Przewozowy CMR</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Międzynarodowy dokument przewozowy</p>
          </div>
        </div>
        <button onClick={generateCmrPDF} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
          <span>📥</span> Generuj PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* 1. Nadawca */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">1. Nadawca / Absender / Sender</label>
            <input type="text" value={cmr.senderName} onChange={(e) => updateCmrField('senderName', e.target.value)} placeholder="Nazwa firmy" className="w-full px-2 py-1 mb-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <input type="text" value={cmr.senderAddress} onChange={(e) => updateCmrField('senderAddress', e.target.value)} placeholder="Adres" className="w-full px-2 py-1 mb-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <input type="text" value={cmr.senderCountry} onChange={(e) => updateCmrField('senderCountry', e.target.value)} placeholder="Kraj" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>

          {/* 2. Odbiorca */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">2. Odbiorca / Empfänger / Consignee</label>
            <input type="text" value={cmr.consigneeName} onChange={(e) => updateCmrField('consigneeName', e.target.value)} placeholder="Nazwa firmy / Imię i nazwisko" className="w-full px-2 py-1 mb-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <input type="text" value={cmr.consigneeAddress} onChange={(e) => updateCmrField('consigneeAddress', e.target.value)} placeholder="Adres" className="w-full px-2 py-1 mb-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <input type="text" value={cmr.consigneeCountry} onChange={(e) => updateCmrField('consigneeCountry', e.target.value)} placeholder="Kraj" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>

          {/* 3. Miejsce przeznaczenia */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">3. Miejsce przeznaczenia / Auslieferungsort</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={cmr.deliveryPlace} onChange={(e) => updateCmrField('deliveryPlace', e.target.value)} placeholder="Miejscowość" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <input type="text" value={cmr.deliveryCountry} onChange={(e) => updateCmrField('deliveryCountry', e.target.value)} placeholder="Kraj" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>

          {/* 4. Miejsce i data załadowania */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">4. Miejsce i data załadowania</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={cmr.loadingPlace} onChange={(e) => updateCmrField('loadingPlace', e.target.value)} placeholder="Miejsce" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <input type="date" value={cmr.loadingDate} onChange={(e) => updateCmrField('loadingDate', e.target.value)} className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>

          {/* 5. Załączone dokumenty */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">5. Załączone dokumenty</label>
            <input type="text" value={cmr.documents} onChange={(e) => updateCmrField('documents', e.target.value)} placeholder="Lista dokumentów" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>

          {/* Goods info */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">6-12. Informacje o towarze</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="text" value={cmr.marksAndNos} onChange={(e) => updateCmrField('marksAndNos', e.target.value)} placeholder="6. Cechy i numery" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <input type="text" value={cmr.numberOfPackages} onChange={(e) => updateCmrField('numberOfPackages', e.target.value)} placeholder="7. Ilość sztuk" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="text" value={cmr.methodOfPacking} onChange={(e) => updateCmrField('methodOfPacking', e.target.value)} placeholder="8. Sposób opakowania" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <input type="text" value={cmr.statisticalNumber} onChange={(e) => updateCmrField('statisticalNumber', e.target.value)} placeholder="10. Nr statystyczny" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <input type="text" value={cmr.natureOfGoods} onChange={(e) => updateCmrField('natureOfGoods', e.target.value)} placeholder="9. Rodzaj towaru" className="w-full px-2 py-1 mb-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={cmr.grossWeight} onChange={(e) => updateCmrField('grossWeight', e.target.value)} placeholder="11. Waga brutto (kg)" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <input type="text" value={cmr.volume} onChange={(e) => updateCmrField('volume', e.target.value)} placeholder="12. Objętość (m³)" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>

          {/* 13-14. Instrukcje */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">13. Instrukcje nadawcy</label>
            <textarea value={cmr.senderInstructions} onChange={(e) => updateCmrField('senderInstructions', e.target.value)} rows={2} placeholder="Instrukcje nadawcy" className="w-full px-2 py-1 mb-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <label className="block text-xs font-bold text-red-600 mb-2">14. Postanowienia odnośnie przewoźnego</label>
            <input type="text" value={cmr.paymentInstructions} onChange={(e) => updateCmrField('paymentInstructions', e.target.value)} placeholder="np. Przewoźne zapłacone / Przewoźne do zapłaty" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* 16. Przewoźnik */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">16. Przewoźnik / Frachtführer / Carrier</label>
            <input type="text" value={cmr.carrierName} onChange={(e) => updateCmrField('carrierName', e.target.value)} placeholder="Nazwa firmy" className="w-full px-2 py-1 mb-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <input type="text" value={cmr.carrierAddress} onChange={(e) => updateCmrField('carrierAddress', e.target.value)} placeholder="Adres" className="w-full px-2 py-1 mb-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <input type="text" value={cmr.carrierCountry} onChange={(e) => updateCmrField('carrierCountry', e.target.value)} placeholder="Kraj" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>

          {/* NR REJ */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">NR REJ. pojazdu</label>
            <input type="text" value={cmr.registrationNumber} onChange={(e) => updateCmrField('registrationNumber', e.target.value)} placeholder="np. WA 12345 / ABC 6789" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>

          {/* 17. Kolejni przewoźnicy */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">17. Kolejni przewoźnicy</label>
            <input type="text" value={cmr.successiveCarriers} onChange={(e) => updateCmrField('successiveCarriers', e.target.value)} placeholder="Kolejni przewoźnicy (jeśli dotyczy)" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>

          {/* 18. Zastrzeżenia */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">18. Zastrzeżenia przewoźnika</label>
            <textarea value={cmr.carrierReservations} onChange={(e) => updateCmrField('carrierReservations', e.target.value)} rows={2} placeholder="Zastrzeżenia i uwagi" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>

          {/* 19. Postanowienia specjalne */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">19. Postanowienia specjalne</label>
            <textarea value={cmr.specialAgreements} onChange={(e) => updateCmrField('specialAgreements', e.target.value)} rows={2} placeholder="Postanowienia specjalne" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>

          {/* 15. Zapłata */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">15. Zapłata / Cash on delivery</label>
            <input type="text" value={cmr.cashOnDelivery} onChange={(e) => updateCmrField('cashOnDelivery', e.target.value)} placeholder="Kwota pobrania (jeśli dotyczy)" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>

          {/* 20. Do zapłacenia */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">20. Do zapłacenia</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input type="text" value={cmr.carriageCharges} onChange={(e) => updateCmrField('carriageCharges', e.target.value)} placeholder="Przewoźne" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <input type="text" value={cmr.deductions} onChange={(e) => updateCmrField('deductions', e.target.value)} placeholder="Bonifikaty" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <input type="text" value={cmr.supplements} onChange={(e) => updateCmrField('supplements', e.target.value)} placeholder="Dopłaty" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <input type="text" value={cmr.otherCharges} onChange={(e) => updateCmrField('otherCharges', e.target.value)} placeholder="Inne" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <input type="text" value={cmr.totalToPay} onChange={(e) => updateCmrField('totalToPay', e.target.value)} placeholder="RAZEM do zapłaty" className="w-full mt-2 px-2 py-1 text-sm font-bold border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>

          {/* 21. Wystawiono */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <label className="block text-xs font-bold text-red-600 mb-2">21. Wystawiono w</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={cmr.establishedIn} onChange={(e) => updateCmrField('establishedIn', e.target.value)} placeholder="Miejscowość" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <input type="date" value={cmr.establishedDate} onChange={(e) => updateCmrField('establishedDate', e.target.value)} className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button onClick={generateCmrPDF} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">
          Generuj PDF
        </button>
        <button onClick={resetCmr} className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
          Wyczyść formularz
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
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
          <button
            onClick={() => { setActiveTab('history'); loadHistory(); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span>📜</span> Historia zmian
          </button>
        </div>

        {/* Tab: Generated Documents */}
        {activeTab === 'generated' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Wygenerowane dokumenty ({generatedDocs.length})
                </h3>
                {generatedDocs.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={docsSearch}
                      onChange={(e) => setDocsSearch(e.target.value)}
                      placeholder="Szukaj dokumentu..."
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                    <select
                      value={docsSort}
                      onChange={(e) => setDocsSort(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="date-desc">Najnowsze</option>
                      <option value="date-asc">Najstarsze</option>
                      <option value="type">Typ dokumentu</option>
                      <option value="customer">Klient A-Z</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            {docsLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Ładowanie dokumentów...
                </h3>
              </div>
            ) : generatedDocs.length === 0 ? (
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
                    onClick={() => { setActiveTab('manual'); setManualDocType(null); }}
                    className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Wygeneruj recznie
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {generatedDocs
                  .filter(doc => {
                    if (!docsSearch.trim()) return true;
                    const searchLower = docsSearch.toLowerCase();
                    return (
                      (doc.number || '').toLowerCase().includes(searchLower) ||
                      (doc.customer || '').toLowerCase().includes(searchLower) ||
                      (doc.type || '').toLowerCase().includes(searchLower) ||
                      (doc.orderId && String(doc.orderId).includes(searchLower))
                    );
                  })
                  .sort((a, b) => {
                    switch (docsSort) {
                      case 'date-asc':
                        return new Date(a.date) - new Date(b.date);
                      case 'type':
                        return (a.type || '').localeCompare(b.type || '');
                      case 'customer':
                        return (a.customer || '').localeCompare(b.customer || '');
                      case 'date-desc':
                      default:
                        return new Date(b.date) - new Date(a.date);
                    }
                  })
                  .map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {doc.docType === 'invoice' ? (
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <img src="/icons/gutekissen.png" alt="GuteKissen" className="w-7 h-7 rounded-full" />
                          </div>
                        ) : doc.docType === 'WZ' ? (
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">WZ</span>
                          </div>
                        ) : doc.docType === 'RW' ? (
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-orange-600 dark:text-orange-400 font-bold text-xs">RW</span>
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-red-600 dark:text-red-400 font-bold text-xs">CMR</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              doc.docType === 'invoice'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : doc.docType === 'WZ'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                : doc.docType === 'RW'
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}>
                              {doc.type}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.number}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              doc.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                              doc.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                              doc.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                              {doc.status === 'draft' ? 'Wersja robocza' :
                               doc.status === 'sent' ? 'Wysłany' :
                               doc.status === 'completed' ? 'Zakończony' :
                               doc.status === 'cancelled' ? 'Anulowany' : doc.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {doc.customer || 'Brak klienta'} • {formatDatePL(doc.date)}
                            {doc.orderId && ` • Zam. #${doc.orderId}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {doc.total !== null && (
                          <p className="text-sm font-bold text-gray-900 dark:text-white mr-2">
                            {formatCurrency(doc.total, doc.currency)}
                          </p>
                        )}
                        <select
                          value={doc.status || 'draft'}
                          onChange={(e) => updateDocumentStatus(doc.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          <option value="draft">Wersja robocza</option>
                          <option value="sent">Wysłany</option>
                          <option value="completed">Zakończony</option>
                          <option value="cancelled">Anulowany</option>
                        </select>
                        {(doc.docType === 'WZ' || doc.docType === 'RW') ? (
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="px-2 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
                            title="Podgląd"
                          >
                            👁️
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                if (doc.docType === 'cmr' && doc.data) {
                                  setCmr(doc.data);
                                  setActiveTab('manual');
                                  setManualDocType('cmr');
                                } else if (doc.docType === 'invoice' && doc.data) {
                                  setInvoice(doc.data);
                                  setActiveTab('manual');
                                  setManualDocType('gutekissen-invoice');
                                }
                              }}
                              className="px-2 py-1.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                              title="Edytuj"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => redownloadDocument(doc)}
                              className="px-2 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
                              title="Pobierz"
                            >
                              📥
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="px-2 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                          title="Usuń"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {generatedDocs.length > 0 && generatedDocs.filter(doc => {
                  if (!docsSearch.trim()) return true;
                  const searchLower = docsSearch.toLowerCase();
                  return (
                    (doc.number || '').toLowerCase().includes(searchLower) ||
                    (doc.customer || '').toLowerCase().includes(searchLower) ||
                    (doc.type || '').toLowerCase().includes(searchLower) ||
                    (doc.orderId && String(doc.orderId).includes(searchLower))
                  );
                }).length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Brak dokumentow pasujacych do wyszukiwania</p>
                  </div>
                )}
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
                <div className="mb-4 flex items-center gap-4">
                  <button
                    onClick={() => { setSelectedOrder(null); setSelectedDocType(null); }}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    ← Wróć do wyszukiwania
                  </button>
                  {selectedDocType && (
                    <button
                      onClick={() => setSelectedDocType(null)}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      Zmień typ dokumentu
                    </button>
                  )}
                </div>

                {!selectedDocType ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Zamówienie #{selectedOrder.id}</strong> - {selectedOrder.customer?.name || selectedOrder.shipping?.name || 'Brak danych klienta'}
                      </p>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Wybierz typ dokumentu</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Wybierz szablon dokumentu do wygenerowania dla tego zamówienia</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* GuteKissen Invoice */}
                      <button
                        onClick={() => { setSelectedDocType('gutekissen-invoice'); selectOrderForInvoice(selectedOrder); }}
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
                          Rechnung - faktura w języku niemieckim
                        </p>
                      </button>

                      {/* CMR */}
                      <button
                        onClick={() => { setSelectedDocType('cmr'); fillCmrFromOrder(selectedOrder); }}
                        className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <span className="text-red-600 dark:text-red-400 font-bold text-xs">CMR</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400">List Przewozowy CMR</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Międzynarodowy</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Międzynarodowy samochodowy list przewozowy
                        </p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedDocType === 'gutekissen-invoice' && invoiceFormJSX}
                    {selectedDocType === 'cmr' && cmrFormJSX}
                  </>
                )}
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

                  {/* CMR Document */}
                  <button
                    onClick={() => { setManualDocType('cmr'); resetCmr(); }}
                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <span className="text-red-600 dark:text-red-400 font-bold text-xs">CMR</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400">List Przewozowy CMR</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Międzynarodowy</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Międzynarodowy samochodowy list przewozowy
                    </p>
                  </button>

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
                {manualDocType === 'cmr' && cmrFormJSX}
              </>
            )}
          </>
        )}

        {/* Tab: History */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historia zmian dokumentów</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Wszystkie operacje na dokumentach</p>
                </div>
                <button
                  onClick={loadHistory}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  🔄 Odśwież
                </button>
              </div>
            </div>
            {historyLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Ładowanie historii...</h3>
              </div>
            ) : history.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">📜</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Brak historii</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Historia operacji pojawi się tutaj po wykonaniu akcji na dokumentach.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {history.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        entry.action === 'created' ? 'bg-green-100 dark:bg-green-900/30' :
                        entry.action === 'edited' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        entry.action === 'status_changed' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        entry.action === 'deleted' ? 'bg-red-100 dark:bg-red-900/30' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <span className="text-lg">
                          {entry.action === 'created' ? '✨' :
                           entry.action === 'edited' ? '✏️' :
                           entry.action === 'status_changed' ? '🔄' :
                           entry.action === 'deleted' ? '🗑️' : '📄'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            entry.action === 'created' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            entry.action === 'edited' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                            entry.action === 'status_changed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                            entry.action === 'deleted' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}>
                            {entry.action === 'created' ? 'Utworzono' :
                             entry.action === 'edited' ? 'Edytowano' :
                             entry.action === 'status_changed' ? 'Zmiana statusu' :
                             entry.action === 'deleted' ? 'Usunięto' : entry.action}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            entry.doc_type === 'invoice' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            entry.doc_type === 'WZ' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                            entry.doc_type === 'RW' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}>
                            {entry.doc_type === 'invoice' ? 'Faktura' :
                             entry.doc_type === 'WZ' ? 'Dokument WZ' :
                             entry.doc_type === 'RW' ? 'Dokument RW' : 'CMR'}
                          </span>
                          {entry.doc_number && (
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.doc_number}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{entry.user_name}</span>
                          {entry.customer_name && ` • Klient: ${entry.customer_name}`}
                          {entry.action_details?.from && entry.action_details?.to && (
                            <span> • {entry.action_details.from} → {entry.action_details.to}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDatePL(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal podglądu dokumentu WZ/RW */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between ${
              previewDoc.docType === 'WZ' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-orange-50 dark:bg-orange-900/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  previewDoc.docType === 'WZ'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-orange-100 dark:bg-orange-900/30'
                }`}>
                  <span className={`font-bold text-lg ${
                    previewDoc.docType === 'WZ'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>{previewDoc.docType}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {previewDoc.docType === 'WZ' ? 'Dokument WZ - Przyjęcie zewnętrzne' : 'Dokument RW - Rozchód wewnętrzny'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nr: {previewDoc.number}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Info podstawowe */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Numer dokumentu</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{previewDoc.number}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Firma</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{previewDoc.customer || previewDoc.data?.firma || '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data wystawienia</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {previewDoc.data?.dataWystawienia
                      ? new Date(previewDoc.data.dataWystawienia).toLocaleString('pl-PL', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })
                      : formatDatePL(previewDoc.date)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    previewDoc.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                    previewDoc.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {previewDoc.status === 'completed' ? 'Zakończony' :
                     previewDoc.status === 'sent' ? 'Wysłany' :
                     previewDoc.status === 'draft' ? 'Wersja robocza' : previewDoc.status}
                  </span>
                </div>
              </div>

              {/* Pozycje dokumentu */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Pozycje dokumentu ({previewDoc.data?.pozycje?.length || 0})
                </h3>
                {previewDoc.data?.pozycje && previewDoc.data.pozycje.length > 0 ? (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Lp.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nazwa artykułu</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ilość</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jednostka</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {previewDoc.data.pozycje.map((poz, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{poz.nazwa}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right font-bold">
                              {typeof poz.ilosc === 'number' ? poz.ilosc.toFixed(2) : poz.ilosc}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">{poz.jednostka || 'szt'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Brak pozycji w dokumencie</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
