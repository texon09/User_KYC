import { useMemo, useState } from "react";
import "./App.css";

<<<<<<< HEAD
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
    hint: "Max size 5 MB. Accepted: PAN, Aadhaar, Driving License.",
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
=======
// ---------- Roles & RBAC ----------
const ROLES = {
  COMPANY_HEAD: "CompanyHead",
  MANAGER: "Manager",
  PROJECT_MANAGER: "ProjectManager",
  TEAM_LEAD: "TeamLead",
  EMPLOYEE: "Employee",
>>>>>>> c2184b1b3ae43e151dbe5a0ecf76ebf758caa04e
};

const rolePermissions = {
  [ROLES.COMPANY_HEAD]: [
    "view_all",
    "manage_users",
    "manage_projects",
    "manage_groups",
    "manage_tasks",
    "view_leaderboard",
  ],
  [ROLES.MANAGER]: [
    "view_dept",
    "manage_projects",
    "manage_groups",
    "manage_tasks",
    "view_leaderboard",
  ],
  [ROLES.PROJECT_MANAGER]: [
    "view_project",
    "manage_groups",
    "manage_tasks",
    "view_leaderboard",
  ],
  [ROLES.TEAM_LEAD]: ["view_group", "manage_group_tasks", "manage_tasks"],
  [ROLES.EMPLOYEE]: ["view_own_groups", "edit_own_tasks"],
};

const can = (user, permission) => {
  const perms = rolePermissions[user.role] || [];
  return perms.includes(permission);
};

// ---------- Demo users with login IDs ----------
const demoUsers = [
  {
    id: "u1",
    loginId: "hd001",
    name: "Aarav (Head)",
    role: ROLES.COMPANY_HEAD,
  },
  {
    id: "u2",
    loginId: "mn101",
    name: "Neha (Manager)",
    role: ROLES.MANAGER,
  },
  {
    id: "u3",
    loginId: "pm205",
    name: "Raj (PM)",
    role: ROLES.PROJECT_MANAGER,
  },
  {
    id: "u4",
    loginId: "tl305",
    name: "Ishita (Lead)",
    role: ROLES.TEAM_LEAD,
  },
  {
    id: "u5",
    loginId: "em502",
    name: "Karan (Dev)",
    role: ROLES.EMPLOYEE,
  },
];

// ---------- Projects, groups, tasks, chat ----------
const initialProjects = [
  { id: "p1", name: "KYC Engine", department: "Compliance", health: 82 },
  { id: "p2", name: "Payments 2.0", department: "Payments", health: 64 },
];

const initialGroups = [
  {
    id: "g1",
    projectId: "p1",
    name: "KYC – Core Squad",
    members: ["u3", "u4", "u5"],
  },
  {
    id: "g2",
    projectId: "p1",
    name: "KYC – Rules & Risk",
    members: ["u2", "u3"],
  },
  {
    id: "g3",
    projectId: "p2",
    name: "Payments – API Team",
    members: ["u2", "u4", "u5"],
  },
];

const initialTasks = [
  {
    id: "t1",
    groupId: "g1",
    title: "Add PAN OCR integration",
    assigneeId: "u5",
    status: "in_progress",
    dueDate: "2026-01-15",
    completedAt: null,
    bonusEligible: true,
  },
  {
    id: "t2",
    groupId: "g1",
    title: "Design risk scoring UI",
    assigneeId: "u4",
    status: "in_progress",
    dueDate: "2026-01-18",
    completedAt: null,
    bonusEligible: true,
  },
  {
    id: "t3",
    groupId: "g3",
    title: "Create payments API contract",
    assigneeId: "u5",
    status: "done",
    dueDate: "2026-01-08",
    completedAt: "2026-01-06",
    bonusEligible: true,
  },
];

const initialMessages = [
  {
    id: "m1",
    groupId: "g1",
    authorId: "u4",
    text: "Sprint focus: liveness checks + risk UX.",
    timestamp: "09:30",
  },
  {
    id: "m2",
    groupId: "g1",
    authorId: "u5",
    text: "I will finish OCR integration by Wednesday.",
    timestamp: "09:34",
  },
];

const initialFiles = [
  {
    id: "f1",
    groupId: "g1",
    name: "KYC-Checklist-v2.pdf",
    uploadedBy: "u3",
  },
  {
    id: "f2",
    groupId: "g3",
    name: "Payments-API-Spec.md",
    uploadedBy: "u4",
  },
];

const initialPoints = {
  u1: 0,
  u2: 120,
  u3: 190,
  u4: 210,
  u5: 160,
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const isBeforeOrSame = (a, b) =>
  new Date(a).getTime() <= new Date(b).getTime();

// ---------- Root App ----------
function App() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loginIdInput, setLoginIdInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [projects] = useState(initialProjects);
  const [groups, setGroups] = useState(initialGroups);
  const [tasks, setTasks] = useState(initialTasks);
  const [messages, setMessages] = useState(initialMessages);
  const [files, setFiles] = useState(initialFiles);
  const [points, setPoints] = useState(initialPoints);

  const currentUser = useMemo(
    () =>
      demoUsers.find((u) => u.id === currentUserId) ??
      (currentUserId ? null : null),
    [currentUserId]
  );

  const handleLogin = (e) => {
    e.preventDefault();
    const trimmed = loginIdInput.trim().toLowerCase();
    const found = demoUsers.find(
      (u) => u.loginId.toLowerCase() === trimmed
    );
    if (!found) {
      setLoginError("User ID not found. Please check with admin.");
      return;
    }
    setCurrentUserId(found.id);
    setLoginError("");
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setLoginIdInput("");
    setLoginError("");
  };

  const visibleProjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === ROLES.EMPLOYEE) {
      const myProjectIds = new Set(
        groups
          .filter((g) => g.members.includes(currentUser.id))
          .map((g) => g.projectId)
      );
      return projects.filter((p) => myProjectIds.has(p.id));
    }
    if (currentUser.role === ROLES.MANAGER) {
      return projects;
    }
    if (currentUser.role === ROLES.COMPANY_HEAD) {
      return projects;
    }
    const myProjectIds = new Set(
      groups
        .filter((g) => g.members.includes(currentUser.id))
        .map((g) => g.projectId)
    );
    return projects.filter((p) => myProjectIds.has(p.id));
  }, [currentUser, groups, projects]);

  const [activeProjectId, setActiveProjectId] = useState("p1");
  const [activeGroupId, setActiveGroupId] = useState("g1");

  const activeProject =
    visibleProjects.find((p) => p.id === activeProjectId) ||
    visibleProjects[0];

  const visibleGroupsForProject = useMemo(() => {
    if (!currentUser || !activeProject) return [];
    const projId = activeProject.id;
    const all = groups.filter((g) => g.projectId === projId);
    if (
      currentUser.role === ROLES.EMPLOYEE ||
      currentUser.role === ROLES.TEAM_LEAD
    ) {
      return all.filter((g) => g.members.includes(currentUser.id));
    }
    return all;
  }, [groups, activeProject, currentUser]);

  const activeGroup =
    visibleGroupsForProject.find((g) => g.id === activeGroupId) ||
    visibleGroupsForProject[0];

  const awardPoints = (userId, amount) => {
    setPoints((prev) => ({
      ...prev,
      [userId]: (prev[userId] || 0) + amount,
    }));
  };

  const handleSendMessage = (groupId, text) => {
    if (!currentUser || !text.trim()) return;
    const msg = {
      id: `m${messages.length + 1}`,
      groupId,
      authorId: currentUser.id,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, msg]);
    awardPoints(currentUser.id, 5);
  };

  const handleUploadFile = (groupId, fileName) => {
    if (!currentUser || !fileName.trim()) return;
    const f = {
      id: `f${files.length + 1}`,
      groupId,
      name: fileName.trim(),
      uploadedBy: currentUser.id,
    };
    setFiles((prev) => [...prev, f]);
    awardPoints(currentUser.id, 10);
  };

  const handleCreateGroup = (projectId, name) => {
    if (!currentUser || !name.trim()) return;
    const g = {
      id: `g${groups.length + 1}`,
      projectId,
      name: name.trim(),
      members: [currentUser.id],
    };
    setGroups((prev) => [...prev, g]);
    setActiveGroupId(g.id);
  };

  const handleToggleTaskStatus = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        let status = t.status;
        if (status === "todo") status = "in_progress";
        else if (status === "in_progress") status = "done";

        let completedAt = t.completedAt;
        if (status === "done" && !completedAt) completedAt = todayIso();

        if (
          status === "done" &&
          t.bonusEligible &&
          completedAt &&
          isBeforeOrSame(completedAt, t.dueDate)
        ) {
          awardPoints(t.assigneeId, 25);
        }
        return { ...t, status, completedAt };
      })
    );
  };

  const handleAssignToMe = (taskId) => {
    if (!currentUser) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, assigneeId: currentUser.id } : t
      )
    );
  };

  const handleCreateTask = (groupId, title, dueDate) => {
    if (!currentUser || !title.trim() || !dueDate) return;
    const t = {
      id: `t${tasks.length + 1}`,
      groupId,
      title: title.trim(),
      assigneeId: currentUser.id,
      status: "todo",
      dueDate,
      completedAt: null,
      bonusEligible: true,
    };
    setTasks((prev) => [...prev, t]);
  };

  const myTasks = currentUser
    ? tasks.filter((t) => t.assigneeId === currentUser.id)
    : [];
  const myBonusEligible = myTasks.filter((t) => t.bonusEligible);
  const myCompletedBeforeDue = myBonusEligible.filter(
    (t) =>
      t.status === "done" &&
      t.completedAt &&
      isBeforeOrSame(t.completedAt, t.dueDate)
  );
  const bonusProgress =
    myBonusEligible.length === 0
      ? 0
      : Math.round(
          (myCompletedBeforeDue.length / myBonusEligible.length) * 100
        );

  // ---------- Login screen ----------
  if (!currentUser) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <h1>DeltaCollab Control Room</h1>
          <p className="login-sub">
            Enter your company ID to open your role‑based workspace.
          </p>
          <form onSubmit={handleLogin} className="login-form">
            <label>
              Employee / Role ID
              <input
                value={loginIdInput}
                onChange={(e) => setLoginIdInput(e.target.value)}
                placeholder="hd001 / mn101 / pm205 / tl305 / em502"
              />
            </label>
            {loginError && (
              <div className="login-error">{loginError}</div>
            )}
            <button type="submit" className="btn-primary">
              Sign in
            </button>
          </form>
          <div className="login-hint">
            Demo IDs:
            <span>hd001, mn101, pm205, tl305, em502</span>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Main dashboard ----------
  return (
    <div className="app-shell">
      <Header
        currentUser={currentUser}
        onUserChange={setCurrentUserId}
        onLogout={handleLogout}
      />

<<<<<<< HEAD
      <header className="kyc-topbar">
        <div className="topbar-left">
          <div className="brand-mark">AstuComply</div>
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
            <p className="step-chip">KYC verification flow</p>
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
                  <h3> Getting started</h3>
                  <p>
                    You are beginning your KYC journey. Complete each step to
                    sucessfully verify your account.
                    You may proceed further.
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
                    An OTP will be sent to this number.
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
                      <option>Driving Liscence </option>
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
                      Keep your entire face visible. Make sure you look directly into     the                   camera for the next few seconds.
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
=======
      <div className="app-layout">
        <Sidebar
          user={currentUser}
          projects={visibleProjects}
          activeProject={activeProject}
          groups={visibleGroupsForProject}
          activeGroup={activeGroup}
          onProjectSelect={setActiveProjectId}
          onGroupSelect={setActiveGroupId}
          onCreateGroup={handleCreateGroup}
        />

        <main className="main-area">
          <TopStrip user={currentUser} project={activeProject} />

          {activeGroup ? (
            <CenterColumn
              user={currentUser}
              project={activeProject}
              group={activeGroup}
              allUsers={demoUsers}
              messages={messages.filter(
                (m) => m.groupId === activeGroup.id
>>>>>>> c2184b1b3ae43e151dbe5a0ecf76ebf758caa04e
              )}
              files={files.filter((f) => f.groupId === activeGroup.id)}
              tasks={tasks.filter((t) => t.groupId === activeGroup.id)}
              onSendMessage={handleSendMessage}
              onUploadFile={handleUploadFile}
              onToggleTaskStatus={handleToggleTaskStatus}
              onAssignToMe={handleAssignToMe}
              onCreateTask={handleCreateTask}
            />
          ) : (
            <div className="empty-state">
              <h2>Select or create a squad</h2>
              <p>Managers and leads can spin up focused squads per project.</p>
            </div>
          )}
        </main>

        <RightColumn
          user={currentUser}
          points={points}
          users={demoUsers}
          bonusProgress={bonusProgress}
          myTasks={myBonusEligible}
          myCompletedBeforeDue={myCompletedBeforeDue}
        />
      </div>
    </div>
  );
}

// ---------- Layout components ----------
function Header({ currentUser, onUserChange, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand-avatar">Δ</div>
        <div>
          <div className="brand-name">DeltaCollab</div>
          <div className="brand-sub">
            Professional workspace for managers & teams
          </div>
        </div>
      </div>
      <div className="topbar-right">
        <select
          className="role-switch"
          value={currentUser.id}
          onChange={(e) => onUserChange(e.target.value)}
        >
          {demoUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — {u.role}
            </option>
          ))}
        </select>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

function Sidebar({
  user,
  projects,
  activeProject,
  groups,
  activeGroup,
  onProjectSelect,
  onGroupSelect,
  onCreateGroup,
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const canCreateGroup =
    can(user, "manage_groups") || can(user, "manage_group_tasks");

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="section-title">Projects</div>
        <ul className="list">
          {projects.map((p) => (
            <li
              key={p.id}
              className={
                activeProject?.id === p.id ? "list-item active" : "list-item"
              }
              onClick={() => onProjectSelect(p.id)}
            >
              <span>{p.name}</span>
              <span className="pill">{p.health}%</span>
            </li>
          ))}
          {projects.length === 0 && (
            <li className="list-item muted">No projects visible</li>
          )}
        </ul>
      </div>

      <div className="sidebar-section">
        <div className="section-title">
          Squads
          {canCreateGroup && activeProject && (
            <span className="mini-pill">+ Create</span>
          )}
        </div>
        <ul className="list">
          {groups.map((g) => (
            <li
              key={g.id}
              className={
                activeGroup?.id === g.id ? "list-item active" : "list-item"
              }
              onClick={() => onGroupSelect(g.id)}
            >
              <span>{g.name}</span>
              <span className="chip">{g.members.length}</span>
            </li>
          ))}
          {groups.length === 0 && (
            <li className="list-item muted">No squads yet</li>
          )}
        </ul>

        {canCreateGroup && activeProject && (
          <div className="create-group-box">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New squad name"
            />
            <button
              onClick={() => {
                onCreateGroup(activeProject.id, newGroupName);
                setNewGroupName("");
              }}
            >
              Create
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function TopStrip({ user, project }) {
  return (
    <div className="top-strip">
      <div>
        <div className="crumbs">
          {project ? project.department : "No department"} •{" "}
          {project ? project.name : "No project"}
        </div>
        <h1 className="page-title">Team collaboration space</h1>
      </div>
      <div className="user-chip">
        <span className="user-role">{user.role}</span>
        <span className="user-name">{user.name}</span>
      </div>
    </div>
  );
}

// ---------- Center column ----------
function CenterColumn(props) {
  return (
    <div className="center-grid">
      <CollaborationRow {...props} />
      <CaseSummaryRow {...props} />
    </div>
  );
}

function CollaborationRow({
  user,
  project,
  group,
  allUsers,
  messages,
  files,
  tasks,
  onSendMessage,
  onUploadFile,
  onToggleTaskStatus,
  onAssignToMe,
  onCreateTask,
}) {
  const [draft, setDraft] = useState("");
  const [fileName, setFileName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(todayIso());

  const canManageTasks =
    can(user, "manage_tasks") || can(user, "edit_own_tasks");

  const statusLabel = (s) =>
    s === "todo" ? "To do" : s === "in_progress" ? "In progress" : "Done";

  return (
    <>
      <section className="panel">
        <header className="panel-header">
          <h2>Squad tasks</h2>
          <p className="panel-sub">
            Track deliverables per project. Finish before due date to unlock
            bonus points.
          </p>
        </header>
        <div className="panel-body">
          <div className="task-header-row">
            <div className="small-text">
              Project: {project?.name} • Squad: {group.name}
            </div>
            {canManageTasks && (
              <div className="task-create">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="New task title"
                />
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
                <button
                  onClick={() => {
                    onCreateTask(group.id, taskTitle, taskDueDate);
                    setTaskTitle("");
                  }}
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div className="task-list">
            {tasks.map((t) => {
              const assignee = allUsers.find((u) => u.id === t.assigneeId);
              const dueSoon =
                t.status !== "done" &&
                isBeforeOrSame(t.dueDate, todayIso());
              const doneBeforeDue =
                t.status === "done" &&
                t.completedAt &&
                isBeforeOrSame(t.completedAt, t.dueDate);

              return (
                <div
                  key={t.id}
                  className={`task-card ${
                    t.status === "done"
                      ? "task-done"
                      : t.status === "in_progress"
                      ? "task-progress"
                      : "task-todo"
                  }`}
                  onClick={() =>
                    canManageTasks && onToggleTaskStatus(t.id)
                  }
                >
                  <div className="task-title-row">
                    <span>{t.title}</span>
                    <span className="task-status-pill">
                      {statusLabel(t.status)}
                    </span>
                  </div>
                  <div className="task-meta-row">
                    <span className="small-text">
                      Due {t.dueDate}
                      {dueSoon && t.status !== "done" && " • ⏰"}
                      {doneBeforeDue && " • ⭐ Bonus"}
                    </span>
                    <span className="small-text">
                      {assignee ? `Owner: ${assignee.name}` : "Unassigned"}
                    </span>
                  </div>
                  {!assignee && (
                    <button
                      className="assign-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignToMe(t.id);
                      }}
                    >
                      Assign to me
                    </button>
                  )}
                </div>
              );
            })}
            {tasks.length === 0 && (
              <div className="empty-card">
                No tasks yet. Create the first item for this squad.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Squad chat</h3>
          <p className="panel-sub">
            Discuss blockers, decisions, and updates. Files stay attached to
            this project space.
          </p>
        </header>
        <div className="panel-body chat-body">
          {messages.map((m) => {
            const author = allUsers.find((u) => u.id === m.authorId);
            const isOwn = m.authorId === user.id;
            return (
              <div
                key={m.id}
                className={isOwn ? "chat-message own" : "chat-message"}
              >
                <div className="chat-meta">
                  <span>{author?.name}</span>
                  <span>{m.timestamp}</span>
                </div>
                <div className="chat-text">{m.text}</div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="empty-chat">No messages yet.</div>
          )}
        </div>
        <footer className="chat-input-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type to collaborate with your team…"
          />
          <button
            onClick={() => {
              onSendMessage(group.id, draft);
              setDraft("");
            }}
          >
            Send
          </button>
        </footer>

        <div className="files-block">
          <div className="files-header">
            <span>Shared files</span>
            <span className="badge">{files.length}</span>
          </div>
          <ul className="file-list">
            {files.map((f) => {
              const uploader = allUsers.find(
                (u) => u.id === f.uploadedBy
              );
              return (
                <li key={f.id} className="file-item">
                  <span className="file-name">📄 {f.name}</span>
                  <span className="file-meta">
                    by {uploader ? uploader.name : "Unknown"}
                  </span>
                </li>
              );
            })}
            {files.length === 0 && (
              <li className="file-item muted">No files yet</li>
            )}
          </ul>
          <div className="upload-row">
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Link or file name"
            />
            <button
              onClick={() => {
                onUploadFile(group.id, fileName);
                setFileName("");
              }}
            >
              Upload
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function CaseSummaryRow({ project, group, allUsers, tasks }) {
  const groupMembers = group.members
    .map((id) => allUsers.find((u) => u.id === id))
    .filter(Boolean);

  const totalTasks = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter(
    (t) => t.status === "in_progress"
  ).length;
  const todo = tasks.filter((t) => t.status === "todo").length;

  return (
    <>
      <section className="panel">
        <header className="panel-header">
          <h3>Project summary</h3>
          <p className="panel-sub">
            Snapshot of this squad’s current workload and completion pace.
          </p>
        </header>
        <div className="panel-body">
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-label">Project</div>
              <div className="summary-value">{project?.name}</div>
              <div className="summary-meta">
                {project?.department || "—"}
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Squad</div>
              <div className="summary-value">{group.name}</div>
              <div className="summary-meta">
                {groupMembers.length} active members
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Tasks</div>
              <div className="summary-value">{totalTasks}</div>
              <div className="summary-meta">
                {done} done • {inProgress} in progress • {todo} todo
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Squad roster</h3>
          <p className="panel-sub">
            Roles and visibility for everyone assigned to this group.
          </p>
        </header>
        <div className="panel-body">
          <ul className="member-list">
            {groupMembers.map((m) => (
              <li key={m.id} className="member-item">
                <span className="avatar-dot" />
                <span>{m.name}</span>
                <span className="member-role">{m.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

// ---------- Right column ----------
function RightColumn({
  user,
  points,
  users,
  bonusProgress,
  myTasks,
  myCompletedBeforeDue,
}) {
  const leaderboard = [...users]
    .map((u) => ({ ...u, score: points[u.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const myScore = points[user.id] || 0;
  const level = Math.floor(myScore / 100) + 1;
  const nextLevelAt = level * 100;
  const levelBase = (level - 1) * 100;
  const levelProgress = Math.min(
    100,
    Math.round(
      ((myScore - levelBase) / (nextLevelAt - levelBase || 1)) * 100
    )
  );

  const completedCount = myCompletedBeforeDue.length;
  const taskCount = myTasks.length;

  const avgTeamXp =
    leaderboard.reduce((sum, u) => sum + u.score, 0) /
    (leaderboard.length || 1);

  return (
    <aside className="gamify">
      <div className="gamify-card">
        <h3>Bonus progress</h3>
        <p className="gamify-sub">
          Complete bonus‑eligible tasks before due date to earn extra points.
        </p>
        <div className="xp-bar">
          <div
            className="xp-fill"
            style={{ width: `${bonusProgress}%` }}
          />
        </div>
        <div className="xp-next">
          {completedCount}/{taskCount} tasks on time • {bonusProgress}%
        </div>
      </div>

      <div className="gamify-card">
        <h3>XP & level</h3>
        <p className="gamify-sub">
          XP accumulates when you close tasks, share files, and collaborate.
        </p>
        <div className="xp-row">
          <div className="xp-label">
            Level {level} • {myScore} XP
          </div>
          <div className="xp-bar">
            <div
              className="xp-fill"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="xp-next">
            {nextLevelAt - myScore} XP to reach Level {level + 1}
          </div>
        </div>
      </div>

      <div className="gamify-card">
        <h3>Leaderboard</h3>
        <ul className="leader-list">
          {leaderboard.map((u, i) => (
            <li
              key={u.id}
              className={
                u.id === user.id ? "leader-item me" : "leader-item"
              }
            >
              <span className="leader-rank">#{i + 1}</span>
              <span className="leader-name">{u.name}</span>
              <span className="leader-score">{u.score} XP</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="gamify-card">
        <h3>Team metrics</h3>
        <p className="gamify-sub">
          Quick pulse of how the workspace is performing overall.
        </p>
        <div className="xp-row">
          <div className="xp-label">
            Avg XP per member: {Math.round(avgTeamXp)}
          </div>
          <div className="xp-next">
            Top performer: {leaderboard[0]?.name} with{" "}
            {leaderboard[0]?.score} XP
          </div>
        </div>
      </div>
    </aside>
  );
}

<<<<<<< HEAD
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
          <span className="speech-title">AstuComply</span>
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
=======
export default App;
>>>>>>> c2184b1b3ae43e151dbe5a0ecf76ebf758caa04e
