#!/usr/bin/env node
/*
 * Seed products + inventory + pricing rows from PRICELIST.xlsx.
 *
 *   node scripts/seed-pricelist.cjs               # uses scripts/PRICELIST.xlsx
 *   node scripts/seed-pricelist.cjs path/to.xlsx
 *
 * Idempotent: upserts by SKU.
 */
require('dotenv').config();
const path = require('path');
const XLSX = require('xlsx');

const { connectDB, mongoose } = require('../server/db.cjs');
const { Product, Inventory, Pricing } = require('../server/models.cjs');

const DEFAULT_FILE = path.join(__dirname, 'PRICELIST.xlsx');

function inferBrand(model) {
  const m = String(model || '').toUpperCase();
  if (m.startsWith('T') || m.includes('THINK') || m.includes('LENOVO') || m.includes('IDEA')) return 'Lenovo';
  if (m.includes('ELITEBOOK') || m.startsWith('HP')) return 'HP';
  if (m.includes('LATITUDE') || m.includes('DELL') || /^\d{4}/.test(m)) return 'Dell';
  return 'Other';
}

function buildSku(brand, model, generation, capacity, idx) {
  const slug = (s) =>
    String(s || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  const parts = [slug(brand), slug(model), slug(generation), slug(capacity)].filter(Boolean);
  const sku = parts.join('-');
  return sku || `SKU-${idx}`;
}

function inferRam(cap) {
  const m = String(cap || '').match(/(\d+)\s*GB/i);
  return m ? `${m[1]}GB` : '';
}
function inferStorage(cap) {
  const m = String(cap || '').match(/(\d+\s*GB)\s*,\s*(\d+\s*GB)/i);
  return m ? m[2].replace(/\s+/g, '') : '';
}

async function main() {
  const file = process.argv[2] || DEFAULT_FILE;
  console.log('[seed] reading', file);

  const wb = XLSX.readFile(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  // rows[0] is the header; data starts at rows[1].
  const data = rows.slice(1).filter((r) => r && r[1]); // require MODEL

  console.log('[seed] connecting to Mongo…');
  await connectDB();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < data.length; i += 1) {
    const [_sn, model, generation, capacity, retail, wholesale] = data[i];
    if (!model) { skipped++; continue; }

    const brand = inferBrand(model);
    const sku = buildSku(brand, model, generation, capacity, i + 1);
    const productName = [brand, model, generation, capacity].filter(Boolean).join(' ');

    // Upsert product
    const prodRes = await Product.updateOne(
      { SKU: sku },
      {
        $set: {
          SKU: sku,
          Brand1: brand,
          Category: 'Laptop',
          Sub_Category: 'Business',
          Product_Name: productName,
          Model_Number: String(model),
          Series: generation || '',
          Storage_RAM: capacity || '',
          Processor: generation || '',
          OS: 'Windows 11 Pro',
          Product_Type: 'Refurbished',
        },
      },
      { upsert: true },
    );

    // Upsert inventory row (starts at 0 stock)
    await Inventory.updateOne(
      { SKU: sku },
      {
        $setOnInsert: {
          SKU: sku,
          Current_Stock: 0,
          Available_Stock: 0,
          Reserved_Stock: 0,
          In_Transit_Stock: 0,
          Repair_Stock: 0,
          Dead_Stock: 0,
          Warehouse_Location: 'Dubai — HQ',
          Reorder_Point: 2,
          Minimum_Stock: 1,
          Maximum_Stock: 20,
        },
      },
      { upsert: true },
    );

    // Upsert pricing
    if (retail != null || wholesale != null) {
      await Pricing.updateOne(
        { SKU: sku },
        {
          $set: {
            SKU: sku,
            Retail_Selling_Price: retail != null ? Number(retail) : undefined,
            Wholesale_Price: wholesale != null ? Number(wholesale) : undefined,
            MRP: retail != null ? Number(retail) : undefined,
          },
        },
        { upsert: true },
      );
    }

    if (prodRes.upsertedCount) created++;
    else updated++;
  }

  console.log(`[seed] done — products created: ${created}, updated: ${updated}, skipped: ${skipped}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
