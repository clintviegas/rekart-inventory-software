import { useState } from 'react';
import toast from 'react-hot-toast';
import { ORDER_STATUSES } from '../schema';
import { updateOrder } from '../api/omsApi';

const FIELD_LABELS = {
  Customer_Name: 'Customer',
  Customer_Phone: 'Phone',
  Customer_Email: 'Email',
  Service_Type: 'Service',
  Product_SKU: 'SKU',
  Device_Description: 'Device / Item',
  Amount: 'Amount',
  Payment_Mode: 'Payment',
  Order_Date: 'Date',
  Location: 'Location',
  Handled_By: 'Handled by',
  Fault_Description: 'Fault',
  Estimated_Delivery: 'Est. delivery',
  Technician: 'Technician',
  Trade_In_Value: 'Trade-In value',
  Rental_Start_Date: 'Rental start',
  Rental_End_Date: 'Rental end',
  Stock_Adjusted: 'Stock adjusted',
};
const FULL_WIDTH = new Set(['Notes', 'Device_Description', 'Fault_Description']);

export default function OrderDetailModal({ order, onClose, onSaved }) {
  const [status, setStatus] = useState(order.Status || 'Pending');
  const [notes, setNotes] = useState(order.Notes || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateOrder(order.ID || order._id, { Status: status, Notes: notes });
      toast.success('Order updated');
      onSaved?.(updated);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const orderedFields = [
    'Customer_Name', 'Customer_Phone', 'Customer_Email',
    'Service_Type', 'Product_SKU', 'Device_Description',
    'Amount', 'Payment_Mode', 'Order_Date',
    'Location', 'Handled_By', 'Stock_Adjusted',
    'Fault_Description', 'Estimated_Delivery', 'Technician',
    'Trade_In_Value', 'Rental_Start_Date', 'Rental_End_Date',
  ].filter((k) => order[k] != null && order[k] !== '');

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="order-modal">
        <div className="order-modal-head">
          <div>
            <div className="order-modal-id">{order.Order_ID || order.ID}</div>
            <div className="order-modal-title">
              {order.Service_Type} · {order.Customer_Name}
            </div>
          </div>
          <button className="order-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="order-modal-body">
          <div className="detail-grid">
            {orderedFields.map((k) => (
              <div key={k} className={`detail-cell ${FULL_WIDTH.has(k) ? 'full' : ''}`}>
                <span className="detail-label">{FIELD_LABELS[k] || k}</span>
                <span className="detail-value">
                  {k === 'Amount' ? `AED ${Number(order[k] || 0).toLocaleString()}` : String(order[k])}
                </span>
              </div>
            ))}
          </div>

          <div>
            <div className="detail-label" style={{ marginBottom: 6 }}>Status</div>
            <div className="status-pills">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`status-pill ${status === s ? 'active' : ''}`}
                  onClick={() => setStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-cell full">
            <span className="detail-label">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{
                padding: '8px 10px',
                border: '1px solid rgba(13,31,60,0.12)',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        <div className="order-modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
