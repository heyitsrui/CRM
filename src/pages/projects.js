import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  LayoutGrid, 
  UserCircle, 
  Trophy, 
  Send, 
  DollarSign, 
  Building2, 
  Phone 
} from "lucide-react";
import axios from "axios";
import "../styles/projects.css";

const Projects = ({ currentUser }) => {
  const [projects, setProjects] = useState([]);
  const [visibleDetails, setVisibleDetails] = useState({});
  const [visibleNotes, setVisibleNotes] = useState({});
  const [newComment, setNewComment] = useState({});

  const fetchData = async () => {
    try {
      // Fetches from your /api/projects-detailed route which joins projects + project_comments
      const res = await axios.get("http://localhost:5000/api/projects-detailed");
      if (res.data.success) {
        setProjects(res.data.projects);
      }
    } catch (err) { 
      console.error("Project Fetch Error:", err); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddComment = async (projId) => {
    if (!newComment[projId]?.trim()) return;
    try {
      await axios.post(`http://localhost:5000/api/projects/${projId}/comments`, {
        user_name: currentUser?.name || "User",
        comment_text: newComment[projId]
      });
      setNewComment(prev => ({ ...prev, [projId]: "" }));
      fetchData(); // Refresh to show multiple project comments
    } catch (err) {
      console.error("Comment Error:", err);
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

  return (
    <div className="projects-page-wrapper">
      <div className="projects-container">
        {/* --- STATS HEADER --- */}
        <div className="stats-header-grid">
          <div className="stat-pill-card">
            <div className="icon-wrap blue"><LayoutGrid size={20} /></div>
            <div className="stat-text"><h3>{total}</h3><p>Active Projects</p></div>
          </div>
          <div className="stat-pill-card">
            <div className="icon-wrap green"><CheckCircle size={20} /></div>
            <div className="stat-text">
              <h3>{progress}%</h3><p>Completion Rate</p>
              <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${progress}%` }}></div></div>
            </div>
          </div>
          <div className="stat-pill-card">
            <div className="icon-wrap purple"><Trophy size={20} /></div>
            <div className="stat-text"><h3>{approvedCount}</h3><p>Approved</p></div>
          </div>
        </div>

        <div className="projects-content">
          <h2 className="section-title">Project Pipelines & Tracking</h2>
          
          <div className="project-items-stack">
            {projects.length === 0 ? (
              <div className="white-project-card">No active projects found.</div>
            ) : (
              projects.map((proj) => (
                <div 
                  key={proj.id} 
                  className="white-project-card project-card-interactive" 
                  onClick={() => toggleDetails(proj.id)}
                >
                  <div className="card-details">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Using deal_name as the primary project title from your DB schema */}
                      <h4>{proj.deal_name || "Project Item"}</h4>
                      <span className={`status-badge ${proj.status?.toLowerCase() || 'lead'}`}>
                        {proj.status || 'Lead'}
                      </span>
                    </div>
                    
                    <div className="meta-row">
                      <span><Building2 size={14} /> {proj.company || "No Company"}</span>
                      <span><UserCircle size={14} /> <strong>{proj.deal_owner || "Owner"}</strong></span>
                      <span><DollarSign size={14} /> ₱{Number(proj.amount || 0).toLocaleString()}</span>
                    </div>

                    {/* CLICKABLE EXPANDED DETAILS */}
                    {visibleDetails[proj.id] && (
                      <div className="project-expanded-info" onClick={(e) => e.stopPropagation()}>
                        <div className="details-grid">
                          <p><Clock size={14}/> <strong>Date Created:</strong> {new Date(proj.created_at).toLocaleDateString()}</p>
                          <p><Phone size={14}/> <strong>Contact Info:</strong> {proj.contact || "N/A"}</p>
                          <p><strong>Site Address:</strong> {proj.address || "N/A"}</p>
                        </div>
                        <p className="proj-description"><strong>Project Notes:</strong> {proj.description || "No description provided."}</p>
                        
                        {/* PROJECT COMMENTS (MULTIPLE) */}
                        <div className="notes-toggle-wrapper">
                          <button 
                            className="notes-toggle-btn" 
                            onClick={() => setVisibleNotes(prev => ({ ...prev, [proj.id]: !prev[proj.id] }))}
                          >
                            <MessageSquare size={12} /> Discussion ({proj.comments?.length || 0})
                          </button>
                          
                          {visibleNotes[proj.id] && (
                            <div className="comments-thread">
                              <div className="comments-list">
                                {proj.comments && proj.comments.map((c, i) => (
                                  <div key={i} className="comment-item">
                                    <span className="comment-user">{c.user_name}</span>
                                    <span className="comment-text">{c.comment_text}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="comment-input-row">
                                <input 
                                  type="text" 
                                  placeholder="Type a project update..." 
                                  value={newComment[proj.id] || ""}
                                  onChange={(e) => setNewComment({...newComment, [proj.id]: e.target.value})}
                                />
                                <button onClick={() => handleAddComment(proj.id)}><Send size={14} /></button>
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
