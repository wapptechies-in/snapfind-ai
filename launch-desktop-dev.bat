@echo off
title SnapFind AI Desktop (Live Dev Mode)
cd /d "%~dp0desktop"
set ELECTRON_RUN_AS_NODE=
echo Starting SnapFind Desktop in live developer mode with HMR...
npm run dev

