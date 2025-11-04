@echo off
echo Downloading Redis for Windows...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.msi' -OutFile 'Redis-x64.msi'"

echo Installing Redis...
msiexec /i Redis-x64.msi /qn

echo Starting Redis Service...
net start Redis

echo Cleaning up...
del Redis-x64.msi

echo Redis installation complete!
echo You can start Redis manually by running: redis-server
pause