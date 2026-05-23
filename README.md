# Agent Pet Companion

Local companion UI for Claude Code and Codex. It starts a small local server,
renders a browser-based pet, and accepts status events from wrappers, hooks, or
future MCP integrations.

## Current shape

- `src/server.js`: local HTTP/WebSocket daemon on `localhost:4243`.
- `public/`: pet UI.
- `scripts/claude-pet.ps1`: starts the pet server, then launches real Claude.
- `scripts/codex-pet.ps1`: starts the pet server, then launches real Codex.

## Run

```powershell
npm install
npm start
```

Then open:

```text
http://localhost:4243
```

## Send an event

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4243/event -ContentType application/json -Body '{"agent":"codex","event":"test_passed","status":"Tests passed"}'
```

## Wrapper setup

Edit `config/agents.example.json`, save it as `config/agents.json`, and point
`claudePath` / `codexPath` to the real executables on your machine.

Then run:

```powershell
.\scripts\claude-pet.ps1
.\scripts\codex-pet.ps1
```

Optional PowerShell profile aliases:

```powershell
Set-Alias claude E:\Shawn\micu\agent-pet-companion\scripts\claude-pet.ps1
Set-Alias codex E:\Shawn\micu\agent-pet-companion\scripts\codex-pet.ps1
```

Do not let the wrapper call the alias again; it must call the real executable
path from `config/agents.json`.
