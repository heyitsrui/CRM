import React from "react";
import { User } from "lucide-react";

const MyProfile = ({ user }) => {
  return (
    <div className="dashboard-content">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>My Profile</h2>
      </div>
      
      {/* This mimics the empty white space in your second screenshot */}
      <div className="profile-container" style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '40px', 
        minHeight: '400px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="profile-placeholder" style={{ textAlign: 'center', color: '#8e8e8e' }}>
          <div style={{ 
            background: '#f3f4f6', 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <User size={50} />
          </div>
          <h3>{user?.name || "User Profile"}</h3>
          <p>{user?.email || "No email provided"}</p>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
