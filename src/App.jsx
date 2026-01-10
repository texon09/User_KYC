import { useEffect, useRef, useState } from "react";
import "./Bot.css";

const API_BASE = "http://localhost:8000";

const KYC_STEPS = [
  {
    id: "welcome",
    title: "Welcome",
    message:
      "Hi, I am FinBot. I will guide you through your KYC verification end to end.",
    hint: "We’ll finish this in a few quick steps.",
  },
  {
    id: "basic-info",
    title: "Basic information",
    message:
      "Provide your legal identity details exactly as on your ID and verify your mobile number.",
    hint: "Required: Legal name, date of birth, country of residence, mobile number.",
  },
  {
    id: "document-upload",
    title: "Document upload",
    message:
      "Upload a clear copy of your government-issued identity document.",
    hint: "Max size 5 MB. Accepted: PAN, Aadhaar, Passport.",
  },
  {
    id: "selfie-check",
    title: "Selfie / liveness",
    message:
      "Follow the liveness prompts: close your eyes, open them, and keep a straight face.",
    hint: "Make sure your face is well lit and fully inside the frame.",
  },
  {
    id: "risk-checks",
    title: "Compliance checks",
    message:
      "We run AML, sanction, and risk checks automatically in the background.",
    hint: "No action needed here from you.",
  },
  {
    id: "completed",
    title: "Review & submit",
    message:
      "Review your information and submit the KYC verification form.",
    hint: "Once submitted, your status appears on the next screen.",
  },
];

const STATUS_OPTIONS = [
  { id: "REPORTED", label: "Reported", accent: "status-reported" },
  { id: "FLAGGED", label: "Flagged", accent: "status-flagged" },
  { id: "MANUAL_REVIEW", label: "Manual review", accent: "status-review" },
  {
    id: "UNDER_OBSERVATION",
    label: "Under observation",
    accent: "status-observation",
  },
  {
    id: "ACCEPTED_UNDER_OBSERVATION",
    label: "Accepted – under observation",
    accent: "status-observation",
  },
  { id: "ACCEPTED", label: "Accepted", accent: "status-accepted" },
];

const FIU_STATUS_META = {
  REPORTED: {
    modelMeaning: "Highest risk, must be reported immediately",
    fiuCode: "STR_P1",
    fiuMeaning: "Suspicious Transaction Report – Priority 1",
  },
  FLAGGED: {
    modelMeaning: "Serious suspicion, needs escalation",
    fiuCode: "STR_P2",
    fiuMeaning: "Suspicious Transaction Report – Priority 2",
  },
  MANUAL_REVIEW: {
    modelMeaning: "Analyst must review before any reporting",
    fiuCode: "STR_REVIEW",
    fiuMeaning: "Internal suspicious case under review",
  },
  UNDER_OBSERVATION: {
    modelMeaning: "Risky, monitored more closely",
    fiuCode: "MONITORING",
    fiuMeaning: "Ongoing monitoring, no STR/CTR filed yet",
  },
  ACCEPTED_UNDER_OBSERVATION: {
    modelMeaning: "Accepted but still watched for deterioration",
    fiuCode: "CTR_MONITOR",
    fiuMeaning: "Cash Transaction Report – accepted but monitored",
  },
  ACCEPTED: {
    modelMeaning: "Cleared, normal behaviour",
    fiuCode: "CTR_PASS",
    fiuMeaning: "Cash Transaction Report – Cleared / Passed",
  },
};

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [lastSuccessStep, setLastSuccessStep] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("ACCEPTED");
  const [hoverContext, setHoverContext] = useState(null);
  const [theme, setTheme] = useState("dark");

  // basic info + OTP
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("India");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [serverOtp, setServerOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");

  // KYC document info
  const [documentType, setDocumentType] = useState("PAN");
  const [documentPreview, setDocumentPreview] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [address, setAddress] = useState("");

  // backend results
  const [backendPanResult, setBackendPanResult] = useState(null);
  const [backendAadhaarResult, setBackendAadhaarResult] = useState(null);
  const [backendVerifyResult, setBackendVerifyResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // selfie / liveness
  const [selfieCaptured, setSelfieCaptured] = useState(false);
  const [selfieImageUrl, setSelfieImageUrl] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const step = KYC_STEPS[currentStep];
  const totalSteps = KYC_STEPS.length;
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  const goNext = () => {
    setError("");
    setApiError("");
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
      setLastSuccessStep(step.id);
    }
  };

  const goBack = () => {
    setError("");
    setApiError("");
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  // document change: store file + preview + map to PAN/Aadhaar
  const handleDocumentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (documentType === "PAN") {
      setPanFile(file);
    } else if (documentType === "AADHAAR") {
      setAadhaarFile(file);
    }

    const url = URL.createObjectURL(file);
    setDocumentPreview({ name: file.name, url });
    setError("");
    setApiError("");
    setLastSuccessStep("document-upload");
  };

  // call /kyc/pan or /kyc/aadhaar
  const handleUploadAndExtract = async () => {
    setError("");
    setApiError("");

    const file =
      documentType === "PAN" ? panFile : documentType === "AADHAAR" ? aadhaarFile : null;

    if (!file) {
      setError("Please choose a document file before continuing.");
      return;
    }

    if (documentType === "PASSPORT") {
      setError("Backend supports PAN and Aadhaar extraction currently.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    let endpoint = "";
    if (documentType === "PAN") endpoint = "/kyc/pan";
    if (documentType === "AADHAAR") endpoint = "/kyc/aadhaar";

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.detail || data.message || "Document extraction failed.");
        return;
      }

      if (endpoint === "/kyc/pan") {
        setBackendPanResult(data);
        // auto-fill PAN number if extracted
        if (data.pan) setPanNumber(data.pan);
      }
      if (endpoint === "/kyc/aadhaar") {
        setBackendAadhaarResult(data);
        if (data.aadhaar) setAadhaarNumber(data.aadhaar);
        if (data.extracted_data?.address) setAddress(data.extracted_data.address);
      }

      setLastSuccessStep("document-upload");
      goNext();
    } catch (err) {
      setApiError("Network or server error while processing document.");
    } finally {
      setIsLoading(false);
    }
  };

  // final /kyc/verify call
  const handleSubmitForm = async () => {
    setError("");
    setApiError("");

    if (!panFile || !aadhaarFile) {
      setError("Please upload both PAN and Aadhaar before submitting.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("pan_file", panFile);
      formData.append("aadhaar_file", aadhaarFile);
      formData.append("name", fullName || "");
      formData.append("pan_number", panNumber || "");
      formData.append("aadhaar_number", aadhaarNumber || "");
      formData.append("date_of_birth", dob || "");
      formData.append("address", address || "");

      const res = await fetch(`${API_BASE}/kyc/verify`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setApiError(data.detail || "Verification failed.");
        return;
      }

      setBackendVerifyResult(data);
      setLastSuccessStep("completed");
      setIsSubmitted(true);
      stopCameraStream();
    } catch (err) {
      setApiError("Network or server error during final verification.");
    } finally {
      setIsLoading(false);
    }
  };

  // ------- CAMERA / LIVENESS -------
  const requestCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      streamRef.current = stream;
    } catch (err) {
      setCameraError("Unable to access camera. Please allow camera permission.");
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 480;
    const height = video.videoHeight || 360;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/png");
    setSelfieImageUrl(dataUrl);
    setSelfieCaptured(true);
    setLastSuccessStep("selfie-check");
  };

  useEffect(() => {
    if (KYC_STEPS[currentStep].id !== "selfie-check") {
      stopCameraStream();
    }
  }, [currentStep]);

  // ---------- OTP ----------
  const canRequestOtp =
    fullName.trim() && dob && country.trim() && phone.trim().length >= 10;

  const handleSendOtp = () => {
    setOtpError("");
    if (!canRequestOtp) {
      setOtpError(
        "Fill name, date of birth, country, and a valid phone number first."
      );
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setServerOtp(code);
    setOtpSent(true);
    setOtpInput("");
    alert(`Demo OTP: ${code}`);
  };

  const handleVerifyOtp = () => {
    setOtpError("");
    if (!otpSent) {
      setOtpError("Please request an OTP first.");
      return;
    }
    if (otpInput.trim() === serverOtp) {
      setOtpVerified(true);
      setLastSuccessStep("basic-info");
    } else {
      setOtpVerified(false);
      setOtpError("Incorrect OTP. Please try again.");
    }
  };

  const basicInfoNextDisabled = !otpVerified;

  // ---------- STATUS PAGE ----------
  if (isSubmitted) {
    const statusMeta =
      STATUS_OPTIONS.find((s) => s.id === selectedStatus) || STATUS_OPTIONS[0];

    return (
      <div className={`kyc-shell theme-${theme}`}>
        <div className="bg-grid" />
        <div className="bg-orbit bg-orbit-left" />
        <div className="bg-orbit bg-orbit-right" />
        <div className="bg-particles" />

        <header className="kyc-topbar">
          <div className="topbar-left">
            <div className="brand-mark">FinKYC</div>
            <div className="brand-subtitle">Verification status overview</div>
          </div>
          <div className="topbar-right">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </header>

        <main className="main-layout">
          <section className="steps-column status-column">
            <div className="canvas-header">
              <p className="step-chip">KYC result</p>
              <h1>Verification status</h1>
              <p className="canvas-message">
                Your profile has been processed by our compliance engine.
              </p>
              <p className="canvas-hint">
                Toggle through possible outcomes to see how your UI will look.
              </p>
            </div>

            <div className="status-panel">
              <div className="status-header">
                <div className="status-icon-ring">
                  <div className={`status-icon ${statusMeta.accent}`}>
                    <span className="status-icon-symbol" />
                  </div>
                </div>
                <div>
                  <p className="status-chip">KYC verification result</p>
                  <h2 className={`status-value ${statusMeta.accent}`}>
                    {statusMeta.label}
                  </h2>
                  <p className="status-subtitle">
                    Status labels are generated from document checks, AML
                    screening, and risk scoring rules.
                  </p>
                </div>
              </div>

              <div className="status-selector">
                <p className="status-label">Status definitions</p>
                <div className="status-chips-row">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={[
                        "status-pill",
                        opt.id === selectedStatus ? "status-pill-active" : "",
                        opt.accent,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setSelectedStatus(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="status-fiu-block">
                <p className="status-label">FIU-style mapping</p>
                <table className="status-fiu-table">
                  <thead>
                    <tr>
                      <th>Internal status (model)</th>
                      <th>Meaning (platform)</th>
                      <th>FIU-style code</th>
                      <th>Meaning (FIU-style)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STATUS_OPTIONS.map((opt) => {
                      const meta = FIU_STATUS_META[opt.id];
                      if (!meta) return null;
                      return (
                        <tr
                          key={opt.id}
                          className={
                            opt.id === selectedStatus
                              ? "status-fiu-row-active"
                              : ""
                          }
                        >
                          <td>{opt.id}</td>
                          <td>{meta.modelMeaning}</td>
                          <td>{meta.fiuCode}</td>
                          <td>{meta.fiuMeaning}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {backendVerifyResult && (
                <section className="verification-details">
                  <h3>Verification scores</h3>
                  <p>
                    Overall match:{" "}
                    {backendVerifyResult.verification_result.overall_match
                      ? "Yes"
                      : "No"}
                  </p>
                  <p>
                    Overall score:{" "}
                    {backendVerifyResult.verification_result.overall_score}%
                  </p>
                  <p>Decision time: {backendVerifyResult.timestamp}</p>

                  <table className="field-scores-table">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Extracted</th>
                        <th>Provided</th>
                        <th>Score (%)</th>
                        <th>Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backendVerifyResult.verification_result.field_scores.map(
                        (row) => (
                          <tr key={row.field}>
                            <td>{row.field}</td>
                            <td>{row.extracted}</td>
                            <td>{row.provided}</td>
                            <td>{row.score}</td>
                            <td>{row.match ? "Yes" : "No"}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>

                  <h4>Extracted data (combined)</h4>
                  <pre className="json-preview">
                    {JSON.stringify(
                      backendVerifyResult.verification_result.extracted_data,
                      null,
                      2
                    )}
                  </pre>
                </section>
              )}

              {apiError && (
                <div className="error-banner error">{apiError}</div>
              )}
            </div>

            <div className="steps-footer-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsSubmitted(false);
                  setSelectedStatus("ACCEPTED");
                }}
              >
                Back to KYC flow
              </button>
              <button type="button" className="btn-primary">
                Go to dashboard
              </button>
            </div>
          </section>

          <VerticalProgress
            progress={progress}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
          <FinBot
            step={step}
            stepIndex={currentStep}
            totalSteps={totalSteps}
            hasError={Boolean(error || cameraError || otpError || apiError)}
            lastSuccessStep={lastSuccessStep}
            status={selectedStatus}
            hoverContext={hoverContext}
          />
        </main>
      </div>
    );
  }

  // ---------- MAIN FLOW ----------
  return (
    <div className={`kyc-shell theme-${theme}`}>
      <div className="bg-grid" />
      <div className="bg-orbit bg-orbit-left" />
      <div className="bg-orbit bg-orbit-right" />
      <div className="bg-particles" />

      <header className="kyc-topbar">
        <div className="topbar-left">
          <div className="brand-mark">FinKYC</div>
          <div className="brand-subtitle">
            Secure KYC &amp; AML verification
          </div>
        </div>
        <div className="topbar-right">
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </header>

      <main className="main-layout">
        <section className="steps-column">
          <div className="canvas-header">
            <p className="step-chip">Identity verification flow</p>
            <h1>{step.title}</h1>
            <p className="canvas-message">{step.message}</p>
            <p className="canvas-hint">{step.hint}</p>
          </div>

          <div className="steps-grid">
            {step.id === "welcome" && (
              <>
                <article
                  className="step-card gamified-card"
                  onMouseEnter={() => setHoverContext("welcome-intro")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <div className="gamified-icon" />
                  <h3>Level 1: Get started</h3>
                  <p>
                    You are beginning your KYC journey. Complete each step to
                    unlock your verified account badge.
                  </p>
                </article>

                <article
                  className="step-card gamified-card"
                  onMouseEnter={() => setHoverContext("security-summary")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <div className="gamified-icon" />
                  <h3>Security score</h3>
                  <p>
                    KYC and AML checks help keep your funds and identity
                    protected.
                  </p>
                </article>
              </>
            )}

            {step.id === "basic-info" && (
              <>
                <article
                  className="step-card"
                  onMouseEnter={() => setHoverContext("full-name")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <label>
                    Full name
                    <input
                      placeholder="As per PAN / Aadhaar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </label>
                </article>

                <article
                  className="step-card"
                  onMouseEnter={() => setHoverContext("dob")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <label>
                    Date of birth
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </label>
                </article>

                <article
                  className="step-card"
                  onMouseEnter={() => setHoverContext("country")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <label>
                    Country of residence
                    <input
                      placeholder="India"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </label>
                </article>

                <article
                  className="step-card"
                  onMouseEnter={() => setHoverContext("phone")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <label>
                    Mobile number
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>
                  <div className="otp-row">
                    <button
                      type="button"
                      className="btn-secondary otp-send-btn"
                      onClick={handleSendOtp}
                      disabled={!canRequestOtp}
                    >
                      {otpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                    <input
                      className="otp-input"
                      placeholder="Enter OTP"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-primary otp-verify-btn"
                      onClick={handleVerifyOtp}
                      disabled={!otpSent}
                    >
                      Verify
                    </button>
                  </div>
                  <span className="field-hint">
                    An OTP will be sent to this number. Verify it before
                    continuing.
                  </span>
                  {otpVerified && (
                    <div className="otp-success">
                      Mobile number verified.
                    </div>
                  )}
                  {otpError && (
                    <div className="error-banner otp-error">{otpError}</div>
                  )}
                </article>

                <article className="step-card">
                  <label>
                    PAN number (as provided)
                    <input
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                    />
                  </label>
                  <label>
                    Aadhaar number (as provided)
                    <input
                      placeholder="1234 5678 9012"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                    />
                  </label>
                </article>

                <article className="step-card">
                  <label>
                    Address
                    <textarea
                      placeholder="As per Aadhaar / official proof"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </label>
                </article>
              </>
            )}

            {step.id === "document-upload" && (
              <>
                <article
                  className="step-card"
                  onMouseEnter={() => setHoverContext("document-type")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <label>
                    Document type
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                    >
                      <option value="PAN">PAN</option>
                      <option value="AADHAAR">Aadhaar</option>
                      <option value="PASSPORT">Passport</option>
                    </select>
                  </label>
                </article>

                <article
                  className="step-card upload-block"
                  onMouseEnter={() => setHoverContext("document-upload")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <label>Upload document</label>
                  <div className="upload-area">
                    <input
                      id="doc-upload-input"
                      type="file"
                      onChange={handleDocumentChange}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() =>
                        document
                          .getElementById("doc-upload-input")
                          ?.click()
                      }
                    >
                      Choose file
                    </button>
                    <button
                      type="button"
                      className="btn-primary upload-continue-btn"
                      onClick={handleUploadAndExtract}
                      disabled={!documentPreview || isLoading}
                    >
                      {isLoading ? "Processing..." : "Upload & extract"}
                    </button>
                    <span className="field-hint">
                      Use a clear, uncropped image. Avoid screenshots of your
                      document.
                    </span>
                  </div>

                  <label>Preview</label>
                  <div className="inner-preview-box">
                    {documentPreview ? (
                      <>
                        <div className="preview-label">
                          {documentPreview.name}
                        </div>
                        <div className="preview-frame">
                          <img
                            src={documentPreview.url}
                            alt="Document preview"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="preview-placeholder">
                        Uploaded file preview will appear here.
                      </div>
                    )}
                  </div>
                </article>

                {backendPanResult && (
                  <article className="step-card extraction-summary">
                    <h4>PAN extraction</h4>
                    <p>Status: {backendPanResult.status}</p>
                    <p>Message: {backendPanResult.message}</p>
                    <p>Extracted PAN: {backendPanResult.pan}</p>
                    {backendPanResult.extracted_data?.name && (
                      <p>Name (OCR): {backendPanResult.extracted_data.name}</p>
                    )}
                    {backendPanResult.extracted_data?.dob && (
                      <p>DOB (OCR): {backendPanResult.extracted_data.dob}</p>
                    )}
                  </article>
                )}

                {backendAadhaarResult && (
                  <article className="step-card extraction-summary">
                    <h4>Aadhaar extraction</h4>
                    <p>Status: {backendAadhaarResult.status}</p>
                    <p>Message: {backendAadhaarResult.message}</p>
                    <p>
                      Extracted Aadhaar: {backendAadhaarResult.aadhaar}
                    </p>
                    {backendAadhaarResult.extracted_data?.name && (
                      <p>
                        Name (OCR):{" "}
                        {backendAadhaarResult.extracted_data.name}
                      </p>
                    )}
                    {backendAadhaarResult.extracted_data?.dob && (
                      <p>
                        DOB (OCR):{" "}
                        {backendAadhaarResult.extracted_data.dob}
                      </p>
                    )}
                    {backendAadhaarResult.extracted_data?.address && (
                      <p>
                        Address (OCR):{" "}
                        {backendAadhaarResult.extracted_data.address}
                      </p>
                    )}
                  </article>
                )}
              </>
            )}

            {step.id === "selfie-check" && (
              <article
                className="step-card selfie-block"
                onMouseEnter={() => setHoverContext("selfie")}
                onMouseLeave={() => setHoverContext(null)}
              >
                <h3>Selfie liveness capture</h3>
                <p>
                  Allow camera access and follow the prompts: first look
                  straight, then close your eyes, then open them again.
                </p>

                <div className="selfie-layout">
                  <div className="selfie-upload">
                    <div className="live-video-shell">
                      <video
                        ref={videoRef}
                        className="live-video"
                        autoPlay
                        playsInline
                        muted={!streamRef.current}
                      />
                      {!streamRef.current && (
                        <div className="live-video-overlay">
                          <p>Camera is off.</p>
                          <p>Click “Allow camera” to start liveness check.</p>
                        </div>
                      )}
                    </div>
                    <div className="selfie-actions-row">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={requestCamera}
                      >
                        Allow camera
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={captureSelfie}
                        disabled={!streamRef.current}
                      >
                        Capture frame
                      </button>
                    </div>
                    <span className="field-hint">
                      Keep your entire face visible. Perform the prompts within
                      the next few seconds.
                    </span>
                    {cameraError && (
                      <div className="error-banner selfie-error">
                        {cameraError}
                      </div>
                    )}
                  </div>

                  <div className="inner-preview-box selfie-preview-box">
                    {selfieCaptured && selfieImageUrl ? (
                      <>
                        <div className="preview-label">
                          Captured liveness frame
                        </div>
                        <div className="preview-frame selfie-frame">
                          <img
                            src={selfieImageUrl}
                            alt="Selfie preview"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="preview-placeholder">
                        Your captured frame will appear here after you click
                        “Capture frame”.
                      </div>
                    )}
                  </div>
                </div>

                <canvas
                  ref={canvasRef}
                  style={{ display: "none" }}
                />
              </article>
            )}

            {step.id === "risk-checks" && (
              <>
                <article
                  className="step-card"
                  onMouseEnter={() => setHoverContext("sanctions-check")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <div className="card-icon-circle card-icon-blue" />
                  <h3>Sanctions screening</h3>
                  <p>
                    We match your details against global sanctions and
                    watchlists to prevent prohibited usage.
                  </p>
                </article>
                <article
                  className="step-card"
                  onMouseEnter={() => setHoverContext("pep-check")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <div className="card-icon-circle card-icon-amber" />
                  <h3>PEP checks</h3>
                  <p>
                    Politically exposed person checks help us configure the
                    correct monitoring level.
                  </p>
                </article>
                <article
                  className="step-card"
                  onMouseEnter={() => setHoverContext("risk-score")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <div className="card-icon-circle card-icon-green" />
                  <h3>Risk scoring</h3>
                  <p>
                    Our engine uses rules and models to score risk and
                    highlight unusual patterns.
                  </p>
                </article>
              </>
            )}

            {step.id === "completed" && (
              <article
                className="step-card completed-block"
                onMouseEnter={() => setHoverContext("submit-form")}
                onMouseLeave={() => setHoverContext(null)}
              >
                <div className="completed-icon-large" />
                <h3>Ready to submit</h3>
                <p>
                  All required information is in place. Submit your KYC form to
                  trigger final verification.
                </p>
                {error && (
                  <div className="error-banner error">{error}</div>
                )}
                {apiError && (
                  <div className="error-banner error">{apiError}</div>
                )}
              </article>
            )}
          </div>

          <div className="steps-footer-row">
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 0}
            >
              Back
            </button>

            {step.id === "basic-info" && (
              <button
                type="button"
                className="btn-primary"
                onClick={goNext}
                disabled={basicInfoNextDisabled}
              >
                Next
              </button>
            )}

            {step.id !== "basic-info" &&
              step.id !== "document-upload" &&
              step.id !== "completed" &&
              step.id !== "selfie-check" && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={goNext}
                >
                  Next
                </button>
              )}

            {step.id === "selfie-check" && (
              <button
                type="button"
                className="btn-primary"
                onClick={goNext}
                disabled={!selfieCaptured}
              >
                Continue
              </button>
            )}

            {step.id === "document-upload" && (
              <button
                type="button"
                className="btn-primary"
                onClick={goNext}
                disabled={
                  !backendPanResult && !backendAadhaarResult
                }
              >
                Skip to next
              </button>
            )}

            {step.id === "completed" && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleSubmitForm}
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit verification form"}
              </button>
            )}
          </div>

          {(error || cameraError || otpError || apiError) && (
            <div className="error-banner error">
              {error || cameraError || otpError || apiError}
            </div>
          )}
        </section>

        <VerticalProgress
          progress={progress}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
        <FinBot
          step={step}
          stepIndex={currentStep}
          totalSteps={totalSteps}
          hasError={Boolean(error || cameraError || otpError || apiError)}
          lastSuccessStep={lastSuccessStep}
          status={selectedStatus}
          hoverContext={hoverContext}
        />
      </main>
    </div>
  );
}

function VerticalProgress({ progress, currentStep, totalSteps }) {
  return (
    <aside className="vertical-progress-shell">
      <div className="vertical-track">
        <div
          className="vertical-fill"
          style={{ height: `${progress}%` }}
        />
        <div className="vertical-fill-label">{progress}%</div>
      </div>
      <div className="vertical-arrow-info">
        <div className="arrow-line" />
        <div className="arrow-head" />
        <div className="arrow-content">
          <div className="arrow-emojis" />
          <div className="arrow-text">
            {progress}% complete
            <span className="arrow-sub">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function FinBot({
  step,
  stepIndex,
  totalSteps,
  hasError,
  lastSuccessStep,
  status,
  hoverContext,
}) {
  const isCompleted = step.id === "completed";
  const isHappy = isCompleted && !hasError && status === "ACCEPTED";
  const isSad =
    hasError ||
    status === "FLAGGED" ||
    status === "REPORTED";
  const isNeutral = !isHappy && !isSad;

  const hoverMessages = {
    "welcome-intro":
      "This is a quick overview of what we will collect. You can always return to this screen.",
    "security-summary":
      "KYC and AML checks help keep your funds and identity protected.",
    "full-name":
      "Enter your full legal name exactly as on your official ID document.",
    dob: "Use the same date of birth that appears on your ID.",
    country:
      "We use your country of residence to apply the correct KYC rules.",
    phone:
      "Use a mobile number you can access right now so you can enter the OTP.",
    "document-type":
      "Choose the document you are about to upload so we can validate it correctly.",
    "document-upload":
      "Upload a clear, uncropped image or PDF. Avoid screenshots or very dark photos.",
    selfie:
      "For liveness, look straight, then close your eyes, then open them again while staying inside the frame.",
    "sanctions-check":
      "Sanctions screening checks your name against global restricted lists.",
    "pep-check":
      "PEP checks help us determine whether enhanced monitoring is required.",
    "risk-score":
      "Risk scores are internal and never shared with third parties.",
    "submit-form":
      "Submitting sends your data securely to our compliance systems for final decisioning.",
  };

  const hoverText = hoverContext ? hoverMessages[hoverContext] : null;
  const positionClass = hoverContext
    ? "bot-pos-near-cards"
    : "bot-pos-near-progress";

  return (
    <div className={`bot-stage ${positionClass}`}>
      <div className="bot-orbit-glow" />
      <div
        className={[
          "bot-body-shell",
          isHappy ? "bot-state-happy" : "",
          isSad ? "bot-state-sad" : "",
          isNeutral ? "bot-state-neutral" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="bot-head-shell">
          <div className="bot-head-top">
            <div className="bot-face-shell">
              <div className="bot-face">
                <div className="bot-eye eye-left" />
                <div className="bot-eye eye-right" />
                <div className="bot-smile" />
              </div>
            </div>
            <div className="bot-antenna-shell">
              <span className="antenna-light" />
            </div>
          </div>
        </div>
        <div className="bot-body-core-shell">
          <div className="bot-body-core-panel">
            <div className="bot-body-meter" />
            <div className="bot-body-grid" />
          </div>
          <div className="bot-arms-shell">
            <div
              className={[
                "bot-arm-shell",
                "left",
                stepIndex === 0 ? "arm-wave" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="bot-hand-glow" />
            </div>
            <div
              className={[
                "bot-arm-shell",
                "right",
                isCompleted && status === "ACCEPTED"
                  ? "arm-thumbsup"
                  : stepIndex === 2
                  ? "arm-point"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="bot-hand-glow" />
            </div>
          </div>
          <div className="bot-feet-shell">
            <div className="bot-foot left" />
            <div className="bot-foot right" />
          </div>
        </div>
      </div>
      <div className="bot-speech">
        <div className="speech-header">
          <span className="speech-title">FinBot</span>
          <span className="speech-tag">Your KYC guide</span>
        </div>
        <p className="speech-main">
          {hasError
            ? "Check your inputs, uploads, camera, or OTP and then try again."
            : hoverText || step.message}
        </p>
        <p className="speech-sub">
          {isCompleted && status
            ? `Current status: ${status.replace(
                "_",
                " "
              )}. You can revisit this page from your profile.`
            : `Progress: step ${stepIndex + 1} of ${totalSteps}. Hover over any card to get more guidance from me.`}
        </p>
      </div>
    </div>
  );
}

export default App;
