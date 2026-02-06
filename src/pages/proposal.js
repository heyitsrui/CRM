import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/proposal.css";

const Proposal = () => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    client: "",
    address: ""
  });

  const columns = ["Lead", "Bidding", "Signature", "Hold", "Approved", "Expired"];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const res = await axios.get("http://localhost:5000/api/projects");
    if (res.data.success) setProjects(res.data.projects);
  };

  const isExpired = (date) => (new Date() - new Date(date)) / 86400000 > 30;

  const getStatus = (p) => (isExpired(p.created_at) ? "Expired" : p.status);

  const createProject = async () => {
    if (!form.title) return alert("Title required");

    await axios.post("http://localhost:5000/api/projects", form);
    setForm({ title: "", client: "", address: "" });
    setShowModal(false);
    fetchProjects();
  };

  const onDragStart = (e, id) => {
    e.dataTransfer.setData("id", id);
  };

  const onDrop = async (e, status) => {
    const id = e.dataTransfer.getData("id");
    if (!id || status === "Expired") return;

    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );

    try {
      await axios.put(`http://localhost:5000/api/projects/${id}/status`, { status });
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchProjects();
    }
  };

  return (
    <div className="proposal-page">
      <div className="proposal-header">
        <h1>Proposals</h1>
        <div className="header-actions">
          <input
            className="search-input"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="create-btn" onClick={() => setShowModal(true)}>
            + Create Project
          </button>
        </div>
      </div>

      <div className="kanban-wrapper">
        <div className="kanban-board">
          {columns.map((col) => (
            <div
              key={col}
              className="column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, col)}
            >
              <div className="column-header">
                <span>● {col}</span>
                <span className="count">
                  {projects.filter(
                    (p) =>
                      getStatus(p) === col &&
                      p.title.toLowerCase().includes(search.toLowerCase())
                  ).length}
                </span>
              </div>

              {projects
                .filter(
                  (p) =>
                    getStatus(p) === col &&
                    p.title.toLowerCase().includes(search.toLowerCase())
                )
                .map((p) => (
                  <div
                    key={p.id}
                    className={`card ${isExpired(p.created_at) ? "expired-border" : ""}`}
                    draggable={!isExpired(p.created_at)}
                    onDragStart={(e) => onDragStart(e, p.id)}
                  >
                    <h4>{p.title}</h4>
                    <p>Client: {p.client || "N/A"}</p>
                    <p>Address: {p.address || "N/A"}</p>
                    {isExpired(p.created_at) && <span className="expired-badge">EXPIRED</span>}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="table-section">
        <h2>All Proposals</h2>
        <table className="proposal-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Client</th>
              <th>Address</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {projects
              .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
              .map((p) => {
                const status = getStatus(p);
                return (
                  <tr key={p.id} className={status === "Expired" ? "expired-row" : ""}>
                    <td>{p.title}</td>
                    <td>{p.client || "N/A"}</td>
                    <td>{p.address || "N/A"}</td>
                    <td>
                      <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>
                    </td>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create Project</h3>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              placeholder="Client"
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
            />
            <input
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="modal-actions">
              <button onClick={createProject}>Create</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proposal;
