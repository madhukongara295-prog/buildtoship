@echo off
title AgriCycle - Agricultural Waste Marketplace
echo ====================================================
echo  Starting AgriCycle Agricultural Waste Marketplace
echo ====================================================

set NODE_EXEC=node
if exist "C:\Users\madhu\.lmstudio\.internal\utils\node.exe" (
  set "NODE_EXEC=C:\Users\madhu\.lmstudio\.internal\utils\node.exe"
)

set DENO_EXEC=deno
if exist "C:\Users\madhu\.lmstudio\.internal\utils\deno.exe" (
  set "DENO_EXEC=C:\Users\madhu\.lmstudio\.internal\utils\deno.exe"
)

echo [1/2] Opening AgriCycle in your browser...
start http://localhost:3000

echo [2/2] Launching AgriCycle server...
if exist "%NODE_EXEC%" (
  "%NODE_EXEC%" server.js
  goto end
)

if exist "%DENO_EXEC%" (
  "%DENO_EXEC%" run --allow-net --allow-read --allow-write server.js
  goto end
)

python -m http.server 3000 --directory public

:end
pause
