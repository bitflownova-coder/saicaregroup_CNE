# 🚀 DEPLOY TO YOUR EC2 INSTANCE - STEP BY STEP

## Step 1: Prepare Your Local Files

# First, let's prepare the deployment package
Write-Host "`n=== PREPARING DEPLOYMENT PACKAGE ===`n" -ForegroundColor Cyan

# Create deployment directory
$deployDir = "c:\Bitflow Software\CNE\deploy-package"
if (Test-Path $deployDir) { Remove-Item $deployDir -Recurse -Force }
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Copy necessary files (exclude node_modules, .git, etc.)
$sourceDir = "c:\Bitflow Software\CNE\saicaregroup_CNE"
$excludeDirs = @("node_modules", ".git", "backups", ".vscode")

Get-ChildItem -Path $sourceDir | Where-Object { 
    $excludeDirs -notcontains $_.Name 
} | Copy-Item -Destination $deployDir -Recurse -Force

Write-Host "✅ Deployment package created at: $deployDir" -ForegroundColor Green

# Create zip file
$zipPath = "c:\Bitflow Software\CNE\cne-deployment.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$deployDir\*" -DestinationPath $zipPath -Force

Write-Host "✅ Created deployment zip: $zipPath" -ForegroundColor Green
Write-Host "`n📦 Package ready for deployment!" -ForegroundColor Yellow
