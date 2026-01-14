import { useMemo, useState } from "react";
import "./App.css";

// ---------- Roles & RBAC ----------
const ROLES = {
  COMPANY_HEAD: "CompanyHead",
  MANAGER: "Manager",
  PROJECT_MANAGER: "ProjectManager",
  TEAM_LEAD: "TeamLead",
  EMPLOYEE: "Employee",
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

export default App;
