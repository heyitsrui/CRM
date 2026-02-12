import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Trash2 } from 'lucide-react';
import '../styles/dashboard.css';

const Client = ({ userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Define Permission: Only admin, manager, or executive can add/delete
  const canEdit = userRole !== 'finance' && userRole !== 'viewer';

  const [formData, setFormData] = useState({
    clientName: '',
    companyName: '',
    email: '',
    salesRep: ''
  });

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/clients');
      const data = await response.json();
      if (data.success) {
        const sortedData = data.clients.sort((a, b) => a.id - b.id);
        setClients(sortedData);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Extra safety check
    if (!canEdit) return alert("You do not have permission to delete clients.");
    
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        const response = await fetch(`http://localhost:5000/api/clients/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) fetchClients();
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return clients;
    return clients.filter((cl) => (
      cl.clientName?.toLowerCase().includes(term) ||
      cl.companyName?.toLowerCase().includes(term) ||
      cl.email?.toLowerCase().includes(term) ||
      cl.salesRep?.toLowerCase().includes(term)
    ));
  }, [searchQuery, clients]);

  const toggleModal = () => {
    if (!canEdit) return; // Prevent finance/viewer from opening modal
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setFormData({ clientName: '', companyName: '', email: '', salesRep: '' });
    }
  };

  // ... handleInputChange and handleSubmit remain the same ...
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    try {
      const response = await fetch('http://localhost:5000/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        await fetchClients();
        toggleModal();
      }
    } catch (err) {
      console.error("Submission error:", err);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="view-header-tabs">
        <div className="tab active">All clients</div>
        <div className="header-actions">
          {/* HIDE ADD BUTTON FOR RESTRICTED ROLES */}
          {canEdit && (
            <button className="add-company-btn" onClick={toggleModal}>Add client</button>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="     Search by client, company, or email..." 
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

<div className="table-container">
        {isLoading ? (
          <div className="loading-state">Loading clients...</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>ID</th> 
                <th>Client Name</th>
                <th>Company Name</th>
                <th>Email</th>
                <th>Sales Rep</th>
                {/* HIDE ACTION HEADER */}
                {canEdit && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((cl) => (
                <tr key={cl.id}>
                  <td style={{ textAlign: 'center' }}>{cl.id}</td>
                  <td className="company-name-cell">
                    <span className="link-text">{cl.clientName}</span>
                  </td>
                  <td>{cl.companyName || '--'}</td>
                  <td>{cl.email || '--'}</td>
                  <td><span className="badge">{cl.salesRep || 'Unassigned'}</span></td>
                  
                  {/* HIDE ACTION BUTTONS IN TABLE BODY */}
                  {canEdit && (
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDelete(cl.id)}
                        className="delete-icon-btn"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2>Create Client</h2>
                <p className="modal-subtitle">Add a new contact to your records</p>
              </div>
              <button className="close-btn" onClick={toggleModal}><X size={20} /></button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Client Name</label>
                  <input 
                    type="text" name="clientName" required
                    placeholder="e.g. Jane Doe"
                    value={formData.clientName} onChange={handleInputChange} 
                  />
                </div>

                <div className="form-group">
                  <label>Company Name</label>
                  <input 
                    type="text" name="companyName"
                    placeholder="e.g. Visible Corp"
                    value={formData.companyName} onChange={handleInputChange} 
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" name="email"
                    placeholder="jane@example.com"
                    value={formData.email} onChange={handleInputChange} 
                  />
                </div>

                <div className="form-group">
                  <label>Sales Rep</label>
                  <input 
                    type="text" name="salesRep"
                    placeholder="e.g. John Wilson"
                    value={formData.salesRep} onChange={handleInputChange} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={toggleModal}>Cancel</button>
                <button type="submit" className="btn-primary">Create Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Client;
