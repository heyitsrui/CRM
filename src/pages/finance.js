import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Search, X } from 'lucide-react';
import axios from 'axios';
import '../styles/finance.css'; // Ensure you have your styling here

const Finance = ({ loggedInUser }) => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. FLEXIBLE API URL: Works on PC and other devices automatically
  const API_BASE_URL = `http://${window.location.hostname}:5000`;

  // 2. ROLE CHECK: Only Admin and Finance can see Action buttons
const canManageFinance = loggedInUser === 'admin' || loggedInUser === 'finance';

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const filteredProjects = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return projects;

    return projects.filter((proj) =>
      proj.deal_name?.toLowerCase().includes(term) ||
      proj.company?.toLowerCase().includes(term) ||
      proj.status?.toLowerCase().includes(term)
    );
  }, [searchQuery, projects]);

  const fetchFinanceData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/finance/projects`);
      if (res.data.success) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error("Error fetching finance data:", err);
    }
  };

  const handleOpenModal = (project) => {
    setSelectedProject(project);
    setPaidAmount(project.paid_amount); // Pre-fill with existing paid amount
    setIsModalOpen(true);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const res = await axios.put(`${API_BASE_URL}/api/finance/update/${selectedProject.id}`, {
        paid_amount: paidAmount,
        role: loggedInUser // Send role to backend for security verification
      });

      if (res.data.success) {
        alert(`Payment Updated! New Balance: $${res.data.balance}`);
        setIsModalOpen(false);
        fetchFinanceData(); // Refresh table
      }
    } catch (err) {
      console.error("Update error:", err.response?.data || err.message);
      alert("Failed to update finance record.");
    }
  };

  return (
    <div className="finance-page-container">
      <div className="view-header-tabs">
        <div className="tab active">Financial Management</div>
      </div>
      <div className="toolbar">
        <div className="search-container">
          <input
            type="text"
            placeholder="     Search by project name, company, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <X
              size={18}
              className="search-icon clear-icon"
              onClick={() => setSearchQuery('')}
              style={{ cursor: 'pointer' }}
            />
          ) : (
            <Search size={18} className="search-icon" />
          )}
        </div>
      </div>
      <div className="table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Company</th>
              <th>Total Contract</th>
              <th>Paid Amount</th>
              <th>Due Amount</th>
              <th>Status</th>
              {canManageFinance && <th style={{ textAlign: 'center' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((proj) => (
              <tr key={proj.id}>
                <td className="company-name-cell">
                  <span className="link-text">{proj.deal_name}</span>
                </td>
                <td>{proj.company || '--'}</td>
                <td>${Number(proj.total_amount).toLocaleString()}</td>
                <td>${Number(proj.paid_amount).toLocaleString()}</td>
                <td>${Number(proj.due_amount).toLocaleString()}</td>
                <td>
                  <span className={`status-pill ${proj.status?.toLowerCase()}`}>
                    {proj.status || 'N/A'}
                  </span>
                </td>

                {canManageFinance && (
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="delete-icon-btn"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenModal(proj)}
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* UPDATE MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-body">
            <h3>Update Payment</h3>
            <p className="modal-subtitle">Project: {selectedProject?.deal_name}</p>
            
            <form onSubmit={handleUpdatePayment}>
              <div className="form-group">
                <label>Total Contract: ${selectedProject?.total_amount}</label>
                <input 
                  type="number" 
                  placeholder="Enter New Paid Amount"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  required
                />
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-save">Update Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
