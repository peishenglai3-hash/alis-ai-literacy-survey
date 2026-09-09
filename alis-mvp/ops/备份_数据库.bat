@echo off
chcp 65001 >nul
REM ============================================================
REM ALIS 数据库自动备份脚本（v3.12）
REM 每日通过 Windows 任务计划程序 (schtasks) 调用
REM 备份方式：PowerShell sqlite3 VACUUM INTO → 滚动保留 14 天
REM ============================================================
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "DB_PATH=%SCRIPT_DIR%..\backend\alis_local.db"
set "BACKUP_DIR=%SCRIPT_DIR%..\backups"
set "RETENTION_DAYS=14"

if not exist "%DB_PATH%" (
  echo [跳过] 数据库文件不存在：%DB_PATH%
  exit /b 0
)

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM 时间戳格式：YYYY-MM-DD_HHMM
for /f "tokens=1-5 delims=/: " %%a in ('echo %date% %time%') do (
  set "TS=%%a-%%b-%%c_%%d%%e"
)
REM 确保时间戳不含空格（中文日期格式兼容）
set "TS=%TS: =0%"

set "BACKUP_FILE=%BACKUP_DIR%\alis_%TS%.sqlite"

echo [%date% %time%] ALIS 数据库备份中...
echo   源: %DB_PATH%
echo   目标: %BACKUP_FILE%

REM 使用 sqlite3 在线 VACUUM INTO（事务一致、不阻塞写、WAL 安全）
sqlite3 -readonly "%DB_PATH%" "VACUUM INTO '%BACKUP_FILE%'"

if errorlevel 1 (
  echo [失败] 备份出错，请检查 sqlite3 是否在 PATH 中
  exit /b 1
)

echo [完成] 备份已保存：%BACKUP_FILE%

REM 清理超过保留期的旧备份
forfiles /p "%BACKUP_DIR%" /m "alis_*.sqlite" /d -%RETENTION_DAYS% /c "cmd /c del @file" 2>nul
if %errorlevel% equ 0 echo [清理] 已删除 %RETENTION_DAYS% 天前的旧备份

endlocal
