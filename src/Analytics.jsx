import React from "react";
import "./Dashboard.css";

const Analytics = () => {
  // Mock data for the charts
  const volumeData = [
    { day: "Mon", val: 65 },
    { day: "Tue", val: 40 },
    { day: "Wed", val: 85 },
    { day: "Thu", val: 55 },
    { day: "Fri", val: 90 },
    { day: "Sat", val: 70 },
    { day: "Sun", val: 30 },
  ];

  return (
    <div className="analytics-container animated-fade">
      <h2 className="text-glow">📊 System Analytics</h2>

      <div className="analytics-grid-main">
        
        {/* 1. PERFORMANCE GRAPHS */}
        <div className="ana-card">
          <h3>System Performance</h3>
          <div className="ana-perf-list">
            <div className="ana-perf-item">
              <div className="ana-perf-info">
                <span>Server Response</span>
                <span>92%</span>
              </div>
              <div className="ana-progress-bg">
                <div className="ana-progress-fill blue" style={{ width: "92%" }}></div>
              </div>
            </div>
            <div className="ana-perf-item">
              <div className="ana-perf-info">
                <span>Database Load</span>
                <span>24%</span>
              </div>
              <div className="ana-progress-bg">
                <div className="ana-progress-fill green" style={{ width: "24%" }}></div>
              </div>
            </div>
            <div className="ana-perf-item">
              <div className="ana-perf-info">
                <span>Network Latency</span>
                <span>12ms</span>
              </div>
              <div className="ana-progress-bg">
                <div className="ana-progress-fill purple" style={{ width: "15%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. PIE CHART (System Health) */}
        <div className="ana-card center-content">
          <h3>Traffic Distribution</h3>
          <div className="ana-pie-wrapper">
            <div className="ana-pie-chart"></div>
            <div className="ana-pie-legend">
              <div className="leg-item"><span className="dot green"></span> Valid</div>
              <div className="leg-item"><span className="dot yellow"></span> Flagged</div>
              <div className="leg-item"><span className="dot red"></span> Bot</div>
            </div>
          </div>
        </div>

        {/* 3. BAR GRAPH (Daily Volume) */}
        <div className="ana-card full-width">
          <h3>Daily Verification Volume</h3>
          <div className="ana-bar-chart">
            {volumeData.map((d, i) => (
              <div key={i} className="ana-bar-col">
                <div 
                  className="ana-bar-pill" 
                  style={{ height: `${d.val}%` }}
                  title={`${d.val} units`}
                >
                  <span className="ana-tooltip">{d.val}</span>
                </div>
                <span className="ana-bar-label">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;