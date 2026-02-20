import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Trash2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import '../styles/dashboard.css';

const Client = ({ userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  // ✅ Permissions logic
  const canEdit = userRole !== 'finance' && userRole !== 'viewer';

  // ✅ Form State matching SQL Columns
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    contact_owner: '',
    assoc_company: '',
    lead_status: 'New'
  });

  // ✅ Fetch Clients from Backend
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/clients');
      const data = await response.json();
      if (data.success) {
        // Sort by ID (record_id) to keep the list consistent
        const sortedData = data.clients.sort((a, b) => a.record_id - b.record_id);
        setClients(sortedData);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Excel Import Logic
  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(ws);

        // Map Excel headers to database columns
        const mappedData = rawData.map(row => ({
          record_id: row['Record ID'] || null,
          first_name: row['First Name'] || row['first_name'] || '',
          last_name: row['Last Name'] || row['last_name'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Phone Number']?.toString() || row['phone']?.toString() || null,
          contact_owner: row['Contact owner'] || row['Contact Owner'] || row['contact_owner'] || null,
          assoc_company: row['Associated Company'] || row['Company'] || row['assoc_company'] || null,
          lead_status: row['Lead Status'] || row['lead_status'] || 'New'
        }));

        // Validation: Ensure email and first name exist
        const validClients = mappedData.filter(c => c.email && c.first_name);

        if (validClients.length === 0) {
          return alert("Import failed: No valid data found. Ensure headers include 'First Name', 'Last Name', and 'Email'.");
        }

        const response = await fetch('http://localhost:5000/api/clients/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clients: validClients }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server returned an error:", errorText);
          return alert("Server Error: Check console for details.");
        }

        const result = await response.json();
        if (result.success) {
          alert(`Successfully imported ${validClients.length} clients!`);
          fetchClients();
        } else {
          alert("Import failed: " + result.error);
        }
      } catch (err) {
        console.error(err);
        alert("Error reading Excel: " + err.message);
      } finally {
        e.target.value = null; // Reset input
      }
    };
    reader.readAsBinaryString(file);
  };

  // ✅ Delete Client
  const handleDelete = async (id) => {
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

  // ✅ Search Filtering
  const filteredClients = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return clients;
    return clients.filter((cl) => (
      cl.first_name?.toLowerCase().includes(term) ||
      cl.last_name?.toLowerCase().includes(term) ||
      cl.email?.toLowerCase().includes(term) ||
      cl.assoc_company?.toLowerCase().includes(term)
    ));
  }, [searchQuery, clients]);

  // ✅ Modal Handlers
  const toggleModal = () => {
    if (!canEdit) return;
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setFormData({ 
        first_name: '', 
        last_name: '', 
        email: '', 
        phone: '', 
        contact_owner: '', 
        assoc_company: '', 
        lead_status: 'New' 
      });
    }
  };

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
        <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
          {canEdit && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleExcelImport} 
                accept=".xlsx, .xls, .csv" 
                style={{ display: 'none' }} 
              />
              <button 
                className="btn-secondary" 
                onClick={() => fileInputRef.current.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <FileSpreadsheet size={18} /> Import Excel
              </button>
              <button className="add-company-btn" onClick={toggleModal}>Add client</button>
            </>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search by name, company, or email..." 
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
          <table className="crm-table-client">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>ID</th> 
                <th>Name</th>
                <th>Associated Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Owner</th>
                {canEdit && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredClients.length > 0 ? (
                filteredClients.map((cl) => (
                  <tr key={cl.record_id}>
                    <td style={{ textAlign: 'center' }}>{cl.record_id}</td>
                    <td className="company-name-cell">
                      <span className="link-text">{`${cl.first_name} ${cl.last_name}`}</span>
                    </td>
                    <td>{cl.assoc_company || '--'}</td>
                    <td>{cl.email}</td>
                    <td>{cl.phone || '--'}</td>
                    <td>
                      <span className={` ${cl.lead_status?.replace(/\s+/g, '-').toLowerCase()}`}>
                        {cl.lead_status}
                      </span>
                    </td>
                    <td><span className="">{cl.contact_owner || 'Unassigned'}</span></td>
                    
                    {canEdit && (
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDelete(cl.record_id)}
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
                  <td colSpan={canEdit ? "8" : "7"} style={{ textAlign: 'center', padding: '20px' }}>
                    No results found.
                  </td>
                </tr>
              )}
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
                  <label>First Name</label>
                  <input type="text" name="first_name" required value={formData.first_name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" name="last_name" required value={formData.last_name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Associated Company</label>
                  <input type="text" name="assoc_company" value={formData.assoc_company} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Contact Owner</label>
                  <input type="text" name="contact_owner" value={formData.contact_owner} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Lead Status</label>
                  <select name="lead_status" value={formData.lead_status} onChange={handleInputChange}>
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Connected">Connected</option>
                    <option value="Open Deal">Open Deal</option>
                    <option value="Open">Open</option>
                    <option value="Attempted to Contact">Attempted to Contact</option>
                  </select>
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
