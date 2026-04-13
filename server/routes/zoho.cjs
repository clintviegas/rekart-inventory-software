const express = require('express');
const router = express.Router();
const { addRecord, getRecords, updateRecord, deleteRecord } = require('../zohoCreator.cjs');

// ─── Form name → Report name mapping ─────────────────────────
// These must match the form/report names in your Zoho Creator app.
// Update these if you customise names in Creator.
const FORMS = {
  product:        { form: 'Product_Master',          report: 'Product_Master_Report' },
  device:         { form: 'Device_Tracking',          report: 'Device_Tracking_Report' },
  inventory:      { form: 'Inventory_Stock',          report: 'Inventory_Stock_Report' },
  pricing:        { form: 'Pricing_Margin',           report: 'All_Pricing_Margins' },
  refurbishment:  { form: 'Refurbishment_Grade',      report: 'All_Refurbishment_Grades' },
  marketplace:    { form: 'Marketplace_Channel',      report: 'All_Marketplace_Channels' },
};

function getNames(section) {
  const entry = FORMS[section];
  if (!entry) throw new Error(`Unknown section: ${section}`);
  return entry;
}

// ─── CREATE ───────────────────────────────────────────────────
router.post('/:section', async (req, res) => {
  try {
    const { form } = getNames(req.params.section);
    const result = await addRecord(form, req.body);
    res.json(result);
  } catch (err) {
    console.error('CREATE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── READ (list) ──────────────────────────────────────────────
router.get('/:section', async (req, res) => {
  try {
    const { report } = getNames(req.params.section);
    const { criteria, limit, offset } = req.query;
    const result = await getRecords(report, criteria, Number(limit) || 200, Number(offset) || 1);
    res.json(result);
  } catch (err) {
    console.error('READ error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── UPDATE ───────────────────────────────────────────────────
router.patch('/:section/:id', async (req, res) => {
  try {
    const { report } = getNames(req.params.section);
    const result = await updateRecord(report, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    console.error('UPDATE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE ───────────────────────────────────────────────────
router.delete('/:section/:id', async (req, res) => {
  try {
    const { report } = getNames(req.params.section);
    const result = await deleteRecord(report, req.params.id);
    res.json(result);
  } catch (err) {
    console.error('DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
