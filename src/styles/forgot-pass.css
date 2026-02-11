import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/forgot-pass.css';
import bgVideo from '../assets/video/background.mp4';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  // Changed otp to an array for the 6 boxes
  const [otp, setOtp] = useState(['', '', '', '', '', '']); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpCorrect, setOtpCorrect] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(0);

  const inputRefs = useRef([]);
  const API = "http://localhost:5000";

  // ================================
  // OTP INPUT LOGIC
  // ================================
  const handleOtpChange = (value, index) => {
    if (value !== "" && !/^[a-zA-Z0-9]$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Backspace to previous box
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // ================================
  // SEND OTP
  // ================================
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleGetOtp = async () => {
    setError('');
    setOtpMessage('');
    setSuccessMessage('');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const res = await fetch(`${API}/send-otp`, {
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
        setError(data.message || 'Email not registered');
      }
    } catch {
      setError('Cannot connect to server.');
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    await handleGetOtp();
    setCanResend(false);
    setTimer(60); 
  };

  // ================================
  // VERIFY OTP
  // ================================
  const handleConfirmOtp = async () => {
    setError('');
    setOtpMessage('');
    
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Please enter the full 6-digit OTP');
      return;
    }

    try {
      const res = await fetch(`${API}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpMessage('Correct OTP! Proceeding....');
        setOtpCorrect(true);
        setTimeout(() => {
          setStep(3);
          setOtpMessage('');
        }, 800);
      } else {
        setError(data.message || 'Invalid or expired OTP');
        setOtpCorrect(false);
      }
    } catch {
      setError('Cannot connect to server.');
    }
  };

  // ================================
  // RESET PASSWORD
  // ================================
  const handleResetPassword = async () => {
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch(`${API}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('Password updated successfully. Redirecting to login.');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch {
      setError('Server error');
    }
  };

  return (
    <div className="fp-container">
      <video autoPlay loop muted playsInline className="bg-video">
        <source src={bgVideo} type="video/mp4" />
      </video>

      <div className="header-nav">
        <img src="/vtic.webp" alt="VTIC Logo" className="logo-white" />
        <a href="/" className="fp-back-nav">Back to login</a>
      </div>

      <div className="fp-left">
        <div className="fp-overlay">
          <div className="fp-text">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="branding-box">
              <h1>FORGOT PASSWORD</h1>
              <p>Reset your password.</p>
            </motion.div>
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
          {step === 1 && (
            <>
              <h2>Forgot password?</h2>
              <p className="fp-subtext">Please enter the email address associated with your account</p>
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
              <button className="fp-btn" onClick={handleGetOtp}>Get OTP</button>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Confirm Email</h2>
              <p className="fp-subtext">OTP has been sent. Please check your email</p>
              <hr className="fp-divider" />
              {otpMessage && <div className="fp-info">{otpMessage}</div>}
              {error && <div className="fp-error">{error}</div>}

              <label className="fp-label">OTP</label>
              <div className="otp-input-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    className="otp-box"
                    value={digit}
                    ref={(el) => (inputRefs.current[index] = el)}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  />
                ))}
              </div>

              <button className="fp-btn" onClick={handleConfirmOtp}>Confirm OTP</button>
              <div className="resend-container">
                <span className="resend-text">Didn't you receive any code? </span>
                <button 
                  type="button" 
                  className={`resend-link ${!canResend ? 'disabled' : ''}`} 
                  onClick={handleResendOtp}
                  disabled={!canResend}
                >
                  {canResend ? "Resend Code" : `Wait ${timer}s`}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Reset password</h2>
              {error && <div className="fp-error">{error}</div>}
              {successMessage && <div className="fp-success">{successMessage}</div>}

              <label className="fp-label">New password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="fp-input"
                  placeholder="New password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <label className="fp-label">Confirm password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="fp-input"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="button" className="eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button
                className="fp-btn secondary"
                onClick={handleResetPassword}
              >
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
