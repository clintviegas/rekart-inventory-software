import { Package, Cpu, Warehouse, DollarSign, Wrench, ShoppingCart, BarChart2, ClipboardList } from 'lucide-react';

const SECTIONS = [
  { key: 'product',       label: 'Product Master',    icon: Package },
  { key: 'device',        label: 'Device Tracking',   icon: Cpu },
  { key: 'inventory',     label: 'Inventory & Stock', icon: Warehouse },
  { key: 'pricing',       label: 'Pricing & Margin',  icon: DollarSign },
  { key: 'refurbishment', label: 'Refurbishment',     icon: Wrench },
  { key: 'marketplace',   label: 'Marketplace',       icon: ShoppingCart },
  { key: 'oms',           label: 'Order Desk',        icon: ClipboardList },
];

export default function Sidebar({ active, onSelect, formState = {} }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Rekart</h1>
        <span>Zoho Creator</span>
      </div>
      <nav>
        {SECTIONS.map(({ key, label, icon: Icon }) => {
          const hasDraft = formState[key] && Object.keys(formState[key]).length > 0;
          return (
            <button
              key={key}
              className={`sidebar-item ${active === key ? 'active' : ''}`}
              onClick={() => onSelect(key)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {hasDraft && (
                <span className="sidebar-dot" title="Draft data not yet saved" />
              )}
            </button>
          );
        })}

        <div className="sidebar-divider" />

        <button
          className={`sidebar-item ${active === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelect('dashboard')}
        >
          <BarChart2 size={18} />
          <span>Data Model</span>
        </button>
      </nav>
    </aside>
  );
}
