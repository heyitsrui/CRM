import React, { useState, useEffect, useRef } from "react";
import { User, Lock } from "lucide-react"; 

const TopNav = ({ loggedInUser, onNavigate, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // The URL you want to use as a fallback
  const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

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
          <span className="user-name" style={{ fontSize: "20px", fontFamily: "Poppins", display: "block" }}>
            {loggedInUser?.name || "User"}
          </span>
          <span className="user-email">{loggedInUser?.email}</span>
        </div>
        
        <div className="user-avatar" onClick={() => setIsOpen(!isOpen)}>
          <img 
            src={
              loggedInUser?.avatar && (loggedInUser.avatar.includes("data:image") || loggedInUser.avatar.startsWith("http"))
                ? loggedInUser.avatar 
                : DEFAULT_AVATAR // Updated default
            }
            alt="User" 
            className="user-avatar-img"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = DEFAULT_AVATAR; // Updated fallback if URL breaks
            }}
          />
        </div>

        {isOpen && (
          <div className="profile-dropdown" >
            <button className="dropdown-item" onClick={handleProfileClick}>
              <User size={18} />
              <span>My Profile</span>
            </button>
            <button 
              className="dropdown-item" 
              onClick={() => {
                if (onNavigate) onNavigate(100);
                setIsOpen(false);
              }}
            >
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
