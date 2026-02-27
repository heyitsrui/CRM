import React, { useState, useEffect, useMemo } from "react";
import { 
  Clock, 
  MessageSquare, 
  UserCircle, 
  Send, 
  DollarSign, 
  Building2, 
  Phone,
  Search, X, Filter, Paperclip, Trash2
} from "lucide-react";
import axios from "axios";
import "../styles/projects.css";

const Projects = ({ currentUser }) => {
  const [projects, setProjects] = useState([]);
  const [visibleDetails, setVisibleDetails] = useState({});
  const [visibleNotes, setVisibleNotes] = useState({});
  const [newComment, setNewComment] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedFiles, setSelectedFiles] = useState({}); 
  const [isUploading, setIsUploading] = useState(false);
  

const columns = [
    'All', 'Lead', 'For Proposal', 'Proposal', 'Purchase Order', 'Site Survey-POC', 
    'Closed Lost', 'Completed Project', 'Inactive Project', 
    'Renewal Support', 'Previous Year Project', 'Recovered Project'
  ];

  // ✅ Debugging: This will tell you exactly what properties exist in your user object
  useEffect(() => {
    if (currentUser) {
      console.log("Projects Component loaded. Current User Data:", currentUser);
    } else {
      console.warn("Projects Component Warning: currentUser is undefined/null.");
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/projects-detailed");
      if (res.data.success) {
        setProjects(res.data.projects);
      }
    } catch (err) { 
      console.error("Project Fetch Error:", err); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleAddComment = async (projId) => {
    const commentText = newComment[projId]?.trim();
    if (!commentText) return;

    if (!currentUser) {
      alert("You must be logged in to post comments.");
      return;
    }

    // ✅ FIXED: Check all possible name fields from your database
    const authorName = currentUser.name || currentUser.username || currentUser.display_name || "User";

    try {
      await axios.post(`http://localhost:5000/api/projects/${projId}/comments`, {
        user_name: authorName,
        comment_text: commentText
      });
      
      setNewComment(prev => ({ ...prev, [projId]: "" }));
      fetchData(); // Refresh list to show the new comment
    } catch (err) {
      console.error("Comment Error:", err);
      alert("Failed to post comment. Check server connection.");
    }
  };

  const handleFileUpload = async (projId) => {
    const file = selectedFiles[projId];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaded_by", currentUser?.name || "User");

    try {
      setIsUploading(true);
      await axios.post(`http://localhost:5000/api/projects/${projId}/attachments`, formData);
      setSelectedFiles(prev => ({ ...prev, [projId]: null }));
      fetchData(); // Reload UI to show the new file
    } catch (err) {
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (fileId) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/attachments/${fileId}`);
      fetchData(); // Reload UI
    } catch (err) {
      alert("Delete failed");
    }
  };

  const toggleDetails = (id) => {
    setVisibleDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Stats logic
  const total = projects.length;
  const approvedCount = projects.filter(p => 
    p.status === "Approved" || p.status === "Signature"
  ).length;
  const progress = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

const filteredData = useMemo(() => {
    return projects.filter((p) => {
      const projectName = p.deal_name || "";
      const companyName = p.company || "";
      
      const matchesSearch = projectName.toLowerCase().includes(search.toLowerCase()) || 
                            companyName.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, projects]);

  // Helper to format class names for CSS (e.g., "Closed Lost" -> "closed-lost")
  const statusClass = (status) => status?.toLowerCase().replace(/[\s/]+/g, '-');

  return (
    <div className="projects-page-wrapper">
      <div className="projects-container">
      <div className="proposal-header">
            <h1>All Projects</h1>
            <div className="header-actions">
              {/* ✅ Status Filter */}
              <div className="filter-wrapper">
                <Filter size={18} className="filter-icon" />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="status-select"
                >
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* ✅ Search Bar */}
              <div className="search-container">
                <Search size={18} className="search-icon-fixed" style={{position: 'absolute', left: '15px', color: '#94a3b8'}} />
                <input
                  className="search-input"
                  style={{paddingLeft: '35px'}}
                  placeholder="Search name or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <X 
                    size={18} 
                    className="clear-icon" 
                    onClick={() => setSearch("")} 
                  />
                )}
              </div>
            </div>
            </div>

            <div className="projects-content">
                      <h2 className="section-title">Project Pipelines & Tracking</h2>
                      <div className="project-items-stack">
                        {/* ✅ FIXED: Changed 'projects' to 'filteredData' */}
                        {filteredData.length === 0 ? (
                          <div className="white-project-card">No projects found matching your criteria.</div>
                        ) : (
                          filteredData.map((proj) => (
                            <div 
                              key={proj.id} 
                              className="white-project-card project-card-interactive" 
                              /* We stop propagation here so clicking the card toggles, 
                                but clicking buttons inside doesn't double-toggle */
                              onClick={() => toggleDetails(proj.id)}
                            >
                              <div className="card-details">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <h4>{proj.deal_name || "Project Item"}</h4>
                                  {/* ✅ Status Class Helper for CSS colors */}
                                  <span className={`status-badge ${statusClass(proj.status)}`}>
                                    {proj.status || 'Lead'}
                                  </span>
                                </div>
                                
                                <div className="meta-row">
                                  <span><Building2 size={14} /> {proj.company || "No Company"}</span>
                                  <span><UserCircle size={14} /> <strong>{proj.deal_owner || "Owner"}</strong></span>
                                  <span><DollarSign size={14} /> ₱{Number(proj.total_amount || 0).toLocaleString()}</span>
                                </div>

                                {/* EXPANDED DETAILS */}
                                {visibleDetails[proj.id] && (
                                  <div className="project-expanded-info" onClick={(e) => e.stopPropagation()}>
                                    <div className="details-grid">
                                      <p><Clock size={14}/> <strong>Date Created:</strong> {new Date(proj.created_at).toLocaleDateString()}</p>
                                      <p><Phone size={14}/> <strong>Contact:</strong> {proj.contact || "N/A"}</p>
                                      <p><strong>Site Address:</strong> {proj.address || "N/A"}</p>
                                    </div>
                                    <p className="proj-description"><strong>Project Notes:</strong> {proj.description || "No description provided."}</p>
                                    
                                    {/* ATTACHMENTS SECTION */}
                                <div className="attachments-section" style={{marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                                  <h5 style={{fontSize: '14px'}}><Paperclip size={14}/> Attachments</h5>
                                  
                                  <div className="files-list">
                                    {proj.attachments?.map((file) => (
                                      <div key={file.id} style={{display: 'flex', justifyContent: 'space-between', padding: '5px', background: '#f1f5f9', marginBottom: '5px'}}>
                                        <a 
                                          href={`http://localhost:5000/uploads/${file.file_path}`} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          style={{color: '#2563eb', textDecoration: 'none', fontSize: '13px'}}
                                        >
                                          {file.file_name}
                                        </a>
                                        <Trash2 size={14} color="red" onClick={() => handleDeleteAttachment(file.id)} style={{cursor: 'pointer'}} />
                                      </div>
                                    ))}
                                  </div>

                                  <input 
                                    type="file" 
                                    onChange={(e) => setSelectedFiles({...selectedFiles, [proj.id]: e.target.files[0]})} 
                                  />
                                  {selectedFiles[proj.id] && (
                                    <button onClick={() => handleFileUpload(proj.id)} disabled={isUploading}>
                                      {isUploading ? "..." : "Upload"}
                                    </button>
                                  )}
                                </div>

                                    {/* DISCUSSION SECTION */}
                                    <div className="notes-toggle-wrapper">
                                      <button 
                                        className="notes-toggle-btn" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setVisibleNotes(prev => ({ ...prev, [proj.id]: !prev[proj.id] }));
                                        }}
                                      >
                                        <MessageSquare size={12} /> Discussion ({proj.comments?.length || 0})
                                      </button>
                                      
                                      {visibleNotes[proj.id] && (
                                        <div className="comments-thread">
                                          <div className="comments-list">
                                            {proj.comments && proj.comments.length > 0 ? (
                                              proj.comments.map((c, i) => (
                                                <div key={i} className="comment-item">
                                                  <span className="comment-user">{c.user_name || "Unknown User"}:</span>
                                                  <span className="comment-text">{c.comment_text}</span>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="no-comments">No updates yet.</p>
                                            )}
                                          </div>
                                          <div className="comment-input-row">
                                            <input 
                                              type="text" 
                                              placeholder="Type a project update..." 
                                              value={newComment[proj.id] || ""}
                                              onChange={(e) => setNewComment({...newComment, [proj.id]: e.target.value})}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  handleAddComment(proj.id);
                                                }
                                              }}
                                            />
                                            <button onClick={() => handleAddComment(proj.id)}>
                                              <Send size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
  );
};

export default Projects;
