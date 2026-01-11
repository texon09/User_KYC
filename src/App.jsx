import { useEffect, useRef, useState } from "react";
import "./Bot.css";

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
  const [lastSuccessStep, setLastSuccessStep] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("ACCEPTED");
  const [hoverContext, setHoverContext] = useState(null);
  const [theme, setTheme] = useState("dark");

  const [documentPreview, setDocumentPreview] = useState(null);

  // selfie / liveness state
  const [selfieCaptured, setSelfieCaptured] = useState(false);
  const [selfieImageUrl, setSelfieImageUrl] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // basic info + OTP state
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("India");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [serverOtp, setServerOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");

  const step = KYC_STEPS[currentStep];
  const totalSteps = KYC_STEPS.length;
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  const goNext = () => {
    setError("");
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
      setLastSuccessStep(step.id);
    }
  };

  const goBack = () => {
    setError("");
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmitForm = () => {
    setError("");
    setLastSuccessStep(step.id);
    setIsSubmitted(true);
    stopCameraStream();
  };

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  const handleDocumentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDocumentPreview({ name: file.name, url });
    setError("");
    setLastSuccessStep("document-upload");
  };

  const handleFakeUploadClick = () => {
    const tooBig = Math.random() > 0.5;
    if (tooBig && step.id === "document-upload") {
      setError("Document size is too high. Please upload a file under 5 MB.");
    } else {
      setError("");
      goNext();
    }
  };

  // ------- CAMERA / LIVENESS LOGIC -------
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

  // stop camera when leaving selfie step
  useEffect(() => {
    if (KYC_STEPS[currentStep].id !== "selfie-check") {
      stopCameraStream();
    }
  }, [currentStep]);

  // ---------- OTP helpers ----------
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

  // TEMP: show OTP in toast / inline for testing
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
                    <span className="status-icon-symbol">✓</span>
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
                      ].join(" ")}
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
            </div>

            <div className="steps-footer-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsSubmitted(false)}
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
            step={{ id: "completed", title: "Completed", message: "" }}
            stepIndex={currentStep}
            totalSteps={totalSteps}
            hasError={false}
            lastSuccessStep={"completed"}
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
            Secure KYC & AML verification
          </div>
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
                  <div className="gamified-icon">🎮</div>
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
                  <div className="gamified-icon">🛡️</div>
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
                <div
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
                </div>
                <div
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
                </div>
                <div
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
                </div>

                <div
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
                    <div className="otp-success">Mobile number verified.</div>
                  )}
                  {otpError && (
                    <div className="error-banner otp-error">{otpError}</div>
                  )}
                </div>
              </>
            )}

            {step.id === "document-upload" && (
              <>
                <div
                  className="step-card"
                  onMouseEnter={() => setHoverContext("document-type")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <label>
                    Document type
                    <select>
                      <option>PAN</option>
                      <option>Aadhaar</option>
                      <option>Passport</option>
                    </select>
                  </label>
                </div>

                <div
                  className="step-card upload-block"
                  onMouseEnter={() => setHoverContext("document-upload")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <label>
                    Upload document
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
                          document.getElementById("doc-upload-input")?.click()
                        }
                      >
                        Choose file
                      </button>
                      <button
                        type="button"
                        className="btn-primary upload-continue-btn"
                        onClick={handleFakeUploadClick}
                        disabled={!documentPreview}
                      >
                        Upload & continue
                      </button>
                      <span className="field-hint">
                        Use a clear, uncropped image. Avoid screenshots of your
                        document.
                      </span>
                    </div>
                  </label>

                  <div className="inner-preview-box">
                    {documentPreview ? (
                      <>
                        <div className="preview-label">
                          Preview ({documentPreview.name})
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
                </div>
              </>
            )}

            {step.id === "selfie-check" && (
              <div
                className="step-card selfie-block"
                onMouseEnter={() => setHoverContext("selfie")}
                onMouseLeave={() => setHoverContext(null)}
              >
                <h3>Selfie / liveness capture</h3>
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
                        muted
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
              </div>
            )}

            {step.id === "risk-checks" && (
              <>
                <article
                  className="step-card"
                  onMouseEnter={() => setHoverContext("sanctions-check")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <div className="card-icon-circle card-icon-blue">
                    🔍
                  </div>
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
                  <div className="card-icon-circle card-icon-amber">
                    🏛️
                  </div>
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
                  <div className="card-icon-circle card-icon-green">
                    📈
                  </div>
                  <h3>Risk scoring</h3>
                  <p>
                    Our engine uses rules and models to score risk and highlight
                    unusual patterns.
                  </p>
                </article>
              </>
            )}

            {step.id === "completed" && (
              <div
                className="step-card completed-block"
                onMouseEnter={() => setHoverContext("submit-form")}
                onMouseLeave={() => setHoverContext(null)}
              >
                <div className="completed-icon-large">📨</div>
                <h3>Ready to submit</h3>
                <p>
                  All required information is in place. Submit your KYC form to
                  trigger final verification.
                </p>
              </div>
            )}

            {(error || cameraError) && (
              <div className="error-banner">{error || cameraError}</div>
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

            {step.id === "completed" && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleSubmitForm}
              >
                Submit verification form
              </button>
            )}
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
          hasError={Boolean(error) || Boolean(cameraError) || Boolean(otpError)}
          lastSuccessStep={lastSuccessStep}
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
        >
          <div className="vertical-fill-label">{progress}%</div>
        </div>
      </div>

      <div className="vertical-arrow-info">
        <div className="arrow-line" />
        <div className="arrow-head" />
        <div className="arrow-content">
          <div className="arrow-emojis">💳 ✨ 📊</div>
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
  const isHappy =
    isCompleted ||
    (!hasError && (lastSuccessStep || status === "ACCEPTED"));
  const isSad = hasError || status === "FLAGGED" || status === "REPORTED";
  const isNeutral = !isHappy && !isSad;

  const hoverMessages = {
    "welcome-intro":
      "This is a quick overview of what we will collect. You can always return to this screen.",
    "security-summary":
      "KYC and AML checks help keep your funds and identity protected.",
    "full-name":
      "Enter your full legal name exactly as on your official ID document.",
    dob: "Use the same date of birth that appears on your ID.",
    country: "We use your country of residence to apply the correct KYC rules.",
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
        ].join(" ")}
      >
        <div className="bot-head-shell">
          <div className="bot-head-top" />
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

        <div className="bot-body-core-shell">
          <div className="bot-body-core-panel">
            <div className="bot-body-meter" />
            <div className="bot-body-grid" />
          </div>
          <div className="bot-arms-shell">
            <div
              className={[
                "bot-arm-shell left",
                stepIndex === 0 ? "arm-wave" : "",
              ].join(" ")}
            >
              <span className="bot-hand-glow" />
            </div>
            <div
              className={[
                "bot-arm-shell right",
                isCompleted || status === "ACCEPTED"
                  ? "arm-thumbsup"
                  : stepIndex === 2
                  ? "arm-point"
                  : "",
              ].join(" ")}
            >
              <span className="bot-hand-glow" />
            </div>
          </div>
        </div>

        <div className="bot-feet-shell">
          <div className="bot-foot left" />
          <div className="bot-foot right" />
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
            : hoverText
            ? hoverText
            : step.message}
        </p>
        <p className="speech-sub">
          {isCompleted && status
            ? `Current status: ${status?.replace(
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