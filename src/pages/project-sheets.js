import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, MoreVertical, ExternalLink, Calendar, User, Building } from 'lucide-react';
import axios from 'axios';
import '../styles/dashboard.css';

const Projects = ({ loggedInUser }) => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = `http://${window.location.hostname}:5000`;

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/projects`);
      if (res.data.success) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    return projects.filter(p => 
      p.deal_name?.toLowerCase().includes(term) ||
      p.company?.toLowerCase().includes(term) ||
      p.deal_owner?.toLowerCase().includes(term)
    );
  }, [searchQuery, projects]);

  // Helper to get CSS class for the status ENUM
  const getStatusClass = (status) => {
    if (!status) return 'badge';
    return status.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <div className="view-container">
      {/* Header Section */}
      <div className="view-header-tabs">
        <div className="tab active">Project Pipeline ({filteredProjects.length})</div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by project, company, or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={18} className="search-icon" />
        </div>
        
        <div className="header-actions">
          <button className="add-company-btn">
            <Plus size={18} style={{ marginRight: '8px' }} />
            New Project
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Deal Name</th>
              <th>Status</th>
              <th>Company</th>
              <th>Owner</th>
              <th>Total Amount</th>
              <th>Closed Date</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Loading projects...</td></tr>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((proj) => (
                <tr key={proj.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="link-text" style={{ fontWeight: '600' }}>{proj.deal_name}</span>
                      <span style={{ fontSize: '11px', color: '#888' }}>ID: #{proj.id}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${getStatusClass(proj.status)}`}>
                      {proj.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building size={14} color="#666" />
                      {proj.company || '--'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} color="#666" />
                      {proj.deal_owner || 'Unassigned'}
                    </div>
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    ₱{Number(proj.total_amount).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} color="#666" />
                      {proj.closed_date ? new Date(proj.closed_date).toLocaleDateString() : 'TBD'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No projects found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Projects;
