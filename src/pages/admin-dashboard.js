import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopNav from "../components/topnav";
import UserManagement from "./user";
import MyProfile from "./myprofile"; // Import the new profile component
import Proposal from "./proposal";

import {
  LayoutGrid,
  FileText,
  Users,
  DollarSign,
} from "lucide-react";

import "../styles/dashboard.css";

/* --- Sub-Component: Dashboard Overview --- */
const DashboardOverview = ({ stats, activities }) => (
  <div className="dashboard-content">
    {/* Stats Cards */}
    <div className="stats-grid">
      <div className="stat-card">
        <div className="icon-circle blue">
          <LayoutGrid size={20} />
        </div>
        <div>
          <h3>{stats?.leads || 0}</h3>
          <p>Projects in Lead</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="icon-circle yellow">
          <FileText size={20} />
        </div>
        <div>
          <h3>{stats?.bidding || 0}</h3>
          <p>Projects in Bidding</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="icon-circle green">
          <FileText size={20} />
        </div>
        <div>
          <h3>{stats?.signature || 0}</h3>
          <p>Projects Signature</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="icon-circle red">
          <FileText size={20} />
        </div>
        <div>
          <h3>{stats?.hold || 0}</h3>
          <p>Projects on Hold</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="icon-circle teal">
          <Users size={20} />
        </div>
        <div>
          <h3>{stats?.approved || 0}</h3>
          <p>Approved Projects</p>
        </div>
      </div>
    </div>

    {/* Money Stats */}
    <div className="money-grid">
      <div className="money-card">
        <DollarSign className="money-icon" />
        <div>
          <h3>${(stats?.totalPaid || 0).toLocaleString()}</h3>
          <p>Total Paid Amount</p>
        </div>
      </div>
      <div className="money-card">
        <DollarSign className="money-icon" />
        <div>
          <h3>${(stats?.totalDue || 0).toLocaleString()}</h3>
          <p>Total Due Amount</p>
        </div>
      </div>
    </div>

    {/* Activity & Chart */}
    <div className="bottom-sections">
      <div className="chart-box">
        <h3>Project Status Overview</h3>
        <div className="placeholder-chart">Chart Placeholder</div>
      </div>

      <div className="activity-box">
        <h3>Recent Activity</h3>
        {activities.length > 0 ? (
          activities.map((act, i) => (
            <div key={i} className="activity-item">
              <p className="act-title">{act.title}</p>
              <p className="act-desc">{act.description}</p>
              <span className="act-date">{act.date}</span>
            </div>
          ))
        ) : (
          <p>No recent activity found.</p>
        )}
      </div>
    </div>
  </div>
);

/* --- Main Dashboard Component --- */
export default function Dashboard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Fetch user from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user) setLoggedInUser(user);
  }, []);

  // Fetch API data
  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard-stats")
      .then((res) => res.json())
      .then((data) => data.success && setStats(data.stats))
      .catch(console.error);

    fetch("http://localhost:5000/api/recent-activity")
      .then((res) => res.json())
      .then((data) => data.success && setActivities(data.activities))
      .catch(console.error);
  }, []);

  /**
   * Render logic based on activeIndex
   * 0: Overview
   * 5: User Management
   * 99: My Profile (Triggered from TopNav)
   */
  const renderContent = () => {
    switch (activeIndex) {
      case 0:
        return <DashboardOverview stats={stats} activities={activities} />;
      case 1:
        return <Proposal/>
      case 5:
        return <UserManagement currentUser={loggedInUser} />;
      case 99:
        return <MyProfile user={loggedInUser} />;
      default:
        return (
          <div className="dashboard-content">
            <h2>Coming Soon</h2>
            <p>This section is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar handles main navigation indices (0, 1, 2, etc.) */}
      <Sidebar activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
      
      <main className="main-area">
        {/* Pass setActiveIndex as 'onNavigate' to handle profile clicks */}
        <TopNav 
          loggedInUser={loggedInUser} 
          onNavigate={setActiveIndex} 
        />
        
        <div className="view-container">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
