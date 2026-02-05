import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Lightbulb, FileText, Landmark, BarChart3, Users, LogOut, 
  DollarSign, User, Settings, Lock 
} from 'lucide-react';
import '../styles/dashboard.css';

// --- Sub-Component: Dashboard Content ---
const DashboardOverview = ({ stats, activities }) => (
  <div className="dashboard-content">
    {/* Status Cards Row */}
    <div className="stats-grid">
      <div className="stat-card">
        <div className="icon-circle blue"><LayoutGrid size={20} /></div>
        <div><h3>{stats?.leads || 0}</h3><p>Projects in Lead</p></div>
      </div>
      <div className="stat-card">
        <div className="icon-circle yellow"><FileText size={20} /></div>
        <div><h3>{stats?.bidding || 0}</h3><p>Projects in Bidding</p></div>
      </div>
      <div className="stat-card">
        <div className="icon-circle green"><FileText size={20} /></div>
        <div><h3>{stats?.signature || 0}</h3><p>Projects Signature</p></div>
      </div>
      <div className="stat-card">
        <div className="icon-circle red"><ClockIcon /></div>
        <div><h3>{stats?.hold || 0}</h3><p>Projects on Hold</p></div>
      </div>
      <div className="stat-card">
        <div className="icon-circle teal"><Users size={20} /></div>
        <div><h3>{stats?.approved || 0}</h3><p>Approved Projects</p></div>
      </div>
    </div>

    {/* Money Stats Row */}
    <div className="money-grid">
      <div className="money-card">
        <DollarSign className="money-icon" />
        <div>
          <h3>${(stats?.totalPaid || 0).toLocaleString()}</h3>
          <p>Total Paid Amount For All Projects</p>
        </div>
      </div>
      <div className="money-card">
        <DollarSign className="money-icon" />
        <div>
          <h3>${(stats?.totalDue || 0).toLocaleString()}</h3>
          <p>Total Due Amount For All Projects</p>
        </div>
      </div>
    </div>

    {/* Bottom Section: Charts & Activity */}
    <div className="bottom-sections">
      <div className="chart-box">
        <h3>Project Status Overview</h3>
        <div className="placeholder-chart">
           {/* You can plug a real Chart.js component here later */}
           <div className="pie-chart-mockup"></div> 
        </div>
      </div>

      <div className="activity-box">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {activities.length > 0 ? activities.map((act, i) => (
            <div key={i} className="activity-item">
              <div className="activity-icon"><FileText size={16}/></div>
              <div className="activity-details">
                <p className="act-title">{act.title}</p>
                <p className="act-desc">{act.description}</p>
                <span className="act-date">{act.date}</span>
              </div>
            </div>
          )) : <p>No recent activity found.</p>}
        </div>
      </div>
    </div>
  </div>
);

// Helper Icon for Clock (since standard import might vary)
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

// --- Main Page Component ---
export default function DashboardPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [admin, setAdmin] = useState({ name: 'Loading...', email: '' });
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    // 1. Fetch Admin
    fetch('http://localhost:5000/api/admin-profile')
      .then(res => res.json())
      .then(data => data.success && setAdmin(data.user))
      .catch(err => console.error("Admin fetch error:", err));

    // 2. Fetch Stats
    fetch('http://localhost:5000/api/dashboard-stats')
      .then(res => res.json())
      .then(data => data.success && setStats(data.stats))
      .catch(err => console.error("Stats fetch error:", err));

    // 3. Fetch Activity
    fetch('http://localhost:5000/api/recent-activity')
      .then(res => res.json())
      .then(data => data.success && setActivities(data.activities))
      .catch(err => console.error("Activity fetch error:", err));
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutGrid size={20} /> },
    { name: 'Proposal', icon: <Lightbulb size={20} /> },
    { name: 'Projects & Jobs', icon: <FileText size={20} /> },
    { name: 'Tasks', icon: <Landmark size={20} /> },
    { name: 'Client / Supplier', icon: <BarChart3 size={20} /> },
    { name: 'User / Employee', icon: <Users size={20} /> },
    { name: 'Logout', icon: <LogOut size={20} />, isLogout: true },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <h2>Visible</h2>
        </div>
        <nav className="nav-list">
          {menuItems.map((item, idx) => (
            <button 
              key={idx} 
              className={`nav-item ${activeIndex === idx ? 'active' : ''} ${item.isLogout ? 'logout-btn' : ''}`}
              onClick={() => !item.isLogout && setActiveIndex(idx)}
            >
              {item.icon} <span className="nav-label">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-area">
        {/* Top Header with Profile Dropdown */}
        <header className="top-navbar">
          <div className="header-title"></div> {/* Spacer */}
          
          <div className="user-block" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <div className="user-meta">
              <span className="user-name">{admin.name}</span>
              <span className="user-email">{admin.email}</span>
            </div>
            <div className="avatar-circle">
               <img src="https://via.placeholder.com/40" alt="Avatar" />
            </div>

            {/* DROPDOWN MENU */}
            {isProfileOpen && (
              <div className="profile-dropdown">
                <button className="dropdown-item"><User size={16} /> My Profile</button>
                <button className="dropdown-item"><Settings size={16} /> Update Profile</button>
                <button className="dropdown-item"><Lock size={16} /> Change Password</button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout"><LogOut size={16} /> Logout</button>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic View */}
        <div className="view-container">
          {activeIndex === 0 ? (
            <div className="dashboard-wrapper">
              {/* Only show title on Dashboard tab */}
              {/* <h2 className="page-title">Dashboard Overview</h2> */}
              <DashboardOverview stats={stats} activities={activities} />
            </div>
          ) : (
            <div className="placeholder-view"><h2>{menuItems[activeIndex].name} Content</h2></div>
          )}
        </div>
      </main>
    </div>
  );
}
