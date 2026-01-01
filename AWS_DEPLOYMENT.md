# 🚀 AWS Deployment Guide - Elastic Beanstalk

Complete guide to deploy the CNE Registration System to AWS Elastic Beanstalk.

## Prerequisites

- AWS Account (Free tier eligible)
- MongoDB Atlas account (Free M0 cluster)
- Node.js installed locally
- Git installed

---

## Step 1: Install AWS EB CLI

```powershell
# Install using pip
pip install awsebcli --upgrade --user

# Verify installation
eb --version
```

---

## Step 2: Setup MongoDB Atlas (Free Cloud Database)

1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up and create a free cluster (M0 tier)
3. Create database user with username and password
4. Add IP whitelist: 0.0.0.0/0 (allow from anywhere)
5. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy connection string (looks like: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/)
   - Replace <password> with your actual password
   - Add database name: /saicaregroup_cne

## Step 3: Configure AWS Credentials

```powershell
# Configure AWS credentials
aws configure

# You'll be asked:
# AWS Access Key ID: [Enter your access key]
# AWS Secret Access Key: [Enter your secret key]
# Default region name: us-east-1 (or your preferred region)
# Default output format: json
```

---

## Step 4: Initialize Elastic Beanstalk

```powershell
# Navigate to project directory
cd "c:\Bitflow Software\CNE\saicaregroup_CNE"

# Initialize EB
eb init

# Follow prompts:
# - Select region (e.g., us-east-1)
# - Create new application: yes
# - Application name: sai-care-cne
# - Platform: Node.js
# - Platform version: Latest (Node.js 18+)
# - SSH: Yes (recommended)
```

---

## Step 5: Create Environment and Deploy

```powershell
# Create production environment
eb create sai-care-cne-prod --instance-type t2.micro

# This will:
# 1. Create environment
# 2. Deploy application
# 3. Set up load balancer
# 4. Configure auto-scaling (takes 5-10 minutes)
```

---

## Step 6: Set Environment Variables

```powershell
# Generate strong session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set environment variables (IMPORTANT!)
eb setenv NODE_ENV=production
eb setenv PORT=8080
eb setenv MONGODB_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/saicaregroup_cne?retryWrites=true&w=majority"
eb setenv SESSION_SECRET="YOUR_GENERATED_SECRET_HERE"
eb setenv ADMIN_USERNAME="saicaregroupofinstitues"
eb setenv ADMIN_PASSWORD="bHAGIRATH@2025?."
eb setenv MAX_REGISTRATIONS=500
eb setenv MAX_DOWNLOADS_PER_USER=2
eb setenv MAX_FILE_SIZE=5242880
eb setenv UPLOAD_PATH="./uploads/payments"
```

## Step 7: Open Your Application

```powershell
# Open the deployed application in browser
eb open

# Get application URL
eb status
```

---

## Update/Redeploy Application

```powershell
# After making changes
git add .
git commit -m "Update application"

# Deploy updates
eb deploy

# Check deployment status
eb status
```

---

## Useful Commands

```powershell
# View logs
eb logs

# SSH into instance
eb ssh

# Check environment health
eb health

# Terminate environment (careful!)
eb terminate sai-care-cne-prod
```

---

## Cost Estimate

**Free Tier (First 12 months):**
- t2.micro instance: 750 hours/month (FREE)
- MongoDB Atlas M0: Forever FREE
- Data transfer: 15GB/month (FREE)

**After Free Tier:**
- ~$15-20/month for t2.micro
- MongoDB Atlas M0: Still FREE

---

## Troubleshooting

### Application not starting:
```powershell
eb logs
# Check for errors in logs
```

### Database connection issues:
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check MONGODB_URI environment variable is correct
- Ensure database user has proper permissions

### Upload folder issues:
```powershell
# SSH into server and create upload directory
eb ssh
mkdir -p /var/app/current/uploads/payments
chmod 755 /var/app/current/uploads/payments
exit
```

---

## Security Best Practices

1. ✅ MongoDB Atlas with IP whitelist
2. ✅ Strong session secret (random 32+ chars)
3. ✅ HTTPS enabled by default on EB
4. ✅ Environment variables for secrets (not in code)
5. ⚠️ Change admin password before production
6. ⚠️ Setup automated backups on MongoDB Atlas
7. ⚠️ Enable AWS CloudWatch monitoring

---

## Custom Domain Setup (Optional)

1. Purchase domain
2. In AWS Route 53, create hosted zone
3. Add CNAME record pointing to EB URL
4. Configure EB environment with custom domain

---

## Automated Deployment with GitHub (Optional)

1. Connect GitHub repository to AWS CodePipeline
2. Auto-deploy on push to main branch
3. Setup in AWS Console: CodePipeline → Create Pipeline

---

## Quick Start Summary

```powershell
# 1. Setup MongoDB Atlas and get connection string

# 2. Install EB CLI
pip install awsebcli --upgrade --user

# 3. Initialize and deploy
cd "c:\Bitflow Software\CNE\saicaregroup_CNE"
eb init
eb create sai-care-cne-prod --instance-type t2.micro

# 4. Set environment variables (use your actual values)
eb setenv MONGODB_URI="your-mongodb-atlas-uri"
eb setenv SESSION_SECRET="your-generated-secret"
eb setenv NODE_ENV=production
eb setenv PORT=8080

# 5. Open application
eb open
```

## Support

For issues:
- AWS EB Documentation: https://docs.aws.amazon.com/elasticbeanstalk/
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Check logs: `eb logs`

---

**🎉 Your CNE Registration System is now live on AWS!**
