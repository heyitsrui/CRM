import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Trash2 } from 'lucide-react';
import '../styles/dashboard.css';

const Company = ({ userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ PERMISSION CHECK: Only authorized roles can add or delete
  const allowedRoles = ['admin', 'manager', 'executive'];
  const canEdit = allowedRoles.includes(userRole?.toLowerCase());

  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    types: '',
    email: '',
    description: ''
  });

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/companies');
      const data = await response.json();
      if (data.success) {
        const sortedData = data.companies.sort((a, b) => a.id - b.id);
        setCompanies(sortedData);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canEdit) return; // Guard clause

    if (window.confirm("Are you sure you want to delete this company?")) {
      try {
        const response = await fetch(`http://localhost:5000/api/companies/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          fetchCompanies();
        } else {
          alert("Error deleting: " + data.error);
        }
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return companies;

    return companies.filter((co) => (
      co.name?.toLowerCase().includes(term) ||
      co.owner?.toLowerCase().includes(term) ||
      co.email?.toLowerCase().includes(term) ||
      co.types?.toLowerCase().includes(term)
    ));
  }, [searchQuery, companies]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleModal = () => {
    if (!canEdit && !isModalOpen) return; // Prevent opening if restricted
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setFormData({ name: '', owner: '', types: '', email: '', description: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    try {
      const response = await fetch('http://localhost:5000/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        await fetchCompanies();
        toggleModal();
      } else {
        alert("Error saving company: " + data.error);
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Could not connect to the server.");
    }
  };

  return (
    <div className="dashboard-content">
      <div className="view-header-tabs">
        <div className="tab active">All companies</div>
        <div className="header-actions">
          {/* ✅ HIDE ADD BUTTON FOR FINANCE/VIEWER */}
          {canEdit && (
            <button className="add-company-btn" onClick={toggleModal}>Add company</button>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="     Search by company name, owner, or email..." 
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
        {isLoading ? (
          <div className="loading-state">Loading companies...</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>ID</th> 
                <th>Company Name</th>
                <th>Company Owner</th>
                <th>Types</th>
                <th>Email</th>
                <th>Description</th>
                {/* ✅ HIDE ACTIONS HEADER */}
                {canEdit && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((co) => (
                  <tr key={co.id}>
                    <td style={{ textAlign: 'center' }}>{co.id}</td>
                    <td className="company-name-cell">
                      <span className="link-text">{co.name}</span>
                    </td>
                    <td>{co.owner || '--'}</td>
                    <td><span className="badge">{co.types || 'N/A'}</span></td>
                    <td>{co.email || '--'}</td>
                    <td className="text-truncate">{co.description || '--'}</td>
                    
                    {/* ✅ HIDE ACTIONS CELL */}
                    {canEdit && (
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDelete(co.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canEdit ? "7" : "6"} style={{ textAlign: 'center', padding: '20px' }}>
                    {searchQuery 
                      ? `No results found for "${searchQuery}"` 
                      : "No companies found."
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ GUARDED MODAL */}
      {isModalOpen && canEdit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2>Create Company</h2>
                <p className="modal-subtitle">Add a new organization to your records</p>
              </div>
              <button className="close-btn" onClick={toggleModal}><X size={20} /></button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name</label>
                  <input 
                    type="text" name="name" required
                    placeholder="e.g. Visible Corp."
                    value={formData.name} onChange={handleInputChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Company Owner</label>
                  <input 
                    type="text" name="owner"
                    placeholder="e.g. John Wilson"
                    value={formData.owner} onChange={handleInputChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" name="email"
                    placeholder="contact@company.com"
                    value={formData.email} onChange={handleInputChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select name="types" value={formData.types} onChange={handleInputChange}>
                    <option value="">Select Type</option>
                    <option value="Prospect">Prospect</option>
                    <option value="Partner">Partner</option>
                  </select>
                </div>
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea 
                  name="description" rows="3"
                  placeholder="Tell us a bit about this company..."
                  value={formData.description} onChange={handleInputChange} 
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={toggleModal}>Cancel</button>
                <button type="submit" className="btn-primary">Create Company</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Company;
