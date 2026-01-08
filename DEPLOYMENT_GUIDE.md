# 🚀 Deployment Guide - CNE Registration System

## Current Production Setup

**Live Website:** https://www.saicaregroupofinstitutes.com  
**Server:** AWS EC2 (eu-north-1 - Stockholm)  
**Instance ID:** i-01fbe111dacd87669  
**Public IP:** 16.171.10.93  
**OS:** Ubuntu (Amazon Linux)  
**Web Server:** Nginx with SSL (Let's Encrypt)  
**Process Manager:** PM2  
**Database:** MongoDB (connected)

---

## 📋 Prerequisites

- **SSH Key:** `cne-2026-key.pem` (keep in safe location!)
- **GitHub:** https://github.com/bitflownova-coder/saicaregroup_CNE
- **AWS Account:** Access to EC2 console
- **Security Group:** Port 22 allowed from your IP (currently: 103.197.75.84/32)

---

## 🔄 Standard Deployment Process

### Step 1: Make Changes Locally

```powershell
# Navigate to project directory
cd "c:\Bitflow Software\CNE\saicaregroup_CNE"

# Make your code changes using VS Code or any editor
# Test locally if needed (requires MongoDB)
```

### Step 2: Commit and Push to GitHub

```powershell
# Add all changes
git add -A

# Commit with descriptive message
git commit -m "Description of changes"

# Push to main branch
git push origin main
```

### Step 3: Deploy to EC2 Server

```powershell
# SSH into server, pull latest code, and restart
ssh -i "c:\Bitflow Software\CNE\cne-2026-key.pem" -o StrictHostKeyChecking=no ubuntu@16.171.10.93 "cd ~/cne-app && git pull origin main && pm2 restart all"
```

**That's it!** Your changes are now live at https://www.saicaregroupofinstitutes.com

---

## 🛠️ Common Management Tasks

### View Application Logs
```powershell
ssh -i "c:\Bitflow Software\CNE\cne-2026-key.pem" ubuntu@16.171.10.93 "pm2 logs --lines 50"
```

### Check Application Status
```powershell
ssh -i "c:\Bitflow Software\CNE\cne-2026-key.pem" ubuntu@16.171.10.93 "pm2 status"
```

### Restart Application
```powershell
ssh -i "c:\Bitflow Software\CNE\cne-2026-key.pem" ubuntu@16.171.10.93 "pm2 restart all"
```

### View Nginx Configuration
```powershell
ssh -i "c:\Bitflow Software\CNE\cne-2026-key.pem" ubuntu@16.171.10.93 "sudo cat /etc/nginx/sites-enabled/*"
```

### Check Nginx Status
```powershell
ssh -i "c:\Bitflow Software\CNE\cne-2026-key.pem" ubuntu@16.171.10.93 "sudo systemctl status nginx"
```

---

## 🔐 Security Configuration

### EC2 Security Group Rules

**Inbound Rules:**
- **SSH (22):** 103.197.75.84/32 (your IP - update if changed)
- **HTTP (80):** 0.0.0.0/0 (redirects to HTTPS)
- **HTTPS (443):** 0.0.0.0/0 (public access)

### Update Your IP in Security Group

If your IP changes, update the security group:
1. AWS Console → EC2 → Security Groups
2. Find the security group for instance i-01fbe111dacd87669
3. Edit inbound rules → SSH rule
4. Update source IP to your new IP/32

---

## 📂 Server Directory Structure

```
/home/ubuntu/cne-app/          # Application root
├── public/                    # Static files (HTML, CSS, JS)
├── routes/                    # API routes
├── models/                    # Database models
├── middleware/                # Custom middleware
├── uploads/                   # Uploaded files (payment screenshots, QR codes)
├── server.js                  # Main application file
├── package.json              # Dependencies
└── .env                      # Environment variables (DO NOT COMMIT)
```

---

## 🌐 SSL Certificate (Let's Encrypt)

**Certificate Status:** Active (auto-renews)  
**Domain:** www.saicaregroupofinstitutes.com  
**Certificate Path:** `/etc/letsencrypt/live/www.saicaregroupofinstitutes.com/`

SSL certificates auto-renew via certbot. To manually renew:
```bash
ssh -i "cne-2026-key.pem" ubuntu@16.171.10.93 "sudo certbot renew"
```

---

## 🗄️ Database (MongoDB)

**Type:** MongoDB  
**Status:** Connected  
**Connection:** Configured in server's `.env` file

To view environment variables (contains sensitive data):
```bash
ssh -i "cne-2026-key.pem" ubuntu@16.171.10.93 "cat ~/cne-app/.env"
```

---

## 🆘 Troubleshooting

### Website Not Loading

1. **Check if application is running:**
   ```powershell
   ssh -i "cne-2026-key.pem" ubuntu@16.171.10.93 "pm2 status"
   ```

2. **Check recent logs for errors:**
   ```powershell
   ssh -i "cne-2026-key.pem" ubuntu@16.171.10.93 "pm2 logs --lines 100"
   ```

3. **Restart application:**
   ```powershell
   ssh -i "cne-2026-key.pem" ubuntu@16.171.10.93 "pm2 restart all"
   ```

### SSH Connection Timeout

- **Check your current IP:** Run `(Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content`
- **Update Security Group:** Add your new IP to EC2 security group (SSH port 22)
- **Verify instance is running:** Check AWS EC2 console

### Code Changes Not Reflecting

1. **Verify push to GitHub:**
   ```powershell
   git log --oneline -5  # Check recent commits
   ```

2. **Pull changes on server:**
   ```powershell
   ssh -i "cne-2026-key.pem" ubuntu@16.171.10.93 "cd ~/cne-app && git pull origin main"
   ```

3. **Hard refresh browser:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### PM2 Not Running

```bash
# SSH into server
ssh -i "cne-2026-key.pem" ubuntu@16.171.10.93

# Start the application
cd ~/cne-app
pm2 start server.js --name cne-app
pm2 save
```

---

## 📊 Monitoring & Maintenance

### Regular Checks (Recommended Weekly)

1. **Check application logs:**
   ```powershell
   ssh -i "cne-2026-key.pem" ubuntu@16.171.10.93 "pm2 logs --lines 200"
   ```

2. **Check disk space:**
   ```powershell
   ssh -i "cne-2026-key.pem" ubuntu@16.171.10.93 "df -h"
   ```

3. **Update packages (monthly):**
   ```bash
   cd ~/cne-app
   npm outdated  # Check for updates
   npm update    # Update packages
   ```

### Backup Strategy

**What to backup:**
- MongoDB database (contains all registrations)
- Uploaded files in `uploads/` directory
- `.env` file (environment variables)

**How to backup uploads:**
```bash
ssh -i "cne-2026-key.pem" ubuntu@16.171.10.93 "cd ~/cne-app && tar -czf ~/backup-uploads-$(date +%Y%m%d).tar.gz uploads/"
```

---

## 🎯 Quick Reference

### One-Command Deployment
```powershell
# From project directory on your laptop:
git add -A; git commit -m "Update"; git push origin main; ssh -i "c:\Bitflow Software\CNE\cne-2026-key.pem" ubuntu@16.171.10.93 "cd ~/cne-app && git pull origin main && pm2 restart all"
```

### Website URLs
- **Main:** https://www.saicaregroupofinstitutes.com
- **Registration:** https://www.saicaregroupofinstitutes.com/
- **View Registration:** https://www.saicaregroupofinstitutes.com/view-registration
- **Admin Login:** https://www.saicaregroupofinstitutes.com/admin-login
- **Admin Dashboard:** https://www.saicaregroupofinstitutes.com/admin-dashboard
- **Workshop Management:** https://www.saicaregroupofinstitutes.com/admin-workshops

### Important File Locations

**On Your Laptop:**
- Project: `c:\Bitflow Software\CNE\saicaregroup_CNE\`
- SSH Key: `c:\Bitflow Software\CNE\cne-2026-key.pem`

**On Server:**
- Application: `/home/ubuntu/cne-app/`
- Nginx Config: `/etc/nginx/sites-enabled/`
- SSL Certs: `/etc/letsencrypt/live/www.saicaregroupofinstitutes.com/`
- PM2 Logs: `/home/ubuntu/.pm2/logs/`

---

## ⚠️ Important Notes

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Keep `cne-2026-key.pem` secure** - This is your server access key
3. **Always test locally first** - Before deploying major changes
4. **Backup before major updates** - Database and uploaded files
5. **Update IP in security group** - If your internet IP changes
6. **Monitor PM2 logs** - For errors and issues

---

## 📞 Support Information

**Repository:** https://github.com/bitflownova-coder/saicaregroup_CNE  
**EC2 Instance:** i-01fbe111dacd87669 (eu-north-1)  
**Domain:** www.saicaregroupofinstitutes.com  

---

**Last Updated:** January 8, 2026  
**Deployment Method:** Git + SSH + PM2
