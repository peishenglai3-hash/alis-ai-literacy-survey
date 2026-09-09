@echo off
chcp 65001 >nul
setlocal
REM ==========================================================
REM  ALIS 采集机 · 原始音频 7 天清理
REM  合规要求：原始录音仅本地保存，转写核对后 <=7 天删除。
REM  说明：ALIS 录音只在采集机本地生成（浏览器"另存音频文件"）。
REM        请让促进者统一把音频另存到下面这个固定目录，本脚本按 7 天清理。
REM  建议：用 Windows"任务计划程序"设为每日运行一次本脚本。
REM ==========================================================

REM === 把促进者统一另存音频的目录填在这里（务必修改） ===
set "AUDIO_DIR=【请填写：例如 D:\ALIS录音待转写】"

if not exist "%AUDIO_DIR%" (
  echo [提示] 目录不存在： %AUDIO_DIR%
  echo 请先在本脚本里把 AUDIO_DIR 改为促进者统一另存音频的实际目录。
  pause
  exit /b 1
)

echo 扫描并删除 "%AUDIO_DIR%" 下"修改时间超过 7 天"的文件...
REM /D -7 = 最后修改日期早于 7 天前；/S 递归子目录
forfiles /P "%AUDIO_DIR%" /S /M *.* /D -7 /C "cmd /c del /q @path && echo 已删除 @path" 2>nul

echo.
echo 完成。请到"任务计划程序"新建每日任务指向本脚本，实现自动化。
pause
