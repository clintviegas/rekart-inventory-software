import { useState, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { FileText, List } from 'lucide-react';
import { useFormContext } from './context/FormContext';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

// Operations
import OrderDesk from './components/OrderDesk';
import WarehouseQueue from './components/WarehouseQueue';

// Catalogue
import ProductCatalogue from './components/ProductCatalogue';
import InventoryStock from './components/InventoryStock';

// Advanced (legacy form-based sections — still accessible)
import DeviceTracking from './components/DeviceTracking';
import PricingMargin from './components/PricingMargin';
import RefurbishmentGrade from './components/RefurbishmentGrade';
import MarketplaceChannels from './components/MarketplaceChannels';

// Reports / Dashboard
import Dashboard from './components/Dashboard';

import RecordsTable from './components/RecordsTable';
import EditRecordModal from './components/EditRecordModal';
import { SECTION_LABELS } from './schema';
import { createRecord } from './api/zohoApi';
import './App.css';

const PANELS = {
  // Operations
  oms:       OrderDesk,
  warehouse: WarehouseQueue,

  // Catalogue — self-managed
  products:  ProductCatalogue,
  inventory: InventoryStock,

  // Advanced (legacy form views)
  device:        DeviceTracking,
  pricing:       PricingMargin,
  refurbishment: RefurbishmentGrade,
  marketplace:   MarketplaceChannels,

  // Reports
  dashboard: Dashboard,
};

// Sections that manage their own UI — no top-bar Save/Records toggle needed.
const SELF_MANAGED_SECTIONS = new Set(['oms', 'dashboard', 'warehouse', 'products']);

export default function App() {
  const { state, dispatch } = useFormContext();
  const { user, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('form');
  const [editRecord, setEditRecord] = useState(null);
  const recordsRef = useRef(null);
  const ActivePanel = PANELS[state.activeSection] || OrderDesk;
  const isSelfManaged = SELF_MANAGED_SECTIONS.has(state.activeSection);

  const handleSave = async () => {
    const section = state.activeSection;
    const data = state[section];

    if (!data || Object.keys(data).length === 0) {
      toast.error('Please fill in at least one field before saving.');
      return;
    }

    setSaving(true);
    try {
      await createRecord(section, data);
      toast.success(`${SECTION_LABELS[section] || section} record saved!`);
      dispatch({ type: 'RESET_FORM', section });
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSectionChange = (key) => {
    dispatch({ type: 'SET_SECTION', payload: key });
    setViewMode('form');
  };

  return (
    <div className="app-layout">
      <Toaster position="top-right" />
      <Sidebar
        active={state.activeSection}
        onSelect={handleSectionChange}
      />
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <h2 className="page-title">Rekart OMS</h2>
            {!isSelfManaged && (
              <div className="view-toggle">
                <button
                  className={`toggle-btn ${viewMode === 'form' ? 'active' : ''}`}
                  onClick={() => setViewMode('form')}
                >
                  <FileText size={13} /> Form
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'records' ? 'active' : ''}`}
                  onClick={() => setViewMode('records')}
                >
                  <List size={13} /> Records
                </button>
              </div>
            )}
          </div>
          <div className="top-actions">
            {!isSelfManaged && viewMode === 'form' && (
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            )}
            {user && (
              <div className="user-chip" title={user.email}>
                <span className="user-chip-avatar">
                  {(user.name || user.email || '?').slice(0, 1).toUpperCase()}
                </span>
                <span className="user-chip-name">{user.name || user.email}</span>
                <button className="user-chip-logout" onClick={logout}>Sign out</button>
              </div>
            )}
          </div>
        </header>
        <div className="panel-container">
          {!isSelfManaged && viewMode === 'records' ? (
            <RecordsTable
              ref={recordsRef}
              section={state.activeSection}
              onEdit={(row) => setEditRecord(row)}
            />
          ) : (
            <ActivePanel />
          )}
        </div>
      </main>

      {editRecord && (
        <EditRecordModal
          section={state.activeSection}
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={() => recordsRef.current?.reload?.()}
        />
      )}
    </div>
  );
}
