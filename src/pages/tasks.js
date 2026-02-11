import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  CheckCircle, 
  LayoutGrid, 
  CheckSquare, 
  Trophy, 
  UserPlus, 
  User,
  Clock
} from 'lucide-react';
import axios from 'axios';
import '../styles/tasks.css';

const API_BASE_URL = `http://${window.location.hostname}:5000`;

const Tasks = ({ loggedInUser }) => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]); 
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const isAdminOrManager = ['admin', 'manager'].includes(loggedInUser?.role?.toLowerCase());

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Low',
    assigned_to: '' 
  });

  useEffect(() => {
    fetchData();
  }, [loggedInUser]);

  const fetchData = async () => {
    try {
      const taskRes = await axios.get(`${API_BASE_URL}/api/tasks`);
      if (taskRes.data.success) {
        const allTasks = taskRes.data.tasks;
        const visibleTasks = isAdminOrManager 
          ? allTasks 
          : allTasks.filter(t => parseInt(t.user_id) === parseInt(loggedInUser.id));
        
        setTasks(visibleTasks);
      }

      if (isAdminOrManager) {
        const userRes = await axios.get(`${API_BASE_URL}/api/users`);
        if (userRes.data.success) setUsers(userRes.data.users);
      }
    } catch (err) {
      console.error("Data fetch error:", err);
    }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await axios.put(`${API_BASE_URL}/api/tasks/${task.id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loggedInUser?.id) return alert("Session expired.");

    // ✅ DEBUG: Check this in your browser console (F12) to see who is being assigned
    const targetUserId = (isAdminOrManager && formData.assigned_to) ? formData.assigned_to : loggedInUser.id;
    console.log("Saving task for User ID:", targetUserId);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        user_id: targetUserId 
      };

      if (editingTask) {
        await axios.put(`${API_BASE_URL}/api/tasks/${editingTask.id}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/api/tasks`, payload);
      }
      closeModal();
      fetchData();
    } catch (err) {
      console.error("Save Error:", err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({ title: '', description: '', priority: 'Low', assigned_to: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this task?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/tasks/${id}`);
        fetchData();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const filteredTasks = tasks.filter(t => filter === 'All' || t.priority === filter);

  return (
    <div className="tasks-page-container">
      {/* 📊 STATS HEADER */}
      <div className="stats-cards-row">
        <div className="stat-card-mini">
          <div className="stat-icon-bg blue"><LayoutGrid size={20} /></div>
          <div className="stat-card-info">
            <span className="stat-number">{tasks.length}</span>
            <span className="stat-label">Tasks</span>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon-bg green"><CheckSquare size={20} /></div>
          <div className="stat-card-info">
            <span className="stat-number">
                {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100) : 0}%
            </span>
            <span className="stat-label">Progress</span>
          </div>
        </div>
      </div>

      <div className="tasks-main-content">
        <div className="tasks-header">
          <h2>{isAdminOrManager ? "All Employee Tasks" : "My Tasks"}</h2>
          <div className="header-actions">
            <div className="filter-pill">
              {['All', 'Low', 'Medium', 'High'].map(f => (
                <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
            </div>

            {isAdminOrManager && (
              <button className="btn-assign" onClick={() => setIsModalOpen(true)}>
                <UserPlus size={18} style={{ marginRight: '8px' }} />
                Assign to User
              </button>
            )}

            {!isAdminOrManager && (
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    + New Task
                </button>
            )}
          </div>
        </div>

        <div className="tasks-grid">
          {filteredTasks.map(task => (
            <div className={`task-card ${task.status === 'Completed' ? 'status-completed' : ''}`} key={task.id}>
              <div className="card-content">
                <div className="task-card-header">
                  <h3>{task.title}</h3>
                  <span className={`priority-indicator ${task.priority?.toLowerCase()}`}></span>
                </div>
                <p>{task.description}</p>
                
                {/* ✅ IMPROVED OWNER BADGE */}
                {isAdminOrManager && (
                  <div className="task-owner-info">
                    <User size={12} />
                    <span>
                        {parseInt(task.user_id) === parseInt(loggedInUser.id) 
                            ? <strong>Created by Me (Admin)</strong> 
                            : <span>Assigned to: <strong>{task.user_name || `User ID: ${task.user_id}`}</strong></span>
                        }
                    </span>
                  </div>
                )}
              </div>

              <div className="task-footer">
                <span className="task-meta"><Clock size={12}/> {task.priority}</span>
                <div className="action-icons">
                  <CheckCircle 
                    size={18} 
                    className={`icon-check ${task.status === 'Completed' ? 'checked' : ''}`} 
                    onClick={() => handleToggleComplete(task)}
                  />
                  <Edit size={18} className="icon-edit" onClick={() => { 
                      setEditingTask(task); 
                      setFormData({
                          title: task.title,
                          description: task.description,
                          priority: task.priority,
                          assigned_to: task.user_id
                      }); 
                      setIsModalOpen(true); 
                  }} />
                  <Trash2 size={18} className="icon-delete" onClick={() => handleDelete(task.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-body">
            <h3>{editingTask ? 'Edit Task' : 'New Task Assignment'}</h3>
            <form onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="Task Title" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
              />
              <textarea 
                placeholder="Instructions..." 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
              
              <div className="form-row">
                <select 
                  value={formData.priority} 
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>

                {/* ✅ ASSIGN DROPDOWN */}
                {isAdminOrManager && (
                  <select 
                    value={formData.assigned_to} 
                    onChange={e => setFormData({...formData, assigned_to: e.target.value})}
                    required
                  >
                    <option value="">Select Employee...</option>
                    {/* Admin can also assign to themselves */}
                    <option value={loggedInUser.id}>Assign to Myself (Admin)</option>
                    {users.filter(u => u.id !== loggedInUser.id).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-save">Confirm & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
