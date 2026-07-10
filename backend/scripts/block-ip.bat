@echo off
echo 🛡️  BLOCKING IP ADDRESS 103.165.29.190
echo ======================================
echo.

echo ⚡ Checking if server is running...
node -e "
const http = require('http');
const req = http.get('http://localhost:5000/api/health', (res) => {
  console.log('✅ Server is running');
  process.exit(0);
});
req.on('error', () => {
  console.log('❌ Server is not running on port 5000');
  console.log('💡 Please start the server first with: npm start');
  process.exit(1);
});
req.setTimeout(3000, () => {
  console.log('❌ Server timeout - make sure server is running');
  process.exit(1);
});
"

if %errorlevel% neq 0 (
  echo.
  echo Please start the backend server and try again.
  pause
  exit /b 1
)

echo.
echo 🔒 Blocking IP address...
echo.

node block-ip.js

echo.
echo ✅ IP blocking completed!
echo.
pause
