/*
 * Products catalogue routes.
 *
 *   GET    /api/products            list all (with inventory join for stock)
 *   POST   /api/products            create single product
 *   PATCH  /api/products/:id        update product fields
 *   DELETE /api/products/:id        delete product + its inventory row
 *   POST   /api/products/import     bulk upsert from Excel/CSV rows
 */
const express = require('express');
const router = express.Router();
const { Product, Inventory, Pricing } = require('../models.cjs');

/* ─── LIST ──────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  const { q, brand, limit = 200, skip = 0 } = req.query;
  const filter = {};
  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ SKU: re }, { Product_Name: re }, { Brand1: re }, { Storage_RAM: re }];
  }
  if (brand) filter.Brand1 = new RegExp(`^${brand}$`, 'i');

  const products = await Product.find(filter)
    .sort({ Brand1: 1, Product_Name: 1 })
    .limit(Number(limit))
    .skip(Number(skip))
    .lean();

  const skus = products.map((p) => p.SKU);
  const [invRows, pricingRows] = await Promise.all([
    Inventory.find({ SKU: { $in: skus } }).lean(),
    Pricing.find({ SKU: { $in: skus } }).lean(),
  ]);

  const invMap = Object.fromEntries(invRows.map((r) => [r.SKU, r]));
  const priceMap = Object.fromEntries(pricingRows.map((r) => [r.SKU, r]));

  const data = products.map((p) => {
    const inv = invMap[p.SKU] || {};
    const pricing = priceMap[p.SKU] || {};
    return {
      ...p,
      ID: p._id,
      Available_Stock: inv.Available_Stock ?? 0,
      Current_Stock: inv.Current_Stock ?? 0,
      Reserved_Stock: inv.Reserved_Stock ?? 0,
      Warehouse_Location: inv.Warehouse_Location || '',
      Retail_Selling_Price: pricing.Retail_Selling_Price ?? null,
      Wholesale_Price: pricing.Wholesale_Price ?? null,
    };
  });

  res.json({ data, total: data.length });
});

/* ─── CREATE SINGLE ────────────────────────────────────────────── */
router.post('/', async (req, res) => {
  const body = req.body;
  if (!body.SKU) return res.status(400).json({ error: 'SKU is required' });

  const product = await Product.findOneAndUpdate(
    { SKU: body.SKU },
    { $set: body },
    { upsert: true, new: true, returnDocument: 'after' },
  );

  // Ensure an inventory row exists
  await Inventory.findOneAndUpdate(
    { SKU: body.SKU },
    { $setOnInsert: { SKU: body.SKU, Available_Stock: 0, Current_Stock: 0 } },
    { upsert: true },
  );

  res.json({ data: { ...product.toObject(), ID: product._id } });
});

/* ─── UPDATE SINGLE ─────────────────────────────────────────────── */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const body = { ...req.body };
  delete body._id;
  delete body.ID;

  const updated = await Product.findByIdAndUpdate(
    id,
    { $set: body },
    { returnDocument: 'after' },
  );
  if (!updated) return res.status(404).json({ error: 'Product not found' });

  // If stock fields were included, sync to Inventory row
  const stockFields = ['Available_Stock', 'Current_Stock', 'Reserved_Stock', 'Warehouse_Location'];
  const stockUpdate = {};
  stockFields.forEach((f) => {
    if (body[f] != null) stockUpdate[f] = body[f];
  });
  if (Object.keys(stockUpdate).length) {
    await Inventory.findOneAndUpdate(
      { SKU: updated.SKU },
      { $set: stockUpdate },
      { upsert: true },
    );
  }

  // If price fields were included, sync to Pricing row
  const priceFields = ['Retail_Selling_Price', 'Wholesale_Price', 'Vendor_Buy_Price'];
  const priceUpdate = {};
  priceFields.forEach((f) => {
    if (body[f] != null) priceUpdate[f] = body[f];
  });
  if (Object.keys(priceUpdate).length) {
    await Pricing.findOneAndUpdate(
      { SKU: updated.SKU },
      { $set: priceUpdate },
      { upsert: true },
    );
  }

  res.json({ data: { ...updated.toObject(), ID: updated._id } });
});

/* ─── DELETE ────────────────────────────────────────────────────── */
router.delete('/:id', async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  await Inventory.deleteOne({ SKU: product.SKU });
  res.json({ ok: true });
});

/* ─── BULK IMPORT (from Excel/CSV) ──────────────────────────────── */
router.post('/import', async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'rows array is required' });
  }

  const results = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    if (!row.SKU || !row.Product_Name) {
      results.skipped++;
      continue;
    }
    try {
      const productData = {
        SKU: row.SKU,
        Product_Name: row.Product_Name,
        Brand1: row.Brand1 || '',
        Series: row.Series || '',
        Storage_RAM: row.Storage_RAM || '',
        Category: row.Category || 'Laptops',
        Product_Type: row.Product_Type || 'Refurbished',
        Model_Number: row.Model_Number || '',
        Processor: row.Processor || '',
        Color: row.Color || '',
        OS: row.OS || '',
      };

      const existing = await Product.findOne({ SKU: row.SKU });
      await Product.findOneAndUpdate(
        { SKU: row.SKU },
        { $set: productData },
        { upsert: true },
      );

      // Set initial stock to 1 if new, or keep existing if already has stock
      const invRow = await Inventory.findOne({ SKU: row.SKU });
      const initStock = row.Available_Stock != null ? Number(row.Available_Stock) : 1;
      if (!invRow) {
        await Inventory.create({
          SKU: row.SKU,
          Available_Stock: initStock,
          Current_Stock: initStock,
          Reserved_Stock: 0,
          Warehouse_Location: row.Warehouse_Location || 'Sharjah — Warehouse',
        });
      } else if (row.Available_Stock != null) {
        await Inventory.findOneAndUpdate({ SKU: row.SKU }, { $set: { Available_Stock: initStock } });
      }

      // Upsert pricing
      const priceData = {};
      if (row.Retail_Selling_Price != null) priceData.Retail_Selling_Price = Number(row.Retail_Selling_Price);
      if (row.Wholesale_Price != null) priceData.Wholesale_Price = Number(row.Wholesale_Price);
      if (row.Vendor_Buy_Price != null) priceData.Vendor_Buy_Price = Number(row.Vendor_Buy_Price);
      if (Object.keys(priceData).length) {
        await Pricing.findOneAndUpdate(
          { SKU: row.SKU },
          { $set: { SKU: row.SKU, ...priceData } },
          { upsert: true },
        );
      }

      existing ? results.updated++ : results.created++;
    } catch (e) {
      results.errors.push({ sku: row.SKU, error: e.message });
    }
  }

  res.json(results);
});

module.exports = router;
