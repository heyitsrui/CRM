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

  // =============================
  // SEND OTP
  // =============================
  const handleGetOtp = async () => {
    setError('');
    setOtpMessage('');

    // Frontend email format validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpMessage('OTP sent to your email. Please check your inbox.');
        setStep(2);
        setOtpCorrect(false);
      } else {
        setError(data.message || 'Email is invalid or not registered');
      }
    } catch (err) {
      setError('Cannot connect to server.');
    }
  };

  // =============================
  // VERIFY OTP
  // =============================
  const handleConfirmOtp = async () => {
    setError('');
    setOtpMessage('');

    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpMessage('Correct OTP, you may proceed.');
        setOtpCorrect(true);
      } else {
        setError(data.message || 'Invalid or expired OTP');
        setOtpCorrect(false);
      }
    } catch (err) {
      setError('Cannot connect to server.');
    }
  };

  // =============================
  // PROCEED TO RESET
  // =============================
  const handleProceedReset = () => {
    setStep(3);
    setOtpMessage('');
    setOtpCorrect(false);
    setError('');
  };

  return (
    <div className="fp-container">
      <video autoPlay loop muted playsInline className="bg-video">
        <source src={bgVideo} type="video/mp4" />
      </video>

      <div className="header-nav">
        <img src="/vtic.webp" alt="VTIC Logo" className="logo-white" />
        <a href="/" className="fp-back-nav">Back to login</a>
        <a href="https://vtic.ph" target="_blank" rel="noreferrer" className="visit-link">
          Visit Website
        </a>
      </div>

      <div className="fp-left">
        <div className="fp-overlay">
          <div className="fp-text">
            <h1>
              THINK DIGITAL.<br />
              BUILD SMART.<br />
              SCALE FAST.
            </h1>
            <p>
              Visible is your trusted IT partner in navigating the digital landscape.
            </p>
          </div>
        </div>
      </div>

      <div className="fp-right">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="fp-card fp-card-otp"
        >

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h2>Forgot password?</h2>
              <p className="fp-subtext">
                Please enter the email address associated with your account
              </p>

              <hr className="fp-divider" />

              {error && <div className="fp-error">{error}</div>}

              <label className="fp-label" style={{ marginTop: '25px' }}>Email</label>
              <input
                type="email"
                className="fp-input"
                placeholder="Input your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button className="fp-btn" onClick={handleGetOtp}>
                Get OTP
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h2>Confirm Email</h2>
              <p className="fp-subtext">OTP has been sent. Please check your email</p>
              <hr className="fp-divider" />

              {otpMessage && !otpCorrect && (
                <div className="fp-info" style={{ marginTop: '10px' }}>
                  {otpMessage}
                </div>
              )}

              {error && (
                <div className="fp-error" style={{ marginTop: '10px' }}>
                  {error}
                </div>
              )}

              <label className="fp-label" style={{ marginTop: '20px' }}>OTP</label>
              <input
                className="fp-input"
                placeholder="Input your OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <button className="fp-btn" onClick={handleConfirmOtp}>
                Confirm OTP
              </button>

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

          {/* STEP 3 */}
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

              <button className="fp-btn secondary">
                Confirm
              </button>
            </>
          )}

        </motion.div>
      </div>
    </div>
  );
}

export default ForgotPassword;
