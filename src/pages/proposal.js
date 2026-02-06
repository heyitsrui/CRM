import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/proposal.css";

const Proposal = () => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const isAdmin = true;

  const initialForm = {
    deal_name: "",
    deal_owner: "",
    address: "",
    company: "",
    contact: "",
    amount: "",
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
    if (!window.confirm("Delete this deal?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/projects/${id}`);
      fetchProjects();
    } catch (err) {
      console.error("Failed to delete deal:", err);
    }
  };

  const onDragStart = (e, id) => e.dataTransfer.setData("id", id);

  const onDrop = (e, status) => {
    const id = e.dataTransfer.getData("id");
    updateStatus(id, status);
  };

  const handleEditClick = (p) => {
    setEditing(p);
    setForm({
      deal_name: p.deal_name || "",
      deal_owner: p.deal_owner || "",
      address: p.address || "",
      company: p.company || "",
      contact: p.contact || "",
      amount: p.amount || "",
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
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="create-btn"
            onClick={() => {
              setShowModal(true);
              setEditing(null);
              setForm(initialForm);
            }}
          >
            + Create Project
          </button>
        </div>
      </div>

      <div className="kanban-wrapper">
        <div className="kanban-table">
          {columns.map((col) => (
            <div
              key={col}
              className="column"
              onDragOver={(e) => e.preventDefault()}
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
                      draggable
                      onDragStart={(e) => onDragStart(e, p.id)}
                    >
                      <div className="card-top">
                        <h4>{p.deal_name}</h4>

                        {isAdmin && (
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
                        <p className="amount">₱{p.amount}</p>
                        <p className="muted">{p.description}</p>

                        {/* STATUS AT BOTTOM */}
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
    </div>
  );
};

export default Proposal;
