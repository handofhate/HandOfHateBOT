@echo off
cd /d "%~dp0"

:: =============================================
::       Timestamp for commit message
:: =============================================
for /f "tokens=1-4 delims=/ " %%a in ("%date%") do (
    set yyyy=%%d
    set mm=%%b
    set dd=%%c
)
for /f "tokens=1-2 delims=: " %%a in ("%time%") do (
    set hh=%%a
    set min=%%b
)
set timestamp=%yyyy%-%mm%-%dd% %hh%:%min%

:: =============================================
::       Git commit with timestamp
:: =============================================
git add .
git commit -m "Automated backup: %timestamp%"
git status

:: =============================================
::       Optional version bump + tag
:: =============================================
set /p BUMP=Do you want to bump the version? (y/n): 
if /i "%BUMP%"=="y" (
    set /p NEWVER=Enter new version (e.g. 1.1.2): 
    git tag v%NEWVER%
    echo ✅ Tagged with version: v%NEWVER%
) else (
    echo ❎ Version bump skipped.
)

:: =============================================
::       Final pause to prevent auto-close
:: =============================================
echo.
echo 🔒 All done! Press any key to close this window.
pause >nul
