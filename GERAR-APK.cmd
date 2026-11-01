@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "PATH=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"
where pnpm >nul 2>nul
if errorlevel 1 if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd" set "PATH=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback;%PATH%"
where node >nul 2>nul
if errorlevel 1 goto missing
where pnpm >nul 2>nul
if errorlevel 1 goto missing
node scripts\gerar-apk.cjs %*
goto end
:missing
echo Instale Node.js 24 e pnpm 10.34.4. Consulte LEIA-ME-PRIMEIRO.txt.
:end
echo.
pause
endlocal
