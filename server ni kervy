import React, { useState, useEffect } from 'react';
import { Edit, Trash2, CheckCircle, LayoutGrid, CheckSquare, Trophy } from 'lucide-react';
import axios from 'axios';
import '../styles/tasks.css';

// This detects the server IP automatically so it works on any PC
const API_BASE_URL = `http://${window.location.hostname}:5000`;

const Tasks = ({ loggedInUser }) => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Low'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tasks`);
      if (res.data.success) setTasks(res.data.tasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await axios.put(`${API_BASE_URL}/api/tasks/${task.id}/status`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent sending 'null' user_id to the database
    if (!loggedInUser || !loggedInUser.id) {
      alert("Save Failed: You must be logged in on this PC to add tasks.");
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        user_id: loggedInUser.id
      };

      if (editingTask) {
        await axios.put(`${API_BASE_URL}/api/tasks/${editingTask.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/tasks`, payload);
      }
      closeModal();
      fetchTasks();
    } catch (err) {
      console.error("Save Error:", err.response?.data || err);
      alert("Error saving task. Check your network or login status.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({ title: '', description: '', priority: 'Low' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this task?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/tasks/${id}`);
        fetchTasks();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const filteredTasks = tasks.filter(t => filter === 'All' || t.priority === filter);

  return (
    <div className="tasks-page-container">
      {/* 📊 TOP PROGRESS SECTION */}
      <div className="stats-cards-row">
        <div className="stat-card-mini">
          <div className="stat-icon-bg blue"><LayoutGrid size={20} /></div>
          <div className="stat-card-info">
            <span className="stat-number">{total}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-bg green"><CheckSquare size={20} /></div>
          <div className="stat-card-info">
            <span className="stat-number">{progressPercent}%</span>
            <span className="stat-label">Progress</span>
            <div className="mini-progress-bar">
              <div className="fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-bg purple"><Trophy size={20} /></div>
          <div className="stat-card-info">
            <span className="stat-number">{completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      <div className="tasks-main-content">
        <div className="tasks-header">
          <h2>All Tasks</h2>
          <div className="header-actions">
            <div className="filter-pill">
              {['All', 'Low', 'Medium', 'High'].map(f => (
                <button 
                  key={f} 
                  className={filter === f ? 'active' : ''} 
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              Add a new Task
            </button>
          </div>
        </div>

        <div className="tasks-grid">
          {filteredTasks.map(task => (
            <div className={`task-card ${task.status === 'Completed' ? 'status-completed' : ''}`} key={task.id}>
              <div className="card-content">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
              </div>
              <div className="task-footer">
                <span className="task-meta">Yesterday</span>
                <span className={`priority-label ${task.priority?.toLowerCase()}`}>{task.priority}</span>
                <div className="action-icons">
                  <CheckCircle 
                    size={18} 
                    className={`icon-check ${task.status === 'Completed' ? 'checked' : ''}`} 
                    onClick={() => handleToggleComplete(task)}
                  />
                  <Edit 
                    size={18} 
                    className="icon-edit" 
                    onClick={() => { setEditingTask(task); setFormData(task); setIsModalOpen(true); }} 
                  />
                  <Trash2 
                    size={18} 
                    className="icon-delete" 
                    onClick={() => handleDelete(task.id)} 
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="task-card add-dummy" onClick={() => setIsModalOpen(true)}>
             <span>+ Add New Task</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-body">
            <h3>{editingTask ? 'Edit Task' : 'New Task'}</h3>
            <form onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="Title" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
              />
              <textarea 
                placeholder="Description" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
              <select 
                value={formData.priority} 
                onChange={e => setFormData({...formData, priority: e.target.value})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <div className="form-actions">
                <button type="button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-save">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
