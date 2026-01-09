import { useState } from "react";
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
    message: "Provide your legal identity details exactly as on your ID.",
    hint: "Required: Legal name, date of birth, country of residence.",
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
      "Take a selfie so we can confirm the document belongs to you.",
    hint: "Face should be well lit and clearly visible.",
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
  { id: "ACCEPTED", label: "Accepted", accent: "status-accepted" },
  {
    id: "UNDER_OBSERVATION",
    label: "Under observation",
    accent: "status-observation",
  },
  { id: "MANUAL_REVIEW", label: "Manual review", accent: "status-review" },
  { id: "FLAGGED", label: "Flagged", accent: "status-flagged" },
  { id: "REPORTED", label: "Reported", accent: "status-reported" },
];

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [lastSuccessStep, setLastSuccessStep] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("ACCEPTED");
  const [hoverContext, setHoverContext] = useState(null);
  const [theme, setTheme] = useState("dark");

  // new: preview states
  const [documentPreview, setDocumentPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

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
  };

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  // new: real file handling with previews (mocked upload)
  const handleDocumentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDocumentPreview({ name: file.name, url });
    setError("");
    setLastSuccessStep("document-upload");
  };

  const handleSelfieChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelfiePreview({ name: file.name, url });
    setError("");
    setLastSuccessStep("selfie-check");
  };

  const handleFakeUploadClick = () => {
    // keep earlier random error behaviour but now on preview state
    const tooBig = Math.random() > 0.5;
    if (tooBig && step.id === "document-upload") {
      setError("Document size is too high. Please upload a file under 5 MB.");
    } else {
      setError("");
      goNext();
    }
  };

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
        {/* center steps column */}
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
                    Each completed step boosts your security score and keeps
                    your funds safer.
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
                    <input placeholder="As per PAN / Aadhaar" />
                  </label>
                </div>
                <div
                  className="step-card"
                  onMouseEnter={() => setHoverContext("dob")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <label>
                    Date of birth
                    <input type="date" />
                  </label>
                </div>
                <div
                  className="step-card"
                  onMouseEnter={() => setHoverContext("country")}
                  onMouseLeave={() => setHoverContext(null)}
                >
                  <label>
                    Country of residence
                    <input placeholder="India" />
                  </label>
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

                  {/* inner preview box */}
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
                <h3>Selfie capture</h3>
                <p>
                  Allow camera access and look straight at the screen. Keep your
                  face centered inside the frame.
                </p>

                <div className="selfie-layout">
                  <div className="selfie-upload">
                    <input
                      id="selfie-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleSelfieChange}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() =>
                        document
                          .getElementById("selfie-upload-input")
                          ?.click()
                      }
                    >
                      Upload selfie
                    </button>
                    <span className="field-hint">
                      Use a live selfie, not a photo of a screen.
                    </span>
                  </div>

                  <div className="inner-preview-box selfie-preview-box">
                    {selfiePreview ? (
                      <>
                        <div className="preview-label">
                          Selfie preview ({selfiePreview.name})
                        </div>
                        <div className="preview-frame selfie-frame">
                          <img
                            src={selfiePreview.url}
                            alt="Selfie preview"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="preview-placeholder">
                        Your selfie preview will appear here.
                      </div>
                    )}
                  </div>
                </div>
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

            {error && <div className="error-banner">{error}</div>}
          </div>

          <div className="steps-footer-row">
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 0}
            >
              Back
            </button>

            {step.id !== "document-upload" &&
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
                disabled={!selfiePreview}
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
          hasError={Boolean(error)}
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
        />
      </div>

      {/* fintech arrow + emojis + percentage */}
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
    "document-type":
      "Choose the document you are about to upload so we can validate it correctly.",
    "document-upload":
      "Upload a clear, uncropped image or PDF. Avoid screenshots or very dark photos.",
    selfie:
      "Keep your device steady and look straight. We only use this selfie for verification.",
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
            ? "Oops, that did not go through. Try a smaller file and I’ll process it right away."
            : hoverText
            ? hoverText
            : step.message}
        </p>
        <p className="speech-sub">
          {isCompleted && status
            ? `Current status: ${status.replace("_", " ")}. You can revisit this page from your profile.`
            : `Progress: step ${stepIndex + 1} of ${totalSteps}. Hover over any card to get more guidance from me.`}
        </p>
      </div>
    </div>
  );
}

export default App;
