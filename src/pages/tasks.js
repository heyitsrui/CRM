import React, { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, Clock } from "lucide-react";
import axios from "axios";
import "../styles/tasks.css";

// The fix is right here: we must accept { currentUser } as a prop
const Tasks = ({ currentUser }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    priority: "Medium",
    deadline: ""
  });

  // Fetch Tasks from Backend
  const fetchTasks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tasks");
      if (res.data.success) setTasks(res.data.tasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;

    // Safety check to ensure currentUser exists before sending to DB
    if (!currentUser || !currentUser.id) {
      alert("User session not found. Please log in again.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/tasks", {
        ...newTask,
        user_id: currentUser.id // This is line 40 that was erroring
      });

      if (res.data.success) {
        setTasks([res.data.task, ...tasks]);
        setNewTask({ title: "", priority: "Medium", deadline: "" });
      }
    } catch (err) {
      console.error("Add task error:", err);
      alert("Failed to add task: " + (err.response?.data?.message || "Check server console"));
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
    try {
      await axios.put(`http://localhost:5000/api/tasks/${id}/status`, { status: newStatus });
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="tasks-container">
        <h2 className="section-title">Team Tasks</h2>

        <form className="add-task-form" onSubmit={handleAddTask}>
          <input 
            type="text" 
            placeholder="What needs to be done?" 
            value={newTask.title}
            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
          />
          <select 
            value={newTask.priority} 
            onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
          <input 
            type="date" 
            value={newTask.deadline}
            onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
          />
          <button type="submit" className="add-task-btn"><Plus size={18} /> Add</button>
        </form>

        <div className="task-list">
          {tasks.map((task) => (
            <div key={task.id} className={`task-item priority-${task.priority.toLowerCase()}`}>
              <div className="task-main">
                <button 
                  className={`status-toggle ${task.status === "Completed" ? "is-done" : ""}`}
                  onClick={() => toggleStatus(task.id, task.status)}
                >
                  <CheckCircle size={20} />
                </button>
                <div className="task-info">
                  <h4 className={task.status === "Completed" ? "strikethrough" : ""}>{task.title}</h4>
                  <span className="task-meta">
                    <Clock size={12} /> {task.deadline || "No deadline"}
                  </span>
                </div>
              </div>
              
              <div className="task-actions">
                <span className={`priority-tag ${task.priority.toLowerCase()}`}>{task.priority}</span>
                <button className="delete-task-btn" onClick={() => handleDeleteTask(task.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
