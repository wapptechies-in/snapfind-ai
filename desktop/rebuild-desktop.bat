@echo off
title Rebuild SnapFind Desktop
echo [SnapFind Desktop] Rebuilding bundle and repacking app.asar...
cd /d "%~dp0"

taskkill /f /im "SnapFind Desktop.exe" 2>nul
taskkill /f /im "electron.exe" 2>nul

echo [1/3] Building renderer and electron...
call npm run build
if %errorlevel% neq 0 (
  echo Build failed!
  pause
  exit /b 1
)

echo [2/3] Packing clean files into app.asar...
if exist staging-asar rmdir /s /q staging-asar
mkdir staging-asar\dist
mkdir staging-asar\dist-electron
xcopy /s /e /y dist\* staging-asar\dist\ >nul
xcopy /s /e /y dist-electron\* staging-asar\dist-electron\ >nul
copy /y package.json staging-asar\package.json >nul
call npx asar pack staging-asar release\win-unpacked\resources\app.asar
rmdir /s /q staging-asar

echo [3/3] Successfully rebuilt and repacked! Launching app...
set ELECTRON_RUN_AS_NODE=
start "" "%~dp0release\win-unpacked\SnapFind Desktop.exe"
