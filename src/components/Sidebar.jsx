import { useState } from 'react';
import {
  ClipboardList, Warehouse, Users, Package, BarChart2,
  Cpu, DollarSign, Wrench, ShoppingCart, ChevronDown, ChevronRight,
  LayoutDashboard,
} from 'lucide-react';

const OPERATIONS = [
  { key: 'oms',       label: 'Order Desk',       icon: ClipboardList },
  { key: 'warehouse', label: 'Warehouse Queue',   icon: Warehouse },
];

const CATALOGUE = [
  { key: 'products',   label: 'Products',          icon: Package },
  { key: 'inventory',  label: 'Inventory & Stock',  icon: LayoutDashboard },
];

// These are still accessible but collapsed under Advanced
const ADVANCED = [
  { key: 'device',        label: 'Device Tracking',   icon: Cpu },
  { key: 'pricing',       label: 'Pricing & Margin',  icon: DollarSign },
  { key: 'refurbishment', label: 'Refurbishment',     icon: Wrench },
  { key: 'marketplace',   label: 'Marketplace',       icon: ShoppingCart },
];

export default function Sidebar({ active, onSelect }) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const isAdvancedActive = ADVANCED.some((a) => a.key === active);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">R</div>
        <div>
          <div className="sidebar-brand-name">Rekart</div>
          <div className="sidebar-brand-sub">Order Management</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* Operations */}
        <div className="sidebar-group-label">Operations</div>
        {OPERATIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`sidebar-item ${active === key ? 'active' : ''}`}
            onClick={() => onSelect(key)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}

        <div className="sidebar-divider" />

        {/* Catalogue */}
        <div className="sidebar-group-label">Catalogue</div>
        {CATALOGUE.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`sidebar-item ${active === key ? 'active' : ''}`}
            onClick={() => onSelect(key)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}

        <div className="sidebar-divider" />

        {/* Advanced — collapsed by default */}
        <button
          className={`sidebar-item sidebar-advanced-toggle ${isAdvancedActive ? 'active' : ''}`}
          onClick={() => setAdvancedOpen((o) => !o)}
        >
          <Wrench size={17} />
          <span>Advanced</span>
          {advancedOpen || isAdvancedActive
            ? <ChevronDown size={13} className="sidebar-chevron" />
            : <ChevronRight size={13} className="sidebar-chevron" />
          }
        </button>
        {(advancedOpen || isAdvancedActive) && ADVANCED.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`sidebar-item sidebar-item-sub ${active === key ? 'active' : ''}`}
            onClick={() => onSelect(key)}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}

        <div className="sidebar-divider" />

        {/* Dashboard / Reports */}
        <button
          className={`sidebar-item ${active === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelect('dashboard')}
        >
          <BarChart2 size={17} />
          <span>Reports</span>
        </button>
      </nav>
    </aside>
  );
}
