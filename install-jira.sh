#!/bin/bash
set -e

REPO="ShpetimA/atlassian-cli"
BINARY="jc"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
case "$OS" in
  darwin) OS="darwin" ;;
  linux) OS="linux" ;;
  mingw*|msys*|cygwin*) OS="windows" ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
  x86_64|amd64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

# Build artifact name
if [ "$OS" = "windows" ]; then
  ARTIFACT="${BINARY}-${OS}-${ARCH}.exe"
else
  ARTIFACT="${BINARY}-${OS}-${ARCH}"
fi

# Get latest release tag for jc
LATEST_TAG=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases" | grep -o '"tag_name": "jc-v[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$LATEST_TAG" ]; then
  echo "Error: Could not find latest jc release"
  exit 1
fi

URL="https://github.com/${REPO}/releases/download/${LATEST_TAG}/${ARTIFACT}"

echo "Downloading ${BINARY} (${LATEST_TAG}) for ${OS}-${ARCH}..."
mkdir -p "$INSTALL_DIR"

if [ "$OS" = "windows" ]; then
  curl -fsSL "$URL" -o "${INSTALL_DIR}/${BINARY}.exe"
else
  curl -fsSL "$URL" -o "${INSTALL_DIR}/${BINARY}"
  chmod +x "${INSTALL_DIR}/${BINARY}"
fi

echo ""
echo "Installed ${BINARY} to ${INSTALL_DIR}/${BINARY}"

# Check if in PATH
if [[ ":$PATH:" != *":${INSTALL_DIR}:"* ]]; then
  echo ""
  echo "Add to PATH: export PATH=\"\$PATH:${INSTALL_DIR}\""
fi
