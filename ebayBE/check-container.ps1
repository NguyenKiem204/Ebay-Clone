# Script để check lỗi container ebay-api

Write-Host "=== Checking Docker Desktop ===" -ForegroundColor Cyan
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Desktop chưa chạy hoặc không có quyền truy cập!" -ForegroundColor Red
    Write-Host "Vui lòng:" -ForegroundColor Yellow
    Write-Host "1. Mở Docker Desktop" -ForegroundColor Yellow
    Write-Host "2. Đợi Docker Desktop khởi động hoàn toàn" -ForegroundColor Yellow
    Write-Host "3. Chạy lại script này" -ForegroundColor Yellow
    exit 1
}

Write-Host "Docker Desktop đang chạy" -ForegroundColor Green

Write-Host "`n=== Checking Docker containers ===" -ForegroundColor Cyan
docker ps -a --filter "name=ebay"

Write-Host "`n=== Checking ebay-api status ===" -ForegroundColor Cyan
$status = docker inspect ebay-api --format='{{.State.Status}}' 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Container ebay-api không tồn tại!" -ForegroundColor Red
    Write-Host "Chạy: docker-compose up -d để tạo container" -ForegroundColor Yellow
} else {
    Write-Host "Status: $status" -ForegroundColor $(if ($status -eq "running") { "Green" } else { "Red" })
    
    if ($status -ne "running") {
        Write-Host "`n=== Last 100 lines of logs ===" -ForegroundColor Yellow
        docker logs ebay-api --tail 100
    } else {
        Write-Host "`n=== Recent logs (last 20 lines) ===" -ForegroundColor Cyan
        docker logs ebay-api --tail 20
    }
}

Write-Host "`n=== Checking docker-compose services ===" -ForegroundColor Cyan
docker-compose ps
