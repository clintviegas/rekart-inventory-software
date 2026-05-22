/*
 * OMS (Offline Order Desk) routes — MongoDB backed.
 *
 * Endpoints are preserved from the original Zoho-backed version so the
 * existing frontend (src/api/omsApi.js, OrderDesk.jsx) works unchanged.
 *
 *   POST   /api/oms/order             create order + adjust stock
 *   GET    /api/oms/orders            list orders (search/filter)
 *   PATCH  /api/oms/order/:id         update order
 *   GET    /api/oms/products/search   product picker (joined w/ inventory)
 *   GET    /api/oms/stats             dashboard stats
 */
const express = require('express');
const router = express.Router();

const { Order, Customer, Product, Inventory } = require('../models.cjs');

const STOCK_OUT_SERVICES = new Set(['Buy', 'Rent']);
const REPAIR_SERVICES = new Set(['Repair']);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    // 1. Upsert customer by phone (best-effort)
    let customerRef = null;
    if (Customer_Phone) {
      const found = await Customer.findOneAndUpdate(
        { Phone: Customer_Phone },
        {
          $setOnInsert: {
            Customer_Name,
            Phone: Customer_Phone,
            Email: Customer_Email || '',
            Loyalty_Tier: 'New',
          },
        },
        { upsert: true, returnDocument: 'after' },
      );
      customerRef = found?._id || null;
    }

    // 2. Stock movement (best-effort — order is still recorded if this fails)
    let stockAdjusted = 'No';
    let stockMessage = null;
    if (Product_SKU) {
      try {
        const inv = await Inventory.findOne({ SKU: Product_SKU });
        if (inv) {
          if (STOCK_OUT_SERVICES.has(Service_Type)) {
            if ((inv.Available_Stock || 0) >= 1) {
              inv.Available_Stock = (inv.Available_Stock || 0) - 1;
              inv.Reserved_Stock = (inv.Reserved_Stock || 0) + 1;
              inv.Last_Outward_Date = new Date();
              await inv.save();
              stockAdjusted = 'Yes';
            } else {
              stockMessage = `No available stock for SKU ${Product_SKU} (order still recorded)`;
            }
          } else if (REPAIR_SERVICES.has(Service_Type)) {
            inv.Repair_Stock = (inv.Repair_Stock || 0) + 1;
            await inv.save();
            stockAdjusted = 'Yes';
          }
        } else {
          stockMessage = `No Inventory row found for SKU ${Product_SKU}`;
        }
      } catch (e) {
        stockMessage = `Stock update failed: ${e.message}`;
      }
    }

    // 3. Create the order
    const orderDoc = {
      Customer_Name,
      Customer_Phone: Customer_Phone || '',
      Customer_Email: Customer_Email || '',
      Customer_Ref: customerRef,
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
      orderDoc.Fault_Description = Fault_Description || '';
      orderDoc.Estimated_Delivery = Estimated_Delivery || '';
      orderDoc.Technician = Technician || '';
    }
    if (Service_Type === 'Trade-In' && Trade_In_Value != null && Trade_In_Value !== '') {
      orderDoc.Trade_In_Value = Number(Trade_In_Value);
    }
    if (Service_Type === 'Rent') {
      orderDoc.Rental_Start_Date = Rental_Start_Date || '';
      orderDoc.Rental_End_Date = Rental_End_Date || '';
    }

    const created = await Order.create(orderDoc);

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
    const filter = {};
    if (service && service !== 'All') filter.Service_Type = service;
    if (status && status !== 'All') filter.Status = status;
    if (location && location !== 'All') filter.Location = location;
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [
        { Customer_Name: rx },
        { Customer_Phone: rx },
        { Device_Description: rx },
        { Order_ID: rx },
        { Product_SKU: rx },
      ];
    }

    const lim = Math.min(Number(limit) || 100, 500);
    const skip = Math.max((Number(offset) || 1) - 1, 0);

    const [rows, count] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      Order.countDocuments(filter),
    ]);

    // Frontend reads `ID` and `Added_Time` (legacy Zoho field names) so
    // we mirror them here for back-compat.
    const data = rows.map((r) => ({ ...r, ID: String(r._id), Added_Time: r.Added_Time || r.createdAt }));
    res.json({ data, count });
  } catch (err) {
    console.error('OMS list orders error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET ONE ORDER ────────────────────────────────────────────
router.get('/order/:id', async (req, res) => {
  try {
    const row = await Order.findById(req.params.id).lean();
    if (!row) return res.status(404).json({ error: 'Order not found' });
    res.json({ ...row, ID: String(row._id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── UPDATE ORDER ─────────────────────────────────────────────
router.patch('/order/:id', async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' }).lean();
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json({ ...updated, ID: String(updated._id) });
  } catch (err) {
    console.error('OMS update order error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE ORDER ─────────────────────────────────────────────
router.delete('/order/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PRODUCT SEARCH (for picker) ──────────────────────────────
router.get('/products/search', async (req, res) => {
  try {
    const { q, limit } = req.query;
    const lim = Math.min(Number(limit) || 20, 100);

    let products = [];
    if (q && String(q).trim()) {
      const rx = new RegExp(escapeRegex(String(q).trim()), 'i');
      products = await Product.find({
        $or: [{ SKU: rx }, { Product_Name: rx }, { Brand1: rx }, { Barcode: rx }, { Model_Number: rx }],
      })
        .limit(lim)
        .lean();
    } else {
      products = await Product.find({}).limit(lim).lean();
    }

    const skus = products.map((p) => p.SKU).filter(Boolean);
    const invRows = await Inventory.find({ SKU: { $in: skus } }).lean();
    const invBySku = Object.fromEntries(invRows.map((i) => [i.SKU, i]));

    const enriched = products.map((p) => {
      const inv = invBySku[p.SKU];
      return {
        id: String(p._id),
        sku: p.SKU,
        name: p.Product_Name,
        brand: p.Brand1,
        storage: p.Storage_RAM,
        color: p.Color,
        productType: p.Product_Type,
        available: inv ? Number(inv.Available_Stock || 0) : null,
        warehouse: inv?.Warehouse_Location || null,
      };
    });

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
    const [total, pending, completedToday, revenueAgg] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ Status: 'Pending' }),
      Order.countDocuments({ Status: 'Completed', Order_Date: today }),
      Order.aggregate([
        { $match: { Status: 'Completed' } },
        { $group: { _id: null, sum: { $sum: '$Amount' } } },
      ]),
    ]);
    const revenue = revenueAgg[0]?.sum || 0;
    res.json({ total, pending, completedToday, revenue });
  } catch (err) {
    console.error('OMS stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
