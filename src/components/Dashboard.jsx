import { useState, useEffect } from 'react';
import { fetchRecords } from '../api/zohoApi';
import { Package, Cpu, Warehouse, DollarSign, Wrench, ShoppingCart, RefreshCw } from 'lucide-react';

const SECTIONS = [
  { key: 'product',       label: 'Product Master',    icon: Package,      color: '#1a73e8', role: 'Central dimension table — SKU is the primary key' },
  { key: 'device',        label: 'Device Tracking',   icon: Cpu,          color: '#9333ea', role: 'One-to-one per physical unit (IMEI / Serial)' },
  { key: 'inventory',     label: 'Inventory & Stock', icon: Warehouse,    color: '#0891b2', role: 'Stock levels & warehouse location per SKU' },
  { key: 'pricing',       label: 'Pricing & Margin',  icon: DollarSign,   color: '#16a34a', role: 'Cost, sell price & margin data per SKU' },
  { key: 'refurbishment', label: 'Refurbishment',     icon: Wrench,       color: '#d97706', role: 'Condition grading & QC results per unit' },
  { key: 'marketplace',   label: 'Marketplace',       icon: ShoppingCart, color: '#dc2626', role: 'Channel listing IDs & content per SKU' },
];

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const c = {};
    await Promise.allSettled(
      SECTIONS.map(async ({ key }) => {
        try {
          const res = await fetchRecords(key);
          c[key] = Array.isArray(res.data) ? res.data.length : 0;
        } catch {
          c[key] = null;
        }
      })
    );
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="form-section dashboard-section">

      {/* Header */}
      <div className="dash-header">
        <div>
          <h2>Data Model — Product 360°</h2>
          <p className="section-note">
            Star-schema view of your Zoho Creator data. Product Master is the central table;
            all other forms relate to it by <strong>SKU</strong> — just like a foreign key in Power BI or SQL.
          </p>
        </div>
        <button className="btn btn-secondary dash-refresh-btn" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Star schema diagram */}
      <div className="schema-diagram">
        <div className="schema-center">
          <Package size={24} color="#1a73e8" />
          <strong>Product Master</strong>
          <span className="schema-pk">SKU — Primary Key</span>
          <span className="schema-badge centre">Centre Table</span>
        </div>

        <div className="schema-arrow-col">
          {SECTIONS.slice(1).map(({ key }) => (
            <div key={key} className="schema-arrow">──▶</div>
          ))}
        </div>

        <div className="schema-spokes">
          {SECTIONS.slice(1).map(({ key, label, icon: Icon, color, role }) => (
            <div key={key} className="schema-node" style={{ borderColor: color }}>
              <div className="schema-node-title">
                <Icon size={14} color={color} />
                <strong style={{ color }}>{label}</strong>
              </div>
              <span className="schema-role">{role}</span>
              <span className="schema-fk" style={{ color }}>SKU — Foreign Key</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live record counts */}
      <h3>Live Record Counts — Zoho Creator</h3>
      <div className="dash-counts">
        {SECTIONS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="dash-count-card" style={{ borderTopColor: color }}>
            <Icon size={22} color={color} />
            <div className="dash-count-num" style={{ color }}>
              {loading ? '…' : (counts[key] ?? '—')}
            </div>
            <div className="dash-count-label">{label}</div>
          </div>
        ))}
      </div>

      {/* How to link tip */}
      <div className="dash-tip">
        <strong>How linking works:</strong> Enter the same <code>SKU</code> value when filling
        Device Tracking, Inventory, Pricing, Refurbishment, and Marketplace — exactly like a foreign key
        relationship in Power BI or a relational database. Use the <strong>Records tab</strong> in each
        section to view what's been saved to Zoho Creator.
        <br /><br />
        <strong>Zoho ID format:</strong> IDs like <code>4876766000000039002</code> are 19-digit globally
        unique identifiers. The prefix <code>4876766</code> is your Zoho portal/account ID — all records
        across your entire Zoho account share this prefix. The trailing digits are the sequential record number.
        This is Zoho's internal design and cannot be changed.
      </div>

    </div>
  );
}
