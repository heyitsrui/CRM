import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '../styles/bom.css';

const API_BASE_URL = `http://${window.location.hostname}:5000`;

// ── Vendor registry (add new vendors here) ───────────────────────
const VENDORS = [
  { key: 'ruijie',  label: 'Ruijie',  logo: '🔷', color: '#2563eb' },
  { key: 'sundray', label: 'Sundray', logo: '🟢', color: '#16a34a' },
];

// ── Category display config ────────────────────────────────────
const CAT_CONFIG = {
  ROUTER:       { label: 'Router',          icon: '⬡', badge: 'blue'   },
  SWITCHES:     { label: 'Switches',         icon: '⬢', badge: 'purple' },
  ACCESS_POINT: { label: 'Access Point',     icon: '◈', badge: 'green'  },
  FIREWALL:     { label: 'Firewall',         icon: '◉', badge: 'rose'   },
  SOFTWARE:     { label: 'Software',         icon: '◫', badge: 'orange' },
  ACCESSORY:    { label: 'Accessory',        icon: '◌', badge: 'gray'   },
  OTHER:        { label: 'Other',            icon: '◎', badge: 'gray'   },
};

const STATUS_CONFIG = {
  draft:      { label: 'Draft',     color: '#6b7280', bg: '#f3f4f6' },
  forwarded:  { label: 'Pending',   color: '#d97706', bg: '#fef3c7' },
  approved:   { label: 'Approved',  color: '#059669', bg: '#d1fae5' },
  rejected:   { label: 'Rejected',  color: '#dc2626', bg: '#fee2e2' },
};

const formatDate = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

let _nextId = 1;
const uid = () => _nextId++;

// ── API helpers ───────────────────────────────────────────────
// Matches your server.js pattern: no session cookies, userId passed explicitly
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE_URL}/api/bom${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Sub-components ────────────────────────────────────────────

function Badge({ children, color = 'blue' }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className="status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function UserChip({ name, email, role, avatar }) {
  return (
    <div className="user-chip">
      {avatar
        ? <img src={avatar} alt={name} className="user-chip-avatar" />
        : <div className="user-chip-initials">{name?.[0]?.toUpperCase() || '?'}</div>
      }
      <div className="user-chip-info">
        <span className="user-chip-name">{name}</span>
        <span className="user-chip-meta">{email} · {role}</span>
      </div>
    </div>
  );
}

function SpecsModal({ product, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{product.model}</h3>
            <span className="modal-sub">{product.sub_category} · {product.product_category}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="specs-grid">
            {[
              ['Segment',         product.segment],
              ['Category',        product.product_category],
              ['Sub-Category',    product.sub_category],
              ['Wi-Fi Standard',  product.wireless_standard],
              ['Deployment',      product.deployment],
              ['Management',      product.management_type],
              ['PoE',             product.poe],
              ['Switch Role',     product.switch_role],
              ['Port Speed',      product.switch_port_speed],
              ['Notes',           product.notes || product.product_notes],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="spec-row">
                <span className="spec-label">{label}</span>
                <span className="spec-value">{value}</span>
              </div>
            ))}
            <div className="specs-tags">
              {product.tag_dc         ? <Badge color="blue">Data Center</Badge>   : null}
              {product.tag_enterprise ? <Badge color="purple">Enterprise</Badge>  : null}
              {product.tag_sme        ? <Badge color="green">SME</Badge>          : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  const [showSpecs, setShowSpecs] = useState(false);
  const cat = CAT_CONFIG[product.categoryKey] || CAT_CONFIG.OTHER;
  return (
    <>
      <div className="product-card">
        <div className="product-card-header">
          <span className="product-card-model">{product.model}</span>
          <Badge color={cat.badge}>{cat.label}</Badge>
        </div>
        <span className="product-card-sub">{product.sub_category}</span>
        {product.wireless_standard && (
          <span className="product-card-tag">{product.wireless_standard}</span>
        )}
        {product.poe && product.poe !== 'Non-PoE' && (
          <span className="product-card-tag poe">{product.poe}</span>
        )}
        <div className="product-card-actions">
          <button className="product-card-specs-btn" onClick={() => setShowSpecs(true)}>Specs</button>
          <button className="product-card-add-btn" onClick={() => onAdd(product)}>+ Add</button>
        </div>
      </div>
      {showSpecs && <SpecsModal product={product} onClose={() => setShowSpecs(false)} />}
    </>
  );
}

function BomLineItem({ item, onQtyChange, onRemove, onNoteChange }) {
  const [showSpecs, setShowSpecs] = useState(false);
  const cat = CAT_CONFIG[item.categoryKey] || CAT_CONFIG.OTHER;
  return (
    <>
      <tr>
        <td>
          <div className="bom-table-model">{item.model}</div>
          <div className="bom-table-vendor">{item.vendor ? item.vendor.charAt(0).toUpperCase() + item.vendor.slice(1) : 'Ruijie'}</div>
        </td>
        <td><Badge color={cat.badge}>{cat.label}</Badge></td>
        <td className="bom-table-sub">{item.sub_category}</td>
        <td>
          <div className="qty-controls">
            <button className="qty-btn" onClick={() => onQtyChange(item._uid, Math.max(1, item.quantity - 1))}>−</button>
            <input
              className="qty-input"
              type="number"
              min={1}
              value={item.quantity}
              onChange={e => onQtyChange(item._uid, Math.max(1, parseInt(e.target.value) || 1))}
            />
            <button className="qty-btn" onClick={() => onQtyChange(item._uid, item.quantity + 1)}>+</button>
          </div>
        </td>
        <td>
          <input
            className="note-input"
            placeholder="Notes…"
            value={item.note}
            onChange={e => onNoteChange(item._uid, e.target.value)}
          />
        </td>
        <td>
          <div className="bom-row-actions">
            <button className="specs-btn-sm" onClick={() => setShowSpecs(true)}>Specs</button>
            <button className="remove-btn" onClick={() => onRemove(item._uid)}>✕</button>
          </div>
        </td>
      </tr>
      {showSpecs && <SpecsModal product={item} onClose={() => setShowSpecs(false)} />}
    </>
  );
}

function SaveDraftModal({ onSave, onClose, existingName, saving }) {
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
            <button className="modal-save-btn" disabled={saving || !name.trim()} onClick={() => onSave(name.trim())}>
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForwardModal({ draft, onConfirm, onClose, submitting, loggedInUser }) {
  const [note, setNote] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Forward to Finance</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-desc">
            You are forwarding <strong>{draft.name}</strong> ({draft.item_count} items, {draft.total_units} units) for pricing.
          </p>

          {/* Creator info card */}
          <div className="po-creator-card">
            <span className="po-creator-label">Purchase Order Created By</span>
            <UserChip
              name={loggedInUser?.name}
              email={loggedInUser?.email}
              role={loggedInUser?.role}
              avatar={loggedInUser?.avatar}
            />
          </div>

          <label className="modal-label" style={{ marginTop: 14 }}>Note for Finance (optional)</label>
          <textarea
            className="modal-textarea"
            placeholder="Any instructions or context for the finance team…"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
          <div className="modal-footer-actions">
            <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="modal-save-btn" disabled={submitting} onClick={() => onConfirm(draft.id, note)}>
              {submitting ? 'Sending…' : '→ Forward to Finance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ po, onConfirm, onClose, submitting }) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Reject Purchase Order</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-desc">Rejecting <strong>{po.name}</strong>. Provide a reason (optional).</p>
          <textarea
            className="modal-textarea"
            placeholder="Reason for rejection…"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="modal-footer-actions">
            <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="modal-reject-btn" disabled={submitting} onClick={() => onConfirm(po.id, reason)}>
              {submitting ? 'Rejecting…' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Purchase Order card for Finance/Admin view
function POCard({ po, isAdmin, userRole, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const loadItems = async () => {
    if (items.length > 0) { setExpanded(e => !e); return; }
    setLoadingItems(true);
    try {
      const data = await apiFetch(`/purchase-orders/${po.id}/items?userRole=${userRole}`);
      setItems(data.items || []);
      setExpanded(true);
    } catch (e) {
      console.error(e);
    }
    setLoadingItems(false);
  };

  return (
    <div className="po-card">
      <div className="po-card-top">
        <div className="po-card-left">
          <div className="po-card-name">{po.name}</div>
          <div className="po-card-meta">
            {po.item_count} items · {po.total_units} units · Forwarded {formatDate(po.forwarded_at)}
          </div>
          {/* Creator info — always visible */}
          <UserChip
            name={po.creator_name}
            email={po.creator_email}
            role={po.creator_role}
            avatar={po.creator_avatar}
          />
          {po.finance_note && (
            <div className="po-finance-note">📝 {po.finance_note}</div>
          )}
        </div>
        <div className="po-card-right">
          <StatusBadge status={po.status} />
          {po.status === 'approved' && po.reviewer_name && (
            <div className="po-reviewed-by">✅ Approved by {po.reviewer_name} · {formatDate(po.reviewed_at)}</div>
          )}
          {po.status === 'rejected' && (
            <div className="po-reviewed-by rejected">
              ❌ Rejected by {po.reviewer_name} · {formatDate(po.reviewed_at)}
              {po.reject_reason && <div className="po-reject-reason">"{po.reject_reason}"</div>}
            </div>
          )}
        </div>
      </div>

      <div className="po-card-actions">
        <button className="po-toggle-btn" onClick={loadItems} disabled={loadingItems}>
          {loadingItems ? 'Loading…' : expanded ? '▲ Hide Items' : '▼ View Items'}
        </button>
        {isAdmin && po.status === 'forwarded' && (
          <>
            <button className="po-approve-btn" onClick={() => onApprove(po)}>✓ Approve</button>
            <button className="po-reject-btn-sm" onClick={() => onReject(po)}>✕ Reject</button>
          </>
        )}
      </div>

      {expanded && items.length > 0 && (
        <div className="po-items-table-wrap">
          <table className="po-items-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Category</th>
                <th>Sub-Category</th>
                <th>Qty</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const cat = CAT_CONFIG[item.categoryKey] || CAT_CONFIG.OTHER;
                return (
                  <tr key={item.id}>
                    <td>{item.model}</td>
                    <td><Badge color={cat.badge}>{cat.label}</Badge></td>
                    <td>{item.sub_category}</td>
                    <td><strong>{item.quantity}</strong></td>
                    <td>{item.note || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main BOM Component ────────────────────────────────────────
const Bom = ({ loggedInUser }) => {
  const isAdmin   = loggedInUser?.role === 'admin';
  const isFinance = loggedInUser?.role === 'finance';
  const canSeePOs = isAdmin || isFinance;

  // Vendor & Catalog state
  const [activeVendor,    setActiveVendor]    = useState('ruijie');
  const [products,        setProducts]        = useState([]);
  const [categories,      setCategories]      = useState({});
  const [activeCategory,  setActiveCategory]  = useState('ALL');
  const [activeSub,       setActiveSub]       = useState('ALL');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // BOM list state
  const [bomList,         setBomList]         = useState([]);
  const [tab,             setTab]             = useState(canSeePOs ? 'purchase-orders' : 'catalog');

  // Draft state
  const [drafts,          setDrafts]          = useState([]);
  const [loadingDrafts,   setLoadingDrafts]   = useState(false);
  const [showSaveDraft,   setShowSaveDraft]   = useState(false);
  const [savingDraft,     setSavingDraft]     = useState(false);
  const [currentDraftName, setCurrentDraftName] = useState('');

  // PO state
  const [purchaseOrders,  setPurchaseOrders]  = useState([]);
  const [loadingPOs,      setLoadingPOs]      = useState(false);
  const [forwardTarget,   setForwardTarget]   = useState(null);
  const [rejectTarget,    setRejectTarget]    = useState(null);
  const [submitting,      setSubmitting]      = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Import state
  const [importing, setImporting]   = useState(false);
  const [importResult, setImportResult] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Vendor switch ──
  const handleVendorSwitch = (key) => {
    setActiveVendor(key);
    setActiveCategory('ALL');
    setActiveSub('ALL');
    setSearchQuery('');
  };

  // ── Import CSV ──
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      showToast('Please upload a .csv file', 'error');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userRole', loggedInUser?.role);
      formData.append('vendor', activeVendor);
      const res = await fetch(`${API_BASE_URL}/api/bom/products/import`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setImportResult({ type: 'success', msg: data.message });
        await fetchProducts();
        await fetchCategories();
      } else {
        setImportResult({ type: 'error', msg: data.error });
      }
    } catch (err) {
      setImportResult({ type: 'error', msg: err.message });
    }
    setImporting(false);
    // reset file input
    e.target.value = '';
  };

  // ── Fetch products ──
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams({ vendor: activeVendor });
      if (activeCategory !== 'ALL') params.set('category', activeCategory);
      if (activeSub !== 'ALL')      params.set('subcategory', activeSub);
      if (searchQuery.trim())       params.set('search', searchQuery.trim());
      const data = await apiFetch(`/products?${params}`);
      setProducts(data.products || []);
    } catch (e) {
      showToast('Failed to load products: ' + e.message, 'error');
    }
    setLoadingProducts(false);
  }, [activeVendor, activeCategory, activeSub, searchQuery]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiFetch(`/products/categories?vendor=${activeVendor}`);
      setCategories(data.categories || {});
    } catch (e) { console.error(e); }
  }, []);

  const fetchDrafts = useCallback(async () => {
    if (!loggedInUser?.id) return;
    setLoadingDrafts(true);
    try {
      const data = await apiFetch(`/drafts?userId=${loggedInUser.id}`);
      setDrafts(data.drafts || []);
    } catch (e) {
      showToast('Failed to load drafts: ' + e.message, 'error');
    }
    setLoadingDrafts(false);
  }, [loggedInUser]);

  const fetchPurchaseOrders = useCallback(async (statusFilter) => {
    if (!loggedInUser?.id) return;
    setLoadingPOs(true);
    try {
      const params = new URLSearchParams({ userId: loggedInUser.id, userRole: loggedInUser.role });
      if (statusFilter) params.set('status', statusFilter);
      const data = await apiFetch(`/purchase-orders?${params}`);
      setPurchaseOrders(data.purchase_orders || []);
    } catch (e) {
      showToast('Failed to load purchase orders: ' + e.message, 'error');
    }
    setLoadingPOs(false);
  }, [loggedInUser]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { if (tab === 'catalog') fetchProducts(); }, [tab, fetchProducts]);
  useEffect(() => { if (tab === 'drafts') fetchDrafts(); }, [tab, fetchDrafts]);
  useEffect(() => { if (tab === 'purchase-orders') fetchPurchaseOrders(); }, [tab, fetchPurchaseOrders]);

  // Debounce search
  useEffect(() => {
    if (tab !== 'catalog') return;
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [searchQuery, fetchProducts, tab]);

  // ── BOM handlers ──
  const handleAddToBom = useCallback((product) => {
    setBomList(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, _uid: uid(), quantity: 1, note: '' }];
    });
  }, []);

  const handleQtyChange   = (_uid, qty)  => setBomList(p => p.map(i => i._uid === _uid ? { ...i, quantity: qty } : i));
  const handleRemove      = (_uid)       => setBomList(p => p.filter(i => i._uid !== _uid));
  const handleNoteChange  = (_uid, note) => setBomList(p => p.map(i => i._uid === _uid ? { ...i, note } : i));
  const totalUnits = bomList.reduce((s, i) => s + i.quantity, 0);

  // ── Save draft ──
  const handleSaveDraft = async (name) => {
    setSavingDraft(true);
    try {
      await apiFetch('/drafts', {
        method: 'POST',
        body: JSON.stringify({
          userId: loggedInUser?.id,
          name,
          items: bomList.map(i => ({ product_id: i.id, quantity: i.quantity, note: i.note })),
        }),
      });
      setCurrentDraftName(name);
      setShowSaveDraft(false);
      showToast(`Draft "${name}" saved.`);
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    }
    setSavingDraft(false);
  };

  // ── Load draft into BOM ──
  const handleLoadDraft = async (draft) => {
    try {
      const data = await apiFetch(`/drafts/${draft.id}?userId=${loggedInUser?.id}`);
      const items = (data.draft.items || []).map(i => ({
        ...i,
        _uid: uid(),
        categoryKey: getCategoryKey(i.product_category),
      }));
      setBomList(items);
      setCurrentDraftName(draft.name);
      setTab('bom');
    } catch (e) {
      showToast('Failed to load draft: ' + e.message, 'error');
    }
  };

  const handleDeleteDraft = async (id) => {
    try {
      await apiFetch(`/drafts/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: loggedInUser?.id, userRole: loggedInUser?.role }),
      });
      setDrafts(p => p.filter(d => d.id !== id));
      showToast('Draft deleted.');
    } catch (e) {
      showToast('Delete failed: ' + e.message, 'error');
    }
  };

  // ── Forward to Finance ──
  const handleForwardConfirm = async (draftId, note) => {
    setSubmitting(true);
    try {
      await apiFetch(`/drafts/${draftId}/forward`, {
        method: 'POST',
        body: JSON.stringify({ userId: loggedInUser?.id, finance_note: note }),
      });
      setForwardTarget(null);
      await fetchDrafts();
      showToast('Purchase order forwarded to Finance.');
    } catch (e) {
      showToast('Forward failed: ' + e.message, 'error');
    }
    setSubmitting(false);
  };

  // ── Admin: Approve ──
  const handleApprove = async (po) => {
    try {
      await apiFetch(`/purchase-orders/${po.id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ userId: loggedInUser?.id, userRole: loggedInUser?.role }),
      });
      await fetchPurchaseOrders();
      showToast(`"${po.name}" approved.`);
    } catch (e) {
      showToast('Approve failed: ' + e.message, 'error');
    }
  };

  // ── Admin: Reject ──
  const handleRejectConfirm = async (poId, reason) => {
    setSubmitting(true);
    try {
      await apiFetch(`/purchase-orders/${poId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ userId: loggedInUser?.id, userRole: loggedInUser?.role, reason }),
      });
      setRejectTarget(null);
      await fetchPurchaseOrders();
      showToast('Purchase order rejected.');
    } catch (e) {
      showToast('Reject failed: ' + e.message, 'error');
    }
    setSubmitting(false);
  };

  // ── Category / subcategory helpers ──
  const subcategories = useMemo(() => {
    if (activeCategory === 'ALL') return [];
    return categories[activeCategory]?.subcategories || [];
  }, [activeCategory, categories]);

  // ── getCategoryKey (needed on frontend too for loaded items) ──
  function getCategoryKey(productCategory) {
    if (!productCategory) return 'OTHER';
    const c = productCategory.toLowerCase();
    if (c.includes('router'))     return 'ROUTER';
    if (c.includes('switch'))     return 'SWITCHES';
    if (c.includes('wireless') || c.includes('ap')) return 'ACCESS_POINT';
    if (c.includes('access controller')) return 'ACCESS_POINT';
    if (c.includes('firewall') || c.includes('security')) return 'FIREWALL';
    if (c.includes('software'))   return 'SOFTWARE';
    if (c.includes('accessory'))  return 'ACCESSORY';
    return 'OTHER';
  }

  const enrichedProducts = useMemo(() =>
    products.map(p => ({ ...p, categoryKey: p.categoryKey || getCategoryKey(p.product_category) })),
    [products]
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="bom-root">

      {/* Header */}
      <div className="bom-header">
        <div>
          <h1>BOM Management</h1>
          <p>Browse the product catalog and build your Bill of Materials.</p>
        </div>
        <div className="bom-header-actions">
          {currentDraftName && <span className="current-draft-label">📝 {currentDraftName}</span>}
          {bomList.length > 0 && (
            <button className="bom-save-draft-btn" onClick={() => setShowSaveDraft(true)}>💾 Save Draft</button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && <div className={`toast-${toast.type}`}>{toast.msg}</div>}

      {/* Tabs */}
      <div className="bom-tabs">
        <button className={`tab-btn${tab === 'catalog' ? ' active' : ''}`} onClick={() => setTab('catalog')}>
          Product Catalog
        </button>
        <button className={`tab-btn${tab === 'bom' ? ' active' : ''}`} onClick={() => setTab('bom')}>
          BOM List {bomList.length > 0 && <span className="tab-badge">{totalUnits}</span>}
        </button>
        <button className={`tab-btn${tab === 'drafts' ? ' active' : ''}`} onClick={() => setTab('drafts')}>
          My Drafts {drafts.length > 0 && <span className="tab-badge tab-badge-gray">{drafts.length}</span>}
        </button>
        <button className={`tab-btn${tab === 'purchase-orders' ? ' active' : ''}`} onClick={() => setTab('purchase-orders')}>
          Purchase Orders
          {purchaseOrders.filter(p => p.status === 'forwarded').length > 0 && (
            <span className="tab-badge tab-badge-orange">
              {purchaseOrders.filter(p => p.status === 'forwarded').length}
            </span>
          )}
        </button>
      </div>

      {/* ── CATALOG TAB ── */}
      {tab === 'catalog' && (
        <div>
          {/* Vendor Selector */}
          <div className="vendor-selector">
            {VENDORS.map(v => (
              <button
                key={v.key}
                className={`vendor-card${activeVendor === v.key ? ' active' : ''}`}
                onClick={() => handleVendorSwitch(v.key)}
                style={{ '--vendor-color': v.color }}
              >
                <span className="vendor-logo">{v.logo}</span>
                <span className="vendor-label">{v.label}</span>
                {activeVendor === v.key && <span className="vendor-check">✓</span>}
              </button>
            ))}
          </div>

          {/* Import CSV — available to all logged-in users */}
          <div className="bom-import-bar">
            <label className={`bom-import-btn${importing ? ' loading' : ''}`}>
              {importing ? '⏳ Importing…' : `📂 Import ${activeVendor === 'ruijie' ? 'Ruijie' : 'Sundray'} CSV`}
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleImportCSV}
                disabled={importing}
              />
            </label>
            {importResult && (
              <span className={`import-result ${importResult.type}`}>
                {importResult.type === 'success' ? '✅' : '❌'} {importResult.msg}
              </span>
            )}
          </div>

        <div className="bom-search-bar">
            <input
              className="bom-search-input"
              placeholder={`Search ${activeVendor === "ruijie" ? "Ruijie" : "Sundray"} models, categories…`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Pills */}
          <div className="bom-category-pills">
            <button className={`category-pill${activeCategory === 'ALL' ? ' active' : ''}`}
              onClick={() => { setActiveCategory('ALL'); setActiveSub('ALL'); }}>
              <span className="pill-icon">◎</span> All
            </button>
            {Object.entries(CAT_CONFIG).map(([key, cfg]) => (
              categories[key] ? (
                <button key={key}
                  className={`category-pill${activeCategory === key ? ' active' : ''}`}
                  onClick={() => { setActiveCategory(key); setActiveSub('ALL'); }}>
                  <span className="pill-icon">{cfg.icon}</span> {cfg.label}
                </button>
              ) : null
            ))}
          </div>

          {/* Subcategory Pills */}
          {activeCategory !== 'ALL' && subcategories.length > 0 && (
            <div className="bom-subcategory-pills">
              <button className={`subcategory-pill${activeSub === 'ALL' ? ' active' : ''}`}
                onClick={() => setActiveSub('ALL')}>All</button>
              {subcategories.map(sub => (
                <button key={sub}
                  className={`subcategory-pill${activeSub === sub ? ' active' : ''}`}
                  onClick={() => setActiveSub(sub)}>
                  {sub}
                </button>
              ))}
            </div>
          )}

          <p className="bom-product-count">
            {loadingProducts ? 'Loading…' : `${enrichedProducts.length} product${enrichedProducts.length !== 1 ? 's' : ''} found`}
            {bomList.length > 0 && (
              <span className="bom-list-peek" onClick={() => setTab('bom')}>
                · View BOM list ({totalUnits} units) →
              </span>
            )}
          </p>

          {loadingProducts ? (
            <div className="catalog-loading">Loading products…</div>
          ) : enrichedProducts.length > 0 ? (
            <div className="catalog-grid">
              {enrichedProducts.map(p => (
                <ProductCard key={p.id} product={p} onAdd={handleAddToBom} />
              ))}
            </div>
          ) : (
            <div className="catalog-empty">No products match your filters.</div>
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
                  { label: 'Line Items',  value: bomList.length },
                  { label: 'Total Units', value: totalUnits },
                  { label: 'Categories', value: new Set(bomList.map(i => i.categoryKey)).size },
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
                    <tr>{['Model / Vendor','Category','Subcategory','Quantity','Notes',''].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {bomList.map(item => (
                      <BomLineItem key={item._uid} item={item}
                        onQtyChange={handleQtyChange}
                        onRemove={handleRemove}
                        onNoteChange={handleNoteChange}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bom-footer-actions">
                <button className="bom-clear-btn" onClick={() => { setBomList([]); setCurrentDraftName(''); }}>Clear All</button>
                <button className="bom-save-draft-btn" onClick={() => setShowSaveDraft(true)}>💾 Save Draft</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── DRAFTS TAB ── */}
      {tab === 'drafts' && (
        <div>
          {loadingDrafts ? (
            <div className="catalog-loading">Loading drafts…</div>
          ) : drafts.length === 0 ? (
            <div className="bom-empty-state">
              <div className="empty-icon">🗂️</div>
              <p>No drafts saved yet.</p>
              <p className="empty-sub">Build a BOM and save it as a draft.</p>
              <button className="browse-btn" onClick={() => setTab('catalog')}>Start Building</button>
            </div>
          ) : (
            <div className="drafts-list">
              <p className="drafts-hint">Save drafts and forward them to the Finance team for pricing and approval.</p>
              {drafts.map(draft => (
                <div key={draft.id} className="draft-card">
                  <div className="draft-card-top">
                    <div>
                      <div className="draft-card-name">{draft.name}</div>
                      <div className="draft-card-meta">
                        {draft.item_count} items · {draft.total_units} units · {formatDate(draft.updated_at)}
                      </div>
                    </div>
                    <StatusBadge status={draft.status} />
                  </div>
                  <div className="draft-card-actions">
                    <button className="draft-btn-load" onClick={() => handleLoadDraft(draft)}>Load</button>
                    {draft.status === 'draft' && (
                      <button className="draft-btn-forward" onClick={() => setForwardTarget(draft)}>→ Forward to Finance</button>
                    )}
                    <button className="draft-btn-delete" onClick={() => handleDeleteDraft(draft.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PURCHASE ORDERS TAB (all logged-in users) ── */}
      {tab === 'purchase-orders' && (
        <div>
          <div className="po-tab-header">
            <div>
              <h2 className="po-tab-title">Purchase Orders</h2>
              <p className="po-tab-sub">All BOM drafts forwarded by staff for pricing and approval.</p>
            </div>
            <button className="po-refresh-btn" onClick={fetchPurchaseOrders}>↺ Refresh</button>
          </div>

          {/* Status filter chips */}
          <div className="po-status-filters">
            {['all','forwarded','approved','rejected'].map(s => (
              <button key={s} className="po-filter-chip"
                onClick={() => fetchPurchaseOrders(s === 'all' ? undefined : s)}>
                {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>

          {loadingPOs ? (
            <div className="catalog-loading">Loading purchase orders…</div>
          ) : purchaseOrders.length === 0 ? (
            <div className="bom-empty-state">
              <div className="empty-icon">📄</div>
              <p>No purchase orders yet.</p>
              <p className="empty-sub">Staff will forward BOM drafts here for review.</p>
            </div>
          ) : (
            <div className="po-list">
              {purchaseOrders.map(po => (
                <POCard
                  key={po.id}
                  po={po}
                  isAdmin={isAdmin}
                  userRole={loggedInUser?.role}
                  onApprove={handleApprove}
                  onReject={(po) => setRejectTarget(po)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showSaveDraft && (
        <SaveDraftModal
          existingName={currentDraftName}
          onSave={handleSaveDraft}
          onClose={() => setShowSaveDraft(false)}
          saving={savingDraft}
        />
      )}
      {forwardTarget && (
        <ForwardModal
          draft={forwardTarget}
          onConfirm={handleForwardConfirm}
          onClose={() => setForwardTarget(null)}
          submitting={submitting}
          loggedInUser={loggedInUser}
        />
      )}
      {rejectTarget && (
        <RejectModal
          po={rejectTarget}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectTarget(null)}
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default Bom;
