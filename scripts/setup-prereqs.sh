#!/usr/bin/env bash
set -euo pipefail

log_info() {
  printf '[setup] %s\n' "$1"
}

log_error() {
  printf '[setup] %s\n' "$1" >&2
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

log_info "Checking FFmpeg..."

if has_cmd ffmpeg; then
  log_info "FFmpeg already installed: $(ffmpeg -version | head -n 1)"
else
  if has_cmd brew; then
    log_info "Installing FFmpeg with Homebrew..."
    brew install ffmpeg
  elif has_cmd apt-get; then
    log_info "Installing FFmpeg with apt..."
    sudo apt-get update
    sudo apt-get install -y ffmpeg
  elif has_cmd dnf; then
    log_info "Installing FFmpeg with dnf..."
    sudo dnf install -y ffmpeg
  elif has_cmd yum; then
    log_info "Installing FFmpeg with yum..."
    sudo yum install -y ffmpeg
  else
    log_error "No supported package manager found (brew/apt/dnf/yum)."
    log_error "Install FFmpeg manually, then rerun this script."
    exit 3
  fi
fi

if ! has_cmd ffmpeg; then
  log_error "FFmpeg is still not available in PATH. Open a new terminal and retry."
  exit 3
fi

log_info "Verified: $(ffmpeg -version | head -n 1)"

if [ "${SKIP_DOCTOR:-0}" != "1" ]; then
  if has_cmd sherlock; then
    log_info "Running Sherlock doctor..."
    sherlock --plain doctor
  elif [ -f "bin/sherlock.js" ]; then
    log_info "Sherlock command not found globally; running local doctor..."
    node bin/sherlock.js --plain doctor
  fi
fi

log_info "Setup complete."
