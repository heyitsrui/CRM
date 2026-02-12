import React, { useState, useEffect, useMemo } from "react";
import { Search, X, Trash2, Edit3 } from "lucide-react";
import "../styles/dashboard.css";

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    password: "", 
    role: "viewer" 
  });

  const isAdmin = currentUser?.role === "admin";

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:5000/api/users");
      const data = await res.json();
      if (data.success) {
        // Sort by ID to keep list stable
        const sortedData = data.users.sort((a, b) => a.id - b.id);
        setUsers(sortedData);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return users;
    return users.filter((u) =>
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  }, [searchQuery, users]);

  const toggleModal = () => {
    if (!isAdmin) return;
    setIsModalOpen(!isModalOpen);
    if (isModalOpen) {
      resetForm();
    }
  };

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", password: "", role: "viewer" });
    setEditingId(null);
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      password: "" // Keep blank for security
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `http://localhost:5000/api/users/${editingId}/profile` 
      : "http://localhost:5000/register";
    
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        fetchUsers();
        toggleModal();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error("Submission error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-content">
      {/* HEADER TABS */}
      <div className="view-header-tabs">
        <div className="tab active">All users</div>
        <div className="header-actions">
          {isAdmin && (
            <button className="add-company-btn" onClick={toggleModal}>
              Add user
            </button>
          )}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="      Search by name, email, or role..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <X size={18} className="search-icon clear-icon" onClick={() => setSearchQuery('')} />
          ) : (
            <Search size={18} className="search-icon" />
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="table-container">
        {isLoading ? (
          <div className="loading-state">Loading users...</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                {isAdmin && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ textAlign: 'center' }}>{user.id}</td>
                  <td className="company-name-cell">
                    <span className="link-text" onClick={() => isAdmin && handleEdit(user)}>
                      {user.name}
                    </span>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone || '--'}</td>
                  <td><span className="badge">{user.role}</span></td>
                  {isAdmin && (
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleEdit(user)}
                        className="delete-icon-btn" 
                        style={{ color: '#3ba3a5', marginRight: '10px' }}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="delete-icon-btn"
                        style={{ color: '#ff4d4f' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2>{editingId ? "Update User" : "Create User"}</h2>
                <p className="modal-subtitle">Set permissions and account details</p>
              </div>
              <button className="close-btn" onClick={toggleModal}><X size={20} /></button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" required placeholder="e.g. John Doe"
                    value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} 
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" required placeholder="john@example.com"
                    disabled={editingId}
                    value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} 
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" placeholder="0912..."
                    value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} 
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select 
                    value={form.role} 
                    onChange={(e) => setForm({...form, role: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd6e2' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="executive">Executive</option>
                    <option value="finance">Finance</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>{editingId ? "New Password (Leave blank to keep)" : "Password"}</label>
                  <input 
                    type="password" required={!editingId}
                    value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={toggleModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
