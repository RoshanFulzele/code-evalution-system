// =====================================
// Emergent CES - Main Frontend Logic
// =====================================

// Global state loaded from localStorage
const CES_STATE = {
  users: [],
  currentUser: null,
  submissions: [],
};

// ---------- Storage helpers ----------

function cesLoadState() {
  try {
    const usersRaw = localStorage.getItem(CES_KEYS.USERS);
    const subsRaw = localStorage.getItem(CES_KEYS.SUBMISSIONS);
    const currentUser = localStorage.getItem(CES_KEYS.CURRENT_USER);
    CES_STATE.users = usersRaw ? JSON.parse(usersRaw) : [];
    CES_STATE.submissions = subsRaw ? JSON.parse(subsRaw) : [];
    CES_STATE.currentUser = currentUser || null;
  } catch (e) {
    console.error("Failed to load state", e);
    CES_STATE.users = [];
    CES_STATE.submissions = [];
    CES_STATE.currentUser = null;
  }
}

function cesSaveUsers() {
  localStorage.setItem(CES_KEYS.USERS, JSON.stringify(CES_STATE.users));
}

function cesSaveSubmissions() {
  localStorage.setItem(
    CES_KEYS.SUBMISSIONS,
    JSON.stringify(CES_STATE.submissions)
  );
}

function cesSetCurrentUser(username) {
  CES_STATE.currentUser = username;
  if (username) {
    localStorage.setItem(CES_KEYS.CURRENT_USER, username);
  } else {
    localStorage.removeItem(CES_KEYS.CURRENT_USER);
  }
}

function cesGetCurrentUserObj() {
  if (!CES_STATE.currentUser) return null;
  return CES_STATE.users.find((u) => u.username === CES_STATE.currentUser) || null;
}

// ---------- Auth & Navigation ----------

function cesRequireAuth() {
  const publicPages = ["welcome", "login"];
  const page = document.body.dataset.page;
  if (!publicPages.includes(page) && !CES_STATE.currentUser) {
    // If user is not authenticated on a protected page, send them to Home
    window.location.href = "index.html";
  }
}

function cesInitNavUser() {
  const span = document.getElementById("nav-username");
  const logoutBtn = document.getElementById("logout-btn");
  if (span && CES_STATE.currentUser) {
    span.textContent = CES_STATE.currentUser;
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      cesSetCurrentUser(null);
      window.location.href = "index.html";
    });
  }
}

// ---------- Custom Cursor ----------

function cesInitCursor() {
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!dot || !ring) return;

  window.addEventListener("mousemove", (e) => {
    const { clientX, clientY } = e;
    dot.style.transform = `translate(${clientX}px, ${clientY}px)`;
    ring.style.transform = `translate(${clientX}px, ${clientY}px)`;
  });

  window.addEventListener("mousedown", () => {
    ring.classList.add("active");
  });
  window.addEventListener("mouseup", () => {
    ring.classList.remove("active");
  });

  // Hover state on interactive elements
  const interactiveSelector =
    "a, button, input, select, textarea, .problem-row-clickable";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(interactiveSelector)) {
      ring.classList.add("hover");
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(interactiveSelector)) {
      ring.classList.remove("hover");
    }
  });
}

// ---------- Auth Page ----------

function cesInitAuthPage() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginMsg = document.getElementById("login-message");
  const registerMsg = document.getElementById("register-message");
  const tabs = document.querySelectorAll(".auth-tab");

  // Toggle forms
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const mode = tab.dataset.mode;
      if (mode === "login") {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
      } else {
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        // anchor support (#register)
      }
    });
  });

  // Handle URL hash for register
  if (window.location.hash === "#register") {
    const regTab = document.querySelector('.auth-tab[data-mode="register"]');
    if (regTab) regTab.click();
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!loginMsg) return;
      loginMsg.textContent = "";
      loginMsg.className = "form-message";

      const username = document.getElementById("login-username").value.trim();
      const password = document.getElementById("login-password").value;

      if (!username || !password) {
        loginMsg.textContent = "Please fill username and password.";
        loginMsg.classList.add("error");
        return;
      }

      const user = CES_STATE.users.find((u) => u.username === username);
      if (!user || user.password !== password) {
        loginMsg.textContent = "Invalid credentials. Try again or register.";
        loginMsg.classList.add("error");
        return;
      }

      cesSetCurrentUser(username);
      loginMsg.textContent = "Login successful. Redirecting...";
      loginMsg.classList.add("success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 600);
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!registerMsg) return;
      registerMsg.textContent = "";
      registerMsg.className = "form-message";

      const username = document.getElementById("register-username").value.trim();
      const email = document.getElementById("register-email").value.trim();
      const password = document.getElementById("register-password").value;
      const confirm = document.getElementById("register-confirm").value;

      if (!username || !password || !confirm) {
        registerMsg.textContent = "Username and passwords are required.";
        registerMsg.classList.add("error");
        return;
      }
      if (password.length < 4) {
        registerMsg.textContent = "Use a password with at least 4 characters.";
        registerMsg.classList.add("error");
        return;
      }
      if (password !== confirm) {
        registerMsg.textContent = "Passwords do not match.";
        registerMsg.classList.add("error");
        return;
      }
      if (CES_STATE.users.some((u) => u.username === username)) {
        registerMsg.textContent = "Username already exists.";
        registerMsg.classList.add("error");
        return;
      }

      CES_STATE.users.push({
        username,
        email,
        password,
        createdAt: new Date().toISOString(),
      });
      cesSaveUsers();

      registerMsg.textContent = "Account created. You can log in now.";
      registerMsg.classList.add("success");
      setTimeout(() => {
        const loginTab = document.querySelector(
          '.auth-tab[data-mode="login"]'
        );
        if (loginTab) loginTab.click();
      }, 700);
    });
  }
}

// ---------- Dashboard ----------

function cesInitDashboard() {
  const user = cesGetCurrentUserObj();
  if (!user) return;

  const forUser = CES_STATE.submissions.filter(
    (s) => s.username === CES_STATE.currentUser
  );
  const solvedSet = new Set(
    forUser.filter((s) => s.status === "success").map((s) => s.problemId)
  );

  const problemsSolvedEl = document.getElementById("stat-problems-solved");
  const submissionsEl = document.getElementById("stat-submissions");
  const avgScoreEl = document.getElementById("stat-average-score");
  const lastSubEl = document.getElementById("stat-last-submission");

  if (problemsSolvedEl) problemsSolvedEl.textContent = solvedSet.size.toString();
  if (submissionsEl) submissionsEl.textContent = forUser.length.toString();

  let avg = 0;
  if (forUser.length) {
    avg =
      forUser.reduce((acc, s) => acc + (s.score || 0), 0) / forUser.length;
  }
  if (avgScoreEl) avgScoreEl.textContent = avg.toFixed(1);

  if (lastSubEl) {
    if (!forUser.length) lastSubEl.textContent = "No submissions yet";
    else {
      const last = [...forUser].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )[0];
      const problem = CES_PROBLEMS.find((p) => p.id === last.problemId);
      lastSubEl.textContent = problem
        ? `${problem.title} (${last.status})`
        : last.status;
    }
  }

  const tbody = document.querySelector("#dashboard-activity tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const latest = [...forUser]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8);
  for (const s of latest) {
    const tr = document.createElement("tr");
    const problem = CES_PROBLEMS.find((p) => p.id === s.problemId);
    tr.innerHTML = `
      <td>${new Date(s.timestamp).toLocaleString()}</td>
      <td>${problem ? problem.title : "Unknown"}</td>
      <td>${cesStatusBadgeHTML(s.status)}</td>
      <td>${s.score}</td>
    `;
    tbody.appendChild(tr);
  }
}

function cesStatusBadgeHTML(status) {
  let cls = "badge-pending";
  if (status === "success") cls = "badge-success";
  else if (status === "failed") cls = "badge-failed";
  else if (status === "partial") cls = "badge-partial";
  return `<span class="badge ${cls}">${status}</span>`;
}

// ---------- Problems List ----------

function cesInitProblems() {
  const searchInput = document.getElementById("problem-search");
  const diffSelect = document.getElementById("problem-difficulty");
  const tbody = document.querySelector("#problems-table tbody");
  if (!tbody || !searchInput || !diffSelect) return;

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const diff = diffSelect.value;
    const userSubs = CES_STATE.submissions.filter(
      (s) => s.username === CES_STATE.currentUser
    );
    const solvedIds = new Set(
      userSubs.filter((s) => s.status === "success").map((s) => s.problemId)
    );

    tbody.innerHTML = "";
    CES_PROBLEMS.forEach((p) => {
      if (diff !== "all" && p.difficulty !== diff) return;
      const text =
        `${p.id} ${p.title} ${p.tags ? p.tags.join(" ") : ""}`.toLowerCase();
      if (q && !text.includes(q)) return;

      const tr = document.createElement("tr");
      tr.classList.add("problem-row-clickable");
      tr.addEventListener("click", () => {
        window.location.href = `solve.html?id=${p.id}`;
      });
      const diffBadge =
        p.difficulty === "easy"
          ? "badge-easy"
          : p.difficulty === "medium"
          ? "badge-medium"
          : "badge-hard";
      const solvedBadge = solvedIds.has(p.id)
        ? '<span class="badge badge-solved">Solved</span>'
        : '<span class="badge badge-pending">Pending</span>';
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.title}</td>
        <td><span class="badge ${diffBadge}">${p.difficulty}</span></td>
        <td>${(p.tags || []).join(", ")}</td>
        <td>${solvedBadge}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  searchInput.addEventListener("input", render);
  diffSelect.addEventListener("change", render);
  render();
}

// ---------- Solve Page ----------

function cesGetProblemFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const idStr = params.get("id");
  if (!idStr) return null;
  const idNum = Number(idStr);
  if (!Number.isFinite(idNum)) return null;
  return CES_PROBLEMS.find((p) => p.id === idNum) || null;
}

function cesInitSolve() {
  const problem = cesGetProblemFromQuery();
  const titleEl = document.getElementById("solve-title");
  const metaEl = document.getElementById("solve-meta");
  const descEl = document.getElementById("solve-description");
  const editor = document.getElementById("code-editor");
  const runBtn = document.getElementById("run-code");
  const submitBtn = document.getElementById("submit-code");
  const consoleOut = document.getElementById("console-output");
  const consoleStatus = document.getElementById("console-status");
  const editorStatus = document.getElementById("editor-status");

  if (!problem || !titleEl || !descEl || !editor) {
    if (titleEl) titleEl.textContent = "Problem not found.";
    return;
  }

  titleEl.textContent = `#${problem.id} · ${problem.title}`;
  metaEl.textContent = `${problem.difficulty.toUpperCase()} • ${
    (problem.tags || []).join(", ") || "general"
  }`;
  descEl.textContent = problem.description || "";
  editor.value = problem.starterCode || "";

  function setConsoleStatus(kind, label) {
    consoleStatus.className = "badge";
    if (kind === "idle") consoleStatus.classList.add("badge-idle");
    if (kind === "running") consoleStatus.class.add?.("badge-running");
    if (kind === "success") consoleStatus.classList.add("badge-success");
    if (kind === "failed") consoleStatus.classList.add("badge-failed");
    consoleStatus.textContent = label;
  }

  // Avoid typo with classList in setConsoleStatus
  function setConsoleStatusSafe(kind, label) {
    consoleStatus.className = "badge";
    if (kind === "idle") consoleStatus.classList.add("badge-idle");
    if (kind === "running") consoleStatus.classList.add("badge-running");
    if (kind === "success") consoleStatus.classList.add("badge-success");
    if (kind === "failed") consoleStatus.classList.add("badge-failed");
    consoleStatus.textContent = label;
  }

  setConsoleStatusSafe("idle", "waiting");

  function runSkulpt(code, onDone) {
    consoleOut.textContent = "";
    editorStatus.textContent = "running";
    setConsoleStatusSafe("running", "running");

    function outf(text) {
      consoleOut.textContent += text;
    }
    function builtinRead(x) {
      if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
        throw "File not found: '" + x + "'";
      return Sk.builtinFiles["files"][x];
    }

    Sk.configure({ output: outf, read: builtinRead });
    const promise = Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, code, true));
    promise
      .then(() => {
        editorStatus.textContent = "done";
        setConsoleStatusSafe("success", "ok");
        onDone && onDone(null, consoleOut.textContent || "");
      })
      .catch((err) => {
        editorStatus.textContent = "error";
        setConsoleStatusSafe("failed", "error");
        consoleOut.textContent += "\n" + err.toString();
        onDone && onDone(err, consoleOut.textContent || "");
      });
  }

  if (runBtn) {
    runBtn.addEventListener("click", () => {
      const code = editor.value;
      runSkulpt(code, () => {});
    });
  }

  // Submission & scoring
  const resStatusEl = document.getElementById("result-status");
  const resScoreEl = document.getElementById("result-score");
  const resTestsEl = document.getElementById("result-tests");
  const resTimeEl = document.getElementById("result-time");

  function parseResultSummary(text) {
    // look for a line starting with "__RESULT__"
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith("__RESULT__")) {
        const parts = line.split(/\s+/);
        const fraction = parts[1] || "0/0";
        const [passedStr, totalStr] = fraction.split("/");
        const passed = Number(passedStr) || 0;
        const total = Number(totalStr) || 0;
        return { passed, total };
      }
    }
    return { passed: 0, total: 0 };
  }

  function recordSubmission(status, score, testsSummary) {
    const submission = {
      id: Date.now(),
      username: CES_STATE.currentUser,
      problemId: problem.id,
      status,
      score,
      testsSummary,
      timestamp: new Date().toISOString(),
    };
    CES_STATE.submissions.push(submission);
    cesSaveSubmissions();
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const code = editor.value;
      const fullCode = (code || "") + "\n\n" + (problem.harness || "");
      runSkulpt(fullCode, (err, outputText) => {
        const { passed, total } = parseResultSummary(outputText || "");
        const score = total > 0 ? Math.round((passed / total) * 100) : 0;
        let status = "failed";
        if (total === 0) status = err ? "failed" : "partial";
        else if (passed === total) status = "success";
        else if (passed > 0) status = "partial";

        if (resStatusEl) resStatusEl.textContent = status;
        if (resScoreEl) resScoreEl.textContent = String(score);
        if (resTestsEl)
          resTestsEl.textContent = total
            ? `${passed}/${total}`
            : "no structured tests";
        if (resTimeEl)
          resTimeEl.textContent = new Date().toLocaleTimeString();

        recordSubmission(status, score, `${passed}/${total}`);
      });
    });
  }
}

// ---------- Dataset Page ----------

function cesInitDataset() {
  const statsContainer = document.getElementById("dataset-stats");
  const tbody = document.querySelector("#dataset-table tbody");
  if (!statsContainer || !tbody) return;

  const forUser = CES_STATE.submissions.filter(
    (s) => s.username === CES_STATE.currentUser
  );
  const byProblem = new Map();
  for (const s of forUser) {
    if (!byProblem.has(s.problemId)) byProblem.set(s.problemId, []);
    byProblem.get(s.problemId).push(s);
  }

  const problemsSolved = new Set(
    forUser.filter((s) => s.status === "success").map((s) => s.problemId)
  ).size;
  const totalSubs = forUser.length;
  const avgScore =
    totalSubs === 0
      ? 0
      : forUser.reduce((a, s) => a + (s.score || 0), 0) / totalSubs;

  statsContainer.innerHTML = `
    <div class="stat-card">
      <span class="stat-label">Problems Solved</span>
      <span class="stat-value">${problemsSolved}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Total Submissions</span>
      <span class="stat-value">${totalSubs}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Average Score</span>
      <span class="stat-value">${avgScore.toFixed(1)}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Problems Attempted</span>
      <span class="stat-value">${byProblem.size}</span>
    </div>
  `;

  tbody.innerHTML = "";
  byProblem.forEach((subs, problemId) => {
    const attempts = subs.length;
    const best = Math.max(...subs.map((s) => s.score || 0));
    const avg =
      subs.reduce((a, s) => a + (s.score || 0), 0) / (attempts || 1);
    let status = "pending";
    if (subs.some((s) => s.status === "success")) status = "success";
    else if (subs.some((s) => s.status === "partial")) status = "partial";
    else if (subs.some((s) => s.status === "failed")) status = "failed";

    const tr = document.createElement("tr");
    const problem = CES_PROBLEMS.find((p) => p.id === problemId);
    tr.innerHTML = `
      <td>${problem ? problem.title : "Unknown"}</td>
      <td>${attempts}</td>
      <td>${best}</td>
      <td>${avg.toFixed(1)}</td>
      <td>${cesStatusBadgeHTML(status)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------- History Page ----------

function cesInitHistory() {
  const tbody = document.querySelector("#history-table tbody");
  const filterSelect = document.getElementById("history-status-filter");
  if (!tbody || !filterSelect) return;

  function render() {
    const filter = filterSelect.value;
    const all = CES_STATE.submissions
      .filter((s) => s.username === CES_STATE.currentUser)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    tbody.innerHTML = "";
    all.forEach((s) => {
      if (filter !== "all" && s.status !== filter) return;
      const tr = document.createElement("tr");
      const problem = CES_PROBLEMS.find((p) => p.id === s.problemId);
      tr.innerHTML = `
        <td>${new Date(s.timestamp).toLocaleString()}</td>
        <td>${problem ? problem.title : "Unknown"}</td>
        <td>${cesStatusBadgeHTML(s.status)}</td>
        <td>${s.score}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  filterSelect.addEventListener("change", render);
  render();
}

// ---------- AI Assistant ----------

function cesInitAssistant() {
  const chat = document.getElementById("assistant-chat");
  const form = document.getElementById("assistant-form");
  const input = document.getElementById("assistant-input");
  if (!chat || !form || !input) return;

  function appendMessage(role, text) {
    const div = document.createElement("div");
    div.classList.add("assistant-message", role);
    const meta = document.createElement("span");
    meta.className = "assistant-meta";
    meta.textContent =
      role === "user" ? CES_STATE.currentUser || "you" : "assistant · local";
    const body = document.createElement("div");
    body.textContent = text;
    div.appendChild(meta);
    div.appendChild(body);
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  function generateResponse(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes("python")) {
      return "Hint: try to break the problem into smaller functions, and print intermediate values to debug. Remember to use consistent indentation in Python.";
    }
    if (lower.includes("error")) {
      return "Check the exact error message and line number. Often, a small typo or missing colon is the cause. Try running a simpler version of your code first.";
    }
    if (lower.includes("help")) {
      return "You can ask about problem understanding, test design, or how to structure a function. I respond with generic, on-device hints only.";
    }
    return "This is a placeholder assistant. In a full system, this panel would stream AI suggestions. For now, treat this like a note pad that replies with generic guidance.";
  }

  appendMessage(
    "ai",
    "Hi! I'm the Emergent CES assistant placeholder. Ask me about Python basics, debugging strategies, or how to approach a problem."
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    appendMessage("user", value);
    input.value = "";

    setTimeout(() => {
      appendMessage("ai", generateResponse(value));
    }, 300);
  });
}

// ---------- Initialization ----------

document.addEventListener("DOMContentLoaded", () => {
  cesLoadState();
  cesInitCursor();
  cesRequireAuth();
  cesInitNavUser();

  const page = document.body.dataset.page;
  if (page === "login") cesInitAuthPage();
  if (page === "dashboard") cesInitDashboard();
  if (page === "problems") cesInitProblems();
  if (page === "solve") cesInitSolve();
  if (page === "dataset") cesInitDataset();
  if (page === "history") cesInitHistory();
  if (page === "assistant") cesInitAssistant();
});

