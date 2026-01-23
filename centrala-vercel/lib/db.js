import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

// Initialize database tables
export async function initDatabase() {
  // Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    )
  `;
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

  // Inventory table migrations
  try {
    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS tkanina VARCHAR(255)`;
  } catch (e) {
    // Column might already exist
  }

  // Inventory color thresholds for stock warnings
  try {
    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS yellow_threshold INTEGER`;
    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS red_threshold INTEGER`;
  } catch (e) {
    // Columns might already exist
  }

  // Inventory MTS columns (min_stock, lead_time_days)
  try {
    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0`;
    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 1`;
  } catch (e) {
    // Columns might already exist
  }

  // Users table migrations - add permissions
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '["dashboard","oms","wms","mes","mts","crm","crm-eu","rank","agent"]'::jsonb`;
  } catch (e) {
    // Column might already exist
  }

  // Update admin users to have all permissions
  try {
    await sql`UPDATE users SET permissions = '["dashboard","oms","wms","mes","mts","crm","crm-eu","rank","agent","admin"]'::jsonb WHERE role = 'admin' AND (permissions IS NULL OR NOT permissions @> '["mts"]'::jsonb)`;
  } catch (e) {
    // Ignore errors
  }

  // Add last_activity column for online status tracking
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP`;
  } catch (e) {
    // Column might already exist
  }

  await sql`
    CREATE TABLE IF NOT EXISTS sync_status (
      id SERIAL PRIMARY KEY,
      last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Allegro OAuth tokens
  await sql`
    CREATE TABLE IF NOT EXISTS allegro_tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT,
      user_id VARCHAR(100),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Allegro message threads
  await sql`
    CREATE TABLE IF NOT EXISTS allegro_threads (
      id VARCHAR(100) PRIMARY KEY,
      interlocutor_id VARCHAR(100),
      interlocutor_login VARCHAR(255),
      interlocutor_name VARCHAR(255),
      interlocutor_avatar TEXT,
      interlocutor_company BOOLEAN DEFAULT false,
      last_message_at TIMESTAMP,
      read BOOLEAN DEFAULT false,
      offer_id VARCHAR(100),
      offer_title TEXT,
      order_id VARCHAR(100),
      messages_count INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Allegro messages
  await sql`
    CREATE TABLE IF NOT EXISTS allegro_messages (
      id VARCHAR(100) PRIMARY KEY,
      thread_id VARCHAR(100) REFERENCES allegro_threads(id) ON DELETE CASCADE,
      sender_id VARCHAR(100),
      sender_login VARCHAR(255),
      sender_is_interlocutor BOOLEAN DEFAULT false,
      text TEXT,
      sent_at TIMESTAMP,
      has_attachments BOOLEAN DEFAULT false,
      attachments JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Allegro sync status
  await sql`
    CREATE TABLE IF NOT EXISTS allegro_sync_status (
      id SERIAL PRIMARY KEY,
      last_sync_at TIMESTAMP,
      last_thread_sync_at TIMESTAMP,
      sync_in_progress BOOLEAN DEFAULT false
    )
  `;

  // Insert default Allegro token row if not exists
  const { rows: allegroTokenRows } = await sql`SELECT COUNT(*) as count FROM allegro_tokens`;
  if (allegroTokenRows[0].count === '0') {
    await sql`INSERT INTO allegro_tokens (id) VALUES (1)`;
  }

  // Insert default Allegro sync status if not exists
  const { rows: allegroSyncRows } = await sql`SELECT COUNT(*) as count FROM allegro_sync_status`;
  if (allegroSyncRows[0].count === '0') {
    await sql`INSERT INTO allegro_sync_status (id) VALUES (1)`;
  }

  // ========== ALLEGRO MEBLEBOX ==========

  // Allegro Meblebox OAuth tokens
  await sql`
    CREATE TABLE IF NOT EXISTS allegro_meblebox_tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT,
      user_id VARCHAR(100),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Allegro Meblebox message threads
  await sql`
    CREATE TABLE IF NOT EXISTS allegro_meblebox_threads (
      id VARCHAR(100) PRIMARY KEY,
      interlocutor_id VARCHAR(100),
      interlocutor_login VARCHAR(255),
      interlocutor_name VARCHAR(255),
      interlocutor_avatar TEXT,
      interlocutor_company BOOLEAN DEFAULT false,
      last_message_at TIMESTAMP,
      read BOOLEAN DEFAULT false,
      offer_id VARCHAR(100),
      offer_title TEXT,
      order_id VARCHAR(100),
      messages_count INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Allegro Meblebox messages
  await sql`
    CREATE TABLE IF NOT EXISTS allegro_meblebox_messages (
      id VARCHAR(100) PRIMARY KEY,
      thread_id VARCHAR(100) REFERENCES allegro_meblebox_threads(id) ON DELETE CASCADE,
      sender_id VARCHAR(100),
      sender_login VARCHAR(255),
      sender_is_interlocutor BOOLEAN DEFAULT false,
      text TEXT,
      sent_at TIMESTAMP,
      has_attachments BOOLEAN DEFAULT false,
      attachments JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Allegro Meblebox sync status
  await sql`
    CREATE TABLE IF NOT EXISTS allegro_meblebox_sync_status (
      id SERIAL PRIMARY KEY,
      last_sync_at TIMESTAMP,
      last_thread_sync_at TIMESTAMP,
      sync_in_progress BOOLEAN DEFAULT false
    )
  `;

  // ========== GMAIL (Shopify Dobrelegowiska) ==========

  // Gmail OAuth tokens
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT,
      email VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail threads
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_threads (
      id VARCHAR(100) PRIMARY KEY,
      subject TEXT,
      snippet TEXT,
      from_email VARCHAR(255),
      from_name VARCHAR(255),
      last_message_at TIMESTAMP,
      unread BOOLEAN DEFAULT true,
      messages_count INTEGER DEFAULT 0,
      labels JSONB,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail messages
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_messages (
      id VARCHAR(100) PRIMARY KEY,
      thread_id VARCHAR(100) REFERENCES gmail_threads(id) ON DELETE CASCADE,
      from_email VARCHAR(255),
      from_name VARCHAR(255),
      to_email VARCHAR(255),
      subject TEXT,
      body_text TEXT,
      body_html TEXT,
      sent_at TIMESTAMP,
      is_outgoing BOOLEAN DEFAULT false,
      has_attachments BOOLEAN DEFAULT false,
      attachments JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail sync status
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_sync_status (
      id SERIAL PRIMARY KEY,
      last_sync_at TIMESTAMP,
      sync_in_progress BOOLEAN DEFAULT false
    )
  `;

  // Insert default Gmail token row if not exists
  const { rows: gmailTokenRows } = await sql`SELECT COUNT(*) as count FROM gmail_tokens`;
  if (gmailTokenRows[0].count === '0') {
    await sql`INSERT INTO gmail_tokens (id) VALUES (1)`;
  }

  // Insert default Gmail sync status if not exists
  const { rows: gmailSyncRows } = await sql`SELECT COUNT(*) as count FROM gmail_sync_status`;
  if (gmailSyncRows[0].count === '0') {
    await sql`INSERT INTO gmail_sync_status (id) VALUES (1)`;
  }

  // ========== GMAIL POOMKIDS (poomkids.kontakt@gmail.com) ==========

  // Gmail POOMKIDS OAuth tokens
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_poomkids_tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT,
      email VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail POOMKIDS threads
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_poomkids_threads (
      id VARCHAR(100) PRIMARY KEY,
      subject TEXT,
      snippet TEXT,
      from_email VARCHAR(255),
      from_name VARCHAR(255),
      last_message_at TIMESTAMP,
      unread BOOLEAN DEFAULT true,
      messages_count INTEGER DEFAULT 0,
      labels JSONB,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail POOMKIDS messages
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_poomkids_messages (
      id VARCHAR(100) PRIMARY KEY,
      thread_id VARCHAR(100) REFERENCES gmail_poomkids_threads(id) ON DELETE CASCADE,
      from_email VARCHAR(255),
      from_name VARCHAR(255),
      to_email VARCHAR(255),
      subject TEXT,
      body_text TEXT,
      body_html TEXT,
      sent_at TIMESTAMP,
      is_outgoing BOOLEAN DEFAULT false,
      has_attachments BOOLEAN DEFAULT false,
      attachments JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail POOMKIDS sync status
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_poomkids_sync_status (
      id SERIAL PRIMARY KEY,
      last_sync_at TIMESTAMP,
      sync_in_progress BOOLEAN DEFAULT false
    )
  `;

  // Insert default Gmail POOMKIDS token row if not exists
  const { rows: gmailPoomkidsTokenRows } = await sql`SELECT COUNT(*) as count FROM gmail_poomkids_tokens`;
  if (gmailPoomkidsTokenRows[0].count === '0') {
    await sql`INSERT INTO gmail_poomkids_tokens (id) VALUES (1)`;
  }

  // Insert default Gmail POOMKIDS sync status if not exists
  const { rows: gmailPoomkidsSyncRows } = await sql`SELECT COUNT(*) as count FROM gmail_poomkids_sync_status`;
  if (gmailPoomkidsSyncRows[0].count === '0') {
    await sql`INSERT INTO gmail_poomkids_sync_status (id) VALUES (1)`;
  }

  // ========== GMAIL ALLEPODUSZKI (allepoduszki.kontakt@gmail.com) ==========

  // Gmail Allepoduszki OAuth tokens
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_allepoduszki_tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT,
      email VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail Allepoduszki threads
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_allepoduszki_threads (
      id VARCHAR(100) PRIMARY KEY,
      subject TEXT,
      snippet TEXT,
      from_email VARCHAR(255),
      from_name VARCHAR(255),
      last_message_at TIMESTAMP,
      unread BOOLEAN DEFAULT true,
      messages_count INTEGER DEFAULT 0,
      labels JSONB,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail Allepoduszki messages
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_allepoduszki_messages (
      id VARCHAR(100) PRIMARY KEY,
      thread_id VARCHAR(100) REFERENCES gmail_allepoduszki_threads(id) ON DELETE CASCADE,
      from_email VARCHAR(255),
      from_name VARCHAR(255),
      to_email VARCHAR(255),
      subject TEXT,
      body_text TEXT,
      body_html TEXT,
      sent_at TIMESTAMP,
      is_outgoing BOOLEAN DEFAULT false,
      has_attachments BOOLEAN DEFAULT false,
      attachments JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail Allepoduszki sync status
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_allepoduszki_sync_status (
      id SERIAL PRIMARY KEY,
      last_sync_at TIMESTAMP,
      sync_in_progress BOOLEAN DEFAULT false
    )
  `;

  // Insert default Gmail Allepoduszki token row if not exists
  const { rows: gmailAllepoduszkiTokenRows } = await sql`SELECT COUNT(*) as count FROM gmail_allepoduszki_tokens`;
  if (gmailAllepoduszkiTokenRows[0].count === '0') {
    await sql`INSERT INTO gmail_allepoduszki_tokens (id) VALUES (1)`;
  }

  // Insert default Gmail Allepoduszki sync status if not exists
  const { rows: gmailAllepoduszkiSyncRows } = await sql`SELECT COUNT(*) as count FROM gmail_allepoduszki_sync_status`;
  if (gmailAllepoduszkiSyncRows[0].count === '0') {
    await sql`INSERT INTO gmail_allepoduszki_sync_status (id) VALUES (1)`;
  }

  // ========== GMAIL POOMFURNITURE (kontakt.poom@gmail.com) ==========

  // Gmail Poomfurniture OAuth tokens
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_poomfurniture_tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT,
      email VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail Poomfurniture threads
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_poomfurniture_threads (
      id VARCHAR(100) PRIMARY KEY,
      subject TEXT,
      snippet TEXT,
      from_email VARCHAR(255),
      from_name VARCHAR(255),
      last_message_at TIMESTAMP,
      unread BOOLEAN DEFAULT true,
      messages_count INTEGER DEFAULT 0,
      labels JSONB,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail Poomfurniture messages
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_poomfurniture_messages (
      id VARCHAR(100) PRIMARY KEY,
      thread_id VARCHAR(100) REFERENCES gmail_poomfurniture_threads(id) ON DELETE CASCADE,
      from_email VARCHAR(255),
      from_name VARCHAR(255),
      to_email VARCHAR(255),
      subject TEXT,
      body_text TEXT,
      body_html TEXT,
      sent_at TIMESTAMP,
      is_outgoing BOOLEAN DEFAULT false,
      has_attachments BOOLEAN DEFAULT false,
      attachments JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail Poomfurniture sync status
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_poomfurniture_sync_status (
      id SERIAL PRIMARY KEY,
      last_sync_at TIMESTAMP,
      sync_in_progress BOOLEAN DEFAULT false
    )
  `;

  // Insert default Gmail Poomfurniture token row if not exists
  const { rows: gmailPoomfurnitureTokenRows } = await sql`SELECT COUNT(*) as count FROM gmail_poomfurniture_tokens`;
  if (gmailPoomfurnitureTokenRows[0].count === '0') {
    await sql`INSERT INTO gmail_poomfurniture_tokens (id) VALUES (1)`;
  }

  // Insert default Gmail Poomfurniture sync status if not exists
  const { rows: gmailPoomfurnitureSyncRows } = await sql`SELECT COUNT(*) as count FROM gmail_poomfurniture_sync_status`;
  if (gmailPoomfurnitureSyncRows[0].count === '0') {
    await sql`INSERT INTO gmail_poomfurniture_sync_status (id) VALUES (1)`;
  }

  // ========== AMAZON DE (SP-API) ==========

  // Amazon DE OAuth tokens
  await sql`
    CREATE TABLE IF NOT EXISTS amazon_de_tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Amazon DE message threads (grouped by order)
  await sql`
    CREATE TABLE IF NOT EXISTS amazon_de_threads (
      id VARCHAR(100) PRIMARY KEY,
      order_id VARCHAR(100),
      buyer_name VARCHAR(255),
      subject TEXT,
      snippet TEXT,
      last_message_at TIMESTAMP,
      unread BOOLEAN DEFAULT true,
      messages_count INTEGER DEFAULT 0,
      order_total DECIMAL(10,2),
      order_currency VARCHAR(3),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Amazon DE messages
  await sql`
    CREATE TABLE IF NOT EXISTS amazon_de_messages (
      id VARCHAR(100) PRIMARY KEY,
      thread_id VARCHAR(100) REFERENCES amazon_de_threads(id) ON DELETE CASCADE,
      sender VARCHAR(50),
      subject TEXT,
      body_text TEXT,
      sent_at TIMESTAMP,
      is_outgoing BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Amazon DE sync status
  await sql`
    CREATE TABLE IF NOT EXISTS amazon_de_sync_status (
      id SERIAL PRIMARY KEY,
      last_sync_at TIMESTAMP,
      sync_in_progress BOOLEAN DEFAULT false
    )
  `;

  // Insert default Amazon DE token row if not exists
  const { rows: amazonDeTokenRows } = await sql`SELECT COUNT(*) as count FROM amazon_de_tokens`;
  if (amazonDeTokenRows[0].count === '0') {
    await sql`INSERT INTO amazon_de_tokens (id) VALUES (1)`;
  }

  // Insert default Amazon DE sync status if not exists
  const { rows: amazonDeSyncRows } = await sql`SELECT COUNT(*) as count FROM amazon_de_sync_status`;
  if (amazonDeSyncRows[0].count === '0') {
    await sql`INSERT INTO amazon_de_sync_status (id) VALUES (1)`;
  }

  // ========== GMAIL AMAZON DE ==========

  // Gmail Amazon DE OAuth tokens
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_amazon_de_tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT,
      email VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Gmail Amazon DE threads
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_amazon_de_threads (
      id VARCHAR(100) PRIMARY KEY,
      subject TEXT,
      snippet TEXT,
      from_email VARCHAR(255),
      from_name VARCHAR(255),
      order_id VARCHAR(50),
      marketplace VARCHAR(10),
      last_message_at TIMESTAMP,
      unread BOOLEAN DEFAULT true,
      messages_count INTEGER DEFAULT 0,
      labels TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Migration: Add missing columns to gmail_amazon_de_threads
  try {
    await sql`ALTER TABLE gmail_amazon_de_threads ADD COLUMN IF NOT EXISTS marketplace VARCHAR(10)`;
    await sql`ALTER TABLE gmail_amazon_de_threads ADD COLUMN IF NOT EXISTS from_email VARCHAR(255)`;
    await sql`ALTER TABLE gmail_amazon_de_threads ADD COLUMN IF NOT EXISTS from_name VARCHAR(255)`;
    await sql`ALTER TABLE gmail_amazon_de_threads ADD COLUMN IF NOT EXISTS order_id VARCHAR(50)`;
    await sql`ALTER TABLE gmail_amazon_de_threads ADD COLUMN IF NOT EXISTS asin VARCHAR(20)`;
    await sql`ALTER TABLE gmail_amazon_de_threads ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open'`;
    await sql`ALTER TABLE gmail_amazon_de_threads ADD COLUMN IF NOT EXISTS needs_response BOOLEAN DEFAULT true`;
    await sql`ALTER TABLE gmail_amazon_de_threads ADD COLUMN IF NOT EXISTS last_customer_message_at TIMESTAMP`;
    await sql`ALTER TABLE gmail_amazon_de_threads ADD COLUMN IF NOT EXISTS has_seller_reply BOOLEAN DEFAULT false`;
  } catch (e) {
    console.log('Migration columns already exist or error:', e.message);
  }

  // Gmail Amazon DE messages
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_amazon_de_messages (
      id VARCHAR(100) PRIMARY KEY,
      thread_id VARCHAR(100) REFERENCES gmail_amazon_de_threads(id) ON DELETE CASCADE,
      from_email VARCHAR(255),
      from_name VARCHAR(255),
      to_email VARCHAR(255),
      subject TEXT,
      body_text TEXT,
      body_html TEXT,
      sent_at TIMESTAMP,
      is_outgoing BOOLEAN DEFAULT false,
      has_attachments BOOLEAN DEFAULT false,
      attachments JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Migration: Add missing columns to gmail_amazon_de_messages
  try {
    await sql`ALTER TABLE gmail_amazon_de_messages ADD COLUMN IF NOT EXISTS from_email VARCHAR(255)`;
    await sql`ALTER TABLE gmail_amazon_de_messages ADD COLUMN IF NOT EXISTS from_name VARCHAR(255)`;
    await sql`ALTER TABLE gmail_amazon_de_messages ADD COLUMN IF NOT EXISTS is_outgoing BOOLEAN DEFAULT false`;
  } catch (e) {
    console.log('Migration messages columns already exist or error:', e.message);
  }

  // Gmail Amazon DE sync status
  await sql`
    CREATE TABLE IF NOT EXISTS gmail_amazon_de_sync_status (
      id SERIAL PRIMARY KEY,
      last_sync_at TIMESTAMP,
      sync_in_progress BOOLEAN DEFAULT false
    )
  `;

  // Insert default Gmail Amazon DE token row if not exists
  const { rows: gmailAmazonDeTokenRows } = await sql`SELECT COUNT(*) as count FROM gmail_amazon_de_tokens`;
  if (gmailAmazonDeTokenRows[0].count === '0') {
    await sql`INSERT INTO gmail_amazon_de_tokens (id) VALUES (1)`;
  }

  // Insert default Gmail Amazon DE sync status if not exists
  const { rows: gmailAmazonDeSyncRows } = await sql`SELECT COUNT(*) as count FROM gmail_amazon_de_sync_status`;
  if (gmailAmazonDeSyncRows[0].count === '0') {
    await sql`INSERT INTO gmail_amazon_de_sync_status (id) VALUES (1)`;
  }

  // Kaufland tickets table
  await sql`
    CREATE TABLE IF NOT EXISTS kaufland_tickets (
      id VARCHAR(50) PRIMARY KEY,
      ticket_number VARCHAR(50),
      status VARCHAR(20),
      reason VARCHAR(50),
      marketplace VARCHAR(10),
      storefront INTEGER,
      order_id VARCHAR(50),
      buyer_name VARCHAR(255),
      buyer_email VARCHAR(255),
      is_seller_responsible BOOLEAN DEFAULT false,
      topic TEXT,
      opened_at TIMESTAMP,
      updated_at TIMESTAMP,
      unread BOOLEAN DEFAULT true,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Kaufland ticket messages table (no FK constraint to allow messages for unsynced tickets)
  await sql`
    CREATE TABLE IF NOT EXISTS kaufland_messages (
      id VARCHAR(50) PRIMARY KEY,
      ticket_id VARCHAR(50),
      sender VARCHAR(20),
      text TEXT,
      created_at TIMESTAMP,
      is_from_seller BOOLEAN DEFAULT false,
      files JSONB,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Drop FK constraint if exists (for existing databases)
  try {
    await sql`ALTER TABLE kaufland_messages DROP CONSTRAINT IF EXISTS kaufland_messages_ticket_id_fkey`;
  } catch (e) {
    // Constraint might not exist, ignore
  }

  // Kaufland sync status table
  await sql`
    CREATE TABLE IF NOT EXISTS kaufland_sync_status (
      id SERIAL PRIMARY KEY,
      last_sync_at TIMESTAMP,
      sync_in_progress BOOLEAN DEFAULT false
    )
  `;

  // Insert default Kaufland sync status if not exists
  const { rows: kauflandSyncRows } = await sql`SELECT COUNT(*) as count FROM kaufland_sync_status`;
  if (kauflandSyncRows[0].count === '0') {
    await sql`INSERT INTO kaufland_sync_status (id) VALUES (1)`;
  }

  // Weather data table
  await sql`
    CREATE TABLE IF NOT EXISTS weather (
      id SERIAL PRIMARY KEY,
      country_code VARCHAR(2) NOT NULL,
      country_name VARCHAR(50) NOT NULL,
      city VARCHAR(100) NOT NULL,
      temperature DECIMAL(4,1),
      weather_code INTEGER,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(country_code)
    )
  `;

  // Weather forecast table
  await sql`
    CREATE TABLE IF NOT EXISTS weather_forecast (
      id SERIAL PRIMARY KEY,
      country_code VARCHAR(2) NOT NULL,
      forecast_date DATE NOT NULL,
      temp_max DECIMAL(4,1),
      temp_min DECIMAL(4,1),
      weather_code INTEGER,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(country_code, forecast_date)
    )
  `;

  // Inventory history/changelog table
  await sql`
    CREATE TABLE IF NOT EXISTS inventory_history (
      id SERIAL PRIMARY KEY,
      inventory_id INTEGER,
      sku VARCHAR(100),
      nazwa VARCHAR(255),
      kategoria VARCHAR(50),
      action_type VARCHAR(20) NOT NULL,
      field_changed VARCHAR(50),
      old_value TEXT,
      new_value TEXT,
      user_id INTEGER,
      username VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Insert default Allegro Meblebox token row if not exists
  const { rows: allegroMebleboxTokenRows } = await sql`SELECT COUNT(*) as count FROM allegro_meblebox_tokens`;
  if (allegroMebleboxTokenRows[0].count === '0') {
    await sql`INSERT INTO allegro_meblebox_tokens (id) VALUES (1)`;
  }

  // Insert default Allegro Meblebox sync status if not exists
  const { rows: allegroMebleboxSyncRows } = await sql`SELECT COUNT(*) as count FROM allegro_meblebox_sync_status`;
  if (allegroMebleboxSyncRows[0].count === '0') {
    await sql`INSERT INTO allegro_meblebox_sync_status (id) VALUES (1)`;
  }

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

// Check if we have any Baselinker orders (to determine if first sync)
export async function getBaselinkerOrderCount() {
  const { rows } = await sql`SELECT COUNT(*) as count FROM orders WHERE id LIKE 'BL-%'`;
  return parseInt(rows[0]?.count || '0');
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

// ============== User Management Functions ==============

// Create a new user
export async function createUser(username, password, role = 'user', permissions = null) {
  const passwordHash = await bcrypt.hash(password, 10);

  // Default permissions based on role
  const defaultAdminPermissions = ['dashboard', 'oms', 'wms', 'mes', 'mts', 'crm', 'crm-eu', 'rank', 'agent', 'admin'];
  const defaultUserPermissions = ['dashboard', 'oms', 'wms', 'mes', 'mts', 'crm', 'crm-eu', 'rank', 'agent'];
  const userPermissions = permissions || (role === 'admin' ? defaultAdminPermissions : defaultUserPermissions);
  const permissionsJson = JSON.stringify(userPermissions);

  const { rows } = await sql`
    INSERT INTO users (username, password_hash, role, permissions)
    VALUES (${username}, ${passwordHash}, ${role}, ${permissionsJson}::jsonb)
    ON CONFLICT (username) DO UPDATE SET
      password_hash = ${passwordHash},
      role = ${role},
      permissions = ${permissionsJson}::jsonb
    RETURNING id, username, role, permissions, created_at
  `;

  return rows[0];
}

// Verify user credentials
export async function verifyUser(username, password) {
  const { rows } = await sql`
    SELECT id, username, password_hash, role, permissions
    FROM users
    WHERE username = ${username}
  `;

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return null;
  }

  // Update last login
  await sql`
    UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ${user.id}
  `;

  // Default permissions for admin
  const defaultAdminPermissions = ['dashboard', 'oms', 'wms', 'mes', 'mts', 'crm', 'crm-eu', 'rank', 'agent', 'admin'];
  const defaultUserPermissions = ['dashboard', 'oms', 'wms', 'mes', 'mts', 'crm', 'crm-eu', 'rank', 'agent'];

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    permissions: user.permissions || (user.role === 'admin' ? defaultAdminPermissions : defaultUserPermissions)
  };
}

// Get all users
export async function getUsers() {
  const { rows } = await sql`
    SELECT id, username, role, created_at, last_login
    FROM users
    ORDER BY created_at DESC
  `;
  return rows;
}

// Delete user
export async function deleteUser(id) {
  await sql`DELETE FROM users WHERE id = ${id}`;
}

// Change user password
export async function changeUserPassword(id, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await sql`
    UPDATE users SET password_hash = ${passwordHash} WHERE id = ${id}
  `;
}

// ========== ALLEGRO FUNCTIONS ==========

// Get Allegro tokens
export async function getAllegroTokens() {
  const { rows } = await sql`SELECT * FROM allegro_tokens WHERE id = 1`;
  return rows[0] || null;
}

// Save Allegro tokens
export async function saveAllegroTokens(accessToken, refreshToken, expiresAt, userId = null) {
  await sql`
    UPDATE allegro_tokens
    SET access_token = ${accessToken},
        refresh_token = ${refreshToken},
        expires_at = ${expiresAt},
        user_id = ${userId},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Get Allegro sync status
export async function getAllegroSyncStatus() {
  const { rows } = await sql`SELECT * FROM allegro_sync_status WHERE id = 1`;
  return rows[0] || null;
}

// Update Allegro sync status
export async function updateAllegroSyncStatus(field = 'last_sync_at') {
  if (field === 'last_thread_sync_at') {
    await sql`UPDATE allegro_sync_status SET last_thread_sync_at = CURRENT_TIMESTAMP WHERE id = 1`;
  } else {
    await sql`UPDATE allegro_sync_status SET last_sync_at = CURRENT_TIMESTAMP WHERE id = 1`;
  }
}

// Set Allegro sync in progress
export async function setAllegroSyncInProgress(inProgress) {
  await sql`UPDATE allegro_sync_status SET sync_in_progress = ${inProgress} WHERE id = 1`;
}

// Save or update Allegro thread
export async function saveAllegroThread(thread) {
  await sql`
    INSERT INTO allegro_threads (
      id, interlocutor_id, interlocutor_login, interlocutor_name,
      interlocutor_avatar, interlocutor_company, last_message_at,
      read, offer_id, offer_title, order_id, messages_count, updated_at
    ) VALUES (
      ${thread.id},
      ${thread.interlocutor?.id || null},
      ${thread.interlocutor?.login || null},
      ${thread.interlocutor?.name || null},
      ${thread.interlocutor?.avatarUrl || null},
      ${thread.interlocutor?.isCompany || false},
      ${thread.lastMessageDateTime ? new Date(thread.lastMessageDateTime) : null},
      ${thread.read || false},
      ${thread.offer?.id || null},
      ${thread.offer?.name || null},
      ${thread.order?.id || null},
      ${thread.messagesCount || 0},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      interlocutor_id = EXCLUDED.interlocutor_id,
      interlocutor_login = EXCLUDED.interlocutor_login,
      interlocutor_name = EXCLUDED.interlocutor_name,
      interlocutor_avatar = EXCLUDED.interlocutor_avatar,
      interlocutor_company = EXCLUDED.interlocutor_company,
      last_message_at = EXCLUDED.last_message_at,
      read = EXCLUDED.read,
      offer_id = EXCLUDED.offer_id,
      offer_title = EXCLUDED.offer_title,
      order_id = EXCLUDED.order_id,
      messages_count = EXCLUDED.messages_count,
      updated_at = CURRENT_TIMESTAMP
  `;
}

// Save Allegro message
export async function saveAllegroMessage(message, threadId) {
  await sql`
    INSERT INTO allegro_messages (
      id, thread_id, sender_id, sender_login, sender_is_interlocutor,
      text, sent_at, has_attachments, attachments, created_at
    ) VALUES (
      ${message.id},
      ${threadId},
      ${message.author?.id || null},
      ${message.author?.login || null},
      ${message.author?.isInterlocutor || false},
      ${message.text || ''},
      ${message.createdAt ? new Date(message.createdAt) : null},
      ${message.hasAdditionalAttachments || false},
      ${JSON.stringify(message.attachments || [])},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      text = EXCLUDED.text,
      has_attachments = EXCLUDED.has_attachments,
      attachments = EXCLUDED.attachments
  `;

  // If message has related order, update thread with order_id
  const orderId = message.relatesTo?.order?.id;
  const offerId = message.relatesTo?.offer?.id;

  if (orderId || offerId) {
    await sql`
      UPDATE allegro_threads
      SET
        order_id = COALESCE(${orderId}, order_id),
        offer_id = COALESCE(${offerId}, offer_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${threadId}
    `;
  }
}

// Get Allegro threads with pagination
export async function getAllegroThreads(page = 1, perPage = 20, unreadOnly = false) {
  const offset = (page - 1) * perPage;

  let result, countResult;

  if (unreadOnly) {
    result = await sql`
      SELECT
        t.*,
        o.id as apilo_order_id,
        o.total_gross as order_total,
        o.currency as order_currency,
        o.ordered_at as order_date,
        o.payment_status as order_payment_status,
        o.items as order_items,
        o.customer as order_customer
      FROM allegro_threads t
      LEFT JOIN orders o ON o.external_id = t.order_id
      WHERE t.read = false
      ORDER BY t.last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM allegro_threads WHERE read = false`;
  } else {
    result = await sql`
      SELECT
        t.*,
        o.id as apilo_order_id,
        o.total_gross as order_total,
        o.currency as order_currency,
        o.ordered_at as order_date,
        o.payment_status as order_payment_status,
        o.items as order_items,
        o.customer as order_customer
      FROM allegro_threads t
      LEFT JOIN orders o ON o.external_id = t.order_id
      ORDER BY t.last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM allegro_threads`;
  }

  return {
    threads: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    perPage,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / perPage)
  };
}

// Get single Allegro thread with messages
export async function getAllegroThread(threadId) {
  const threadResult = await sql`
    SELECT
      t.*,
      o.id as apilo_order_id,
      o.total_gross as order_total,
      o.currency as order_currency,
      o.ordered_at as order_date,
      o.payment_status as order_payment_status,
      o.items as order_items,
      o.customer as order_customer
    FROM allegro_threads t
    LEFT JOIN orders o ON o.external_id = t.order_id
    WHERE t.id = ${threadId}
  `;
  if (threadResult.rows.length === 0) return null;

  const messagesResult = await sql`
    SELECT * FROM allegro_messages
    WHERE thread_id = ${threadId}
    ORDER BY sent_at ASC
  `;

  return {
    thread: threadResult.rows[0],
    messages: messagesResult.rows
  };
}

// Mark thread as read
export async function markAllegroThreadAsRead(threadId) {
  await sql`UPDATE allegro_threads SET read = true, updated_at = CURRENT_TIMESTAMP WHERE id = ${threadId}`;
}

// Get unread threads count
export async function getUnreadAllegroThreadsCount() {
  const { rows } = await sql`SELECT COUNT(*) as count FROM allegro_threads WHERE read = false`;
  return parseInt(rows[0].count);
}

// ========== ALLEGRO MEBLEBOX FUNCTIONS ==========

// Get Allegro Meblebox tokens
export async function getAllegroMebleboxTokens() {
  const { rows } = await sql`SELECT * FROM allegro_meblebox_tokens WHERE id = 1`;
  return rows[0] || null;
}

// Save Allegro Meblebox tokens
export async function saveAllegroMebleboxTokens(accessToken, refreshToken, expiresAt, userId = null) {
  await sql`
    UPDATE allegro_meblebox_tokens
    SET access_token = ${accessToken},
        refresh_token = ${refreshToken},
        expires_at = ${expiresAt},
        user_id = ${userId},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Get Allegro Meblebox sync status
export async function getAllegroMebleboxSyncStatus() {
  const { rows } = await sql`SELECT * FROM allegro_meblebox_sync_status WHERE id = 1`;
  return rows[0] || null;
}

// Update Allegro Meblebox sync status
export async function updateAllegroMebleboxSyncStatus(field = 'last_sync_at') {
  if (field === 'last_thread_sync_at') {
    await sql`UPDATE allegro_meblebox_sync_status SET last_thread_sync_at = CURRENT_TIMESTAMP WHERE id = 1`;
  } else {
    await sql`UPDATE allegro_meblebox_sync_status SET last_sync_at = CURRENT_TIMESTAMP WHERE id = 1`;
  }
}

// Set Allegro Meblebox sync in progress
export async function setAllegroMebleboxSyncInProgress(inProgress) {
  await sql`UPDATE allegro_meblebox_sync_status SET sync_in_progress = ${inProgress} WHERE id = 1`;
}

// Save or update Allegro Meblebox thread
export async function saveAllegroMebleboxThread(thread) {
  await sql`
    INSERT INTO allegro_meblebox_threads (
      id, interlocutor_id, interlocutor_login, interlocutor_name,
      interlocutor_avatar, interlocutor_company, last_message_at,
      read, offer_id, offer_title, order_id, messages_count, updated_at
    ) VALUES (
      ${thread.id},
      ${thread.interlocutor?.id || null},
      ${thread.interlocutor?.login || null},
      ${thread.interlocutor?.name || null},
      ${thread.interlocutor?.avatarUrl || null},
      ${thread.interlocutor?.isCompany || false},
      ${thread.lastMessageDateTime ? new Date(thread.lastMessageDateTime) : null},
      ${thread.read || false},
      ${thread.offer?.id || null},
      ${thread.offer?.name || null},
      ${thread.order?.id || null},
      ${thread.messagesCount || 0},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      interlocutor_id = EXCLUDED.interlocutor_id,
      interlocutor_login = EXCLUDED.interlocutor_login,
      interlocutor_name = EXCLUDED.interlocutor_name,
      interlocutor_avatar = EXCLUDED.interlocutor_avatar,
      interlocutor_company = EXCLUDED.interlocutor_company,
      last_message_at = EXCLUDED.last_message_at,
      read = EXCLUDED.read,
      offer_id = EXCLUDED.offer_id,
      offer_title = EXCLUDED.offer_title,
      order_id = EXCLUDED.order_id,
      messages_count = EXCLUDED.messages_count,
      updated_at = CURRENT_TIMESTAMP
  `;
}

// Save Allegro Meblebox message
export async function saveAllegroMebleboxMessage(message, threadId) {
  await sql`
    INSERT INTO allegro_meblebox_messages (
      id, thread_id, sender_id, sender_login, sender_is_interlocutor,
      text, sent_at, has_attachments, attachments, created_at
    ) VALUES (
      ${message.id},
      ${threadId},
      ${message.author?.id || null},
      ${message.author?.login || null},
      ${message.author?.isInterlocutor || false},
      ${message.text || ''},
      ${message.createdAt ? new Date(message.createdAt) : null},
      ${message.hasAdditionalAttachments || false},
      ${JSON.stringify(message.attachments || [])},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      text = EXCLUDED.text,
      has_attachments = EXCLUDED.has_attachments,
      attachments = EXCLUDED.attachments
  `;

  // If message has related order, update thread with order_id
  const orderId = message.relatesTo?.order?.id;
  const offerId = message.relatesTo?.offer?.id;

  if (orderId || offerId) {
    await sql`
      UPDATE allegro_meblebox_threads
      SET
        order_id = COALESCE(${orderId}, order_id),
        offer_id = COALESCE(${offerId}, offer_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${threadId}
    `;
  }
}

// Get Allegro Meblebox threads with pagination
export async function getAllegroMebleboxThreads(page = 1, perPage = 20, unreadOnly = false) {
  const offset = (page - 1) * perPage;

  let result, countResult;

  if (unreadOnly) {
    result = await sql`
      SELECT
        t.*,
        o.id as apilo_order_id,
        o.total_gross as order_total,
        o.currency as order_currency,
        o.ordered_at as order_date,
        o.payment_status as order_payment_status,
        o.items as order_items,
        o.customer as order_customer
      FROM allegro_meblebox_threads t
      LEFT JOIN orders o ON o.external_id = t.order_id
      WHERE t.read = false
      ORDER BY t.last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM allegro_meblebox_threads WHERE read = false`;
  } else {
    result = await sql`
      SELECT
        t.*,
        o.id as apilo_order_id,
        o.total_gross as order_total,
        o.currency as order_currency,
        o.ordered_at as order_date,
        o.payment_status as order_payment_status,
        o.items as order_items,
        o.customer as order_customer
      FROM allegro_meblebox_threads t
      LEFT JOIN orders o ON o.external_id = t.order_id
      ORDER BY t.last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM allegro_meblebox_threads`;
  }

  return {
    threads: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    perPage,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / perPage)
  };
}

// Get single Allegro Meblebox thread with messages
export async function getAllegroMebleboxThread(threadId) {
  const threadResult = await sql`
    SELECT
      t.*,
      o.id as apilo_order_id,
      o.total_gross as order_total,
      o.currency as order_currency,
      o.ordered_at as order_date,
      o.payment_status as order_payment_status,
      o.items as order_items,
      o.customer as order_customer
    FROM allegro_meblebox_threads t
    LEFT JOIN orders o ON o.external_id = t.order_id
    WHERE t.id = ${threadId}
  `;
  if (threadResult.rows.length === 0) return null;

  const messagesResult = await sql`
    SELECT * FROM allegro_meblebox_messages
    WHERE thread_id = ${threadId}
    ORDER BY sent_at ASC
  `;

  return {
    thread: threadResult.rows[0],
    messages: messagesResult.rows
  };
}

// Mark Meblebox thread as read
export async function markAllegroMebleboxThreadAsRead(threadId) {
  await sql`UPDATE allegro_meblebox_threads SET read = true, updated_at = CURRENT_TIMESTAMP WHERE id = ${threadId}`;
}

// Get unread Meblebox threads count
export async function getUnreadAllegroMebleboxThreadsCount() {
  const { rows } = await sql`SELECT COUNT(*) as count FROM allegro_meblebox_threads WHERE read = false`;
  return parseInt(rows[0].count);
}

// ========== GMAIL (Shopify Dobrelegowiska) FUNCTIONS ==========

// Get Gmail tokens
export async function getGmailTokens() {
  const { rows } = await sql`SELECT * FROM gmail_tokens WHERE id = 1`;
  return rows[0] || null;
}

// Save Gmail tokens
export async function saveGmailTokens(accessToken, refreshToken, expiresAt, email = null) {
  await sql`
    UPDATE gmail_tokens
    SET access_token = ${accessToken},
        refresh_token = ${refreshToken},
        expires_at = ${expiresAt},
        email = COALESCE(${email}, email),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Clear Gmail tokens (logout)
export async function clearGmailTokens() {
  await sql`
    UPDATE gmail_tokens
    SET access_token = NULL,
        refresh_token = NULL,
        expires_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Get Gmail sync status
export async function getGmailSyncStatus() {
  const { rows } = await sql`SELECT * FROM gmail_sync_status WHERE id = 1`;
  return rows[0] || null;
}

// Update Gmail sync status
export async function updateGmailSyncStatus() {
  await sql`UPDATE gmail_sync_status SET last_sync_at = CURRENT_TIMESTAMP WHERE id = 1`;
}

// Set Gmail sync in progress
export async function setGmailSyncInProgress(inProgress) {
  await sql`UPDATE gmail_sync_status SET sync_in_progress = ${inProgress} WHERE id = 1`;
}

// Save Gmail thread
export async function saveGmailThread(thread) {
  await sql`
    INSERT INTO gmail_threads (
      id, subject, snippet, from_email, from_name,
      last_message_at, unread, messages_count, labels, updated_at
    ) VALUES (
      ${thread.id},
      ${thread.subject || ''},
      ${thread.snippet || ''},
      ${thread.fromEmail || ''},
      ${thread.fromName || ''},
      ${thread.lastMessageAt ? new Date(parseInt(thread.lastMessageAt)) : null},
      ${thread.unread ?? true},
      ${thread.messagesCount || 0},
      ${JSON.stringify(thread.labels || [])},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      subject = EXCLUDED.subject,
      snippet = EXCLUDED.snippet,
      from_email = EXCLUDED.from_email,
      from_name = EXCLUDED.from_name,
      last_message_at = EXCLUDED.last_message_at,
      unread = EXCLUDED.unread,
      messages_count = EXCLUDED.messages_count,
      labels = EXCLUDED.labels,
      updated_at = CURRENT_TIMESTAMP
  `;
}

// Save Gmail message
export async function saveGmailMessage(message, threadId) {
  await sql`
    INSERT INTO gmail_messages (
      id, thread_id, from_email, from_name, to_email,
      subject, body_text, body_html, sent_at, is_outgoing,
      has_attachments, attachments, created_at
    ) VALUES (
      ${message.id},
      ${threadId},
      ${message.fromEmail || ''},
      ${message.fromName || ''},
      ${message.to || ''},
      ${message.subject || ''},
      ${message.bodyText || ''},
      ${message.bodyHtml || ''},
      ${message.sentAt ? new Date(parseInt(message.sentAt)) : null},
      ${message.isOutgoing || false},
      ${message.hasAttachments || false},
      ${JSON.stringify(message.attachments || [])},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      body_text = EXCLUDED.body_text,
      body_html = EXCLUDED.body_html,
      is_outgoing = EXCLUDED.is_outgoing
  `;
}

// Get Gmail threads with pagination
export async function getGmailThreads(page = 1, perPage = 20, unreadOnly = false) {
  const offset = (page - 1) * perPage;

  let result, countResult;

  if (unreadOnly) {
    result = await sql`
      SELECT * FROM gmail_threads
      WHERE unread = true
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM gmail_threads WHERE unread = true`;
  } else {
    result = await sql`
      SELECT * FROM gmail_threads
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM gmail_threads`;
  }

  return {
    threads: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    perPage,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / perPage)
  };
}

// Get single Gmail thread with messages
export async function getGmailThread(threadId) {
  const threadResult = await sql`
    SELECT * FROM gmail_threads WHERE id = ${threadId}
  `;

  if (threadResult.rows.length === 0) {
    return null;
  }

  const messagesResult = await sql`
    SELECT * FROM gmail_messages
    WHERE thread_id = ${threadId}
    ORDER BY sent_at ASC
  `;

  return {
    thread: threadResult.rows[0],
    messages: messagesResult.rows
  };
}

// Mark Gmail thread as read
export async function markGmailThreadAsRead(threadId) {
  await sql`UPDATE gmail_threads SET unread = false, updated_at = CURRENT_TIMESTAMP WHERE id = ${threadId}`;
}

// Get unread Gmail threads count
export async function getUnreadGmailThreadsCount() {
  const { rows } = await sql`SELECT COUNT(*) as count FROM gmail_threads WHERE unread = true`;
  return parseInt(rows[0].count);
}

// Weather operations
export async function saveWeather(countryCode, countryName, city, temperature, weatherCode) {
  await sql`
    INSERT INTO weather (country_code, country_name, city, temperature, weather_code, updated_at)
    VALUES (${countryCode}, ${countryName}, ${city}, ${temperature}, ${weatherCode}, CURRENT_TIMESTAMP)
    ON CONFLICT (country_code) DO UPDATE SET
      temperature = ${temperature},
      weather_code = ${weatherCode},
      updated_at = CURRENT_TIMESTAMP
  `;
}

export async function getWeather() {
  const { rows } = await sql`SELECT * FROM weather ORDER BY country_name`;
  return rows;
}

// Weather forecast operations
export async function saveWeatherForecast(countryCode, forecastDate, tempMax, tempMin, weatherCode) {
  await sql`
    INSERT INTO weather_forecast (country_code, forecast_date, temp_max, temp_min, weather_code, updated_at)
    VALUES (${countryCode}, ${forecastDate}, ${tempMax}, ${tempMin}, ${weatherCode}, CURRENT_TIMESTAMP)
    ON CONFLICT (country_code, forecast_date) DO UPDATE SET
      temp_max = ${tempMax},
      temp_min = ${tempMin},
      weather_code = ${weatherCode},
      updated_at = CURRENT_TIMESTAMP
  `;
}

export async function getWeatherForecast() {
  const { rows } = await sql`
    SELECT * FROM weather_forecast
    WHERE forecast_date >= CURRENT_DATE
    ORDER BY forecast_date, country_code
  `;
  return rows;
}

// ========== INVENTORY HISTORY FUNCTIONS ==========

// Log inventory change
export async function logInventoryChange({
  inventoryId,
  sku,
  nazwa,
  kategoria,
  actionType,
  fieldChanged = null,
  oldValue = null,
  newValue = null,
  userId = null,
  username = null
}) {
  await sql`
    INSERT INTO inventory_history (
      inventory_id, sku, nazwa, kategoria, action_type,
      field_changed, old_value, new_value, user_id, username, created_at
    ) VALUES (
      ${inventoryId}, ${sku}, ${nazwa}, ${kategoria}, ${actionType},
      ${fieldChanged}, ${oldValue}, ${newValue}, ${userId}, ${username}, CURRENT_TIMESTAMP
    )
  `;
}

// Get inventory history with pagination and filters
export async function getInventoryHistory(page = 1, perPage = 50, filters = {}) {
  const offset = (page - 1) * perPage;
  const { username, actionType, sku, dateFrom, dateTo } = filters;

  let whereConditions = [];
  let params = [];

  // Build WHERE conditions based on filters
  let query = `SELECT * FROM inventory_history WHERE 1=1`;
  let countQuery = `SELECT COUNT(*) as total FROM inventory_history WHERE 1=1`;

  if (username) {
    query += ` AND username = $${params.length + 1}`;
    countQuery += ` AND username = $${params.length + 1}`;
    params.push(username);
  }

  if (actionType) {
    query += ` AND action_type = $${params.length + 1}`;
    countQuery += ` AND action_type = $${params.length + 1}`;
    params.push(actionType);
  }

  if (sku) {
    query += ` AND sku ILIKE $${params.length + 1}`;
    countQuery += ` AND sku ILIKE $${params.length + 1}`;
    params.push(`%${sku}%`);
  }

  if (dateFrom) {
    query += ` AND created_at >= $${params.length + 1}`;
    countQuery += ` AND created_at >= $${params.length + 1}`;
    params.push(dateFrom);
  }

  if (dateTo) {
    query += ` AND created_at <= $${params.length + 1}`;
    countQuery += ` AND created_at <= $${params.length + 1}`;
    params.push(dateTo);
  }

  query += ` ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`;

  // Use raw query with parameters
  let result, countResult;

  if (params.length === 0) {
    result = await sql`
      SELECT * FROM inventory_history
      ORDER BY created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM inventory_history`;
  } else if (username && !actionType && !sku && !dateFrom && !dateTo) {
    result = await sql`
      SELECT * FROM inventory_history
      WHERE username = ${username}
      ORDER BY created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM inventory_history WHERE username = ${username}`;
  } else if (actionType && !username && !sku && !dateFrom && !dateTo) {
    result = await sql`
      SELECT * FROM inventory_history
      WHERE action_type = ${actionType}
      ORDER BY created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM inventory_history WHERE action_type = ${actionType}`;
  } else if (sku && !username && !actionType && !dateFrom && !dateTo) {
    const skuPattern = `%${sku}%`;
    result = await sql`
      SELECT * FROM inventory_history
      WHERE sku ILIKE ${skuPattern}
      ORDER BY created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM inventory_history WHERE sku ILIKE ${skuPattern}`;
  } else {
    // For complex queries with multiple filters
    result = await sql`
      SELECT * FROM inventory_history
      WHERE (${username}::text IS NULL OR username = ${username})
        AND (${actionType}::text IS NULL OR action_type = ${actionType})
        AND (${sku}::text IS NULL OR sku ILIKE ${'%' + (sku || '') + '%'})
        AND (${dateFrom}::timestamp IS NULL OR created_at >= ${dateFrom})
        AND (${dateTo}::timestamp IS NULL OR created_at <= ${dateTo})
      ORDER BY created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`
      SELECT COUNT(*) as total FROM inventory_history
      WHERE (${username}::text IS NULL OR username = ${username})
        AND (${actionType}::text IS NULL OR action_type = ${actionType})
        AND (${sku}::text IS NULL OR sku ILIKE ${'%' + (sku || '') + '%'})
        AND (${dateFrom}::timestamp IS NULL OR created_at >= ${dateFrom})
        AND (${dateTo}::timestamp IS NULL OR created_at <= ${dateTo})
    `;
  }

  const total = parseInt(countResult.rows[0].total);

  return {
    history: result.rows,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage)
    }
  };
}

// Get unique users who made changes
export async function getInventoryHistoryUsers() {
  const { rows } = await sql`
    SELECT DISTINCT username
    FROM inventory_history
    WHERE username IS NOT NULL
    ORDER BY username
  `;
  return rows.map(r => r.username);
}

// Get inventory history statistics
export async function getInventoryHistoryStats() {
  const { rows } = await sql`
    SELECT
      action_type,
      COUNT(*) as count
    FROM inventory_history
    GROUP BY action_type
    ORDER BY count DESC
  `;
  return rows;
}

// ========== GMAIL POOMKIDS FUNCTIONS ==========

// Get Gmail POOMKIDS tokens
export async function getGmailPoomkidsTokens() {
  const { rows } = await sql`SELECT * FROM gmail_poomkids_tokens WHERE id = 1`;
  return rows[0] || null;
}

// Save Gmail POOMKIDS tokens
export async function saveGmailPoomkidsTokens(accessToken, refreshToken, expiresAt, email = null) {
  await sql`
    UPDATE gmail_poomkids_tokens
    SET access_token = ${accessToken},
        refresh_token = ${refreshToken},
        expires_at = ${expiresAt},
        email = COALESCE(${email}, email),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Clear Gmail POOMKIDS tokens (logout)
export async function clearGmailPoomkidsTokens() {
  await sql`
    UPDATE gmail_poomkids_tokens
    SET access_token = NULL,
        refresh_token = NULL,
        expires_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Get Gmail POOMKIDS sync status
export async function getGmailPoomkidsSyncStatus() {
  const { rows } = await sql`SELECT * FROM gmail_poomkids_sync_status WHERE id = 1`;
  return rows[0] || null;
}

// Update Gmail POOMKIDS sync status
export async function updateGmailPoomkidsSyncStatus() {
  await sql`UPDATE gmail_poomkids_sync_status SET last_sync_at = CURRENT_TIMESTAMP WHERE id = 1`;
}

// Set Gmail POOMKIDS sync in progress
export async function setGmailPoomkidsSyncInProgress(inProgress) {
  await sql`UPDATE gmail_poomkids_sync_status SET sync_in_progress = ${inProgress} WHERE id = 1`;
}

// Save Gmail POOMKIDS thread
export async function saveGmailPoomkidsThread(thread) {
  await sql`
    INSERT INTO gmail_poomkids_threads (
      id, subject, snippet, from_email, from_name,
      last_message_at, unread, messages_count, labels, updated_at
    ) VALUES (
      ${thread.id},
      ${thread.subject || ''},
      ${thread.snippet || ''},
      ${thread.fromEmail || ''},
      ${thread.fromName || ''},
      ${thread.lastMessageAt ? new Date(parseInt(thread.lastMessageAt)) : null},
      ${thread.unread ?? true},
      ${thread.messagesCount || 0},
      ${JSON.stringify(thread.labels || [])},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      subject = EXCLUDED.subject,
      snippet = EXCLUDED.snippet,
      from_email = EXCLUDED.from_email,
      from_name = EXCLUDED.from_name,
      last_message_at = EXCLUDED.last_message_at,
      unread = EXCLUDED.unread,
      messages_count = EXCLUDED.messages_count,
      labels = EXCLUDED.labels,
      updated_at = CURRENT_TIMESTAMP
  `;
}

// Save Gmail POOMKIDS message
export async function saveGmailPoomkidsMessage(message, threadId) {
  await sql`
    INSERT INTO gmail_poomkids_messages (
      id, thread_id, from_email, from_name, to_email,
      subject, body_text, body_html, sent_at, is_outgoing,
      has_attachments, attachments, created_at
    ) VALUES (
      ${message.id},
      ${threadId},
      ${message.fromEmail || ''},
      ${message.fromName || ''},
      ${message.to || ''},
      ${message.subject || ''},
      ${message.bodyText || ''},
      ${message.bodyHtml || ''},
      ${message.sentAt ? new Date(parseInt(message.sentAt)) : null},
      ${message.isOutgoing || false},
      ${message.hasAttachments || false},
      ${JSON.stringify(message.attachments || [])},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      body_text = EXCLUDED.body_text,
      body_html = EXCLUDED.body_html,
      is_outgoing = EXCLUDED.is_outgoing
  `;
}

// Get Gmail POOMKIDS threads with pagination
export async function getGmailPoomkidsThreads(page = 1, perPage = 20, unreadOnly = false) {
  const offset = (page - 1) * perPage;

  let result, countResult;

  if (unreadOnly) {
    result = await sql`
      SELECT * FROM gmail_poomkids_threads
      WHERE unread = true
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM gmail_poomkids_threads WHERE unread = true`;
  } else {
    result = await sql`
      SELECT * FROM gmail_poomkids_threads
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM gmail_poomkids_threads`;
  }

  return {
    threads: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    perPage,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / perPage)
  };
}

// Get single Gmail POOMKIDS thread with messages
export async function getGmailPoomkidsThread(threadId) {
  const threadResult = await sql`
    SELECT * FROM gmail_poomkids_threads WHERE id = ${threadId}
  `;

  if (threadResult.rows.length === 0) {
    return null;
  }

  const messagesResult = await sql`
    SELECT * FROM gmail_poomkids_messages
    WHERE thread_id = ${threadId}
    ORDER BY sent_at ASC
  `;

  return {
    thread: threadResult.rows[0],
    messages: messagesResult.rows
  };
}

// Mark Gmail POOMKIDS thread as read
export async function markGmailPoomkidsThreadAsRead(threadId) {
  await sql`UPDATE gmail_poomkids_threads SET unread = false, updated_at = CURRENT_TIMESTAMP WHERE id = ${threadId}`;
}

// Get unread Gmail POOMKIDS threads count
export async function getUnreadGmailPoomkidsThreadsCount() {
  const { rows } = await sql`SELECT COUNT(*) as count FROM gmail_poomkids_threads WHERE unread = true`;
  return parseInt(rows[0].count);
}

// ========== GMAIL ALLEPODUSZKI FUNCTIONS ==========

// Get Gmail Allepoduszki tokens
export async function getGmailAllepoduszkiTokens() {
  const { rows } = await sql`SELECT * FROM gmail_allepoduszki_tokens WHERE id = 1`;
  return rows[0] || null;
}

// Save Gmail Allepoduszki tokens
export async function saveGmailAllepoduszkiTokens(accessToken, refreshToken, expiresAt, email = null) {
  await sql`
    UPDATE gmail_allepoduszki_tokens
    SET access_token = ${accessToken},
        refresh_token = ${refreshToken},
        expires_at = ${expiresAt},
        email = COALESCE(${email}, email),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Clear Gmail Allepoduszki tokens (logout)
export async function clearGmailAllepoduszkiTokens() {
  await sql`
    UPDATE gmail_allepoduszki_tokens
    SET access_token = NULL,
        refresh_token = NULL,
        expires_at = NULL,
        email = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Get Gmail Allepoduszki sync status
export async function getGmailAllepoduszkiSyncStatus() {
  const { rows } = await sql`SELECT * FROM gmail_allepoduszki_sync_status WHERE id = 1`;
  return rows[0] || null;
}

// Update Gmail Allepoduszki sync status
export async function updateGmailAllepoduszkiSyncStatus() {
  await sql`UPDATE gmail_allepoduszki_sync_status SET last_sync_at = CURRENT_TIMESTAMP WHERE id = 1`;
}

// Set Gmail Allepoduszki sync in progress
export async function setGmailAllepoduszkiSyncInProgress(inProgress) {
  await sql`UPDATE gmail_allepoduszki_sync_status SET sync_in_progress = ${inProgress} WHERE id = 1`;
}

// Save Gmail Allepoduszki thread
export async function saveGmailAllepoduszkiThread(thread) {
  await sql`
    INSERT INTO gmail_allepoduszki_threads (
      id, subject, snippet, from_email, from_name,
      last_message_at, unread, messages_count, labels, updated_at
    ) VALUES (
      ${thread.id},
      ${thread.subject || ''},
      ${thread.snippet || ''},
      ${thread.fromEmail || ''},
      ${thread.fromName || ''},
      ${thread.lastMessageAt ? new Date(parseInt(thread.lastMessageAt)) : null},
      ${thread.unread ?? true},
      ${thread.messagesCount || 0},
      ${JSON.stringify(thread.labels || [])},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      subject = EXCLUDED.subject,
      snippet = EXCLUDED.snippet,
      from_email = EXCLUDED.from_email,
      from_name = EXCLUDED.from_name,
      last_message_at = EXCLUDED.last_message_at,
      unread = EXCLUDED.unread,
      messages_count = EXCLUDED.messages_count,
      labels = EXCLUDED.labels,
      updated_at = CURRENT_TIMESTAMP
  `;
}

// Save Gmail Allepoduszki message
export async function saveGmailAllepoduszkiMessage(message, threadId) {
  await sql`
    INSERT INTO gmail_allepoduszki_messages (
      id, thread_id, from_email, from_name, to_email,
      subject, body_text, body_html, sent_at, is_outgoing,
      has_attachments, attachments, created_at
    ) VALUES (
      ${message.id},
      ${threadId},
      ${message.fromEmail || ''},
      ${message.fromName || ''},
      ${message.to || ''},
      ${message.subject || ''},
      ${message.bodyText || ''},
      ${message.bodyHtml || ''},
      ${message.sentAt ? new Date(parseInt(message.sentAt)) : null},
      ${message.isOutgoing || false},
      ${message.hasAttachments || false},
      ${JSON.stringify(message.attachments || [])},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      body_text = EXCLUDED.body_text,
      body_html = EXCLUDED.body_html,
      is_outgoing = EXCLUDED.is_outgoing
  `;
}

// Get Gmail Allepoduszki threads with pagination
export async function getGmailAllepoduszkiThreads(page = 1, perPage = 20, unreadOnly = false) {
  const offset = (page - 1) * perPage;

  let result, countResult;

  if (unreadOnly) {
    result = await sql`
      SELECT * FROM gmail_allepoduszki_threads
      WHERE unread = true
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM gmail_allepoduszki_threads WHERE unread = true`;
  } else {
    result = await sql`
      SELECT * FROM gmail_allepoduszki_threads
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM gmail_allepoduszki_threads`;
  }

  return {
    threads: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    perPage,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / perPage)
  };
}

// Get single Gmail Allepoduszki thread with messages
export async function getGmailAllepoduszkiThread(threadId) {
  const threadResult = await sql`
    SELECT * FROM gmail_allepoduszki_threads WHERE id = ${threadId}
  `;

  if (threadResult.rows.length === 0) {
    return null;
  }

  const messagesResult = await sql`
    SELECT * FROM gmail_allepoduszki_messages
    WHERE thread_id = ${threadId}
    ORDER BY sent_at ASC
  `;

  return {
    thread: threadResult.rows[0],
    messages: messagesResult.rows
  };
}

// Mark Gmail Allepoduszki thread as read
export async function markGmailAllepoduszkiThreadAsRead(threadId) {
  await sql`UPDATE gmail_allepoduszki_threads SET unread = false, updated_at = CURRENT_TIMESTAMP WHERE id = ${threadId}`;
}

// Get unread Gmail Allepoduszki threads count
export async function getUnreadGmailAllepoduszkiThreadsCount() {
  const { rows } = await sql`SELECT COUNT(*) as count FROM gmail_allepoduszki_threads WHERE unread = true`;
  return parseInt(rows[0].count);
}

// ========== GMAIL POOMFURNITURE (kontakt.poom@gmail.com) FUNCTIONS ==========

// Get Gmail Poomfurniture tokens
export async function getGmailPoomfurnitureTokens() {
  const { rows } = await sql`SELECT * FROM gmail_poomfurniture_tokens WHERE id = 1`;
  return rows[0] || null;
}

// Save Gmail Poomfurniture tokens
export async function saveGmailPoomfurnitureTokens(accessToken, refreshToken, expiresAt, email = null) {
  await sql`
    UPDATE gmail_poomfurniture_tokens
    SET access_token = ${accessToken},
        refresh_token = ${refreshToken},
        expires_at = ${expiresAt},
        email = COALESCE(${email}, email),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Clear Gmail Poomfurniture tokens (logout)
export async function clearGmailPoomfurnitureTokens() {
  await sql`
    UPDATE gmail_poomfurniture_tokens
    SET access_token = NULL,
        refresh_token = NULL,
        expires_at = NULL,
        email = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Get Gmail Poomfurniture sync status
export async function getGmailPoomfurnitureSyncStatus() {
  const { rows } = await sql`SELECT * FROM gmail_poomfurniture_sync_status WHERE id = 1`;
  return rows[0] || null;
}

// Update Gmail Poomfurniture sync status
export async function updateGmailPoomfurnitureSyncStatus() {
  await sql`UPDATE gmail_poomfurniture_sync_status SET last_sync_at = CURRENT_TIMESTAMP WHERE id = 1`;
}

// Set Gmail Poomfurniture sync in progress
export async function setGmailPoomfurnitureSyncInProgress(inProgress) {
  await sql`UPDATE gmail_poomfurniture_sync_status SET sync_in_progress = ${inProgress} WHERE id = 1`;
}

// Save Gmail Poomfurniture thread
export async function saveGmailPoomfurnitureThread(thread) {
  await sql`
    INSERT INTO gmail_poomfurniture_threads (
      id, subject, snippet, from_email, from_name,
      last_message_at, unread, messages_count, labels, updated_at
    ) VALUES (
      ${thread.id},
      ${thread.subject},
      ${thread.snippet},
      ${thread.fromEmail},
      ${thread.fromName},
      ${thread.lastMessageAt ? new Date(parseInt(thread.lastMessageAt)) : null},
      ${thread.unread},
      ${thread.messagesCount},
      ${JSON.stringify(thread.labels || [])},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      subject = EXCLUDED.subject,
      snippet = EXCLUDED.snippet,
      from_email = EXCLUDED.from_email,
      from_name = EXCLUDED.from_name,
      last_message_at = EXCLUDED.last_message_at,
      unread = EXCLUDED.unread,
      messages_count = EXCLUDED.messages_count,
      labels = EXCLUDED.labels,
      updated_at = CURRENT_TIMESTAMP
  `;
}

// Save Gmail Poomfurniture message
export async function saveGmailPoomfurnitureMessage(message, threadId) {
  await sql`
    INSERT INTO gmail_poomfurniture_messages (
      id, thread_id, from_email, from_name, to_email, subject,
      body_text, body_html, sent_at, is_outgoing, has_attachments, attachments
    ) VALUES (
      ${message.id},
      ${threadId},
      ${message.fromEmail},
      ${message.fromName},
      ${message.to},
      ${message.subject},
      ${message.bodyText},
      ${message.bodyHtml},
      ${message.sentAt ? new Date(parseInt(message.sentAt)) : null},
      ${message.isOutgoing},
      ${message.hasAttachments || false},
      ${JSON.stringify(message.attachments || [])}
    )
    ON CONFLICT (id) DO UPDATE SET
      body_text = EXCLUDED.body_text,
      body_html = EXCLUDED.body_html,
      is_outgoing = EXCLUDED.is_outgoing
  `;
}

// Get Gmail Poomfurniture threads with pagination
export async function getGmailPoomfurnitureThreads(page = 1, perPage = 20, unreadOnly = false) {
  const offset = (page - 1) * perPage;

  let threads;
  let countResult;

  if (unreadOnly) {
    threads = await sql`
      SELECT * FROM gmail_poomfurniture_threads
      WHERE unread = true
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM gmail_poomfurniture_threads WHERE unread = true`;
  } else {
    threads = await sql`
      SELECT * FROM gmail_poomfurniture_threads
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM gmail_poomfurniture_threads`;
  }

  return {
    threads: threads.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    perPage
  };
}

// Get single Gmail Poomfurniture thread with messages
export async function getGmailPoomfurnitureThread(threadId) {
  const threadResult = await sql`
    SELECT * FROM gmail_poomfurniture_threads WHERE id = ${threadId}
  `;

  if (threadResult.rows.length === 0) {
    return null;
  }

  const messagesResult = await sql`
    SELECT * FROM gmail_poomfurniture_messages
    WHERE thread_id = ${threadId}
    ORDER BY sent_at ASC
  `;

  return {
    thread: threadResult.rows[0],
    messages: messagesResult.rows
  };
}

// Mark Gmail Poomfurniture thread as read
export async function markGmailPoomfurnitureThreadAsRead(threadId) {
  await sql`UPDATE gmail_poomfurniture_threads SET unread = false, updated_at = CURRENT_TIMESTAMP WHERE id = ${threadId}`;
}

// Get unread Gmail Poomfurniture threads count
export async function getUnreadGmailPoomfurnitureThreadsCount() {
  const { rows } = await sql`SELECT COUNT(*) as count FROM gmail_poomfurniture_threads WHERE unread = true`;
  return parseInt(rows[0].count);
}

// ========== AMAZON DE (SP-API) FUNCTIONS ==========

// Get Amazon DE tokens
export async function getAmazonDeTokens() {
  const { rows } = await sql`SELECT * FROM amazon_de_tokens WHERE id = 1`;
  return rows[0] || null;
}

// Save Amazon DE tokens
export async function saveAmazonDeTokens(accessToken, expiresAt) {
  await sql`
    UPDATE amazon_de_tokens
    SET access_token = ${accessToken},
        expires_at = ${expiresAt},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Get Amazon DE sync status
export async function getAmazonDeSyncStatus() {
  const { rows } = await sql`SELECT * FROM amazon_de_sync_status WHERE id = 1`;
  return rows[0] || null;
}

// Update Amazon DE sync status
export async function updateAmazonDeSyncStatus() {
  await sql`UPDATE amazon_de_sync_status SET last_sync_at = CURRENT_TIMESTAMP WHERE id = 1`;
}

// Set Amazon DE sync in progress
export async function setAmazonDeSyncInProgress(inProgress) {
  await sql`UPDATE amazon_de_sync_status SET sync_in_progress = ${inProgress} WHERE id = 1`;
}

// Save Amazon DE thread
export async function saveAmazonDeThread(thread) {
  await sql`
    INSERT INTO amazon_de_threads (
      id, order_id, buyer_name, subject, snippet,
      last_message_at, unread, messages_count,
      order_total, order_currency, updated_at
    ) VALUES (
      ${thread.id},
      ${thread.orderId || null},
      ${thread.buyerName || ''},
      ${thread.subject || ''},
      ${thread.snippet || ''},
      ${thread.lastMessageAt ? new Date(thread.lastMessageAt) : null},
      ${thread.unread ?? true},
      ${thread.messagesCount || 0},
      ${thread.orderTotal || null},
      ${thread.orderCurrency || null},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      order_id = EXCLUDED.order_id,
      buyer_name = EXCLUDED.buyer_name,
      subject = EXCLUDED.subject,
      snippet = EXCLUDED.snippet,
      last_message_at = EXCLUDED.last_message_at,
      unread = EXCLUDED.unread,
      messages_count = EXCLUDED.messages_count,
      order_total = EXCLUDED.order_total,
      order_currency = EXCLUDED.order_currency,
      updated_at = CURRENT_TIMESTAMP
  `;
}

// Save Amazon DE message
export async function saveAmazonDeMessage(message, threadId) {
  await sql`
    INSERT INTO amazon_de_messages (
      id, thread_id, sender, subject, body_text,
      sent_at, is_outgoing, created_at
    ) VALUES (
      ${message.id},
      ${threadId},
      ${message.sender || ''},
      ${message.subject || ''},
      ${message.bodyText || ''},
      ${message.sentAt ? new Date(message.sentAt) : null},
      ${message.isOutgoing || false},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      body_text = EXCLUDED.body_text,
      is_outgoing = EXCLUDED.is_outgoing
  `;
}

// Get Amazon DE threads with pagination
export async function getAmazonDeThreads(page = 1, perPage = 20, unreadOnly = false) {
  const offset = (page - 1) * perPage;

  let result, countResult;

  if (unreadOnly) {
    result = await sql`
      SELECT * FROM amazon_de_threads
      WHERE unread = true
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM amazon_de_threads WHERE unread = true`;
  } else {
    result = await sql`
      SELECT * FROM amazon_de_threads
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM amazon_de_threads`;
  }

  return {
    threads: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    perPage,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / perPage)
  };
}

// Get single Amazon DE thread with messages
export async function getAmazonDeThread(threadId) {
  const threadResult = await sql`
    SELECT * FROM amazon_de_threads WHERE id = ${threadId}
  `;

  if (threadResult.rows.length === 0) {
    return null;
  }

  const messagesResult = await sql`
    SELECT * FROM amazon_de_messages
    WHERE thread_id = ${threadId}
    ORDER BY sent_at ASC
  `;

  return {
    thread: threadResult.rows[0],
    messages: messagesResult.rows
  };
}

// Mark Amazon DE thread as read
export async function markAmazonDeThreadAsRead(threadId) {
  await sql`UPDATE amazon_de_threads SET unread = false, updated_at = CURRENT_TIMESTAMP WHERE id = ${threadId}`;
}

// Get unread Amazon DE threads count
export async function getUnreadAmazonDeThreadsCount() {
  const { rows } = await sql`SELECT COUNT(*) as count FROM amazon_de_threads WHERE unread = true`;
  return parseInt(rows[0].count);
}

// ============================================
// Gmail Amazon DE Functions
// ============================================

// Get Gmail Amazon DE OAuth tokens
export async function getGmailAmazonDeTokens() {
  const { rows } = await sql`SELECT * FROM gmail_amazon_de_tokens ORDER BY id DESC LIMIT 1`;
  return rows[0] || null;
}

// Save Gmail Amazon DE OAuth tokens
export async function saveGmailAmazonDeTokens(accessToken, refreshToken, expiresAt, email = null) {
  const existing = await getGmailAmazonDeTokens();

  if (existing) {
    await sql`
      UPDATE gmail_amazon_de_tokens
      SET access_token = ${accessToken},
          refresh_token = ${refreshToken},
          expires_at = ${expiresAt},
          email = COALESCE(${email}, email),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${existing.id}
    `;
  } else {
    await sql`
      INSERT INTO gmail_amazon_de_tokens (access_token, refresh_token, expires_at, email)
      VALUES (${accessToken}, ${refreshToken}, ${expiresAt}, ${email})
    `;
  }
}

// Clear Gmail Amazon DE tokens (for re-authorization)
export async function clearGmailAmazonDeTokens() {
  await sql`
    UPDATE gmail_amazon_de_tokens
    SET access_token = NULL,
        refresh_token = NULL,
        expires_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Get Gmail Amazon DE sync status
export async function getGmailAmazonDeSyncStatus() {
  const { rows } = await sql`SELECT * FROM gmail_amazon_de_sync_status ORDER BY id DESC LIMIT 1`;
  return rows[0] || null;
}

// Update Gmail Amazon DE sync status
export async function updateGmailAmazonDeSyncStatus() {
  const existing = await getGmailAmazonDeSyncStatus();

  if (existing) {
    await sql`
      UPDATE gmail_amazon_de_sync_status
      SET last_sync_at = CURRENT_TIMESTAMP,
          sync_in_progress = false
      WHERE id = ${existing.id}
    `;
  } else {
    await sql`
      INSERT INTO gmail_amazon_de_sync_status (last_sync_at, sync_in_progress)
      VALUES (CURRENT_TIMESTAMP, false)
    `;
  }
}

// Set Gmail Amazon DE sync in progress
export async function setGmailAmazonDeSyncInProgress(inProgress) {
  const existing = await getGmailAmazonDeSyncStatus();

  if (existing) {
    await sql`
      UPDATE gmail_amazon_de_sync_status
      SET sync_in_progress = ${inProgress}
      WHERE id = ${existing.id}
    `;
  } else {
    await sql`
      INSERT INTO gmail_amazon_de_sync_status (sync_in_progress)
      VALUES (${inProgress})
    `;
  }
}

// Save Gmail Amazon DE thread
export async function saveGmailAmazonDeThread(thread) {
  await sql`
    INSERT INTO gmail_amazon_de_threads (id, order_id, asin, from_email, from_name, subject, snippet, marketplace, last_message_at, unread, needs_response, last_customer_message_at, has_seller_reply, status)
    VALUES (
      ${thread.id},
      ${thread.orderId || null},
      ${thread.asin || null},
      ${thread.buyerEmail || thread.fromEmail || null},
      ${thread.buyerName || thread.fromName || null},
      ${thread.subject || null},
      ${thread.snippet || null},
      ${thread.marketplace || null},
      ${thread.lastMessageAt || new Date().toISOString()},
      ${thread.unread !== false},
      ${thread.needsResponse !== false},
      ${thread.lastCustomerMessageAt || thread.lastMessageAt || new Date().toISOString()},
      ${thread.hasSellerReply || false},
      ${thread.status || 'open'}
    )
    ON CONFLICT (id) DO UPDATE SET
      order_id = COALESCE(EXCLUDED.order_id, gmail_amazon_de_threads.order_id),
      asin = COALESCE(EXCLUDED.asin, gmail_amazon_de_threads.asin),
      from_email = COALESCE(EXCLUDED.from_email, gmail_amazon_de_threads.from_email),
      from_name = COALESCE(EXCLUDED.from_name, gmail_amazon_de_threads.from_name),
      subject = COALESCE(EXCLUDED.subject, gmail_amazon_de_threads.subject),
      snippet = COALESCE(EXCLUDED.snippet, gmail_amazon_de_threads.snippet),
      marketplace = COALESCE(EXCLUDED.marketplace, gmail_amazon_de_threads.marketplace),
      last_message_at = EXCLUDED.last_message_at,
      unread = EXCLUDED.unread,
      needs_response = EXCLUDED.needs_response,
      last_customer_message_at = COALESCE(EXCLUDED.last_customer_message_at, gmail_amazon_de_threads.last_customer_message_at),
      has_seller_reply = EXCLUDED.has_seller_reply OR gmail_amazon_de_threads.has_seller_reply,
      updated_at = CURRENT_TIMESTAMP
  `;
}

// Update Gmail Amazon DE thread status
export async function updateGmailAmazonDeThreadStatus(threadId, status) {
  await sql`
    UPDATE gmail_amazon_de_threads
    SET status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${threadId}
  `;
}

// Mark thread as responded (seller sent a reply)
export async function markGmailAmazonDeThreadResponded(threadId) {
  await sql`
    UPDATE gmail_amazon_de_threads
    SET needs_response = false, has_seller_reply = true, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${threadId}
  `;
}

// Save Gmail Amazon DE message
export async function saveGmailAmazonDeMessage(message, threadId) {
  // Extract email and name from sender field or use provided fields
  let fromEmail = message.fromEmail || null;
  let fromName = message.fromName || null;

  // If sender is 'seller', mark as outgoing
  if (message.sender === 'seller') {
    fromEmail = 'seller';
    fromName = 'Seller';
  } else if (message.sender && message.sender !== 'seller') {
    // sender might contain email address
    fromEmail = message.sender;
  }

  const attachmentsJson = message.attachments && message.attachments.length > 0
    ? JSON.stringify(message.attachments)
    : null;

  await sql`
    INSERT INTO gmail_amazon_de_messages (id, thread_id, from_email, from_name, subject, body_text, body_html, sent_at, is_outgoing, has_attachments, attachments)
    VALUES (
      ${message.id},
      ${threadId},
      ${fromEmail},
      ${fromName},
      ${message.subject || null},
      ${message.bodyText || null},
      ${message.bodyHtml || null},
      ${message.sentAt || message.internalDate || new Date().toISOString()},
      ${message.isOutgoing || false},
      ${message.hasAttachments || false},
      ${attachmentsJson}
    )
    ON CONFLICT (id) DO UPDATE SET
      body_text = EXCLUDED.body_text,
      body_html = EXCLUDED.body_html,
      from_name = COALESCE(EXCLUDED.from_name, gmail_amazon_de_messages.from_name),
      has_attachments = EXCLUDED.has_attachments,
      attachments = COALESCE(EXCLUDED.attachments, gmail_amazon_de_messages.attachments)
  `;
}

// Get Gmail Amazon DE threads list
export async function getGmailAmazonDeThreads(limit = 50, offset = 0) {
  const { rows } = await sql`
    SELECT t.*,
           (SELECT COUNT(*) FROM gmail_amazon_de_messages WHERE thread_id = t.id) as message_count
    FROM gmail_amazon_de_threads t
    ORDER BY t.last_message_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows;
}

// Get single Gmail Amazon DE thread with messages
export async function getGmailAmazonDeThread(threadId) {
  const threadResult = await sql`
    SELECT * FROM gmail_amazon_de_threads WHERE id = ${threadId}
  `;

  if (threadResult.rows.length === 0) {
    return null;
  }

  const messagesResult = await sql`
    SELECT * FROM gmail_amazon_de_messages
    WHERE thread_id = ${threadId}
    ORDER BY sent_at ASC
  `;

  return {
    thread: threadResult.rows[0],
    messages: messagesResult.rows
  };
}

// Mark Gmail Amazon DE thread as read
export async function markGmailAmazonDeThreadAsRead(threadId) {
  await sql`UPDATE gmail_amazon_de_threads SET unread = false, updated_at = CURRENT_TIMESTAMP WHERE id = ${threadId}`;
}

// Get unread Gmail Amazon DE threads count
export async function getUnreadGmailAmazonDeThreadsCount() {
  const { rows } = await sql`SELECT COUNT(*) as count FROM gmail_amazon_de_threads WHERE unread = true`;
  return parseInt(rows[0].count);
}

// ============================================
// Kaufland Functions
// ============================================

// Get Kaufland sync status
export async function getKauflandSyncStatus() {
  const { rows } = await sql`SELECT * FROM kaufland_sync_status ORDER BY id DESC LIMIT 1`;
  return rows[0] || null;
}

// Update Kaufland sync status
export async function updateKauflandSyncStatus() {
  const existing = await getKauflandSyncStatus();

  if (existing) {
    await sql`
      UPDATE kaufland_sync_status
      SET last_sync_at = CURRENT_TIMESTAMP,
          sync_in_progress = false
      WHERE id = ${existing.id}
    `;
  } else {
    await sql`
      INSERT INTO kaufland_sync_status (last_sync_at, sync_in_progress)
      VALUES (CURRENT_TIMESTAMP, false)
    `;
  }
}

// Set Kaufland sync in progress
export async function setKauflandSyncInProgress(inProgress) {
  const existing = await getKauflandSyncStatus();

  if (existing) {
    await sql`
      UPDATE kaufland_sync_status
      SET sync_in_progress = ${inProgress}
      WHERE id = ${existing.id}
    `;
  } else {
    await sql`
      INSERT INTO kaufland_sync_status (sync_in_progress)
      VALUES (${inProgress})
    `;
  }
}

// Save Kaufland ticket
export async function saveKauflandTicket(ticket) {
  await sql`
    INSERT INTO kaufland_tickets (
      id, ticket_number, status, reason, marketplace, storefront,
      order_id, buyer_name, buyer_email, is_seller_responsible,
      topic, opened_at, updated_at, unread
    )
    VALUES (
      ${ticket.id},
      ${ticket.ticketNumber || null},
      ${ticket.status || null},
      ${ticket.reason || null},
      ${ticket.marketplace || null},
      ${ticket.storefront || null},
      ${ticket.orderId || null},
      ${ticket.buyerName || null},
      ${ticket.buyerEmail || null},
      ${ticket.isSellerResponsible || false},
      ${ticket.topic || null},
      ${ticket.openedAt || null},
      ${ticket.updatedAt || null},
      ${ticket.unread !== false}
    )
    ON CONFLICT (id) DO UPDATE SET
      ticket_number = COALESCE(EXCLUDED.ticket_number, kaufland_tickets.ticket_number),
      status = COALESCE(EXCLUDED.status, kaufland_tickets.status),
      reason = COALESCE(EXCLUDED.reason, kaufland_tickets.reason),
      marketplace = COALESCE(EXCLUDED.marketplace, kaufland_tickets.marketplace),
      storefront = COALESCE(EXCLUDED.storefront, kaufland_tickets.storefront),
      order_id = COALESCE(EXCLUDED.order_id, kaufland_tickets.order_id),
      buyer_name = COALESCE(EXCLUDED.buyer_name, kaufland_tickets.buyer_name),
      buyer_email = COALESCE(EXCLUDED.buyer_email, kaufland_tickets.buyer_email),
      is_seller_responsible = EXCLUDED.is_seller_responsible,
      topic = COALESCE(EXCLUDED.topic, kaufland_tickets.topic),
      updated_at = EXCLUDED.updated_at,
      unread = CASE WHEN EXCLUDED.is_seller_responsible = true THEN true ELSE kaufland_tickets.unread END,
      synced_at = CURRENT_TIMESTAMP
  `;
}

// Save Kaufland message
export async function saveKauflandMessage(message, ticketId) {
  await sql`
    INSERT INTO kaufland_messages (id, ticket_id, sender, text, created_at, is_from_seller, files)
    VALUES (
      ${message.id},
      ${ticketId},
      ${message.sender || null},
      ${message.text || null},
      ${message.createdAt || null},
      ${message.isFromSeller || false},
      ${message.files ? JSON.stringify(message.files) : null}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

// Get Kaufland tickets list
export async function getKauflandTickets(limit = 50, offset = 0, status = null, marketplace = null) {
  let query;

  if (status && marketplace) {
    query = sql`
      SELECT t.*,
             (SELECT COUNT(*) FROM kaufland_messages WHERE ticket_id = t.id) as message_count
      FROM kaufland_tickets t
      WHERE t.status = ${status} AND t.marketplace = ${marketplace}
      ORDER BY t.updated_at DESC NULLS LAST, t.opened_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (status) {
    query = sql`
      SELECT t.*,
             (SELECT COUNT(*) FROM kaufland_messages WHERE ticket_id = t.id) as message_count
      FROM kaufland_tickets t
      WHERE t.status = ${status}
      ORDER BY t.updated_at DESC NULLS LAST, t.opened_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (marketplace) {
    query = sql`
      SELECT t.*,
             (SELECT COUNT(*) FROM kaufland_messages WHERE ticket_id = t.id) as message_count
      FROM kaufland_tickets t
      WHERE t.marketplace = ${marketplace}
      ORDER BY t.updated_at DESC NULLS LAST, t.opened_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    query = sql`
      SELECT t.*,
             (SELECT COUNT(*) FROM kaufland_messages WHERE ticket_id = t.id) as message_count
      FROM kaufland_tickets t
      ORDER BY t.updated_at DESC NULLS LAST, t.opened_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  const { rows } = await query;
  return rows;
}

// Get IDs of tickets that are not closed (for incremental sync)
export async function getKauflandOpenTicketIds() {
  const { rows } = await sql`
    SELECT id FROM kaufland_tickets
    WHERE status NOT IN ('both_closed', 'customer_service_closed_final')
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 50
  `;
  return rows.map(r => r.id);
}

// Get single Kaufland ticket with messages
export async function getKauflandTicket(ticketId) {
  const ticketResult = await sql`
    SELECT * FROM kaufland_tickets WHERE id = ${ticketId}
  `;

  if (ticketResult.rows.length === 0) {
    return null;
  }

  const messagesResult = await sql`
    SELECT * FROM kaufland_messages
    WHERE ticket_id = ${ticketId}
    ORDER BY created_at ASC
  `;

  return {
    ticket: ticketResult.rows[0],
    messages: messagesResult.rows
  };
}

// Mark Kaufland ticket as read
export async function markKauflandTicketAsRead(ticketId) {
  await sql`UPDATE kaufland_tickets SET unread = false, synced_at = CURRENT_TIMESTAMP WHERE id = ${ticketId}`;
}

// Get unread Kaufland tickets count
export async function getUnreadKauflandTicketsCount() {
  const { rows } = await sql`SELECT COUNT(*) as count FROM kaufland_tickets WHERE unread = true`;
  return parseInt(rows[0].count);
}

// Get Kaufland tickets count by marketplace
export async function getKauflandTicketsCountByMarketplace() {
  const { rows } = await sql`
    SELECT marketplace,
           COUNT(*) as total,
           SUM(CASE WHEN unread = true THEN 1 ELSE 0 END) as unread
    FROM kaufland_tickets
    GROUP BY marketplace
    ORDER BY marketplace
  `;
  return rows;
}
