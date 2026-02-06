import React from 'react';
import {
  Home,
  Lightbulb,
  FileText,
  Landmark,
  BarChart3,
  Users,
  LogOut
} from 'lucide-react';
import '../styles/dashboard.css';

const Sidebar = ({ activeIndex, setActiveIndex }) => {
  const menuItems = [
    { label: 'Dashboard', icon: <Home size={20} /> },
    { label: 'Proposal', icon: <Lightbulb size={20} /> },
    { label: 'Projects & Jobs', icon: <FileText size={20} /> },
    { label: 'Tasks', icon: <Landmark size={20} /> },
    { label: 'Client / Supplier', icon: <BarChart3 size={20} /> },
    { label: 'User / Employee', icon: <Users size={20} /> },
    { label: 'Logout', icon: <LogOut size={20} />, isLogout: true },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <img src="vtic.webp" alt="Visible Logo" />
      </div>

      <nav className="nav-list">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => !item.isLogout && setActiveIndex(index)}
            className={`nav-item ${activeIndex === index ? 'active' : ''} ${item.isLogout ? 'logout-btn' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};


export default Sidebar;
