@echo off
set timestamp=%date:~10,4%-%date:~4,2%-%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
set backupdir=C:\Users\Ty\Documents\HandOfHateBOT-Backups
mkdir "%backupdir%" >nul 2>&1
xcopy /E /I /Y "C:\Users\Ty\Documents\HandOfHateBOT" "%backupdir%\HandOfHateBOT_%timestamp%"
echo ✅ Backup complete: %backupdir%\HandOfHateBOT_%timestamp%
pause
