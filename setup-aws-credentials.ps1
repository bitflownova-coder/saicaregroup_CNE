# AWS Credentials Setup Script
# Helps configure AWS credentials for Elastic Beanstalk deployment

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AWS CREDENTIALS SETUP" -ForegroundColor Green
Write-Host "  CNE Registration System" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "This script will help you configure AWS credentials.`n" -ForegroundColor Yellow

# Check if AWS CLI is installed
Write-Host "Checking for AWS CLI..." -ForegroundColor Yellow
$awsVersion = aws --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ AWS CLI not found!" -ForegroundColor Red
    Write-Host "`nInstall AWS CLI from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    Write-Host "Or use: winget install Amazon.AWSCLI`n" -ForegroundColor Cyan
    exit 1
}
Write-Host "✅ AWS CLI found: $awsVersion`n" -ForegroundColor Green

# Guide user
Write-Host "📋 To get your AWS credentials:" -ForegroundColor Cyan
Write-Host "1. Go to AWS Console: https://console.aws.amazon.com/" -ForegroundColor White
Write-Host "2. Click your username → Security Credentials" -ForegroundColor White
Write-Host "3. Create Access Key → CLI" -ForegroundColor White
Write-Host "4. Download and copy the Access Key ID and Secret Access Key`n" -ForegroundColor White

Write-Host "⚠️  IMPORTANT: Never share your AWS credentials!" -ForegroundColor Red
Write-Host "Keep them secure and don't commit them to git.`n" -ForegroundColor Yellow

# Prompt for credentials
Write-Host "Enter your AWS credentials:`n" -ForegroundColor Cyan

$accessKeyId = Read-Host "AWS Access Key ID"
$secretAccessKey = Read-Host "AWS Secret Access Key" -AsSecureString
$secretAccessKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretAccessKey))

Write-Host "`nSelect your preferred region:" -ForegroundColor Cyan
Write-Host "1. us-east-1 (US East - N. Virginia)" -ForegroundColor White
Write-Host "2. us-west-2 (US West - Oregon)" -ForegroundColor White
Write-Host "3. eu-west-1 (Europe - Ireland)" -ForegroundColor White
Write-Host "4. ap-south-1 (Asia Pacific - Mumbai)" -ForegroundColor White
Write-Host "5. Custom region" -ForegroundColor White

$regionChoice = Read-Host "`nEnter choice (1-5)"

$region = switch ($regionChoice) {
    "1" { "us-east-1" }
    "2" { "us-west-2" }
    "3" { "eu-west-1" }
    "4" { "ap-south-1" }
    "5" { Read-Host "Enter region code (e.g., us-east-1)" }
    default { "us-east-1" }
}

Write-Host "`n⏳ Configuring AWS credentials..." -ForegroundColor Yellow

# Configure AWS
$env:AWS_ACCESS_KEY_ID = $accessKeyId
$env:AWS_SECRET_ACCESS_KEY = $secretAccessKeyPlain
$env:AWS_DEFAULT_REGION = $region

# Save to AWS credentials file
$awsDir = "$env:USERPROFILE\.aws"
if (-not (Test-Path $awsDir)) {
    New-Item -ItemType Directory -Path $awsDir | Out-Null
}

$credentialsFile = "$awsDir\credentials"
$configFile = "$awsDir\config"

# Write credentials
@"
[default]
aws_access_key_id = $accessKeyId
aws_secret_access_key = $secretAccessKeyPlain
"@ | Out-File -FilePath $credentialsFile -Encoding UTF8

# Write config
@"
[default]
region = $region
output = json
"@ | Out-File -FilePath $configFile -Encoding UTF8

Write-Host "✅ AWS credentials configured successfully!`n" -ForegroundColor Green

# Test credentials
Write-Host "Testing credentials..." -ForegroundColor Yellow
$testResult = aws sts get-caller-identity 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Credentials verified!`n" -ForegroundColor Green
    Write-Host "Account information:" -ForegroundColor Cyan
    Write-Host $testResult
} else {
    Write-Host "❌ Failed to verify credentials. Please check and try again.`n" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Setup MongoDB Atlas: https://www.mongodb.com/cloud/atlas" -ForegroundColor White
Write-Host "2. Run: .\deploy-aws.ps1" -ForegroundColor White
Write-Host "3. Follow the deployment wizard`n" -ForegroundColor White
