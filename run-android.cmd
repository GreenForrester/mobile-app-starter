@echo off
rem Builds the app and runs it on the Android emulator: run-android.cmd [--check] [--clean] [--avd <name>]
rem See scripts\run-android.js for what it does.
where node >nul 2>nul || (
  echo Node.js isn't installed or isn't on PATH. Run setup-windows.cmd, then open a new terminal.
  exit /b 1
)
node "%~dp0scripts\run-android.js" %*
