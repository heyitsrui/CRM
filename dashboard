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
import Projects from "./projects";
import Finance from "./finance";

import {
  LayoutGrid,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";

import "../styles/dashboard.css";

/* --- Sub-Component: Dashboard Overview --- */
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

  // 1. AUTH & SESSION CHECK
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) {
      navigate("/");
    } else {
      setLoggedInUser(user);
    }
  }, [navigate]);

  // 2. DATA FETCHING (Triggers when entering Dashboard view)
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

    if (activeIndex === 0) {
      fetchData();
    }
  }, [loggedInUser, activeIndex]);

  const refreshUserData = () => {
    const updatedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    setLoggedInUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    navigate("/");
  };

  const renderContent = () => {
    switch (activeIndex) {
      case 0:
        return <DashboardOverview stats={stats} activities={activities} />;
      case 1:
        return <Proposal userRole={loggedInUser?.role} />;
      case 'clients':
        return <Client />;
      case 'company':
        return <Company />;
      case 2: 
        return <Projects loggedInUser={loggedInUser} />;
      case 3:
        return <Tasks loggedInUser={loggedInUser} />;
      case 5:
        return <UserManagement loggedInUser={loggedInUser} />;
      case 7: 
        return <Finance loggedInUser={loggedInUser} />;
      case 99: 
        return <MyProfile user={loggedInUser} onProfileUpdate={refreshUserData} />;
      default:
        return (
          <div className="dashboard-content">
            <h2>Coming Soon</h2>
            <p>Section under development. Index: {activeIndex}</p>
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
