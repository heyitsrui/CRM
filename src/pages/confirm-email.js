import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/create-account.css";
import bgVideo from "../assets/video/background.mp4";

function ConfirmEmail() {
  const navigate = useNavigate();

  // 1. Setup state for 6 individual digits
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // 2. Refs to control focus between boxes
  const inputRefs = useRef([]);

  const email = localStorage.getItem("userEmail");

  // Handle number input and auto-focus next
  const handleChange = (element, index) => {
    const value = element.value.replace(/[^a-zA-Z0-9]/g, "");
    if (!value) return;

    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move focus to next box if it exists
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle backspace to move focus back
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // If current box is empty, move back and clear previous
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // Handle paste (optional but helpful)
  const handlePaste = (e) => {
    const data = e.clipboardData.getData("text").slice(0, 6).split("");
    if (data.length === 6) {
      setOtp(data);
      inputRefs.current[5].focus();
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const handleConfirm = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join(""); // Merge array into one string

    if (fullOtp.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // 1️⃣ Verify the OTP
      const verifyRes = await axios.post("http://localhost:5000/verify-otp", {
        email,
        otp: fullOtp,
      });

      if (verifyRes.data.success) {
        // 2️⃣ Retrieve the pending user data from localStorage
        const savedData = JSON.parse(localStorage.getItem("pendingUserData"));

        if (!savedData) {
          setError("Registration session expired. Please go back.");
          return;
        }

        // 3️⃣ Finally create the account in the database
        await axios.post("http://localhost:5000/register", {
          name: savedData.name,
          email: savedData.email,
          phone: savedData.phone,
          password: savedData.password,
          role: savedData.position
        });

        alert("✅ Account created and email verified successfully!");
        
        // 4️⃣ Cleanup and Redirect
        localStorage.removeItem("userEmail");
        localStorage.removeItem("pendingUserData");
        navigate("/"); 
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP or Registration failed");
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
              <label className="otp-label">OTP</label>
              <div className="otp-input-container">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    className="otp-box"
                    maxLength="1"
                    value={data}
                    ref={(el) => (inputRefs.current[index] = el)}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    required
                  />
                ))}
              </div>
            </div>

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
