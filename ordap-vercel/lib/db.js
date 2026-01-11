import { sql } from '@vercel/postgres';

// Initialize database tables
export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(20) PRIMARY KEY,
      external_id VARCHAR(100),
      channel_label VARCHAR(255),
      channel_platform VARCHAR(100),
      ordered_at TIMESTAMP,
      updated_at TIMESTAMP,
      shipping_date TIMESTAMP,
      payment_status VARCHAR(20),
      delivery_status INTEGER,
      total_gross DECIMAL(10,2),
      currency VARCHAR(3),
      paid_amount DECIMAL(10,2),
      items JSONB,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      customer JSONB,
      shipping JSONB,
      invoice JSONB,
      payments JSONB,
      notes JSONB,
      total_net DECIMAL(10,2),
      is_invoice BOOLEAN DEFAULT false,
      is_canceled BOOLEAN DEFAULT false
    )
  `;

  // Add new columns if they don't exist (for existing tables)
  try {
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer JSONB`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping JSONB`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice JSONB`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payments JSONB`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes JSONB`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_net DECIMAL(10,2)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_invoice BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_canceled BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS send_date_min TIMESTAMP`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS send_date_max TIMESTAMP`;
  } catch (e) {
    // Columns might already exist
  }

  await sql`
    CREATE TABLE IF NOT EXISTS sync_status (
      id SERIAL PRIMARY KEY,
      last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Insert default token row if not exists
  const { rows: tokenRows } = await sql`SELECT COUNT(*) as count FROM tokens`;
  if (tokenRows[0].count === '0') {
    await sql`INSERT INTO tokens (id) VALUES (1)`;
  }

  // Insert default sync status if not exists
  const { rows: syncRows } = await sql`SELECT COUNT(*) as count FROM sync_status`;
  if (syncRows[0].count === '0') {
    await sql`INSERT INTO sync_status (id) VALUES (1)`;
  }
}

// Token operations
export async function getTokens() {
  const { rows } = await sql`SELECT * FROM tokens WHERE id = 1`;
  return rows[0] || null;
}

export async function saveTokens(accessToken, refreshToken, expiresAt) {
  await sql`
    UPDATE tokens
    SET access_token = ${accessToken},
        refresh_token = ${refreshToken},
        expires_at = ${expiresAt},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Sync status operations
export async function getLastSyncDate() {
  const { rows } = await sql`SELECT last_sync_at FROM sync_status WHERE id = 1`;
  return rows[0]?.last_sync_at || null;
}

export async function updateLastSyncDate() {
  await sql`UPDATE sync_status SET last_sync_at = CURRENT_TIMESTAMP WHERE id = 1`;
}

// Order operations - UPSERT to preserve old orders and update existing ones
export async function saveOrders(orders) {
  for (const order of orders) {
    await sql`
      INSERT INTO orders (
        id, external_id, channel_label, channel_platform,
        ordered_at, updated_at, shipping_date, send_date_min, send_date_max,
        payment_status, delivery_status,
        total_gross, total_net, currency, paid_amount, items,
        customer, shipping, invoice, payments, notes,
        is_invoice, is_canceled, synced_at
      ) VALUES (
        ${order.id},
        ${order.externalId},
        ${order.channel.label},
        ${order.channel.platform},
        ${order.dates.orderedAt ? new Date(order.dates.orderedAt) : null},
        ${order.dates.updatedAt ? new Date(order.dates.updatedAt) : null},
        ${order.dates.shippingDate ? new Date(order.dates.shippingDate) : null},
        ${order.dates.sendDateMin ? new Date(order.dates.sendDateMin) : null},
        ${order.dates.sendDateMax ? new Date(order.dates.sendDateMax) : null},
        ${order.status.paymentStatus},
        ${order.status.deliveryStatus},
        ${order.financials.totalGross},
        ${order.financials.totalNet || 0},
        ${order.financials.currency},
        ${order.financials.paidAmount},
        ${JSON.stringify(order.items)},
        ${JSON.stringify(order.customer)},
        ${JSON.stringify(order.shipping)},
        ${JSON.stringify(order.invoice)},
        ${JSON.stringify(order.payments)},
        ${JSON.stringify(order.notes)},
        ${order.status.isInvoice || false},
        ${order.status.isCanceled || false},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        external_id = EXCLUDED.external_id,
        channel_label = EXCLUDED.channel_label,
        channel_platform = EXCLUDED.channel_platform,
        ordered_at = EXCLUDED.ordered_at,
        updated_at = EXCLUDED.updated_at,
        shipping_date = EXCLUDED.shipping_date,
        send_date_min = EXCLUDED.send_date_min,
        send_date_max = EXCLUDED.send_date_max,
        payment_status = EXCLUDED.payment_status,
        delivery_status = EXCLUDED.delivery_status,
        total_gross = EXCLUDED.total_gross,
        total_net = EXCLUDED.total_net,
        currency = EXCLUDED.currency,
        paid_amount = EXCLUDED.paid_amount,
        items = EXCLUDED.items,
        customer = EXCLUDED.customer,
        shipping = EXCLUDED.shipping,
        invoice = EXCLUDED.invoice,
        payments = EXCLUDED.payments,
        notes = EXCLUDED.notes,
        is_invoice = EXCLUDED.is_invoice,
        is_canceled = EXCLUDED.is_canceled,
        synced_at = CURRENT_TIMESTAMP
    `;
  }

  // Update last sync date
  await updateLastSyncDate();
}

// Helper function to map row to order object
function mapRowToOrder(row, includeDetails = false) {
  const order = {
    id: row.id,
    externalId: row.external_id,
    channel: {
      label: row.channel_label,
      platform: row.channel_platform
    },
    dates: {
      orderedAt: row.ordered_at,
      updatedAt: row.updated_at,
      shippingDate: row.shipping_date,
      sendDateMin: row.send_date_min,
      sendDateMax: row.send_date_max
    },
    status: {
      paymentStatus: row.payment_status,
      deliveryStatus: row.delivery_status,
      isInvoice: row.is_invoice || false,
      isCanceled: row.is_canceled || false
    },
    financials: {
      totalGross: parseFloat(row.total_gross) || 0,
      totalNet: parseFloat(row.total_net) || 0,
      currency: row.currency,
      paidAmount: parseFloat(row.paid_amount) || 0
    },
    items: row.items || []
  };

  // Include detailed data only when requested (for single order view)
  if (includeDetails) {
    order.customer = row.customer || null;
    order.shipping = row.shipping || null;
    order.invoice = row.invoice || null;
    order.payments = row.payments || [];
    order.notes = row.notes || [];
  }

  return order;
}

// Get unique channels for filter dropdown (only active channels with recent orders)
export async function getChannels() {
  const { rows } = await sql`
    SELECT DISTINCT channel_platform, channel_label
    FROM orders
    WHERE channel_platform IS NOT NULL
      AND ordered_at > NOW() - INTERVAL '90 days'
    ORDER BY channel_platform, channel_label
  `;
  return rows.map(r => ({
    platform: r.channel_platform,
    label: r.channel_label
  }));
}

// Get orders with pagination, search, channel and status filter
export async function getOrders(page = 1, perPage = 20, search = '', channel = '', status = null) {
  const offset = (page - 1) * perPage;
  const hasSearch = search && search.trim() !== '';
  const hasChannel = channel && channel.trim() !== '';
  const hasStatus = status !== null && status !== '';
  const searchPattern = hasSearch ? `%${search.trim()}%` : '';
  const statusInt = hasStatus ? parseInt(status) : null;

  let rows, countRows;

  // Build query based on filters
  if (hasSearch && hasChannel && hasStatus) {
    const result = await sql`
      SELECT * FROM orders
      WHERE channel_label = ${channel}
        AND delivery_status = ${statusInt}
        AND (id ILIKE ${searchPattern}
          OR external_id ILIKE ${searchPattern}
          OR channel_label ILIKE ${searchPattern}
          OR channel_platform ILIKE ${searchPattern}
          OR items::text ILIKE ${searchPattern})
      ORDER BY ordered_at DESC NULLS LAST
      LIMIT ${perPage}
      OFFSET ${offset}
    `;
    rows = result.rows;
    const countResult = await sql`
      SELECT COUNT(*) as total FROM orders
      WHERE channel_label = ${channel}
        AND delivery_status = ${statusInt}
        AND (id ILIKE ${searchPattern}
          OR external_id ILIKE ${searchPattern}
          OR channel_label ILIKE ${searchPattern}
          OR channel_platform ILIKE ${searchPattern}
          OR items::text ILIKE ${searchPattern})
    `;
    countRows = countResult.rows;
  } else if (hasSearch && hasChannel) {
    const result = await sql`
      SELECT * FROM orders
      WHERE channel_label = ${channel}
        AND (id ILIKE ${searchPattern}
          OR external_id ILIKE ${searchPattern}
          OR channel_label ILIKE ${searchPattern}
          OR channel_platform ILIKE ${searchPattern}
          OR items::text ILIKE ${searchPattern})
      ORDER BY ordered_at DESC NULLS LAST
      LIMIT ${perPage}
      OFFSET ${offset}
    `;
    rows = result.rows;
    const countResult = await sql`
      SELECT COUNT(*) as total FROM orders
      WHERE channel_label = ${channel}
        AND (id ILIKE ${searchPattern}
          OR external_id ILIKE ${searchPattern}
          OR channel_label ILIKE ${searchPattern}
          OR channel_platform ILIKE ${searchPattern}
          OR items::text ILIKE ${searchPattern})
    `;
    countRows = countResult.rows;
  } else if (hasSearch && hasStatus) {
    const result = await sql`
      SELECT * FROM orders
      WHERE delivery_status = ${statusInt}
        AND (id ILIKE ${searchPattern}
          OR external_id ILIKE ${searchPattern}
          OR channel_label ILIKE ${searchPattern}
          OR channel_platform ILIKE ${searchPattern}
          OR items::text ILIKE ${searchPattern})
      ORDER BY ordered_at DESC NULLS LAST
      LIMIT ${perPage}
      OFFSET ${offset}
    `;
    rows = result.rows;
    const countResult = await sql`
      SELECT COUNT(*) as total FROM orders
      WHERE delivery_status = ${statusInt}
        AND (id ILIKE ${searchPattern}
          OR external_id ILIKE ${searchPattern}
          OR channel_label ILIKE ${searchPattern}
          OR channel_platform ILIKE ${searchPattern}
          OR items::text ILIKE ${searchPattern})
    `;
    countRows = countResult.rows;
  } else if (hasChannel && hasStatus) {
    const result = await sql`
      SELECT * FROM orders
      WHERE channel_label = ${channel}
        AND delivery_status = ${statusInt}
      ORDER BY ordered_at DESC NULLS LAST
      LIMIT ${perPage}
      OFFSET ${offset}
    `;
    rows = result.rows;
    const countResult = await sql`
      SELECT COUNT(*) as total FROM orders
      WHERE channel_label = ${channel}
        AND delivery_status = ${statusInt}
    `;
    countRows = countResult.rows;
  } else if (hasSearch) {
    const result = await sql`
      SELECT * FROM orders
      WHERE id ILIKE ${searchPattern}
        OR external_id ILIKE ${searchPattern}
        OR channel_label ILIKE ${searchPattern}
        OR channel_platform ILIKE ${searchPattern}
        OR items::text ILIKE ${searchPattern}
      ORDER BY ordered_at DESC NULLS LAST
      LIMIT ${perPage}
      OFFSET ${offset}
    `;
    rows = result.rows;
    const countResult = await sql`
      SELECT COUNT(*) as total FROM orders
      WHERE id ILIKE ${searchPattern}
        OR external_id ILIKE ${searchPattern}
        OR channel_label ILIKE ${searchPattern}
        OR channel_platform ILIKE ${searchPattern}
        OR items::text ILIKE ${searchPattern}
    `;
    countRows = countResult.rows;
  } else if (hasChannel) {
    const result = await sql`
      SELECT * FROM orders
      WHERE channel_label = ${channel}
      ORDER BY ordered_at DESC NULLS LAST
      LIMIT ${perPage}
      OFFSET ${offset}
    `;
    rows = result.rows;
    const countResult = await sql`
      SELECT COUNT(*) as total FROM orders
      WHERE channel_label = ${channel}
    `;
    countRows = countResult.rows;
  } else if (hasStatus) {
    const result = await sql`
      SELECT * FROM orders
      WHERE delivery_status = ${statusInt}
      ORDER BY ordered_at DESC NULLS LAST
      LIMIT ${perPage}
      OFFSET ${offset}
    `;
    rows = result.rows;
    const countResult = await sql`
      SELECT COUNT(*) as total FROM orders
      WHERE delivery_status = ${statusInt}
    `;
    countRows = countResult.rows;
  } else {
    const result = await sql`
      SELECT * FROM orders
      ORDER BY ordered_at DESC NULLS LAST
      LIMIT ${perPage}
      OFFSET ${offset}
    `;
    rows = result.rows;
    const countResult = await sql`SELECT COUNT(*) as total FROM orders`;
    countRows = countResult.rows;
  }

  const totalCount = parseInt(countRows[0].total);
  const totalPages = Math.ceil(totalCount / perPage);

  return {
    orders: rows.map(mapRowToOrder),
    pagination: {
      page,
      perPage,
      totalCount,
      totalPages
    }
  };
}

// Get orders missing send dates (for batch update)
export async function getOrdersMissingSendDates(limit = 100) {
  const { rows } = await sql`
    SELECT id FROM orders
    WHERE send_date_min IS NULL AND send_date_max IS NULL
    ORDER BY ordered_at DESC
    LIMIT ${limit}
  `;
  return rows.map(r => r.id);
}

// Update send dates for an order
export async function updateOrderSendDates(id, sendDateMin, sendDateMax) {
  await sql`
    UPDATE orders
    SET send_date_min = ${sendDateMin ? new Date(sendDateMin) : null},
        send_date_max = ${sendDateMax ? new Date(sendDateMax) : null}
    WHERE id = ${id}
  `;
}

// Get single order by ID with full details
export async function getOrderById(id) {
  const { rows } = await sql`SELECT * FROM orders WHERE id = ${id}`;

  if (rows.length === 0) return null;

  return mapRowToOrder(rows[0], true);
}

// ============== AI Agent Helper Functions ==============
// Using Polish timezone (Europe/Warsaw) for consistent date handling
// All revenue values are converted to PLN (EUR * 4.35)

const EUR_TO_PLN_RATE = 4.35;
const PL_TZ = 'Europe/Warsaw';

function convertRowsToPln(rows) {
  let totalPln = 0;
  rows.forEach(r => {
    const amount = parseFloat(r.total) || 0;
    if (r.currency === 'PLN') {
      totalPln += amount;
    } else {
      totalPln += amount * EUR_TO_PLN_RATE;
    }
  });
  return totalPln;
}

// Get today's statistics (Polish timezone)
export async function getTodayStats() {
  const countResult = await sql`
    SELECT COUNT(*) as order_count
    FROM orders
    WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
      AND is_canceled = false
  `;

  const revenueResult = await sql`
    SELECT currency, SUM(total_gross) as total
    FROM orders
    WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
      AND is_canceled = false
    GROUP BY currency
  `;

  const totalPln = convertRowsToPln(revenueResult.rows);
  const orderCount = parseInt(countResult.rows[0].order_count) || 0;

  return {
    order_count: orderCount,
    total_revenue_pln: totalPln,
    avg_order_value_pln: orderCount > 0 ? totalPln / orderCount : 0
  };
}

// Get yesterday's statistics (Polish timezone)
export async function getYesterdayStats() {
  const countResult = await sql`
    SELECT COUNT(*) as order_count
    FROM orders
    WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '1 day'
      AND ordered_at < (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
      AND is_canceled = false
  `;

  const revenueResult = await sql`
    SELECT currency, SUM(total_gross) as total
    FROM orders
    WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '1 day'
      AND ordered_at < (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
      AND is_canceled = false
    GROUP BY currency
  `;

  const totalPln = convertRowsToPln(revenueResult.rows);
  const orderCount = parseInt(countResult.rows[0].order_count) || 0;

  return {
    order_count: orderCount,
    total_revenue_pln: totalPln,
    avg_order_value_pln: orderCount > 0 ? totalPln / orderCount : 0
  };
}

// Get last 7 days statistics (Polish timezone)
export async function getLast7DaysStats() {
  const countResult = await sql`
    SELECT COUNT(*) as order_count
    FROM orders
    WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '7 days'
      AND is_canceled = false
  `;

  const revenueResult = await sql`
    SELECT currency, SUM(total_gross) as total
    FROM orders
    WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '7 days'
      AND is_canceled = false
    GROUP BY currency
  `;

  const totalPln = convertRowsToPln(revenueResult.rows);
  const orderCount = parseInt(countResult.rows[0].order_count) || 0;

  return {
    order_count: orderCount,
    total_revenue_pln: totalPln,
    avg_order_value_pln: orderCount > 0 ? totalPln / orderCount : 0
  };
}

// Get last 30 days statistics (Polish timezone)
export async function getLast30DaysStats() {
  const countResult = await sql`
    SELECT COUNT(*) as order_count
    FROM orders
    WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '30 days'
      AND is_canceled = false
  `;

  const revenueResult = await sql`
    SELECT currency, SUM(total_gross) as total
    FROM orders
    WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '30 days'
      AND is_canceled = false
    GROUP BY currency
  `;

  const totalPln = convertRowsToPln(revenueResult.rows);
  const orderCount = parseInt(countResult.rows[0].order_count) || 0;

  return {
    order_count: orderCount,
    total_revenue_pln: totalPln,
    avg_order_value_pln: orderCount > 0 ? totalPln / orderCount : 0
  };
}

// Get this month statistics (Polish timezone)
export async function getThisMonthStats() {
  const countResult = await sql`
    SELECT COUNT(*) as order_count
    FROM orders
    WHERE ordered_at >= DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
      AND is_canceled = false
  `;

  const revenueResult = await sql`
    SELECT currency, SUM(total_gross) as total
    FROM orders
    WHERE ordered_at >= DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
      AND is_canceled = false
    GROUP BY currency
  `;

  const totalPln = convertRowsToPln(revenueResult.rows);
  const orderCount = parseInt(countResult.rows[0].order_count) || 0;

  return {
    order_count: orderCount,
    total_revenue_pln: totalPln
  };
}

// Get last month statistics (Polish timezone)
export async function getLastMonthStats() {
  const countResult = await sql`
    SELECT COUNT(*) as order_count
    FROM orders
    WHERE ordered_at >= DATE_TRUNC('month', (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '1 month')
      AND ordered_at < DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
      AND is_canceled = false
  `;

  const revenueResult = await sql`
    SELECT currency, SUM(total_gross) as total
    FROM orders
    WHERE ordered_at >= DATE_TRUNC('month', (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '1 month')
      AND ordered_at < DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
      AND is_canceled = false
    GROUP BY currency
  `;

  const totalPln = convertRowsToPln(revenueResult.rows);
  const orderCount = parseInt(countResult.rows[0].order_count) || 0;

  return {
    order_count: orderCount,
    total_revenue_pln: totalPln
  };
}

// Get statistics by platform for last 7 days (Polish timezone)
export async function getStatsByPlatformLast7Days() {
  const { rows } = await sql`
    SELECT
      channel_platform,
      COUNT(*) as order_count,
      COALESCE(SUM(total_gross), 0) as total_revenue
    FROM orders
    WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '7 days'
      AND is_canceled = false
    GROUP BY channel_platform
    ORDER BY order_count DESC
  `;
  return rows;
}

// Get daily statistics for last 14 days (Polish timezone)
export async function getDailyStatsLast14Days() {
  const { rows } = await sql`
    SELECT
      DATE(ordered_at AT TIME ZONE 'Europe/Warsaw') as date,
      COUNT(*) as order_count,
      COALESCE(SUM(total_gross), 0) as total_revenue
    FROM orders
    WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '14 days'
      AND is_canceled = false
    GROUP BY DATE(ordered_at AT TIME ZONE 'Europe/Warsaw')
    ORDER BY date DESC
  `;
  return rows;
}

// Get top products by quantity sold (last 30 days, Polish timezone)
export async function getTopProductsLast30Days(limit = 10) {
  const { rows } = await sql`
    SELECT
      item->>'name' as product_name,
      item->>'sku' as sku,
      SUM((item->>'quantity')::int) as total_quantity,
      COUNT(DISTINCT id) as order_count
    FROM orders, jsonb_array_elements(items) as item
    WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '30 days'
      AND is_canceled = false
      AND (item->>'isShipping')::boolean = false
    GROUP BY item->>'name', item->>'sku'
    ORDER BY total_quantity DESC
    LIMIT ${limit}
  `;
  return rows;
}

// Get overall statistics summary
export async function getOverallStats() {
  const { rows } = await sql`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(total_gross), 0) as total_revenue,
      COALESCE(AVG(total_gross), 0) as avg_order_value,
      MIN(ordered_at) as first_order_date,
      MAX(ordered_at) as last_order_date,
      COUNT(DISTINCT channel_platform) as platform_count,
      COUNT(CASE WHEN is_canceled = true THEN 1 END) as canceled_orders
    FROM orders
  `;
  return rows[0];
}

// Get status distribution
export async function getStatusDistribution() {
  const { rows } = await sql`
    SELECT
      delivery_status,
      COUNT(*) as count
    FROM orders
    WHERE is_canceled = false
    GROUP BY delivery_status
    ORDER BY count DESC
  `;
  return rows;
}

// Search order by ID or external ID (for AI agent)
export async function searchOrderForAgent(searchTerm) {
  const searchPattern = `%${searchTerm}%`;

  const { rows } = await sql`
    SELECT
      id, external_id, channel_label, channel_platform,
      ordered_at, payment_status, delivery_status,
      total_gross, currency, items, customer, shipping
    FROM orders
    WHERE id ILIKE ${searchPattern}
       OR external_id ILIKE ${searchPattern}
    ORDER BY ordered_at DESC
    LIMIT 5
  `;

  return rows.map(row => ({
    id: row.id,
    externalId: row.external_id,
    channel: row.channel_platform,
    channelLabel: row.channel_label,
    orderedAt: row.ordered_at,
    paymentStatus: row.payment_status,
    deliveryStatus: row.delivery_status,
    totalGross: parseFloat(row.total_gross) || 0,
    currency: row.currency,
    items: row.items || [],
    customer: row.customer || {},
    shipping: row.shipping || {}
  }));
}
