param(
  [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
)

$configPath = Join-Path $ProjectRoot "config\agents.json"
$exampleConfigPath = Join-Path $ProjectRoot "config\agents.example.json"

if (-not (Test-Path $configPath)) {
  Copy-Item $exampleConfigPath $configPath
}

$config = Get-Content $configPath -Raw | ConvertFrom-Json
$port = if ($config.petPort) { [int]$config.petPort } else { 4242 }

try {
  $null = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:$port/state" -TimeoutSec 1
  return
} catch {
  Push-Location $ProjectRoot
  try {
    Start-Process -FilePath "npm" -ArgumentList @("start") -WorkingDirectory $ProjectRoot -WindowStyle Hidden
  } finally {
    Pop-Location
  }
}
