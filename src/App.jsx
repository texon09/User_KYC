import React, { useState } from "react";
import Dashboard from "./Dashboard"; 
import "./App.css";

function App() {
  const [role, setRole] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");

  const PASSWORDS = {
    manager: "manager123",
    employee: "worker123"
  };
const [logs, setLogs] = useState([
  { id: 1, user: "System", action: "Server Started", time: "08:00 AM" }
]);

// Function to record new actions
const addLog = (userName, action) => {
  const newLog = {
    id: logs.length + 1,
    user: userName,
    action: action,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  setLogs([newLog, ...logs]); // Adds new log to the top
};

  // --- FIX 1: CLEAR STATE WHEN SELECTING A ROLE ---
  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setIsVerifying(true);
    setError("");      // Clear any old error messages
    setPassword("");   // Clear the input field
  };

  const handleAuth = () => {
    if (password === PASSWORDS[role]) {
      setIsAuthorized(true);
      setIsVerifying(false);
      setError("");
    } else {
      setError("❌ Incorrect Password.");
    }
  };

  const handleLogout = () => {
    // Reset everything back to the start
    setRole(null);
    setIsAuthorized(false);
    setIsVerifying(false);
    setPassword("");
    setError("");
  };

  // 1. IDENTITY SELECTION
  if (!role && !isAuthorized) {
    return (
      <div className="identity-screen">
        <h1 className="text-glow">Identify Your Role</h1>
        <div className="role-container">
          {/* Use the new handleRoleSelect function here */}
          <div className="role-card" onClick={() => handleRoleSelect("manager")}>
            <div className="icon">🔑</div>
            <h2>Manager</h2>
          </div>
          <div className="role-card" onClick={() => handleRoleSelect("employee")}>
            <div className="icon">🛡️</div>
            <h2>Employee</h2>
          </div>
        </div>
      </div>
    );
  }

  // 2. PASSWORD GATE
  if (isVerifying && !isAuthorized) {
    return (
      <div className="identity-screen">
        <div className="login-box">
          <h2>Auth: {role === "manager" ? "Manager" : "Employee"}</h2>
          <input 
            type="password" 
            className="password-input" 
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            // Allows pressing "Enter" to login
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />
          {error && <p className="error-msg">{error}</p>}
          <div className="btn-group">
            <button className="login-btn" onClick={handleAuth}>Login</button>
            {/* --- FIX 2: CLEAR ERROR WHEN GOING BACK --- */}
            <button className="back-btn" onClick={() => {
              setRole(null); 
              setIsVerifying(false); 
              setError(""); 
            }}>Back</button>
          </div>
        </div>
      </div>
    );
    
  }

  // 3. AUTHORIZED DASHBOARD
// In App.jsx
return (
  <Dashboard 
    role={role} 
    onLogout={handleLogout} 
    logs={logs} 
    addLog={addLog} // <--- THIS MUST BE HERE
  />
);
}

export default App;