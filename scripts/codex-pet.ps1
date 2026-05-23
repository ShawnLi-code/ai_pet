param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path
& "$PSScriptRoot\Start-PetServer.ps1" -ProjectRoot $projectRoot

$config = Get-Content (Join-Path $projectRoot "config\agents.json") -Raw | ConvertFrom-Json
$codexPath = $config.codexPath

if (-not (Test-Path $codexPath)) {
  throw "Codex executable not found: $codexPath. Update config\agents.json."
}

Invoke-RestMethod -Method Post -Uri "http://localhost:$($config.petPort)/event" -ContentType "application/json" -Body (@{
  agent = "codex"
  event = "started"
  status = "Codex started"
  cwd = (Get-Location).Path
} | ConvertTo-Json) | Out-Null

& $codexPath @Args

Invoke-RestMethod -Method Post -Uri "http://localhost:$($config.petPort)/event" -ContentType "application/json" -Body (@{
  agent = "codex"
  event = "done"
  status = "Codex exited"
  cwd = (Get-Location).Path
} | ConvertTo-Json) | Out-Null
