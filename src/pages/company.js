import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Trash2, FileSpreadsheet, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import '../styles/dashboard.css';

const Company = ({ userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All'); // Added Industry filter state
  const fileInputRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ✅ ROLES
  const allowedRoles = ['admin', 'manager', 'executive'];
  const canEdit = allowedRoles.includes(userRole?.toLowerCase());

  const industries = [
    'Accounting', 'Airlines/Aviation', 'Apparel & Fashion', 'Automotive', 'Banking', 
    'Broadcast Media', 'Building Materials', 'Business Supplies and Equipment', 'Capital Markets', 
    'Chemicals', 'Civil Engineering', 'Computer Hardware', 'Computer Networking', 
    'Computer Software', 'Construction', 'Consumer Electronics', 'Consumer Goods', 
    'Consumer Services', 'Defense & Space', 'Education Management', 'Electrical/Electronic Manufacturing', 
    'Entertainment', 'Financial Services', 'Food & Beverages', 'Food Production', 'Gambling & Casinos', 
    'Government Administration', 'Higher Education', 'Hospital & Health Care', 'Hospitality', 
    'Individual & Family Services', 'Information Technology and Services', 'Insurance', 'Legal Services', 
    'Leisure, Travel & Tourism', 'Logistics and Supply Chain', 'Machinery', 'Management Consulting', 
    'Maritime', 'Mechanical or Industrial Engineering', 'Mining & Metals', 'Oil & Energy', 
    'Packaging and Containers', 'Pharmaceuticals', 'Photography', 'Printing', 'Professional Training & Coaching', 
    'Publishing', 'Real Estate', 'Renewables & Environment', 'Restaurants', 'Retail', 
    'Telecommunications', 'Transportation/Trucking/Railroad', 'Utilities', 'Venture Capital & Private Equity','Other',
  ];

  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    phone: '',
    city: '',
    country: '',
    industry: ''
  });

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/companies');
      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

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

        const mappedData = rawData.map(row => {
            const rawId = row['Record ID'] || row['record_id'];
            const validId = (rawId && !isNaN(rawId)) ? rawId : null;

            return {
                record_id: validId, 
                company_name: row['Company name'],
                company_owner: row['Company owner'] || null,
                phone: row['Phone Number']?.toString() || null,
                city: row['City'] || null,
                country: row['Country/Region'] || "Philippines",
                industry: row['Industry'] || "Other"
            };
        });

        const validCompanies = mappedData.filter(c => c.company_name && c.company_name.toString().trim() !== "");

        if (validCompanies.length === 0) {
          return alert("Import failed: No valid company names found.");
        }

        const response = await fetch('http://localhost:5000/api/companies/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companies: validCompanies }), 
        });

        const result = await response.json();
        if (result.success) {
          alert(`Successfully processed ${validCompanies.length} companies!`);
          fetchCompanies();
        }
      } catch (err) {
        alert("Error reading Excel: " + err.message);
      } finally {
        e.target.value = null; 
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = async (id) => {
    if (!canEdit) return;
    if (window.confirm("Are you sure you want to delete this company?")) {
      try {
        const response = await fetch(`http://localhost:5000/api/companies/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) fetchCompanies();
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ UPDATED SEARCH & INDUSTRY FILTER LOGIC
  const filteredCompanies = useMemo(() => {
    return companies.filter((co) => {
      const term = searchQuery.toLowerCase().trim();
      
      const matchesSearch = !term || 
        (co.name && co.name.toLowerCase().includes(term)) ||
        (co.owner && co.owner.toLowerCase().includes(term)) ||
        (co.city && co.city.toLowerCase().includes(term));

      const matchesIndustry = industryFilter === 'All' || co.industry === industryFilter;

      return matchesSearch && matchesIndustry;
    });
  }, [searchQuery, industryFilter, companies]);   

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleModal = () => {
    if (!canEdit && !isModalOpen) return;
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setFormData({ name: '', owner: '', phone: '', city: '', country: '', industry: '' });
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
      }
    } catch (err) {
      console.error("Submission error:", err);
    }
  };

  return (
    <div className="view-container">
            <div 
          className="view-header-tabs" 
          style={{ 
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            justifyContent: 'space-between',
            paddingBottom: isMobile ? '15px' : '0px',
            marginTop: isMobile ? '20px' : '0px',
            padding: '20px' 
          }}
        >

        <div style={{ fontWeight: 'bold'}}>All companies</div>
        <div className="header-actions" style={{ display: 'flex', gap: '10px', marginTop: isMobile ? '20px' : '0px'}}>
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
              <button className="add-company-btn" onClick={toggleModal}>Add company</button>
            </>
          )}
        </div>
      </div>

      <div className="toolbar project-toolbar" style={{
        display: 'flex', 
        /* Translates your media query logic to inline style */
        flexDirection: isMobile ? 'column' : 'row', 
        alignItems: isMobile ? 'stretch' : 'center', 
        marginTop: isMobile ? '130px' : '0px', 
        gap: '15px'}}>

        {/* ✅ INDUSTRY FILTER DROPDOWN */}
        <div className="filter-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '5px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Filter size={18} style={{ color: '#64748b' }} />
          <select 
            value={industryFilter} 
            onChange={(e) => setIndustryFilter(e.target.value)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', outline: 'none', maxWidth: '150px' }}
          >
            <option value="All">All</option>
            {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>

        {/* SEARCH CONTAINER */}
        <div className="search-container" style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search by name, owner, or city..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
          />
          {searchQuery && (
            <X 
              size={18} 
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8' }} 
              onClick={() => setSearchQuery('')} 
            />
          )}
        </div>
      </div>

      <div className="table-responsive-wrapper">
        {isLoading ? (
          <div className="loading-state">Loading companies...</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>ID</th> 
                <th>Company Name</th>
                <th>Owner</th>
                <th>Industry</th>
                <th>Phone</th>
                <th>Location</th>
                {canEdit && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((co) => (
                  <tr key={co.record_id}>
                    <td style={{ textAlign: 'center' }}>{co.record_id}</td>
                    <td className="company-name-cell">
                      <span className="link-text">{co.name}</span>
                    </td>
                    <td>{co.owner || '--'}</td>
                    <td><span className="badge">{co.industry || 'N/A'}</span></td>
                    <td>{co.phone || '--'}</td>
                    <td>{co.city}{co.country ? `, ${co.country}` : ''}</td>
                    {canEdit && (
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDelete(co.record_id)}
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
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

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
                  <input type="text" name="name" required placeholder="e.g. Visible Corp." value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Company Owner</label>
                  <input type="text" name="owner" placeholder="e.g. Resil Fuscablo" value={formData.owner} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" name="phone" placeholder="+1 555-0123" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <select name="industry" value={formData.industry} onChange={handleInputChange} required>
                    <option value="">Select Industry</option>
                    {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input type="text" name="city" placeholder="Manila" value={formData.city} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input type="text" name="country" placeholder="Philippines" value={formData.country} onChange={handleInputChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={toggleModal}>Cancel</button>
                <button type="submit" className="add-company-btn">Create Company</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Company;
