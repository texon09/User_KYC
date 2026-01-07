import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import KYCVerification from './KYCVerification';
// ADD THIS LINE BELOW:
import UploadPage from './UploadPage'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kyc" element={<KYCVerification />} />
        {/* Now this line will work because UploadPage is defined! */}
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </Router>
  );
}

export default App;