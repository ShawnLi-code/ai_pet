import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = normalize(join(__dirname, ".."));
const publicDir = join(rootDir, "public");
const port = Number(process.env.PET_PORT || 4243);

const state = {
  agents: {},
  lastEvent: null,
  startedAt: new Date().toISOString()
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function broadcast(wss, payload) {
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}

function applyEvent(event) {
  const agent = String(event.agent || "unknown");
  const nextEvent = {
    agent,
    event: String(event.event || "status"),
    status: String(event.status || event.event || "Working"),
    cwd: event.cwd ? String(event.cwd) : undefined,
    task: event.task ? String(event.task) : undefined,
    timestamp: new Date().toISOString()
  };

  state.agents[agent] = {
    ...state.agents[agent],
    ...nextEvent
  };
  state.lastEvent = nextEvent;
  return nextEvent;
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  if (body.length > 64 * 1024) {
    throw new Error("Request body is too large");
  }
  return body ? JSON.parse(body) : {};
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = normalize(join(publicDir, requestedPath));

  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] || "application/octet-stream"
    });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/state") {
    sendJson(response, 200, state);
    return;
  }

  if (request.method === "POST" && request.url === "/event") {
    try {
      const event = applyEvent(await readJson(request));
      broadcast(wss, { type: "event", event, state });
      sendJson(response, 202, { ok: true, event });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return;
  }

  await serveStatic(request, response);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "state", state }));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Agent Pet Companion running at http://localhost:${port}`);
});
