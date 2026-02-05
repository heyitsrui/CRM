import React, { useState } from 'react';
import { LayoutGrid, Lightbulb, FileText, Landmark, BarChart3, Users, LogOut, Edit3, Trash2 } from 'lucide-react';
import '../styles/dashboard.css';

// --- NEW COMPONENT: UserManagement ---
const UserManagement = () => {
  // Mock data representing registered accounts
  const [users] = useState([
    { id: 1, name: 'praveen gupta', email: 'praveen@gmail.com', phone: '9865457845', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: 2, name: 'naina sharma', email: 'naina@gmail.com', phone: '4557859568', avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: 3, name: 'simonsimon iiididi', email: 'dimon@aol.com', phone: '093278407802378', avatar: 'https://i.pravatar.cc/150?u=3' },
    { id: 4, name: 'Milton Del Toro', email: 'milton@example.com', phone: 'N/A', avatar: 'https://i.pravatar.cc/150?u=4' },
    { id: 5, name: 'sarvesh jain', email: 'sarveshjain@gmail.com', phone: '7485964152', avatar: 'https://i.pravatar.cc/150?u=5' },
  ]);

  return (
    <div className="user-management-container">
      <div className="table-controls">
        <div className="search-bar">
          <input type="text" placeholder="Search users..." />
          <button className="role-filter">All Roles</button>
        </div>
        <button className="add-user-btn">+ Add User</button>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Phone</th>
            <th>Access</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="user-info-cell">
                <img src={user.avatar} alt={user.name} className="table-avatar" />
                <div>
                  <div className="user-name-text">{user.name}</div>
                  <div className="user-email-text">{user.email}</div>
                </div>
              </td>
              <td>{user.phone}</td>
              <td><span className="na-badge">N/A</span></td>
              <td className="action-buttons">
                <button className="edit-btn"><Edit3 size={16} /></button>
                <button className="delete-btn"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-footer">
        <span>Showing 1 to {users.length} of {users.length} entries</span>
        <div className="pagination">
          <button className="page-num active">1</button>
        </div>
      </div>
    </div>
  );
};

// --- Updated Sidebar (No changes needed, just ensure index 5 is handled) ---
const Sidebar = ({ activeIndex, setActiveIndex }) => {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutGrid size={20} /> },
    { name: 'Proposal', icon: <Lightbulb size={20} /> },
    { name: 'Projects & Jobs', icon: <FileText size={20} /> },
    { name: 'Tasks', icon: <Landmark size={20} /> },
    { name: 'Client / Supplier', icon: <BarChart3 size={20} /> },
    { name: 'User/ Employee', icon: <Users size={20} /> },
    { name: 'Logout', icon: <LogOut size={20} />, isLogout: true },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <img src="vtic.webp" alt="Visible Tech" />
      </div>
      <nav className="nav-list">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            className={`nav-item ${activeIndex === idx ? 'active' : ''}`}
            onClick={() => !item.isLogout ? setActiveIndex(idx) : console.log("Logout")}
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

const TopNav = () => (
  <nav className="top-navbar">
    <div className="user-block">
      <div className="user-meta">
        <span className="user-name">Admin User</span>
        <span className="user-email-label">admin@vtic.com</span>
      </div>
      <div className="avatar-circle"></div>
    </div>
  </nav>
);

export default function App() {
  const [activeIndex, setActiveIndex] = useState(5); // Default to User/Employee (index 5)

  const renderContent = () => {
    switch (activeIndex) {
      case 0: return <h1>Dashboard Overview</h1>;
      case 5: return <UserManagement />; // This renders your table
      default: return <h1>Content Section {activeIndex}</h1>;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
      <main className="main-area">
        <TopNav />
        <div className="content-container">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
