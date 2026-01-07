import React, { useState } from "react";
import "./App.css";

function App() {
  const [role, setRole] = useState(null); // 'manager' or 'employee'
  const [isVerifying, setIsVerifying] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");

  // Passwords for each role
  const PASSWORDS = {
    manager: "manager123",
    employee: "worker123"
  };

  const handleAuth = () => {
    if (password === PASSWORDS[role]) {
      setIsAuthorized(true);
      setIsVerifying(false);
      setError("");
    } else {
      setError("❌ Incorrect Password. Access Denied.");
    }
  };

  // 1. IDENTITY SELECTION SCREEN
  if (!role && !isAuthorized) {
    return (
      <div className="identity-screen">
        <h1 className="text-glow">Identify Your Role</h1>
        <div className="role-container">
          <div className="role-card" onClick={() => { setRole("manager"); setIsVerifying(true); }}>
            <div className="icon">🔑</div>
            <h2>Manager</h2>
          </div>
          <div className="role-card" onClick={() => { setRole("employee"); setIsVerifying(true); }}>
            <div className="icon">🛡️</div>
            <h2>Employee</h2>
          </div>
        </div>
      </div>
    );
  }

  // 2. PASSWORD GATE SCREEN
  if (isVerifying && !isAuthorized) {
    return (
      <div className="identity-screen">
        <div className="login-box">
          <h2>Authenticating {role === 'manager' ? 'Manager' : 'Employee'}</h2>
          <p>Please enter your secure access key</p>
          <input 
            type="password" 
            className="password-input" 
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="error-msg">{error}</p>}
          <div className="btn-group">
            <button className="login-btn" onClick={handleAuth}>Login</button>
            <button className="back-btn" onClick={() => {setRole(null); setIsVerifying(false); setPassword(""); setError("");}}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  // 3. THE AUTHORIZED DASHBOARD
  return (
    <div className="dashboard-wrapper">
      <header className="db-header">
        <h1>{role === 'manager' ? "Admin Control Center" : "Compliance Workstation"}</h1>
        <div className="user-badge">
          Signed in as: <span className="role-name">{role.toUpperCase()}</span>
          <button className="logout" onClick={() => window.location.reload()}>Logout</button>
        </div>
      </header>

      <main className="db-content">
        <div className="status-banner">System Status: SECURE</div>
        
        {role === "manager" ? (
          <div className="manager-view">
             <h2>🔒 Sensitive AML Reports</h2>
             <div className="kyc-card">Delete User Data</div>
             <div className="kyc-card">Change Risk Parameters</div>
          </div>
        ) : (
          <div className="employee-view">
             <h2>📋 Tasks for Review</h2>
             <div className="kyc-card">Review User #882</div>
             <p>Note: Managerial overrides are hidden.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;