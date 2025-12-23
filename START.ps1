# SAI CARE GROUP - CNE Registration System Launcher
# PowerShell Script to start the application

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SAI CARE GROUP OF INSTITUTES" -ForegroundColor Green
Write-Host "  CNE Registration System" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Starting MongoDB and Node.js server...`n" -ForegroundColor Yellow

# Check if MongoDB service exists and start it
Write-Host "Checking MongoDB service..." -ForegroundColor White
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue

if ($mongoService) {
    if ($mongoService.Status -ne "Running") {
        Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
        Start-Service -Name "MongoDB" -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    } else {
        Write-Host "MongoDB is already running." -ForegroundColor Green
    }
} else {
    Write-Host "MongoDB service not found. Make sure MongoDB is installed." -ForegroundColor Yellow
    Write-Host "Continuing anyway (MongoDB might be running as standalone)..." -ForegroundColor Gray
}

Write-Host "`nStarting Node.js server...`n" -ForegroundColor Yellow

# Start the Node.js server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm start" -WindowStyle Normal

# Wait for server to start
Write-Host "Waiting for server to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Open the website in default browser
Write-Host "`nOpening website in browser...`n" -ForegroundColor Yellow
Start-Process "http://localhost:3000"

# Display information
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Website is now running!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "  Registration Form:" -ForegroundColor White
Write-Host "  http://localhost:3000`n" -ForegroundColor Cyan

Write-Host "  View Registration:" -ForegroundColor White
Write-Host "  http://localhost:3000/view-registration`n" -ForegroundColor Cyan

Write-Host "  Admin Panel:" -ForegroundColor White
Write-Host "  http://localhost:3000/admin-login`n" -ForegroundColor Cyan

Write-Host "  Admin Credentials:" -ForegroundColor White
Write-Host "  Username: saicaregroupofinstitues" -ForegroundColor Yellow
Write-Host "  Password: bHAGIRATH@2025?.`n" -ForegroundColor Yellow

Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "The server is running in a separate window." -ForegroundColor Gray
Write-Host "Close that window to stop the server.`n" -ForegroundColor Gray

Write-Host "Press any key to close this window..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
