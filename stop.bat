@echo off
chcp 65001 >nul 2>&1
title 换换(HuanHuan) - 停止所有服务

echo 正在停止所有换换服务...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5850.*LISTENING"') do (
    echo 停止前端 (PID=%%a)
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3050.*LISTENING"') do (
    echo 停止后端 (PID=%%a)
    taskkill /f /pid %%a >nul 2>&1
)

taskkill /f /fi "WINDOWTITLE eq 换换-穿透*" >nul 2>&1
echo 停止 cpolar 穿透

echo.
echo 所有服务已停止
timeout /t 2 >nul
