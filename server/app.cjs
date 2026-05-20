require('dotenv').config();
const express = require('express');
const cors = require('cors');
const zohoRoutes = require('./routes/zoho.cjs');
const omsRoutes = require('./routes/oms.cjs');

const app = express();

// Allow any localhost port in dev; on Vercel the frontend is same-origin so no CORS needed.
app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/zoho', zohoRoutes);
app.use('/api/oms', omsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
