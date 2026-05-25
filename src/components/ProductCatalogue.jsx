import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  Package, Plus, Upload, Search, Edit2, Trash2, X, Save, ChevronDown,
} from 'lucide-react';
import { fetchProducts, createProduct, updateProduct, deleteProduct, importProducts } from '../api/productsApi';

const EMPTY_PRODUCT = {
  SKU: '', Product_Name: '', Brand1: '', Series: '', Storage_RAM: '',
  Color: '', Processor: '', Screen_Size: '', OS: '', Product_Type: 'Refurbished',
  Retail_Selling_Price: '', Wholesale_Price: '', Available_Stock: 0,
  Warehouse_Location: 'Sharjah — Warehouse',
};

const PRODUCT_TYPES = ['Refurbished', 'New', 'Open Box', 'Used', 'Parts Only'];
const WAREHOUSES = ['Sharjah — Warehouse', 'Dubai — HQ', 'In Transit'];

// Maps Excel column headers from PRICELIST.xlsx to our schema
function mapExcelRow(raw) {
  const get = (keys) => {
    for (const k of keys) {
      const found = Object.keys(raw).find((h) => h.trim().toUpperCase() === k.toUpperCase());
      if (found && raw[found] != null && raw[found] !== '') return String(raw[found]).trim();
    }
    return '';
  };

  const model = get(['MODEL', 'Product_Name', 'Name', 'PRODUCT NAME']);
  const generation = get(['GENERATION', 'Series', 'GEN']);
  const capacity = get(['CAPACITY', 'Storage_RAM', 'STORAGE', 'RAM']);
  const retail = get(['RETAIL', 'Retail_Selling_Price', 'RETAIL PRICE', 'MRP']);
  const wholesale = get(['WHOLESALE', 'Wholesale_Price', 'WHOLESALE PRICE', 'WSP']);
  const brand = get(['BRAND', 'Brand1', 'BRAND NAME']) || inferBrand(model);
  const sku = get(['SKU', 'SKU_ID']) || buildSKU(brand, model, generation, capacity);

  return {
    SKU: sku,
    Product_Name: model,
    Brand1: brand,
    Series: generation,
    Storage_RAM: capacity,
    Retail_Selling_Price: retail ? Number(retail) : null,
    Wholesale_Price: wholesale ? Number(wholesale) : null,
    Category: 'Laptops',
    Product_Type: 'Refurbished',
    Available_Stock: 1,
    Warehouse_Location: 'Sharjah — Warehouse',
  };
}

function inferBrand(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('dell')) return 'Dell';
  if (n.includes('apple') || n.includes('macbook') || n.includes('mac book')) return 'Apple';
  if (n.includes('lenovo') || n.includes('thinkpad') || n.includes('ideapad')) return 'Lenovo';
  if (n.includes('hp') || n.includes('elitebook') || n.includes('probook') || n.includes('pavilion')) return 'HP';
  if (n.includes('asus')) return 'Asus';
  if (n.includes('acer')) return 'Acer';
  if (n.includes('microsoft') || n.includes('surface')) return 'Microsoft';
  if (n.includes('samsung')) return 'Samsung';
  if (n.includes('toshiba')) return 'Toshiba';
  return '';
}

function buildSKU(brand, model, generation, capacity) {
  const slug = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return [slug(brand), slug(model), slug(generation), slug(capacity)].filter(Boolean).join('-');
}

export default function ProductCatalogue() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [editItem, setEditItem] = useState(null); // null = closed, {} = new, {...} = editing
  const [importModal, setImportModal] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchProducts({ q: query, limit: 300 });
      setProducts(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  /* ── Edit / Add modal ──────────────────────────────────────── */
  const openAdd = () => setEditItem({ ...EMPTY_PRODUCT });
  const openEdit = (p) => setEditItem({ ...p });

  const saveEdit = async () => {
    if (!editItem.SKU || !editItem.Product_Name) {
      toast.error('SKU and Product Name are required');
      return;
    }
    setSaving(true);
    try {
      if (editItem._id || editItem.ID) {
        await updateProduct(editItem._id || editItem.ID, editItem);
        toast.success('Product updated');
      } else {
        await createProduct(editItem);
        toast.success('Product created');
      }
      setEditItem(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.Product_Name}" (${p.SKU})? This cannot be undone.`)) return;
    try {
      await deleteProduct(p._id || p.ID);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
  };

  /* ── Excel import ──────────────────────────────────────────── */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const mapped = raw.map(mapExcelRow).filter((r) => r.SKU && r.Product_Name);
        setImportRows(mapped);
        setImportModal(true);
      } catch (err) {
        toast.error('Could not parse file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!importRows.length) return;
    setImporting(true);
    try {
      const result = await importProducts(importRows);
      toast.success(`Imported: ${result.created} new · ${result.updated} updated${result.errors?.length ? ` · ${result.errors.length} errors` : ''}`);
      setImportModal(false);
      setImportRows([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setImporting(false);
    }
  };

  const setField = (k) => (e) => setEditItem((prev) => ({ ...prev, [k]: e.target.value }));

  /* ── Brand aggregation for filter chips ─────────────────────── */
  const brands = [...new Set(products.map((p) => p.Brand1).filter(Boolean))].sort();

  return (
    <div className="cat-page">
      {/* Header */}
      <div className="cat-header">
        <div>
          <h2 className="cat-title">Products</h2>
          <div className="cat-sub">{products.length} items in catalogue</div>
        </div>
        <div className="cat-header-actions">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Import Excel / CSV
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="cat-toolbar">
        <div className="cat-search">
          <Search size={14} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by SKU, name, brand, storage…"
          />
          {query && <button className="cat-clear" onClick={() => setQuery('')}><X size={12} /></button>}
        </div>
        <div className="cat-brand-chips">
          {brands.slice(0, 8).map((b) => (
            <button
              key={b}
              className={`cat-chip ${query === b ? 'active' : ''}`}
              onClick={() => setQuery(query === b ? '' : b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="cat-table-wrap">
        <table className="cat-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Brand</th>
              <th>Spec</th>
              <th>Type</th>
              <th>Retail (AED)</th>
              <th>Stock</th>
              <th>Warehouse</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="cat-empty">Loading…</td></tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={9} className="cat-empty">
                  No products yet — import your PRICELIST.xlsx or add one manually.
                </td>
              </tr>
            )}
            {!loading && products.map((p) => (
              <tr key={p._id || p.ID}>
                <td className="cat-sku">{p.SKU}</td>
                <td className="cat-name">{p.Product_Name}</td>
                <td>{p.Brand1}</td>
                <td className="cat-spec">{[p.Series, p.Storage_RAM].filter(Boolean).join(' · ')}</td>
                <td>
                  <span className={`cat-type cat-type-${(p.Product_Type || 'Refurbished').replace(/\s+/g, '')}`}>
                    {p.Product_Type || 'Refurbished'}
                  </span>
                </td>
                <td className="cat-price">
                  {p.Retail_Selling_Price != null ? `AED ${Number(p.Retail_Selling_Price).toLocaleString()}` : '—'}
                </td>
                <td>
                  <span className={`cat-stock ${(p.Available_Stock || 0) > 0 ? 'in' : 'out'}`}>
                    {p.Available_Stock ?? 0}
                  </span>
                </td>
                <td className="cat-wh">{p.Warehouse_Location || '—'}</td>
                <td>
                  <div className="cat-row-actions">
                    <button className="oms-icon-btn" title="Edit" onClick={() => openEdit(p)}>
                      <Edit2 size={13} />
                    </button>
                    <button className="oms-icon-btn danger" title="Delete" onClick={() => remove(p)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {editItem && (
        <div className="modal-backdrop" onClick={() => setEditItem(null)}>
          <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cat-modal-head">
              <Package size={16} />
              <span>{editItem._id || editItem.ID ? 'Edit Product' : 'Add Product'}</span>
              <button className="cat-modal-close" onClick={() => setEditItem(null)}><X size={16} /></button>
            </div>
            <div className="cat-modal-body">
              <div className="form-grid">
                <Field label="SKU *">
                  <input value={editItem.SKU} onChange={setField('SKU')} placeholder="DELL-LAT-5510-16GB" disabled={!!(editItem._id || editItem.ID)} />
                </Field>
                <Field label="Product Name *">
                  <input value={editItem.Product_Name} onChange={setField('Product_Name')} placeholder="Dell Latitude 5510" />
                </Field>
                <Field label="Brand">
                  <input value={editItem.Brand1} onChange={setField('Brand1')} placeholder="Dell" />
                </Field>
                <Field label="Generation / Series">
                  <input value={editItem.Series} onChange={setField('Series')} placeholder="10th Gen" />
                </Field>
                <Field label="Storage / RAM">
                  <input value={editItem.Storage_RAM} onChange={setField('Storage_RAM')} placeholder="256GB SSD / 8GB RAM" />
                </Field>
                <Field label="Color">
                  <input value={editItem.Color || ''} onChange={setField('Color')} placeholder="Silver" />
                </Field>
                <Field label="Processor">
                  <input value={editItem.Processor || ''} onChange={setField('Processor')} placeholder="Intel Core i5" />
                </Field>
                <Field label="OS">
                  <input value={editItem.OS || ''} onChange={setField('OS')} placeholder="Windows 11 Pro" />
                </Field>
                <Field label="Product Type">
                  <select value={editItem.Product_Type} onChange={setField('Product_Type')}>
                    {PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Warehouse">
                  <select value={editItem.Warehouse_Location || 'Sharjah — Warehouse'} onChange={setField('Warehouse_Location')}>
                    {WAREHOUSES.map((w) => <option key={w}>{w}</option>)}
                  </select>
                </Field>
                <Field label="Retail Price (AED)">
                  <input type="number" min="0" step="0.01" value={editItem.Retail_Selling_Price ?? ''} onChange={setField('Retail_Selling_Price')} placeholder="0.00" />
                </Field>
                <Field label="Wholesale Price (AED)">
                  <input type="number" min="0" step="0.01" value={editItem.Wholesale_Price ?? ''} onChange={setField('Wholesale_Price')} placeholder="0.00" />
                </Field>
                <Field label="Available Stock">
                  <input type="number" min="0" value={editItem.Available_Stock ?? 0} onChange={setField('Available_Stock')} />
                </Field>
              </div>
            </div>
            <div className="cat-modal-foot">
              <button className="btn btn-secondary" onClick={() => setEditItem(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {importModal && (
        <div className="modal-backdrop" onClick={() => setImportModal(false)}>
          <div className="import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cat-modal-head">
              <Upload size={16} />
              <span>Import Preview — {importRows.length} products</span>
              <button className="cat-modal-close" onClick={() => setImportModal(false)}><X size={16} /></button>
            </div>
            <p className="import-hint">
              Review the mapped rows below. Stock will be set to <strong>1</strong> for new items.
              Existing SKUs will be updated with the new prices.
            </p>
            <div className="import-table-wrap">
              <table className="cat-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Brand</th>
                    <th>Spec</th>
                    <th>Retail</th>
                    <th>Wholesale</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {importRows.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td className="cat-sku">{r.SKU}</td>
                      <td>{r.Product_Name}</td>
                      <td>{r.Brand1}</td>
                      <td>{[r.Series, r.Storage_RAM].filter(Boolean).join(' · ')}</td>
                      <td>{r.Retail_Selling_Price != null ? `AED ${r.Retail_Selling_Price}` : '—'}</td>
                      <td>{r.Wholesale_Price != null ? `AED ${r.Wholesale_Price}` : '—'}</td>
                      <td>{r.Available_Stock ?? 1}</td>
                    </tr>
                  ))}
                  {importRows.length > 50 && (
                    <tr><td colSpan={7} className="cat-empty">…and {importRows.length - 50} more</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="cat-modal-foot">
              <button className="btn btn-secondary" onClick={() => setImportModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmImport} disabled={importing}>
                <Upload size={14} /> {importing ? 'Importing…' : `Import ${importRows.length} Products`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
