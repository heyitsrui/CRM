import React, { useState } from "react";
import { Camera, User } from "lucide-react";
import axios from "axios";
import "../styles/profile.css"; // Ensure this matches your CSS filename

const MyProfile = ({ user, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Initialize state with current user data
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    about: user?.about || "",
    avatar: user?.avatar || "",
  });

  // Role-based Permissions Mapping
  const permissionsMap = {
    admin: ["Full System Access", "User Management", "Project Approval"],
    manager: ["Team Access", "Project View", "Task Management"],
    executive: ["Project View", "Reports Access"],
    finance: ["Financial View", "Invoicing"],
    viewer: ["Read Only Access"]
  };

  const currentPermissions = permissionsMap[user?.role] || ["Basic Access"];

  // Handle Image Upload & Convert to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Function: Updates Database, LocalStorage, and Parent State
  const handleSave = async () => {
    try {
      const res = await axios.put(`http://localhost:5000/api/users/${user.id}/profile`, {
        name: profileData.name,
        phone: profileData.phone,
        about: profileData.about,
        avatar: profileData.avatar
      });

      if (res.data.success) {
        // 1. Update the local session (so it persists on refresh)
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));

        // 2. Notify Parent (AdminDashboard) to refresh TopNav immediately
        if (onProfileUpdate) {
          onProfileUpdate();
        }

        setIsEditing(false);
        alert("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Save failed:", err.response?.data || err.message);
      alert("Failed to update database. Ensure server allows large payloads (10mb).");
    }
  };

  return (
    <div className="dashboard-content">
      <div className="profile-card">
        
        {/* Header Section */}
        <div className="profile-header">
          <div className="avatar-container">
            {profileData.avatar ? (
              <img src={profileData.avatar} alt="Profile" className="avatar-image" />
            ) : (
              <div className="avatar-image-placeholder">
                <User size={60} color="#ccc" />
              </div>
            )}
            <label className="upload-icon">
              <Camera size={18} />
              <input type="file" hidden onChange={handleImageChange} accept="image/*" />
            </label>
          </div>

          <div className="info-section">
            {isEditing ? (
              <div className="edit-form-inputs">
                <div className="input-group">
                  <label>Name:</label>
                  <input 
                    type="text" 
                    value={profileData.name} 
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>Phone:</label>
                  <input 
                    type="text" 
                    value={profileData.phone} 
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>
              </div>
            ) : (
              <>
                <h1>{profileData.name || "User Profile"}</h1>
                <div className="info-row">Email: <span className="font-light">{user?.email}</span></div>
                <div className="info-row">Phone: <span className="font-light">{profileData.phone || "Not Set"}</span></div>
                <div className="info-row">ID NO: <span className="font-light">000{user?.id}</span></div>
                <div className="info-row">Role: <span className="font-light uppercase-text">{user?.role}</span></div>
              </>
            )}
          </div>

          <button 
            className={`edit-btn ${isEditing ? 'save-mode' : ''}`} 
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
          >
            {isEditing ? "SAVE" : "EDIT"}
          </button>
        </div>

        {/* Permissions Container */}
        <div className="permissions-container">
          <h3 className="info-label">Permissions:</h3>
          <div className="badge-group">
            {currentPermissions.map((perm, i) => (
              <span key={i} className="permission-badge">{perm}</span>
            ))}
          </div>
        </div>

        {/* About Section */}
        <div className="about-section">
          <h3 className="info-label">About</h3>
          <textarea 
            className="description-box"
            value={profileData.about} 
            onChange={(e) => setProfileData({...profileData, about: e.target.value})}
            placeholder="Click EDIT to update your description..."
            disabled={!isEditing} 
          />
        </div>

      </div>
    </div>
  );
};

export default MyProfile;
