#!/usr/bin/env bash
# ==============================================================================
# UniSync EC2 Setup Script (Ubuntu 22.04 / 24.04 LTS)
# Tự động hóa: 4GB Swap Memory, Tối ưu Swappiness, Docker, Certbot, Firewall UFW
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "   Bắt đầu cấu hình máy chủ AWS EC2 cho UniSync..."
echo "=========================================================="

if [ "$EUID" -ne 0 ]; then
  echo "[-] Lỗi: Vui lòng chạy script này với quyền root (sudo bash setup-ec2.sh)"
  exit 1
fi

# 1. Cấu hình 4GB Swap Memory (Bắt buộc cho EC2 1GB RAM)
echo "[1/5] Kiểm tra và cấu hình 4GB Swap Memory..."
if grep -q "swapfile" /proc/swaps; then
  echo "    Swap đã tồn tại. Bỏ qua tạo swapfile."
else
  echo "    Đang tạo file swap 4GB tại /swapfile..."
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "    Đã kích hoạt 4GB Swap thành công!"
fi

# 2. Tối ưu hóa Swappiness
echo "[2/5] Tối ưu hóa vm.swappiness = 10..."
sysctl vm.swappiness=10
if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
  echo "vm.swappiness=10" >> /etc/sysctl.conf
fi

# 3. Cập nhật hệ thống và cài đặt Docker & Docker Compose
echo "[3/5] Cài đặt Docker & Docker Compose v2..."
apt-get update -y
apt-get install -y curl ca-certificates gnupg lsb-release certbot

if ! command -v docker &> /dev/null; then
  echo "    Đang tải và cài đặt Docker Engine chính thức..."
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  usermod -aG docker ubuntu || true
  rm -f /tmp/get-docker.sh
  echo "    Cài đặt Docker thành công!"
else
  echo "    Docker đã được cài đặt từ trước."
fi

# 4. Mở tường lửa UFW (Port 22 SSH, 80 HTTP, 443 HTTPS)
echo "[4/5] Cấu hình tường lửa UFW..."
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

# 5. Hoàn tất và hiển thị thông tin
echo "=========================================================="
echo "   Cấu hình máy chủ hoàn tất thành công!"
echo "=========================================================="
echo "Thông số bộ nhớ hiện tại:"
free -h
echo "----------------------------------------------------------"
echo "Phiên bản Docker:"
docker --version
docker compose version
echo "=========================================================="
