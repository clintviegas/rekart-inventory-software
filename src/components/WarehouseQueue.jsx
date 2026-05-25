import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Warehouse, RefreshCw, CheckCircle, Clock, Truck, MessageCircle } from 'lucide-react';
import { fetchWarehouseQueue, dispatchOrder, updateOrder } from '../api/omsApi';
import { SERVICE_TYPES } from '../schema';

const STATUS_COLORS = {
  Pending: { bg: '#fff7ed', color: '#c2410c', label: 'Pending Dispatch' },
  Processing: { bg: '#eff6ff', color: '#1d4ed8', label: 'In Transit' },
};

export default function WarehouseQueue() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWarehouseQueue();
      setOrders(res.data || []);
      setLastRefresh(new Date());
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 60 seconds so the warehouse screen stays live
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const markDispatched = async (order) => {
    try {
      await dispatchOrder(order.ID || order._id);
      toast.success(`${order.Order_ID} marked as Dispatched (Processing)`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
  };

  const markCompleted = async (order) => {
    try {
      await updateOrder(order.ID || order._id, { Status: 'Completed' });
      toast.success(`${order.Order_ID} marked Completed`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
  };

  const openWhatsApp = (order) => {
    const phone = order.Customer_Phone?.replace(/\D/g, '');
    if (!phone) { toast.error('No phone number on this order'); return; }
    const msg = encodeURIComponent(
      `Hi ${order.Customer_Name}, your order ${order.Order_ID} for ${order.Device_Description || order.Product_SKU} has been dispatched from our Sharjah warehouse. Thank you for choosing Rekart!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const pending = orders.filter((o) => o.Status === 'Pending');
  const inTransit = orders.filter((o) => o.Status === 'Processing');

  return (
    <div className="wh-page">
      {/* Header */}
      <div className="wh-header">
        <div className="wh-header-left">
          <Warehouse size={22} className="wh-icon" />
          <div>
            <h2 className="wh-title">Warehouse Queue</h2>
            <div className="wh-sub">
              Sharjah Warehouse — outbound orders needing dispatch
              {lastRefresh && (
                <span className="wh-refresh-time"> · refreshed {lastRefresh.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="wh-stats">
        <div className="wh-stat wh-stat-amber">
          <Clock size={18} />
          <div className="wh-stat-val">{pending.length}</div>
          <div className="wh-stat-lbl">Awaiting Dispatch</div>
        </div>
        <div className="wh-stat wh-stat-blue">
          <Truck size={18} />
          <div className="wh-stat-val">{inTransit.length}</div>
          <div className="wh-stat-lbl">In Transit</div>
        </div>
        <div className="wh-stat wh-stat-green">
          <CheckCircle size={18} />
          <div className="wh-stat-val">{orders.length}</div>
          <div className="wh-stat-lbl">Active Orders</div>
        </div>
      </div>

      {/* Empty */}
      {!loading && orders.length === 0 && (
        <div className="wh-empty">
          <CheckCircle size={40} strokeWidth={1.5} />
          <p>All clear — no pending orders at the warehouse.</p>
        </div>
      )}

      {/* Pending Dispatch section */}
      {pending.length > 0 && (
        <section className="wh-section">
          <div className="wh-section-title">
            <Clock size={15} /> Awaiting Dispatch ({pending.length})
          </div>
          <div className="wh-cards">
            {pending.map((o) => (
              <OrderCard
                key={o.ID || o._id}
                order={o}
                onDispatch={() => markDispatched(o)}
                onWhatsApp={() => openWhatsApp(o)}
                onComplete={() => markCompleted(o)}
              />
            ))}
          </div>
        </section>
      )}

      {/* In Transit section */}
      {inTransit.length > 0 && (
        <section className="wh-section">
          <div className="wh-section-title wh-section-title-blue">
            <Truck size={15} /> In Transit ({inTransit.length})
          </div>
          <div className="wh-cards">
            {inTransit.map((o) => (
              <OrderCard
                key={o.ID || o._id}
                order={o}
                onComplete={() => markCompleted(o)}
                onWhatsApp={() => openWhatsApp(o)}
                isTransit
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OrderCard({ order, onDispatch, onComplete, onWhatsApp, isTransit }) {
  const svc = SERVICE_TYPES.find((s) => s.key === order.Service_Type);
  const color = svc?.color || '#6b7280';

  return (
    <div className={`wh-card ${isTransit ? 'wh-card-transit' : ''}`}>
      <div className="wh-card-top">
        <div className="wh-card-id">{order.Order_ID}</div>
        <span className="oms-svc-badge" style={{ background: `${color}15`, color }}>
          {order.Service_Type}
        </span>
      </div>
      <div className="wh-card-customer">
        <strong>{order.Customer_Name}</strong>
        {order.Customer_Phone && <span className="wh-phone">{order.Customer_Phone}</span>}
      </div>
      <div className="wh-card-product">
        {order.Device_Description || order.Product_SKU || '—'}
      </div>
      <div className="wh-card-meta">
        <span className="wh-meta-item">📍 {order.Location || 'Dubai — HQ'}</span>
        {order.Amount > 0 && <span className="wh-meta-item">AED {Number(order.Amount).toLocaleString()}</span>}
        <span className="wh-meta-item">🗓 {order.Order_Date || '—'}</span>
      </div>
      {order.Notes && (
        <div className="wh-card-notes">💬 {order.Notes}</div>
      )}
      <div className="wh-card-actions">
        {!isTransit && (
          <button className="btn btn-primary wh-btn" onClick={onDispatch}>
            <Truck size={13} /> Mark Dispatched
          </button>
        )}
        {isTransit && (
          <button className="btn btn-primary wh-btn wh-btn-green" onClick={onComplete}>
            <CheckCircle size={13} /> Mark Delivered
          </button>
        )}
        <button className="btn btn-secondary wh-btn" onClick={onWhatsApp} title="Send WhatsApp to customer">
          <MessageCircle size={13} /> WhatsApp
        </button>
      </div>
    </div>
  );
}
