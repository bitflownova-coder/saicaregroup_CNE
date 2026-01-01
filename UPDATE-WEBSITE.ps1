# 🔄 UPDATE LIVE WEBSITE - QUICK PROCESS

# YOUR EC2 IP OR DOMAIN
$EC2_HOST = "YOUR_DOMAIN_OR_IP_HERE"  # e.g., "cne.example.com" or "3.145.78.123"

Write-Host "`n=== UPDATING LIVE WEBSITE ===`n" -ForegroundColor Cyan

# Step 1: Create deployment package
Write-Host "Step 1: Creating deployment package..." -ForegroundColor Yellow

$deployDir = "c:\Bitflow Software\CNE\deploy-update"
if (Test-Path $deployDir) { Remove-Item $deployDir -Recurse -Force }
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Copy only necessary files (exclude node_modules, .git, backups, etc.)
$sourceDir = "c:\Bitflow Software\CNE\saicaregroup_CNE"
$excludeDirs = @("node_modules", ".git", "backups", ".vscode", "deploy-package", "deploy-update")
$excludeFiles = @("*.pem", "*.zip", "DEPLOY_NOW.md", "01-prepare-deployment.ps1", "02-upload-to-ec2.ps1", "03-deploy-on-ec2.ps1", "03-deploy-script.sh")

Get-ChildItem -Path $sourceDir -Exclude $excludeFiles | Where-Object { 
    $excludeDirs -notcontains $_.Name 
} | Copy-Item -Destination $deployDir -Recurse -Force

Write-Host "✅ Package created" -ForegroundColor Green

# Step 2: Create zip
Write-Host "`nStep 2: Creating zip file..." -ForegroundColor Yellow
$zipPath = "c:\Bitflow Software\CNE\cne-update.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$deployDir\*" -DestinationPath $zipPath -Force
Write-Host "✅ Zip created: $zipPath" -ForegroundColor Green

# Step 3: Upload to server
Write-Host "`nStep 3: Uploading to server..." -ForegroundColor Yellow
$keyPath = "c:\Bitflow Software\CNE\saicaregroup_CNE\cne-key.pem"

# Fix key permissions
icacls $keyPath /inheritance:r | Out-Null
icacls $keyPath /grant:r "$($env:USERNAME):(R)" | Out-Null

scp -i $keyPath $zipPath ubuntu@${EC2_HOST}:~/cne-update.zip

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Upload failed!" -ForegroundColor Red
    Write-Host "Make sure $EC2_HOST is correct" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Files uploaded" -ForegroundColor Green

# Step 4: Run update on server
Write-Host "`nStep 4: Updating application on server..." -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor Gray
Write-Host "  - Backup current version" -ForegroundColor Gray
Write-Host "  - Extract new files" -ForegroundColor Gray
Write-Host "  - Install dependencies" -ForegroundColor Gray
Write-Host "  - Restart application" -ForegroundColor Gray
Write-Host ""

ssh -i $keyPath ubuntu@${EC2_HOST} @"
echo '=== Updating CNE Application ==='
cd ~

# Backup current version
if [ -d ~/cne-app ]; then
    echo 'Backing up current version...'
    cp -r ~/cne-app ~/cne-app-backup-\$(date +%Y%m%d-%H%M%S)
    echo '✅ Backup created'
fi

# Extract new files
echo 'Extracting new files...'
cd ~/cne-app
unzip -o ~/cne-update.zip

# Preserve .env file (don't overwrite)
if [ -f ~/cne-app-backup-*/. env ]; then
    cp ~/cne-app-backup-*/.env ~/cne-app/.env
fi

# Install/update dependencies
echo 'Installing dependencies...'
npm install --production

# Restart application
echo 'Restarting application...'
pm2 restart cne-app

# Wait for app to start
sleep 3

# Check status
echo ''
echo '=== Application Status ==='
pm2 status cne-app
echo ''
echo '✅ Update complete!'
echo ''
echo 'Your website has been updated!'
echo 'Check it at: http://\$(curl -s ifconfig.me)'
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n`n========================================" -ForegroundColor Green
    Write-Host "  ✅ UPDATE SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    Write-Host "Your website has been updated!" -ForegroundColor Cyan
    Write-Host "`nCheck your site at: http://$EC2_HOST`n" -ForegroundColor Yellow
    
    # Cleanup
    Write-Host "Cleaning up temporary files..." -ForegroundColor Gray
    Remove-Item $deployDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "`n❌ Update failed!" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Yellow
}
"@
