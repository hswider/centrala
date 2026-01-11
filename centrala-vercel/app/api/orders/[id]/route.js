import { NextResponse } from 'next/server';
import axios from 'axios';
import { sql } from '@vercel/postgres';
import { initDatabase, getOrderById, getTokens } from '@/lib/db';

// Fetch single order from Apilo API with full details
async function fetchOrderFromApilo(orderId, accessToken) {
  const baseUrl = process.env.APILO_BASE_URL;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    const response = await axios.get(`${baseUrl}/rest/api/orders/${orderId}/`, { headers });
    const order = response.data;

    // Map address
    const mapAddress = (address) => {
      if (!address) return null;
      return {
        name: address.name || '',
        phone: address.phone || '',
        email: address.email || '',
        street: address.streetName || '',
        streetNumber: address.streetNumber || '',
        city: address.city || '',
        zipCode: address.zipCode || '',
        country: address.country || '',
        companyName: address.companyName || '',
        companyTaxNumber: address.companyTaxNumber || ''
      };
    };

    // Map payments
    const payments = (order.orderPayments || []).map(p => ({
      id: p.id,
      date: p.paymentDate || null,
      amount: parseFloat(p.amount) || 0,
      currency: p.currency || order.originalCurrency || 'PLN',
      type: `Typ ${p.type}`,
      comment: p.comment || ''
    }));

    // Map notes
    const notes = (order.orderNotes || []).map(n => ({
      type: n.type,
      comment: n.comment || '',
      createdAt: n.createdAt
    }));

    return {
      customer: mapAddress(order.addressCustomer),
      shipping: mapAddress(order.addressDelivery),
      invoice: mapAddress(order.addressInvoice),
      payments,
      notes,
      totalNet: parseFloat(order.originalAmountTotalWithoutTax) || 0,
      paidAmount: parseFloat(order.originalAmountTotalPaid) || 0,
      sendDateMin: order.sendDateMin || null,
      sendDateMax: order.sendDateMax || null
    };
  } catch (error) {
    console.error('[API] Error fetching from Apilo:', error.message);
    return null;
  }
}

export async function GET(request, { params }) {
  try {
    await initDatabase();

    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Zamowienie nie znalezione' },
        { status: 404 }
      );
    }

    // If shipping data or send dates are missing, fetch from Apilo API
    const needsFetch = !order.shipping || !order.payments || order.payments.length === 0 ||
                       (!order.dates?.sendDateMin && !order.dates?.sendDateMax);

    if (needsFetch) {
      const tokens = await getTokens();
      if (tokens?.access_token) {
        const apiloData = await fetchOrderFromApilo(id, tokens.access_token);
        if (apiloData) {
          // Merge Apilo data with database data
          order.customer = apiloData.customer || order.customer;
          order.shipping = apiloData.shipping;
          order.invoice = apiloData.invoice;
          order.payments = apiloData.payments;
          order.notes = apiloData.notes;
          order.financials.totalNet = apiloData.totalNet || order.financials.totalNet;
          order.financials.paidAmount = apiloData.paidAmount || order.financials.paidAmount;

          // Add send dates to order
          if (!order.dates) order.dates = {};
          order.dates.sendDateMin = apiloData.sendDateMin;
          order.dates.sendDateMax = apiloData.sendDateMax;

          // Save send dates to database for future requests
          if (apiloData.sendDateMin || apiloData.sendDateMax) {
            try {
              await sql`
                UPDATE orders
                SET send_date_min = ${apiloData.sendDateMin ? new Date(apiloData.sendDateMin) : null},
                    send_date_max = ${apiloData.sendDateMax ? new Date(apiloData.sendDateMax) : null}
                WHERE id = ${id}
              `;
            } catch (e) {
              console.error('[API] Failed to save send dates:', e.message);
            }
          }
        }
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('[API] Error fetching order:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
