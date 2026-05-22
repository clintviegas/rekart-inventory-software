require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { connectDB } = require('./db.cjs');
const { requireAuth } = require('./auth.cjs');

const zohoRoutes = require('./routes/zoho.cjs');
const omsRoutes = require('./routes/oms.cjs');
const authRoutes = require('./routes/auth.cjs');

const app = express();

// Local dev: allow any localhost port. Production is same-origin (Vercel rewrites).
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
    return cb(null, true); // same-origin in prod, harmless to echo
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// On serverless (Vercel), the function is reused across requests but cold-starts
// the connection. Connect lazily on every request — connectDB() is idempotent.
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Public
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRoutes);

// Protected — every other /api/* route requires a valid session cookie.
app.use('/api/zoho', requireAuth, zohoRoutes);
app.use('/api/oms', requireAuth, omsRoutes);

// Final error handler so DB connection failures don't hang.
app.use((err, _req, res, _next) => {
  console.error('[api error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal error' });
});

module.exports = app;
