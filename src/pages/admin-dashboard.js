import React, { useState } from 'react';
import { LayoutGrid, Lightbulb, FileText, Landmark, BarChart3, Users, LogOut } from 'lucide-react';
import '../styles/dashboard.css';

const Sidebar = () => {
  // Track which menu item is currently selected
  const [activeIndex, setActiveIndex] = useState(0);

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutGrid size={20} /> },
    { name: 'Proposal', icon: <Lightbulb size={20} /> },
    { name: 'Projects & Jobs', icon: <FileText size={20} /> },
    { name: 'Tasks', icon: <Landmark size={20} /> },
    { name: 'Client / Supplier', icon: <BarChart3 size={20} /> },
    { name: 'User/ Employee', icon: <Users size={20} /> },
    { name: 'Logout', icon: <LogOut size={20} />, isLogout: true },
  ];

  const handleItemClick = (index, item) => {
    if (item.isLogout) {
      console.log("Logging out...");
      // Add your logout logic here (e.g., clearing tokens)
      return;
    }
    setActiveIndex(index);
  };

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <img src="vtic.webp" alt="Visible Technologies" />
      </div>
      <nav className="nav-list">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            // Dynamic class based on state
            className={`nav-item ${activeIndex === idx ? 'active' : ''}`}
            onClick={() => handleItemClick(idx, item)}
            type="button"
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.name}</span>
          </button>
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
          <span className="user-name">User</span>
          <span className="user-email-label">Email</span>
        </div>
        <div className="avatar-circle">
          {/* Avatar placeholder */}
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
      </main>
    </div>
  );
}
