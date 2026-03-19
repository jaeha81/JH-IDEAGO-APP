#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo "========================================"
echo "  IDEAGO APK Build Script"
echo "========================================"
echo ""

# --- Check Node.js ---
if ! command -v node &> /dev/null; then
  error "Node.js is not installed. Install Node.js 18+ from https://nodejs.org"
fi
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  error "Node.js 18+ required. Current: $(node -v)"
fi
log "Node.js $(node -v)"

# --- Check npm ---
if ! command -v npm &> /dev/null; then
  error "npm is not installed."
fi
log "npm $(npm -v)"

# --- Check Android SDK ---
if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
  warn "ANDROID_HOME / ANDROID_SDK_ROOT not set."
  warn "Android Studio must be installed for APK builds."
  warn "Set ANDROID_HOME to your SDK path (e.g. ~/Android/Sdk)"
  SKIP_GRADLE=true
else
  ANDROID_SDK="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
  log "Android SDK: $ANDROID_SDK"
  SKIP_GRADLE=false
fi

# --- Check npx cap availability ---
if ! command -v npx &> /dev/null; then
  error "npx not found. Ensure npm 5.2+ is installed."
fi

# --- Install dependencies if needed ---
echo ""
echo "--- Installing dependencies ---"
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  npm install
  log "Dependencies installed"
else
  log "node_modules exists, skipping install"
fi

# --- Next.js static export build ---
echo ""
echo "--- Building Next.js static export ---"
npx next build
if [ ! -d "$FRONTEND_DIR/out" ]; then
  error "Build failed: 'out' directory not created. Check next.config.js has output: 'export'"
fi
log "Next.js build complete (out/)"

# --- Capacitor sync ---
echo ""
echo "--- Syncing Capacitor ---"
if [ ! -d "$FRONTEND_DIR/android" ]; then
  warn "Android platform not added yet. Running: npx cap add android"
  npx cap add android
  log "Android platform added"
fi
npx cap sync android
log "Capacitor sync complete"

# --- Gradle build (optional) ---
echo ""
if [ "$SKIP_GRADLE" = true ]; then
  warn "Skipping Gradle build (no Android SDK found)"
  echo ""
  echo "To build the APK manually:"
  echo "  1. Open Android Studio: npx cap open android"
  echo "  2. Build > Build Bundle(s) / APK(s) > Build APK(s)"
  echo ""
else
  echo "--- Building debug APK ---"
  ANDROID_DIR="$FRONTEND_DIR/android"
  if [ -f "$ANDROID_DIR/gradlew" ]; then
    cd "$ANDROID_DIR"
    chmod +x gradlew
    ./gradlew assembleDebug
    APK_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
    if [ -f "$APK_PATH" ]; then
      log "APK built: $APK_PATH"
      echo ""
      echo "========================================"
      echo "  APK ready: $APK_PATH"
      echo "========================================"
    else
      error "Gradle build succeeded but APK not found at expected path"
    fi
  else
    warn "gradlew not found. Open in Android Studio: npx cap open android"
  fi
fi

echo ""
log "Done!"
