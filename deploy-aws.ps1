# AWS Elastic Beanstalk Deployment Script for CNE Registration System
# Author: Sai Care Group
# Description: Automated deployment to AWS EB

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AWS DEPLOYMENT SCRIPT" -ForegroundColor Green
Write-Host "  CNE Registration System" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if EB CLI is installed
Write-Host "Checking for AWS EB CLI..." -ForegroundColor Yellow
$ebVersion = eb --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ AWS EB CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: pip install awsebcli --upgrade --user" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ EB CLI found: $ebVersion`n" -ForegroundColor Green

# Menu
Write-Host "Select deployment option:" -ForegroundColor Cyan
Write-Host "1. Create new environment (first deployment)" -ForegroundColor White
Write-Host "2. Deploy to existing environment" -ForegroundColor White
Write-Host "3. Set environment variables" -ForegroundColor White
Write-Host "4. View logs" -ForegroundColor White
Write-Host "5. Check status" -ForegroundColor White
Write-Host "6. Open application in browser" -ForegroundColor White
Write-Host "7. Terminate environment" -ForegroundColor White

$choice = Read-Host "`nEnter your choice (1-7)"

switch ($choice) {
    "1" {
        Write-Host "`n🆕 Creating new environment..." -ForegroundColor Yellow
        $envName = Read-Host "Enter environment name (default: sai-care-cne-prod)"
        if ([string]::IsNullOrWhiteSpace($envName)) {
            $envName = "sai-care-cne-prod"
        }
        
        Write-Host "`n⚠️  IMPORTANT: Before deploying, make sure you have:" -ForegroundColor Red
        Write-Host "  ✅ MongoDB Atlas connection string ready" -ForegroundColor Yellow
        Write-Host "  ✅ Strong session secret generated" -ForegroundColor Yellow
        Write-Host "`nContinue? (y/n)" -ForegroundColor Yellow
        $confirm = Read-Host
        
        if ($confirm -eq "y") {
            eb create $envName --instance-type t2.micro
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n✅ Environment created successfully!" -ForegroundColor Green
                Write-Host "`n⚠️  NEXT STEPS:" -ForegroundColor Yellow
                Write-Host "  1. Run this script again and select option 3 to set environment variables" -ForegroundColor White
                Write-Host "  2. Then select option 6 to open your application`n" -ForegroundColor White
            }
        }
    }
    
    "2" {
        Write-Host "`n📤 Deploying to existing environment..." -ForegroundColor Yellow
        eb deploy
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
        }
    }
    
    "3" {
        Write-Host "`n⚙️  Setting environment variables..." -ForegroundColor Yellow
        Write-Host "`n📝 Please provide the following:`n" -ForegroundColor Cyan
        
        # Get MongoDB URI
        $mongoUri = Read-Host "MongoDB Atlas Connection String"
        
        # Generate session secret option
        Write-Host "`n🔐 Generate session secret? (y/n)" -ForegroundColor Yellow
        $genSecret = Read-Host
        
        if ($genSecret -eq "y") {
            $sessionSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
            Write-Host "Generated secret: $sessionSecret" -ForegroundColor Green
        } else {
            $sessionSecret = Read-Host "Session Secret (min 32 characters)"
        }
        
        Write-Host "`n⏳ Setting environment variables..." -ForegroundColor Yellow
        
        eb setenv NODE_ENV=production PORT=8080 `
            MONGODB_URI="$mongoUri" `
            SESSION_SECRET="$sessionSecret" `
            ADMIN_USERNAME="saicaregroupofinstitues" `
            ADMIN_PASSWORD="bHAGIRATH@2025?." `
            MAX_REGISTRATIONS=500 `
            MAX_DOWNLOADS_PER_USER=2 `
            MAX_FILE_SIZE=5242880 `
            UPLOAD_PATH="./uploads/payments"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Environment variables set successfully!" -ForegroundColor Green
        }
    }
    
    "4" {
        Write-Host "`n📋 Fetching logs..." -ForegroundColor Yellow
        eb logs
    }
    
    "5" {
        Write-Host "`n📊 Checking status..." -ForegroundColor Yellow
        eb status
        eb health
    }
    
    "6" {
        Write-Host "`n🌐 Opening application in browser..." -ForegroundColor Yellow
        eb open
    }
    
    "7" {
        Write-Host "`n⚠️  WARNING: This will terminate the environment!" -ForegroundColor Red
        Write-Host "All data on the instance will be lost (MongoDB data is safe in Atlas)" -ForegroundColor Yellow
        $confirm = Read-Host "Are you sure? (yes/no)"
        
        if ($confirm -eq "yes") {
            Write-Host "`n🗑️  Terminating environment..." -ForegroundColor Red
            eb terminate --all
        } else {
            Write-Host "Cancelled." -ForegroundColor Green
        }
    }
    
    default {
        Write-Host "Invalid choice!" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Script complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
