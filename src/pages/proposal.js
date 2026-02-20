import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import "../styles/proposal.css";
import { sendNotification } from "../utils/notifService";
import { FileUp, Lock, Unlock } from "lucide-react"; 

const Proposal = ({ currentUser }) => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  
  // ✅ Mode Toggle State (Default to Read-Only)
  const [isEditMode, setIsEditMode] = useState(false);

  // ✅ Permissions Logic
  const allowedRoles = ['admin', 'manager', 'executive'];
  const userHasPermission = currentUser?.role && allowedRoles.includes(currentUser.role.toLowerCase());
  const canModify = userHasPermission && isEditMode;

  const initialForm = {
    deal_name: "",
    status: "Lead",
    paid_amount: 0,
    due_amount: 0,
    total_amount: 0,
    deal_owner: "",
    contact: "",
    company: "",
    description: "",
    closed_date: ""
  };

  const [form, setForm] = useState(initialForm);

  const columns = [
    'Lead', 'Proposal', 'Purchase Order', 'Site Survey-POC', 'Closed Lost', 
    'Completed Project', 'Inactive Project', 'Renewal Support', 
    'Previous Year Project', 'Recovered Project'
  ];

  const statusClass = (status) => status.toLowerCase().replace(/[\s/]+/g, '-');

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => {
    const total = parseFloat(form.total_amount) || 0;
    const paid = parseFloat(form.paid_amount) || 0;
    setForm(prev => ({ ...prev, due_amount: (total - paid).toFixed(2) }));
  }, [form.total_amount, form.paid_amount]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/projects");
      if (res.data.success) setProjects(res.data.projects);
    } catch (err) { console.error("Failed to fetch projects:", err); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(ws);

      const formattedDeals = rawData.map(row => {
        let dateVal = null;
        if (row["Closed Date"]) {
          const d = new Date(row["Closed Date"]);
          if (!isNaN(d)) dateVal = d.toISOString().split('T')[0];
        }

        return {
          deal_name: row["Deal Name"],
          status: row["Deal Status"], 
          total_amount: row["Total Amount"] || 0,
          deal_owner: row["Deal owner"] || "Unassigned",
          closed_date: dateVal,
          paid_amount: 0
        };
      });

      try {
        const res = await axios.post("http://localhost:5000/api/projects/bulk", { deals: formattedDeals });
        if (res.data.success) {
          alert(res.data.message);
          fetchProjects();
        }
      } catch (err) {
        alert("Upload failed. Check console for error details.");
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; 
  };

  const submitDeal = async () => {
    if (!canModify) return; 
    if (!form.deal_name) return alert("Deal name required");
    try {
      if (editing) {
        await axios.put(`http://localhost:5000/api/projects/${editing.id}`, form);
        sendNotification(`📝 Updated deal: ${form.deal_name}`);
      } else {
        await axios.post("http://localhost:5000/api/projects", form);
        sendNotification(`🚀 New deal created: ${form.deal_name}`);
      }
      setShowModal(false); setEditing(null); setForm(initialForm); fetchProjects();
    } catch (err) { console.error("Failed to save deal:", err); }
  };

  const updateStatus = async (id, status) => {
    if (!canModify) return;
    try {
      const project = projects.find(p => p.id === id);
      await axios.put(`http://localhost:5000/api/projects/${id}/status`, { status });
      sendNotification(`🔄 Deal "${project?.deal_name}" moved to ${status}`);
      fetchProjects();
    } catch (err) { console.error("Failed to update status:", err); }
  };

  const deleteDeal = async (id) => {
    if (!canModify) return;
    const project = projects.find(p => p.id === id);
    if (!window.confirm("Are you sure you want to delete this deal?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/projects/${id}`);
      sendNotification(`🗑️ Deleted deal: ${project?.deal_name}`);
      fetchProjects();
    } catch (err) { console.error("Failed to delete deal:", err); }
  };

  const onDragStart = (e, id) => {
    if (!canModify) return e.preventDefault();
    e.dataTransfer.setData("id", id);
  };

  const onDrop = (e, status) => {
    if (!canModify) return;
    const id = e.dataTransfer.getData("id");
    updateStatus(id, status);
  };

  const handleEditClick = (p) => {
    if (!canModify) return;
    setEditing(p);
    setForm({
      deal_name: p.deal_name || "",
      status: p.status || "Lead",
      paid_amount: p.paid_amount || 0,
      due_amount: p.due_amount || 0,
      total_amount: p.total_amount || 0,
      deal_owner: p.deal_owner || "",
      contact: p.contact || "",
      company: p.company || "",
      description: p.description || "",
      closed_date: p.closed_date ? p.closed_date.split('T')[0] : ""
    });
    setShowModal(true);
  };

  return (
    <div className="proposal-page">
      <div className="proposal-header">
        <h1>Project Pipeline</h1>
        <div className="header-actions">
          {/* ✅ Read-Only / Edit Toggle */}
          {userHasPermission && (
            <button 
              className={`mode-toggle ${isEditMode ? 'active' : ''}`}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? <Unlock size={18} /> : <Lock size={18} />}
              <span>{isEditMode ? "Edit Mode" : "Read-Only"}</span>
            </button>
          )}

          <input
            className="search-input"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* ✅ Import Button (Active only in Edit Mode) */}
          {canModify && (
            <div className="import-wrapper">
              <label htmlFor="excel-upload" className="import-btn">
                <FileUp size={18} /> Import Excel
              </label>
              <input 
                id="excel-upload" 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* ✅ Create Button (Active only in Edit Mode) */}
          {canModify && (
            <button className="create-btn" onClick={() => { setEditing(null); setForm(initialForm); setShowModal(true); }}>
              + Create Deal
            </button>
          )}
        </div>
      </div>

      <div className="kanban-wrapper">
        <div className="kanban-table">
          {columns.map((col) => (
            <div 
              key={col} 
              className="column" 
              onDragOver={(e) => canModify && e.preventDefault()} 
              onDrop={(e) => canModify && onDrop(e, col)}
            >
              <div className={`column-header ${statusClass(col)}`}>
                <span className="dot" /> {col}
              </div>
              <div className="column-body">
                {projects
                  .filter((p) => p.status === col && p.deal_name.toLowerCase().includes(search.toLowerCase()))
                  .map((p) => (
                    <div 
                      key={p.id} 
                      className={`card ${!isEditMode ? 'readonly-card' : ''}`} 
                      draggable={canModify} 
                      onDragStart={(e) => canModify ? onDragStart(e, p.id) : e.preventDefault()}
                    >
                      <div className="card-top">
                        <h4>{p.deal_name}</h4>
                        {canModify && (
                          <div className="menu">
                            ⋮
                            <div className="menu-dropdown">
                              <span onClick={() => handleEditClick(p)}>Edit</span>
                              <span onClick={() => deleteDeal(p.id)}>Delete</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="card-body">
                        <p className="owner-text"><span className="label">Owner:</span> {p.deal_owner}</p>
                        <p className="amount-text"><span className="label">Balance:</span> ₱{parseFloat(p.due_amount).toLocaleString()}</p>
                        <div className="card-footer">
                          <span className={`status-badge ${statusClass(p.status)}`}>{p.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && canModify && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editing ? "Edit Project" : "Create Project"}</h3>
              <button className="close-x" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-section">
                <label>General Info</label>
                <input placeholder="Deal Name" value={form.deal_name} onChange={(e) => setForm({ ...form, deal_name: e.target.value })} />
                <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                <input placeholder="Deal Owner" value={form.deal_owner} onChange={(e) => setForm({ ...form, deal_owner: e.target.value })} />
                <input placeholder="Contact Person" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </div>

              <div className="input-section">
                <label>Financials</label>
                <div className="input-row">
                  <div className="field">
                    <small>Total Amount</small>
                    <input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
                  </div>
                  <div className="field">
                    <small>Amount Paid</small>
                    <input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} />
                  </div>
                </div>
                <p className="balance-info">Outstanding: <strong>₱{form.due_amount}</strong></p>
              </div>

              <div className="input-section">
                <label>Schedule & Description</label>
                <input type="date" value={form.closed_date} onChange={(e) => setForm({ ...form, closed_date: e.target.value })} />
                <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="save-btn" onClick={submitDeal}>
                  {editing ? "Save Changes" : "Create Deal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proposal;
