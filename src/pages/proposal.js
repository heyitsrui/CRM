import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/proposal.css";

const Proposal = ({ currentUser }) => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  console.log("Current User Data:", currentUser);
  // ✅ ROLE PERMISSION: Only Admin, Manager, and Executive can modify data
  const allowedRoles = ['admin', 'manager', 'executive'];
 const canEdit = currentUser?.role && allowedRoles.includes(currentUser.role.toLowerCase())

  const initialForm = {
    deal_name: "",
    deal_owner: "",
    address: "",
    company: "",
    contact: "",
    total_amount: "",
    description: ""
  };

  const [form, setForm] = useState(initialForm);

  const columns = ["Lead", "Bidding", "Signature", "Hold", "Approved", "Expired"];

  const statusClass = (status) => status.toLowerCase();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/projects");
      if (res.data.success) setProjects(res.data.projects);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  const submitDeal = async () => {
    if (!canEdit) return; // Security guard
    if (!form.deal_name) return alert("Deal name required");

    try {
      if (editing) {
        await axios.put(
          `http://localhost:5000/api/projects/${editing.id}`,
          form
        );
      } else {
        await axios.post("http://localhost:5000/api/projects", form);
      }

      setShowModal(false);
      setEditing(null);
      setForm(initialForm);
      fetchProjects();
    } catch (err) {
      console.error("Failed to save deal:", err);
    }
  };

  const updateStatus = async (id, status) => {
    if (!canEdit) return; // Security guard
    try {
      await axios.put(
        `http://localhost:5000/api/projects/${id}/status`,
        { status }
      );
      fetchProjects();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const deleteDeal = async (id) => {
    if (!canEdit) return; // Security guard
    if (!window.confirm("Delete this deal?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/projects/${id}`);
      fetchProjects();
    } catch (err) {
      console.error("Failed to delete deal:", err);
    }
  };

  // ✅ Drag and Drop restricted by canEdit
  const onDragStart = (e, id) => {
    if (!canEdit) return e.preventDefault();
    e.dataTransfer.setData("id", id);
  };

  const onDrop = (e, status) => {
    if (!canEdit) return;
    const id = e.dataTransfer.getData("id");
    updateStatus(id, status);
  };

  const handleEditClick = (p) => {
    if (!canEdit) return;
    setEditing(p);
    setForm({
      deal_name: p.deal_name || "",
      deal_owner: p.deal_owner || "",
      address: p.address || "",
      company: p.company || "",
      contact: p.contact || "",
      total_amount: p.total_amount || "",
      description: p.description || ""
    });
    setShowModal(true);
  };

  

  return (
    <div className="proposal-page">
      <div className="proposal-header">
        <h1>Proposals</h1>
        <div className="header-actions">
          <input
            className="search-input"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {/* ✅ ONLY SHOW CREATE BUTTON IF AUTHORIZED */}
          {canEdit && (
            <button
              className="create-btn"
              onClick={() => {
                setEditing(null);
                setForm(initialForm);
                setShowModal(true);
              }}
            >
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
              onDragOver={(e) => canEdit && e.preventDefault()}
              onDrop={(e) => onDrop(e, col)}
            >
              <div className={`column-header ${col.toLowerCase()}`}>
                <span className="dot" />
                {col}
              </div>

              <div className="column-body">
                {projects
                  .filter(
                    (p) =>
                      p.status === col &&
                      p.deal_name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((p) => (
                    <div
                      key={p.id}
                      className="card"
                      draggable={canEdit} // ✅ DRAGGING DISABLED FOR NON-EDITORS
                      onDragStart={(e) => onDragStart(e, p.id)}
                    >
                      <div className="card-top">
                        <h4>{p.deal_name}</h4>

                        {/* ✅ ONLY SHOW EDIT MENU IF AUTHORIZED */}
                        {canEdit && (
                          <div className="menu">
                            ⋮
                            <div className="menu-dropdown">
                              <span onClick={() => handleEditClick(p)}>
                                Edit
                              </span>
                              <span onClick={() => updateStatus(p.id, "Expired")}>
                                Mark Expired
                              </span>
                              <span onClick={() => deleteDeal(p.id)}>
                                Delete
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="card-body">
                        <p><b>Deal Owner:</b> {p.deal_owner}</p>
                        <p><b>Company:</b> {p.company}</p>
                        <p><b>Contact:</b> {p.contact}</p>
                        <p><b>Address:</b> {p.address}</p>
                        <p className="amount">₱{Number(p.total_amount || 0).toLocaleString()}</p>
                        <p className="muted">{p.description}</p>

                        <div className="card-footer">
                          <span
                            className={`status-badge ${statusClass(p.status)}`}
                          >
                            {p.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ MODAL SECURITY CHECK */}
      {showModal && canEdit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editing ? "Edit Deal" : "Create Deal"}</h3>
              <button className="close-x" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <input 
                placeholder="Deal Name" 
                value={form.deal_name} 
                onChange={(e) => setForm({ ...form, deal_name: e.target.value })} 
              />
              <input 
                placeholder="Deal Owner" 
                value={form.deal_owner} 
                onChange={(e) => setForm({ ...form, deal_owner: e.target.value })} 
              />
              <input 
                placeholder="Address" 
                value={form.address} 
                onChange={(e) => setForm({ ...form, address: e.target.value })} 
              />
              <input 
                placeholder="Company" 
                value={form.company} 
                onChange={(e) => setForm({ ...form, company: e.target.value })} 
              />
              <input 
                placeholder="Contact" 
                value={form.contact} 
                onChange={(e) => setForm({ ...form, contact: e.target.value })} 
              />
              <input 
                placeholder="Amount" 
                type="number"
                value={form.total_amount} 
                onChange={(e) => setForm({ ...form, total_amount: e.target.value })} 
              />
              <textarea 
                placeholder="Description" 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
              />
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
