import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
import TopNav from "../components/topnav";
import UserManagement from "./user";
import MyProfile from "./myprofile";
import Proposal from "./proposal";
import Tasks from "./tasks";
import Company from "./company";
import Client from './client';
import Projects from './projects';
import CPass from "./c-pass";
import Finance from "./finance";

import {
  LayoutGrid,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";

import "../styles/dashboard.css";

const DashboardOverview = ({ stats, activities }) => {
  // Logic Fix: Total Contract Value is the sum of what's paid and what's still owed
  const totalRevenue = (Number(stats?.totalPaid) || 0) + (Number(stats?.totalDue) || 0);

  return (
    <div className="dashboard-content">
    {/* Status Stats Cards */}
    <div className="stats-grid">
      <div className="stat-card">
        <div className="icon-circle blue"><LayoutGrid size={20} /></div>
        <div>
          <h3>{stats?.leads || 0}</h3>
          <p>Projects in Lead</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="icon-circle yellow"><FileText size={20} /></div>
        <div>
          <h3>{stats?.bidding || 0}</h3>
          <p>Projects in Bidding</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="icon-circle green"><FileText size={20} /></div>
        <div>
          <h3>{stats?.signature || 0}</h3>
          <p>Projects Signature</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="icon-circle red"><FileText size={20} /></div>
        <div>
          <h3>{stats?.hold || 0}</h3>
          <p>Projects on Hold</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="icon-circle teal"><Users size={20} /></div>
        <div>
          <h3>{stats?.approved || 0}</h3>
          <p>Approved Projects</p>
        </div>
      </div>
    </div>

    {/* Simplified Money Stats: Only Paid and Due */}
    <div className="money-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '20px' }}>
      <div className="money-card" style={{ borderLeft: '5px solid #22c55e' }}>
        <DollarSign className="money-icon" style={{ color: '#22c55e' }} />
        <div>
          <h3>₱{(Number(stats?.totalPaid) || 0).toLocaleString()}</h3>
          <p>Total Paid Amount</p>
        </div>
      </div>
      <div className="money-card" style={{ borderLeft: '5px solid #ef4444' }}>
        <DollarSign className="money-icon" style={{ color: '#ef4444' }} />
        <div>
          <h3>₱{(Number(stats?.totalDue) || 0).toLocaleString()}</h3>
          <p>Total Due Amount</p>
        </div>
      </div>
    </div>

    {/* Activity & Chart Section */}
    <div className="bottom-sections">
      <div className="chart-box">
        <h3>Project Status Overview</h3>
        <div className="placeholder-chart">Chart Placeholder</div>
      </div>

      <div className="activity-box">
        <h3>Recent Activity</h3>
        {activities && activities.length > 0 ? (
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
}

/* --- Main Dashboard Component --- */
export default function Dashboard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) {
      navigate("/");
    } else {
      setLoggedInUser(user);
    }
  }, [navigate]);

  useEffect(() => {
    if (!loggedInUser) return;

    const fetchData = async () => {
      try {
        const statsRes = await fetch("http://localhost:5000/api/dashboard-stats");
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.stats);

        const activityRes = await fetch("http://localhost:5000/api/recent-activity");
        const activityData = await activityRes.json();
        if (activityData.success) setActivities(activityData.activities);
      } catch (err) {
        console.error("Error refreshing dashboard data:", err);
      }
    };

    if (activeIndex === 0) fetchData();
  }, [loggedInUser, activeIndex]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    navigate("/");
  };

  const refreshUserData = () => {
    const updatedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    setLoggedInUser(updatedUser);
  };

  const renderContent = () => {
    switch (activeIndex) {
      case 0:
        return <DashboardOverview stats={stats} activities={activities} />;
      case 1:
        // Log this to make sure 'role' exists here
        console.log("Passing to Proposal:", loggedInUser); 
        return <Proposal currentUser={loggedInUser} />;
      case 2:
        return <Projects currentUser={loggedInUser} />;
      case 3: 
        return <Finance loggedInUser={loggedInUser} />;
      case 'clients':
        return <Client userRole={loggedInUser?.role} />;
      case 'company':
        return <Company userRole={loggedInUser?.role} />;
      case 4:
        return <Tasks loggedInUser={loggedInUser} />
      case 6:
        // SECURED CASE: Only mount UserManagement if user is admin
        if (loggedInUser?.role === 'admin') {
          return <UserManagement currentUser={loggedInUser} />;
        } else {
          return (
            <div className="dashboard-content">
              <h2>Access Denied</h2>
              <p>You do not have permission to access User Management.</p>
            </div>
          );
        }
      case 99: 
        return <MyProfile user={loggedInUser} onProfileUpdate={refreshUserData} />;
      case 100:
        return <CPass user={loggedInUser} />;
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
      <Sidebar 
        activeIndex={activeIndex} 
        setActiveIndex={setActiveIndex} 
        onLogout={handleLogout}
        currentUser={loggedInUser} // Passing the user for role-based filtering
      />
      
      <main className="main-area">
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
