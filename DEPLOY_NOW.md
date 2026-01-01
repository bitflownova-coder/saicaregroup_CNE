# 🚀 DEPLOY CNE SYSTEM TO AWS - QUICK START

You have the **cne-key.pem** which suggests you might already have an EC2 instance.

## OPTION 1: Deploy to Existing EC2 Instance (Recommended if you have one)

### Step 1: Secure Your Key File
```powershell
# Set proper permissions on key file
icacls "cne-key.pem" /inheritance:r
icacls "cne-key.pem" /grant:r "$($env:USERNAME):(R)"
```

### Step 2: Connect to Your EC2 Instance
```powershell
# Replace YOUR_EC2_IP with your actual EC2 public IP
ssh -i "cne-key.pem" ubuntu@YOUR_EC2_IP
```

### Step 3: Setup Server (On EC2 Instance)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 4: Upload Your Project
```powershell
# On your local machine (PowerShell)
cd "c:\Bitflow Software\CNE"

# Create a zip of the project
Compress-Archive -Path "saicaregroup_CNE\*" -DestinationPath "cne-app.zip" -Force

# Upload to EC2 (replace YOUR_EC2_IP)
scp -i "saicaregroup_CNE\cne-key.pem" cne-app.zip ubuntu@YOUR_EC2_IP:~/
```

### Step 5: Deploy on EC2
```bash
# On EC2 instance
cd ~
unzip cne-app.zip -d cne-app
cd cne-app

# Install dependencies
npm install --production

# Create .env file
nano .env
```

**Paste this in .env:**
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/saicaregroup_cne
SESSION_SECRET=YOUR_GENERATED_SECRET_HERE
ADMIN_USERNAME=saicaregroupofinstitues
ADMIN_PASSWORD=bHAGIRATH@2025?.
MAX_REGISTRATIONS=500
MAX_DOWNLOADS_PER_USER=2
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads/payments
```

**Generate strong session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output and replace YOUR_GENERATED_SECRET_HERE above
```

### Step 6: Create uploads directory
```bash
mkdir -p uploads/payments
chmod 755 uploads/payments
```

### Step 7: Start with PM2
```bash
# Start the application
pm2 start server.js --name cne-app

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it gives you (starts with sudo)
```

### Step 8: Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cne-app
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads {
        alias /home/ubuntu/cne-app/uploads;
    }

    location /assest {
        alias /home/ubuntu/cne-app/assest;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/cne-app /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 9: Configure Firewall
```bash
# Allow HTTP and HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Step 10: Done! ✅
Your site is now live at: **http://YOUR_EC2_IP**

---

## OPTION 2: Deploy Using AWS Elastic Beanstalk

### Prerequisites
```powershell
# Install EB CLI
pip install awsebcli --upgrade --user

# Verify installation
eb --version
```

### Step 1: Initialize Git (if not already)
```powershell
cd "c:\Bitflow Software\CNE\saicaregroup_CNE"
git init
git add .
git commit -m "Initial commit for deployment"
```

### Step 2: Initialize Elastic Beanstalk
```powershell
eb init

# Follow prompts:
# - Select region (e.g., us-east-1)
# - Create new application: sai-care-cne
# - Platform: Node.js
# - Use SSH: Yes (select cne-key.pem)
```

### Step 3: Create MongoDB Atlas (Free Cloud Database)
1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up and create FREE M0 cluster
3. Create database user
4. Add IP: 0.0.0.0/0 (allow all)
5. Get connection string (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/saicaregroup_cne
   ```

### Step 4: Create Environment
```powershell
# Create production environment
eb create sai-care-cne-prod --instance-type t2.micro
```

### Step 5: Set Environment Variables
```powershell
# Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set all environment variables
eb setenv NODE_ENV=production
eb setenv PORT=8080
eb setenv MONGODB_URI="YOUR_MONGODB_ATLAS_URI_HERE"
eb setenv SESSION_SECRET="YOUR_GENERATED_SECRET_HERE"
eb setenv ADMIN_USERNAME="saicaregroupofinstitues"
eb setenv ADMIN_PASSWORD="bHAGIRATH@2025?."
eb setenv MAX_REGISTRATIONS=500
```

### Step 6: Deploy
```powershell
eb deploy
```

### Step 7: Open Your Application
```powershell
# Open in browser
eb open

# Check status
eb status
```

---

## Quick Commands

### Check Application Status
```bash
pm2 status
pm2 logs cne-app
```

### Restart Application
```bash
pm2 restart cne-app
```

### Update Application
```bash
cd ~/cne-app
git pull  # if using git
npm install
pm2 restart cne-app
```

### Check MongoDB
```bash
mongosh
use saicaregroup_cne
db.registrations.countDocuments()
```

---

## ⚠️ IMPORTANT NOTES

1. **Replace Placeholders:**
   - YOUR_EC2_IP
   - YOUR_DOMAIN_OR_IP
   - YOUR_MONGODB_ATLAS_URI_HERE
   - YOUR_GENERATED_SECRET_HERE

2. **Security:**
   - Change admin password before going live
   - Use HTTPS (install Let's Encrypt SSL)
   - Keep MongoDB credentials secure

3. **Backup:**
   - Setup regular MongoDB backups
   - Backup uploads folder

---

## Need Help?

Run these diagnostic commands:
```bash
# Check if app is running
pm2 status

# Check logs
pm2 logs cne-app

# Check Nginx
sudo systemctl status nginx

# Check MongoDB
sudo systemctl status mongod
```
