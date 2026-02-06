import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/create-account.css';
import bgVideo from '../assets/video/background.mp4';
import axios from "axios";

function CreateAccount() {
  const [formData, setFormData] = useState({
    position: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validate = () => {
    const { phone, password, confirmPassword } = formData;

    const passwordRegex = /^(?=.*[0-9]).{8,}$/;
    const phoneRegex = /^[0-9+]{10,15}$/;

    if (!phoneRegex.test(phone)) {
      setError("Please enter a valid phone number.");
      return false;
    }

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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // 1️⃣ Send OTP
      await axios.post("http://localhost:5000/send-otp", {
        email: formData.email,
      });

      // 2️⃣ Register user
      await axios.post("http://localhost:5000/register", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.position
      });

      // 3️⃣ Save email for OTP confirmation
      localStorage.setItem("userEmail", formData.email);

      // 4️⃣ Go to confirm page
      navigate("/confirm-email");

    } catch (err) {
      setError(err.response?.data?.message || "Failed to register. Please try again.");
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
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="branding-box"
        >
          <h1 className="main-title">CREATE AN ACCOUNT</h1>
          <p className="sub-text">Create your account.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="register-card"
        >
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="error-bubble"
                style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleRegister} className="login-form">
            <div className="input-group">
              <label>Select Position</label>
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                className="custom-select"
              >
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
              <input
                name="name"
                type="text"
                placeholder="Input your fullname"
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="Input your email"
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Phone Number</label>
              <input
                name="phone"
                type="tel"
                placeholder="e.g. 09XXXXXXXXX"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-stack">
                <input
                  name="password"
                  type="password"
                  placeholder="8+ characters with numbers"
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
