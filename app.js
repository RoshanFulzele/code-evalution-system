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

  // Maintain conversation history
  let conversationHistory = [];

  function appendMessage(role, text) {
    const div = document.createElement("div");
    div.classList.add("assistant-message", role);
    const meta = document.createElement("span");
    meta.className = "assistant-meta";
    meta.textContent =
      role === "user" ? CES_STATE.currentUser || "you" : "AI Assistant";
    const body = document.createElement("div");
    body.textContent = text;
    div.appendChild(meta);
    div.appendChild(body);
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  async function generateResponse(prompt) {
    // Add user message to history
    conversationHistory.push({ role: 'user', content: prompt });

    try {
      // Try OpenAI API first if key is available
      const apiKey = localStorage.getItem('openai_api_key');
      
      if (apiKey) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'system',
                  content: 'You are a helpful, knowledgeable, and intelligent AI assistant. You can answer questions about ANY topic - programming, science, history, geography, mathematics, general knowledge, current events, and more. Provide accurate, detailed, and helpful responses. Be thorough but clear.'
                },
                ...conversationHistory.slice(-10) // Keep last 10 messages for context
              ],
              max_tokens: 1500,
              temperature: 0.7
            })
          });

          if (response.ok) {
            const data = await response.json();
            const aiResponse = data.choices[0].message.content.trim();
            conversationHistory.push({ role: 'assistant', content: aiResponse });
            return aiResponse;
          }
        } catch (e) {
          console.log('OpenAI API failed, trying alternatives...');
        }
      }

      // Try free AI services
      const freeApis = [
        async () => {
          // Try Groq API (free tier available)
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer gsk_demo_key_replace_with_real'
            },
            body: JSON.stringify({
              model: 'llama-3.1-8b-instant',
              messages: [
                { role: 'system', content: 'You are a helpful AI assistant that can answer questions about any topic.' },
                ...conversationHistory.slice(-5)
              ],
              max_tokens: 800
            })
          });
          if (response.ok) {
            const data = await response.json();
            const aiResponse = data.choices[0].message.content.trim();
            conversationHistory.push({ role: 'assistant', content: aiResponse });
            return aiResponse;
          }
          throw new Error('Groq API failed');
        },
        async () => {
          // Try Together AI (free tier)
          const response = await fetch('https://api.together.xyz/inference', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer demo_key_replace'
            },
            body: JSON.stringify({
              model: 'meta-llama/Llama-3-8B-Instruct-Turbo',
              prompt: conversationHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') + '\nAssistant:',
              max_tokens: 800,
              temperature: 0.7
            })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.output && data.output.choices) {
              const aiResponse = data.output.choices[0].text.trim();
              conversationHistory.push({ role: 'assistant', content: aiResponse });
              return aiResponse;
            }
          }
          throw new Error('Together AI failed');
        }
      ];

      // Try free APIs
      for (const apiCall of freeApis) {
        try {
          const result = await apiCall();
          if (result) return result;
        } catch (e) {
          continue;
        }
      }

      // Ultimate fallback: Smart local AI response
      return await generateSmartLocalResponse(prompt);
      
    } catch (error) {
      console.error('AI error:', error);
      return await generateSmartLocalResponse(prompt);
    }
  }

  async function generateSmartLocalResponse(prompt) {
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/);
    
    // Comprehensive knowledge base for ANY question
    let response = '';
    
    // First, try to match against comprehensive knowledge base
    response = answerAnyQuestion(prompt, lower, words);
    
    // If no specific match, use intelligent general response
    if (!response) {
      response = provideIntelligentGeneralAnswer(prompt, lower);
    }

    conversationHistory.push({ role: 'assistant', content: response });
    return response;
  }

  function answerAnyQuestion(prompt, lower, words) {
    // Programming questions
    if (lower.match(/\b(python|py|def |import |print|\.py|javascript|js|function|const|let|var|\.js|java|class |public |private |\.java|c\+\+|cpp|#include|\.cpp|code|programming|algorithm|array|list|tree|graph|hash|map|set|stack|queue|linked|function|method|variable|loop|iterate|debug|error|bug)\b/)) {
      return answerProgrammingQuestion(prompt, lower);
    }
    
    // Science questions
    if (lower.match(/\b(science|physics|chemistry|biology|atom|molecule|element|gravity|force|energy|light|sound|wave|electric|magnetic|cell|dna|gene|evolution|planet|star|galaxy|universe|earth|sun|moon|solar|nuclear|reaction|compound|molecule|organic|inorganic)\b/)) {
      return answerScienceQuestion(prompt, lower);
    }
    
    // Math questions
    if (lower.match(/\b(math|mathematics|calculate|equation|formula|algebra|geometry|calculus|derivative|integral|trigonometry|sine|cosine|tangent|angle|triangle|circle|square|rectangle|area|volume|perimeter|fraction|decimal|percentage|probability|statistics|mean|median|mode|number|integer|prime|even|odd|multiply|divide|add|subtract|sum|difference|product|quotient)\b/)) {
      return answerMathQuestion(prompt, lower);
    }
    
    // History questions
    if (lower.match(/\b(history|historical|war|battle|empire|king|queen|emperor|ancient|medieval|renaissance|world war|revolution|independence|civilization|culture|tradition|ancient|past|timeline|era|period|century|decade|year|date|when|who|where|why|how|what happened)\b/)) {
      return answerHistoryQuestion(prompt, lower);
    }
    
    // Geography questions
    if (lower.match(/\b(geography|country|city|capital|continent|ocean|sea|mountain|river|lake|desert|forest|island|peninsula|border|population|language|currency|flag|map|location|north|south|east|west|latitude|longitude|climate|weather|temperature|rain|snow|wind)\b/)) {
      return answerGeographyQuestion(prompt, lower);
    }
    
    // General knowledge
    if (lower.match(/\b(what is|what are|who is|who are|where is|where are|when|why|how|explain|define|meaning|tell me about|describe|information|facts|knowledge|general|common|famous|popular|important|significant|interesting|know|understand|learn)\b/)) {
      return answerGeneralKnowledgeQuestion(prompt, lower);
    }
    
    // Current events / News
    if (lower.match(/\b(news|current|recent|today|now|latest|update|event|happening|trend|popular|famous|celebrity|politics|government|election|president|prime minister|leader|policy|law|bill|act)\b/)) {
      return answerCurrentEventsQuestion(prompt, lower);
    }
    
    // Technology
    if (lower.match(/\b(technology|tech|computer|software|hardware|internet|website|app|application|mobile|phone|smartphone|tablet|laptop|desktop|server|cloud|ai|artificial intelligence|machine learning|data|database|network|wifi|bluetooth|gps|satellite|robot|automation|digital|electronic|device|gadget)\b/)) {
      return answerTechnologyQuestion(prompt, lower);
    }
    
    // Health & Medicine
    if (lower.match(/\b(health|medical|medicine|doctor|hospital|disease|illness|symptom|treatment|medicine|drug|vaccine|virus|bacteria|infection|surgery|operation|patient|diagnosis|therapy|exercise|diet|nutrition|vitamin|protein|carbohydrate|fat|calorie|fitness|wellness)\b/)) {
      return answerHealthQuestion(prompt, lower);
    }
    
    // Literature & Arts
    if (lower.match(/\b(literature|book|novel|poem|poetry|author|writer|story|character|plot|theme|art|painting|drawing|sculpture|artist|music|song|singer|musician|movie|film|actor|actress|director|theater|drama|comedy|tragedy|genre|style)\b/)) {
      return answerArtsQuestion(prompt, lower);
    }
    
    // Sports
    if (lower.match(/\b(sport|football|soccer|basketball|baseball|tennis|golf|swimming|running|olympics|championship|tournament|player|team|coach|game|match|score|win|lose|champion|league|cup|trophy|medal)\b/)) {
      return answerSportsQuestion(prompt, lower);
    }
    
    // Food & Cooking
    if (lower.match(/\b(food|cooking|recipe|ingredient|cuisine|dish|meal|breakfast|lunch|dinner|snack|dessert|baking|grilling|frying|boiling|spice|herb|flavor|taste|restaurant|chef|kitchen|nutrition|calorie|protein|vitamin|mineral)\b/)) {
      return answerFoodQuestion(prompt, lower);
    }
    
    // Business & Economics
    if (lower.match(/\b(business|economy|economic|company|corporation|market|stock|share|investment|trade|commerce|finance|money|currency|dollar|euro|profit|loss|revenue|income|expense|budget|bank|loan|interest|rate|inflation|recession|depression|gdp|employment|job|career|salary|wage)\b/)) {
      return answerBusinessQuestion(prompt, lower);
    }
    
    // Philosophy & Religion
    if (lower.match(/\b(philosophy|philosopher|religion|religious|god|goddess|belief|faith|spiritual|spirituality|bible|quran|hinduism|buddhism|islam|christianity|judaism|ethics|moral|morality|virtue|wisdom|truth|reality|existence|meaning|purpose|life|death|soul|spirit)\b/)) {
      return answerPhilosophyQuestion(prompt, lower);
    }
    
    // Education & Learning
    if (lower.match(/\b(education|school|university|college|student|teacher|professor|learn|learning|study|studying|course|subject|lesson|class|homework|exam|test|grade|degree|diploma|certificate|skill|knowledge|understanding|comprehension|memory|remember|forget)\b/)) {
      return answerEducationQuestion(prompt, lower);
    }
    
    return null; // No specific category matched
  }

  // Comprehensive answer functions for ANY topic
  
  function answerProgrammingQuestion(prompt, lower) {
    // Try to solve the coding problem directly
    const solution = solveCodingProblem(prompt, lower);
    if (solution) return solution;
    
    // Language-specific handling
    if (lower.match(/\b(python|py|def |import |print|\.py)\b/)) {
      if (lower.includes('error') || lower.includes('bug') || lower.includes('wrong') || lower.includes('fix')) {
        return analyzePythonError(prompt);
      } else if (lower.includes('how') || lower.includes('create') || lower.includes('make') || lower.includes('write') || lower.includes('code') || lower.includes('implement')) {
        return providePythonSolution(prompt);
      } else {
        return explainPythonConcept(prompt);
      }
    }
    else if (lower.match(/\b(javascript|js|function|const|let|var|\.js|react|vue|node)\b/)) {
      if (lower.includes('error') || lower.includes('bug') || lower.includes('fix')) {
        return analyzeJSError(prompt);
      } else if (lower.includes('how') || lower.includes('create') || lower.includes('make') || lower.includes('write') || lower.includes('code') || lower.includes('implement')) {
        return provideJSSolution(prompt);
      } else {
        return explainJSConcept(prompt);
      }
    }
    else if (lower.match(/\b(java|class |public |private |\.java)\b/)) {
      return provideJavaHelp(prompt);
    }
    else if (lower.match(/\b(c\+\+|cpp|#include|\.cpp)\b/)) {
      return provideCppHelp(prompt);
    }
    else if (lower.match(/\b(algorithm|algo|complexity|big o|time|space|optimize)\b/)) {
      return solveAlgorithmProblem(prompt, lower);
    }
    else if (lower.match(/\b(array|list|tree|graph|hash|map|set|stack|queue|linked)\b/)) {
      return solveDataStructureProblem(prompt, lower);
    }
    else if (lower.match(/\b(error|bug|not working|broken|fail|exception|crash)\b/)) {
      return provideDebuggingHelp(prompt);
    }
    else {
      return solveCodingProblem(prompt, lower) || `Programming question: ${prompt}\n\nI can help with:\n- Code debugging and error fixing\n- Algorithm design and optimization\n- Data structures and their usage\n- Programming language concepts\n- Best practices and code review\n- Step-by-step implementation guides\n\nFor "${prompt}", please provide more details about:\n1. What programming language are you using?\n2. What specific problem are you facing?\n3. Any error messages or code snippets?\n\nI'll provide a detailed solution!`;
    }
  }

  function solveCodingProblem(prompt, lower) {
    // Common coding problems and their solutions
    
    // Reverse string/array
    if (lower.includes('reverse') && (lower.includes('string') || lower.includes('array') || lower.includes('list'))) {
      return solveReverseProblem(prompt, lower);
    }
    
    // Find maximum/minimum
    if (lower.includes('max') || lower.includes('min') || lower.includes('maximum') || lower.includes('minimum') || lower.includes('largest') || lower.includes('smallest')) {
      return solveMaxMinProblem(prompt, lower);
    }
    
    // Sum/Add
    if (lower.includes('sum') || lower.includes('add') || lower.includes('total')) {
      return solveSumProblem(prompt, lower);
    }
    
    // Count/Occurrences
    if (lower.includes('count') || lower.includes('occurrence') || lower.includes('frequency') || lower.includes('how many')) {
      return solveCountProblem(prompt, lower);
    }
    
    // Find/Search
    if (lower.includes('find') || lower.includes('search') || lower.includes('contains') || lower.includes('exist')) {
      return solveFindProblem(prompt, lower);
    }
    
    // Sort
    if (lower.includes('sort') || lower.includes('order') || lower.includes('ascending') || lower.includes('descending')) {
      return solveSortProblem(prompt, lower);
    }
    
    // Palindrome
    if (lower.includes('palindrome')) {
      return solvePalindromeProblem(prompt, lower);
    }
    
    // Fibonacci
    if (lower.includes('fibonacci') || lower.includes('fib')) {
      return solveFibonacciProblem(prompt, lower);
    }
    
    // Factorial
    if (lower.includes('factorial') || lower.includes('fact')) {
      return solveFactorialProblem(prompt, lower);
    }
    
    // Prime number
    if (lower.includes('prime')) {
      return solvePrimeProblem(prompt, lower);
    }
    
    // Two sum / Pair sum
    if (lower.includes('two sum') || lower.includes('pair') || (lower.includes('sum') && lower.includes('target'))) {
      return solveTwoSumProblem(prompt, lower);
    }
    
    // Remove duplicates
    if (lower.includes('duplicate') || lower.includes('unique') || lower.includes('remove')) {
      return solveDuplicateProblem(prompt, lower);
    }
    
    // Check if even/odd
    if (lower.includes('even') || lower.includes('odd')) {
      return solveEvenOddProblem(prompt, lower);
    }
    
    // FizzBuzz
    if (lower.includes('fizzbuzz') || lower.includes('fizz buzz')) {
      return solveFizzBuzzProblem(prompt, lower);
    }
    
    // Anagram
    if (lower.includes('anagram')) {
      return solveAnagramProblem(prompt, lower);
    }
    
    // Valid parentheses
    if (lower.includes('parentheses') || lower.includes('bracket') || lower.includes('valid')) {
      return solveParenthesesProblem(prompt, lower);
    }
    
    // Merge/Combine
    if (lower.includes('merge') || lower.includes('combine') || lower.includes('concatenate')) {
      return solveMergeProblem(prompt, lower);
    }
    
    // Filter/Select
    if (lower.includes('filter') || lower.includes('select') || lower.includes('where')) {
      return solveFilterProblem(prompt, lower);
    }
    
    // Map/Transform
    if (lower.includes('map') || lower.includes('transform') || lower.includes('convert')) {
      return solveMapProblem(prompt, lower);
    }
    
    return null; // No specific problem matched
  }

  // ========== CODING PROBLEM SOLVERS ==========
  
  function solveReverseProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Reverse String/Array in Python\n\n# Method 1: Using slicing (most Pythonic)\ndef reverse_string(s):\n    return s[::-1]\n\ndef reverse_array(arr):\n    return arr[::-1]\n\n# Method 2: Using reversed()\ndef reverse_string2(s):\n    return ''.join(reversed(s))\n\n# Method 3: Using loop\ndef reverse_string3(s):\n    result = ''\n    for char in s:\n        result = char + result\n    return result\n\n# Example usage:\nprint(reverse_string("hello"))  # Output: "olleh"\nprint(reverse_array([1, 2, 3, 4]))  # Output: [4, 3, 2, 1]\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else if (lang === 'javascript') {
      return `Solution: Reverse String/Array in JavaScript\n\n// Method 1: Using split, reverse, join (for strings)\nfunction reverseString(str) {\n    return str.split('').reverse().join('');\n}\n\n// Method 2: Using spread operator\nfunction reverseString2(str) {\n    return [...str].reverse().join('');\n}\n\n// For arrays:\nfunction reverseArray(arr) {\n    return arr.reverse(); // Modifies original\n    // Or: return [...arr].reverse(); // Returns new array\n}\n\n// Method 3: Using loop\nfunction reverseString3(str) {\n    let result = '';\n    for (let i = str.length - 1; i >= 0; i--) {\n        result += str[i];\n    }\n    return result;\n}\n\n// Example:\nconsole.log(reverseString("hello")); // "olleh"\nconsole.log(reverseArray([1, 2, 3])); // [3, 2, 1]\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else {
      return `Solution: Reverse String/Array\n\nPython:\ndef reverse_string(s):\n    return s[::-1]\n\nJavaScript:\nfunction reverseString(str) {\n    return str.split('').reverse().join('');\n}\n\nJava:\npublic String reverseString(String s) {\n    return new StringBuilder(s).reverse().toString();\n}\n\nC++:\nstring reverseString(string s) {\n    reverse(s.begin(), s.end());\n    return s;\n}\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    }
  }

  function solveMaxMinProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    const isMax = lower.includes('max') || lower.includes('maximum') || lower.includes('largest');
    const isMin = lower.includes('min') || lower.includes('minimum') || lower.includes('smallest');
    
    if (lang === 'python') {
      return `Solution: Find ${isMax ? 'Maximum' : 'Minimum'} in Python\n\n# Method 1: Using built-in functions\ndef find_max(arr):\n    return max(arr)\n\ndef find_min(arr):\n    return min(arr)\n\n# Method 2: Manual implementation\ndef find_max_manual(arr):\n    if not arr:\n        return None\n    max_val = arr[0]\n    for num in arr:\n        if num > max_val:\n            max_val = num\n    return max_val\n\ndef find_min_manual(arr):\n    if not arr:\n        return None\n    min_val = arr[0]\n    for num in arr:\n        if num < min_val:\n            min_val = num\n    return min_val\n\n# Method 3: Using reduce\nfrom functools import reduce\ndef find_max_reduce(arr):\n    return reduce(lambda a, b: a if a > b else b, arr)\n\n# Example:\narr = [3, 7, 2, 9, 1]\nprint(find_max(arr))  # 9\nprint(find_min(arr))  # 1\n\nTime Complexity: O(n)\nSpace Complexity: O(1)`;
    } else if (lang === 'javascript') {
      return `Solution: Find ${isMax ? 'Maximum' : 'Minimum'} in JavaScript\n\n// Method 1: Using Math.max/Math.min with spread\nfunction findMax(arr) {\n    return Math.max(...arr);\n}\n\nfunction findMin(arr) {\n    return Math.min(...arr);\n}\n\n// Method 2: Manual implementation\nfunction findMaxManual(arr) {\n    if (arr.length === 0) return null;\n    let max = arr[0];\n    for (let i = 1; i < arr.length; i++) {\n        if (arr[i] > max) max = arr[i];\n    }\n    return max;\n}\n\nfunction findMinManual(arr) {\n    if (arr.length === 0) return null;\n    let min = arr[0];\n    for (let i = 1; i < arr.length; i++) {\n        if (arr[i] < min) min = arr[i];\n    }\n    return min;\n}\n\n// Method 3: Using reduce\nfunction findMaxReduce(arr) {\n    return arr.reduce((a, b) => a > b ? a : b);\n}\n\n// Example:\nconst arr = [3, 7, 2, 9, 1];\nconsole.log(findMax(arr)); // 9\nconsole.log(findMin(arr)); // 1\n\nTime Complexity: O(n)\nSpace Complexity: O(1)`;
    } else {
      return `Solution: Find ${isMax ? 'Maximum' : 'Minimum'}\n\nPython:\ndef find_max(arr):\n    return max(arr)\n\nJavaScript:\nfunction findMax(arr) {\n    return Math.max(...arr);\n}\n\nJava:\npublic int findMax(int[] arr) {\n    int max = arr[0];\n    for (int num : arr) {\n        if (num > max) max = num;\n    }\n    return max;\n}\n\nTime Complexity: O(n)\nSpace Complexity: O(1)`;
    }
  }

  function solveSumProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    const numbers = prompt.match(/\d+/g);
    
    if (lang === 'python') {
      return `Solution: Sum of Array/Numbers in Python\n\n# Method 1: Using built-in sum()\ndef sum_array(arr):\n    return sum(arr)\n\n# Method 2: Using loop\ndef sum_array_loop(arr):\n    total = 0\n    for num in arr:\n        total += num\n    return total\n\n# Method 3: Using reduce\nfrom functools import reduce\ndef sum_reduce(arr):\n    return reduce(lambda a, b: a + b, arr)\n\n# Method 4: Sum of first n numbers\ndef sum_natural(n):\n    return n * (n + 1) // 2\n\n# Example:\narr = [1, 2, 3, 4, 5]\nprint(sum_array(arr))  # 15\nprint(sum_natural(5))  # 15\n\nTime Complexity: O(n)\nSpace Complexity: O(1)`;
    } else if (lang === 'javascript') {
      return `Solution: Sum of Array/Numbers in JavaScript\n\n// Method 1: Using reduce\nfunction sumArray(arr) {\n    return arr.reduce((a, b) => a + b, 0);\n}\n\n// Method 2: Using loop\nfunction sumArrayLoop(arr) {\n    let total = 0;\n    for (let num of arr) {\n        total += num;\n    }\n    return total;\n}\n\n// Method 3: Using forEach\nfunction sumArrayForEach(arr) {\n    let total = 0;\n    arr.forEach(num => total += num);\n    return total;\n}\n\n// Method 4: Sum of first n numbers\nfunction sumNatural(n) {\n    return (n * (n + 1)) / 2;\n}\n\n// Example:\nconst arr = [1, 2, 3, 4, 5];\nconsole.log(sumArray(arr)); // 15\nconsole.log(sumNatural(5)); // 15\n\nTime Complexity: O(n)\nSpace Complexity: O(1)`;
    } else {
      return `Solution: Sum of Array/Numbers\n\nPython:\ndef sum_array(arr):\n    return sum(arr)\n\nJavaScript:\nfunction sumArray(arr) {\n    return arr.reduce((a, b) => a + b, 0);\n}\n\nJava:\npublic int sumArray(int[] arr) {\n    int sum = 0;\n    for (int num : arr) {\n        sum += num;\n    }\n    return sum;\n}\n\nTime Complexity: O(n)\nSpace Complexity: O(1)`;
    }
  }

  function solveCountProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Count Occurrences in Python\n\n# Method 1: Using count() for lists/strings\ndef count_occurrences(arr, target):\n    return arr.count(target)\n\n# Method 2: Using dictionary\ndef count_all(arr):\n    counts = {}\n    for item in arr:\n        counts[item] = counts.get(item, 0) + 1\n    return counts\n\n# Method 3: Using Counter from collections\nfrom collections import Counter\ndef count_with_counter(arr):\n    return Counter(arr)\n\n# Method 4: Count characters in string\ndef count_chars(s, char):\n    return s.count(char)\n\n# Example:\narr = [1, 2, 2, 3, 2, 4]\nprint(count_occurrences(arr, 2))  # 3\nprint(count_all(arr))  # {1: 1, 2: 3, 3: 1, 4: 1}\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else if (lang === 'javascript') {
      return `Solution: Count Occurrences in JavaScript\n\n// Method 1: Using filter\nfunction countOccurrences(arr, target) {\n    return arr.filter(x => x === target).length;\n}\n\n// Method 2: Using reduce\nfunction countOccurrencesReduce(arr, target) {\n    return arr.reduce((count, item) => \n        item === target ? count + 1 : count, 0);\n}\n\n// Method 3: Count all occurrences\nfunction countAll(arr) {\n    const counts = {};\n    for (let item of arr) {\n        counts[item] = (counts[item] || 0) + 1;\n    }\n    return counts;\n}\n\n// Method 4: Count characters in string\nfunction countChars(str, char) {\n    return str.split(char).length - 1;\n}\n\n// Example:\nconst arr = [1, 2, 2, 3, 2, 4];\nconsole.log(countOccurrences(arr, 2)); // 3\nconsole.log(countAll(arr)); // {1: 1, 2: 3, 3: 1, 4: 1}\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else {
      return `Solution: Count Occurrences\n\nPython:\ndef count_occurrences(arr, target):\n    return arr.count(target)\n\nJavaScript:\nfunction countOccurrences(arr, target) {\n    return arr.filter(x => x === target).length;\n}\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    }
  }

  function solveFindProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Find/Search Element in Python\n\n# Method 1: Using 'in' operator\ndef find_element(arr, target):\n    return target in arr\n\n# Method 2: Using index (returns index or raises error)\ndef find_index(arr, target):\n    try:\n        return arr.index(target)\n    except ValueError:\n        return -1\n\n# Method 3: Using loop\ndef find_index_loop(arr, target):\n    for i, item in enumerate(arr):\n        if item == target:\n            return i\n    return -1\n\n# Method 4: Binary search (for sorted arrays)\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\n# Example:\narr = [1, 2, 3, 4, 5]\nprint(find_element(arr, 3))  # True\nprint(find_index(arr, 3))  # 2\n\nTime Complexity: O(n) linear, O(log n) binary search\nSpace Complexity: O(1)`;
    } else if (lang === 'javascript') {
      return `Solution: Find/Search Element in JavaScript\n\n// Method 1: Using includes\nfunction findElement(arr, target) {\n    return arr.includes(target);\n}\n\n// Method 2: Using indexOf\nfunction findIndex(arr, target) {\n    return arr.indexOf(target);\n}\n\n// Method 3: Using find\nfunction findElementFind(arr, target) {\n    return arr.find(item => item === target);\n}\n\n// Method 4: Binary search (for sorted arrays)\nfunction binarySearch(arr, target) {\n    let left = 0, right = arr.length - 1;\n    while (left <= right) {\n        const mid = Math.floor((left + right) / 2);\n        if (arr[mid] === target) return mid;\n        if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}\n\n// Example:\nconst arr = [1, 2, 3, 4, 5];\nconsole.log(findElement(arr, 3)); // true\nconsole.log(findIndex(arr, 3)); // 2\n\nTime Complexity: O(n) linear, O(log n) binary search\nSpace Complexity: O(1)`;
    } else {
      return `Solution: Find/Search Element\n\nPython:\ndef find_element(arr, target):\n    return target in arr\n\nJavaScript:\nfunction findElement(arr, target) {\n    return arr.includes(target);\n}\n\nTime Complexity: O(n)\nSpace Complexity: O(1)`;
    }
  }

  function solveSortProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    const isDescending = lower.includes('descending') || lower.includes('desc');
    
    if (lang === 'python') {
      return `Solution: Sort Array/List in Python\n\n# Method 1: Using sorted() (returns new list)\ndef sort_ascending(arr):\n    return sorted(arr)\n\ndef sort_descending(arr):\n    return sorted(arr, reverse=True)\n\n# Method 2: Using sort() (modifies original)\ndef sort_in_place(arr):\n    arr.sort()  # Ascending\n    arr.sort(reverse=True)  # Descending\n    return arr\n\n# Method 3: Custom sort with key\ndef sort_by_length(arr):\n    return sorted(arr, key=len)\n\ndef sort_by_second_element(arr):\n    return sorted(arr, key=lambda x: x[1])\n\n# Example:\narr = [3, 1, 4, 1, 5, 9, 2, 6]\nprint(sort_ascending(arr))  # [1, 1, 2, 3, 4, 5, 6, 9]\nprint(sort_descending(arr))  # [9, 6, 5, 4, 3, 2, 1, 1]\n\nTime Complexity: O(n log n)\nSpace Complexity: O(n)`;
    } else if (lang === 'javascript') {
      return `Solution: Sort Array in JavaScript\n\n// Method 1: Using sort() (modifies original)\nfunction sortAscending(arr) {\n    return arr.sort((a, b) => a - b);\n}\n\nfunction sortDescending(arr) {\n    return arr.sort((a, b) => b - a);\n}\n\n// Method 2: Create new sorted array\nfunction sortNew(arr) {\n    return [...arr].sort((a, b) => a - b);\n}\n\n// Method 3: Custom sort\nfunction sortByLength(arr) {\n    return arr.sort((a, b) => a.length - b.length);\n}\n\n// Example:\nconst arr = [3, 1, 4, 1, 5, 9, 2, 6];\nconsole.log(sortAscending(arr)); // [1, 1, 2, 3, 4, 5, 6, 9]\nconsole.log(sortDescending(arr)); // [9, 6, 5, 4, 3, 2, 1, 1]\n\nTime Complexity: O(n log n)\nSpace Complexity: O(1)`;
    } else {
      return `Solution: Sort Array\n\nPython:\ndef sort_array(arr):\n    return sorted(arr)\n\nJavaScript:\nfunction sortArray(arr) {\n    return arr.sort((a, b) => a - b);\n}\n\nTime Complexity: O(n log n)\nSpace Complexity: O(n)`;
    }
  }

  function solvePalindromeProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Check Palindrome in Python\n\n# Method 1: Using slicing\ndef is_palindrome(s):\n    s = s.lower().replace(' ', '')  # Case-insensitive, ignore spaces\n    return s == s[::-1]\n\n# Method 2: Using two pointers\ndef is_palindrome_two_pointers(s):\n    s = s.lower().replace(' ', '')\n    left, right = 0, len(s) - 1\n    while left < right:\n        if s[left] != s[right]:\n            return False\n        left += 1\n        right -= 1\n    return True\n\n# Method 3: Using reversed\ndef is_palindrome_reversed(s):\n    s = s.lower().replace(' ', '')\n    return s == ''.join(reversed(s))\n\n# Example:\nprint(is_palindrome("racecar"))  # True\nprint(is_palindrome("hello"))  # False\nprint(is_palindrome("A man a plan a canal Panama"))  # True\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else if (lang === 'javascript') {
      return `Solution: Check Palindrome in JavaScript\n\n// Method 1: Using split, reverse, join\nfunction isPalindrome(str) {\n    const cleaned = str.toLowerCase().replace(/\\s/g, '');\n    return cleaned === cleaned.split('').reverse().join('');\n}\n\n// Method 2: Using two pointers\nfunction isPalindromeTwoPointers(str) {\n    const cleaned = str.toLowerCase().replace(/\\s/g, '');\n    let left = 0, right = cleaned.length - 1;\n    while (left < right) {\n        if (cleaned[left] !== cleaned[right]) return false;\n        left++;\n        right--;\n    }\n    return true;\n}\n\n// Method 3: Using every\nfunction isPalindromeEvery(str) {\n    const cleaned = str.toLowerCase().replace(/\\s/g, '');\n    return cleaned.split('').every((char, i) => \n        char === cleaned[cleaned.length - 1 - i]);\n}\n\n// Example:\nconsole.log(isPalindrome("racecar")); // true\nconsole.log(isPalindrome("hello")); // false\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else {
      return `Solution: Check Palindrome\n\nPython:\ndef is_palindrome(s):\n    s = s.lower().replace(' ', '')\n    return s == s[::-1]\n\nJavaScript:\nfunction isPalindrome(str) {\n    const cleaned = str.toLowerCase().replace(/\\s/g, '');\n    return cleaned === cleaned.split('').reverse().join('');\n}\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    }
  }

  function solveFibonacciProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    const numMatch = prompt.match(/\d+/);
    const n = numMatch ? parseInt(numMatch[0]) : 10;
    
    if (lang === 'python') {
      return `Solution: Fibonacci Sequence in Python\n\n# Method 1: Recursive (inefficient for large n)\ndef fibonacci_recursive(n):\n    if n <= 1:\n        return n\n    return fibonacci_recursive(n-1) + fibonacci_recursive(n-2)\n\n# Method 2: Iterative (efficient)\ndef fibonacci_iterative(n):\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n\n# Method 3: Generate sequence\ndef fibonacci_sequence(n):\n    if n <= 0:\n        return []\n    elif n == 1:\n        return [0]\n    fib = [0, 1]\n    for i in range(2, n):\n        fib.append(fib[i-1] + fib[i-2])\n    return fib\n\n# Method 4: Using memoization (optimized recursive)\ndef fibonacci_memo(n, memo={}):\n    if n in memo:\n        return memo[n]\n    if n <= 1:\n        return n\n    memo[n] = fibonacci_memo(n-1, memo) + fibonacci_memo(n-2, memo)\n    return memo[n]\n\n# Example:\nprint(fibonacci_iterative(${n}))  # ${n}th Fibonacci number\nprint(fibonacci_sequence(${n}))  # First ${n} numbers\n\nTime Complexity: O(n) iterative, O(2^n) naive recursive\nSpace Complexity: O(1) iterative, O(n) recursive`;
    } else if (lang === 'javascript') {
      return `Solution: Fibonacci Sequence in JavaScript\n\n// Method 1: Recursive (inefficient)\nfunction fibonacciRecursive(n) {\n    if (n <= 1) return n;\n    return fibonacciRecursive(n-1) + fibonacciRecursive(n-2);\n}\n\n// Method 2: Iterative (efficient)\nfunction fibonacciIterative(n) {\n    if (n <= 1) return n;\n    let a = 0, b = 1;\n    for (let i = 2; i <= n; i++) {\n        [a, b] = [b, a + b];\n    }\n    return b;\n}\n\n// Method 3: Generate sequence\nfunction fibonacciSequence(n) {\n    if (n <= 0) return [];\n    if (n === 1) return [0];\n    const fib = [0, 1];\n    for (let i = 2; i < n; i++) {\n        fib[i] = fib[i-1] + fib[i-2];\n    }\n    return fib;\n}\n\n// Method 4: Using memoization\nfunction fibonacciMemo(n, memo = {}) {\n    if (n in memo) return memo[n];\n    if (n <= 1) return n;\n    memo[n] = fibonacciMemo(n-1, memo) + fibonacciMemo(n-2, memo);\n    return memo[n];\n}\n\n// Example:\nconsole.log(fibonacciIterative(${n})); // ${n}th Fibonacci number\nconsole.log(fibonacciSequence(${n})); // First ${n} numbers\n\nTime Complexity: O(n) iterative, O(2^n) naive recursive\nSpace Complexity: O(1) iterative, O(n) recursive`;
    } else {
      return `Solution: Fibonacci Sequence\n\nPython:\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\nJavaScript:\nfunction fibonacci(n) {\n    let a = 0, b = 1;\n    for (let i = 0; i < n; i++) {\n        [a, b] = [b, a + b];\n    }\n    return a;\n}\n\nTime Complexity: O(n)\nSpace Complexity: O(1)`;
    }
  }

  function solveFactorialProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    const numMatch = prompt.match(/\d+/);
    const n = numMatch ? parseInt(numMatch[0]) : 5;
    
    if (lang === 'python') {
      return `Solution: Factorial in Python\n\n# Method 1: Recursive\ndef factorial_recursive(n):\n    if n <= 1:\n        return 1\n    return n * factorial_recursive(n - 1)\n\n# Method 2: Iterative\ndef factorial_iterative(n):\n    result = 1\n    for i in range(1, n + 1):\n        result *= i\n    return result\n\n# Method 3: Using math module\nimport math\ndef factorial_math(n):\n    return math.factorial(n)\n\n# Method 4: Using reduce\nfrom functools import reduce\nfrom operator import mul\ndef factorial_reduce(n):\n    return reduce(mul, range(1, n + 1), 1)\n\n# Example:\nprint(factorial_iterative(${n}))  # ${n}! = ${Array.from({length: n}, (_, i) => i + 1).reduce((a, b) => a * b, 1)}\n\nTime Complexity: O(n)\nSpace Complexity: O(1) iterative, O(n) recursive`;
    } else if (lang === 'javascript') {
      return `Solution: Factorial in JavaScript\n\n// Method 1: Recursive\nfunction factorialRecursive(n) {\n    if (n <= 1) return 1;\n    return n * factorialRecursive(n - 1);\n}\n\n// Method 2: Iterative\nfunction factorialIterative(n) {\n    let result = 1;\n    for (let i = 1; i <= n; i++) {\n        result *= i;\n    }\n    return result;\n}\n\n// Method 3: Using reduce\nfunction factorialReduce(n) {\n    return Array.from({length: n}, (_, i) => i + 1)\n        .reduce((a, b) => a * b, 1);\n}\n\n// Example:\nconsole.log(factorialIterative(${n})); // ${n}! = ${Array.from({length: n}, (_, i) => i + 1).reduce((a, b) => a * b, 1)}\n\nTime Complexity: O(n)\nSpace Complexity: O(1) iterative, O(n) recursive`;
    } else {
      return `Solution: Factorial\n\nPython:\ndef factorial(n):\n    result = 1\n    for i in range(1, n + 1):\n        result *= i\n    return result\n\nJavaScript:\nfunction factorial(n) {\n    let result = 1;\n    for (let i = 1; i <= n; i++) {\n        result *= i;\n    }\n    return result;\n}\n\nTime Complexity: O(n)\nSpace Complexity: O(1)`;
    }
  }

  function solvePrimeProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Prime Number Check in Python\n\n# Method 1: Basic check\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\n# Method 2: Generate prime numbers up to n\ndef generate_primes(n):\n    primes = []\n    for num in range(2, n + 1):\n        if is_prime(num):\n            primes.append(num)\n    return primes\n\n# Method 3: Sieve of Eratosthenes (efficient)\ndef sieve_of_eratosthenes(n):\n    is_prime = [True] * (n + 1)\n    is_prime[0] = is_prime[1] = False\n    \n    for i in range(2, int(n**0.5) + 1):\n        if is_prime[i]:\n            for j in range(i*i, n + 1, i):\n                is_prime[j] = False\n    \n    return [i for i in range(n + 1) if is_prime[i]]\n\n# Example:\nprint(is_prime(17))  # True\nprint(generate_primes(20))  # [2, 3, 5, 7, 11, 13, 17, 19]\n\nTime Complexity: O(√n) for check, O(n log log n) for sieve\nSpace Complexity: O(1) for check, O(n) for sieve`;
    } else if (lang === 'javascript') {
      return `Solution: Prime Number Check in JavaScript\n\n// Method 1: Basic check\nfunction isPrime(n) {\n    if (n < 2) return false;\n    for (let i = 2; i <= Math.sqrt(n); i++) {\n        if (n % i === 0) return false;\n    }\n    return true;\n}\n\n// Method 2: Generate primes up to n\nfunction generatePrimes(n) {\n    const primes = [];\n    for (let i = 2; i <= n; i++) {\n        if (isPrime(i)) primes.push(i);\n    }\n    return primes;\n}\n\n// Method 3: Sieve of Eratosthenes\nfunction sieveOfEratosthenes(n) {\n    const isPrime = Array(n + 1).fill(true);\n    isPrime[0] = isPrime[1] = false;\n    \n    for (let i = 2; i <= Math.sqrt(n); i++) {\n        if (isPrime[i]) {\n            for (let j = i * i; j <= n; j += i) {\n                isPrime[j] = false;\n            }\n        }\n    }\n    \n    return isPrime.map((prime, i) => prime ? i : null).filter(x => x !== null);\n}\n\n// Example:\nconsole.log(isPrime(17)); // true\nconsole.log(generatePrimes(20)); // [2, 3, 5, 7, 11, 13, 17, 19]\n\nTime Complexity: O(√n) for check, O(n log log n) for sieve\nSpace Complexity: O(1) for check, O(n) for sieve`;
    } else {
      return `Solution: Prime Number Check\n\nPython:\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\nJavaScript:\nfunction isPrime(n) {\n    if (n < 2) return false;\n    for (let i = 2; i <= Math.sqrt(n); i++) {\n        if (n % i === 0) return false;\n    }\n    return true;\n}\n\nTime Complexity: O(√n)\nSpace Complexity: O(1)`;
    }
  }

  function solveTwoSumProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Two Sum Problem in Python\n\n# Problem: Find two numbers that add up to target\n# Input: nums = [2, 7, 11, 15], target = 9\n# Output: [0, 1] (because nums[0] + nums[1] = 2 + 7 = 9)\n\n# Method 1: Brute force O(n²)\ndef two_sum_brute(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []\n\n# Method 2: Using hash map O(n) - OPTIMAL\ndef two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []\n\n# Method 3: Return values instead of indices\ndef two_sum_values(nums, target):\n    seen = {}\n    for num in nums:\n        complement = target - num\n        if complement in seen:\n            return [complement, num]\n        seen[num] = True\n    return []\n\n# Example:\nnums = [2, 7, 11, 15]\ntarget = 9\nprint(two_sum(nums, target))  # [0, 1]\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else if (lang === 'javascript') {
      return `Solution: Two Sum Problem in JavaScript\n\n// Problem: Find two numbers that add up to target\n// Input: nums = [2, 7, 11, 15], target = 9\n// Output: [0, 1]\n\n// Method 1: Brute force O(n²)\nfunction twoSumBrute(nums, target) {\n    for (let i = 0; i < nums.length; i++) {\n        for (let j = i + 1; j < nums.length; j++) {\n            if (nums[i] + nums[j] === target) {\n                return [i, j];\n            }\n        }\n    }\n    return [];\n}\n\n// Method 2: Using hash map O(n) - OPTIMAL\nfunction twoSum(nums, target) {\n    const seen = {};\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (complement in seen) {\n            return [seen[complement], i];\n        }\n        seen[nums[i]] = i;\n    }\n    return [];\n}\n\n// Example:\nconst nums = [2, 7, 11, 15];\nconst target = 9;\nconsole.log(twoSum(nums, target)); // [0, 1]\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else {
      return `Solution: Two Sum Problem\n\nPython:\ndef two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    }
  }

  function solveDuplicateProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Remove Duplicates in Python\n\n# Method 1: Using set (preserves order in Python 3.7+)\ndef remove_duplicates_set(arr):\n    return list(dict.fromkeys(arr))  # Preserves order\n\n# Method 2: Using set (doesn't preserve order)\ndef remove_duplicates_set_simple(arr):\n    return list(set(arr))\n\n# Method 3: Using loop\ndef remove_duplicates_loop(arr):\n    seen = set()\n    result = []\n    for item in arr:\n        if item not in seen:\n            seen.add(item)\n            result.append(item)\n    return result\n\n# Method 4: Using list comprehension\ndef remove_duplicates_comprehension(arr):\n    seen = set()\n    return [x for x in arr if not (x in seen or seen.add(x))]\n\n# Example:\narr = [1, 2, 2, 3, 4, 4, 5]\nprint(remove_duplicates_set(arr))  # [1, 2, 3, 4, 5]\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else if (lang === 'javascript') {
      return `Solution: Remove Duplicates in JavaScript\n\n// Method 1: Using Set\nfunction removeDuplicatesSet(arr) {\n    return [...new Set(arr)];\n}\n\n// Method 2: Using filter\nfunction removeDuplicatesFilter(arr) {\n    return arr.filter((item, index) => arr.indexOf(item) === index);\n}\n\n// Method 3: Using reduce\nfunction removeDuplicatesReduce(arr) {\n    return arr.reduce((acc, item) => {\n        if (!acc.includes(item)) acc.push(item);\n        return acc;\n    }, []);\n}\n\n// Method 4: Using Map\nfunction removeDuplicatesMap(arr) {\n    const seen = new Map();\n    return arr.filter(item => {\n        if (seen.has(item)) return false;\n        seen.set(item, true);\n        return true;\n    });\n}\n\n// Example:\nconst arr = [1, 2, 2, 3, 4, 4, 5];\nconsole.log(removeDuplicatesSet(arr)); // [1, 2, 3, 4, 5]\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else {
      return `Solution: Remove Duplicates\n\nPython:\ndef remove_duplicates(arr):\n    return list(dict.fromkeys(arr))\n\nJavaScript:\nfunction removeDuplicates(arr) {\n    return [...new Set(arr)];\n}\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    }
  }

  function solveEvenOddProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Check Even/Odd in Python\n\n# Method 1: Using modulo operator\ndef is_even(n):\n    return n % 2 == 0\n\ndef is_odd(n):\n    return n % 2 != 0\n\n# Method 2: Using bitwise AND (faster)\ndef is_even_bitwise(n):\n    return (n & 1) == 0\n\n# Method 3: Filter even/odd from list\ndef filter_even(arr):\n    return [x for x in arr if x % 2 == 0]\n\ndef filter_odd(arr):\n    return [x for x in arr if x % 2 != 0]\n\n# Example:\nprint(is_even(4))  # True\nprint(is_odd(5))  # True\nprint(filter_even([1, 2, 3, 4, 5]))  # [2, 4]\n\nTime Complexity: O(1) for check, O(n) for filter\nSpace Complexity: O(1) for check, O(n) for filter`;
    } else if (lang === 'javascript') {
      return `Solution: Check Even/Odd in JavaScript\n\n// Method 1: Using modulo\nfunction isEven(n) {\n    return n % 2 === 0;\n}\n\nfunction isOdd(n) {\n    return n % 2 !== 0;\n}\n\n// Method 2: Using bitwise AND\nfunction isEvenBitwise(n) {\n    return (n & 1) === 0;\n}\n\n// Method 3: Filter even/odd\nfunction filterEven(arr) {\n    return arr.filter(x => x % 2 === 0);\n}\n\nfunction filterOdd(arr) {\n    return arr.filter(x => x % 2 !== 0);\n}\n\n// Example:\nconsole.log(isEven(4)); // true\nconsole.log(filterEven([1, 2, 3, 4, 5])); // [2, 4]\n\nTime Complexity: O(1) for check, O(n) for filter\nSpace Complexity: O(1) for check, O(n) for filter`;
    } else {
      return `Solution: Check Even/Odd\n\nPython:\ndef is_even(n):\n    return n % 2 == 0\n\nJavaScript:\nfunction isEven(n) {\n    return n % 2 === 0;\n}\n\nTime Complexity: O(1)\nSpace Complexity: O(1)`;
    }
  }

  function solveFizzBuzzProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: FizzBuzz Problem in Python\n\n# Problem: Print numbers 1 to n, but:\n# - If divisible by 3, print "Fizz"\n# - If divisible by 5, print "Buzz"\n# - If divisible by both, print "FizzBuzz"\n\ndef fizzbuzz(n):\n    result = []\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            result.append("FizzBuzz")\n        elif i % 3 == 0:\n            result.append("Fizz")\n        elif i % 5 == 0:\n            result.append("Buzz")\n        else:\n            result.append(str(i))\n    return result\n\n# Method 2: More concise\ndef fizzbuzz_concise(n):\n    return ["FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else str(i) for i in range(1, n + 1)]\n\n# Example:\nprint(fizzbuzz(15))\n# Output: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz']\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else if (lang === 'javascript') {
      return `Solution: FizzBuzz Problem in JavaScript\n\n// Problem: Print numbers 1 to n with FizzBuzz rules\nfunction fizzBuzz(n) {\n    const result = [];\n    for (let i = 1; i <= n; i++) {\n        if (i % 15 === 0) {\n            result.push("FizzBuzz");\n        } else if (i % 3 === 0) {\n            result.push("Fizz");\n        } else if (i % 5 === 0) {\n            result.push("Buzz");\n        } else {\n            result.push(String(i));\n        }\n    }\n    return result;\n}\n\n// Method 2: Using ternary\nfunction fizzBuzzTernary(n) {\n    return Array.from({length: n}, (_, i) => {\n        const num = i + 1;\n        return num % 15 === 0 ? "FizzBuzz" :\n               num % 3 === 0 ? "Fizz" :\n               num % 5 === 0 ? "Buzz" : String(num);\n    });\n}\n\n// Example:\nconsole.log(fizzBuzz(15));\n// ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz']\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else {
      return `Solution: FizzBuzz Problem\n\nPython:\ndef fizzbuzz(n):\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            print("FizzBuzz")\n        elif i % 3 == 0:\n            print("Fizz")\n        elif i % 5 == 0:\n            print("Buzz")\n        else:\n            print(i)\n\nTime Complexity: O(n)\nSpace Complexity: O(1)`;
    }
  }

  function solveAnagramProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Check Anagram in Python\n\n# Problem: Two strings are anagrams if they have same characters\n# Example: "listen" and "silent" are anagrams\n\ndef is_anagram(s1, s2):\n    # Remove spaces and convert to lowercase\n    s1 = s1.replace(' ', '').lower()\n    s2 = s2.replace(' ', '').lower()\n    \n    # Method 1: Sort and compare\n    return sorted(s1) == sorted(s2)\n\n# Method 2: Using Counter\ndef is_anagram_counter(s1, s2):\n    from collections import Counter\n    s1 = s1.replace(' ', '').lower()\n    s2 = s2.replace(' ', '').lower()\n    return Counter(s1) == Counter(s2)\n\n# Method 3: Using dictionary\ndef is_anagram_dict(s1, s2):\n    s1 = s1.replace(' ', '').lower()\n    s2 = s2.replace(' ', '').lower()\n    \n    if len(s1) != len(s2):\n        return False\n    \n    count = {}\n    for char in s1:\n        count[char] = count.get(char, 0) + 1\n    \n    for char in s2:\n        if char not in count or count[char] == 0:\n            return False\n        count[char] -= 1\n    \n    return True\n\n# Example:\nprint(is_anagram("listen", "silent"))  # True\nprint(is_anagram("hello", "world"))  # False\n\nTime Complexity: O(n log n) with sort, O(n) with Counter\nSpace Complexity: O(n)`;
    } else if (lang === 'javascript') {
      return `Solution: Check Anagram in JavaScript\n\n// Problem: Two strings are anagrams if they have same characters\nfunction isAnagram(s1, s2) {\n    const clean1 = s1.replace(/\\s/g, '').toLowerCase();\n    const clean2 = s2.replace(/\\s/g, '').toLowerCase();\n    \n    // Method 1: Sort and compare\n    return clean1.split('').sort().join('') === clean2.split('').sort().join('');\n}\n\n// Method 2: Using character count\nfunction isAnagramCount(s1, s2) {\n    const clean1 = s1.replace(/\\s/g, '').toLowerCase();\n    const clean2 = s2.replace(/\\s/g, '').toLowerCase();\n    \n    if (clean1.length !== clean2.length) return false;\n    \n    const count = {};\n    for (let char of clean1) {\n        count[char] = (count[char] || 0) + 1;\n    }\n    \n    for (let char of clean2) {\n        if (!count[char]) return false;\n        count[char]--;\n    }\n    \n    return true;\n}\n\n// Example:\nconsole.log(isAnagram("listen", "silent")); // true\nconsole.log(isAnagram("hello", "world")); // false\n\nTime Complexity: O(n log n) with sort, O(n) with count\nSpace Complexity: O(n)`;
    } else {
      return `Solution: Check Anagram\n\nPython:\ndef is_anagram(s1, s2):\n    return sorted(s1.lower()) == sorted(s2.lower())\n\nJavaScript:\nfunction isAnagram(s1, s2) {\n    return s1.toLowerCase().split('').sort().join('') === \n           s2.toLowerCase().split('').sort().join('');\n}\n\nTime Complexity: O(n log n)\nSpace Complexity: O(n)`;
    }
  }

  function solveParenthesesProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Valid Parentheses in Python\n\n# Problem: Check if parentheses are balanced\n# Example: "()[]{}" is valid, "([)]" is invalid\n\ndef is_valid_parentheses(s):\n    stack = []\n    pairs = {')': '(', ']': '[', '}': '{'}\n    \n    for char in s:\n        if char in pairs:\n            # Closing bracket\n            if not stack or stack.pop() != pairs[char]:\n                return False\n        else:\n            # Opening bracket\n            stack.append(char)\n    \n    return len(stack) == 0\n\n# Example:\nprint(is_valid_parentheses("()[]{}"))  # True\nprint(is_valid_parentheses("([)]"))  # False\nprint(is_valid_parentheses("{[]}"))  # True\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else if (lang === 'javascript') {
      return `Solution: Valid Parentheses in JavaScript\n\n// Problem: Check if parentheses are balanced\nfunction isValidParentheses(s) {\n    const stack = [];\n    const pairs = {')': '(', ']': '[', '}': '{'};\n    \n    for (let char of s) {\n        if (char in pairs) {\n            // Closing bracket\n            if (stack.length === 0 || stack.pop() !== pairs[char]) {\n                return false;\n            }\n        } else {\n            // Opening bracket\n            stack.push(char);\n        }\n    }\n    \n    return stack.length === 0;\n}\n\n// Example:\nconsole.log(isValidParentheses("()[]{}")); // true\nconsole.log(isValidParentheses("([)]")); // false\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else {
      return `Solution: Valid Parentheses\n\nPython:\ndef is_valid_parentheses(s):\n    stack = []\n    pairs = {')': '(', ']': '[', '}': '{'}\n    for char in s:\n        if char in pairs:\n            if not stack or stack.pop() != pairs[char]:\n                return False\n        else:\n            stack.append(char)\n    return len(stack) == 0\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    }
  }

  function solveMergeProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Merge Arrays/Lists in Python\n\n# Method 1: Merge two sorted arrays\ndef merge_sorted(arr1, arr2):\n    result = []\n    i, j = 0, 0\n    \n    while i < len(arr1) and j < len(arr2):\n        if arr1[i] < arr2[j]:\n            result.append(arr1[i])\n            i += 1\n        else:\n            result.append(arr2[j])\n            j += 1\n    \n    result.extend(arr1[i:])\n    result.extend(arr2[j:])\n    return result\n\n# Method 2: Simple concatenation\ndef merge_arrays(arr1, arr2):\n    return arr1 + arr2\n\n# Method 3: Merge multiple arrays\ndef merge_multiple(*arrays):\n    result = []\n    for arr in arrays:\n        result.extend(arr)\n    return result\n\n# Example:\narr1 = [1, 3, 5]\narr2 = [2, 4, 6]\nprint(merge_sorted(arr1, arr2))  # [1, 2, 3, 4, 5, 6]\n\nTime Complexity: O(n + m)\nSpace Complexity: O(n + m)`;
    } else if (lang === 'javascript') {
      return `Solution: Merge Arrays in JavaScript\n\n// Method 1: Merge two sorted arrays\nfunction mergeSorted(arr1, arr2) {\n    const result = [];\n    let i = 0, j = 0;\n    \n    while (i < arr1.length && j < arr2.length) {\n        if (arr1[i] < arr2[j]) {\n            result.push(arr1[i++]);\n        } else {\n            result.push(arr2[j++]);\n        }\n    }\n    \n    return result.concat(arr1.slice(i)).concat(arr2.slice(j));\n}\n\n// Method 2: Simple concatenation\nfunction mergeArrays(arr1, arr2) {\n    return [...arr1, ...arr2];\n}\n\n// Method 3: Merge multiple arrays\nfunction mergeMultiple(...arrays) {\n    return arrays.flat();\n}\n\n// Example:\nconst arr1 = [1, 3, 5];\nconst arr2 = [2, 4, 6];\nconsole.log(mergeSorted(arr1, arr2)); // [1, 2, 3, 4, 5, 6]\n\nTime Complexity: O(n + m)\nSpace Complexity: O(n + m)`;
    } else {
      return `Solution: Merge Arrays\n\nPython:\ndef merge_sorted(arr1, arr2):\n    return sorted(arr1 + arr2)\n\nJavaScript:\nfunction mergeSorted(arr1, arr2) {\n    return [...arr1, ...arr2].sort((a, b) => a - b);\n}\n\nTime Complexity: O(n log n)\nSpace Complexity: O(n)`;
    }
  }

  function solveFilterProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Filter Array/List in Python\n\n# Method 1: Using list comprehension\ndef filter_even(arr):\n    return [x for x in arr if x % 2 == 0]\n\ndef filter_positive(arr):\n    return [x for x in arr if x > 0]\n\ndef filter_strings(arr):\n    return [x for x in arr if isinstance(x, str)]\n\n# Method 2: Using filter() function\ndef filter_even_functional(arr):\n    return list(filter(lambda x: x % 2 == 0, arr))\n\n# Method 3: Custom filter function\ndef custom_filter(arr, condition):\n    return [x for x in arr if condition(x)]\n\n# Example:\narr = [1, 2, 3, 4, 5, 6, -1, -2]\nprint(filter_even(arr))  # [2, 4, 6]\nprint(filter_positive(arr))  # [1, 2, 3, 4, 5, 6]\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else if (lang === 'javascript') {
      return `Solution: Filter Array in JavaScript\n\n// Method 1: Using filter() method\nfunction filterEven(arr) {\n    return arr.filter(x => x % 2 === 0);\n}\n\nfunction filterPositive(arr) {\n    return arr.filter(x => x > 0);\n}\n\nfunction filterStrings(arr) {\n    return arr.filter(x => typeof x === 'string');\n}\n\n// Method 2: Custom filter\nfunction customFilter(arr, condition) {\n    return arr.filter(condition);\n}\n\n// Example:\nconst arr = [1, 2, 3, 4, 5, 6, -1, -2];\nconsole.log(filterEven(arr)); // [2, 4, 6]\nconsole.log(filterPositive(arr)); // [1, 2, 3, 4, 5, 6]\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else {
      return `Solution: Filter Array\n\nPython:\ndef filter_even(arr):\n    return [x for x in arr if x % 2 == 0]\n\nJavaScript:\nfunction filterEven(arr) {\n    return arr.filter(x => x % 2 === 0);\n}\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    }
  }

  function solveMapProblem(prompt, lower) {
    const lang = detectLanguage(lower);
    if (lang === 'python') {
      return `Solution: Map/Transform Array in Python\n\n# Method 1: Using list comprehension\ndef square_numbers(arr):\n    return [x * x for x in arr]\n\ndef double_numbers(arr):\n    return [x * 2 for x in arr]\n\ndef convert_to_strings(arr):\n    return [str(x) for x in arr]\n\n# Method 2: Using map() function\ndef square_map(arr):\n    return list(map(lambda x: x * x, arr))\n\n# Method 3: Custom map function\ndef custom_map(arr, transform):\n    return [transform(x) for x in arr]\n\n# Example:\narr = [1, 2, 3, 4, 5]\nprint(square_numbers(arr))  # [1, 4, 9, 16, 25]\nprint(double_numbers(arr))  # [2, 4, 6, 8, 10]\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else if (lang === 'javascript') {
      return `Solution: Map/Transform Array in JavaScript\n\n// Method 1: Using map() method\nfunction squareNumbers(arr) {\n    return arr.map(x => x * x);\n}\n\nfunction doubleNumbers(arr) {\n    return arr.map(x => x * 2);\n}\n\nfunction convertToStrings(arr) {\n    return arr.map(x => String(x));\n}\n\n// Method 2: Custom map\nfunction customMap(arr, transform) {\n    return arr.map(transform);\n}\n\n// Example:\nconst arr = [1, 2, 3, 4, 5];\nconsole.log(squareNumbers(arr)); // [1, 4, 9, 16, 25]\nconsole.log(doubleNumbers(arr)); // [2, 4, 6, 8, 10]\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    } else {
      return `Solution: Map/Transform Array\n\nPython:\ndef square_numbers(arr):\n    return [x * x for x in arr]\n\nJavaScript:\nfunction squareNumbers(arr) {\n    return arr.map(x => x * x);\n}\n\nTime Complexity: O(n)\nSpace Complexity: O(n)`;
    }
  }

  function solveAlgorithmProblem(prompt, lower) {
    return explainAlgorithm(prompt);
  }

  function solveDataStructureProblem(prompt, lower) {
    return explainDataStructure(prompt);
  }

  // Helper function to detect programming language
  function detectLanguage(lower) {
    if (lower.match(/\b(python|py|def |import |print|\.py)\b/)) return 'python';
    if (lower.match(/\b(javascript|js|function|const|let|var|\.js|react|vue|node)\b/)) return 'javascript';
    if (lower.match(/\b(java|class |public |private |\.java)\b/)) return 'java';
    if (lower.match(/\b(c\+\+|cpp|#include|\.cpp)\b/)) return 'cpp';
    return 'python'; // Default to Python
  }

  function answerScienceQuestion(prompt, lower) {
    const scienceTopics = {
      'gravity': 'Gravity is a fundamental force that attracts objects with mass toward each other. On Earth, gravity gives objects weight and causes them to fall. Isaac Newton described it, and Einstein\'s theory of general relativity explains it as the curvature of spacetime.',
      'atom': 'An atom is the smallest unit of matter that retains the properties of an element. It consists of a nucleus (protons and neutrons) surrounded by electrons. Atoms combine to form molecules.',
      'photosynthesis': 'Photosynthesis is the process by which plants convert light energy, water, and carbon dioxide into glucose (sugar) and oxygen. It occurs in chloroplasts and is essential for life on Earth.',
      'evolution': 'Evolution is the process by which species change over time through natural selection. Charles Darwin proposed this theory, explaining how organisms adapt to their environment.',
      'dna': 'DNA (Deoxyribonucleic Acid) is the molecule that carries genetic information in all living organisms. It has a double helix structure and contains genes that determine traits.',
      'planet': 'A planet is a celestial body that orbits a star, is spherical due to gravity, and has cleared its orbital path. Our solar system has 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.',
      'solar system': 'The Solar System consists of the Sun and all objects orbiting it, including 8 planets, moons, asteroids, comets, and dwarf planets. It formed about 4.6 billion years ago.',
      'light': 'Light is electromagnetic radiation visible to the human eye. It travels at 299,792,458 m/s in vacuum. Light behaves as both a wave and a particle (photon).',
      'energy': 'Energy is the capacity to do work. It exists in various forms: kinetic (motion), potential (stored), thermal (heat), chemical, electrical, nuclear, etc. Energy cannot be created or destroyed, only transformed.',
      'cell': 'A cell is the basic unit of life. All living organisms are made of cells. There are two main types: prokaryotic (bacteria) and eukaryotic (plants, animals, fungi).'
    };
    
    for (const [key, answer] of Object.entries(scienceTopics)) {
      if (lower.includes(key)) {
        return `${answer}\n\nRegarding "${prompt}": This is a fundamental scientific concept. Would you like more details about any specific aspect?`;
      }
    }
    
    return `Science question: ${prompt}\n\nScience covers many fields:\n- Physics: Matter, energy, forces, motion\n- Chemistry: Elements, compounds, reactions\n- Biology: Life, cells, organisms, ecosystems\n- Astronomy: Planets, stars, galaxies, universe\n- Earth Science: Geology, weather, climate\n\nFor your question, I can explain:\n- The scientific principles involved\n- How it works and why\n- Real-world applications\n- Related concepts\n\nWhat specific aspect would you like to know more about?`;
  }

  function answerMathQuestion(prompt, lower) {
    // Extract numbers and operations
    const numbers = prompt.match(/\d+/g);
    const hasCalculate = lower.includes('calculate') || lower.includes('solve') || lower.includes('compute');
    
    if (hasCalculate && numbers && numbers.length >= 2) {
      const num1 = parseFloat(numbers[0]);
      const num2 = parseFloat(numbers[1]);
      
      if (lower.includes('add') || lower.includes('plus') || lower.includes('+') || lower.includes('sum')) {
        const result = num1 + num2;
        return `Calculation: ${num1} + ${num2} = ${result}\n\nAddition is combining two or more numbers. The result is called the sum.`;
      }
      if (lower.includes('subtract') || lower.includes('minus') || lower.includes('-') || lower.includes('difference')) {
        const result = num1 - num2;
        return `Calculation: ${num1} - ${num2} = ${result}\n\nSubtraction is finding the difference between numbers.`;
      }
      if (lower.includes('multiply') || lower.includes('times') || lower.includes('*') || lower.includes('×') || lower.includes('product')) {
        const result = num1 * num2;
        return `Calculation: ${num1} × ${num2} = ${result}\n\nMultiplication is repeated addition. The result is called the product.`;
      }
      if (lower.includes('divide') || lower.includes('/') || lower.includes('÷') || lower.includes('quotient')) {
        if (num2 !== 0) {
          const result = num1 / num2;
          return `Calculation: ${num1} ÷ ${num2} = ${result}\n\nDivision is splitting into equal parts. The result is called the quotient.`;
        } else {
          return `Error: Cannot divide by zero!\n\nDivision by zero is undefined in mathematics. Please use a non-zero divisor.`;
        }
      }
    }
    
    const mathTopics = {
      'algebra': 'Algebra uses symbols and letters to represent numbers and quantities. It helps solve equations and find unknown values.',
      'geometry': 'Geometry studies shapes, sizes, positions, and properties of space. It includes triangles, circles, polygons, and 3D shapes.',
      'calculus': 'Calculus studies rates of change (derivatives) and accumulation (integrals). It\'s essential for physics, engineering, and advanced mathematics.',
      'trigonometry': 'Trigonometry studies relationships between angles and sides of triangles. Key functions: sine, cosine, tangent.',
      'percentage': 'A percentage is a fraction of 100. To calculate: (part/whole) × 100. Example: 25% means 25 out of 100.',
      'fraction': 'A fraction represents a part of a whole. It has a numerator (top) and denominator (bottom). Example: 3/4 means 3 parts out of 4.',
      'prime number': 'A prime number is only divisible by 1 and itself. Examples: 2, 3, 5, 7, 11, 13, 17, 19, 23...',
      'pythagorean theorem': 'In a right triangle: a² + b² = c², where c is the hypotenuse. Named after Pythagoras.',
      'area': 'Area measures the space inside a 2D shape. Square: side², Rectangle: length × width, Circle: π × radius², Triangle: ½ × base × height.',
      'volume': 'Volume measures space in 3D. Cube: side³, Rectangular box: length × width × height, Cylinder: π × radius² × height, Sphere: (4/3) × π × radius³.'
    };
    
    for (const [key, answer] of Object.entries(mathTopics)) {
      if (lower.includes(key)) {
        return `${answer}\n\nFor "${prompt}": Would you like step-by-step calculations or more examples?`;
      }
    }
    
    return `Math question: ${prompt}\n\nMathematics includes:\n- Arithmetic: Basic operations (+, -, ×, ÷)\n- Algebra: Equations and variables\n- Geometry: Shapes and space\n- Calculus: Rates of change\n- Statistics: Data analysis\n- Trigonometry: Angles and triangles\n\nI can help with:\n- Solving equations\n- Explaining formulas\n- Step-by-step calculations\n- Concept explanations\n- Problem-solving strategies\n\nWhat specific math topic or problem would you like help with?`;
  }

  function answerHistoryQuestion(prompt, lower) {
    const historyFacts = {
      'world war 1': 'World War I (1914-1918) was triggered by the assassination of Archduke Franz Ferdinand. It involved many nations and resulted in millions of casualties.',
      'world war 2': 'World War II (1939-1945) was the deadliest conflict in history. It involved most nations and resulted in the Holocaust and atomic bombings.',
      'ancient egypt': 'Ancient Egypt (c. 3100-30 BCE) was a civilization along the Nile River. Known for pyramids, pharaohs, hieroglyphs, and mummification.',
      'roman empire': 'The Roman Empire (27 BCE-476 CE) was one of the largest empires. It influenced law, language, architecture, and government systems.',
      'renaissance': 'The Renaissance (14th-17th century) was a period of cultural rebirth in Europe, marked by advances in art, science, and learning.',
      'industrial revolution': 'The Industrial Revolution (1760-1840) transformed society through mechanization, factories, and technological innovation.',
      'american revolution': 'The American Revolution (1775-1783) led to the United States\' independence from Britain.',
      'french revolution': 'The French Revolution (1789-1799) overthrew the monarchy and established principles of liberty, equality, and fraternity.'
    };
    
    for (const [key, answer] of Object.entries(historyFacts)) {
      if (lower.includes(key)) {
        return `${answer}\n\nRegarding "${prompt}": This was a significant historical period/event. Would you like to know more about causes, effects, or key figures?`;
      }
    }
    
    return `History question: ${prompt}\n\nHistory covers:\n- Ancient civilizations (Egypt, Greece, Rome, China)\n- Medieval periods\n- Renaissance and Enlightenment\n- World Wars\n- Modern history\n- Cultural and social movements\n\nI can explain:\n- Key events and their significance\n- Important historical figures\n- Causes and effects\n- Timeline and chronology\n- Impact on modern world\n\nWhat specific historical period, event, or person would you like to learn about?`;
  }

  function answerGeographyQuestion(prompt, lower) {
    const geographyFacts = {
      'largest country': 'Russia is the largest country by area (17.1 million km²), spanning Europe and Asia.',
      'smallest country': 'Vatican City is the smallest country (0.44 km²), located in Rome, Italy.',
      'highest mountain': 'Mount Everest in the Himalayas is the highest peak (8,848 meters above sea level).',
      'longest river': 'The Nile River in Africa is the longest (6,650 km), flowing through 11 countries.',
      'largest ocean': 'The Pacific Ocean is the largest, covering about one-third of Earth\'s surface.',
      'largest continent': 'Asia is the largest continent, covering about 30% of Earth\'s land area.',
      'capital of': (country) => {
        const capitals = {
          'usa': 'Washington D.C.', 'united states': 'Washington D.C.',
          'uk': 'London', 'united kingdom': 'London',
          'france': 'Paris', 'germany': 'Berlin', 'italy': 'Rome',
          'spain': 'Madrid', 'japan': 'Tokyo', 'china': 'Beijing',
          'india': 'New Delhi', 'russia': 'Moscow', 'brazil': 'Brasília',
          'australia': 'Canberra', 'canada': 'Ottawa', 'mexico': 'Mexico City'
        };
        for (const [key, capital] of Object.entries(capitals)) {
          if (lower.includes(key)) return capital;
        }
        return null;
      }
    };
    
    // Check for capital city questions
    if (lower.includes('capital')) {
      const capital = geographyFacts['capital of']();
      if (capital) {
        return `The capital is ${capital}.\n\nRegarding "${prompt}": ${capital} is the political and administrative center. Would you like to know more about this city?`;
      }
    }
    
    for (const [key, value] of Object.entries(geographyFacts)) {
      if (typeof value === 'string' && lower.includes(key)) {
        return `${value}\n\nFor "${prompt}": This is an important geographical fact. Would you like more details?`;
      }
    }
    
    return `Geography question: ${prompt}\n\nGeography covers:\n- Countries, cities, and capitals\n- Continents and oceans\n- Mountains, rivers, and lakes\n- Climate and weather patterns\n- Population and demographics\n- Natural resources\n- Cultural and political geography\n\nI can help with:\n- Location and facts about places\n- Physical features\n- Climate information\n- Population statistics\n- Cultural information\n\nWhat specific place or geographical feature would you like to know about?`;
  }

  function answerGeneralKnowledgeQuestion(prompt, lower) {
    return `General knowledge: ${prompt}\n\nI can help answer questions about:\n\n📚 Knowledge Topics:\n- Science and nature\n- History and culture\n- Geography and places\n- Mathematics and logic\n- Technology and innovation\n- Arts and literature\n- Sports and entertainment\n- Food and cuisine\n- Health and wellness\n- Business and economics\n- Philosophy and religion\n- Current events\n\nFor "${prompt}":\n\nLet me provide a comprehensive answer:\n\n1. **Definition/Overview**: The core concept or topic\n2. **Key Facts**: Important information and details\n3. **Context**: How it relates to broader knowledge\n4. **Examples**: Real-world applications or instances\n5. **Significance**: Why it matters\n\nWould you like me to focus on a specific aspect, or do you have a more detailed question about this topic?`;
  }

  function answerCurrentEventsQuestion(prompt, lower) {
    return `Current events: ${prompt}\n\nFor questions about current events, news, and recent happenings:\n\n⚠️ Note: My knowledge has a cutoff date, so for the most up-to-date information, I recommend:\n- Checking reliable news sources\n- Visiting news websites\n- Following official announcements\n\nHowever, I can help with:\n- Historical context of current events\n- Background information on topics\n- General knowledge about trends\n- Analysis of ongoing situations (based on my training data)\n\nFor "${prompt}":\n\nI can provide context and background information. For the latest updates, please check current news sources. Would you like historical context or background information on this topic?`;
  }

  function answerTechnologyQuestion(prompt, lower) {
    const techTopics = {
      'ai': 'Artificial Intelligence (AI) enables machines to learn, reason, and make decisions. It includes machine learning, neural networks, and natural language processing.',
      'machine learning': 'Machine Learning is a subset of AI where systems learn from data without explicit programming. Types include supervised, unsupervised, and reinforcement learning.',
      'internet': 'The Internet is a global network connecting billions of devices. It enables communication, information sharing, and services worldwide.',
      'cloud computing': 'Cloud computing delivers computing services (storage, processing, software) over the internet instead of local servers.',
      'blockchain': 'Blockchain is a distributed ledger technology that records transactions securely and transparently, used in cryptocurrencies and beyond.'
    };
    
    for (const [key, answer] of Object.entries(techTopics)) {
      if (lower.includes(key)) {
        return `${answer}\n\nRegarding "${prompt}": This technology is rapidly evolving. Would you like to know more about applications, benefits, or how it works?`;
      }
    }
    
    return `Technology question: ${prompt}\n\nTechnology covers:\n- Computers and software\n- Internet and networking\n- Mobile devices and apps\n- Artificial Intelligence and Machine Learning\n- Cloud computing\n- Cybersecurity\n- Data science\n- Emerging technologies\n\nI can explain:\n- How technologies work\n- Their applications and uses\n- Benefits and challenges\n- Current trends\n- Future possibilities\n\nWhat specific technology or concept would you like to learn about?`;
  }

  function answerHealthQuestion(prompt, lower) {
    return `Health question: ${prompt}\n\n⚠️ Important: I'm an AI assistant and cannot provide medical diagnosis or treatment advice. Always consult healthcare professionals for medical concerns.\n\nHowever, I can provide general information about:\n- Health and wellness topics\n- Nutrition and diet\n- Exercise and fitness\n- Common health concepts\n- Medical terminology\n- General health education\n\nFor "${prompt}":\n\nI can share general educational information, but please consult a doctor for:\n- Medical diagnoses\n- Treatment recommendations\n- Medication advice\n- Personal health concerns\n\nWould you like general information about this health topic?`;
  }

  function answerArtsQuestion(prompt, lower) {
    return `Arts & Literature question: ${prompt}\n\nThe arts include:\n- Literature: Novels, poetry, plays, stories\n- Visual Arts: Painting, sculpture, drawing, photography\n- Performing Arts: Music, theater, dance, film\n- Architecture and design\n\nI can discuss:\n- Famous works and artists\n- Literary techniques and styles\n- Art movements and periods\n- Cultural significance\n- Analysis and interpretation\n\nFor "${prompt}":\n\nWhat specific aspect would you like to explore - the work itself, the artist/author, the style, or the cultural context?`;
  }

  function answerSportsQuestion(prompt, lower) {
    return `Sports question: ${prompt}\n\nSports include:\n- Team sports: Football, basketball, soccer, baseball\n- Individual sports: Tennis, golf, swimming, running\n- Olympic sports\n- Professional leagues and competitions\n\nI can provide information about:\n- Rules and gameplay\n- Famous athletes and teams\n- Championships and records\n- History and evolution\n- Techniques and strategies\n\nFor "${prompt}":\n\nWhat would you like to know - rules, history, players, or recent events?`;
  }

  function answerFoodQuestion(prompt, lower) {
    return `Food & Cooking question: ${prompt}\n\nFood topics include:\n- Recipes and cooking techniques\n- Cuisines from different cultures\n- Nutrition and healthy eating\n- Ingredients and their uses\n- Food history and traditions\n- Dietary preferences and restrictions\n\nI can help with:\n- Cooking methods and tips\n- Recipe explanations\n- Nutritional information\n- Cultural food traditions\n- Ingredient substitutions\n\nFor "${prompt}":\n\nWould you like a recipe, cooking tips, nutritional info, or cultural context?`;
  }

  function answerBusinessQuestion(prompt, lower) {
    return `Business & Economics question: ${prompt}\n\nBusiness topics include:\n- Companies and corporations\n- Markets and trade\n- Finance and investment\n- Economics and economic systems\n- Entrepreneurship\n- Management and leadership\n\nI can explain:\n- Business concepts and strategies\n- Economic principles\n- Market dynamics\n- Financial terms\n- Industry trends\n\nFor "${prompt}":\n\nWhat specific aspect would you like to understand - concepts, current trends, or how things work?`;
  }

  function answerPhilosophyQuestion(prompt, lower) {
    return `Philosophy & Religion question: ${prompt}\n\nPhilosophy explores:\n- Ethics and morality\n- Existence and reality\n- Knowledge and truth\n- Logic and reasoning\n- Meaning and purpose\n\nReligion covers:\n- Major world religions\n- Beliefs and practices\n- Sacred texts\n- Spiritual concepts\n\nI can discuss:\n- Philosophical concepts and thinkers\n- Religious beliefs and practices\n- Ethical questions\n- Existential topics\n\nFor "${prompt}":\n\nWhat would you like to explore - concepts, historical context, or different perspectives?`;
  }

  function answerEducationQuestion(prompt, lower) {
    return `Education question: ${prompt}\n\nEducation topics include:\n- Learning methods and strategies\n- Study techniques\n- Academic subjects\n- Educational systems\n- Skills development\n- Memory and cognition\n\nI can help with:\n- Study tips and techniques\n- Subject explanations\n- Learning strategies\n- Academic concepts\n- Problem-solving approaches\n\nFor "${prompt}":\n\nWould you like study tips, concept explanations, or learning strategies?`;
  }

  function provideIntelligentGeneralAnswer(prompt, lower) {
    // Analyze question structure
    const questionWords = {
      'what': 'definition, explanation, or description',
      'who': 'person, group, or entity',
      'where': 'location or place',
      'when': 'time, date, or period',
      'why': 'reason, cause, or explanation',
      'how': 'process, method, or procedure',
      'which': 'choice or selection',
      'can': 'possibility or capability',
      'should': 'recommendation or advice',
      'is': 'fact or verification'
    };
    
    let questionType = 'general inquiry';
    for (const [word, type] of Object.entries(questionWords)) {
      if (lower.startsWith(word + ' ') || lower.includes(' ' + word + ' ')) {
        questionType = type;
        break;
      }
    }
    
    return `Question: "${prompt}"\n\nI understand you're asking about: ${questionType}\n\nLet me provide a comprehensive answer:\n\n📖 **Understanding Your Question**:\nYour question relates to: ${prompt}\n\n💡 **My Response**:\n\nBased on the topic "${prompt}", here's what I can tell you:\n\n1. **Core Information**: The fundamental facts and concepts\n2. **Key Details**: Important aspects and specifics\n3. **Context**: How it relates to broader knowledge\n4. **Practical Applications**: Real-world relevance\n5. **Additional Insights**: Related information that might be helpful\n\n🔍 **To give you the best answer, could you**:\n- Provide more specific details about what you want to know?\n- Clarify any particular aspect you're interested in?\n- Share any context that might be relevant?\n\nI'm here to help answer questions about ANY topic - programming, science, history, math, general knowledge, and more! What would you like to know?`;
  }

  function analyzePythonError(prompt) {
    const commonErrors = {
      'indentation': 'IndentationError: Python uses 4 spaces (or tabs consistently) for indentation. Make sure all code blocks are properly indented.',
      'syntax': 'SyntaxError: Check for missing colons (:), unmatched parentheses/brackets, or incorrect operator usage.',
      'name': 'NameError: The variable/function name is not defined. Check spelling, scope, or if you forgot to define it.',
      'type': 'TypeError: You\'re using a wrong data type. Check if you\'re mixing strings/numbers or calling methods on wrong types.',
      'attribute': 'AttributeError: The object doesn\'t have that method/attribute. Check the object type and available methods.',
      'index': 'IndexError: List/string index out of range. Check the length before accessing indices.',
      'key': 'KeyError: Dictionary key doesn\'t exist. Use .get() method or check if key exists first.',
      'import': 'ImportError: Module not found. Check if module is installed (pip install) or if path is correct.',
      'value': 'ValueError: Wrong value type for the operation. Check input types and ranges.',
      'zero': 'ZeroDivisionError: Cannot divide by zero. Add a check before division.'
    };
    
    for (const [key, msg] of Object.entries(commonErrors)) {
      if (prompt.toLowerCase().includes(key)) {
        return `${msg}\n\nFor your specific case: ${prompt}\n\nTry: 1) Read the full error message - it shows the file and line number. 2) Check that line for the issue. 3) Use print() to debug variable values. 4) Test with simpler code first.`;
      }
    }
    
    return `To debug your Python error: ${prompt}\n\n1. Read the complete error message - it tells you the error type, file, and line number.\n2. Check that specific line for syntax issues (missing colons, brackets, indentation).\n3. Use print() statements to see variable values at different points.\n4. Check if variables are initialized before use.\n5. Verify imports are correct and modules are installed.\n6. Test with minimal code to isolate the problem.`;
  }

  function providePythonSolution(prompt) {
    return `Here's how to approach "${prompt}" in Python:\n\n1. Break down the problem into smaller functions.\n2. Use Python's built-in functions and libraries when possible.\n3. Follow PEP 8 style guidelines.\n4. Handle edge cases and errors.\n5. Test with different inputs.\n\nExample structure:\n\ndef solve_problem(input_data):\n    # Validate input\n    if not input_data:\n        return None\n    \n    # Process data\n    result = process(input_data)\n    \n    # Return result\n    return result\n\nWould you like a more specific code example?`;
  }

  function explainPythonConcept(prompt) {
    return `Python concept: ${prompt}\n\nPython is a high-level, interpreted language known for:\n- Simple, readable syntax\n- Dynamic typing\n- Rich standard library\n- Strong community support\n\nKey features:\n- Indentation-based blocks (no braces)\n- List comprehensions for concise code\n- Generators for memory efficiency\n- Decorators for function enhancement\n- Context managers (with statements)\n\nFor your specific question, Python likely has a built-in solution or a popular library. Can you provide more details?`;
  }

  function analyzeJSError(prompt) {
    return `JavaScript error debugging for: ${prompt}\n\nCommon issues:\n1. Undefined/null errors: Check if variables are initialized\n2. Type errors: Verify data types match expectations\n3. Scope issues: Check let/const/var usage\n4. Async errors: Ensure promises are handled with await/.then()\n5. DOM errors: Verify elements exist before accessing\n\nDebugging steps:\n1. Open browser DevTools (F12)\n2. Check Console tab for error messages\n3. Use console.log() to track variable values\n4. Use debugger statement or breakpoints\n5. Check Network tab for failed requests\n\nFor your specific error, check the browser console for the exact error message and stack trace.`;
  }

  function provideJSSolution(prompt) {
    return `JavaScript solution for: ${prompt}\n\nModern JavaScript approach:\n- Use const/let instead of var\n- Arrow functions: const func = () => {}\n- Template literals: \`Hello ${variable}\`\n- Destructuring: const {prop} = obj\n- Async/await for promises\n- Array methods: map, filter, reduce\n\nExample structure:\n\nconst solution = async (input) => {\n  try {\n    // Validate input\n    if (!input) throw new Error('Invalid input');\n    \n    // Process\n    const result = await processData(input);\n    \n    return result;\n  } catch (error) {\n    console.error('Error:', error);\n    throw error;\n  }\n};\n\nNeed more specific help?`;
  }

  function explainJSConcept(prompt) {
    return `JavaScript concept: ${prompt}\n\nJavaScript is versatile:\n- Runs in browsers and Node.js\n- Prototype-based OOP\n- First-class functions\n- Event-driven and asynchronous\n\nKey concepts:\n- Closures: Functions remember their scope\n- Hoisting: Variable/function declarations moved to top\n- This binding: Context-dependent\n- Promises/Async: Handle asynchronous operations\n- Modules: ES6 import/export\n\nWhat specific aspect would you like to know more about?`;
  }

  function provideJavaHelp(prompt) {
    return `Java help for: ${prompt}\n\nJava is object-oriented:\n- Everything is in classes\n- Strong typing (static types)\n- Platform-independent (JVM)\n- Rich standard library\n\nCommon patterns:\n- Use proper access modifiers (public/private/protected)\n- Handle exceptions with try-catch-finally\n- Follow naming conventions (PascalCase for classes)\n- Use interfaces for abstraction\n- Leverage Collections framework\n\nFor your question, check:\n1. Proper class structure\n2. Method signatures match\n3. Exception handling\n4. Import statements\n5. Access modifiers\n\nNeed more specific guidance?`;
  }

  function provideCppHelp(prompt) {
    return `C++ help for: ${prompt}\n\nC++ is powerful:\n- Low-level control\n- Object-oriented + procedural\n- Manual memory management\n- High performance\n\nBest practices:\n- Use smart pointers (unique_ptr, shared_ptr)\n- RAII (Resource Acquisition Is Initialization)\n- Const correctness\n- Use STL containers and algorithms\n- Avoid raw pointers when possible\n\nFor your question:\n1. Check memory management\n2. Verify pointer validity\n3. Check for null pointers\n4. Review compiler errors carefully\n5. Use valgrind for memory leaks\n\nWhat specific issue are you facing?`;
  }

  function explainAlgorithm(prompt) {
    return `Algorithm explanation: ${prompt}\n\nKey concepts:\n- Time complexity: How runtime grows with input size (O(n), O(log n), etc.)\n- Space complexity: Memory usage\n- Optimization: Balance between time and space\n\nCommon approaches:\n- Divide and conquer: Break into subproblems\n- Dynamic programming: Store results of subproblems\n- Greedy: Make locally optimal choices\n- Two pointers: Process from both ends\n- Sliding window: Process contiguous subarrays\n\nFor your specific algorithm question, consider:\n1. What's the input/output?\n2. What's the time/space constraint?\n3. Can you break it into smaller problems?\n4. Are there overlapping subproblems?\n\nWant a specific algorithm explained?`;
  }

  function explainDataStructure(prompt) {
    return `Data structure: ${prompt}\n\nCommon structures:\n- Array/List: O(1) access, O(n) insert/delete\n- Linked List: O(n) access, O(1) insert/delete\n- Hash Map/Dict: O(1) average access/insert/delete\n- Tree: O(log n) operations (balanced)\n- Stack: LIFO, O(1) push/pop\n- Queue: FIFO, O(1) enqueue/dequeue\n\nChoose based on:\n- Access patterns (random vs sequential)\n- Insert/delete frequency\n- Memory constraints\n- Ordering requirements\n\nFor your question about "${prompt}", consider what operations you need most frequently.`;
  }

  function provideDebuggingHelp(prompt) {
    return `Debugging help for: ${prompt}\n\nSystematic approach:\n1. Reproduce the error consistently\n2. Read error messages completely (they show file/line)\n3. Check recent changes (what did you modify?)\n4. Isolate the problem (comment out code sections)\n5. Use print/logging to trace execution\n6. Check inputs and outputs at each step\n7. Test with minimal examples\n8. Use a debugger (breakpoints, step through)\n\nCommon causes:\n- Typos in variable/function names\n- Missing brackets/parentheses/braces\n- Wrong data types\n- Uninitialized variables\n- Off-by-one errors in loops\n- Logic errors in conditions\n\nFor "${prompt}", start by checking the exact error message and the line it points to.`;
  }

  function explainConcept(prompt) {
    return `Explanation: ${prompt}\n\nThis is an important programming concept. Let me break it down:\n\n1. Definition: The core idea and purpose\n2. How it works: The mechanism behind it\n3. When to use: Practical applications\n4. Examples: Real-world usage\n5. Benefits: Why it's useful\n6. Trade-offs: Limitations or considerations\n\nFor "${prompt}", I'd recommend:\n- Reading official documentation\n- Looking at code examples\n- Practicing with small projects\n- Understanding the underlying principles\n\nWould you like me to explain a specific aspect in more detail?`;
  }

  function provideStepByStepGuide(prompt) {
    return `Step-by-step guide for: ${prompt}\n\n1. Understand the goal: What exactly do you want to achieve?\n2. Research: Look up documentation, examples, tutorials\n3. Plan: Break into smaller, manageable steps\n4. Setup: Prepare your environment (install tools, create files)\n5. Implement: Code each step incrementally\n6. Test: Verify each step works before moving on\n7. Debug: Fix issues as they arise\n8. Refine: Improve and optimize\n9. Document: Comment your code\n10. Review: Check if it meets requirements\n\nFor "${prompt}", start with step 1 - clearly define what you want to accomplish. Then we can work through each step.`;
  }

  function explainWhy(prompt) {
    return `Why: ${prompt}\n\nUnderstanding the "why" is crucial:\n\n1. Fundamental principles: What underlying concepts apply?\n2. Design decisions: What trade-offs were made?\n3. Best practices: What do experts recommend and why?\n4. Context: How does it fit in the bigger picture?\n5. Alternatives: What other approaches exist and why this one?\n\nFor "${prompt}", the reason typically involves:\n- Performance considerations\n- Maintainability and readability\n- Language/paradigm conventions\n- Historical context\n- Practical constraints\n\nUnderstanding the "why" helps you make better decisions in similar situations.`;
  }

  function provideCodeImprovement(prompt) {
    return `Code improvement for: ${prompt}\n\nBest practices:\n1. Readability: Clear names, consistent style, comments\n2. DRY: Don't Repeat Yourself - extract common code\n3. Single Responsibility: Functions should do one thing\n4. Error handling: Validate inputs, handle edge cases\n5. Performance: Optimize bottlenecks, not everything\n6. Testing: Write tests for critical paths\n7. Documentation: Explain "why", code shows "how"\n8. Refactoring: Improve structure without changing behavior\n\nFor "${prompt}", consider:\n- Can you simplify the logic?\n- Are there repeated patterns to extract?\n- Is error handling adequate?\n- Can you make it more readable?\n- Are there performance issues?\n\nShare your code for specific suggestions!`;
  }

  function provideGeneralAnswer(prompt) {
    return `Regarding "${prompt}":\n\nI'm here to help with programming questions! Here's how I can assist:\n\n- Explain programming concepts\n- Help debug code errors\n- Provide code examples\n- Suggest best practices\n- Guide algorithm design\n- Explain data structures\n- Help with specific languages\n\nTo get the best help:\n1. Be specific about what you're trying to do\n2. Share error messages if any\n3. Include relevant code snippets\n4. Explain what you've already tried\n\nWhat would you like to know more about?`;
  }

  appendMessage(
    "ai",
    "Hi! I'm your AI assistant. I can answer questions about ANYTHING - programming, science, history, math, geography, general knowledge, technology, and more! Ask me anything!"
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    appendMessage("user", value);
    input.value = "";

    // Show loading indicator
    appendMessage("ai", "Thinking...");
    const loadingMsg = chat.lastElementChild;

    try {
      const response = await generateResponse(value);
      // Remove loading message and add actual response
      if (loadingMsg && loadingMsg.parentNode) {
        loadingMsg.remove();
      }
      appendMessage("ai", response);
    } catch (error) {
      if (loadingMsg && loadingMsg.parentNode) {
        loadingMsg.remove();
      }
      appendMessage("ai", "I apologize, but I encountered an error. Please try again or rephrase your question. Error: " + error.message);
    }
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

