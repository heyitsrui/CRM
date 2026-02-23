import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, User, Filter } from 'lucide-react';
import axios from 'axios';
import '../styles/dashboard.css';

const Projects = ({ loggedInUser }) => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = `http://${window.location.hostname}:5000`;

  const statusOptions = [
    'All', 'Lead', 'For Proposal', 'Proposal', 'Purchase Order', 
    'Site Survey-POC', 'Closed Lost', 'Completed Project', 
    'Inactive Project', 'Renewal Support', 'Previous Year Project', 'Recovered Project'
  ];

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
    return projects.filter(p => {
      const term = searchQuery.toLowerCase().trim();
      
      const matchesSearch = !term || 
        p.deal_name?.toLowerCase().includes(term) ||
        p.deal_owner?.toLowerCase().includes(term);
        
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, projects]);

  const getStatusClass = (status) => {
    if (!status) return 'badge';
    return status.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <div className="view-container">
      <div className="view-header-tabs">
        <div className="tab active">Project Sheets ({filteredProjects.length})</div>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        
        <div className="filter-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '5px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Filter size={18} style={{ color: '#64748b' }} />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', outline: 'none' }}
          >
            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className="search-container" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search by project or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={18} className="search-icon" />
        </div>
      </div>

      {/* Projects Table - Columns adjusted */}
      <div className="table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Deal Name</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Total Amount</th>
              <th>Closed Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading projects...</td></tr>
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
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No projects found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Projects;
