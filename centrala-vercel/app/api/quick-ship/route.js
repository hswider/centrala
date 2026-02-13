import { sql } from '@vercel/postgres';
import { initDatabase, getTokens } from '../../../lib/db';
import { createShipment, getShippingMethods, apiloRequestDirect } from '../../../lib/apilo';

// Normalize Apilo array responses
function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.carrierAccounts)) return data.carrierAccounts;
    if (Array.isArray(data.methods)) return data.methods;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
    const keys = Object.keys(data);
    if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k)))) {
      return Object.values(data);
    }
  }
  return [];
}

// Parse dimensions from carrier account name (e.g. "DHL 600x350x200 ...")
function parseDimensionsFromName(name) {
  if (!name) return null;
  const match = name.match(/(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)/);
  if (match) {
    let [, d1, d2, d3] = match.map(Number);
    // Convert mm to cm if values > 100
    if (d1 > 100 || d2 > 100 || d3 > 100) {
      d1 = Math.round(d1 / 10);
      d2 = Math.round(d2 / 10);
      d3 = Math.round(d3 / 10);
    }
    return { length: d1, width: d2, height: d3 };
  }
  return null;
}

// Test if a value matches a regex pattern (safely)
function matchesPattern(pattern, value) {
  if (!pattern) return true; // no pattern = match all
  if (!value) return false;
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(value);
  } catch (e) {
    // Invalid regex - fall back to simple includes
    return value.toLowerCase().includes(pattern.toLowerCase());
  }
}

// POST - One-click quick ship
export async function POST(request) {
  try {
    await initDatabase();
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return Response.json({ success: false, error: 'orderId jest wymagane' }, { status: 400 });
    }

    // 1. Fetch order from DB
    const { rows: orderRows } = await sql`
      SELECT id, channel_label, channel_platform, items, shipping, customer
      FROM orders WHERE id = ${orderId}
    `;

    if (orderRows.length === 0) {
      return Response.json({ success: false, error: 'Zamowienie nie znalezione' }, { status: 404 });
    }

    const order = orderRows[0];
    const channelLabel = order.channel_label || '';
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    const shipping = typeof order.shipping === 'string' ? JSON.parse(order.shipping) : (order.shipping || {});

    const itemSkus = items.map(item => item.sku || '').filter(Boolean);

    console.log(`[QuickShip] Order ${orderId}: channelLabel="${channelLabel}", SKUs=${JSON.stringify(itemSkus)}`);

    // 2. Fetch active shipping rules ordered by priority DESC
    const { rows: rules } = await sql`
      SELECT * FROM shipping_rules
      WHERE is_active = true
      ORDER BY priority DESC, id ASC
    `;

    if (rules.length === 0) {
      return Response.json({
        success: false, error: 'NO_RULE_MATCH',
        message: 'Brak zdefiniowanych regul wysylki',
        debug: { orderId, channelLabel, itemSkus, rulesCount: 0 }
      });
    }

    // 3. Match rules (channel + SKU only)
    let matchedRule = null;
    const debugMatches = [];
    for (const rule of rules) {
      const channelMatch = matchesPattern(rule.channel_pattern, channelLabel);

      let skuMatch = true;
      if (rule.sku_pattern) {
        skuMatch = items.some(item => matchesPattern(rule.sku_pattern, item.sku || item.name || ''));
      }

      debugMatches.push({ rule: rule.name, channelMatch, skuMatch,
        ruleChannel: rule.channel_pattern, ruleSku: rule.sku_pattern });
      console.log(`[QuickShip] Rule "${rule.name}": channel=${channelMatch}, sku=${skuMatch}`);

      if (channelMatch && skuMatch) {
        matchedRule = rule;
        break;
      }
    }

    if (!matchedRule) {
      return Response.json({
        success: false, error: 'NO_RULE_MATCH',
        message: 'Zaden rule nie pasuje do tego zamowienia',
        debug: { orderId, channelLabel, itemSkus, rulesCount: rules.length, matches: debugMatches }
      });
    }

    console.log(`[QuickShip] Matched rule "${matchedRule.name}" (id=${matchedRule.id}) for order ${orderId}`);

    // 4. Resolve method UUID
    let methodUuid = matchedRule.method_uuid;
    if (!methodUuid) {
      // Auto-fetch first method for this carrier account
      const rawMethods = await getShippingMethods(matchedRule.carrier_account_id);
      const methods = normalizeArray(rawMethods);
      if (methods.length > 0) {
        methodUuid = methods[0].uuid || methods[0].id || '';
      }
      console.log(`[QuickShip] Auto-resolved method UUID: ${methodUuid} from ${methods.length} methods`);
    }

    if (!methodUuid) {
      return Response.json({
        success: false,
        error: 'NO_METHOD',
        message: 'Nie mozna okreslic metody wysylki dla konta kuriera'
      }, { status: 400 });
    }

    // 5. Fetch fresh shipping address from Apilo (local DB may be incomplete)
    let address = {
      type: 'house',
      name: shipping.name || '',
      streetName: shipping.street || '',
      streetNumber: shipping.streetNumber || '',
      zipCode: shipping.zipCode || '',
      city: shipping.city || '',
      country: shipping.country || 'PL',
      phone: shipping.phone || '',
      email: shipping.email || ''
    };

    if (!address.streetName || !address.name) {
      try {
        const apiloOrder = await apiloRequestDirect('GET', `/rest/api/orders/${orderId}/`);
        const addr = apiloOrder?.addressDelivery || apiloOrder?.addressCustomer || {};
        address = {
          type: 'house',
          name: addr.name || address.name,
          streetName: addr.streetName || address.streetName,
          streetNumber: addr.streetNumber || address.streetNumber,
          zipCode: addr.zipCode || address.zipCode,
          city: addr.city || address.city,
          country: addr.country || address.country || 'PL',
          phone: addr.phone || address.phone,
          email: addr.email || address.email
        };
        console.log(`[QuickShip] Fetched address from Apilo: ${address.name}, ${address.streetName} ${address.streetNumber}, ${address.zipCode} ${address.city}`);
      } catch (e) {
        console.warn('[QuickShip] Could not fetch address from Apilo:', e.message);
      }
    }

    // 6. Parse dimensions from carrier account name
    const dimensions = parseDimensionsFromName(matchedRule.carrier_account_name) || { length: 30, width: 20, height: 10 };

    // 7. Build content description from order items
    const contentDescription = items
      .map(item => item.name || item.sku || '')
      .filter(Boolean)
      .join(', ')
      .substring(0, 200) || 'Towar';

    // 8. Create shipment via Apilo
    const result = await createShipment({
      carrierAccountId: matchedRule.carrier_account_id,
      orderId,
      method: methodUuid,
      addressReceiver: address,
      parcels: [{
        weight: 1,
        dimensions
      }],
      options: [
        { id: 'content', type: 'string', value: contentDescription }
      ]
    });

    // 7. Extract shipment ID from response
    const shipmentId = result?.shipments?.[0]?.shipmentId
      || result?.shipments?.[0]?.id
      || result?.shipmentId
      || result?.id
      || result?.list?.[0]?.shipmentId
      || result?.list?.[0]?.id;

    const firstShipment = result?.shipments?.[0] || result?.list?.[0] || result || {};
    const trackingNumber = firstShipment.tracking || firstShipment.trackingNumber || firstShipment.idExternal || '';
    const courierLabel = matchedRule.carrier_account_name || firstShipment.carrierName || 'apilo';

    console.log(`[QuickShip] Shipment created: id=${shipmentId}, tracking=${trackingNumber}`);

    // 8. Save to local shipments table
    if (shipmentId) {
      const { rows: existing } = await sql`
        SELECT id FROM shipments WHERE order_id = ${orderId} AND courier_shipment_id = ${shipmentId.toString()}
      `;
      if (existing.length > 0) {
        await sql`
          UPDATE shipments SET
            status = 'created',
            courier = ${courierLabel},
            tracking_number = ${trackingNumber},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existing[0].id}
        `;
      } else {
        await sql`
          INSERT INTO shipments (
            order_id, courier, courier_shipment_id, tracking_number, status,
            receiver_name, receiver_address, receiver_city, receiver_postal_code,
            weight, dimensions, created_at
          ) VALUES (
            ${orderId}, ${courierLabel}, ${shipmentId.toString()}, ${trackingNumber}, 'created',
            ${shipping.name || ''}, ${shipping.street || ''},
            ${shipping.city || ''}, ${shipping.zipCode || ''},
            ${1}, ${JSON.stringify(dimensions)}::jsonb,
            CURRENT_TIMESTAMP
          )
        `;
      }
    }

    // 9. Return success with label URL
    const labelUrl = shipmentId
      ? `/api/apilo/shipping/${shipmentId}/label?orderId=${orderId}`
      : null;

    return Response.json({
      success: true,
      shipmentId,
      trackingNumber,
      courier: courierLabel,
      labelUrl,
      matchedRule: matchedRule.name
    });

  } catch (error) {
    console.error('[QuickShip] Error:', error);
    const errorDetails = {
      message: error.message,
      responseData: error.response?.data,
      responseStatus: error.response?.status
    };
    return Response.json({
      success: false,
      error: error.message,
      details: errorDetails
    }, { status: 500 });
  }
}
