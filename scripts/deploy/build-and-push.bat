@echo off
REM ==============================================================================
REM Build và Push Docker Images cho UniSync (Windows CMD / PowerShell)
REM ==============================================================================

if "%~1"=="" (
    echo [!] Cach dung: build-and-push.bat ^<dockerhub_username^>
    echo [!] Vi du: build-and-push.bat myusername
    exit /b 1
)

set USERNAME=%~1

echo ==========================================================
echo   Bat dau build va push images cho user: %USERNAME%
echo ==========================================================

echo [1/3] Building Backend Image (Spring Boot Java 17)...
docker build -t %USERNAME%/unisync-backend:latest ./backend
if %ERRORLEVEL% NEQ 0 (
    echo [-] Build backend that bai!
    exit /b %ERRORLEVEL%
)

echo [2/3] Building AI Engine Image (Python FastAPI)...
docker build -t %USERNAME%/unisync-ai:latest ./ai
if %ERRORLEVEL% NEQ 0 (
    echo [-] Build AI that bai!
    exit /b %ERRORLEVEL%
)

echo [3/3] Building Zalo Bridge Image (Node.js)...
docker build -t %USERNAME%/unisync-bridge:latest ./zalo-bridge
if %ERRORLEVEL% NEQ 0 (
    echo [-] Build Zalo Bridge that bai!
    exit /b %ERRORLEVEL%
)

echo ==========================================================
echo   Pushing images len Docker Hub...
echo ==========================================================
docker push %USERNAME%/unisync-backend:latest
docker push %USERNAME%/unisync-ai:latest
docker push %USERNAME%/unisync-bridge:latest

echo ==========================================================
echo   Hoan tat build va push tat ca images thanh cong!
echo ==========================================================
