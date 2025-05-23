@echo off
setlocal

:: الانتقال إلى مجلد المشروع الرئيسي (من داخل مجلد setup)
cd /d "%~dp0\.."

:: تشغيل Laravel (بدون نافذة مرئية)
cd Backend\laravel
start "" /b php artisan serve >nul 2>&1

timeout /t 2 >nul

:: تشغيل React (بدون نافذة مرئية) وتعطيل فتح المتصفح
cd ..\..\frontend\app
set BROWSER=none
start "" /b npm start >nul 2>&1

timeout /t 5 >nul

:: البحث عن Google Chrome
set "CHROME_PATH="
for /f "tokens=3*" %%a in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul') do (
    set "CHROME_PATH=%%a %%b"
)
if not defined CHROME_PATH (
    for /f "tokens=3*" %%a in ('reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul') do (
        set "CHROME_PATH=%%a %%b"
    )
)

:: فتح التطبيق
if defined CHROME_PATH (
    start "" "%CHROME_PATH%" --app=http://localhost:3000
) else (
    start http://localhost:3000
)

endlocal
