import React, { useState, useEffect, useRef } from "react";
import { User, Lock, } from "lucide-react"; 

const TopNav = ({ loggedInUser, onNavigate, onLogout }) => {
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

  const handleProfileClick = () => {
    if (onNavigate) onNavigate(99); 
    setIsOpen(false);
  };

  return (
    <header className="top-nav">
      <div className="user-block" ref={dropdownRef}>
        <div className="user-info" onClick={() => setIsOpen(!isOpen)} >
          {/* Dynamically reflects name from profile update */}
          <span className="user-name" style={{fontSize: "20px", fontFamil: "Poppiins"}}>{loggedInUser?.name || "User"}</span>
          <span className="user-email">{loggedInUser?.email}</span>
        </div>
        
        <div className="user-avatar" onClick={() => setIsOpen(!isOpen)}>
          <img 
            src={loggedInUser?.avatar || "default-avatar.png"} 
            alt="User" 
            className="user-avatar-img"
          />
        </div>

        {isOpen && (
          <div className="profile-dropdown" >
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
