@echo off
chcp 65001 >nul 2>&1
title 换换(HuanHuan) - 一键启动

echo ============================================
echo   换换(HuanHuan) B2B 以物换物平台
echo   前端: http://localhost:5850
echo   后端: http://localhost:3050
echo ============================================
echo.

:: ---- 清理旧进程 ----
echo [1/5] 清理残留进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5850.*LISTENING" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3050.*LISTENING" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo   已清理

:: ---- 数据库准备 ----
echo [2/5] 检查数据库...
cd /d "%~dp0packages\server"
call npx prisma generate >nul 2>&1
call npx prisma db push >nul 2>&1
echo   数据库就绪

:: ---- 启动后端 ----
echo [3/5] 启动后端 (端口 3050)...
cd /d "%~dp0packages\server"
start "换换-后端(3050)" /min cmd /c "title 换换-后端(3050) && npx tsx watch src/index.ts"
timeout /t 4 /nobreak >nul

:: ---- 启动前端 ----
echo [4/5] 启动前端 (端口 5850)...
cd /d "%~dp0packages\web"
start "换换-前端(5850)" /min cmd /c "title 换换-前端(5850) && npx vite --host"

:: ---- 等待就绪 ----
echo [5/5] 等待服务就绪...
set RETRIES=0
:wait_loop
timeout /t 1 /nobreak >nul
set /a RETRIES+=1
if %RETRIES% gtr 20 (
    echo   [!] 启动超时，请手动检查
    goto done
)
netstat -ano 2>nul | findstr ":3050.*LISTENING" >nul 2>&1
if errorlevel 1 goto wait_loop
netstat -ano 2>nul | findstr ":5850.*LISTENING" >nul 2>&1
if errorlevel 1 goto wait_loop
echo   前后端就绪!

:: ---- cpolar 穿透 ----
where cpolar >nul 2>&1
if errorlevel 1 (
    echo.
    echo   [!] 未检测到 cpolar，跳过内网穿透
    echo   安装地址: https://www.cpolar.com/
    goto done
)
echo.
echo   重启 cpolar 服务加载隧道...
net stop cpolar >nul 2>&1
timeout /t 2 /nobreak >nul
net start cpolar >nul 2>&1
timeout /t 5 /nobreak >nul
echo   cpolar 隧道已启动

:done
echo.
echo ============================================
echo   启动完成!
echo.
echo   本地前端: http://localhost:5850
echo   本地后端: http://localhost:3050/api
echo.
echo   cpolar 公网地址请访问:
echo   http://localhost:9200 (本地仪表板)
echo   https://dashboard.cpolar.com (在线仪表板)
echo ============================================
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:5850
