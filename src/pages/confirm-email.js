import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import '../styles/create-account.css'; // Reusing your existing styles
import bgVideo from '../assets/video/background.mp4';

function ConfirmEmail() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError("Please enter a valid OTP.");
    } else {
      console.log("Confirming OTP:", otp);
      // Add your API logic here
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
          className="register-card"
        >
          <h2 className="card-title" style={{ fontSize: '3rem' }}>Confirm Email</h2>
          <p className="card-welcome">OTP has sent already, Please check your email</p>
          
          <hr className="divider" />

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="error-bubble"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleConfirm} className="login-form">
            <div className="input-group">
              <label>OTP</label>
              <input 
                name="otp"
                type="text" 
                placeholder="Input your OTP" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="register-btn">Confirm</button>
            
            <div style={{ textAlign: 'right', marginTop: '15px' }}>
              <Link to="/resend-otp" className="visit-link" style={{ color: '#333', fontWeight: 'bold' }}>
                Resend OTP
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default ConfirmEmail;
