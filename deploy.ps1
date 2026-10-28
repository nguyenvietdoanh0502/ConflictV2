# ==============================================================================
# Script One-Click Deploy cho UniSync (ConflictV2)
# Su dung tren Windows PowerShell
# ==============================================================================
param (
    [Parameter(Mandatory=$false, Position=0)]
    [ValidateSet("backend", "ai", "bridge", "frontend", "all")]
    [string]$Target = "backend",

    [string]$DockerUser = "vietdoanh",
    [string]$Ec2Ip = "47.131.217.255",
    [string]$PemKey = "E:\Pem\unisync-key.pem"
)

$ErrorActionPreference = "Stop"

function Print-Header($text) {
    Write-Host "`n==========================================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Cyan
}

function Run-SshCommand($cmd) {
    Write-Host "[SSH -> EC2] Dang thuc thi: $cmd" -ForegroundColor Gray
    ssh -i "$PemKey" -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL ubuntu@$Ec2Ip "cd /home/ubuntu/unisync && $cmd"
}

# 1. FRONTEND
if ($Target -eq "frontend" -or $Target -eq "all") {
    Print-Header "TRIEN KHAI FRONTEND (Vercel qua Git Push)"
    Write-Host "[1/2] Dang git commit & push len GitHub..." -ForegroundColor Green
    git add frontend/
    git commit -m "Deploy frontend update $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -q
    git push origin main
    Write-Host "[2/2] Da push len GitHub thanh cong! Vercel se tu dong build va cap nhat trong ~1 phut." -ForegroundColor Green
    Write-Host "Kiem tra tien trinh tai: https://vercel.com/dashboard" -ForegroundColor Gray
}

# 2. BACKEND
if ($Target -eq "backend" -or $Target -eq "all") {
    Print-Header "TRIEN KHAI BACKEND (Spring Boot)"
    Write-Host "[1/3] Dang build Docker image cho backend..." -ForegroundColor Green
    docker build -t "$DockerUser/unisync-backend:latest" ./backend
    
    Write-Host "[2/3] Dang push image len Docker Hub..." -ForegroundColor Green
    docker push "$DockerUser/unisync-backend:latest"
    
    Write-Host "[3/3] Dang cap nhat va khoi dong lai backend tren EC2..." -ForegroundColor Green
    Run-SshCommand "sudo docker compose -f docker-compose.prod.yml pull backend && sudo docker compose -f docker-compose.prod.yml up -d backend"
    Write-Host "[OK] Backend da duoc cap nhat thanh cong tren server!" -ForegroundColor Green
}

# 3. AI ENGINE
if ($Target -eq "ai" -or $Target -eq "all") {
    Print-Header "TRIEN KHAI AI ENGINE (FastAPI)"
    Write-Host "[1/3] Dang build Docker image cho AI engine..." -ForegroundColor Green
    docker build -t "$DockerUser/unisync-ai:latest" ./ai
    
    Write-Host "[2/3] Dang push image len Docker Hub..." -ForegroundColor Green
    docker push "$DockerUser/unisync-ai:latest"
    
    Write-Host "[3/3] Dang cap nhat va khoi dong lai AI tren EC2..." -ForegroundColor Green
    Run-SshCommand "sudo docker compose -f docker-compose.prod.yml pull ai-engine && sudo docker compose -f docker-compose.prod.yml up -d ai-engine"
    Write-Host "[OK] AI Engine da duoc cap nhat thanh cong tren server!" -ForegroundColor Green
}

# 4. ZALO BRIDGE
if ($Target -eq "bridge" -or $Target -eq "all") {
    Print-Header "TRIEN KHAI ZALO BRIDGE (Node.js)"
    Write-Host "[1/3] Dang build Docker image cho Zalo Bridge..." -ForegroundColor Green
    docker build -t "$DockerUser/unisync-bridge:latest" ./zalo-bridge
    
    Write-Host "[2/3] Dang push image len Docker Hub..." -ForegroundColor Green
    docker push "$DockerUser/unisync-bridge:latest"
    
    Write-Host "[3/3] Dang cap nhat va khoi dong lai Zalo Bridge tren EC2..." -ForegroundColor Green
    Run-SshCommand "sudo docker compose -f docker-compose.prod.yml pull zalo-bridge && sudo docker compose -f docker-compose.prod.yml up -d zalo-bridge"
    Write-Host "[OK] Zalo Bridge da duoc cap nhat thanh cong tren server!" -ForegroundColor Green
}

Print-Header "HOAN TAT QUA TRINH CAP NHAT"
Write-Host "Moi dich vu da san sang tren san pham live:" -ForegroundColor Green
Write-Host "- Web app: https://conflict-v2.vercel.app" -ForegroundColor Cyan
Write-Host "- Backend API: https://unisync.duckdns.org/api" -ForegroundColor Cyan
Write-Host "- WebSocket: wss://unisync.duckdns.org/ws" -ForegroundColor Cyan
Write-Host "- Zalo Bridge: https://unisync.duckdns.org/zalo" -ForegroundColor Cyan
