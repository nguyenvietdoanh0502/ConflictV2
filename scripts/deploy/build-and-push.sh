#!/usr/bin/env bash
# ==============================================================================
# Build và Push Docker Images cho UniSync (Bash / Linux / MacOS / WSL)
# ==============================================================================

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "[!] Cách dùng: ./build-and-push.sh <dockerhub_username>"
  echo "[!] Ví dụ: ./build-and-push.sh myusername"
  exit 1
fi

USERNAME="$1"

echo "=========================================================="
echo "   Bắt đầu build và push images cho user: ${USERNAME}"
echo "=========================================================="

echo "[1/3] Building Backend Image (Spring Boot Java 17)..."
docker build -t "${USERNAME}/unisync-backend:latest" ./backend

echo "[2/3] Building AI Engine Image (Python FastAPI)..."
docker build -t "${USERNAME}/unisync-ai:latest" ./ai

echo "[3/3] Building Zalo Bridge Image (Node.js)..."
docker build -t "${USERNAME}/unisync-bridge:latest" ./zalo-bridge

echo "=========================================================="
echo "   Pushing images lên Docker Hub..."
echo "=========================================================="
docker push "${USERNAME}/unisync-backend:latest"
docker push "${USERNAME}/unisync-ai:latest"
docker push "${USERNAME}/unisync-bridge:latest"

echo "=========================================================="
echo "   Hoàn tất build và push tất cả images thành công!"
echo "=========================================================="
