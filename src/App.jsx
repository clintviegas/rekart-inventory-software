import { useState, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { FileText, List } from 'lucide-react';
import { useFormContext } from './context/FormContext';
import Sidebar from './components/Sidebar';
import ProductMaster from './components/ProductMaster';
import DeviceTracking from './components/DeviceTracking';
import InventoryStock from './components/InventoryStock';
import PricingMargin from './components/PricingMargin';
import RefurbishmentGrade from './components/RefurbishmentGrade';
import MarketplaceChannels from './components/MarketplaceChannels';
import Dashboard from './components/Dashboard';
import OrderDesk from './components/OrderDesk';
import RecordsTable from './components/RecordsTable';
import EditRecordModal from './components/EditRecordModal';
import { SECTION_LABELS } from './schema';
import { createRecord } from './api/zohoApi';
import './App.css';

const PANELS = {
  product: ProductMaster,
  device: DeviceTracking,
  inventory: InventoryStock,
  pricing: PricingMargin,
  refurbishment: RefurbishmentGrade,
  marketplace: MarketplaceChannels,
  oms: OrderDesk,
  dashboard: Dashboard,
};

// Sections that manage their own create flow — App-level "Save" should be hidden.
const SELF_MANAGED_SECTIONS = new Set(['oms', 'dashboard']);

export default function App() {
  const { state, dispatch } = useFormContext();
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('form');
  const [editRecord, setEditRecord] = useState(null);
  const recordsRef = useRef(null);
  const ActivePanel = PANELS[state.activeSection];
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
      toast.success(`${SECTION_LABELS[section]} record saved to Zoho Creator!`);
      dispatch({ type: 'RESET_FORM', section });
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    const sections = Object.keys(PANELS).filter(k => k !== 'dashboard');
    const filled = sections.filter(
      (s) => state[s] && Object.keys(state[s]).length > 0
    );

    if (filled.length === 0) {
      toast.error('No data to save. Fill in at least one section.');
      return;
    }

    setSaving(true);
    let success = 0;
    let failed = 0;

    for (const section of filled) {
      try {
        await createRecord(section, state[section]);
        dispatch({ type: 'RESET_FORM', section });
        success++;
      } catch {
        failed++;
      }
    }

    setSaving(false);
    if (failed === 0) {
      toast.success(`All ${success} section(s) saved to Zoho Creator!`);
    } else {
      toast.error(`${success} saved, ${failed} failed. Check console.`);
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
        formState={state}
      />
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <h2 className="page-title">Rekart Inventory — Zoho Creator</h2>
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
          {!isSelfManaged && viewMode === 'form' && (
            <div className="top-actions">
              <button className="btn btn-secondary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Section'}
              </button>
              <button className="btn btn-primary" onClick={handleSaveAll} disabled={saving}>
                {saving ? 'Saving…' : 'Save All'}
              </button>
            </div>
          )}
        </header>
        <div className="panel-container">
          {/* Linked SKU banner — shown on non-product forms when a SKU is set */}
          {!isSelfManaged && state.activeSection !== 'product' && state.product?.SKU && (
            <div className="linked-sku-banner">
              <span className="linked-sku-label">Working on SKU</span>
              <strong>{state.product.SKU}</strong>
              {state.product?.Product_Name && (
                <span className="linked-sku-name">— {state.product.Product_Name}</span>
              )}
            </div>
          )}
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

      {/* Edit modal */}
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
