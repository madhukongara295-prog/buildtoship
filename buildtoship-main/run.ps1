Write-Host "====================================================" -ForegroundColor Green
Write-Host " AgriCycle - Agricultural Waste Marketplace" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Green

$nodePath = "C:\Users\madhu\.lmstudio\.internal\utils\node.exe"
$denoPath = "C:\Users\madhu\.lmstudio\.internal\utils\deno.exe"

Start-Process "http://localhost:3000"

if (Test-Path $nodePath) {
    Write-Host "Starting with Node.js ($nodePath)..." -ForegroundColor Cyan
    & $nodePath server.js
} elseif (Test-Path $denoPath) {
    Write-Host "Starting with Deno ($denoPath)..." -ForegroundColor Cyan
    & $denoPath run --allow-net --allow-read --allow-write server.js
} else {
    Write-Host "Starting with Python http.server..." -ForegroundColor Cyan
    python -m http.server 3000 --directory public
}
