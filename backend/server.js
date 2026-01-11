import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { runSync, getOrders } from './services/apiloSync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Endpoints
app.get('/api/orders', (req, res) => {
  try {
    const orders = getOrders();
    res.json({ orders, lastSync: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync', async (req, res) => {
  try {
    const orders = await runSync();
    res.json({ success: true, count: orders.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Schedule sync every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log('[Cron] Running scheduled sync...');
  try {
    await runSync();
  } catch (error) {
    console.error('[Cron] Sync failed:', error.message);
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`[Server] OrdAp backend running on port ${PORT}`);
  console.log('[Server] Running initial sync...');

  try {
    await runSync();
    console.log('[Server] Initial sync completed');
  } catch (error) {
    console.error('[Server] Initial sync failed:', error.message);
  }
});
