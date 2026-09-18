@echo off
chcp 65001 >nul
title GreenShift Platform Launcher
echo ========================================================
echo       GreenShift Platform Launcher
echo ========================================================
echo.
echo Dang khoi dong Backend Python & Web Platform...
echo.

set PYTHON_CMD=python
if exist "%USERPROFILE%\.venv\Scripts\python.exe" (
    set PYTHON_CMD="%USERPROFILE%\.venv\Scripts\python.exe"
) else if exist ".venv\Scripts\python.exe" (
    set PYTHON_CMD=".venv\Scripts\python.exe"
)

start "" http://localhost:5000/cbam-dashboard.html
%PYTHON_CMD% app.py
pause
