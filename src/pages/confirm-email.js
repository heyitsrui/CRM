import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/create-account.css";
import bgVideo from "../assets/video/background.mp4";

function ConfirmEmail() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const email = localStorage.getItem("userEmail");

  /* ---------------- VERIFY OTP ---------------- */
  const handleConfirm = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.post("http://localhost:5000/verify-otp", {
        email,
        otp,
      });

      if (res.data.success) {
        alert("✅ Email verified successfully!");
        localStorage.removeItem("userEmail");
        navigate("/"); // back to login
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- RESEND OTP ---------------- */
  const handleResend = async () => {
    try {
      setResending(true);
      setError("");

      await axios.post("http://localhost:5000/send-otp", { email });
      alert("📩 New OTP sent to your email");
    } catch (err) {
      setError("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background video */}
      <video autoPlay loop muted playsInline className="bg-video">
        <source src={bgVideo} type="video/mp4" />
      </video>

      <div className="header-nav">
        <img src="/vtic.webp" alt="Logo" className="logo-white" />
        <Link to="/" className="visit-link">
          Go back to login
        </Link>
      </div>

      <div className="content-wrapper">
        <div className="branding-box">
          <h1 className="main-title">CREATE AN ACCOUNT</h1>
          <p className="sub-text">
            Visible is an IT solution company who are your trusted partner in
            navigating the digital landscape.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="register-card"
        >
          <h2 className="card-title" style={{ fontSize: "3rem" }}>
            Confirm Email
          </h2>

          <p className="card-welcome">
            OTP has been sent to <b>{email}</b>
          </p>

          <hr className="divider" />

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
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
                type="text"
                placeholder="Enter 6 digit OTP"
                value={otp}
                maxLength={6}
                onChange={(e) =>
                    setOtp(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))
                }
                required
              />
            </div>

            {/* CONFIRM BUTTON */}
            <button
              type="submit"
              className="register-btn"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Confirm"}
            </button>

            <div className="resend-wrapper">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="resend-btn"
              >
                {resending ? "Sending..." : "Resend OTP"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default ConfirmEmail;
