import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/forgot-pass.css';
import bgVideo from '../assets/video/background.mp4';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  return (
    <div className="fp-container">

      {/* FULLSCREEN BACKGROUND VIDEO */}
      <video autoPlay loop muted playsInline className="bg-video">
        <source src={bgVideo} type="video/mp4" />
      </video>

      {/* NAVBAR */}
            <div className="header-nav">
  <img src="/vtic.webp" alt="VTIC Logo" className="logo-white" />
  <a href="/" className="fp-back-nav">Back to login</a>
  <a href="https://vtic.ph" target="_blank" rel="noreferrer" className="visit-link">
    Visit Website
  </a>
</div>


      {/* LEFT BRANDING */}
      <div className="fp-left">
        <div className="fp-overlay">
          <div className="fp-text">
            <h1>
              THINK DIGITAL.<br />
              BUILD SMART.<br />
              SCALE FAST.
            </h1>
            <p>
              Visible is your trusted IT partner in navigating the digital
              landscape.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE WRAPPER */}
      <div className="fp-right">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="fp-card"
        >
          <AnimatePresence>
            {(error || success) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={error ? 'fp-error' : 'fp-success'}
              >
                {error || success}
              </motion.div>
            )}
          </AnimatePresence>

          {step === 1 && (
            <>
              <h2>Forgot password?</h2>
              <p className="fp-subtext">
                Please enter the email associated with your account
              </p>

              <label className="fp-label">Email</label>
              <input
                type="email"
                className="fp-input"
                placeholder="Input your email"
                onChange={(e) => setEmail(e.target.value)}
              />

              <button className="fp-btn">Get OTP</button>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Confirm Email</h2>
              <p className="fp-subtext">Enter the OTP sent to your email</p>

              <label className="fp-label">OTP</label>
              <input
                className="fp-input"
                placeholder="Input your OTP"
                onChange={(e) => setOtp(e.target.value)}
              />

              <button className="fp-btn">Confirm</button>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Reset password</h2>

              <label className="fp-label">New password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="fp-input"
                  placeholder="New password"
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

              <label className="fp-label">Confirm password</label>
              <input
                type="password"
                className="fp-input"
                placeholder="Confirm password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button className="fp-btn secondary">Confirm</button>
            </>
          )}

        </motion.div>
      </div>
    </div>
  );
}

export default ForgotPassword;
