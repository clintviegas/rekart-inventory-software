const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { User } = require('../models.cjs');
const { signToken, setAuthCookie, clearAuthCookie, requireAuth } = require('../auth.cjs');

// First-user bootstrap: when there are zero users, signup is open.
// After that, only an authenticated admin can create new users.
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (String(password).length < 6) return res.status(400).json({ error: 'Password must be 6+ characters' });

    const count = await User.estimatedDocumentCount();
    if (count > 0) {
      // require admin auth to create more users
      try {
        const { requireAuth } = require('../auth.cjs');
        await new Promise((resolve, reject) => {
          requireAuth(req, res, (err) => (err ? reject(err) : resolve()));
        });
      } catch {
        return res.status(401).json({ error: 'Signup is closed. Only an admin can create new users.' });
      }
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
      }
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const role = count === 0 ? 'admin' : 'staff';
    const user = await User.create({
      email: String(email).toLowerCase(),
      name: name || '',
      passwordHash,
      role,
    });

    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public probe so the frontend knows whether to show the signup screen.
router.get('/needs-bootstrap', async (_req, res) => {
  try {
    const count = await User.estimatedDocumentCount();
    res.json({ needsBootstrap: count === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
