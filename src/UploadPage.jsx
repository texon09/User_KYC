import React, { useState } from 'react';
import './UploadPage.css';

const UploadPage = () => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else alert("Verification Submitted!");
  };

  return (
    <div className="upload-container">
      {/* Fixed Progress Header */}
      <div className="fixed-header">
        <div className="header-content">
          <div className="progress-info">
            <span className="step-badge">Step {step} of 3</span>
            <span className="percentage-text">{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="step-content">
        {step === 1 && (
          <div>
            <h1 className="step-title">Upload ID</h1>
            <p className="step-description">We need to verify your identity. Please upload a clear photo of your National ID or Passport.</p>
            <div className="upload-box">
              <span className="upload-icon">📄</span>
              <p>Click to upload or drag and drop</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="step-title">Take a Selfie</h1>
            <p className="step-description">Make sure your face is well-lit and fits inside the frame.</p>
            <div className="upload-box" style={{height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <span style={{fontSize: '50px'}}>🤳</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="step-title">Review</h1>
            <p className="step-description">Almost there! Please check your details before final submission.</p>
            <div className="upload-box" style={{background: '#ecfdf5', border: '2px solid #10b981'}}>
               <span style={{color: '#059669', fontWeight: 'bold'}}>✓ All Documents Ready</span>
            </div>
          </div>
        )}

        <div className="button-footer">
          <button className="next-btn" onClick={handleNext}>
            {step === 3 ? "FINISH VERIFICATION" : "CONTINUE"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;