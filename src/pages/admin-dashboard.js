import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
import TopNav from "../components/topnav";
import UserManagement from "./user";
import MyProfile from "./myprofile";
import Proposal from "./proposal";
import Tasks from "./tasks";
import Company from "./company";
import Client from './client';
import Projects from './projects';
import CPass from "./c-pass";
import Finance from "./finance";
import TimeTree from "./timetree";
import Sheets from "./project-sheets";

// --- Chart.js Imports ---
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

import {
  LayoutGrid,
  FileText,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Briefcase,
  AlertCircle,
  History,
  RefreshCcw,
  Search
} from "lucide-react";

import "../styles/dashboard.css";

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

/* --- Sub-Component: Dashboard Overview --- */
const DashboardOverview = ({ stats, tasks }) => {
  // Data preparation for the Doughnut Chart
  const chartData = {
    labels: ["Lead", "Proposal", "Purchase Order", "Site Survey-POC", "Closed Lost", 
      "Completed Project", "Inactive Project", "Renewal Support", "Previous Year Project", "Recovered Project"],
    datasets: [
      {
        data: [
          stats?.leads || 0,
          stats?.proposal || 0,
          stats?.purchaseorder || 0,
          stats?.sitesurveypoc || 0,
          stats?.closedlost || 0,
          stats?.completedproject || 0,
          stats?.inactiveproject || 0,
          stats?.renewalsupport || 0,
          stats?.previousyearproject || 0,
          stats?.recoveredproject || 0,
        ],
        backgroundColor: [
          "#f39c12", // Lead
          "#3498db", // Proposal
          "#9b59b6", // Purchase Order
          "#1abc9c", // Site Survey-POC
          "#e74c3c", // Closed Lost
          "#27ae60", // Completed Project
          "#95a5a6", // Inactive Project
          "#e67e22", // Renewal Support
          "#34495e", // Previous Year Project
          "#fd79a8"  // Recovered Project
        ],
        hoverOffset: 4,
        borderWidth: 0,
        cutout: "70%",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "right",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: "'Poppins', sans-serif",
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div className="dashboard-content">
      {/* Status Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon-circle lead"><LayoutGrid size={20} /></div>
          <div>
            <h3>{stats?.leads || 0}</h3>
            <p>Projects in Lead</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-circle proposal"><FileText size={20} /></div>
          <div>
            <h3>{stats?.proposal || 0}</h3>
            <p>Projects in Proposal</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-circle order"><Briefcase size={20} /></div>
          <div>
            <h3>{stats?.purchaseorder || 0}</h3>
            <p>Purchase Order</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-circle poc"><Search size={20} /></div>
          <div>
            <h3>{stats?.sitesurveypoc || 0}</h3>
            <p>Site Survey-POC</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-circle lost"><AlertCircle size={20} /></div>
          <div>
            <h3>{stats?.closedlost || 0}</h3>
            <p>Closed Lost</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-circle completed"><CheckCircle size={20} /></div>
          <div>
            <h3>{stats?.completedproject || 0}</h3>
            <p>Completed Project</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-circle inactive"><Clock size={20} /></div>
          <div>
            <h3>{stats?.inactiveproject || 0}</h3>
            <p>Inactive Project</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-circle renewal"><RefreshCcw size={20} /></div>
          <div>
            <h3>{stats?.renewalsupport || 0}</h3>
            <p>Renewal Support</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-circle previous"><History size={20} /></div>
          <div>
            <h3>{stats?.previousyearproject || 0}</h3>
            <p>Previous Year Project</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-circle recovered"><RefreshCcw size={20} /></div>
          <div>
            <h3>{stats?.recoveredproject || 0}</h3>
            <p>Recovered Project</p>
          </div>
        </div>
      </div>

      {/* Money Stats */}
      <div className="money-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '20px' }}>
        <div className="money-card" style={{ borderLeft: '5px solid #22c55e' }}>
          <DollarSign className="money-icon" style={{ color: '#22c55e' }} />
          <div>
            <h3>₱{(Number(stats?.totalPaid) || 0).toLocaleString()}</h3>
            <p>Total Paid Amount</p>
          </div>
        </div>
        <div className="money-card" style={{ borderLeft: '5px solid #ef4444' }}>
          <DollarSign className="money-icon" style={{ color: '#ef4444' }} />
          <div>
            <h3>₱{(Number(stats?.totalDue) || 0).toLocaleString()}</h3>
            <p>Total Due Amount</p>
          </div>
        </div>
      </div>

      {/* Chart & My Tasks Section */}
      <div className="bottom-sections">
        <div className="chart-box">
          <h3>Project Status Overview</h3>
          <div style={{ height: "300px", marginTop: "10px", position: "relative" }}>
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* ✅ REPLACED RECENT ACTIVITY WITH MY TASKS */}
        <div className="activity-box">
          <div className="box-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>My Tasks</h3>
            <span className="badge-count">{tasks.length} Active</span>
          </div>
          
          <div className="dashboard-task-scroll" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {tasks && tasks.length > 0 ? (
              tasks.map((task, i) => (
                <div key={i} className="activity-item" style={{ borderLeft: `4px solid ${task.priority === 'High' ? '#e74c3c' : task.priority === 'Medium' ? '#f39c12' : '#3498db'}`, paddingLeft: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p className="act-title" style={{ fontWeight: '600', margin: '0' }}>{task.title}</p>
                      <p className="act-desc" style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>
                        {task.description ? (task.description.substring(0, 50) + (task.description.length > 50 ? '...' : '')) : 'No description'}
                      </p>
                    </div>
                    {task.status === 'Completed' ? 
                      <CheckCircle size={16} color="#2ecc71" /> : 
                      <Clock size={16} color="#999" />
                    }
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <span style={{ fontSize: '11px', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>{task.priority}</span>
                    <span style={{ fontSize: '11px', color: task.status === 'Completed' ? '#2ecc71' : '#f39c12' }}>{task.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                <p>No tasks assigned to you.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Main Dashboard Component --- */
export default function Dashboard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [stats, setStats] = useState(null);
  const [userTasks, setUserTasks] = useState([]); // Replaced activities state
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) 
      navigate("/");
    else 
      setLoggedInUser(user); 
  }, [navigate]);

  useEffect(() => {
    if (!loggedInUser) return;

    const fetchData = async () => {
      try {
        // Fetch Dashboard Stats
        const statsRes = await fetch("http://localhost:5000/api/dashboard-stats");
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.stats);

        // Fetch Tasks and filter for the logged-in user
        const taskRes = await fetch("http://localhost:5000/api/tasks");
        const taskData = await taskRes.json();
        
        if (taskData.success) {
          // Filtering logic to match Tasks.js logic
          const myTasks = taskData.tasks.filter(t => 
            parseInt(t.user_id) === parseInt(loggedInUser.id)
          );
          setUserTasks(myTasks);
        }
      } catch (err) {
        console.error("Error refreshing dashboard data:", err);
      }
    };

    if (activeIndex === 0) fetchData();
  }, [loggedInUser, activeIndex]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    navigate("/");
  };

  const refreshUserData = () => {
    const updatedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    setLoggedInUser(updatedUser);
  };

  const renderContent = () => {
    switch (activeIndex) {
      case 0:
        return <DashboardOverview stats={stats} tasks={userTasks} />;
      case 'project pipeline':
        return <Proposal currentUser={loggedInUser} />;
      case 'project sheets':
        return <Sheets currentUser={loggedInUser} />;
      case 2:
        return <Projects currentUser={loggedInUser} />;
      case 3: 
        return <Finance loggedInUser={loggedInUser?.role} />;
      case 'clients':
        return <Client userRole={loggedInUser?.role} />;
      case 'company':
        return <Company userRole={loggedInUser?.role} />;
      case 4:
      case 'my task':
        return <Tasks loggedInUser={loggedInUser} />;
      case 'time tree':
        return <TimeTree loggedInUser={loggedInUser} />;
      case 6:
        if (loggedInUser?.role === 'admin') {
          return <UserManagement currentUser={loggedInUser} />;
        } else {
          return (
            <div className="dashboard-content">
              <h2>Access Denied</h2>
              <p>You do not have permission to access User Management.</p>
            </div>
          );
        }
      case 99: 
        return < MyProfile user={loggedInUser} onProfileUpdate={refreshUserData} />;
      case 100:
        return <CPass user={loggedInUser} />;
      default:
        return (
          <div className="dashboard-content">
            <h2>Coming Soon</h2>
            <p>This section is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        activeIndex={activeIndex} 
        setActiveIndex={setActiveIndex} 
        onLogout={handleLogout}
        currentUser={loggedInUser}
      />
      
      <main className="main-area">
        <TopNav 
          loggedInUser={loggedInUser} 
          onNavigate={setActiveIndex} 
        />
        
        <div className="view-container">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
