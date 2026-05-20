/*
 * OMS (Offline Order Desk) routes
 * ────────────────────────────────
 * - POST   /api/oms/order             create order + decrement stock
 * - GET    /api/oms/orders            list orders (search/filter)
 * - PATCH  /api/oms/order/:id         update order (status, fields)
 * - GET    /api/oms/products/search?q list products joined with inventory
 * - GET    /api/oms/stats             dashboard stats
 *
 * Backed by Zoho Creator forms Order_Master, Customer_Master, plus the
 * existing Product_Master and Inventory_Stock. See ZOHO_CREATOR_SCHEMA.js.
 */
const express = require('express');
const router = express.Router();
const { addRecord, getRecords, updateRecord } = require('../zohoCreator.cjs');

const FORMS = {
  order:    { form: 'Order_Master',     report: 'All_Orders' },
  customer: { form: 'Customer_Master',  report: 'All_Customers' },
  product:  { form: 'Product_Master',   report: 'Product_Master_Report' },
  inventory:{ form: 'Inventory_Stock',  report: 'Inventory_Stock_Report' },
};

// Service types that draw stock OUT of available inventory (we are selling/lending).
const STOCK_OUT_SERVICES = new Set(['Buy', 'Rent']);
// Service types that flow INTO our repair queue.
const REPAIR_SERVICES = new Set(['Repair']);

async function findCustomerByPhone(phone) {
  if (!phone) return null;
  const safe = String(phone).replace(/"/g, '');
  const criteria = `Phone == "${safe}"`;
  try {
    const res = await getRecords(FORMS.customer.report, criteria, 1, 1);
    return res?.data?.[0] || null;
  } catch (_e) {
    return null;
  }
}

async function findInventoryBySku(sku) {
  if (!sku) return null;
  const safe = String(sku).replace(/"/g, '');
  const criteria = `SKU == "${safe}"`;
  try {
    const res = await getRecords(FORMS.inventory.report, criteria, 1, 1);
    return res?.data?.[0] || null;
  } catch (_e) {
    return null;
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ─── CREATE ORDER ─────────────────────────────────────────────
router.post('/order', async (req, res) => {
  const {
    Customer_Name, Customer_Phone, Customer_Email,
    Service_Type, Product_SKU, Device_Description,
    Amount, Payment_Mode, Status,
    Location, Handled_By, Notes,
    Fault_Description, Estimated_Delivery, Technician,
    Trade_In_Value, Rental_Start_Date, Rental_End_Date,
  } = req.body;

  if (!Customer_Name || !Service_Type) {
    return res.status(400).json({ error: 'Customer_Name and Service_Type are required' });
  }

  try {
    // 1. Upsert customer by phone
    let customerRef = null;
    if (Customer_Phone) {
      const existing = await findCustomerByPhone(Customer_Phone);
      if (existing) {
        customerRef = existing.ID;
      } else {
        const created = await addRecord(FORMS.customer.form, {
          Customer_Name,
          Phone: Customer_Phone,
          Email: Customer_Email || '',
          Loyalty_Tier: 'New',
        });
        customerRef = created?.data?.ID || null;
      }
    }

    // 2. Apply stock movement (best-effort — order is still recorded if this fails)
    let stockAdjusted = 'No';
    let stockMessage = null;
    if (Product_SKU) {
      try {
        const inv = await findInventoryBySku(Product_SKU);
        if (inv) {
          if (STOCK_OUT_SERVICES.has(Service_Type)) {
            const avail = Number(inv.Available_Stock || 0);
            const reserved = Number(inv.Reserved_Stock || 0);
            if (avail >= 1) {
              await updateRecord(FORMS.inventory.report, inv.ID, {
                Available_Stock: avail - 1,
                Reserved_Stock: reserved + 1,
                Last_Outward_Date: todayISO(),
              });
              stockAdjusted = 'Yes';
            } else {
              stockMessage = `No available stock for SKU ${Product_SKU} (order still recorded)`;
            }
          } else if (REPAIR_SERVICES.has(Service_Type)) {
            const repair = Number(inv.Repair_Stock || 0);
            await updateRecord(FORMS.inventory.report, inv.ID, {
              Repair_Stock: repair + 1,
            });
            stockAdjusted = 'Yes';
          }
        } else {
          stockMessage = `No Inventory_Stock row found for SKU ${Product_SKU}`;
        }
      } catch (e) {
        stockMessage = `Stock update failed: ${e.message}`;
      }
    }

    // 3. Create the order record
    const orderPayload = {
      Customer_Name,
      Customer_Phone: Customer_Phone || '',
      Customer_Email: Customer_Email || '',
      Service_Type,
      Product_SKU: Product_SKU || '',
      Device_Description: Device_Description || '',
      Amount: Amount ? Number(Amount) : 0,
      Payment_Mode: Payment_Mode || 'Pending',
      Status: Status || 'Pending',
      Order_Date: todayISO(),
      Location: Location || '',
      Handled_By: Handled_By || '',
      Notes: Notes || '',
      Stock_Adjusted: stockAdjusted,
    };
    if (Service_Type === 'Repair') {
      orderPayload.Fault_Description = Fault_Description || '';
      orderPayload.Estimated_Delivery = Estimated_Delivery || '';
      orderPayload.Technician = Technician || '';
    }
    if (Service_Type === 'Trade-In' && Trade_In_Value != null) {
      orderPayload.Trade_In_Value = Number(Trade_In_Value);
    }
    if (Service_Type === 'Rent') {
      orderPayload.Rental_Start_Date = Rental_Start_Date || '';
      orderPayload.Rental_End_Date = Rental_End_Date || '';
    }

    const created = await addRecord(FORMS.order.form, orderPayload);

    res.json({
      order: created,
      customerRef,
      stockAdjusted,
      stockMessage,
    });
  } catch (err) {
    console.error('OMS create order error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── LIST ORDERS ──────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { q, service, status, location, limit, offset } = req.query;
    const parts = [];
    if (service && service !== 'All') parts.push(`Service_Type == "${String(service).replace(/"/g, '')}"`);
    if (status && status !== 'All') parts.push(`Status == "${String(status).replace(/"/g, '')}"`);
    if (location && location !== 'All') parts.push(`Location == "${String(location).replace(/"/g, '')}"`);
    if (q) {
      const safe = String(q).replace(/"/g, '');
      parts.push(`(Customer_Name.contains("${safe}") || Customer_Phone.contains("${safe}") || Device_Description.contains("${safe}") || Order_ID.contains("${safe}"))`);
    }
    const criteria = parts.join(' && ');
    const result = await getRecords(
      FORMS.order.report,
      criteria,
      Number(limit) || 100,
      Number(offset) || 1,
    );
    res.json(result);
  } catch (err) {
    console.error('OMS list orders error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── UPDATE ORDER ─────────────────────────────────────────────
router.patch('/order/:id', async (req, res) => {
  try {
    const result = await updateRecord(FORMS.order.report, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    console.error('OMS update order error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PRODUCT SEARCH (for picker) ──────────────────────────────
// Returns products joined with their inventory row (Available_Stock, Warehouse).
router.get('/products/search', async (req, res) => {
  try {
    const { q, limit } = req.query;
    const safe = String(q || '').replace(/"/g, '');
    const criteria = safe
      ? `(SKU.contains("${safe}") || Product_Name.contains("${safe}") || Brand.contains("${safe}") || Barcode == "${safe}")`
      : '';
    const products = await getRecords(
      FORMS.product.report,
      criteria,
      Number(limit) || 20,
      1,
    );
    const rows = products?.data || [];

    // Best-effort enrichment with inventory. One round-trip per result is fine for limit=20.
    const enriched = await Promise.all(rows.map(async (p) => {
      const inv = await findInventoryBySku(p.SKU);
      return {
        id: p.ID,
        sku: p.SKU,
        name: p.Product_Name,
        brand: p.Brand1 || p.Brand,
        storage: p.Storage_RAM,
        color: p.Color,
        productType: p.Product_Type,
        available: inv ? Number(inv.Available_Stock || 0) : null,
        warehouse: inv?.Warehouse_Location || null,
      };
    }));

    res.json({ data: enriched });
  } catch (err) {
    console.error('OMS product search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DASHBOARD STATS ──────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const today = todayISO();
    const orders = await getRecords(FORMS.order.report, '', 500, 1);
    const data = orders?.data || [];
    const total = data.length;
    const pending = data.filter((o) => o.Status === 'Pending').length;
    const completedToday = data.filter((o) => o.Status === 'Completed' && (o.Order_Date === today || String(o.Added_Time || '').startsWith(today))).length;
    const revenue = data
      .filter((o) => o.Status === 'Completed')
      .reduce((sum, o) => sum + Number(o.Amount || 0), 0);
    res.json({ total, pending, completedToday, revenue });
  } catch (err) {
    console.error('OMS stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
