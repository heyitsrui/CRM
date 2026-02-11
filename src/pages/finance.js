import React, { useState, useEffect } from 'react';
import { Pencil, CheckCircle2, Search, Save, X } from 'lucide-react';
import axios from 'axios';
import '../styles/finance.css';

const Finance = () => {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  // Now only tracking paid_amount since Total is read-only here
  const [editForm, setEditForm] = useState({ paid_amount: 0 });

  useEffect(() => { fetchFinanceData(); }, []);

  const fetchFinanceData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/finance/projects');
      if (res.data.success) setProjects(res.data.projects);
    } catch (err) { console.error("Fetch error:", err); }
  };

    const handleSave = async (id) => {
    try {
        // Ensure we are sending a number, not a string from the input
        const payload = {
        paid_amount: parseFloat(editForm.paid_amount) || 0
        };

        const res = await axios.put(`http://localhost:5000/api/finance/update/${id}`, payload);
        
        if (res.data.success) {
        setEditingId(null);
        // Refresh the table to show the new calculated Due Amount from the server
        fetchFinanceData(); 
        }
    } catch (err) {
        console.error("Save Error:", err);
        alert("Save failed. Check if the server is running.");
    }
    };

  return (
    <div className="finance-container">
      <div className="search-bar-container">
        <Search className="search-icon" size={18} />
        <input 
          type="text" 
          placeholder="Search deal, company, or owner..." 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <table className="finance-table">
        <thead>
          <tr>
            <th>Deal Name</th>
            <th>Company</th>
            <th>Total Amount</th>
            <th>Paid Amount</th>
            <th>Due Amount (Balance)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects
            .filter(p => p.deal_name?.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((p) => {
              const totalContract = parseFloat(p.total_amount) || 0;
              const currentPaidInput = editingId === p.id ? (parseFloat(editForm.paid_amount) || 0) : (parseFloat(p.paid_amount) || 0);
              const liveDue = totalContract - currentPaidInput;

              return (
                <tr key={p.id}>
                  <td>{p.deal_name}</td>
                  <td>{p.company}</td>
                  
                  {/* Total Amount: Now strictly Read-Only */}
                  <td className="readonly-total_amount">
                    ₱{totalContract.toLocaleString()}
                  </td>

                  {/* Paid Amount: Editable */}
                  <td>
                    {editingId === p.id ? (
                      <input 
                        type="number" 
                        autoFocus
                        value={editForm.paid_amount} 
                        onChange={(e) => setEditForm({ paid_amount: e.target.value })} 
                      />
                    ) : `₱${(parseFloat(p.paid_amount) || 0).toLocaleString()}`}
                  </td>

                  {/* Due Amount: Automatic Calculation */}
                  <td>
                    <span style={{ 
                      color: liveDue > 0 ? '#ef4444' : '#22c55e', 
                      fontWeight: 'bold' 
                    }}>
                      ₱{liveDue.toLocaleString()}
                    </span>
                  </td>
                  
                  <td className="actions-cell">
                    <div className="action-buttons">
                      {editingId === p.id ? (
                        <>
                          <button onClick={() => handleSave(p.id)} className="icon-btn save"><Save size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="icon-btn cancel"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => {
                            setEditingId(p.id);
                            setEditForm({ paid_amount: p.paid_amount });
                          }} className="icon-btn edit"><Pencil size={16} /></button>
                          <button className={`icon-btn approve ${p.status === 'Approved' ? 'active' : ''}`}>
                            <CheckCircle2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

export default Finance;
