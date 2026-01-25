# Script để fix và chạy container ebay-api

Write-Host "=== Step 1: Check Docker Desktop ===" -ForegroundColor Cyan
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker Desktop chưa chạy!" -ForegroundColor Red
    Write-Host "Vui lòng mở Docker Desktop và đợi nó khởi động xong" -ForegroundColor Yellow
    exit 1
}
Write-Host "Docker Desktop OK" -ForegroundColor Green

Write-Host "`n=== Step 2: Stop existing containers ===" -ForegroundColor Cyan
docker-compose down

Write-Host "`n=== Step 3: Check .env file ===" -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
POSTGRES_DB=ebay
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host ".env file created" -ForegroundColor Green
} else {
    Write-Host ".env file exists" -ForegroundColor Green
}

Write-Host "`n=== Step 4: Build and start containers ===" -ForegroundColor Cyan
docker-compose up --build -d

Write-Host "`n=== Step 5: Check container status ===" -ForegroundColor Cyan
Start-Sleep -Seconds 5
docker-compose ps

Write-Host "`n=== Step 6: Show API logs ===" -ForegroundColor Cyan
docker-compose logs api --tail 50

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "API should be running at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Swagger UI: http://localhost:5000/swagger" -ForegroundColor Cyan
