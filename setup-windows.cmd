@echo off
rem Installs what this app needs to run on the Android emulator. Safe to run again.
rem See scripts\setup-windows.ps1 for what it installs.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-windows.ps1" %*
