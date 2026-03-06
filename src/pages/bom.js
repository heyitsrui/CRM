import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import '../styles/bom.css';

const API_BASE_URL = `http://${window.location.hostname}:5000`;

// ─── Company / Vendor Registry ────────────────────────────────────────────────
// Each vendor maps to one of your 4 companies. Logos use SVG inline or img tag.
const VENDOR_REGISTRY = {
  ruijie: {
    label: 'Ruijie Networks',
    logoUrl: 'https://www.ruijienetworks.com/favicon.ico', // replace with your hosted logo path
    logoFallback: 'RJ',
    color: '#2563eb',
    bgColor: '#eff6ff',
    available: true,
  },
  cisco: {
    label: 'Cisco',
    logoUrl: 'https://www.cisco.com/favicon.ico',
    logoFallback: 'CS',
    color: '#00539F',
    bgColor: '#eff8ff',
    available: false,
  },
  aruba: {
    label: 'Aruba Networks',
    logoUrl: 'https://www.arubanetworks.com/favicon.ico',
    logoFallback: 'AR',
    color: '#FF8300',
    bgColor: '#fff7ed',
    available: false,
  },
  ubiquiti: {
    label: 'Ubiquiti',
    logoUrl: 'https://www.ui.com/favicon.ico',
    logoFallback: 'UI',
    color: '#0559C9',
    bgColor: '#eff6ff',
    available: false,
  },
};

// Category badge colors
const CAT_BADGE_COLOR = {
  'Router': 'blue',
  'Switch': 'purple',
  'Wireless / AP': 'green',
  'Access Controller': 'teal',
  'Firewall / Security': 'rose',
  'Switch Accessory': 'orange',
  'Software': 'gray',
};

// Segment tag colors
const SEGMENT_COLORS = {
  'Enterprise': { bg: '#dbeafe', text: '#1d4ed8' },
  'SME': { bg: '#dcfce7', text: '#16a34a' },
  'Data Center': { bg: '#f3e8ff', text: '#7c3aed' },
  'Enterprise / Data Center': { bg: '#fef3c7', text: '#d97706' },
  'SME / Enterprise': { bg: '#fce7f3', text: '#be185d' },
  'Enterprise/SME': { bg: '#fce7f3', text: '#be185d' },
};

let _nextId = 1;
const uid = () => _nextId++;

const formatDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ children, color = 'blue' }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}

function SegmentTag({ segment }) {
  const style = SEGMENT_COLORS[segment] || { bg: '#f3f4f6', text: '#374151' };
  return (
    <span style={{ background: style.bg, color: style.text, fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
      {segment}
    </span>
  );
}

function VendorLogo({ vendor }) {
  const [imgError, setImgError] = useState(false);
  const v = VENDOR_REGISTRY[vendor];
  if (!v) return null;

  if (!imgError) {
    return (
      <img
        src={v.logoUrl}
        alt={v.label}
        className="vendor-logo-img"
        onError={() => setImgError(true)}
        style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }}
      />
    );
  }
  return (
    <span className="vendor-logo-fallback" style={{ background: v.color, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '4px 6px' }}>
      {v.logoFallback}
    </span>
  );
}

function VendorCard({ vendorKey, vendor, active, onClick }) {
  const [imgError, setImgError] = useState(false);
  return (
    <button
      className={`vendor-card${active ? ' active' : ''}${!vendor.available ? ' unavailable' : ''}`}
      onClick={() => vendor.available && onClick(vendorKey)}
      style={{ '--vendor-color': vendor.color, '--vendor-bg': vendor.bgColor }}
    >
      <div className="vendor-card-logo">
        {!imgError ? (
          <img src={vendor.logoUrl} alt={vendor.label} onError={() => setImgError(true)}
            style={{ width: 36, height: 36, objectFit: 'contain' }} />
        ) : (
          <span style={{ background: vendor.color, color: '#fff', fontWeight: 700, fontSize: 13, borderRadius: 6, padding: '6px 8px' }}>
            {vendor.logoFallback}
          </span>
        )}
      </div>
      <span className="vendor-label">{vendor.label}</span>
      {!vendor.available && <span className="vendor-soon">Coming Soon</span>}
      {active && <span className="vendor-check">✓</span>}
    </button>
  );
}

function ProductCard({ product, onAdd }) {
  return (
    <div className="product-card">
      <div className="product-card-header">
        <span className="product-card-model">{product.model}</span>
        <Badge color={CAT_BADGE_COLOR[product.product_category] || 'blue'}>{product.product_category}</Badge>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        <SegmentTag segment={product.segment} />
        {product.poe && product.poe !== 'Non-PoE' && product.poe !== 'N/A' && (
          <span style={{ fontSize: 10, background: '#d1fae5', color: '#065f46', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>{product.poe}</span>
        )}
        {product.wireless_standard && product.wireless_standard !== '-' && (
          <span style={{ fontSize: 10, background: '#ede9fe', color: '#5b21b6', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>{product.wireless_standard}</span>
        )}
      </div>
      <span className="product-card-sub" style={{ marginTop: 6, display: 'block', fontSize: 12, color: '#6b7280' }}>{product.sub_category}</span>
      {product.notes && (
        <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginTop: 3 }}>{product.notes}</span>
      )}
      <div className="product-card-actions">
        <button className="product-card-add-btn" onClick={() => onAdd(product)}>+ Add to BOM</button>
      </div>
    </div>
  );
}

function BomLineItem({ item, onQtyChange, onRemove, onNoteChange }) {
  return (
    <tr>
      <td>
        <div className="bom-table-model">{item.model}</div>
        <div className="bom-table-vendor" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <VendorLogo vendor={item.vendor} />
          <span>{VENDOR_REGISTRY[item.vendor]?.label || item.vendor}</span>
        </div>
      </td>
      <td><Badge color={CAT_BADGE_COLOR[item.product_category] || 'blue'}>{item.product_category}</Badge></td>
      <td className="bom-table-sub">
        <div>{item.sub_category}</div>
        <SegmentTag segment={item.segment} />
      </td>
      <td>
        <div className="qty-controls">
          <button className="qty-btn" onClick={() => onQtyChange(item.id, Math.max(1, item.qty - 1))}>−</button>
          <input className="qty-input" type="number" min={1} value={item.qty}
            onChange={e => onQtyChange(item.id, Math.max(1, parseInt(e.target.value) || 1))} />
          <button className="qty-btn" onClick={() => onQtyChange(item.id, item.qty + 1)}>+</button>
        </div>
      </td>
      <td>
        <input className="note-input" placeholder="Notes…" value={item.note}
          onChange={e => onNoteChange(item.id, e.target.value)} />
      </td>
      <td>
        <button className="remove-btn" onClick={() => onRemove(item.id)}>✕</button>
      </td>
    </tr>
  );
}

function DraftCard({ draft, onLoad, onDelete, onForward }) {
  return (
    <div className="draft-card">
      <div className="draft-card-top">
        <div>
          <div className="draft-card-name">{draft.name}</div>
          <div className="draft-card-meta">
            {draft.item_count ?? draft.items?.length ?? 0} items · {formatDate(draft.saved_at || draft.savedAt)}
          </div>
        </div>
        <span className={`draft-status-badge ${draft.status}`}>{draft.status}</span>
      </div>
      <div className="draft-card-actions">
        <button className="draft-btn-load" onClick={() => onLoad(draft)}>Load</button>
        <button className="draft-btn-forward" onClick={() => onForward(draft)}>→ Forward to Finance</button>
        <button className="draft-btn-delete" onClick={() => onDelete(draft.id)}>Delete</button>
      </div>
    </div>
  );
}

function SaveDraftModal({ onSave, onClose, existingName }) {
  const [name, setName] = useState(existingName || `BOM Draft ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Save Draft</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="modal-label">Draft Name</label>
          <input className="modal-input" value={name} onChange={e => setName(e.target.value)} autoFocus />
          <div className="modal-footer-actions">
            <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="modal-save-btn" onClick={() => name.trim() && onSave(name.trim())}>Save Draft</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForwardModal({ draft, onConfirm, onClose }) {
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Forward to Finance</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-desc">Forwarding <strong>{draft.name}</strong> ({draft.item_count ?? draft.items?.length} items) for pricing.</p>
          <label className="modal-label">Finance Contact / Email</label>
          <input className="modal-input" placeholder="e.g. finance@company.com" value={recipient} onChange={e => setRecipient(e.target.value)} />
          <label className="modal-label" style={{ marginTop: 12 }}>Note (optional)</label>
          <textarea className="modal-textarea" placeholder="Any instructions for the finance team…" value={note} onChange={e => setNote(e.target.value)} rows={3} />
          <div className="modal-footer-actions">
            <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="modal-save-btn" onClick={() => onConfirm(draft, recipient, note)} disabled={!recipient.trim()}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────
function ImportModal({ onImport, onClose }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [vendor, setVendor] = useState('ruijie');

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    // Skip header rows (first 2 lines based on CSV format)
    const dataLines = lines.slice(2);
    const parsed = [];
    for (const line of dataLines) {
      // Handle quoted fields
      const cols = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') { inQ = !inQ; }
        else if (line[i] === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
        else { cur += line[i]; }
      }
      cols.push(cur.trim());
      if (cols.length >= 3 && cols[0]) {
        parsed.push({
          model: cols[0],
          segment: cols[1] || '',
          product_category: cols[2] || '',
          sub_category: cols[3] || '',
          wireless_standard: cols[4] || '',
          deployment: cols[5] || '',
          management_type: cols[6] || '',
          poe: cols[7] || '',
          tag_dc: cols[8]?.includes('✓') ? 1 : 0,
          tag_enterprise: cols[9]?.includes('✓') ? 1 : 0,
          tag_sme: cols[10]?.includes('✓') ? 1 : 0,
          notes: cols[13] || cols[11] || '',
          vendor: vendor,
        });
      }
    }
    return parsed;
  };

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv'].includes(ext)) { setError('Only CSV files are supported for import.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        if (!rows.length) { setError('No valid product rows found in file.'); return; }
        setPreview(rows.slice(0, 5));
        fileRef.current._parsed = rows;
      } catch (err) {
        setError('Failed to parse file. Please ensure it matches the expected format.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!fileRef.current?._parsed?.length) { setError('Please select a valid file first.'); return; }
    setImporting(true);
    try {
      await onImport(fileRef.current._parsed, vendor);
      onClose();
    } catch (err) {
      setError(err.message || 'Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">📥 Import Products from CSV</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#0369a1' }}>
            <strong>Expected CSV columns:</strong> Product Model, Segment, Product Category, Sub-Category, Wireless Standard, Deployment, Management Type, PoE, DC Tag, Enterprise Tag, SME Tag, Notes
          </div>

          <label className="modal-label">Vendor / Company</label>
          <select className="modal-input" value={vendor} onChange={e => setVendor(e.target.value)} style={{ marginBottom: 14 }}>
            {Object.entries(VENDOR_REGISTRY).map(([key, v]) => (
              <option key={key} value={key}>{v.label}</option>
            ))}
          </select>

          <label className="modal-label">Select CSV File</label>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange}
            style={{ display: 'block', marginBottom: 14, padding: '8px', border: '1px dashed #d1d5db', borderRadius: 8, width: '100%', cursor: 'pointer', background: '#fafafa' }} />

          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>⚠ {error}</p>}

          {preview.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Preview ({fileRef.current?._parsed?.length} rows found — showing first 5):
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Model', 'Segment', 'Category', 'Sub-Category', 'PoE'].map(h => (
                        <th key={h} style={{ padding: '5px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #f3f4f6', fontWeight: 600 }}>{row.model}</td>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #f3f4f6' }}>{row.segment}</td>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #f3f4f6' }}>{row.product_category}</td>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #f3f4f6' }}>{row.sub_category}</td>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #f3f4f6' }}>{row.poe}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="modal-footer-actions">
            <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="modal-save-btn" onClick={handleImport} disabled={importing || !preview.length}>
              {importing ? '⏳ Importing…' : `📥 Import ${fileRef.current?._parsed?.length || 0} Products`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main BOM Component ───────────────────────────────────────────────────────
const Bom = ({ loggedInUser }) => {
  const [activeVendor, setActiveVendor] = useState('ruijie');
  const [activeSegment, setActiveSegment] = useState('ALL');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeSubcategory, setActiveSubcategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [bomList, setBomList] = useState([]);
  const [tab, setTab] = useState('catalog');

  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [currentDraftName, setCurrentDraftName] = useState('');
  const [forwardTarget, setForwardTarget] = useState(null);
  const [forwardSuccess, setForwardSuccess] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch products from DB ──
  const fetchProducts = useCallback(async (vendorKey) => {
    setLoadingProducts(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bom/products`, { params: { vendor: vendorKey } });
      if (res.data.success) setProducts(res.data.products);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => { fetchProducts(activeVendor); }, [activeVendor, fetchProducts]);

  // ── Fetch drafts ──
  const fetchDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bom/drafts`);
      if (res.data.success) setDrafts(res.data.drafts);
    } catch (err) {
      console.error('Failed to load drafts:', err);
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const vendor = VENDOR_REGISTRY[activeVendor];

  // ── Filter derived data ──
  const segments = useMemo(() => {
    const s = new Set(products.map(p => p.segment).filter(Boolean));
    return [...s].sort();
  }, [products]);

  const categories = useMemo(() => {
    let list = products;
    if (activeSegment !== 'ALL') list = list.filter(p => p.segment === activeSegment);
    const c = new Set(list.map(p => p.product_category).filter(Boolean));
    return [...c].sort();
  }, [products, activeSegment]);

  const subcategories = useMemo(() => {
    let list = products;
    if (activeSegment !== 'ALL') list = list.filter(p => p.segment === activeSegment);
    if (activeCategory !== 'ALL') list = list.filter(p => p.product_category === activeCategory);
    const s = new Set(list.map(p => p.sub_category).filter(Boolean));
    return [...s].sort();
  }, [products, activeSegment, activeCategory]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeSegment !== 'ALL') list = list.filter(p => p.segment === activeSegment);
    if (activeCategory !== 'ALL') list = list.filter(p => p.product_category === activeCategory);
    if (activeSubcategory !== 'ALL') list = list.filter(p => p.sub_category === activeSubcategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.model.toLowerCase().includes(q) ||
        p.sub_category?.toLowerCase().includes(q) ||
        p.product_category?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeSegment, activeCategory, activeSubcategory, searchQuery]);

  const totalItems = bomList.reduce((s, i) => s + i.qty, 0);

  // ── BOM handlers ──
  const handleAddToBom = useCallback((product) => {
    setBomList(prev => {
      const existing = prev.find(i => i.product_id === product.id && i.vendor === product.vendor);
      if (existing) return prev.map(i => (i.product_id === product.id && i.vendor === product.vendor) ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, id: uid(), product_id: product.id, qty: 1, note: '' }];
    });
    showToast(`"${product.model}" added to BOM`);
  }, []);

  const handleQtyChange = (id, qty) => setBomList(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  const handleRemove = (id) => setBomList(prev => prev.filter(i => i.id !== id));
  const handleNoteChange = (id, note) => setBomList(prev => prev.map(i => i.id === id ? { ...i, note } : i));

  // ── Draft handlers ──
  const handleSaveDraft = async (name) => {
    try {
      const payload = {
        id: currentDraftId,
        name,
        vendor: activeVendor,
        items: bomList.map(i => ({ product_id: i.product_id || i.id, model: i.model, vendor: i.vendor, qty: i.qty, note: i.note })),
        status: 'draft',
        created_by: loggedInUser?.id,
      };
      const res = await axios.post(`${API_BASE_URL}/api/bom/drafts`, payload);
      if (res.data.success) {
        setCurrentDraftId(res.data.id);
        setCurrentDraftName(name);
        setShowSaveDraftModal(false);
        fetchDrafts();
        showToast('Draft saved successfully!');
      }
    } catch (err) {
      showToast('Failed to save draft.', 'error');
    }
  };

  const handleLoadDraft = async (draft) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bom/drafts/${draft.id}`);
      if (res.data.success) {
        const items = res.data.items.map(i => ({ ...i, id: uid(), qty: i.qty || 1, note: i.note || '' }));
        setBomList(items);
        setCurrentDraftId(draft.id);
        setCurrentDraftName(draft.name);
        setTab('bom');
      }
    } catch (err) {
      showToast('Failed to load draft.', 'error');
    }
  };

  const handleDeleteDraft = async (id) => {
    if (!window.confirm('Delete this draft?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/bom/drafts/${id}`);
      fetchDrafts();
      showToast('Draft deleted.');
    } catch (err) {
      showToast('Failed to delete draft.', 'error');
    }
  };

  const handleForwardDraft = async (draft, recipient, note) => {
    try {
      await axios.put(`${API_BASE_URL}/api/bom/drafts/${draft.id}/forward`, { recipient, note });
      setForwardTarget(null);
      fetchDrafts();
      showToast(`"${draft.name}" forwarded to ${recipient}.`);
    } catch (err) {
      showToast('Failed to forward draft.', 'error');
    }
  };

  // ── Import handler ──
  const handleImport = async (rows, vendorKey) => {
    const res = await axios.post(`${API_BASE_URL}/api/bom/products/import`, { products: rows, vendor: vendorKey });
    if (!res.data.success) throw new Error(res.data.error || 'Import failed');
    fetchProducts(vendorKey);
    showToast(`✅ ${rows.length} products imported successfully!`);
  };

  const handleVendorSwitch = (key) => {
    setActiveVendor(key);
    setActiveSegment('ALL');
    setActiveCategory('ALL');
    setActiveSubcategory('ALL');
    setSearchQuery('');
  };

  const isAdmin = loggedInUser?.role === 'admin';

  return (
    <div className="bom-root">

      {/* Header */}
      <div className="bom-header">
        <div>
          <h1>BOM Management</h1>
          <p>Select a vendor, browse products, and build your Bill of Materials.</p>
        </div>
        <div className="bom-header-actions">
          {currentDraftName && <span className="current-draft-label">📝 {currentDraftName}</span>}
          {isAdmin && (
            <button className="bom-import-btn" onClick={() => setShowImportModal(true)}>
              📥 Import Products
            </button>
          )}
          {bomList.length > 0 && (
            <button className="bom-save-draft-btn" onClick={() => setShowSaveDraftModal(true)}>
              💾 Save Draft
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast-${toast.type || 'success'}`}>{toast.msg}</div>
      )}

      {/* Tabs */}
      <div className="bom-tabs">
        <button className={`tab-btn${tab === 'catalog' ? ' active' : ''}`} onClick={() => setTab('catalog')}>
          Product Catalog
        </button>
        <button className={`tab-btn${tab === 'bom' ? ' active' : ''}`} onClick={() => setTab('bom')}>
          BOM List {bomList.length > 0 && <span className="tab-badge">{totalItems}</span>}
        </button>
        <button className={`tab-btn${tab === 'drafts' ? ' active' : ''}`} onClick={() => setTab('drafts')}>
          Drafts {drafts.length > 0 && <span className="tab-badge tab-badge-gray">{drafts.length}</span>}
        </button>
      </div>

      {/* ── CATALOG TAB ── */}
      {tab === 'catalog' && (
        <div>
          {/* Vendor selector */}
          <div className="vendor-selector">
            {Object.entries(VENDOR_REGISTRY).map(([key, v]) => (
              <VendorCard key={key} vendorKey={key} vendor={v} active={activeVendor === key} onClick={handleVendorSwitch} />
            ))}
          </div>

          {!vendor.available ? (
            <div className="catalog-empty">
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔜</div>
              <p style={{ fontWeight: 600, color: '#374151' }}>{vendor.label} catalog coming soon.</p>
              <p style={{ color: '#9ca3af', fontSize: 13 }}>Products will be available once the catalog is loaded.</p>
            </div>
          ) : loadingProducts ? (
            <div className="catalog-empty"><span>⏳ Loading products…</span></div>
          ) : (
            <>
              {/* Search */}
              <div className="bom-search-bar">
                <input
                  className="bom-search-input"
                  placeholder={`Search ${vendor.label} models, categories, or notes…`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>✕</button>
                )}
              </div>

              {/* Segment Pills (company-based tagging) */}
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginRight: 8 }}>Segment</span>
                <div className="bom-category-pills" style={{ display: 'inline-flex' }}>
                  <button className={`category-pill${activeSegment === 'ALL' ? ' active' : ''}`}
                    onClick={() => { setActiveSegment('ALL'); setActiveCategory('ALL'); setActiveSubcategory('ALL'); }}>
                    All
                  </button>
                  {segments.map(seg => (
                    <button key={seg}
                      className={`category-pill${activeSegment === seg ? ' active' : ''}`}
                      onClick={() => { setActiveSegment(seg); setActiveCategory('ALL'); setActiveSubcategory('ALL'); }}>
                      {seg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Pills */}
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginRight: 8 }}>Category</span>
                <div className="bom-category-pills" style={{ display: 'inline-flex' }}>
                  <button className={`category-pill${activeCategory === 'ALL' ? ' active' : ''}`}
                    onClick={() => { setActiveCategory('ALL'); setActiveSubcategory('ALL'); }}>
                    All
                  </button>
                  {categories.map(cat => (
                    <button key={cat}
                      className={`category-pill${activeCategory === cat ? ' active' : ''}`}
                      onClick={() => { setActiveCategory(cat); setActiveSubcategory('ALL'); }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategory Pills */}
              {activeCategory !== 'ALL' && subcategories.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginRight: 8 }}>Sub-Category</span>
                  <div className="bom-subcategory-pills" style={{ display: 'inline-flex', flexWrap: 'wrap' }}>
                    <button className={`subcategory-pill${activeSubcategory === 'ALL' ? ' active' : ''}`}
                      onClick={() => setActiveSubcategory('ALL')}>
                      All
                    </button>
                    {subcategories.map(sub => (
                      <button key={sub}
                        className={`subcategory-pill${activeSubcategory === sub ? ' active' : ''}`}
                        onClick={() => setActiveSubcategory(sub)}>
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="bom-product-count">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                {bomList.length > 0 && (
                  <span className="bom-list-peek" onClick={() => setTab('bom')}>
                    · View BOM list ({totalItems} units) →
                  </span>
                )}
              </p>

              {filteredProducts.length > 0 ? (
                <div className="catalog-grid">
                  {filteredProducts.map(p => (
                    <ProductCard key={p.id} product={p} onAdd={handleAddToBom} />
                  ))}
                </div>
              ) : (
                <div className="catalog-empty">
                  <div style={{ fontSize: 36 }}>🔍</div>
                  <p>No products match your filters.</p>
                  {isAdmin && products.length === 0 && (
                    <button className="browse-btn" onClick={() => setShowImportModal(true)}>📥 Import Products Now</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── BOM LIST TAB ── */}
      {tab === 'bom' && (
        <div>
          {bomList.length === 0 ? (
            <div className="bom-empty-state">
              <div className="empty-icon">📋</div>
              <p>Your BOM list is empty.</p>
              <p className="empty-sub">Go to the Product Catalog and add items.</p>
              <button className="browse-btn" onClick={() => setTab('catalog')}>Browse Catalog</button>
            </div>
          ) : (
            <>
              <div className="bom-summary-bar">
                {[
                  { label: 'Line Items', value: bomList.length },
                  { label: 'Total Units', value: totalItems },
                  { label: 'Vendors', value: new Set(bomList.map(i => i.vendor)).size },
                  { label: 'Categories', value: new Set(bomList.map(i => i.product_category)).size },
                ].map(s => (
                  <div key={s.label} className="bom-summary-card">
                    <div className="bom-summary-value">{s.value}</div>
                    <div className="bom-summary-label">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="bom-table-wrapper">
                <table className="bom-table">
                  <thead>
                    <tr>
                      {['Model / Vendor', 'Category', 'Sub-Category / Segment', 'Quantity', 'Notes', ''].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bomList.map(item => (
                      <BomLineItem key={item.id} item={item} onQtyChange={handleQtyChange} onRemove={handleRemove} onNoteChange={handleNoteChange} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bom-footer-actions">
                <button className="bom-clear-btn" onClick={() => { if (window.confirm('Clear the entire BOM list?')) { setBomList([]); setCurrentDraftName(''); setCurrentDraftId(null); } }}>Clear All</button>
                <button className="bom-save-draft-btn" onClick={() => setShowSaveDraftModal(true)}>💾 Save Draft</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── DRAFTS TAB ── */}
      {tab === 'drafts' && (
        <div>
          {loadingDrafts ? (
            <div className="bom-empty-state"><p>⏳ Loading drafts…</p></div>
          ) : drafts.length === 0 ? (
            <div className="bom-empty-state">
              <div className="empty-icon">🗂️</div>
              <p>No drafts saved yet.</p>
              <p className="empty-sub">Build a BOM list and save it as a draft to forward to finance.</p>
              <button className="browse-btn" onClick={() => setTab('catalog')}>Start Building</button>
            </div>
          ) : (
            <div className="drafts-list">
              <p className="drafts-hint">Saved drafts can be loaded back into the BOM list or forwarded directly to the finance team for pricing.</p>
              {drafts.map(draft => (
                <DraftCard key={draft.id} draft={draft} onLoad={handleLoadDraft} onDelete={handleDeleteDraft} onForward={(d) => setForwardTarget(d)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showSaveDraftModal && (
        <SaveDraftModal existingName={currentDraftName} onSave={handleSaveDraft} onClose={() => setShowSaveDraftModal(false)} />
      )}
      {forwardTarget && (
        <ForwardModal draft={forwardTarget} onConfirm={handleForwardDraft} onClose={() => setForwardTarget(null)} />
      )}
      {showImportModal && (
        <ImportModal onImport={handleImport} onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
};

export default Bom;
