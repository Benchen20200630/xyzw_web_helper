@echo off
REM 确保在当前目录执行
cd /d "%~dp0"
echo 当前目录：%cd%

REM 打开新的CMD窗口
start cmd /k "npm install && npm run dev"