# 🚀 UPLOAD TO EC2 - STEP 2

# YOU NEED TO FILL IN YOUR EC2 IP ADDRESS HERE
$EC2_IP = "YOUR_EC2_PUBLIC_IP_HERE"  # ⚠️ CHANGE THIS!

Write-Host "`n=== UPLOADING TO EC2 ===`n" -ForegroundColor Cyan

# Fix permissions on key file
$keyPath = "c:\Bitflow Software\CNE\saicaregroup_CNE\cne-key.pem"
Write-Host "Setting key file permissions..." -ForegroundColor Yellow
icacls $keyPath /inheritance:r
icacls $keyPath /grant:r "$($env:USERNAME):(R)"

# Upload deployment package
$zipPath = "c:\Bitflow Software\CNE\cne-deployment.zip"

Write-Host "`nUploading deployment package to EC2..." -ForegroundColor Yellow
Write-Host "This may take a few minutes depending on your internet speed..." -ForegroundColor Gray

scp -i $keyPath $zipPath ubuntu@${EC2_IP}:~/cne-deployment.zip

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Upload successful!" -ForegroundColor Green
    Write-Host "`n=== NEXT STEP ===`n" -ForegroundColor Cyan
    Write-Host "Run: .\03-deploy-on-ec2.ps1" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Upload failed!" -ForegroundColor Red
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. You updated EC2_IP in this script" -ForegroundColor White
    Write-Host "  2. Your EC2 instance is running" -ForegroundColor White
    Write-Host "  3. Security group allows SSH (port 22)" -ForegroundColor White
}
