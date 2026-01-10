import React, { useState } from "react";
import "./Dashboard.css"; 

const CaseReview = ({ addLog = () => {} }) => {
  // The master list of cases
  const [cases, setCases] = useState([
    { id: "1000", name: "User 1000", status: "PENDING", risk: "HIGH", score: 79, reason: "Face Match 72%" },
    { id: "1001", name: "User 1001", status: "PENDING", risk: "CRITICAL", score: 95, reason: "Duplicate ID" },
    { id: "733", name: "User 733", status: "PENDING", risk: "MEDIUM", score: 45, reason: "Address Mismatch" },
    { id: "1002", name: "User 1002", status: "PENDING", risk: "HIGH", score: 82, reason: "IP Blacklist" },
    { id: "1003", name: "User 1003", status: "PENDING", risk: "MEDIUM", score: 30, reason: "New Device" },
  ]);

  // NEW: State to track active filter
  const [activeFilter, setActiveFilter] = useState("ALL");

  const handleReview = (userName) => {
    addLog("Worker", `Completed Review for ${userName}`);
    setCases(cases.filter(c => c.name !== userName));
  };

  // NEW: Logic to filter the list based on selection
  const filteredCases = cases.filter(c => {
    if (activeFilter === "ALL") return true;
    return c.risk === activeFilter;
  });

  return (
    <div className="cr-section animated-fade">
      <div className="cr-header">
        <h2 className="text-glow">Case Review</h2>
        
        {/* UPDATED: Filter Bar with Click Events */}
        <div className="cr-filter-bar">
          <button 
            className={`cr-pill ${activeFilter === "ALL" ? "active" : ""}`}
            onClick={() => setActiveFilter("ALL")}
          >All Cases</button>
          
          <button 
            className={`cr-pill ${activeFilter === "CRITICAL" ? "active" : ""}`}
            onClick={() => setActiveFilter("CRITICAL")}
          >Critical Only</button>
          
          <button 
            className={`cr-pill ${activeFilter === "HIGH" ? "active" : ""}`}
            onClick={() => setActiveFilter("HIGH")}
          >High Risk</button>

          <button 
            className={`cr-pill ${activeFilter === "MEDIUM" ? "active" : ""}`}
            onClick={() => setActiveFilter("MEDIUM")}
          >Medium Risk</button>
        </div>
      </div>

      <div className="cr-table-container">
        <table className="cr-table">
          <thead>
            <tr>
              <th>User Details</th>
              <th>Status</th>
              <th>Risk Level</th>
              <th>Flag Reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((item) => (
              <tr key={item.id} className="cr-row">
                <td className="cr-td">
                   <div className="cr-user-info">
                     <span className="cr-name">{item.name}</span>
                     <span className="cr-id">#{item.id}</span>
                   </div>
                </td>
                <td className="cr-td">
                  <span className={`cr-status ${item.status.toLowerCase()}`}>{item.status}</span>
                </td>
                <td className="cr-td">
                  <span className={`cr-risk ${item.risk.toLowerCase()}`}>{item.risk}</span>
                </td>
                <td className="cr-td cr-dim">{item.reason}</td>
                <td className="cr-td">
                  <button className="cr-btn" onClick={() => handleReview(item.name)}>
                    Review Case
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Show a message if no cases match the filter */}
        {filteredCases.length === 0 && (
          <div style={{textAlign: 'center', padding: '40px', color: '#444'}}>
            No {activeFilter.toLowerCase()} cases found.
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseReview;