import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/proposal.css';

const Proposal = () => {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const sections = ['Lead', 'Bidding', 'Signature', 'Hold', 'Approved'];

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/projects');
      if (res.data.success) setProjects(res.data.projects);
    } catch (err) { console.error("Fetch error:", err); }
  };

  // Logic: Mark as expired if project is older than 30 days
  const isExpired = (createdAt) => {
    const createdDate = new Date(createdAt);
    const today = new Date();
    const diffInDays = (today - createdDate) / (1000 * 60 * 60 * 24);
    return diffInDays > 30;
  };

  const onDragStart = (e, id) => e.dataTransfer.setData("projectId", id);
  const onDragOver = (e) => e.preventDefault();

  const onDrop = async (e, newStatus) => {
    const id = e.dataTransfer.getData("projectId");
    await axios.put(`http://localhost:5000/api/projects/${id}/status`, { status: newStatus });
    fetchProjects();
  };

  // Filter projects based on search input
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="proposal-container">
      {/* Header with Search and Create Button */}
      <div className="proposal-header">
        <h1>Proposals</h1>
        <div className="header-actions">
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="search-input"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="create-btn">Create Project</button>
        </div>
      </div>

      <div className="kanban-board">
        {sections.map(status => (
          <div key={status} className="column" onDragOver={onDragOver} onDrop={(e) => onDrop(e, status)}>
            <div className="column-header">
              <span>● {status}</span>
              <span className="count">
                {filteredProjects.filter(p => p.status === status).length}
              </span>
            </div>
            
            <div className="column-content">
              {filteredProjects.filter(p => p.status === status).map(p => (
                <div 
                  key={p.id} 
                  className={`card ${isExpired(p.created_at) ? 'expired-border' : ''}`} 
                  draggable 
                  onDragStart={(e) => onDragStart(e, p.id)}
                >
                  <div className="card-title">
                    <h4>{p.title}</h4> 
                    <button className="dots-btn">⋮</button>
                  </div>
                  <p className="info-text">Client: {p.client || 'N/A'}</p>
                  <p className="info-text">Address: {p.address || 'N/A'}</p>
                  
                  {/* Expired Badge */}
                  {isExpired(p.created_at) && (
                    <div className="expired-badge">EXPIRED</div>
                  )}
                  
                  <div className="card-footer">
                    <span className="phase-icon">✅</span> Phases:
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Proposal;
