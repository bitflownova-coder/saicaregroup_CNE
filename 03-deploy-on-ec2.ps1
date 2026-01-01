# 🚀 CONNECT TO EC2 AND DEPLOY - STEP 3

# YOU NEED TO FILL IN YOUR EC2 IP ADDRESS HERE
$EC2_IP = "YOUR_EC2_PUBLIC_IP_HERE"  # ⚠️ CHANGE THIS!

Write-Host "`n=== CONNECTING TO EC2 AND DEPLOYING ===`n" -ForegroundColor Cyan

$keyPath = "c:\Bitflow Software\CNE\saicaregroup_CNE\cne-key.pem"
$deployScript = "c:\Bitflow Software\CNE\saicaregroup_CNE\03-deploy-script.sh"

# Upload deploy script
Write-Host "Uploading deployment script..." -ForegroundColor Yellow
scp -i $keyPath $deployScript ubuntu@${EC2_IP}:~/deploy.sh

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Script uploaded" -ForegroundColor Green
    
    Write-Host "`nConnecting to EC2 and running deployment..." -ForegroundColor Yellow
    Write-Host "This will take 5-10 minutes..." -ForegroundColor Gray
    Write-Host ""
    
    # Connect and run deployment
    ssh -i $keyPath ubuntu@${EC2_IP} "chmod +x ~/deploy.sh && ~/deploy.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n`n✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
        Write-Host "`nYour website is now LIVE at:" -ForegroundColor Cyan
        Write-Host "http://$EC2_IP" -ForegroundColor Yellow
        Write-Host "`nRegistration Form: http://$EC2_IP" -ForegroundColor White
        Write-Host "Admin Login: http://$EC2_IP/admin-login" -ForegroundColor White
    }
} else {
    Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
}
