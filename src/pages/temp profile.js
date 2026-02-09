import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/my-profile.css";

const MyProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [avatar, setAvatar] = useState("");

  // Fetch user from DB
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${userId}`);
        if (res.data.success) {
          const u = res.data.user;
          setUser(u);
          setName(u.name || "");
          setPhone(u.phone || "");
          setAbout(u.about || "");
          setAvatar(u.avatar || "");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, [userId]);

  // Save profile to DB
  const saveProfile = async () => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/users/${userId}/profile`,
        { name, phone, about, avatar }
      );
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        setIsEditing(false);
        alert("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile.");
    }
  };

  if (!user) return <div style={{ padding: 20 }}>Loading profile...</div>;

  return (
    <div className="dashboard-content">
      <div className="page-header"><h2>My Profile</h2></div>
      <div className="profile-container">
        <div className="profile-card">

          {/* Avatar */}
          <div className="profile-header-row">
            <div className="avatar-section">
              <div className="avatar-circle">
                {isEditing ? (
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="Avatar URL"
                  />
                ) : (
                  <img src={avatar || "https://via.placeholder.com/150"} alt="Profile" className="avatar-img"/>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="info-section">
              {isEditing ? (
                <input className="name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"/>
              ) : (
                <h2 className="profile-name">{name || "No Name"}</h2>
              )}

              <div className="details-grid">
                <span className="label">Email:</span>
                <span className="value">{user.email || ""}</span>

                <span className="label">Phone:</span>
                {isEditing ? (
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone"/>
                ) : (
                  <span className="value">{phone || "No phone"}</span>
                )}

                <span className="label">ID NO:</span>
                <span className="value">{user.id || ""}</span>

                <span className="label">Role:</span>
                <span className="value">{user.role || ""}</span>
              </div>
            </div>

            {/* Edit/Save */}
            <div className="action-section">
              <button className="edit-btn" onClick={() => { isEditing ? saveProfile() : setIsEditing(true); }}>
                {isEditing ? "SAVE" : "EDIT"}
              </button>
            </div>
          </div>

          <hr className="divider" />

          {/* About */}
          <div className="profile-section">
            <h3>About</h3>
            {isEditing ? (
              <textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="About yourself..."/>
            ) : (
              <p>{about || "No information yet."}</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default MyProfile;
