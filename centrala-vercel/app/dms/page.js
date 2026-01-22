'use client';

import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';

export default function DMSPage() {
  const [activeTab, setActiveTab] = useState('generated'); // 'generated' | 'fromOrder' | 'manual'
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState([]);
  const [docsSearch, setDocsSearch] = useState('');
  const [docsSort, setDocsSort] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'type' | 'customer'
  const [manualDocType, setManualDocType] = useState(null); // null | 'gutekissen-invoice' | 'cmr'
  const [selectedDocType, setSelectedDocType] = useState(null); // for fromOrder tab
  const invoiceRef = useRef(null);

  // CMR form state
  const [cmr, setCmr] = useState({
    // 1. Nadawca (Sender)
    senderName: '',
    senderAddress: '',
    senderCountry: '',
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
    documents: '',
    // 6. Cechy i numery (Marks and numbers)
    marksAndNos: '',
    // 7. Ilość sztuk (Number of packages)
    numberOfPackages: '',
    // 8. Sposób opakowania (Method of packing)
    methodOfPacking: '',
    // 9. Rodzaj towaru (Nature of goods)
    natureOfGoods: '',
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
      senderName: '',
      senderAddress: '',
      senderCountry: '',
      consigneeName: '',
      consigneeAddress: '',
      consigneeCountry: '',
      deliveryPlace: '',
      deliveryCountry: '',
      loadingPlace: '',
      loadingDate: '',
      documents: '',
      marksAndNos: '',
      numberOfPackages: '',
      methodOfPacking: '',
      natureOfGoods: '',
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
    const customer = order.shipping || order.customer || {};
    const items = (order.items || []).filter(i => !i.isShipping);
    const productNames = items.map(i => `${i.name} (${i.quantity} szt.)`).join(', ');
    const totalQty = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

    setCmr(prev => ({
      ...prev,
      // Sender (POOM)
      senderName: 'POOM Sp. z o.o.',
      senderAddress: 'ul. Przykładowa 1, 00-001 Warszawa',
      senderCountry: 'Polska',
      // Consignee from order
      consigneeName: customer.name || customer.companyName || '',
      consigneeAddress: `${customer.street || ''}, ${customer.zipCode || ''} ${customer.city || ''}`.trim(),
      consigneeCountry: customer.country || '',
      // Delivery place
      deliveryPlace: `${customer.city || ''}, ${customer.country || ''}`,
      deliveryCountry: customer.country || '',
      // Loading
      loadingPlace: 'Warszawa, Polska',
      loadingDate: new Date().toISOString().split('T')[0],
      // Goods
      natureOfGoods: productNames.substring(0, 200),
      numberOfPackages: String(totalQty),
      methodOfPacking: 'Kartony',
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
    // Use jsPDF for direct download
    generatePDFFromData(invoice);

    // Add to generated docs
    const newDoc = {
      id: Date.now(),
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
    setGeneratedDocs(prev => [newDoc, ...prev]);
  };

  const generateCmrPDF = () => {
    // Use jsPDF for direct download
    generateCmrPDFFromData(cmr);

    // Add to generated docs
    const newDoc = {
      id: Date.now(),
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
    setGeneratedDocs(prev => [newDoc, ...prev]);
  };

  // Re-download a previously generated document
  const redownloadDocument = (doc) => {
    if (doc.docType === 'invoice') {
      generatePDFFromData(doc.data);
    } else if (doc.docType === 'cmr') {
      generateCmrPDFFromData(doc.data);
    }
  };

  // Generate invoice PDF from stored data - direct download
  const generatePDFFromData = (invoiceData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(51, 51, 51);
    doc.text('Rechnung', 20, y);
    doc.setFontSize(18);
    doc.setTextColor(45, 90, 39);
    doc.text('gutekissen', pageWidth - 20, y, { align: 'right' });
    y += 20;

    // Seller info
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('VON', 20, y);
    doc.text('RECHNUNGSEMPFÄNGER', 110, y);
    y += 6;
    doc.setFontSize(11);
    doc.setTextColor(51);
    doc.text(invoiceData.sellerName || '', 20, y);
    doc.text(invoiceData.buyerName || '', 110, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(invoiceData.sellerEmail || '', 20, y);
    if (invoiceData.buyerEmail) doc.text(invoiceData.buyerEmail, 110, y);
    y += 5;
    doc.text(invoiceData.sellerAddress || '', 20, y);
    doc.text(invoiceData.buyerAddress || '', 110, y);
    y += 5;
    if (invoiceData.sellerPhone) { doc.text(`Tel: ${invoiceData.sellerPhone}`, 20, y); y += 5; }
    doc.text(`USt-IdNr: ${invoiceData.sellerTaxId || ''}`, 20, y);
    y += 15;

    // Invoice meta
    doc.setFillColor(248, 249, 250);
    doc.rect(20, y - 3, pageWidth - 40, 14, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('RECHNUNGSNR.', 25, y + 2);
    doc.text('DATUM', 70, y + 2);
    doc.text('ZAHLUNGSBEDINGUNGEN', 115, y + 2);
    doc.setFontSize(10);
    doc.setTextColor(51);
    doc.text(invoiceData.invoiceNumber || '', 25, y + 8);
    doc.text(formatDateDE(invoiceData.invoiceDate), 70, y + 8);
    doc.text(invoiceData.paymentTerms || '', 115, y + 8);
    y += 22;

    // Table header
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('BESCHREIBUNG', 20, y);
    doc.text('EINZELPREIS', 120, y);
    doc.text('MENGE', 150, y);
    doc.text('BETRAG', 175, y);
    y += 2;
    doc.setDrawColor(200);
    doc.line(20, y, pageWidth - 20, y);
    y += 6;

    // Items
    doc.setFontSize(9);
    doc.setTextColor(51);
    (invoiceData.items || []).forEach(item => {
      const desc = doc.splitTextToSize(item.description || '', 90);
      doc.text(desc, 20, y);
      doc.text(formatCurrency(item.unitPrice, invoiceData.currency), 120, y);
      doc.text(String(item.quantity), 150, y);
      doc.text(formatCurrency(item.total, invoiceData.currency), 175, y);
      y += desc.length * 5 + 3;
      doc.setDrawColor(230);
      doc.line(20, y - 2, pageWidth - 20, y - 2);
    });
    y += 8;

    // Totals
    doc.setFontSize(9);
    doc.text('Zwischensumme', 130, y);
    doc.text(formatCurrency(invoiceData.subtotal, invoiceData.currency), 175, y);
    y += 6;
    doc.text(`MwSt. (${invoiceData.taxRate}%)`, 130, y);
    doc.text(`inkl. ${formatCurrency(invoiceData.taxAmount, invoiceData.currency)}`, 175, y);
    y += 8;
    doc.setDrawColor(51);
    doc.line(130, y - 2, pageWidth - 20, y - 2);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Gesamtbetrag', 130, y + 4);
    doc.text(formatCurrency(invoiceData.total, invoiceData.currency), 175, y + 4);
    doc.setFont(undefined, 'normal');
    y += 15;

    // Notes
    if (invoiceData.notes) {
      doc.setFillColor(248, 249, 250);
      doc.rect(20, y, pageWidth - 40, 20, 'F');
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Anmerkungen', 25, y + 6);
      doc.setFont(undefined, 'normal');
      doc.text(invoiceData.notes, 25, y + 12);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`GuteKissen • ${invoiceData.sellerAddress} • ${invoiceData.sellerEmail}`, pageWidth / 2, 285, { align: 'center' });

    // Download
    doc.save(`Rechnung_${invoiceData.invoiceNumber || 'dokument'}.pdf`);
  };

  // Generate CMR PDF from stored data - direct download
  const generateCmrPDFFromData = (cmrData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const colWidth = (pageWidth - 2 * margin) / 2;
    let y = margin;

    // Helper for drawing cells
    const drawCell = (x, yPos, w, h, num, label, value) => {
      doc.setDrawColor(0);
      doc.rect(x, yPos, w, h);
      doc.setFontSize(6);
      doc.setTextColor(0);
      doc.setFont(undefined, 'bold');
      doc.text(`${num}`, x + 2, yPos + 4);
      doc.setFont(undefined, 'normal');
      doc.text(label, x + 6, yPos + 4);
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(value || '', w - 4);
      doc.text(lines, x + 2, yPos + 9);
    };

    // Header
    doc.setDrawColor(0);
    doc.rect(margin, y, pageWidth - 2 * margin, 18);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('MIEDZYNARODOWY SAMOCHODOWY LIST PRZEWOZOWY', margin + 3, y + 6);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(6);
    doc.text('INTERNATIONALER FRACHTBRIEF / INTERNATIONAL CONSIGNMENT', margin + 3, y + 11);
    // CMR box
    doc.setLineWidth(0.5);
    doc.rect(pageWidth - margin - 35, y + 3, 30, 12);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('CMR', pageWidth - margin - 20, y + 11, { align: 'center' });
    doc.setLineWidth(0.2);
    doc.setFont(undefined, 'normal');
    y += 18;

    // Row 1: Sender (1) | Carrier (16)
    const row1H = 22;
    drawCell(margin, y, colWidth, row1H, '1', 'Nadawca', `${cmrData.senderName || ''}\n${cmrData.senderAddress || ''}\n${cmrData.senderCountry || ''}`);
    drawCell(margin + colWidth, y, colWidth, row1H, '16', 'Przewoznik', `${cmrData.carrierName || ''}\n${cmrData.carrierAddress || ''}\n${cmrData.carrierCountry || ''}`);
    y += row1H;

    // Row 2: Consignee (2) | Successive carriers (17)
    const row2H = 22;
    drawCell(margin, y, colWidth, row2H, '2', 'Odbiorca', `${cmrData.consigneeName || ''}\n${cmrData.consigneeAddress || ''}\n${cmrData.consigneeCountry || ''}`);
    drawCell(margin + colWidth, y, colWidth, row2H, '17', 'Kolejni przewoznicy', cmrData.successiveCarriers || '');
    y += row2H;

    // Registration number row
    doc.rect(margin, y, pageWidth - 2 * margin, 10);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`NR REJ.: ${cmrData.registrationNumber || ''}`, pageWidth / 2, y + 7, { align: 'center' });
    doc.setFont(undefined, 'normal');
    y += 10;

    // Row 3: Delivery place (3) | Carrier reservations (18)
    const row3H = 15;
    drawCell(margin, y, colWidth, row3H, '3', 'Miejsce przeznaczenia', `${cmrData.deliveryPlace || ''}${cmrData.deliveryCountry ? ', ' + cmrData.deliveryCountry : ''}`);
    drawCell(margin + colWidth, y, colWidth, row3H, '18', 'Zastrzezenia przewoznika', cmrData.carrierReservations || '');
    y += row3H;

    // Row 4: Loading place (4) | Special agreements (19)
    const row4H = 15;
    drawCell(margin, y, colWidth, row4H, '4', 'Miejsce i data zaladowania', `${cmrData.loadingPlace || ''}\n${cmrData.loadingDate || ''}`);
    drawCell(margin + colWidth, y, colWidth, row4H, '19', 'Postanowienia specjalne', cmrData.specialAgreements || '');
    y += row4H;

    // Row 5: Documents (5) | Payment (20)
    const row5H = 15;
    drawCell(margin, y, colWidth, row5H, '5', 'Zalaczone dokumenty', cmrData.documents || '');
    doc.rect(margin + colWidth, y, colWidth, row5H);
    doc.setFontSize(6);
    doc.text('20', margin + colWidth + 2, y + 4);
    doc.text('Do zaplacenia', margin + colWidth + 6, y + 4);
    doc.setFontSize(7);
    doc.text(`Przewozne: ${cmrData.carriageCharges || ''}`, margin + colWidth + 3, y + 9);
    doc.setFont(undefined, 'bold');
    doc.text(`Razem: ${cmrData.totalToPay || ''}`, margin + colWidth + 3, y + 13);
    doc.setFont(undefined, 'normal');
    y += row5H;

    // Goods row (6-12)
    const goodsH = 25;
    const gcWidths = [0.12, 0.10, 0.12, 0.26, 0.10, 0.15, 0.15];
    const gcLabels = [['6', 'Cechy'], ['7', 'Ilosc'], ['8', 'Opakowanie'], ['9', 'Rodzaj towaru'], ['10', 'Nr stat.'], ['11', 'Waga kg'], ['12', 'm³']];
    const gcValues = [cmrData.marksAndNos, cmrData.numberOfPackages, cmrData.methodOfPacking, cmrData.natureOfGoods, cmrData.statisticalNumber, cmrData.grossWeight, cmrData.volume];
    let gx = margin;
    const totalW = pageWidth - 2 * margin;
    gcWidths.forEach((wPct, i) => {
      const w = totalW * wPct;
      doc.rect(gx, y, w, goodsH);
      doc.setFontSize(5);
      doc.text(gcLabels[i][0], gx + 1, y + 3);
      doc.text(gcLabels[i][1], gx + 4, y + 3);
      doc.setFontSize(7);
      const lines = doc.splitTextToSize(gcValues[i] || '', w - 2);
      doc.text(lines, gx + 1, y + 8);
      gx += w;
    });
    y += goodsH;

    // Row: Instructions (13) | Payment (15)
    const row6H = 15;
    drawCell(margin, y, colWidth, row6H, '13', 'Instrukcje nadawcy', cmrData.senderInstructions || '');
    drawCell(margin + colWidth, y, colWidth, row6H, '15', 'Zaplata', cmrData.cashOnDelivery || '');
    y += row6H;

    // Row: Payment instructions (14) | Established (21)
    const row7H = 15;
    drawCell(margin, y, colWidth, row7H, '14', 'Postanowienia o przewoznym', cmrData.paymentInstructions || '');
    drawCell(margin + colWidth, y, colWidth, row7H, '21', 'Wystawiono w', `${cmrData.establishedIn || ''}\ndnia ${cmrData.establishedDate || ''}`);
    y += row7H;

    // Signatures row (22, 23, 24)
    const sigH = 25;
    const sigW = (pageWidth - 2 * margin) / 3;
    doc.rect(margin, y, sigW, sigH);
    doc.setFontSize(6);
    doc.text('22', margin + 2, y + 4);
    doc.text('Podpis nadawcy', margin + 6, y + 4);
    doc.rect(margin + sigW, y, sigW, sigH);
    doc.text('23', margin + sigW + 2, y + 4);
    doc.text('Podpis przewoznika', margin + sigW + 6, y + 4);
    doc.rect(margin + 2 * sigW, y, sigW, sigH);
    doc.text('24', margin + 2 * sigW + 2, y + 4);
    doc.text('Przesylke otrzymano', margin + 2 * sigW + 6, y + 4);
    doc.setFontSize(7);
    doc.text('Miejscowosc: _______ dnia: _____', margin + 2 * sigW + 3, y + 18);
    y += sigH;

    // Footer
    doc.setFontSize(5);
    doc.setTextColor(100);
    doc.text('Wzor CMR / IRU / Polska z 1978', pageWidth / 2, y + 4, { align: 'center' });

    // Download
    doc.save(`CMR_${cmrData.registrationNumber || 'dokument'}.pdf`);
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
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}>
                              {doc.type}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.number}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {doc.customer || 'Brak klienta'} • {formatDatePL(doc.date)}
                            {doc.orderId && ` • Zam. #${doc.orderId}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {doc.total !== null && (
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatCurrency(doc.total, doc.currency)}
                          </p>
                        )}
                        <button
                          onClick={() => redownloadDocument(doc)}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center gap-1"
                        >
                          <span>📥</span> Pobierz
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
      </main>
    </div>
  );
}
