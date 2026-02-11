import React, { useState, useEffect } from "react";
import { Edit3, Trash2 } from "lucide-react";
import "../styles/user.css";

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    password: "", 
    role: "viewer" 
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const isAdmin = currentUser?.role === "admin";

  // Fetch users from MariaDB
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/users");
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Form Submission (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Unauthorized: Only admins can manage users.");

    // If editingId exists, use the PUT route; otherwise, use the REGISTER route
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
        alert(editingId ? "User updated successfully!" : "User added successfully!");
        fetchUsers(); // Refresh the list
        resetForm();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to connect to the server.");
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
      password: "" // Keep password blank unless changing it
    });
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return alert("Only admin can perform this action");
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchUsers();
      else alert(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="user-management-container">
      {isAdmin && (
        <div className="form-card">
          <h2>{editingId ? "Update User" : "Add New User"}</h2>
          <form className="user-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={editingId} // Usually emails are unique identifiers
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder={editingId ? "New Password (leave blank to keep current)" : "Password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingId}
            />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="executive">Executive</option>
              <option value="finance">Finance</option>
              <option value="viewer">Viewer</option>
            </select>
            
            <div className="form-buttons">
              <button type="submit" className="submit-btn">
                {editingId ? "Update User" : "Save User"}
              </button>
              {editingId && (
                <button type="button" className="cancel-btn" onClick={resetForm}>
                   Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="table-controls">
        <input
          className="search-bar"
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
              {isAdmin && (
                <td className="action-buttons">
                  <button onClick={() => handleEdit(user)} className="edit-btn">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="delete-btn">
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
