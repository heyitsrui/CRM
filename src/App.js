import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import bgVideo from './assets/video/background.mp4';

function App() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.success) {
        window.location.href = '/dashboard';
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Cannot connect to server. Check if backend is running.");
    }
  };

  return (
    <div className="login-container">
      {/* 1. Background Video */}
      <video autoPlay loop muted playsInline className="bg-video">
        <source src={bgVideo} type="video/mp4" />
      </video>

      {/* 2. Top Navigation */}
      <div className="header-nav">
        <img src="/vtic.webp" alt="VTIC Logo" className="logo-white" />
        <a href="https://vtic.ph" target="_blank" rel="noreferrer" className="visit-link">
          Visit Website
        </a>
      </div>

      <div className="content-wrapper">
        {/* Left Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="branding-box"
        >
          <h1 className="main-title">THINK DIGITAL.<br />BUILD SMART.<br />SCALE FAST.</h1>
          <p className="sub-text">
            Visible is an IT solution company who are your trusted partner in navigating the digital landscape.
          </p>
        </motion.div>

        {/* Right Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="login-card"
        >
          <h2 className="card-title">Get Started</h2>
          <p className="card-welcome">Welcome to Visible Technology Intl Corp - Let's get started</p>
          
          <hr className="divider" />

          {/* 6. Error Message Display */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="error-msg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="Input your email" 
                required 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Input you password" 
                  required 
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  className="eye-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="forgot-container">
              <a href="/forgot-password">Forgot Passowrd?</a>
            </div>

            <button type="submit" className="login-btn">Login</button>
          </form>

          <p className="signup-footer">
            Dont have an accoun? <a href="/signup">Sign up here</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default App;