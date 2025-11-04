@echo off
echo Starting manga server...

echo Checking Redis...
redis-cli ping > nul 2>&1
if errorlevel 1 (
    echo Starting Redis...
    start /B redis-server
    timeout /t 5
)

echo Starting server with PM2...
cd %~dp0
call pm2 delete all > nul 2>&1
call pm2 start ecosystem.config.json

echo Opening monitoring...
start pm2 monit

echo Server is running!
echo To view logs, use: pm2 logs
echo To monitor, use: pm2 monit
echo To stop server, use: pm2 stop all
pause