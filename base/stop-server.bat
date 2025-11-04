@echo off
echo Stopping manga server...

echo Stopping PM2 processes...
call pm2 stop all
call pm2 delete all

echo Stopping Redis...
redis-cli shutdown

echo Server stopped!
pause