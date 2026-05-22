import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FileText, DollarSign, Clock, CheckCircle,
  ShoppingCart, Tag, Wrench, RefreshCw, Shield, Calendar, Recycle, Plus, Download, Search, Eye, Trash2,
} from 'lucide-react';
import {
  SERVICE_TYPES, PAYMENT_MODES, ORDER_STATUSES, ORDER_LOCATIONS, TECHNICIANS,
} from '../schema';
import { createOrder, fetchOrders, fetchStats, deleteOrder } from '../api/omsApi';
import ProductPicker from './ProductPicker';
import OrderDetailModal from './OrderDetailModal';

const SERVICE_ICONS = {
  Buy: ShoppingCart,
  Sell: Tag,
  Repair: Wrench,
  'Trade-In': RefreshCw,
  Insurance: Shield,
  Rent: Calendar,
  Recycle: Recycle,
};

const EMPTY_FORM = {
  Customer_Name: '',
  Customer_Phone: '',
  Customer_Email: '',
  Service_Type: 'Buy',
  Product_SKU: '',
  Device_Description: '',
  Amount: '',
  Payment_Mode: 'Cash',
  Status: 'Pending',
  Location: ORDER_LOCATIONS[0],
  Handled_By: '',
  Notes: '',
  Fault_Description: '',
  Estimated_Delivery: '',
  Technician: TECHNICIANS[0],
  Trade_In_Value: '',
  Rental_Start_Date: '',
  Rental_End_Date: '',
};

export default function OrderDesk() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [filters, setFilters] = useState({ q: '', service: 'All', status: 'All', location: 'All' });
  const [openOrder, setOpenOrder] = useState(null);

  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0, completedToday: 0 });

  const refreshAll = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetchOrders(filters),
        fetchStats(),
      ]);
      setOrders(ordersRes?.data || []);
      setStats(statsRes || stats);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setLoadingOrders(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickProduct = (p) => {
    setSelectedProduct(p);
    setForm((f) => ({
      ...f,
      Product_SKU: p?.sku || '',
      Device_Description: p ? [p.name, p.storage, p.color].filter(Boolean).join(' ') : f.Device_Description,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.Customer_Name.trim()) { toast.error('Customer name is required'); return; }
    setSaving(true);
    try {
      const res = await createOrder(form);
      if (res.stockMessage) toast(res.stockMessage, { icon: '⚠️' });
      toast.success(
        res.stockAdjusted === 'Yes'
          ? 'Order punched & inventory updated'
          : 'Order punched',
      );
      setForm(EMPTY_FORM);
      setSelectedProduct(null);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    if (orders.length === 0) { toast.error('No orders to export'); return; }
    const headers = ['Order_ID', 'Customer_Name', 'Customer_Phone', 'Service_Type', 'Product_SKU', 'Device_Description', 'Amount', 'Status', 'Order_Date', 'Location'];
    const rows = orders.map((o) => headers.map((h) => `"${String(o[h] ?? '').replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeOrder = async (o) => {
    if (!window.confirm(`Delete order ${o.Order_ID || o.ID}? This cannot be undone.`)) return;
    try {
      await deleteOrder(o.ID || o._id);
      toast.success('Order deleted');
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
  };

  const isRepair = form.Service_Type === 'Repair';
  const isTradeIn = form.Service_Type === 'Trade-In';
  const isRent = form.Service_Type === 'Rent';

  const orderRows = useMemo(() => orders, [orders]);

  return (
    <div className="oms-page">
      <div className="oms-header">
        <div>
          <h2 className="oms-title">Offline Order Desk</h2>
          <div className="oms-sub">Punch walk-in and field orders across all 7 service verticals</div>
        </div>
        <div className="oms-header-actions">
          <button className="btn btn-secondary" onClick={exportCsv}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="oms-stats">
        <StatCard icon={FileText} color="blue" value={stats.total} label="Total Orders" />
        <StatCard icon={DollarSign} color="green" value={`AED ${Number(stats.revenue || 0).toLocaleString()}`} label="Revenue" />
        <StatCard icon={Clock} color="amber" value={stats.pending} label="Pending" />
        <StatCard icon={CheckCircle} color="purple" value={stats.completedToday} label="Completed Today" />
      </div>

      <div className="oms-two-col">
        {/* ── Order Form ── */}
        <form className="oms-panel" onSubmit={submit}>
          <div className="oms-panel-head">
            <div className="oms-panel-head-icon"><Plus size={16} /></div>
            <div>
              <div className="oms-panel-title">Punch New Order</div>
              <div className="oms-panel-sub">Walk-in · Field · Workshop</div>
            </div>
          </div>

          <div className="oms-svc-tabs">
            {SERVICE_TYPES.map(({ key, label, color }) => {
              const Icon = SERVICE_ICONS[key];
              const active = form.Service_Type === key;
              return (
                <button
                  type="button"
                  key={key}
                  className={`oms-svc-tab ${active ? 'active' : ''}`}
                  style={active ? { borderColor: color, color, background: `${color}10` } : undefined}
                  onClick={() => setForm((f) => ({ ...f, Service_Type: key }))}
                >
                  <Icon size={14} /> {label}
                </button>
              );
            })}
          </div>

          <div className="form-grid">
            <Field label="Customer Name *">
              <input value={form.Customer_Name} onChange={set('Customer_Name')} placeholder="e.g. Ravi Sharma" required />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.Customer_Phone} onChange={set('Customer_Phone')} placeholder="+971 50 000 0000" />
            </Field>
            <Field label="Email" wide>
              <input type="email" value={form.Customer_Email} onChange={set('Customer_Email')} placeholder="customer@example.com" />
            </Field>
            <Field label="Product (inventory)" wide>
              <ProductPicker value={selectedProduct} onChange={pickProduct} />
            </Field>
            <Field label="Device / Item description" wide>
              <input
                value={form.Device_Description}
                onChange={set('Device_Description')}
                placeholder="e.g. iPhone 14 Pro Max 256GB Space Black"
              />
            </Field>
            <Field label="Amount (AED)">
              <input type="number" min="0" step="0.01" value={form.Amount} onChange={set('Amount')} placeholder="0.00" />
            </Field>
            <Field label="Payment Mode">
              <select value={form.Payment_Mode} onChange={set('Payment_Mode')}>
                {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
          </div>

          {isRepair && (
            <ConditionalGroup label="Repair Details" icon={Wrench}>
              <Field label="Fault Description" wide>
                <input value={form.Fault_Description} onChange={set('Fault_Description')} placeholder="e.g. Cracked screen, battery draining fast" />
              </Field>
              <Field label="Estimated Delivery">
                <input type="date" value={form.Estimated_Delivery} onChange={set('Estimated_Delivery')} />
              </Field>
              <Field label="Technician">
                <select value={form.Technician} onChange={set('Technician')}>
                  {TECHNICIANS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </ConditionalGroup>
          )}

          {isTradeIn && (
            <ConditionalGroup label="Trade-In Details" icon={RefreshCw}>
              <Field label="Trade-In Value (AED)">
                <input type="number" min="0" step="0.01" value={form.Trade_In_Value} onChange={set('Trade_In_Value')} />
              </Field>
            </ConditionalGroup>
          )}

          {isRent && (
            <ConditionalGroup label="Rental Period" icon={Calendar}>
              <Field label="Start Date">
                <input type="date" value={form.Rental_Start_Date} onChange={set('Rental_Start_Date')} />
              </Field>
              <Field label="End Date">
                <input type="date" value={form.Rental_End_Date} onChange={set('Rental_End_Date')} />
              </Field>
            </ConditionalGroup>
          )}

          <div className="form-grid">
            <Field label="Handled By">
              <input value={form.Handled_By} onChange={set('Handled_By')} placeholder="Staff / agent name" />
            </Field>
            <Field label="Location">
              <select value={form.Location} onChange={set('Location')}>
                {ORDER_LOCATIONS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.Status} onChange={set('Status')}>
                {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Notes" wide>
              <textarea
                rows={2}
                value={form.Notes}
                onChange={set('Notes')}
                placeholder="Accessories included, customer requests, condition notes…"
              />
            </Field>
          </div>

          <button type="submit" className="btn btn-primary oms-submit" disabled={saving}>
            {saving ? 'Saving…' : 'Punch Order'}
          </button>
        </form>

        {/* ── Orders Table ── */}
        <div className="oms-panel">
          <div className="oms-panel-head">
            <div className="oms-panel-head-icon"><FileText size={16} /></div>
            <div>
              <div className="oms-panel-title">Order Log</div>
              <div className="oms-panel-sub">{stats.total} total · {stats.pending} pending</div>
            </div>
          </div>

          <div className="oms-toolbar">
            <div className="oms-search">
              <Search size={14} />
              <input
                type="text"
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                placeholder="Search by name, order ID, device…"
              />
            </div>
            <select value={filters.service} onChange={(e) => setFilters((f) => ({ ...f, service: e.target.value }))}>
              <option value="All">All services</option>
              {SERVICE_TYPES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="All">All statuses</option>
              {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={filters.location} onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}>
              <option value="All">All locations</option>
              {ORDER_LOCATIONS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div className="oms-table-wrap">
            <table className="oms-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Device</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loadingOrders && (
                  <tr><td colSpan={8} className="oms-empty">Loading…</td></tr>
                )}
                {!loadingOrders && orderRows.length === 0 && (
                  <tr><td colSpan={8} className="oms-empty">No orders yet — punch your first one →</td></tr>
                )}
                {!loadingOrders && orderRows.map((o) => {
                  const svc = SERVICE_TYPES.find((s) => s.key === o.Service_Type);
                  return (
                    <tr key={o.ID}>
                      <td className="oms-order-id">{o.Order_ID || o.ID}</td>
                      <td>
                        <div className="oms-cust-name">{o.Customer_Name}</div>
                        {o.Customer_Phone && <div className="oms-cust-phone">{o.Customer_Phone}</div>}
                      </td>
                      <td>
                        <span className="oms-svc-badge" style={svc ? { background: `${svc.color}15`, color: svc.color } : undefined}>
                          {o.Service_Type}
                        </span>
                      </td>
                      <td className="oms-device-cell">{o.Device_Description || o.Product_SKU}</td>
                      <td className="oms-amount">AED {Number(o.Amount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`oms-status oms-status-${String(o.Status || '').replace(/[\s-]+/g, '')}`}>
                          {o.Status}
                        </span>
                      </td>
                      <td className="oms-date">{o.Order_Date || (o.Added_Time || '').slice(0, 10)}</td>
                      <td>
                        <div className="oms-row-actions">
                          <button className="oms-icon-btn" title="View / Edit" onClick={() => setOpenOrder(o)}>
                            <Eye size={13} />
                          </button>
                          <button className="oms-icon-btn danger" title="Delete" onClick={() => removeOrder(o)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openOrder && (
        <OrderDetailModal
          order={openOrder}
          onClose={() => setOpenOrder(null)}
          onSaved={refreshAll}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, color, value, label }) {
  return (
    <div className={`oms-stat oms-stat-${color}`}>
      <div className="oms-stat-icon"><Icon size={18} /></div>
      <div className="oms-stat-val">{value}</div>
      <div className="oms-stat-lbl">{label}</div>
    </div>
  );
}

function Field({ label, wide = false, children }) {
  return (
    <div className={`form-field ${wide ? 'wide' : ''}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function ConditionalGroup({ label, icon: Icon, children }) {
  return (
    <div className="oms-cond-group">
      <div className="oms-cond-label"><Icon size={13} /> {label}</div>
      <div className="form-grid">{children}</div>
    </div>
  );
}
