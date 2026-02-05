import { 
  Home, Lightbulb, Clipboard, Building, 
  BarChart, Users, LogOut 
} from 'lucide-react'; // Using lucide-react for icons

const Sidebar = () => {
  const menuItems = [
    { icon: <Home size={20} />, label: 'Dashboard', active: true },
    { icon: <Lightbulb size={20} />, label: 'Dashboard' },
    { icon: <Clipboard size={20} />, label: 'Dashboard' },
    { icon: <Building size={20} />, label: 'Dashboard' },
    { icon: <BarChart size={20} />, label: 'Dashboard' },
    { icon: <Users size={20} />, label: 'Dashboard' },
    { icon: <LogOut size={20} />, label: 'Dashboard' },
  ];

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src="/path-to-your-logo.png" alt="Visible Logo" className="logo" />
      </div>
      <nav className="nav-menu">
        {menuItems.map((item, index) => (
          <div key={index} className={`nav-item ${item.active ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;