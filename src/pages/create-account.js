import React from 'react';
import { Link } from 'react-router-dom';
// Ensure the path to your CSS is correct. 
// If it's in src/App.css, use '../App.css'. 
// If you made a specific one, ensure it ends in .css
import '../App.css'; 

function CreateAcc() {
  return (
    <div className="login-container">
      <div className="content-wrapper">
        <div className="login-card">
          <h2 className="card-title">Create Account</h2>
          <p className="card-welcome">Join Visible Technology Intl Corp</p>
          
          <form className="login-form">
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" placeholder="Enter your name" required />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input type="email" placeholder="Enter your email" required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="Create a password" required />
            </div>
            <button type="submit" className="login-btn">Sign Up</button>
          </form>

          <p className="signup-footer">
            Already have an account? <Link to="/">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CreateAcc;