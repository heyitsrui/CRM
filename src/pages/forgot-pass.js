import React, { useState } from 'react';
import '../styles/forgot-pass.css';
import bgVideo from '../assets/video/background.mp4';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');

  return (
    <div className="fp-container">

      {/* LEFT SIDE */}
      <div className="fp-left">
        <video autoPlay loop muted playsInline className="fp-video">
          <source src={bgVideo} type="video/mp4" />
        </video>

        <div className="fp-overlay">
          <div className="fp-text">
            <h1>THINK DIGITAL.<br />BUILD SMART.<br />SCALE FAST.</h1>
            <p>Visible is your trusted IT partner in navigating the digital landscape.</p>
          </div>

          <a href="/" className="fp-back">← Back to login</a>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="fp-right">
        <div className="fp-card">

          {/* STEP 1 */}
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
              />

              <button
                className="fp-btn"
                onClick={() => {
                  setMessage('OTP has been sent. Please check your email.');
                  setStep(2);
                }}
              >
                Get OTP
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h2>Confirm Email</h2>
              <p className="fp-subtext">
                OTP has been sent. Please check your email
              </p>

              {message && <p className="fp-success">{message}</p>}

              <label className="fp-label">OTP</label>
              <input
                className="fp-input"
                placeholder="Input your OTP"
              />

              <button
                className="fp-btn"
                onClick={() => setStep(3)}
              >
                Confirm
              </button>

              <div className="fp-resend">Resend OTP</div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <h2>Reset password</h2>
              <p className="fp-subtext">
                Please enter your new password
              </p>

            <label className="fp-label">New password</label>
            <input
                type="password"
                className="fp-input"
                placeholder="Must be at least 8 characters and include numbers"
            />

            <label className="fp-label">Confirm password</label>
            <input
                type="password"
                className="fp-input"
                placeholder="Confirm password"
            />

            <button className="fp-btn secondary">
                Confirm
            </button>
            </>
        )}

        </div>
    </div>

    </div>
);
}

export default ForgotPassword;
