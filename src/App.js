import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import bgVideo from './assets/video/background.mp4';
import CreateAccount from './pages/create-account'; 

const LoginView = ({ email, setEmail, password, setPassword, handleLogin, showPassword, setShowPassword, error }) => (
  <div className="login-container">
    <video autoPlay loop muted playsInline className="bg-video">
      <source src={bgVideo} type="video/mp4" />
    </video>

    <div className="header-nav">
      <img src="/vtic.webp" alt="VTIC Logo" className="logo-white" />
      <a href="https://vtic.ph" target="_blank" rel="noreferrer" className="visit-link">
        Visit Website
      </a>
    </div>

    <div className="content-wrapper">
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="branding-box"
      >
        <h1 className="main-title">THINK DIGITAL.<br />BUILD SMART.<br />SCALE FAST.</h1>
        <p className="sub-text">
          Visible is an IT solution company who are your trusted partner in navigating the digital landscape.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="login-card"
      >
        <h2 className="card-title">Get Started</h2>
        <p className="card-welcome">Welcome to Visible Technology Intl Corp</p>
        <hr className="divider" />

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="error-msg">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="Input your email" required onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Input your password" 
                required 
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="forgot-container">
            <a href="/forgot-password">Forgot Password?</a>
          </div>

          <button type="submit" className="login-btn">Login</button>
        </form>

        <p className="signup-footer">
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </motion.div>
    </div>
  </div>
);

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
    <Router>
      <Routes>
        <Route path="/" element={
          <LoginView 
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            handleLogin={handleLogin}
            showPassword={showPassword} setShowPassword={setShowPassword}
            error={error}
          />
        } />
        <Route path="/signup" element={<CreateAccount />} />
      </Routes>
    </Router>
  );
}

export default App;
