import React, { useState } from "react";
import { callApi } from "../api";
import { useNavigate, useLocation } from "react-router-dom";
import "../assets/ResetPasswod.css";  // Using existing styles

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token"); // Get token from URL

  const handleReset = async () => {
    setMessage("");
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      let data = JSON.stringify({ token, newPassword });
      callApi("POST", "http://localhost:8080/expense_users/reset-password", data, (response) => {
        let resp = response.split("::");
        if (resp[0] === "200") {
          setMessage("Password reset successfully!");
          setTimeout(() => navigate("/"), 3000);
        } else {
          setError(resp[1]);
        }
      });
    } catch (err) {
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div>
      <header className="title">
          <h1>ArthaGuru - Personal Finance Assistant</h1>          
      </header>
    <div className="auth-container">
      <h2>Reset Password</h2>
      <p>Enter your new password below.</p>
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={handleReset} className="btn-primary">Reset Password</button>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>

      <footer>
        <p>&copy; 2024 ArthaGuru. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default ResetPassword;
