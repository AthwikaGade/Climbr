const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// === Tab Switching ===
function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(tab => tab.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add("active");
}


async function generateRoadmap() {
  const goal = document.getElementById("goal").value;
  if (!goal) {
    alert("Please enter a career goal");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/roadmap/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal })
    });

    if (!res.ok) throw new Error("Backend not responding");
    const data = await res.json();
    showRoadmap(data.roadmap);

  } catch (err) {
    console.warn("⚠️ Using fake roadmap because API failed:", err);

    const fakeRoadmap = {
      title: "AI Career Roadmap",
      timeline: "24 months",
      details: `
Phase 1 (0–6 months): Learn Python basics, Git, and problem solving.
Phase 2 (6–12 months): Dive into Data Science, SQL, and build 2 projects.
Phase 3 (12–18 months): Master ML frameworks (TensorFlow, PyTorch) + deploy app.
Phase 4 (18–24 months): Specialize in NLP or CV, publish portfolio projects, prep interviews.
      `
    };
    showRoadmap(fakeRoadmap);
  }
}

function showRoadmap(roadmap) {
  const lines = roadmap.details.trim().split("\n");
  let html = "";
  let currentPhase = "";

  lines.forEach(line => {
    if (line.startsWith("###")) {
     
      if (currentPhase) {
        html += "</ul></div>";
      }
      const phaseTitle = line.replace("###", "").trim();
      html += `<div class="roadmap-phase"><h4>${phaseTitle}</h4><ul>`;
      currentPhase = phaseTitle;
    } else if (line.match(/^\d+\./)) {
      
      html += `<li>${line.replace(/^\d+\.\s*/, "")}</li>`;
    } else if (line.startsWith("**")) {
   
      html += `<h5>${line.replace(/\*\*/g, "")}</h5>`;
    } else if (line.trim()) {
      
      html += `<p>${line}</p>`;
    }
  });

  if (currentPhase) {
    html += "</ul></div>";
  }

  document.getElementById("roadmap-result").innerHTML = `
    <h3>${roadmap.title}</h3>
    <p><b>Timeline:</b> ${roadmap.timeline}</p>
    ${html}
  `;
}


async function generateApplication() {
  const jd = document.getElementById("job-desc").value;
  if (!jd) {
    alert("Please paste a job description");
    return;
  }

  const resumeFake = btoa("This is my fake resume text...");

  try {
    const res = await fetch(`${API_BASE_URL}/applications/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_file: resumeFake, job_description: jd })
    });

    if (!res.ok) throw new Error("Backend not responding");
    const data = await res.json();
    showApplication(data.application);

  } catch (err) {
    console.warn("⚠️ Using fake application because API failed:", err);

    const fakeApp = {
      resume: `
- Strong foundation in Python, SQL, and Data Analysis.
- Built machine learning projects (classification, forecasting).
- Skilled in FastAPI, REST APIs, and React for frontend.
      `,
      cover_letter: `
Dear Hiring Manager,

I am excited to apply for this role. With a strong foundation in AI,
hands-on project experience, and dedication to continuous learning,
I am confident in contributing to your team.

Sincerely,
Alex
      `,
      match_score: 85
    };
    showApplication(fakeApp);
  }
}

function showApplication(app) {
  document.getElementById("application-result").innerHTML = `
    <div>
      <strong>📄 Tailored Resume</strong>
      <pre>${app.resume}</pre>
    </div>
    <div>
      <strong>✉️ Cover Letter</strong>
      <pre>${app.cover_letter}</pre>
    </div>
    <p><b>Match Score:</b> ${app.match_score}%</p>
  `;
}

function downloadApplication() {
  const app = document.getElementById("application-result");
  const resumeText = app.querySelector("pre")?.innerText || "Resume";
  const coverText = app.querySelectorAll("pre")[1]?.innerText || "Cover Letter";

  const url = `${API_BASE_URL}/applications/download?resume=${encodeURIComponent(resumeText)}&cover_letter=${encodeURIComponent(coverText)}`;
  window.open(url, "_blank");
}


async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/dashboard`);
    if (!res.ok) throw new Error("Backend not responding");
    const data = await res.json();
    updateDashboard(data.stats);

  } catch (err) {
    console.warn("⚠️ Using fake dashboard because API failed:", err);

    const fakeStats = {
      goals: 4,
      applications: 7,
      focus_hours: 22,
      insights: "📈 Great progress! Next: contribute to open-source."
    };
    updateDashboard(fakeStats);
  }
}

function updateDashboard(stats) {
  document.getElementById("goals-count").innerText = stats.goals;
  document.getElementById("applications-count").innerText = stats.applications;
  document.getElementById("focus-hours").innerText = stats.focus_hours;
}


document.addEventListener("DOMContentLoaded", () => {
  switchTab("dashboard");
  loadDashboard();
});

let timerInterval;
let totalSeconds = 0;
let isRunning = false;

const timerDisplay = document.getElementById("timer-display");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const stopBtn = document.getElementById("stop-btn");
const resetBtn = document.getElementById("reset-btn");

function updateTimerDisplay() {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;

  
  const degrees = (totalSeconds % 3600) * (360 / 3600); // 1 hour = full circle
  timerDisplay.style.background = `conic-gradient(#4f46e5 ${degrees}deg, #e5e7eb 0deg)`;
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.classList.add("hidden");
  pauseBtn.classList.remove("hidden");
  stopBtn.classList.remove("hidden");

  timerInterval = setInterval(() => {
    totalSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
}

function stopTimer() {
  isRunning = false;
  clearInterval(timerInterval);

  
  fetch(`${API_BASE_URL}/focus/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ duration: totalSeconds, notes: "Focus session" })
  });

  document.getElementById("focus-sessions").innerHTML += `
    <p>✅ Session logged: ${Math.floor(totalSeconds/60)} mins ${totalSeconds%60}s</p>
  `;

  totalSeconds = 0;
  updateTimerDisplay();

  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
  stopBtn.classList.add("hidden");
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  totalSeconds = 0;
  updateTimerDisplay();

  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
  stopBtn.classList.add("hidden");
}

// Bind buttons
if (startBtn) startBtn.addEventListener("click", startTimer);
if (pauseBtn) pauseBtn.addEventListener("click", pauseTimer);
if (stopBtn) stopBtn.addEventListener("click", stopTimer);
if (resetBtn) resetBtn.addEventListener("click", resetTimer);

// Initialize display
updateTimerDisplay();
