param(
  [switch]$InstallChocolatey,
  [switch]$SkipDoctor
)

$ErrorActionPreference = 'Stop'

function Has-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Log-Info {
  param([string]$Message)
  Write-Host "[setup] $Message" -ForegroundColor Cyan
}

function Log-Warn {
  param([string]$Message)
  Write-Host "[setup] $Message" -ForegroundColor Yellow
}

function Log-Error {
  param([string]$Message)
  Write-Host "[setup] $Message" -ForegroundColor Red
}

function Install-WithWinget {
  Log-Info "Installing FFmpeg with winget..."
  winget install --id Gyan.FFmpeg -e --source winget --accept-package-agreements --accept-source-agreements
}

function Install-WithChocolatey {
  Log-Info "Installing FFmpeg with Chocolatey..."
  choco install ffmpeg -y
}

function Install-WithScoop {
  Log-Info "Installing FFmpeg with Scoop..."
  scoop install ffmpeg
}

function Install-Chocolatey {
  Log-Warn "Installing Chocolatey because no package manager was found."
  Set-ExecutionPolicy Bypass -Scope Process -Force
  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
  Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

Log-Info "Checking FFmpeg..."

if (Has-Command ffmpeg) {
  $line = (ffmpeg -version | Select-Object -First 1)
  Log-Info "FFmpeg already installed: $line"
} else {
  if (Has-Command winget) {
    Install-WithWinget
  } elseif (Has-Command choco) {
    Install-WithChocolatey
  } elseif (Has-Command scoop) {
    Install-WithScoop
  } elseif ($InstallChocolatey) {
    Install-Chocolatey
    Install-WithChocolatey
  } else {
    Log-Error "No supported package manager found (winget/choco/scoop)."
    Log-Error "Install FFmpeg manually or rerun with -InstallChocolatey."
    exit 3
  }
}

if (-not (Has-Command ffmpeg)) {
  Log-Error "FFmpeg is still not available in PATH. Open a new terminal and retry."
  exit 3
}

$verified = (ffmpeg -version | Select-Object -First 1)
Log-Info "Verified: $verified"

if (-not $SkipDoctor) {
  if (Has-Command sherlock) {
    Log-Info "Running Sherlock doctor..."
    sherlock --plain doctor
  } elseif (Test-Path (Join-Path $PSScriptRoot '..\\bin\\sherlock.js')) {
    Log-Info "Sherlock command not found globally; running local doctor..."
    node (Join-Path $PSScriptRoot '..\\bin\\sherlock.js') --plain doctor
  } else {
    Log-Warn "Sherlock CLI was not found; skipped doctor check."
  }
}

Log-Info "Setup complete."
