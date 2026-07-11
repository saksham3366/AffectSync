/**
 * AffectSync Unified Launcher
 * Spawns all three services concurrently:
 *   1. Flask Emotion API (Python, port 5001)
 *   2. Express Backend   (Node,   port 5000)
 *   3. Frontend Server   (Node,   port 4173)
 *
 * Usage: npm run dev   (from d:\NTCC\FED)
 */
const { spawn } = require("child_process");
const path = require("path");

const ROOT = __dirname;

// Color codes for terminal output
const COLORS = {
  flask:    "\x1b[35m",  // Magenta
  backend:  "\x1b[36m",  // Cyan
  frontend: "\x1b[33m",  // Yellow
  reset:    "\x1b[0m",
  red:      "\x1b[31m",
  green:    "\x1b[32m",
};

function prefix(label, color) {
  return `${color}[${label}]${COLORS.reset}`;
}

function pipeOutput(proc, label, color) {
  const tag = prefix(label, color);
  if (proc.stdout) {
    proc.stdout.on("data", (data) => {
      String(data).split("\n").filter(Boolean).forEach((line) => {
        console.log(`${tag} ${line}`);
      });
    });
  }
  if (proc.stderr) {
    proc.stderr.on("data", (data) => {
      String(data).split("\n").filter(Boolean).forEach((line) => {
        console.error(`${tag} ${line}`);
      });
    });
  }
}

const children = [];

function shutdown() {
  console.log(`\n${COLORS.red}[Launcher] Shutting down all services...${COLORS.reset}`);
  children.forEach((child) => {
    try { child.kill("SIGTERM"); } catch {}
  });
  setTimeout(() => process.exit(0), 1500);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ── 1. Flask Emotion API ────────────────────────────────────────────
console.log(`${COLORS.green}[Launcher] Starting AffectSync services...${COLORS.reset}\n`);

const flask = spawn("python", ["emotion_api.py"], {
  cwd: ROOT,
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});
pipeOutput(flask, "Flask", COLORS.flask);
children.push(flask);

flask.on("error", (err) => {
  console.error(`${prefix("Flask", COLORS.flask)} Failed to start: ${err.message}`);
  console.error(`${prefix("Flask", COLORS.flask)} Make sure Python is installed and emotion_api.py dependencies are available.`);
});

// ── 2. Express Backend ──────────────────────────────────────────────
const backend = spawn("node", ["server.js"], {
  cwd: path.join(ROOT, "backend"),
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});
pipeOutput(backend, "Backend", COLORS.backend);
children.push(backend);

backend.on("error", (err) => {
  console.error(`${prefix("Backend", COLORS.backend)} Failed to start: ${err.message}`);
});

// ── 3. Frontend Static Server ───────────────────────────────────────
const frontend = spawn("node", ["server.js"], {
  cwd: path.join(ROOT, "frontendfinalprolly"),
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});
pipeOutput(frontend, "Frontend", COLORS.frontend);
children.push(frontend);

frontend.on("error", (err) => {
  console.error(`${prefix("Frontend", COLORS.frontend)} Failed to start: ${err.message}`);
});

// ── Summary ─────────────────────────────────────────────────────────
setTimeout(() => {
  console.log(`
${COLORS.green}════════════════════════════════════════════════════════${COLORS.reset}
  AffectSync is starting up!

  ${COLORS.flask}Flask Emotion API${COLORS.reset}  →  http://localhost:5001
  ${COLORS.backend}Express Backend${COLORS.reset}    →  http://localhost:5000
  ${COLORS.frontend}Frontend${COLORS.reset}           →  http://localhost:4173

  Open ${COLORS.green}http://localhost:4173${COLORS.reset} in your browser.
  Press Ctrl+C to stop all services.
${COLORS.green}════════════════════════════════════════════════════════${COLORS.reset}
`);
}, 2000);
