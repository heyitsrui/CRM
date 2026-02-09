import React, { useState, useEffect } from "react";
import { Edit3, Trash2 } from "lucide-react";
import "../styles/user.css";

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", role: "viewer", password: "" });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const isAdmin = currentUser?.role === "admin";

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/users");
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create or update user
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Only admin can perform this action");

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `http://localhost:5000/api/users/${editingId}`
      : "http://localhost:5000/api/users";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        setForm({ name: "", email: "", role: "viewer", password: "" });
        setEditingId(null);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete user
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

  // Edit user
  const handleEdit = (user) => {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, role: user.role, password: "" });
  };

  // Filter users by search
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="user-management-container">
      {isAdmin && (
        <form className="user-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
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
          />
          <input
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Password"
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
          <button type="submit">{editingId ? "Update" : "Add User"}</button>
        </form>
      )}

      <div className="table-controls">
        <input
          style={{width: "1305px"}}
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="user-table">
        <thead>
          <tr style={{textAlign: "left"}}>
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
              <td>{user.role}</td>
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
