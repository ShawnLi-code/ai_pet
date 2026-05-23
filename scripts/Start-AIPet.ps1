$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path

Push-Location $projectRoot
try {
  npm run desktop
} finally {
  Pop-Location
}
