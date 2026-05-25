import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { searchProducts } from '../api/omsApi';

/*
 * Searchable product combobox.
 * Calls /api/oms/products/search and returns Product_Master rows enriched
 * with current Available_Stock from Inventory_Stock.
 *
 * Props:
 *   value           — { sku, name } | null
 *   onChange(item)  — fires when a product is picked (or cleared)
 *   placeholder
 */
export default function ProductPicker({ value, onChange, placeholder = 'Search by SKU, name, or brand…' }) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchProducts(trimmed);
        setResults(res?.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(handle);
  }, [query, open]);

  const pick = (item) => {
    onChange(item);
    setQuery(item.name || item.sku);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="product-picker" ref={wrapRef}>
      <div className="picker-input-wrap">
        <Search size={14} className="picker-icon" />
        <input
          type="text"
          className="picker-input"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); if (value) onChange(null); }}
        />
        {value && (
          <button type="button" className="picker-clear" onClick={clear} aria-label="Clear">×</button>
        )}
      </div>
      {open && (query.trim().length >= 2) && (
        <div className="picker-menu">
          {loading && <div className="picker-empty">Searching…</div>}
          {!loading && results.length === 0 && <div className="picker-empty">No matches</div>}
          {!loading && results.map((r) => (
            <button
              type="button"
              key={r.id}
              className="picker-item"
              onClick={() => pick(r)}
            >
              <div className="picker-item-main">
                <div className="picker-item-name">{r.name || '(no name)'}</div>
                <div className="picker-item-meta">
                  <span className="picker-sku">{r.sku}</span>
                  {r.brand && <span>· {r.brand}</span>}
                  {r.storage && <span>· {r.storage}</span>}
                  {r.color && <span>· {r.color}</span>}
                </div>
              </div>
              <div className="picker-item-right">
                {r.retailPrice != null && (
                  <span className="picker-price">AED {Number(r.retailPrice).toLocaleString()}</span>
                )}
                {r.available == null ? (
                  <span className="picker-stock-none">no stock</span>
                ) : (
                  <span className={r.available > 0 ? 'picker-stock-ok' : 'picker-stock-out'}>
                    {r.available} avail
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
