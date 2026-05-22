/*
 * Generic CRUD for the six inventory sections — MongoDB backed.
 *
 * The route prefix and shape are preserved from the original Zoho-backed
 * version so the frontend (src/api/zohoApi.js, RecordsTable, EditRecordModal)
 * works unchanged. The "criteria" query param is a Mongo-friendly subset:
 * either omitted (return all, default sort), or a simple "Field == \"value\""
 * expression chained with " && " (legacy Zoho syntax). Anything else is
 * ignored — only equality filters are honoured.
 */
const express = require('express');
const router = express.Router();

const { SECTION_MODELS } = require('../models.cjs');

function modelFor(section) {
  const M = SECTION_MODELS[section];
  if (!M) {
    const err = new Error(`Unknown section: ${section}`);
    err.status = 400;
    throw err;
  }
  return M;
}

// Translate the legacy Zoho criteria string into a Mongo filter — best-effort.
// Supported: Field == "value" (joined with " && "). Everything else is dropped.
function criteriaToFilter(criteria) {
  if (!criteria || typeof criteria !== 'string') return {};
  const filter = {};
  const parts = criteria.split('&&').map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    const m = p.match(/^([A-Za-z_][\w]*)\s*==\s*"(.*)"$/);
    if (m) filter[m[1]] = m[2];
  }
  return filter;
}

function withLegacyKeys(doc) {
  if (!doc) return doc;
  return { ...doc, ID: String(doc._id), Added_Time: doc.Added_Time || doc.createdAt };
}

// ─── CREATE ───────────────────────────────────────────────────
router.post('/:section', async (req, res) => {
  try {
    const M = modelFor(req.params.section);
    const created = await M.create(req.body);
    res.json({ data: withLegacyKeys(created.toObject()) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate key (likely SKU already exists)' });
    }
    console.error('CREATE error:', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── READ (list) ──────────────────────────────────────────────
router.get('/:section', async (req, res) => {
  try {
    const M = modelFor(req.params.section);
    const filter = criteriaToFilter(req.query.criteria);
    const lim = Math.min(Number(req.query.limit) || 200, 1000);
    const skip = Math.max((Number(req.query.offset) || 1) - 1, 0);

    const [rows, count] = await Promise.all([
      M.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      M.countDocuments(filter),
    ]);

    res.json({ data: rows.map(withLegacyKeys), count });
  } catch (err) {
    console.error('READ error:', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── UPDATE ───────────────────────────────────────────────────
router.patch('/:section/:id', async (req, res) => {
  try {
    const M = modelFor(req.params.section);
    const updated = await M.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' }).lean();
    if (!updated) return res.status(404).json({ error: 'Record not found' });
    res.json({ data: withLegacyKeys(updated) });
  } catch (err) {
    console.error('UPDATE error:', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── DELETE ───────────────────────────────────────────────────
router.delete('/:section/:id', async (req, res) => {
  try {
    const M = modelFor(req.params.section);
    await M.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE error:', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
