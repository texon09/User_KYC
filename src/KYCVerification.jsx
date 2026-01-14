import React from 'react';
import './KYCVerification.css';
import { useNavigate } from 'react-router-dom';

// Import your images
const idImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASIAAACuCAMAAAClZfCT...";
const selfieImg = "https://via.placeholder.com/150?text=Selfie";
const addressImg = "https://via.placeholder.com/150?text=Address";

const KYCVerification = () => {
  const navigate = useNavigate();

  return (
    <div className="kyc-page">
      <div className="company-header">TECHFIESTA CORP</div>

      <div className="kyc-content">
        <h1 className="kyc-title">KYC VERIFICATION</h1>
        <p className="kyc-subtitle">TO PERFORM VERIFICATION YOU WILL NEED</p>

        {/* This container is now a horizontal row */}
        <div className="requirement-row">
          
          <div className="requirement-card">
            <img src={idImg} alt="ID" className="kyc-icon" />
            <span className="req-title">ID Document</span>
          </div>

          <div className="requirement-card">
            <img src={selfieImg} alt="Selfie" className="kyc-icon" />
            <span className="req-title">Clear Selfie</span>
          </div>

          <div className="requirement-card">
            <img src={addressImg} alt="Address" className="kyc-icon" />
            <span className="req-title">Proof of Address</span>
          </div>

        </div>
      </div>

     <button className="get-started-btn" onClick={() => navigate('/upload')}>
      GET STARTED
    </button>

    </div>
  );
};

export default KYCVerification;