import React from 'react';
import { LayoutGrid, Lightbulb, FileText, Landmark, BarChart3, Users, LogOut } from 'lucide-react';
import '../styles/dashboard.css';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutGrid size={20} />, active: true },
    { name: 'Dashboard', icon: <Lightbulb size={20} /> },
    { name: 'Dashboard', icon: <FileText size={20} /> },
    { name: 'Dashboard', icon: <Landmark size={20} /> },
    { name: 'Dashboard', icon: <BarChart3 size={20} /> },
    { name: 'Dashboard', icon: <Users size={20} /> },
    { name: 'Dashboard', icon: <LogOut size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-section">
        {/* Replace with your actual logo path */}
        <img src="vtic.webp" alt="Visible Technologies" />
      </div>
      <nav className="nav-list">
        {menuItems.map((item, idx) => (
          <div key={idx} className={`nav-item ${item.active ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.name}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
};

const TopNav = () => {
  return (
    <nav className="top-navbar">
      <div className="user-block">
        <div className="user-meta">
          <span className="user-name">Userr</span>
          <span className="user-email-label">Email</span>
        </div>
        <div className="avatar-circle">
          {/* Your avatar img goes here */}
        </div>
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-area">
        <TopNav />
        {/* Content goes here */}
      </main>
    </div>
  );
}
