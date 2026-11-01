@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "ROOT=%CD%"
set "PY=%ROOT%\.venv\Scripts\python.exe"

echo ================================================
echo   Chenguang Agent Platform - One-click Start
echo   Backend : FastAPI   http://127.0.0.1:8080
echo   Frontend: Vue3+Vite http://localhost:5174
echo ================================================
echo.

REM ==================== 1. Check Python ====================
echo [1/5] Checking Python environment ...
set "SYS_PY="
where python >nul 2>&1
if not errorlevel 1 set "SYS_PY=python"
if not defined SYS_PY (
    where py >nul 2>&1
    if not errorlevel 1 set "SYS_PY=py -3"
)
if not defined SYS_PY (
    echo.
    echo [ERROR] Python not found. Install Python 3.10+ and check "Add to PATH".
    echo.
    pause
    exit /b 1
)
echo        Python OK

REM ==================== 2. Virtual environment ====================
if not exist "%PY%" (
    echo [2/5] Creating virtual environment .venv ...
    %SYS_PY% -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create venv.
        pause
        exit /b 1
    )
) else (
    echo [2/5] Virtual environment already exists
)

REM ==================== 3. Backend dependencies ====================
echo [3/5] Checking backend dependencies ...
"%PY%" -c "import fastapi, uvicorn, sqlalchemy, alembic, aiosqlite" >nul 2>&1
if errorlevel 1 (
    echo        Installing backend dependencies, this may take a few minutes ...
    "%PY%" -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Backend dependencies install failed.
        pause
        exit /b 1
    )
) else (
    echo        Backend dependencies ready
)

REM ==================== 4. Initialize database ====================
echo [4/5] Initializing database ...
"%PY%" bootstrap_db.py
if errorlevel 1 (
    echo [ERROR] Database init failed, see log above.
    pause
    exit /b 1
)

REM ==================== 5. Frontend dependencies ====================
echo [5/5] Checking frontend dependencies ...
if not exist "%ROOT%\frontend\node_modules" (
    echo        Installing frontend dependencies, this may take a few minutes ...
    pushd "%ROOT%\frontend"
    call npm.cmd install
    popd
    if errorlevel 1 (
        echo [ERROR] Frontend dependencies install failed.
        pause
        exit /b 1
    )
) else (
    echo        Frontend dependencies ready
)

echo.
echo ================================================
echo   Starting services ...
echo ================================================

REM ---- Start backend ----
call :port_busy 8080
if "!BUSY!"=="1" (
    echo        Port 8080 already in use, backend may be running
) else (
    start "Chenguang-Backend" cmd /k "cd /d ""%ROOT%"" && ""%PY%"" -m uvicorn src.main:app --host 127.0.0.1 --port 8080"
    echo        Backend starting ... http://127.0.0.1:8080
)

REM ---- Start frontend ----
call :port_busy 5174
if "!BUSY!"=="1" (
    echo        Port 5174 already in use, frontend may be running
) else (
    start "Chenguang-Frontend" cmd /k "cd /d ""%ROOT%\frontend"" && npm.cmd run dev"
    echo        Frontend starting ... http://localhost:5174
)

echo.
echo   Waiting for services to be ready ...
"%PY%" wait_ready.py 120

echo.
echo ================================================
echo   Backend API docs : http://localhost:8080/docs
echo   Backend health   : http://localhost:8080/health
echo   Frontend         : http://localhost:5174
echo   Default account  : admin / 123456
echo.
echo   Stop services by closing their console windows.
echo ================================================
echo.
pause
exit /b 0

REM ==================== Subroutine: check port ====================
:port_busy
set "BUSY=0"
netstat -ano | findstr /R /C:":%~1 .*LISTENING" >nul 2>&1
if not errorlevel 1 set "BUSY=1"
exit /b 0
