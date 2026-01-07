import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => (
  <div className="home-container">
    <h1>KYCVerification</h1>
    <Link to="/kyc" className="start-btn">Go to KYC</Link>
  </div>
);
export default Home;