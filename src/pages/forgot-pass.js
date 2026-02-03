import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [otpMessage, setOtpMessage] = useState('');
  const [otpCorrect, setOtpCorrect] = useState(false);

  const handleGetOtp = () => {
    setOtpMessage('Another OTP Sent, please check your email.');
    setError('');
    setStep(2);
    setOtpCorrect(false);
  };

  const handleConfirmOtp = () => {
    if (otp === '1234') { // example correct OTP
      setOtpMessage('Correct OTP, you may proceed.');
      setError('');
      setOtpCorrect(true);
    } else {
      setError('Invalid OTP');
      setOtpMessage('');
      setOtpCorrect(false);
    }
  };

  const handleProceedReset = () => {
    setStep(3);
    setOtpMessage('');
    setOtpCorrect(false);
    setError('');
  };

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
          className="fp-card fp-card-otp"
        >

          {step === 1 && (
            <>
              <h2>Forgot password?</h2>
              <p className="fp-subtext">
                Please enter the email address associated with your account
              </p>

              <hr className="fp-divider" />

              <label className="fp-label" style={{ marginTop: '25px' }}>Email</label>
              <input
                type="email"
                className="fp-input"
                placeholder="Input your email"
                onChange={(e) => setEmail(e.target.value)}
              />

              <button className="fp-btn" onClick={handleGetOtp}>
                Get OTP
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Confirm Email</h2>

              {/* Subtext */}   
              <p className="fp-subtext">OTP has sent already, Please check your email</p>
              <hr className="fp-divider" />

              {/* OTP message immediately below subtext */}
              {(otpMessage && !otpCorrect) && (
                <div className="fp-info" style={{ marginTop: '10px' }}>
                  {otpMessage}
                </div>
              )}
              {error && (
                <div className="fp-error" style={{ marginTop: '10px' }}>
                  {error}
                </div>
              )}

              {/* OTP input */}
              <label className="fp-label" style={{ marginTop: '20px' }}>OTP</label>
              <input
                className="fp-input"
                placeholder="Input your OTP"
                onChange={(e) => setOtp(e.target.value)}
              />

              <button className="fp-btn" onClick={handleConfirmOtp}>
                Confirm OTP
              </button>

              {/* Proceed button fixed at bottom */}
              {otpCorrect && (
                <button
                  className="fp-btn secondary fp-btn-bottom"
                  onClick={handleProceedReset}
                >
                  Proceed to Reset Password
                </button>
              )}
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
