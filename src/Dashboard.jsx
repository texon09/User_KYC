import React, { useState } from "react";
import "./Dashboard.css";
import CaseReview from "./CaseReview"; 
import Analytics from "./Analytics";

const Dashboard = ({ role, onLogout, logs = [], addLog = () => {} }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCaseVerified, setIsCaseVerified] = useState(false);
  const [employeeName, setEmployeeName] = useState(""); 

  const handleCaseTabClick = () => {
    if (isCaseVerified || role === 'manager') {
      setActiveTab("caseReview");
      return;
    }

    const pin = prompt("Enter Case Review Access Password:");
    
    if (pin === "worker123") {
      const nameInput = prompt("Enter your Name for the Audit Log:");
      
      if (nameInput && nameInput.trim() !== "") {
        setIsCaseVerified(true);
        setEmployeeName(nameInput); 
        setActiveTab("caseReview");
        
        // Pass the captured name to the audit log
        addLog(nameInput, "Unlocked & Accessed Case Review"); 
      } else {
        alert("❌ Name is required for Audit purposes.");
      }
    } else {
      alert("❌ Unauthorized Access Attempt");
      addLog("SECURITY", `Failed attempt by ${role}`);
    }
  };

  const renderContent = () => {
    if (role === "employee" && (activeTab === "dashboard" || activeTab === "analytics")) {
      return (
        <div className="tab-pane animated-fade">
          <div className="restricted-notice">
            <h2>🔒 Access Restricted</h2>
            <p>The Dashboard and Analytics are reserved for Managerial roles.</p>
            <button className="login-btn" onClick={handleCaseTabClick}>Go to Case Review</button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <div className="tab-pane animated-fade">
            <div className="kpi-grid">
              <div className="kpi-card-vibrant box-red">
                <span className="kpi-label">CRITICAL CASES</span>
                <div className="value-row"><h2>35</h2><div className="pulse-dot"></div></div>
                <span className="kpi-trend">↓ 12% vs last hour</span>
              </div>
              <div className="kpi-card-vibrant box-blue">
                <span className="kpi-label">TOTAL VERIFIED</span>
                <div className="value-row"><h2>1,520</h2></div>
                <span className="kpi-trend positive">↑ 5.4%</span>
              </div>
              <div className="kpi-card-vibrant box-green">
                <span className="kpi-label">ACCURACY RATE</span>
                <div className="value-row"><h2>98.2%</h2></div>
                <div className="mini-progress"><div className="fill-green" style={{width: '98%'}}></div></div>
              </div>
              <div className="kpi-card-vibrant box-purple">
                <span className="kpi-label">AVG. RESPONSE</span>
                <div className="value-row"><h2>1.2s</h2></div>
                <span className="kpi-trend">STABLE</span>
              </div>
            </div>

            <div className="dashboard-lower-section">
              <div className="dashboard-block-solid">
                <div className="monitor-header">
                  <h3 className="text-glow">System Health Monitor</h3>
                  <span className="status-tag-live">LIVE</span>
                </div>
                <div className="stat-circle-group">
                  <div className="stat-circle-box"><div className="ring blue-text">85%</div><span>CPU Load</span></div>
                  <div className="stat-circle-box"><div className="ring green-text">42%</div><span>Memory</span></div>
                </div>
              </div>

              <div className="dashboard-block-solid">
                <div className="feed-header"><h3>Recent Activity</h3></div>
                <div className="audit-list-vibrant">
                  {logs.slice(0, 3).map((log) => (
                    <div key={log.id} className="audit-row-item">
                      {/* Added fallback for avatar letter */}
                      <div className="log-avatar">{log.user ? log.user[0] : "U"}</div>
                      <div className="log-info">
                        <p><strong>{log.user}</strong> {log.action}</p>
                        <span className="log-date">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case "caseReview":
        return <CaseReview addLog={addLog} />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return (
          <div className="tab-pane animated-fade">
            <h2 className="text-glow">⚙️ System Settings</h2>
            <div className="settings-card">
               <p>Active Role: <strong>{role?.toUpperCase()}</strong></p>
               {employeeName && <p>Verified User: <strong>{employeeName}</strong></p>}
               <button className="logout-btn" onClick={onLogout}>Logout Session</button>
            </div>
          </div>
        );
      default:
        return <div className="tab-pane"><h2>Select a section</h2></div>;
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">F<span>▲</span></div>
        <nav className="nav-menu">
          {role === "manager" && (
            <>
              <button className={activeTab === "dashboard" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("dashboard")}>🏠 Dashboard</button>
              <button className={activeTab === "analytics" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("analytics")}>📊 Analytics</button>
            </>
          )}
          
          <button 
            className={activeTab === "caseReview" ? "nav-btn active" : "nav-btn"} 
            onClick={handleCaseTabClick}
          >📋 Case Review</button>

          <button className={activeTab === "settings" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("settings")}>⚙️ Settings</button>
        </nav>
        
        <div className="sidebar-footer">
          {/* Display Employee Name here to avoid 'unused' error */}
          <div className="user-tag">{employeeName ? `👤 ${employeeName}` : role?.toUpperCase()}</div>
          <button className="logout-mini" onClick={onLogout}>Logout</button>
        </div>
      </aside>

      <main className="main-viewport">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;