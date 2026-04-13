require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const zohoRoutes = require('./routes/zoho.cjs');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// In production, the frontend is served from the same origin — no CORS needed.
// In dev, allow any localhost port.
if (!isProd) {
  app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
}

app.use(express.json({ limit: '10mb' }));

app.use('/api/zoho', zohoRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React build in production
if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
