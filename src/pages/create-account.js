import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom'; // 1. Added useNavigate
import '../styles/create-account.css';
import bgVideo from '../assets/video/background.mp4';

function CreateAccount() {
  const [formData, setFormData] = useState({
    position: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  
  const navigate = useNavigate(); // 2. Initialize the navigate function

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validate = () => {
    const { password, confirmPassword } = formData;
    const passwordRegex = /^(?=.*[0-9]).{8,}$/;

    if (!passwordRegex.test(password)) {
      setError("Password must be at least 8 characters and include a number.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log("Registration Successful:", formData);
      
      // 3. Automatically redirect to the confirm-email page
      // In a real app, you would do this AFTER a successful fetch() request
      navigate('/confirm-email'); 
    }
  };

  return (
    <div className="login-container">
      <video autoPlay loop muted playsInline className="bg-video">
        <source src={bgVideo} type="video/mp4" />
      </video>

      <div className="header-nav">
        <img src="/vtic.webp" alt="Logo" className="logo-white" />
        <Link to="/" className="visit-link">Go back to login</Link>
      </div>

      <div className="content-wrapper">
        <div className="branding-box">
          <h1 className="main-title">CREATE AN ACCOUNT</h1>
          <p className="sub-text">
            Visible is an IT solution company who are your trusted partner in navigating the digital landscape.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="register-card"
        >
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="error-bubble"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleRegister} className="login-form">
            <div className="input-group">
              <label>Select Position</label>
              <select name="position" value={formData.position} onChange={handleChange} required className="custom-select">
                <option value="" disabled>Select your position here</option>
                <option value="admin">System Administrator</option>
                <option value="manager">Sales Manager</option>
                <option value="executive">Sales Executive</option>
                <option value="finance">Finance</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div className="input-group">
              <label>Name</label>
              <input name="name" type="text" placeholder="Input your fullname" onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input name="email" type="email" placeholder="Input your email" onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-stack">
                <input 
                  name="password" 
                  type="password" 
                  placeholder="Must be atleast 8 characters and include numbers" 
                  onChange={handleChange} 
                  required 
                />
                <input 
                  name="confirmPassword" 
                  type="password" 
                  placeholder="Confirm password" 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <button type="submit" className="register-btn">Register</button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default CreateAccount;
