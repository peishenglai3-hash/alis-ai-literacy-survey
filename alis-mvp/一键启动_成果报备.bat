@echo off
chcp 65001 >nul
REM ============================================================
REM ALIS 成果报备一键启动：构建前端 dist 后，由后端同源托管为可安装 PWA。
REM 打开 http://127.0.0.1:8000/ 即可（局域网多设备：把下面 127.0.0.1 改成 0.0.0.0）。
REM ============================================================
cd /d "%~dp0frontend"
echo [1/2] 正在构建前端 dist（首次或有改动时需要）...
call npm run build
if errorlevel 1 goto err
cd /d "%~dp0backend"
echo [2/2] 启动集成服务：http://127.0.0.1:8000/  （Ctrl+C 停止）
python -m uvicorn main:app --host 127.0.0.1 --port 8000
goto :eof
:err
echo.
echo 构建失败，请查看上方报错信息。
pause
