const pet = document.querySelector("#pet");
const statusEl = document.querySelector("#status");
const detailEl = document.querySelector("#detail");
const agentsEl = document.querySelector("#agents");

function moodFor(eventName) {
  const normalized = String(eventName || "").toLowerCase();
  if (normalized.includes("fail") || normalized.includes("error")) return "error";
  if (normalized.includes("pass") || normalized.includes("done") || normalized.includes("complete")) return "happy";
  if (normalized.includes("approval") || normalized.includes("wait")) return "waiting";
  if (normalized.includes("start") || normalized.includes("run") || normalized.includes("edit") || normalized.includes("tool")) return "working";
  return "idle";
}

function render(state) {
  const agents = Object.values(state.agents || {});
  const latest = state.lastEvent;

  if (!latest) {
    pet.dataset.mood = "idle";
    statusEl.textContent = "Idle";
    detailEl.textContent = "Waiting for Claude Code or Codex.";
  } else {
    pet.dataset.mood = moodFor(latest.event);
    statusEl.textContent = latest.status;
    detailEl.textContent = `${latest.agent} - ${latest.event}`;
  }

  agentsEl.innerHTML = agents
    .map((agent) => {
      const cwd = agent.cwd ? `<span>${agent.cwd}</span>` : "";
      return `<article class="agent"><strong>${agent.agent}</strong><span>${agent.status}</span>${cwd}</article>`;
    })
    .join("");
}

async function loadState() {
  const response = await fetch("/state");
  render(await response.json());
}

function connect() {
  const socket = new WebSocket(`ws://${location.host}`);
  socket.addEventListener("message", (message) => {
    const payload = JSON.parse(message.data);
    render(payload.state);
  });
  socket.addEventListener("close", () => {
    setTimeout(connect, 1500);
  });
}

loadState();
connect();
