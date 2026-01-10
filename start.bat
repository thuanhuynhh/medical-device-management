@echo off
chcp 65001 >nul
title VICAS - Device Management System (Development)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   VICAS - HỆ THỐNG QUẢN LÝ THIẾT BỊ Y TẾ (Development)    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI] Không tìm thấy Node.js!
    echo.
    echo Vui lòng cài đặt Node.js từ: https://nodejs.org
    echo Chọn phiên bản LTS (Long Term Support)
    echo.
    pause
    exit /b 1
)

:: Display Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION%
echo.

:: Install dependencies if needed
if not exist "node_modules" (
    echo Đang cài đặt dependencies...
    call npm install
    echo.
)

:: Check if nport is installed globally
where nport >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠ nport chưa được cài đặt. Đang cài đặt...
    call npm install -g nport
    echo.
)

echo ═══════════════════════════════════════════════════════════════
echo  Đang khởi động server...
echo  Nhấn Ctrl+C để dừng
echo ═══════════════════════════════════════════════════════════════
echo.

node server.js

pause
