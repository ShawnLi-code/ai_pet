param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path
& "$PSScriptRoot\Start-PetServer.ps1" -ProjectRoot $projectRoot

$config = Get-Content (Join-Path $projectRoot "config\agents.json") -Raw | ConvertFrom-Json
$claudePath = $config.claudePath

if (-not (Test-Path $claudePath)) {
  throw "Claude executable not found: $claudePath. Update config\agents.json."
}

Invoke-RestMethod -Method Post -Uri "http://localhost:$($config.petPort)/event" -ContentType "application/json" -Body (@{
  agent = "claude-code"
  event = "started"
  status = "Claude Code started"
  cwd = (Get-Location).Path
} | ConvertTo-Json) | Out-Null

& $claudePath @Args

Invoke-RestMethod -Method Post -Uri "http://localhost:$($config.petPort)/event" -ContentType "application/json" -Body (@{
  agent = "claude-code"
  event = "done"
  status = "Claude Code exited"
  cwd = (Get-Location).Path
} | ConvertTo-Json) | Out-Null
