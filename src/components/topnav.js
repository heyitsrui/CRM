import React, { useState, useEffect, useRef } from "react";
import { User, Lock } from "lucide-react"; 

const TopNav = ({ loggedInUser, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle clicking "My Profile"
  const handleProfileClick = () => {
    if (onNavigate) {
      onNavigate(99); // This matches the case in admin-dashboard.js
    }
    setIsOpen(false); // Close dropdown after selection
  };

  return (
    <header className="top-nav">
      <div className="user-block" ref={dropdownRef}>
        <div className="user-info" onClick={() => setIsOpen(!isOpen)}>
          <span className="user-name">{loggedInUser?.name || "Christian Barcoma"}</span>
          <span className="user-email">{loggedInUser?.email || "cobarcoma@gmail.com"}</span>
        </div>
        
        <div className="user-avatar" onClick={() => setIsOpen(!isOpen)}>
          <img
            src={loggedInUser?.avatar || "https://via.placeholder.com/40"}
            alt="User"
          />
        </div>

        {/* The Dropdown Menu */}
        {isOpen && (
          <div className="profile-dropdown">
            <button className="dropdown-item" onClick={handleProfileClick}>
              <User size={18} />
              <span>My Profile</span>
            </button>
            <button className="dropdown-item" onClick={() => setIsOpen(false)}>
              <Lock size={18} />
              <span>Change Password</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNav;
