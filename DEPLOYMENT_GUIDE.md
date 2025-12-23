# 🚀 Deployment Guide

## Production Deployment Options

### Option 1: Heroku (Recommended for Beginners)

#### Prerequisites:
- Heroku account (free)
- Heroku CLI installed

#### Steps:

1. **Install Heroku CLI**
   ```powershell
   # Download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```powershell
   heroku login
   ```

3. **Create Heroku App**
   ```powershell
   cd 'd:\Bitflow_softwares\LMS\Sai_care_group\CNE'
   heroku create sai-care-cne-registration
   ```

4. **Add MongoDB Atlas** (Free Cloud Database)
   - Go to: https://www.mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string
   - Add to Heroku config:
   ```powershell
   heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/saicare_cne"
   heroku config:set SESSION_SECRET="YourProductionSecretKey123!@#"
   heroku config:set NODE_ENV="production"
   ```

5. **Deploy**
   ```powershell
   git init
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

6. **Open App**
   ```powershell
   heroku open
   ```

---

### Option 2: Vercel + Railway

#### Frontend (Vercel):
1. Push code to GitHub
2. Import to Vercel
3. Configure build settings

#### Backend (Railway):
1. Go to: https://railway.app
2. New Project → Deploy from GitHub
3. Add MongoDB plugin
4. Set environment variables
5. Deploy

---

### Option 3: DigitalOcean / AWS EC2

#### Prerequisites:
- VPS with Ubuntu
- SSH access
- Domain name (optional)

#### Setup Steps:

1. **Connect to Server**
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install MongoDB**
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

4. **Upload Project**
   ```bash
   # On your local machine
   scp -r . root@your-server-ip:/var/www/cne-registration
   ```

5. **Install Dependencies**
   ```bash
   cd /var/www/cne-registration
   npm install --production
   ```

6. **Setup PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name cne-registration
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx (Reverse Proxy)**
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/cne-registration
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/cne-registration /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Setup SSL (Let's Encrypt)**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🔧 Production Configuration

### Update .env for Production:

```env
PORT=3000
NODE_ENV=production

# MongoDB Cloud (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saicare_cne

# Strong Session Secret (Generate random)
SESSION_SECRET=Use-A-Very-Strong-Random-Secret-Here-Min-32-Chars

# Admin Credentials (Change if needed)
ADMIN_USERNAME=saicaregroupofinstitues
ADMIN_PASSWORD=bHAGIRATH@2025?.

# Registration Limits
MAX_REGISTRATIONS=500
MAX_DOWNLOADS_PER_USER=2

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads/payments
```

### Generate Strong Session Secret:
```powershell
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔐 Security Checklist for Production

- [ ] Change SESSION_SECRET to random strong value
- [ ] Enable HTTPS/SSL
- [ ] Update MongoDB credentials
- [ ] Set NODE_ENV=production
- [ ] Configure firewall rules
- [ ] Setup automated backups
- [ ] Enable MongoDB authentication
- [ ] Add monitoring (e.g., PM2, New Relic)
- [ ] Setup error logging (e.g., Sentry)
- [ ] Configure CORS properly
- [ ] Add helmet.js for security headers
- [ ] Setup rate limiting per route
- [ ] Regular security updates

---

## 📊 MongoDB Atlas Setup (Free Cloud Database)

1. **Create Account**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Sign up for free

2. **Create Cluster**
   - Choose Free Tier (M0)
   - Select region closest to your users
   - Create cluster (takes 3-5 minutes)

3. **Create Database User**
   - Database Access → Add New User
   - Choose password authentication
   - Set username and strong password

4. **Configure Network Access**
   - Network Access → Add IP Address
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add specific IPs

5. **Get Connection String**
   - Clusters → Connect → Connect Your Application
   - Copy connection string
   - Replace `<password>` with your password
   - Add to .env as MONGODB_URI

---

## 🔄 Continuous Deployment (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "sai-care-cne-registration"
        heroku_email: "your-email@example.com"
```

---

## 📱 Domain Configuration

### Update Admin Email (Optional):

Add email notification feature:
```javascript
// Install nodemailer
npm install nodemailer

// In server.js
const nodemailer = require('nodemailer');

// Configure email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

// Send notification on registration
transporter.sendMail({
  from: 'noreply@saicaregroup.com',
  to: 'admin@saicaregroup.com',
  subject: 'New CNE Registration',
  text: `New registration from ${fullName}`
});
```

---

## 🎯 Post-Deployment Testing

1. **Test Registration Form**
   - Submit new registration
   - Verify in database

2. **Test View Page**
   - Lookup existing registration
   - Download PDF

3. **Test Admin Panel**
   - Login
   - View dashboard
   - Download Excel

4. **Test on Mobile**
   - Open on phone
   - Test all features

5. **Load Testing**
   - Use tools like Apache Bench or Artillery
   - Test with multiple concurrent users

---

## 📈 Monitoring Setup

### Using PM2 Dashboard:
```bash
pm2 plus
# Follow instructions to setup monitoring
```

### Using Uptime Robot (Free):
- Go to: https://uptimerobot.com
- Add HTTP monitor
- Get alerts if site goes down

---

## 💾 Backup Strategy

### Database Backups:
```bash
# Manual backup
mongodump --uri="mongodb+srv://..." --out=/backups/$(date +%Y%m%d)

# Setup cron job for automated backups
crontab -e
# Add: 0 2 * * * mongodump --uri="..." --out=/backups/$(date +%Y%m%d)
```

### File Backups:
```bash
# Backup uploads folder
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

---

## 🆘 Troubleshooting Production Issues

### Check Logs:
```bash
# PM2 logs
pm2 logs cne-registration

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services:
```bash
# Restart app
pm2 restart cne-registration

# Restart Nginx
sudo systemctl restart nginx

# Restart MongoDB
sudo systemctl restart mongod
```

---

## 📞 Support & Maintenance

### Regular Tasks:
- Weekly: Check logs for errors
- Monthly: Update dependencies
- Quarterly: Security audit
- Annually: Review and optimize

---

**🚀 Your application is ready for production deployment!**

Choose the deployment option that best fits your needs and budget.
